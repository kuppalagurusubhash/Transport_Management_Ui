export interface ShowcaseFleetItem {
  id: number | string;
  vehicleNumber: string;
  plate: string;
  model: string;
  status: string;
  statusLabel: string;
  statusColor: string;
  image: string;
  sideImage?: string;
  driver: string;
  route: string;
  type?: string;
  truckImage?: string;
  truckJpg?: string;
  thumbImage?: string;
  capacity?: string;
}

// Authentic Fleets matching the actual database records of SRI SAI BABA Transport
export const showcaseFleetData: ShowcaseFleetItem[] = [
  {
    id: 1,
    vehicleNumber: 'AP 02BH 3666',
    plate: 'AP 02BH 3666',
    model: 'Ashok Leyland 4825',
    status: 'active',
    statusLabel: 'On Trip',
    statusColor: '#10b981',
    image: '/fleet/ashok_leyland_hd.png?v=20261005_hd3',
    sideImage: '/fleet/ashok_leyland_hd.png?v=20261005_hd3',
    driver: 'subhash',
    route: 'Loading — Ramapuram yard',
    type: 'Multi-Axle Heavy Stone Carrier',
    capacity: '1,805 sqft'
  },
  {
    id: 2,
    vehicleNumber: 'KA 09BH 3435',
    plate: 'KA 09BH 3435',
    model: 'Ashok Leyland 4825',
    status: 'idle',
    statusLabel: 'Idle',
    statusColor: '#06b6d4',
    image: '/fleet/ashok_leyland_hd.png?v=20261005_hd3',
    sideImage: '/fleet/ashok_leyland_hd.png?v=20261005_hd3',
    driver: 'Ramesh',
    route: 'Depot — Ramapuram',
    type: 'Multi-Axle Heavy Stone Carrier',
    capacity: '5,000 sqft'
  },
  {
    id: 3,
    vehicleNumber: 'KL 03BH 3333',
    plate: 'KL 03BH 3333',
    model: 'Ashok Leyland 4825',
    status: 'active',
    statusLabel: 'On Trip',
    statusColor: '#10b981',
    image: '/fleet/ashok_leyland_hd.png?v=20261005_hd3',
    sideImage: '/fleet/ashok_leyland_hd.png?v=20261005_hd3',
    driver: 'Suresh',
    route: 'Ramapuram yard — Kerala',
    type: 'Multi-Axle Heavy Stone Carrier',
    capacity: '5,000 sqft'
  }
];

