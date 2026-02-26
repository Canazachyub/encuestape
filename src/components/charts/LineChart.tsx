import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

interface LineChartProps {
  labels: string[];
  data: number[];
}

export default function LineChart({ labels, data: chartData }: LineChartProps) {
  const data = {
    labels,
    datasets: [{
      data: chartData,
      borderColor: '#1A4B8C',
      backgroundColor: 'rgba(26, 75, 140, 0.1)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#1A4B8C',
      pointRadius: 4,
      pointHoverRadius: 6,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0A1E3D',
        bodyFont: { family: 'JetBrains Mono', size: 12 },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(0,0,0,0.05)' },
        ticks: { font: { family: 'Outfit', size: 11 }, color: '#5A6B7F' },
      },
      y: {
        grid: { color: 'rgba(0,0,0,0.05)' },
        ticks: { font: { family: 'JetBrains Mono', size: 11 }, color: '#5A6B7F' },
      },
    },
    animation: { duration: 1000 },
  };

  return <Line data={data} options={options} />;
}
