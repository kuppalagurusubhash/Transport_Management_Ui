import type {
  Driver,
  Lorry,
  LoadingParty,
  UnloadingParty,
  Trip,
  StoneSpec,
  ActivityEvent,
  DistrictRate,
  Order,
  AppNotification,
  Finish } from
'./types';

export const formatINR = (n: number): string =>
'₹' + Math.round(n).toLocaleString('en-IN');

export const stoneSpecs: StoneSpec[] = [
{
  id: 'sp1',
  size: '2x2',
  thickness: '30mm',
  finish: 'rough',
  ratePerSqft: 17
},
{
  id: 'sp2',
  size: '2x2',
  thickness: '40mm',
  finish: 'polish',
  ratePerSqft: 19
},
{
  id: 'sp3',
  size: '2x2',
  thickness: '50mm',
  finish: 'polish',
  ratePerSqft: 20
},
{
  id: 'sp4',
  size: '3x3',
  thickness: '30mm',
  finish: 'rough',
  ratePerSqft: 18
},
{
  id: 'sp5',
  size: '3x3',
  thickness: '40mm',
  finish: 'polish',
  ratePerSqft: 20
},
{
  id: 'sp6',
  size: '3x3',
  thickness: '50mm',
  finish: 'rough',
  ratePerSqft: 18
}];


export const drivers: Driver[] = [
{
  id: 'd1',
  name: 'Suresh Kumar',
  phone: '+91 98470 11223',
  lorryId: 'l1',
  status: 'active',
  joinedOn: '2022-03-14',
  tripsCompleted: 184
},
{
  id: 'd2',
  name: 'Rajesh Nair',
  phone: '+91 98470 22334',
  lorryId: 'l2',
  status: 'active',
  joinedOn: '2021-11-02',
  tripsCompleted: 231
},
{
  id: 'd3',
  name: 'Mohan Singh',
  phone: '+91 98470 33445',
  lorryId: 'l3',
  status: 'active',
  joinedOn: '2023-01-20',
  tripsCompleted: 96
},
{
  id: 'd4',
  name: 'Vikram Patel',
  phone: '+91 98470 44556',
  lorryId: 'l4',
  status: 'idle',
  joinedOn: '2020-07-19',
  tripsCompleted: 312
},
{
  id: 'd5',
  name: 'Arun Kumar',
  phone: '+91 98470 55667',
  lorryId: 'l5',
  status: 'active',
  joinedOn: '2022-09-05',
  tripsCompleted: 142
},
{
  id: 'd6',
  name: 'Deepak Roy',
  phone: '+91 98470 66778',
  lorryId: 'l6',
  status: 'idle',
  joinedOn: '2023-05-11',
  tripsCompleted: 61
},
{
  id: 'd7',
  name: 'Pradeep Das',
  phone: '+91 98470 77889',
  lorryId: 'l7',
  status: 'active',
  joinedOn: '2021-02-27',
  tripsCompleted: 208
},
{
  id: 'd8',
  name: 'Anil Menon',
  phone: '+91 98470 88990',
  lorryId: null,
  status: 'off-duty',
  joinedOn: '2024-01-08',
  tripsCompleted: 24
}];


export const lorries: Lorry[] = [
{
  id: 'l1',
  plate: 'KL-07 AB 4521',
  driverId: 'd1',
  status: 'active',
  location: 'En route — near Palakkad',
  capacitySqft: 1800,
  addedOn: '2020-01-10'
},
{
  id: 'l2',
  plate: 'KL-12 CD 5847',
  driverId: 'd2',
  status: 'active',
  location: 'En route — Thrissur bypass',
  capacitySqft: 2000,
  addedOn: '2019-06-22'
},
{
  id: 'l3',
  plate: 'KL-08 EF 6234',
  driverId: 'd3',
  status: 'active',
  location: 'Loading — Ramapuram yard',
  capacitySqft: 1800,
  addedOn: '2021-03-15'
},
{
  id: 'l4',
  plate: 'KL-15 GH 7891',
  driverId: 'd4',
  status: 'idle',
  location: 'Depot — Ramapuram',
  capacitySqft: 1600,
  addedOn: '2018-11-30'
},
{
  id: 'l5',
  plate: 'KL-03 IJ 2156',
  driverId: 'd5',
  status: 'active',
  location: 'En route — near Kannur',
  capacitySqft: 2200,
  addedOn: '2022-02-18'
},
{
  id: 'l6',
  plate: 'KL-19 KL 8923',
  driverId: 'd6',
  status: 'idle',
  location: 'Depot — awaiting load',
  capacitySqft: 1800,
  addedOn: '2023-04-01'
},
{
  id: 'l7',
  plate: 'KL-11 MN 4567',
  driverId: 'd7',
  status: 'active',
  location: 'Unloading — Ernakulam',
  capacitySqft: 2000,
  addedOn: '2020-08-12'
},
{
  id: 'l8',
  plate: 'KL-20 OP 9234',
  driverId: null,
  status: 'maintenance',
  location: 'Workshop — Kottayam',
  capacitySqft: 1800,
  addedOn: '2019-12-05'
}];


export const loadingParties: LoadingParty[] = [
{
  id: 'lp1',
  name: 'Ramapuram Granites',
  location: 'Ramapuram',
  totalPurchased: 148000,
  paid: 120000,
  pending: 28000
},
{
  id: 'lp2',
  name: 'Sri Balaji Quarry',
  location: 'Ramapuram East',
  totalPurchased: 96000,
  paid: 96000,
  pending: 0
},
{
  id: 'lp3',
  name: 'Anjani Stone Works',
  location: 'Melur',
  totalPurchased: 72000,
  paid: 45000,
  pending: 27000
},
{
  id: 'lp4',
  name: 'Venkatesh Traders',
  location: 'Ramapuram West',
  totalPurchased: 54000,
  paid: 40000,
  pending: 14000
},
{
  id: 'lp5',
  name: 'Karthik Blue Metals',
  location: 'Puliyampatti',
  totalPurchased: 61000,
  paid: 61000,
  pending: 0
}];


export const unloadingParties: UnloadingParty[] = [
{
  id: 'up1',
  name: 'Malabar Builders',
  district: 'Palakkad',
  totalOrdered: 132000,
  paid: 110000,
  pending: 22000
},
{
  id: 'up2',
  name: 'Green Valley Constructions',
  district: 'Wayanad',
  totalOrdered: 88000,
  paid: 88000,
  pending: 0
},
{
  id: 'up3',
  name: 'Kannur Stone House',
  district: 'Kannur',
  totalOrdered: 74000,
  paid: 58000,
  pending: 16000
},
{
  id: 'up4',
  name: 'Thrissur Marbles',
  district: 'Thrissur',
  totalOrdered: 51000,
  paid: 41000,
  pending: 10000
},
{
  id: 'up5',
  name: 'Ernakulam Infra',
  district: 'Ernakulam',
  totalOrdered: 63000,
  paid: 63000,
  pending: 0
}];


export const trips: Trip[] = [
{
  id: 't1',
  code: 'TRP-1042',
  lorryId: 'l1',
  driverId: 'd1',
  origin: 'Ramapuram',
  unloadingPartyId: 'up1',
  status: 'in-transit',
  date: '2026-07-01',
  amountPaid: 0,
  stoneLines: [
  {
    id: 'sl1',
    loadingPartyId: 'lp1',
    size: '2x2',
    thickness: '40mm',
    finish: 'polish',
    sqftPerPiece: 4,
    pieces: 40,
    ratePerSqft: 19
  },
  {
    id: 'sl2',
    loadingPartyId: 'lp2',
    size: '3x3',
    thickness: '50mm',
    finish: 'rough',
    sqftPerPiece: 9,
    pieces: 25,
    ratePerSqft: 18
  }],

  workerPayments: [
  { id: 'w1', loadingPartyId: 'lp1', amount: 7000, note: 'Loading crew' },
  { id: 'w2', loadingPartyId: 'lp2', amount: 5000 }],

  expenses: [
  { id: 'e1', label: 'Diesel', amount: 8200, review: 'pending' },
  { id: 'e2', label: 'Toll (NH544)', amount: 640, review: 'pending' },
  { id: 'e3', label: 'Driver food', amount: 450, review: 'approved' }]

},
{
  id: 't2',
  code: 'TRP-1041',
  lorryId: 'l2',
  driverId: 'd2',
  origin: 'Ramapuram',
  unloadingPartyId: 'up4',
  status: 'delivered',
  date: '2026-06-29',
  amountPaid: 20000,
  stoneLines: [
  {
    id: 'sl3',
    loadingPartyId: 'lp3',
    size: '2x2',
    thickness: '30mm',
    finish: 'rough',
    sqftPerPiece: 4,
    pieces: 60,
    ratePerSqft: 17
  }],

  workerPayments: [{ id: 'w3', loadingPartyId: 'lp3', amount: 6000 }],
  expenses: [
  { id: 'e4', label: 'Diesel', amount: 7600, review: 'approved' },
  { id: 'e5', label: 'Tyre repair', amount: 1200, review: 'flagged' }]

},
{
  id: 't3',
  code: 'TRP-1040',
  lorryId: 'l5',
  driverId: 'd5',
  origin: 'Ramapuram',
  unloadingPartyId: 'up3',
  status: 'paid',
  date: '2026-06-27',
  amountPaid: 18240,
  stoneLines: [
  {
    id: 'sl4',
    loadingPartyId: 'lp4',
    size: '3x3',
    thickness: '40mm',
    finish: 'polish',
    sqftPerPiece: 9,
    pieces: 32,
    ratePerSqft: 20
  }],

  workerPayments: [{ id: 'w4', loadingPartyId: 'lp4', amount: 7500 }],
  expenses: [
  { id: 'e6', label: 'Diesel', amount: 9100, review: 'approved' },
  { id: 'e7', label: 'Toll', amount: 720, review: 'approved' }]

},
{
  id: 't4',
  code: 'TRP-1039',
  lorryId: 'l7',
  driverId: 'd7',
  origin: 'Ramapuram',
  unloadingPartyId: 'up5',
  status: 'paid',
  date: '2026-06-25',
  amountPaid: 21600,
  stoneLines: [
  {
    id: 'sl5',
    loadingPartyId: 'lp5',
    size: '2x2',
    thickness: '50mm',
    finish: 'polish',
    sqftPerPiece: 4,
    pieces: 45,
    ratePerSqft: 20
  },
  {
    id: 'sl6',
    loadingPartyId: 'lp1',
    size: '2x2',
    thickness: '40mm',
    finish: 'polish',
    sqftPerPiece: 4,
    pieces: 30,
    ratePerSqft: 19
  }],

  workerPayments: [
  { id: 'w5', loadingPartyId: 'lp5', amount: 6500 },
  { id: 'w6', loadingPartyId: 'lp1', amount: 4000 }],

  expenses: [{ id: 'e8', label: 'Diesel', amount: 8800, review: 'approved' }]
}];


export const recentActivity: ActivityEvent[] = [
{
  id: 'a1',
  kind: 'trip',
  message: 'TRP-1042 dispatched to Malabar Builders (Palakkad)',
  time: '20 min ago'
},
{
  id: 'a2',
  kind: 'payment',
  message: 'Green Valley Constructions cleared ₹88,000',
  time: '2 hr ago'
},
{
  id: 'a3',
  kind: 'expense',
  message: 'Tyre repair on TRP-1041 flagged for review',
  time: '4 hr ago'
},
{
  id: 'a4',
  kind: 'fleet',
  message: 'KL-20 OP 9234 moved to maintenance',
  time: '1 day ago'
},
{
  id: 'a5',
  kind: 'trip',
  message: 'TRP-1040 marked paid by Kannur Stone House',
  time: '2 days ago'
}];


export const revenueTrend = [
{ month: 'Feb', revenue: 198000, sqft: 9200 },
{ month: 'Mar', revenue: 224000, sqft: 10400 },
{ month: 'Apr', revenue: 241000, sqft: 11100 },
{ month: 'May', revenue: 268000, sqft: 12600 },
{ month: 'Jun', revenue: 284500, sqft: 13400 }];


// Kerala districts we sell into.
export const districts = [
'Palakkad',
'Wayanad',
'Kannur',
'Thrissur',
'Ernakulam'];


// Sizes carry a fixed sqft-per-piece (2x2 => 4, 3x3 => 9).
export const sizeToSqft: Record<string, number> = {
  '2x2': 4,
  '3x3': 9
};

// District-based selling rates (rate per sqft to the buyer).
// Mirrors the user's example: 2x2 50mm -> Palakkad 40, Wayanad 49, Kannur 50.
export const districtRates: DistrictRate[] = [
{
  id: 'dr1',
  district: 'Palakkad',
  size: '2x2',
  thickness: '40mm',
  finish: 'polish',
  ratePerSqft: 38
},
{
  id: 'dr2',
  district: 'Wayanad',
  size: '2x2',
  thickness: '40mm',
  finish: 'polish',
  ratePerSqft: 47
},
{
  id: 'dr3',
  district: 'Kannur',
  size: '2x2',
  thickness: '40mm',
  finish: 'polish',
  ratePerSqft: 48
},
{
  id: 'dr4',
  district: 'Thrissur',
  size: '2x2',
  thickness: '40mm',
  finish: 'polish',
  ratePerSqft: 42
},
{
  id: 'dr5',
  district: 'Ernakulam',
  size: '2x2',
  thickness: '40mm',
  finish: 'polish',
  ratePerSqft: 44
},
{
  id: 'dr6',
  district: 'Palakkad',
  size: '2x2',
  thickness: '50mm',
  finish: 'polish',
  ratePerSqft: 40
},
{
  id: 'dr7',
  district: 'Wayanad',
  size: '2x2',
  thickness: '50mm',
  finish: 'polish',
  ratePerSqft: 49
},
{
  id: 'dr8',
  district: 'Kannur',
  size: '2x2',
  thickness: '50mm',
  finish: 'polish',
  ratePerSqft: 50
},
{
  id: 'dr9',
  district: 'Thrissur',
  size: '2x2',
  thickness: '50mm',
  finish: 'polish',
  ratePerSqft: 44
},
{
  id: 'dr10',
  district: 'Ernakulam',
  size: '2x2',
  thickness: '50mm',
  finish: 'polish',
  ratePerSqft: 46
},
{
  id: 'dr11',
  district: 'Palakkad',
  size: '2x2',
  thickness: '30mm',
  finish: 'rough',
  ratePerSqft: 34
},
{
  id: 'dr12',
  district: 'Wayanad',
  size: '2x2',
  thickness: '30mm',
  finish: 'rough',
  ratePerSqft: 43
},
{
  id: 'dr13',
  district: 'Kannur',
  size: '2x2',
  thickness: '30mm',
  finish: 'rough',
  ratePerSqft: 44
},
{
  id: 'dr14',
  district: 'Thrissur',
  size: '2x2',
  thickness: '30mm',
  finish: 'rough',
  ratePerSqft: 38
},
{
  id: 'dr15',
  district: 'Ernakulam',
  size: '2x2',
  thickness: '30mm',
  finish: 'rough',
  ratePerSqft: 40
},
{
  id: 'dr16',
  district: 'Palakkad',
  size: '3x3',
  thickness: '40mm',
  finish: 'polish',
  ratePerSqft: 41
},
{
  id: 'dr17',
  district: 'Wayanad',
  size: '3x3',
  thickness: '40mm',
  finish: 'polish',
  ratePerSqft: 50
},
{
  id: 'dr18',
  district: 'Kannur',
  size: '3x3',
  thickness: '40mm',
  finish: 'polish',
  ratePerSqft: 52
},
{
  id: 'dr19',
  district: 'Thrissur',
  size: '3x3',
  thickness: '40mm',
  finish: 'polish',
  ratePerSqft: 45
},
{
  id: 'dr20',
  district: 'Ernakulam',
  size: '3x3',
  thickness: '40mm',
  finish: 'polish',
  ratePerSqft: 47
},
{
  id: 'dr21',
  district: 'Palakkad',
  size: '3x3',
  thickness: '50mm',
  finish: 'rough',
  ratePerSqft: 39
},
{
  id: 'dr22',
  district: 'Wayanad',
  size: '3x3',
  thickness: '50mm',
  finish: 'rough',
  ratePerSqft: 48
},
{
  id: 'dr23',
  district: 'Kannur',
  size: '3x3',
  thickness: '50mm',
  finish: 'rough',
  ratePerSqft: 49
},
{
  id: 'dr24',
  district: 'Thrissur',
  size: '3x3',
  thickness: '50mm',
  finish: 'rough',
  ratePerSqft: 43
},
{
  id: 'dr25',
  district: 'Ernakulam',
  size: '3x3',
  thickness: '50mm',
  finish: 'rough',
  ratePerSqft: 45
}];


// Distinct sellable specs (size/thickness/finish), derived from the rate table.
export const sellableSpecs = Array.from(
  new Map(
    districtRates.map((r) => [
    `${r.size}-${r.thickness}-${r.finish}`,
    { size: r.size, thickness: r.thickness, finish: r.finish }]
    )
  ).values()
);

// Look up the selling rate for a (district, spec) combination.
export const findDistrictRate = (
district: string,
size: string,
thickness: string,
finish: Finish)
: number | undefined =>
districtRates.find(
  (r) =>
  r.district === district &&
  r.size === size &&
  r.thickness === thickness &&
  r.finish === finish
)?.ratePerSqft;

// Seed orders placed by Kerala buyers through the portal.
export const seedOrders: Order[] = [
{
  id: 'o1',
  code: 'ORD-2051',
  unloadingPartyId: 'up1',
  district: 'Palakkad',
  status: 'confirmed',
  placedAt: '2026-07-02T09:20:00',
  amountPaid: 0,
  lines: [
  {
    id: 'ol1',
    size: '2x2',
    thickness: '50mm',
    finish: 'polish',
    sqftPerPiece: 4,
    pieces: 40,
    ratePerSqft: 40
  }]

},
{
  id: 'o2',
  code: 'ORD-2050',
  unloadingPartyId: 'up3',
  district: 'Kannur',
  status: 'dispatched',
  placedAt: '2026-07-01T14:05:00',
  amountPaid: 0,
  lines: [
  {
    id: 'ol2',
    size: '2x2',
    thickness: '50mm',
    finish: 'polish',
    sqftPerPiece: 4,
    pieces: 35,
    ratePerSqft: 50
  },
  {
    id: 'ol3',
    size: '3x3',
    thickness: '40mm',
    finish: 'polish',
    sqftPerPiece: 9,
    pieces: 20,
    ratePerSqft: 52
  }]

},
{
  id: 'o3',
  code: 'ORD-2049',
  unloadingPartyId: 'up2',
  district: 'Wayanad',
  status: 'paid',
  placedAt: '2026-06-28T11:30:00',
  amountPaid: 11280,
  lines: [
  {
    id: 'ol4',
    size: '2x2',
    thickness: '40mm',
    finish: 'polish',
    sqftPerPiece: 4,
    pieces: 60,
    ratePerSqft: 47
  }]

},
{
  id: 'o4',
  code: 'ORD-2048',
  unloadingPartyId: 'up4',
  district: 'Thrissur',
  status: 'delivered',
  placedAt: '2026-06-26T16:45:00',
  amountPaid: 3000,
  lines: [
  {
    id: 'ol5',
    size: '3x3',
    thickness: '50mm',
    finish: 'rough',
    sqftPerPiece: 9,
    pieces: 18,
    ratePerSqft: 43
  }]

}];


// Seed owner notifications.
export const seedNotifications: AppNotification[] = [
{
  id: 'n1',
  kind: 'order',
  title: 'New order · ORD-2051',
  body: 'Malabar Builders (Palakkad) placed an order for ₹6,400',
  time: '15 min ago',
  read: false,
  orderId: 'o1'
},
{
  id: 'n2',
  kind: 'order',
  title: 'New order · ORD-2050',
  body: 'Kannur Stone House placed an order',
  time: '1 day ago',
  read: false,
  orderId: 'o2'
}];


// Lookup helpers
export const driverById = (id: string | null) =>
drivers.find((d) => d.id === id);
export const lorryById = (id: string | null) => lorries.find((l) => l.id === id);
export const loadingPartyById = (id: string) =>
loadingParties.find((p) => p.id === id);
export const unloadingPartyById = (id: string) =>
unloadingParties.find((p) => p.id === id);