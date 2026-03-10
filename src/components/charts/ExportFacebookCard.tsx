import { useRef, useState, useCallback } from 'react';
import html2canvas from 'html2canvas';
import type { Encuesta, ResultadoOpcion } from '../../types';
import { findCandidateData, getInitials } from '../../utils/helpers';
import { findPartyLogo } from '../../config/party-logos';
import { formatNumber } from '../../utils/format';
import { REGIONES_PERU, TIPOS_ELECCION } from '../../config/constants';
import type { RegionCode, TipoEleccionCode } from '../../types';

interface ExportFacebookCardProps {
  resultados: ResultadoOpcion[];
  encuesta: Encuesta | null;
  allEncuestas: Encuesta[];
}

function findLogoFromPresidente(partyName: string, allEncuestas: Encuesta[]): string {
  if (!partyName || !allEncuestas.length) return '';
  const normalize = (s: string) =>
    s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const needle = normalize(partyName);
  const presEncuestas = allEncuestas.filter(e => e.tipo_eleccion === 'PRESIDENTE');
  for (const enc of presEncuestas) {
    for (const opt of enc.opciones) {
      if (typeof opt === 'object' && opt.logo_partido_url) {
        if (normalize(opt.partido) === needle) return opt.logo_partido_url;
      }
    }
  }
  for (const enc of presEncuestas) {
    for (const opt of enc.opciones) {
      if (typeof opt === 'object' && opt.logo_partido_url) {
        const optParty = normalize(opt.partido);
        if (needle.includes(optParty) || optParty.includes(needle)) return opt.logo_partido_url;
      }
    }
  }
  return '';
}

function formatCandName(name: string): string {
  const parts = name.split(' ');
  if (parts.length <= 2) return name;
  const mid = Math.ceil(parts.length / 2);
  return parts.slice(0, mid).join(' ') + '\n' + parts.slice(mid).join(' ');
}

/**
 * Convert an image URL to base64 via weserv.nl image proxy (reliable CORS support).
 */
async function toBase64(url: string): Promise<string> {
  if (!url) return '';
  if (url.startsWith('data:')) return url;

  const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(url)}&w=400&output=jpg&q=85`;

  try {
    const resp = await fetch(proxyUrl);
    if (!resp.ok) throw new Error('fetch failed');
    const blob = await resp.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('read failed'));
      reader.readAsDataURL(blob);
    });
  } catch {
    return '';
  }
}

// Cache to avoid re-fetching
const b64Cache = new Map<string, string>();

async function getBase64Cached(url: string): Promise<string> {
  if (!url) return '';
  if (b64Cache.has(url)) return b64Cache.get(url)!;
  const b64 = await toBase64(url);
  if (b64) b64Cache.set(url, b64);
  return b64;
}

interface ImageData {
  fotoB64: string;
  logoB64: string;
}

export default function ExportFacebookCard({ resultados, encuesta, allEncuestas }: ExportFacebookCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [imageCache, setImageCache] = useState<Record<string, ImageData>>({});
  const [preloading, setPreloading] = useState(false);

  const top10 = resultados.slice(0, 10);
  const maxPct = top10.length > 0 ? parseFloat(top10[0].porcentaje) : 1;

  const regionName = encuesta ? (REGIONES_PERU[encuesta.region as RegionCode]?.nombre || encuesta.region) : '';
  const tipoName = encuesta ? (TIPOS_ELECCION[encuesta.tipo_eleccion as TipoEleccionCode]?.nombre || encuesta.tipo_eleccion) : '';

  const questionText = encuesta
    ? `¿Por quién votaría ud. para ${tipoName}${regionName && encuesta.region !== 'NACIONAL' ? ` por ${regionName}` : ''} 2026?`
    : 'Resultados';

  const regionTag = encuesta
    ? `📍 ${regionName.toUpperCase()} · SONDEO EN TIEMPO REAL`
    : 'SONDEO EN TIEMPO REAL';

  const totalVotos = resultados.reduce((s, r) => s + r.cantidad, 0);
  const otrosVotos = resultados.slice(10).reduce((s, r) => s + r.cantidad, 0);
  const otrosPct = totalVotos > 0 ? ((otrosVotos / totalVotos) * 100).toFixed(1) : '0';

  // Load images on demand (only when user clicks export)
  const loadImages = useCallback(async (): Promise<Record<string, ImageData>> => {
    if (!encuesta || top10.length === 0) return {};

    // Return cached if already loaded
    if (Object.keys(imageCache).length >= top10.length) return imageCache;

    const cache: Record<string, ImageData> = {};
    const promises = top10.map(async (r) => {
      const candidate = findCandidateData(encuesta, r.opcion);
      if (!candidate) {
        cache[r.opcion] = { fotoB64: '', logoB64: '' };
        return;
      }
      const party = findPartyLogo(candidate.partido);
      const partyName = candidate.partido || '';
      // For export: prefer dictionary (Wikipedia URLs that work via proxy) over JNE URLs
      const logoUrl = party?.logo || findLogoFromPresidente(partyName, allEncuestas) || candidate.logo_partido_url || '';

      const [fotoB64, logoB64] = await Promise.all([
        getBase64Cached(candidate.foto_url),
        getBase64Cached(logoUrl),
      ]);
      cache[r.opcion] = { fotoB64, logoB64 };
    });

    await Promise.all(promises);
    setImageCache(cache);
    return cache;
  }, [encuesta, allEncuestas, imageCache, top10]);

  const doExport = useCallback(async (mode: 'image' | 'facebook') => {
    if (!cardRef.current) return;
    setPreloading(true);
    setExporting(true);

    // Load images first (on demand)
    const cache = await loadImages();
    setImageCache(cache);
    setPreloading(false);

    // Small delay so React renders with base64 images
    await new Promise(r => setTimeout(r, 300));

    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: mode === 'facebook' ? 3 : 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#0d1a40',
        logging: false,
      });

      let finalCanvas = canvas;
      if (mode === 'facebook') {
        const fbW = 1200, fbH = 630;
        finalCanvas = document.createElement('canvas');
        finalCanvas.width = fbW;
        finalCanvas.height = fbH;
        const ctx = finalCanvas.getContext('2d')!;
        ctx.fillStyle = '#0d1a40';
        ctx.fillRect(0, 0, fbW, fbH);
        const ratio = Math.min(fbW / canvas.width, fbH / canvas.height) * 0.95;
        const drawW = canvas.width * ratio;
        const drawH = canvas.height * ratio;
        ctx.drawImage(canvas, (fbW - drawW) / 2, (fbH - drawH) / 2, drawW, drawH);
      }

      const link = document.createElement('a');
      const slug = encuesta
        ? `${encuesta.tipo_eleccion}_${encuesta.region}`.toLowerCase()
        : 'resultados';
      link.download = mode === 'facebook'
        ? `encuestape-facebook-${slug}.png`
        : `encuestape-${slug}.png`;
      link.href = finalCanvas.toDataURL('image/png');
      link.click();
    } catch {
      alert('Error al generar imagen. Intente nuevamente.');
    }
    setExporting(false);
  }, [encuesta]);

  const row1 = top10.slice(0, 4);
  const row2 = top10.slice(4, 8);
  const row3 = top10.slice(8, 10);

  const getRank = (i: number) => i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';

  const renderCard = (r: ResultadoOpcion, globalIdx: number) => {
    const candidate = encuesta ? findCandidateData(encuesta, r.opcion) : null;
    const party = candidate ? findPartyLogo(candidate.partido) : null;
    const partyName = candidate?.partido || '';
    const partyColor = party?.color || '#4a6080';
    const pct = parseFloat(r.porcentaje);
    const barWidth = maxPct > 0 ? (pct / maxPct) * 100 : 0;
    const rank = getRank(globalIdx);

    // Use cached base64 images
    const cached = imageCache[r.opcion];
    const fotoSrc = cached?.fotoB64 || '';
    const logoSrc = cached?.logoB64 || '';

    const borderColor = rank === 'gold' ? '#D4AF37' : rank === 'silver' ? '#7a9bbf' : rank === 'bronze' ? '#a0896a' : 'transparent';
    const footerBg = rank === 'gold' ? 'linear-gradient(135deg,#b8951e,#D4AF37)' :
      rank === 'silver' ? '#2a4a7a' : rank === 'bronze' ? '#5a3c28' : '#0b1f4a';
    const boxShadow = rank === 'gold' ? '0 4px 20px rgba(212,175,55,0.45)' : '0 3px 14px rgba(0,0,0,0.28)';

    return (
      <div key={r.opcion} style={{
        background: '#f0f2f8', borderRadius: 11, overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        border: `2px solid ${borderColor}`, boxShadow,
      }}>
        {/* Name */}
        <div style={{
          textAlign: 'center', padding: '5px 5px 4px',
          minHeight: 36, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          textTransform: 'uppercase',
        }}>
          <div style={{ fontSize: 10, fontWeight: 900, color: '#D4AF37', lineHeight: 1.2 }}>#{globalIdx + 1}</div>
          <div style={{
            fontSize: 9.5, fontWeight: 800, color: '#0b1f4a',
            lineHeight: 1.25, whiteSpace: 'pre-line', marginTop: 1,
          }}>
            {formatCandName(r.opcion)}
          </div>
        </div>
        {/* Photo */}
        <div style={{
          width: '100%', aspectRatio: '1/1', overflow: 'hidden',
          background: '#c8d0e0', display: 'flex', alignItems: 'center',
          justifyContent: 'center', position: 'relative',
        }}>
          {fotoSrc ? (
            <img src={fotoSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} />
          ) : (
            <span style={{
              fontSize: 36, fontWeight: 900, color: '#8a9ab5', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              width: '100%', height: '100%', background: '#c8d0e0',
            }}>
              {getInitials(r.opcion)}
            </span>
          )}
          {candidate?.numero != null && (
            <span style={{
              position: 'absolute', top: 5, left: 5, fontSize: 9, fontWeight: 900,
              color: '#fff', background: 'rgba(0,0,0,0.65)', borderRadius: 4,
              padding: '2px 6px', letterSpacing: 0.3,
            }}>N.°{candidate.numero}</span>
          )}
          {candidate && (
            <div style={{
              position: 'absolute', bottom: 5, right: 5, width: 40, height: 40,
              background: '#fff', borderRadius: 7, border: '1.5px solid rgba(0,0,0,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
            }}>
              {logoSrc ? (
                <img src={logoSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <span style={{
                  fontSize: 9, fontWeight: 900, textAlign: 'center',
                  lineHeight: 1.1, padding: 2, color: partyColor,
                }}>
                  {party?.abbr || partyName.substring(0, 4).toUpperCase()}
                </span>
              )}
            </div>
          )}
        </div>
        {/* Mini bar */}
        <div style={{ height: 4, width: '100%', background: 'rgba(255,255,255,0.25)' }}>
          <div style={{ height: '100%', width: `${barWidth}%`, background: partyColor }} />
        </div>
        {/* Party name */}
        <div style={{
          fontSize: 8, fontWeight: 700, color: '#5a6a8a', textAlign: 'center',
          padding: '4px 5px', lineHeight: 1.2, minHeight: 20,
          background: 'rgba(0,0,0,0.03)', borderBottom: '1px solid rgba(0,0,0,0.06)',
        }}>
          {partyName || '—'}
        </div>
        {/* Footer */}
        <div style={{
          width: '100%', padding: '7px 6px 8px', textAlign: 'center',
          background: footerBg,
        }}>
          <div style={{
            fontSize: 20, fontWeight: 900, lineHeight: 1, letterSpacing: 0.5, color: '#fff',
          }}>{r.porcentaje}%</div>
          <div style={{
            fontSize: 9, fontWeight: 700, marginTop: 2,
            color: rank === 'gold' ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.6)',
          }}>{formatNumber(r.cantidad)} votos</div>
        </div>
      </div>
    );
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 10,
    marginBottom: 10,
  };

  const btnDisabled = exporting || preloading;

  return (
    <>
      {/* Only buttons visible */}
      <div style={{
        display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' as const,
        marginTop: 16, alignItems: 'center',
      }}>
        <button
          onClick={() => doExport('image')}
          disabled={btnDisabled}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'linear-gradient(135deg, #D4AF37, #b8951e)',
            color: '#0b1f4a', border: 'none', borderRadius: 12,
            padding: '12px 24px', fontFamily: 'Montserrat, sans-serif',
            fontSize: 13, fontWeight: 800, cursor: btnDisabled ? 'wait' : 'pointer',
            boxShadow: '0 4px 16px rgba(212,175,55,0.4)',
            opacity: btnDisabled ? 0.6 : 1,
          }}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
          </svg>
          {exporting ? 'GENERANDO...' : preloading ? 'CARGANDO FOTOS...' : 'DESCARGAR IMAGEN'}
        </button>
      </div>

      {/* Hidden card rendered offscreen for html2canvas */}
      <div style={{
        position: 'fixed', left: -9999, top: 0,
        pointerEvents: 'none', zIndex: -1,
      }}>
        <div
          ref={cardRef}
          style={{
            width: 680,
            background: 'linear-gradient(160deg, #1a2a5e 0%, #0d1a40 40%, #1a2a5e 100%)',
            borderRadius: 20, padding: '0 0 22px 0', overflow: 'hidden',
            boxShadow: '0 12px 50px rgba(0,0,0,0.45)', position: 'relative',
            fontFamily: "'Montserrat', sans-serif",
          }}
        >
          {/* TOP BAR */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 22px 10px',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 9,
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 8, padding: '7px 16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 24 }}>
                {[12, 17, 24, 18].map((h, i) => (
                  <span key={i} style={{ width: 4.5, height: h, background: '#D4AF37', borderRadius: 1 }} />
                ))}
              </div>
              <span style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>
                Encuesta<em style={{ color: '#D4AF37', fontStyle: 'normal' }}>Pe</em>
              </span>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: 'rgba(220,38,38,0.18)', border: '1.5px solid rgba(220,38,38,0.6)',
              borderRadius: 30, padding: '6px 16px',
              fontSize: 12, fontWeight: 800, color: '#ff5555', letterSpacing: 2,
            }}>
              <span style={{ width: 8, height: 8, background: '#ff4444', borderRadius: '50%' }} />
              EN VIVO
            </div>
          </div>

          {/* QUESTION */}
          <div style={{ padding: '4px 22px 14px', textAlign: 'center' }}>
            <div style={{
              fontSize: 19, fontWeight: 800, color: '#fff', lineHeight: 1.3,
              textShadow: '0 2px 8px rgba(0,0,0,0.4)',
            }}
              dangerouslySetInnerHTML={{
                __html: questionText.replace(
                  /(Diputado.*?2026|Senador.*?2026|Presidente.*?2026|Municipal.*?2026|Parlamento.*?2026)/i,
                  '<em style="font-style:italic;color:#f0d060;">$1</em>'
                )
              }}
            />
            <div style={{
              display: 'inline-block', background: 'rgba(255,255,255,0.1)',
              border: '1.5px solid rgba(255,255,255,0.2)', borderRadius: 6,
              padding: '5px 22px', fontSize: 12, fontWeight: 700,
              color: 'rgba(255,255,255,0.8)', letterSpacing: 2, marginTop: 10,
            }}>
              {regionTag}
            </div>
          </div>

          {/* GRID */}
          <div style={{ padding: '0 18px' }}>
            <div style={gridStyle}>
              {row1.map((r, i) => renderCard(r, i))}
            </div>
            {row2.length > 0 && (
              <div style={gridStyle}>
                {row2.map((r, i) => renderCard(r, i + 4))}
              </div>
            )}
            <div style={gridStyle}>
              {row3.map((r, i) => renderCard(r, i + 8))}

              {/* Voto en blanco */}
              <div style={{
                background: '#f0f2f8', borderRadius: 11, overflow: 'hidden',
                display: 'flex', flexDirection: 'column',
                border: '2px solid transparent', boxShadow: '0 3px 14px rgba(0,0,0,0.28)',
              }}>
                <div style={{
                  textAlign: 'center', padding: '5px 5px 4px',
                  minHeight: 36, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  textTransform: 'uppercase',
                }}>
                  <div style={{ fontSize: 10, fontWeight: 900, color: '#aaa', lineHeight: 1.2 }}>—</div>
                  <div style={{ fontSize: 9.5, fontWeight: 800, color: '#0b1f4a', lineHeight: 1.25, marginTop: 1 }}>Voto en Blanco</div>
                </div>
                <div style={{
                  width: '100%', aspectRatio: '1/1', overflow: 'hidden',
                  background: '#dde3ef', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: 48 }}>🗳️</span>
                </div>
                <div style={{ height: 4, width: '100%', background: 'rgba(255,255,255,0.25)' }}>
                  <div style={{ height: '100%', width: '10%', background: '#aaa' }} />
                </div>
                <div style={{
                  fontSize: 8, fontWeight: 700, color: '#888', textAlign: 'center',
                  padding: '4px 5px', lineHeight: 1.2, minHeight: 20,
                  background: 'rgba(0,0,0,0.03)', borderBottom: '1px solid rgba(0,0,0,0.06)',
                }}>—</div>
                <div style={{
                  width: '100%', padding: '7px 6px 8px', textAlign: 'center', background: '#555',
                }}>
                  <div style={{ fontSize: 20, fontWeight: 900, lineHeight: 1, color: '#fff' }}>—</div>
                  <div style={{ fontSize: 9, fontWeight: 700, marginTop: 2, color: 'rgba(255,255,255,0.6)' }}>voto en blanco</div>
                </div>
              </div>

              {/* Más candidatos */}
              <div style={{
                background: '#f0f2f8', borderRadius: 11, overflow: 'hidden',
                display: 'flex', flexDirection: 'column',
                border: '2px solid transparent', boxShadow: '0 3px 14px rgba(0,0,0,0.28)',
              }}>
                <div style={{
                  textAlign: 'center', padding: '5px 5px 4px',
                  minHeight: 36, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  textTransform: 'uppercase',
                }}>
                  <div style={{ fontSize: 10, fontWeight: 900, color: '#aaa', lineHeight: 1.2 }}>+</div>
                  <div style={{ fontSize: 9.5, fontWeight: 800, color: '#0b1f4a', lineHeight: 1.25, marginTop: 1 }}>Más candidatos</div>
                </div>
                <div style={{
                  width: '100%', aspectRatio: '1/1', overflow: 'hidden',
                  background: '#dde3ef', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: 48 }}>👥</span>
                </div>
                <div style={{ height: 4, width: '100%', background: 'rgba(255,255,255,0.25)' }}>
                  <div style={{ height: '100%', width: '20%', background: '#4a6080' }} />
                </div>
                <div style={{
                  fontSize: 8, fontWeight: 700, color: '#888', textAlign: 'center',
                  padding: '4px 5px', lineHeight: 1.2, minHeight: 20,
                  background: 'rgba(0,0,0,0.03)', borderBottom: '1px solid rgba(0,0,0,0.06)',
                }}>Ver encuestape.com</div>
                <div style={{
                  width: '100%', padding: '7px 6px 8px', textAlign: 'center', background: '#2a3a5a',
                }}>
                  <div style={{ fontSize: 20, fontWeight: 900, lineHeight: 1, color: '#fff' }}>
                    {resultados.length > 10 ? `${otrosPct}%` : '+ más'}
                  </div>
                  <div style={{ fontSize: 9, fontWeight: 700, marginTop: 2, color: 'rgba(255,255,255,0.6)' }}>
                    {resultados.length > 10 ? `${formatNumber(otrosVotos)} votos` : 'encuestape.com'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* NOTA */}
          <div style={{
            margin: '14px 18px 0', background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
            padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(220,38,38,0.2)', border: '1px solid rgba(220,38,38,0.5)',
              borderRadius: 14, padding: '4px 12px', flexShrink: 0,
            }}>
              <span style={{ width: 6, height: 6, background: '#ff4444', borderRadius: '50%' }} />
              <span style={{ fontSize: 10, fontWeight: 800, color: '#ff5555', letterSpacing: 1.5 }}>EN VIVO</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 4, width: '100%' }}>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontStyle: 'normal', fontWeight: 700, fontSize: 11 }}>
                📅 Inicio: <span style={{ color: '#f0d060' }}>{encuesta?.fecha_inicio ? new Date(encuesta.fecha_inicio).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}</span>
                {' | '}
                Última revisión: <span style={{ color: '#f0d060' }}>{new Date().toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', lineHeight: 1.4, fontStyle: 'italic' }}>
                Encuesta de opinión ciudadana · Resultados actualizados en tiempo real
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <div style={{
            margin: '10px 18px 0', background: '#D4AF37', borderRadius: 10,
            padding: '10px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#0b1f4a', letterSpacing: 0.5 }}>
              🗳 www.encuestape.com
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(11,31,74,0.65)', textAlign: 'right' as const, lineHeight: 1.5 }}>
              Vota y consulta resultados<br />en tiempo real · {regionName} 2026
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
