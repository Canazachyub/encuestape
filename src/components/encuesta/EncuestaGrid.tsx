import { useRef, useState } from 'react';
import type { Encuesta, RegionCode, TipoEleccionCode } from '../../types';
import { REGIONES_PERU, TIPOS_ELECCION } from '../../config/constants';
import EncuestaCard from './EncuestaCard';

interface EncuestaGridProps {
  encuestas: Encuesta[];
  regionName?: string | null;
}

export default function EncuestaGrid({ encuestas, regionName }: EncuestaGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [tipoFilter, setTipoFilter] = useState<TipoEleccionCode | 'TODOS'>('TODOS');
  const [regionFilter, setRegionFilter] = useState<RegionCode | 'TODOS'>('TODOS');

  // Get unique tipos from encuestas (in display order)
  const tipoOrder: TipoEleccionCode[] = ['PRESIDENTE', 'SENADORES', 'DIPUTADOS', 'PARLAMENTO_ANDINO', 'MUNICIPAL', 'GENERAL'];
  const tipoSet = new Set(encuestas.map(e => e.tipo_eleccion));
  const availableTipos = tipoOrder.filter(t => tipoSet.has(t));

  // Filter by tipo first
  const filteredByTipo = tipoFilter === 'TODOS'
    ? encuestas
    : encuestas.filter(e => e.tipo_eleccion === tipoFilter);

  // Get available regions from tipo-filtered encuestas
  const regionSet = new Set(filteredByTipo.map(e => e.region));
  const availableRegions = (Object.entries(REGIONES_PERU) as [RegionCode, { nombre: string }][])
    .filter(([code]) => regionSet.has(code));

  // Reset region filter if no longer available
  if (regionFilter !== 'TODOS' && !regionSet.has(regionFilter)) {
    setRegionFilter('TODOS');
  }

  // Final filter
  const filtered = regionFilter === 'TODOS'
    ? filteredByTipo
    : filteredByTipo.filter(e => e.region === regionFilter);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const cardWidth = 360;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -cardWidth : cardWidth,
      behavior: 'smooth',
    });
  };

  if (encuestas.length === 0) {
    return (
      <div className="encuestas-grid">
        <div className="mapa-empty" style={{ gridColumn: '1 / -1' }}>
          <p>No hay encuestas disponibles{regionName ? <> para <strong>{regionName}</strong></> : ''}.</p>
          <p style={{ fontSize: '0.85rem' }}>Pronto se agregaran nuevas encuestas.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Tipo de elección filter */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: 'var(--space-md)', padding: '10px 14px', background: 'var(--color-primary)', borderRadius: 'var(--radius-lg)' }}>
        <button
          onClick={() => { setTipoFilter('TODOS'); setRegionFilter('TODOS'); }}
          style={{
            padding: '6px 14px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all 0.15s',
            background: tipoFilter === 'TODOS' ? 'var(--color-accent)' : 'rgba(255,255,255,0.1)',
            color: tipoFilter === 'TODOS' ? 'var(--color-primary)' : 'rgba(255,255,255,0.7)',
          }}
        >
          Todas ({encuestas.length})
        </button>
        {availableTipos.map(tipo => {
          const count = encuestas.filter(e => e.tipo_eleccion === tipo).length;
          const info = TIPOS_ELECCION[tipo];
          const isPresidente = tipo === 'PRESIDENTE';
          const isActive = tipoFilter === tipo;
          return (
            <button
              key={tipo}
              onClick={() => { setTipoFilter(tipo); setRegionFilter('TODOS'); }}
              style={{
                padding: '6px 14px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: isPresidente ? 700 : 600, cursor: 'pointer', border: 'none', transition: 'all 0.15s',
                background: isActive ? 'var(--color-accent)' : isPresidente ? 'rgba(212,160,18,0.25)' : 'rgba(255,255,255,0.1)',
                color: isActive ? 'var(--color-primary)' : isPresidente ? 'var(--color-accent)' : 'rgba(255,255,255,0.7)',
              }}
            >
              {info.nombre} ({count})
            </button>
          );
        })}
      </div>

      {/* Region filter pills - only show when there are multiple regions */}
      {availableRegions.length > 1 && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: 'var(--space-lg)', padding: '8px 12px', background: 'var(--bg-light)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <button
            onClick={() => setRegionFilter('TODOS')}
            style={{
              fontSize: '0.72rem', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', border: 'none', fontWeight: 600, transition: 'all 0.15s',
              background: regionFilter === 'TODOS' ? 'var(--color-secondary)' : 'transparent',
              color: regionFilter === 'TODOS' ? '#fff' : 'var(--text-secondary)',
            }}
          >
            Todas las regiones ({filteredByTipo.length})
          </button>
          {availableRegions.map(([code, info]) => {
            const count = filteredByTipo.filter(e => e.region === code).length;
            return (
              <button
                key={code}
                onClick={() => setRegionFilter(code)}
                style={{
                  fontSize: '0.72rem', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', border: 'none', fontWeight: 500, transition: 'all 0.15s',
                  background: regionFilter === code ? 'var(--color-secondary)' : 'transparent',
                  color: regionFilter === code ? '#fff' : 'var(--text-secondary)',
                }}
              >
                {info.nombre} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Carousel container */}
      <div style={{ position: 'relative' }}>
        {/* Left arrow */}
        {filtered.length > 3 && (
          <button
            onClick={() => scroll('left')}
            className="carousel-arrow carousel-arrow-left"
            aria-label="Anterior"
            style={{
              position: 'absolute', left: -20, top: '50%', transform: 'translateY(-50%)',
              zIndex: 2, width: 40, height: 40, borderRadius: '50%',
              background: 'var(--bg-white)', border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-md)', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
        )}

        {/* Scrollable cards */}
        <div
          ref={scrollRef}
          style={{
            display: 'flex',
            gap: 'var(--space-lg)',
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            scrollbarWidth: 'none',
            paddingBottom: 'var(--space-sm)',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {filtered.map(enc => (
            <div
              key={enc.id}
              style={{
                flex: '0 0 340px',
                scrollSnapAlign: 'start',
                maxWidth: '90vw',
              }}
            >
              <EncuestaCard encuesta={enc} />
            </div>
          ))}
        </div>

        {/* Right arrow */}
        {filtered.length > 3 && (
          <button
            onClick={() => scroll('right')}
            className="carousel-arrow carousel-arrow-right"
            aria-label="Siguiente"
            style={{
              position: 'absolute', right: -20, top: '50%', transform: 'translateY(-50%)',
              zIndex: 2, width: 40, height: 40, borderRadius: '50%',
              background: 'var(--bg-white)', border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-md)', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        )}
      </div>

      {/* Count indicator */}
      <div style={{ textAlign: 'center', marginTop: 'var(--space-md)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
        {filtered.length} encuesta{filtered.length !== 1 ? 's' : ''}
        {tipoFilter !== 'TODOS' && ` de ${TIPOS_ELECCION[tipoFilter]?.nombre}`}
        {regionFilter !== 'TODOS' && ` en ${REGIONES_PERU[regionFilter]?.nombre}`}
      </div>
    </div>
  );
}
