import type {
  Driver,
  Lorry,
  Trip,
  Order,
  AppNotification,
  LoadingParty,
  UnloadingParty,
  StoneSpec,
  DistrictRate
} from './types';

export const mockLorries: Lorry[] = [
  {
    id: 'l1790087231572',
    plate: 'AP 02BH 3666',
    driverId: 'd-1790087186459',
    status: 'active',
    location: 'Loading — Ramapuram yard',
    capacitySqft: 1805,
    addedOn: '2026-09-22'
  },
  {
    id: 'l1790143262600',
    plate: 'KA 09BH 3435',
    driverId: 'd1790143286328',
    status: 'idle',
    location: 'Depot — Ramapuram',
    capacitySqft: 5000,
    addedOn: '2026-09-23'
  },
  {
    id: 'l1791221657658',
    plate: 'KL 03BH 3333',
    driverId: 'd1791223400000',
    status: 'active',
    location: 'Loading — Ramapuram yard',
    capacitySqft: 5000,
    addedOn: '2026-10-05'
  }
];

export const mockDrivers: Driver[] = [
  {
    id: 'd-1790087186459',
    name: 'subhash',
    email: 'subhash@gmail.com',
    phone: '7732010001',
    lorryId: 'l1790087231572',
    status: 'active',
    joinedOn: '2026-09-22',
    tripsCompleted: 14
  },
  {
    id: 'd1790143286328',
    name: 'Ramesh',
    email: 'ramesh@gmail.com',
    phone: '7732010001',
    lorryId: 'l1790143262600',
    status: 'active',
    joinedOn: '2026-09-23',
    tripsCompleted: 8
  },
  {
    id: 'd1791223400000',
    name: 'Suresh',
    email: 'suresh@gmail.com',
    phone: '7732010003',
    lorryId: 'l1791221657658',
    status: 'active',
    joinedOn: '2026-10-05',
    tripsCompleted: 5
  }
];

export const mockLoadingParties: LoadingParty[] = [];
export const mockUnloadingParties: UnloadingParty[] = [];
export const mockTrips: Trip[] = [];
export const mockOrders: Order[] = [];
export const mockStoneSpecs: StoneSpec[] = [];
export const mockDistrictRates: DistrictRate[] = [];
export const mockNotifications: AppNotification[] = [];
