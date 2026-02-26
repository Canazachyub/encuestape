import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from 'chart.js';
import type { ResultadoOpcion } from '../../types';
import { getChartColors } from '../../utils/helpers';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

interface BarChartProps {
  resultados: ResultadoOpcion[];
  barThickness?: number;
}

export default function BarChart({ resultados, barThickness = 36 }: BarChartProps) {
  const colors = getChartColors(resultados.length);

  const data = {
    labels: resultados.map(r => r.opcion.length > 35 ? r.opcion.substring(0, 35) + '...' : r.opcion),
    datasets: [{
      data: resultados.map(r => r.cantidad),
      backgroundColor: colors,
      borderRadius: 4,
      barThickness,
    }],
  };

  const options = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0A1E3D',
        titleFont: { family: 'Outfit', size: 13 },
        bodyFont: { family: 'JetBrains Mono', size: 12 },
        callbacks: {
          label: (ctx: { dataIndex: number }) => {
            const r = resultados[ctx.dataIndex];
            return ` ${r.cantidad} votos (${r.porcentaje}%)`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(0,0,0,0.05)' },
        ticks: { font: { family: 'JetBrains Mono', size: 11 }, color: '#5A6B7F' },
      },
      y: {
        grid: { display: false },
        ticks: { font: { family: 'Outfit', size: 13 }, color: '#0F1C2E' },
      },
    },
    animation: { duration: 1200, easing: 'easeOutQuart' as const },
  };

  return <Bar data={data} options={options} />;
}
