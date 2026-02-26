import type { CandidateOption, Encuesta, EncuestaOption } from '../types';

export function debounce<T extends (...args: unknown[]) => void>(fn: T, delay = 300): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function getOptionName(opt: EncuestaOption): string {
  if (typeof opt === 'object' && opt !== null) return opt.nombre;
  return opt;
}

export function findCandidateData(encuesta: Encuesta | null, optionName: string): CandidateOption | null {
  if (!encuesta || !encuesta.opciones) return null;
  return (encuesta.opciones.find(
    o => typeof o === 'object' && o.nombre === optionName
  ) as CandidateOption) || null;
}

export function getInitials(name: string): string {
  const parts = name.split(' ').filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

export function getChartColors(count: number): string[] {
  const palette = [
    '#D4A012', '#1A4B8C', '#0A1E3D', '#1B8C5A',
    '#D91023', '#5A6B7F', '#E6A817', '#8B5CF6',
    '#2563EB', '#DC2626', '#059669', '#D97706',
    '#7C3AED', '#DB2777', '#0891B2', '#4F46E5',
    '#EA580C', '#16A34A', '#9333EA', '#E11D48',
    '#0284C7', '#65A30D', '#C026D3', '#CA8A04',
    '#0D9488', '#6366F1', '#F59E0B', '#EF4444',
    '#10B981', '#8B5CF6', '#F97316', '#06B6D4',
    '#A855F7', '#EC4899', '#14B8A6', '#6D28D9',
  ];
  if (count <= palette.length) return palette.slice(0, count);
  const result = [...palette];
  for (let i = palette.length; i < count; i++) {
    const hue = (i * 137.508) % 360;
    result.push(`hsl(${hue}, 65%, 50%)`);
  }
  return result;
}
