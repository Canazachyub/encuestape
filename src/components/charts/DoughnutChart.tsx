import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import type { ResultadoOpcion } from '../../types';
import { getChartColors } from '../../utils/helpers';

ChartJS.register(ArcElement, Tooltip, Legend);

interface DoughnutChartProps {
  resultados: ResultadoOpcion[];
}

export default function DoughnutChart({ resultados }: DoughnutChartProps) {
  const colors = getChartColors(resultados.length);

  const data = {
    labels: resultados.map(r => r.opcion.length > 30 ? r.opcion.substring(0, 30) + '...' : r.opcion),
    datasets: [{
      data: resultados.map(r => r.cantidad),
      backgroundColor: colors,
      borderWidth: 2,
      borderColor: '#FFFFFF',
      hoverOffset: 8,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 16,
          font: { family: 'Outfit', size: 12 },
          usePointStyle: true,
          pointStyleWidth: 10,
        },
      },
      tooltip: {
        backgroundColor: '#0A1E3D',
        bodyFont: { family: 'JetBrains Mono', size: 12 },
        callbacks: {
          label: (ctx: { dataIndex: number }) => {
            const r = resultados[ctx.dataIndex];
            return ` ${r.porcentaje}% (${r.cantidad} votos)`;
          },
        },
      },
    },
    animation: { animateRotate: true, duration: 1200 },
  };

  return <Doughnut data={data} options={options} />;
}
