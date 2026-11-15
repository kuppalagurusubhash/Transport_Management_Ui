import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { OrdersProvider } from './store/OrdersContext';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { LuxuryLoader } from './components/ui/LuxuryLoader';
import { NotFound } from './pages/NotFound';

// Helper for loading named export page components via React.lazy
const lazyPage = <T extends Record<string, any>>(
  importer: () => Promise<T>,
  exportName: keyof T
) => React.lazy(() => importer().then((m) => ({ default: m[exportName] })));

const Overview = lazyPage(() => import('./pages/Overview'), 'Overview');
const Orders = lazyPage(() => import('./pages/Orders'), 'Orders');
const Loading = lazyPage(() => import('./pages/Loading'), 'Loading');
const Trips = lazyPage(() => import('./pages/Trips'), 'Trips');
const TripDetail = lazyPage(() => import('./pages/TripDetail'), 'TripDetail');
const Fleet = lazyPage(() => import('./pages/Fleet'), 'Fleet');
const FleetDetail = lazyPage(() => import('./pages/FleetDetail'), 'FleetDetail');
const Drivers = lazyPage(() => import('./pages/Drivers'), 'Drivers');
const DriverDetail = lazyPage(() => import('./pages/DriverDetail'), 'DriverDetail');
const LoadingParties = lazyPage(() => import('./pages/LoadingParties'), 'LoadingParties');
const LoadingPartyDetail = lazyPage(() => import('./pages/LoadingPartyDetail'), 'LoadingPartyDetail');
const UnloadingParties = lazyPage(() => import('./pages/UnloadingParties'), 'UnloadingParties');
const UnloadingPartyDetail = lazyPage(() => import('./pages/UnloadingPartyDetail'), 'UnloadingPartyDetail');
const Login = lazyPage(() => import('./pages/Login'), 'Login');
const Register = lazyPage(() => import('./pages/Register'), 'Register');
const Settings = lazyPage(() => import('./pages/Settings'), 'Settings');
const Expenses = lazyPage(() => import('./pages/Expenses'), 'Expenses');
const Payments = lazyPage(() => import('./pages/Payments'), 'Payments');
const Reports = lazyPage(() => import('./pages/Reports'), 'Reports');

function PageLoader({ fullScreen = false }: { fullScreen?: boolean }) {
  return <LuxuryLoader fullScreen={fullScreen} />;
}

function Page({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="min-h-full"
    >
      <Suspense fallback={<PageLoader />}>
        {children}
      </Suspense>
    </motion.div>
  );
}

function ProtectedRoute() {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export function App() {
  return (
    <OrdersProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader fullScreen />}>
          <Routes>
            {/* Login & Register screens */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Owner & Management dashboard (protected) */}
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route index element={<Page><Overview /></Page>} />
                <Route
                  path="/orders"
                  element={
                    <Page>
                      <Orders />
                    </Page>
                  }
                />
                <Route
                  path="/loading"
                  element={
                    <Page>
                      <Loading />
                    </Page>
                  }
                />
                <Route
                  path="/trips"
                  element={
                    <Page>
                      <Trips />
                    </Page>
                  }
                />
                <Route
                  path="/trips/:tripId"
                  element={
                    <Page>
                      <TripDetail />
                    </Page>
                  }
                />
                <Route
                  path="/fleet"
                  element={
                    <Page>
                      <Fleet />
                    </Page>
                  }
                />
                <Route
                  path="/fleet/:lorryId"
                  element={
                    <Page>
                      <FleetDetail />
                    </Page>
                  }
                />
                <Route
                  path="/drivers"
                  element={
                    <Page>
                      <Drivers />
                    </Page>
                  }
                />
                <Route
                  path="/drivers/:driverId"
                  element={
                    <Page>
                      <DriverDetail />
                    </Page>
                  }
                />
                <Route
                  path="/loading-parties"
                  element={
                    <Page>
                      <LoadingParties />
                    </Page>
                  }
                />
                <Route
                  path="/loading-parties/:partyId"
                  element={
                    <Page>
                      <LoadingPartyDetail />
                    </Page>
                  }
                />
                <Route
                  path="/unloading-parties"
                  element={
                    <Page>
                      <UnloadingParties />
                    </Page>
                  }
                />
                <Route
                  path="/unloading-parties/:partyId"
                  element={
                    <Page>
                      <UnloadingPartyDetail />
                    </Page>
                  }
                />
                <Route
                  path="/district-rates"
                  element={<Navigate to="/settings?tab=pricing" replace />}
                />
                <Route
                  path="/rates"
                  element={<Navigate to="/settings?tab=pricing" replace />}
                />
                <Route
                  path="/expenses"
                  element={
                    <Page>
                      <Expenses />
                    </Page>
                  }
                />
                <Route
                  path="/payments"
                  element={
                    <Page>
                      <Payments />
                    </Page>
                  }
                />
                <Route
                  path="/reports"
                  element={
                    <Page>
                      <Reports />
                    </Page>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <Page>
                      <Settings />
                    </Page>
                  }
                />
              </Route>
            </Route>

            {/* Catch-all 404 Not Found Page */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </OrdersProvider>
  );
}
