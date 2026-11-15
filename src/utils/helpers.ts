export const formatINR = (n: number): string => {
  return '₹' + Math.round(n).toLocaleString('en-IN');
};

export const sizeToSqft: Record<string, number> = {
  '2x2': 4,
  '3x3': 9,
  '2x1': 2,
  '4x2': 8,
  '1.5x1.5': 2.25,
  '1x1': 1
};

export const getSqftFromSize = (sizeStr: string): number => {
  if (!sizeStr) return 4;
  const clean = sizeStr.trim().toLowerCase();
  if (sizeToSqft[clean]) return sizeToSqft[clean];
  const parts = clean.split('x');
  if (parts.length === 2) {
    const w = parseFloat(parts[0]);
    const h = parseFloat(parts[1]);
    if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) {
      return Number((w * h).toFixed(2));
    }
  }
  return 4;
};

export const districts = [
  'Palakkad',
  'Wayanad',
  'Kannur',
  'Thrissur',
  'Ernakulam'
];
