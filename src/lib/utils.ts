// Simple utility for Tailwind class merging
export function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
