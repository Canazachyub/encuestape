import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import { useAnimateCounter } from '../../hooks/useAnimateCounter';
import type { Estadisticas } from '../../types';

interface StatsSectionProps {
  stats: Estadisticas;
}

export default function StatsSection({ stats }: StatsSectionProps) {
  return (
    <section className="stats-section" id="stats">
      <div className="container">
        <div className="stats-grid">
          <StatItem label="Votos registrados" target={stats.total_votos} />
          <StatItem label="Encuestas realizadas" target={stats.total_encuestas} />
          <StatItem label="Regiones cubiertas" target={stats.regiones} />
          <StatItem label="% Precisión verificada" target={stats.precision} />
        </div>
      </div>
    </section>
  );
}

function StatItem({ label, target }: { label: string; target: number }) {
  const [ref, isVisible] = useIntersectionObserver({ threshold: 0.3 });
  const display = useAnimateCounter(target, isVisible);

  return (
    <div className="stat-item" ref={ref}>
      <div className="stat-number mono">{display}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
