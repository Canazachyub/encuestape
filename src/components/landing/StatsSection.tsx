import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import { useAnimateCounter } from '../../hooks/useAnimateCounter';
import type { Estadisticas } from '../../types';

interface StatsSectionProps {
  stats: Estadisticas;
  loading?: boolean;
}

export default function StatsSection({ stats, loading }: StatsSectionProps) {
  return (
    <section className="stats-section" id="stats">
      <div className="container">
        <div className="stats-grid">
          <StatItem label="Votos registrados" target={stats.total_votos} loading={loading} />
          <StatItem label="Encuestas realizadas" target={stats.total_encuestas} loading={loading} />
          <StatItem label="Regiones cubiertas" target={stats.regiones} loading={loading} />
          <StatItem label="% Precisión verificada" target={stats.precision} loading={loading} />
        </div>
      </div>
    </section>
  );
}

function StatItem({ label, target, loading }: { label: string; target: number; loading?: boolean }) {
  const [ref, isVisible] = useIntersectionObserver({ threshold: 0.3 });
  const display = useAnimateCounter(target, isVisible);

  return (
    <div className="stat-item" ref={ref}>
      <div className={`stat-number mono${loading ? ' stat-loading' : ''}`}>
        {loading ? '—' : display}
      </div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
