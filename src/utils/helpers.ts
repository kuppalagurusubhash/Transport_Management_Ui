export const formatINR = (n: number): string => {
  return '₹' + Math.round(n).toLocaleString('en-IN');
};

export const sizeToSqft: Record<string, number> = {
  '2x2': 4,
  '3x3': 9
};

export const districts = [
  'Palakkad',
  'Wayanad',
  'Kannur',
  'Thrissur',
  'Ernakulam'
];
