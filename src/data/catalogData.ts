import { Finish } from './types';

export interface CatalogItem {
  id: string;
  code: string;
  name: string;
  subtitle: string;
  category: 'Black Stone' | 'Paving' | 'Flooring' | 'Slabs';
  size: string; // e.g. "2x2", "3x3"
  thickness: string; // e.g. "30mm", "40mm", "50mm"
  finish: Finish;
  finishLabel: string;
  sqftPerPiece: number;
  weightPerSqftKg: number; // approx 2.5 - 3 kg per mm per m^2
  baseRatePerSqft: number; // Quarry rate
  recommendedDistrictRate?: number;
  imageUrl: string;
  inStock: boolean;
  popular?: boolean;
  tag?: string;
  color?: string;
  description?: string;
  availableSizes?: string[];
  availableThicknesses?: string[];
  finishes?: Finish[];
}

export const catalogItems: CatalogItem[] = [
  {
    id: 'cat-1',
    code: 'KB-22-30R',
    name: 'Kadapa 2x2 Natural Rough Split Paving',
    subtitle: 'High-traction quarry-split stone for wet conditions',
    category: 'Black Stone',
    color: 'Charcoal Black',
    size: '2x2',
    thickness: '30mm',
    finish: 'rough',
    finishLabel: 'Natural Rough Split',
    sqftPerPiece: 4,
    weightPerSqftKg: 7.2,
    baseRatePerSqft: 17,
    recommendedDistrictRate: 23,
    imageUrl: '/catalog/s2.jpeg',
    inStock: true,
    popular: true,
    tag: 'Bestseller',
    description: 'Authentic quarry-split Kadapa black stone with natural cleft texture. Provides superior grip under wet conditions, making it the top choice for Kerala courtyards and car porches.'
  },
  {
    id: 'cat-2',
    code: 'KB-22-40P',
    name: 'Kadapa 2x2 Polished Patio & Walkway Tiles',
    subtitle: 'Calibrated honed finish for sleek foot comfort',
    category: 'Flooring',
    color: 'Deep Black',
    size: '2x2',
    thickness: '40mm',
    finish: 'polish',
    finishLabel: 'Honed Polish',
    sqftPerPiece: 4,
    weightPerSqftKg: 9.6,
    baseRatePerSqft: 19,
    recommendedDistrictRate: 26,
    imageUrl: '/catalog/p1.jpeg',
    inStock: true,
    popular: true,
    tag: 'Architectural Choice',
    description: 'Precision-calibrated black limestone with smooth honed finish. Perfect balance of rich charcoal aesthetics, foot comfort, and modern architectural finish.'
  },
  {
    id: 'cat-3',
    code: 'KB-22-50P',
    name: 'Kadapa 2x2 Heavy Mirror Polish Luxury Stone',
    subtitle: 'Ultra-dense 50mm diamond-wheel polished finish',
    category: 'Flooring',
    color: 'Jet Black Glass Sheen',
    size: '2x2',
    thickness: '50mm',
    finish: 'polish',
    finishLabel: 'Diamond Mirror Polish',
    sqftPerPiece: 4,
    weightPerSqftKg: 12.0,
    baseRatePerSqft: 20,
    recommendedDistrictRate: 29,
    imageUrl: '/catalog/p2.jpeg',
    inStock: true,
    popular: false,
    tag: 'Luxury Grade',
    description: 'Ultra-dense 50mm heavy-duty black stone with diamond-wheel mirror polishing. Imparts a luxurious glass-like black luster for grand residential halls and resorts.'
  },
  {
    id: 'cat-4',
    code: 'KB-33-30R',
    name: 'Kadapa 3x3 Grand Format Rough Stone',
    subtitle: 'Expansive 9 sqft slabs minimizing joint lines',
    category: 'Paving',
    color: 'Charcoal Black',
    size: '3x3',
    thickness: '30mm',
    finish: 'rough',
    finishLabel: 'Grand Format Rough',
    sqftPerPiece: 9,
    weightPerSqftKg: 7.2,
    baseRatePerSqft: 18,
    recommendedDistrictRate: 25,
    imageUrl: '/catalog/s1.jpeg',
    inStock: true,
    popular: true,
    tag: 'Low Grout Lines',
    description: 'Expansive 3ft by 3ft large format slabs covering 9 square feet per unit. Minimizes grout lines and accelerates installation for large landscaped grounds.'
  },
  {
    id: 'cat-5',
    code: 'KB-33-40P',
    name: 'Kadapa 3x3 Premium Polished Slab',
    subtitle: 'Contemporary geometric stepping stones & terraces',
    category: 'Paving',
    color: 'Deep Graphite Black',
    size: '3x3',
    thickness: '40mm',
    finish: 'polish',
    finishLabel: 'Calibrated Polish',
    sqftPerPiece: 9,
    weightPerSqftKg: 9.6,
    baseRatePerSqft: 20,
    recommendedDistrictRate: 28,
    imageUrl: '/catalog/p3.jpeg',
    inStock: true,
    popular: false,
    tag: 'Landscape Modern',
    description: 'Sleek 3x3 polished black stone stepping slabs. Exceptional geometry and uniform thickness designed for modern garden walkways and contemporary stepped patios.'
  },
  {
    id: 'cat-6',
    code: 'KB-33-50R',
    name: 'Kadapa 3x3 Heavy Duty 50mm Rough Block Slab',
    subtitle: 'Industrial-grade load bearing up to 40-tonne trucks',
    category: 'Slabs',
    color: 'Natural Quarry Black',
    size: '3x3',
    thickness: '50mm',
    finish: 'rough',
    finishLabel: 'Heavy Duty Natural Cleft',
    sqftPerPiece: 9,
    weightPerSqftKg: 12.0,
    baseRatePerSqft: 18,
    recommendedDistrictRate: 26,
    imageUrl: '/catalog/s3.jpeg',
    inStock: true,
    popular: false,
    tag: 'Heavy Load Rating',
    description: 'Immense 50mm thickness capable of bearing loaded trucks, fire engines, and industrial forklifts without cracking. Features genuine natural split texture.'
  }
];
