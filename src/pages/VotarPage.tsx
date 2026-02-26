import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { Encuesta, EncuestaOption, ResultadosData } from '../types';
import { useDemoData } from '../context/DemoDataContext';
import { CONFIG } from '../config/constants';
import { hashSHA256 } from '../utils/hash';
import { validateDNI } from '../utils/validators';
import { formatNumber } from '../utils/format';
import { getOptionName, findCandidateData, getInitials, getChartColors } from '../utils/helpers';
import { debounce } from '../utils/helpers';

export default function VotarPage() {
  const { id } = useParams<{ id: string }>();
  const { api } = useDemoData();

  const [encuesta, setEncuesta] = useState<Encuesta | null>(null);
  const [step, setStep] = useState(1);
  const [dniHash, setDniHash] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [dniValue, setDniValue] = useState('');
  const [dniStatus, setDniStatus] = useState<'idle' | 'valid' | 'error' | 'already'>('idle');
  const [dniFeedback, setDniFeedback] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [resultados, setResultados] = useState<ResultadosData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    const loadEncuesta = async () => {
      const data = await api.getEncuestas();
      const enc = data.encuestas.find(e => e.id === (id || 'E01'));
      if (!enc) { setNotFound(true); return; }
      if (enc.estado !== 'activa') { setClosed(true); setEncuesta(enc); return; }
      setEncuesta(enc);
    };
    loadEncuesta();
  }, [id, api]);

  const handleDniInput = (val: string) => {
    const clean = val.replace(/\D/g, '');
    setDniValue(clean);
    if (clean.length === CONFIG.DNI_LENGTH) {
      setDniStatus('valid');
      setDniFeedback('8 dígitos detectados');
    } else if (clean.length > 0) {
      setDniStatus('idle');
      setDniFeedback(`${clean.length}/8 dígitos`);
    } else {
      setDniStatus('idle');
      setDniFeedback('');
    }
  };

  const verifyDNI = async () => {
    if (!validateDNI(dniValue) || !encuesta) return;
    setVerifying(true);
    try {
      const hash = await hashSHA256(dniValue);
      setDniHash(hash);
      const result = await api.validarDNI(encuesta.id, hash);
      if (result.permitido) {
        setStep(2);
      } else {
        setDniStatus('already');
      }
    } catch {
      setDniStatus('error');
      setDniFeedback('Error al verificar. Intenta de nuevo.');
    } finally {
      setVerifying(false);
    }
  };

  const confirmVote = async () => {
    if (!encuesta || !selectedOption || !dniHash) return;
    setConfirming(true);
    try {
      const result = await api.registrarVoto({
        encuesta_id: encuesta.id,
        dni_hash: dniHash,
        opcion: selectedOption,
      });
      if (result.exito) {
        const res = await api.getResultados(encuesta.id);
        setResultados(res);
        setStep(4);
      } else {
        alert(result.mensaje || 'Error al registrar el voto.');
      }
    } catch {
      alert('Error de conexión. Intenta de nuevo.');
    } finally {
      setConfirming(false);
    }
  };

  const goToStep = (s: number) => {
    setStep(s);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Not found or closed states
  if (notFound) {
    return (
      <div className="votar-page">
        <VotarHeader />
        <div className="votar-content container">
          <div className="votar-card" style={{ textAlign: 'center', padding: 48 }}>
            <h2 className="votar-card-title">Encuesta no encontrada</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>La encuesta solicitada no existe o no está disponible.</p>
            <Link to="/" className="btn btn-primary">Volver al inicio</Link>
          </div>
        </div>
      </div>
    );
  }

  if (closed && encuesta) {
    return (
      <div className="votar-page">
        <VotarHeader />
        <div className="votar-content container">
          <div className="votar-card" style={{ textAlign: 'center', padding: 48 }}>
            <h2 className="votar-card-title">Encuesta cerrada</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Esta encuesta ya no está aceptando votos.</p>
            <Link to={`/resultados/${encuesta.id}`} className="btn btn-primary">Ver resultados</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="votar-page">
      <VotarHeader />

      {/* Progress */}
      <div className="votar-progress">
        <div className="container">
          <div className="progress-steps">
            <div className={`progress-step${step >= 1 ? ' active' : ''}${step > 1 ? ' completed' : ''}`}>
              <span className="step-num">1</span>
              <span>Verificar DNI</span>
            </div>
            <div className={`progress-connector${step >= 2 ? ' active' : ''}`}></div>
            <div className={`progress-step${step >= 2 ? ' active' : ''}${step > 2 ? ' completed' : ''}`}>
              <span className="step-num">2</span>
              <span>Emitir voto</span>
            </div>
            <div className={`progress-connector${step >= 3 ? ' active' : ''}`}></div>
            <div className={`progress-step${step >= 3 ? ' active' : ''}${step > 3 ? ' completed' : ''}`}>
              <span className="step-num">3</span>
              <span>Confirmar</span>
            </div>
          </div>
        </div>
      </div>

      <div className="votar-content container">
        {/* Step 1: DNI */}
        {step === 1 && (
          <div className="votar-card">
            {dniStatus === 'already' ? (
              <div className="already-voted">
                <div className="already-voted-icon">⚠️</div>
                <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 'var(--space-sm)' }}>Ya participaste</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xl)' }}>Este DNI ya registró su voto en esta encuesta. Solo se permite una participación por documento.</p>
                <div className="flex-center gap-sm" style={{ flexWrap: 'wrap' }}>
                  <Link to="/resultados" className="btn btn-primary btn-sm">Ver resultados</Link>
                  <Link to="/" className="btn btn-outline btn-sm">Volver al inicio</Link>
                </div>
              </div>
            ) : (
              <>
                <h2 className="votar-card-title">Verifica tu identidad</h2>
                <p className="votar-card-desc">Ingresa tu DNI para participar en esta encuesta. Tu documento será verificado y encriptado. No almacenamos tu DNI en texto plano.</p>
                <div className="form-group">
                  <label className="form-label">Número de DNI</label>
                  <div className="dni-input-wrapper">
                    <span className="icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="12" cy="10" r="3"/><path d="M7 21v-2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2"/></svg>
                    </span>
                    <input
                      type="text"
                      className={`dni-input${dniStatus === 'valid' ? ' valid' : ''}${dniStatus === 'error' ? ' error' : ''}`}
                      maxLength={8}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="Ingresa tu DNI de 8 dígitos"
                      autoComplete="off"
                      value={dniValue}
                      onChange={e => handleDniInput(e.target.value)}
                    />
                  </div>
                  {dniFeedback && (
                    <div className={`dni-feedback${dniStatus === 'valid' ? ' valid' : ''}${dniStatus === 'error' ? ' error' : ''}`}>
                      {dniStatus === 'valid' && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6 9 17l-5-5"/></svg>
                      )}
                      {' '}{dniFeedback}
                    </div>
                  )}
                </div>
                <div className="votar-buttons" style={{ justifyContent: 'flex-end' }}>
                  <button
                    className="btn btn-primary"
                    disabled={dniStatus !== 'valid' || verifying}
                    onClick={verifyDNI}
                  >
                    {verifying ? 'Verificando...' : 'Verificar DNI →'}
                  </button>
                </div>
                <div className="security-note">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  Tu DNI se encripta antes de enviarse. Privacidad garantizada.
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 2: Vote */}
        {step === 2 && encuesta && (
          <div className="votar-card">
            <h2 className="votar-card-title">{encuesta.titulo}</h2>
            <p className="votar-card-desc">{encuesta.descripcion}</p>

            {encuesta.opciones.length > 8 && (
              <div className="vote-search-wrap">
                <input
                  type="text"
                  className="vote-search"
                  placeholder="Buscar candidato o partido..."
                  autoComplete="off"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            )}

            <div className={`vote-options${encuesta.opciones.length > 8 ? ' vote-options-scroll' : ''}`}>
              {encuesta.opciones.map((opcion, i) => {
                const isObj = typeof opcion === 'object';
                const name = getOptionName(opcion);
                const matchesSearch = !searchQuery || name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (isObj && (opcion as any).partido?.toLowerCase().includes(searchQuery.toLowerCase()));

                if (!matchesSearch) return null;

                return (
                  <VoteOption
                    key={i}
                    index={i}
                    opcion={opcion}
                    selected={selectedOption === name}
                    onSelect={() => {
                      setSelectedOption(name);
                    }}
                  />
                );
              })}
            </div>

            <div className="votar-buttons">
              <button className="btn btn-outline" onClick={() => goToStep(1)} style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-subtle)' }}>← Anterior</button>
              <button className="btn btn-primary" disabled={!selectedOption} onClick={() => goToStep(3)}>Siguiente →</button>
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && encuesta && (
          <div className="votar-card">
            <h2 className="votar-card-title">Confirma tu voto</h2>
            <div className="confirm-box">
              <div className="confirm-row">
                <span className="confirm-label">Encuesta:</span>
                <span className="confirm-value">{encuesta.titulo}</span>
              </div>
              <div className="confirm-row">
                <span className="confirm-label">Tu voto:</span>
                <span className="confirm-value" style={{ color: 'var(--color-secondary)' }}>{selectedOption}</span>
              </div>
              <div className="confirm-warning">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                <span>Esta acción no se puede deshacer. Una vez confirmado, no podrás cambiar tu voto.</span>
              </div>
            </div>
            <div className="votar-buttons">
              <button className="btn btn-outline" onClick={() => goToStep(2)} style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-subtle)' }}>← Cambiar voto</button>
              <button className="btn btn-primary" onClick={confirmVote} disabled={confirming}>
                {confirming ? 'Registrando...' : '✓ Confirmar voto'}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Thank you */}
        {step === 4 && encuesta && resultados && (
          <div className="votar-card">
            <div className="thankyou-section">
              <div className="thankyou-icon">✓</div>
              <h2 className="votar-card-title" style={{ textAlign: 'center' }}>¡Gracias por participar!</h2>
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>Tu voto ha sido registrado exitosamente.</p>

              <div className="thankyou-results">
                <h3>Resultados actuales</h3>
                <ThankYouBars resultados={resultados} encuesta={encuesta} />
                <p style={{ marginTop: 'var(--space-md)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Total: <span className="mono">{formatNumber(resultados.total_votos)}</span> participantes
                </p>
              </div>

              <ShareSection encuesta={encuesta} />

              <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'center', marginTop: 'var(--space-xl)' }}>
                <Link to={`/resultados/${encuesta.id}`} className="btn btn-primary btn-sm">Ver resultados completos</Link>
                <Link to="/" className="btn btn-outline btn-sm" style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-subtle)' }}>Volver al inicio</Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function VotarHeader() {
  return (
    <header className="votar-header">
      <div className="container">
        <Link to="/" className="navbar-logo">
          <img src="/assets/icon-white.svg" alt="" className="navbar-icon" />
          <span style={{ color: 'white', fontFamily: 'var(--font-display)', fontSize: '1.2rem' }}>
            Encuesta<span style={{ color: 'var(--color-accent)' }}>Pe</span>
          </span>
        </Link>
        <Link to="/" className="votar-back">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
          Volver al inicio
        </Link>
      </div>
    </header>
  );
}

function VoteOption({ index, opcion, selected, onSelect }: {
  index: number;
  opcion: EncuestaOption;
  selected: boolean;
  onSelect: () => void;
}) {
  const isObj = typeof opcion === 'object';
  const name = getOptionName(opcion);
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className={`vote-option${isObj ? ' candidate-option' : ''}${selected ? ' selected' : ''}`}
      onClick={onSelect}
    >
      <input type="radio" name="voto" id={`opt${index}`} value={name} checked={selected} readOnly />
      <span className="radio-custom"></span>
      {isObj && (
        <>
          {(opcion as any).foto_url && !imgError ? (
            <img
              src={(opcion as any).foto_url}
              alt=""
              className="candidate-photo"
              onError={() => setImgError(true)}
            />
          ) : (
            <span className="candidate-initials">{getInitials(name)}</span>
          )}
          <div className="candidate-info">
            <span className="candidate-name">
              {(opcion as any).numero != null && (
                <span className="candidate-numero">N.° {(opcion as any).numero}</span>
              )}
              {name}
            </span>
            <span className="candidate-party">
              {(opcion as any).logo_partido_url && (
                <img src={(opcion as any).logo_partido_url} alt="" className="candidate-party-logo" onError={e => (e.currentTarget.style.display = 'none')} />
              )}
              {(opcion as any).partido || ''}
              {(opcion as any).url_hoja_vida && (
                <a href={(opcion as any).url_hoja_vida} target="_blank" rel="noopener noreferrer" className="candidate-hv-link" onClick={e => e.stopPropagation()} title="Ver hoja de vida">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                  Hoja de vida
                </a>
              )}
            </span>
          </div>
        </>
      )}
      {!isObj && (
        <label className="vote-option-text" htmlFor={`opt${index}`}>{name}</label>
      )}
    </div>
  );
}

function ThankYouBars({ resultados, encuesta }: { resultados: ResultadosData; encuesta: Encuesta }) {
  const colors = getChartColors(resultados.resultados.length);

  return (
    <div>
      {resultados.resultados.map((r, i) => {
        const candidate = findCandidateData(encuesta, r.opcion);
        return (
          <div key={r.opcion} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '0.85rem' }}>
              <span>
                {candidate && <CandidateAvatarSmall fotoUrl={candidate.foto_url} name={r.opcion} />}
                {r.opcion}
              </span>
              <span className="mono" style={{ fontWeight: 700 }}>{r.porcentaje}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-bar-fill" style={{ width: `${r.porcentaje}%`, background: colors[i] }}></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ShareSection({ encuesta }: { encuesta: Encuesta }) {
  const [copied, setCopied] = useState(false);
  const shareUrl = `https://www.encuestape.com/votar/${encuesta.id}`;
  const shareText = `Participé en la encuesta "${encuesta.titulo}" en EncuestaPe. ¡Tu opinión también cuenta!`;

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="share-section">
      <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
        Comparte para que más personas participen
      </p>
      <div className="share-buttons">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`}
          target="_blank" rel="noopener noreferrer"
          className="share-btn whatsapp"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          WhatsApp
        </a>
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`}
          target="_blank" rel="noopener noreferrer"
          className="share-btn facebook"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          Facebook
        </a>
        <a
          href={`https://www.tiktok.com/share?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}`}
          target="_blank" rel="noopener noreferrer"
          className="share-btn tiktok"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
          TikTok
        </a>
        <a
          href={`sms:?body=${encodeURIComponent(`${shareText} ${shareUrl}`)}`}
          className="share-btn sms"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          SMS
        </a>
        <button onClick={copyLink} className="share-btn copy">
          {copied ? (
            <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg> Copiado</>
          ) : (
            <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg> Copiar enlace</>
          )}
        </button>
      </div>
    </div>
  );
}

function CandidateAvatarSmall({ fotoUrl, name }: { fotoUrl: string; name: string }) {
  const [err, setErr] = useState(false);
  if (!fotoUrl || err) {
    return (
      <span style={{ display: 'inline-flex', width: 24, height: 24, borderRadius: '50%', background: 'var(--color-primary)', color: 'var(--color-accent)', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 700, verticalAlign: 'middle', marginRight: 6 }}>
        {getInitials(name)}
      </span>
    );
  }
  return (
    <img src={fotoUrl} alt="" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover', verticalAlign: 'middle', marginRight: 6 }} onError={() => setErr(true)} />
  );
}
