import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { OrdersProvider } from './store/OrdersContext';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { Overview } from './pages/Overview';
import { Orders } from './pages/Orders';
import { Trips } from './pages/Trips';
import { TripDetail } from './pages/TripDetail';
import { Fleet } from './pages/Fleet';
import { FleetDetail } from './pages/FleetDetail';
import { Drivers } from './pages/Drivers';
import { DriverDetail } from './pages/DriverDetail';
import { LoadingParties } from './pages/LoadingParties';
import { UnloadingParties } from './pages/UnloadingParties';
import { UnloadingPartyDetail } from './pages/UnloadingPartyDetail';
import { LoadingPartyDetail } from './pages/LoadingPartyDetail';
import { DistrictRates } from './pages/DistrictRates';
import { StoneRates } from './pages/StoneRates';
import { BuyerPortal } from './pages/BuyerPortal';
import { LoadingPortal } from './pages/LoadingPortal';
import { DriverPortal } from './pages/DriverPortal';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Settings } from './pages/Settings';


function Page({ children }: {children: React.ReactNode;}) {
  return (
    <motion.div
      initial={{
        opacity: 0
      }}
      animate={{
        opacity: 1
      }}
      transition={{
        duration: 0.25
      }}
      className="min-h-full">
      
      {children}
    </motion.div>);

}

function ProtectedRoute({ allowedRoles }: { allowedRoles?: string[] }) {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const role = localStorage.getItem('userRole');

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    if (role === 'driver') return <Navigate to="/driver" replace />;
    if (role === 'loading') return <Navigate to="/loading" replace />;
    if (role === 'buyer') return <Navigate to="/buyer" replace />;
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export function App() {
  return (
    <OrdersProvider>
      <BrowserRouter>
        <Routes>
          {/* Login screen */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Buyer (Kerala party) portal — separate from the owner layout */}
          <Route element={<ProtectedRoute allowedRoles={['buyer', 'owner']} />}>
            <Route path="/buyer" element={<BuyerPortal />} />
            <Route path="/buyer/*" element={<BuyerPortal />} />
          </Route>

          {/* Loading Party Portal */}
          <Route element={<ProtectedRoute allowedRoles={['loading', 'owner']} />}>
            <Route path="/loading" element={<LoadingPortal />} />
          </Route>

          {/* Driver Portal */}
          <Route element={<ProtectedRoute allowedRoles={['driver', 'owner']} />}>
            <Route path="/driver" element={<DriverPortal />} />
            <Route path="/driver/*" element={<DriverPortal />} />
          </Route>

          {/* Owner dashboard (protected) */}
          <Route element={<ProtectedRoute allowedRoles={['owner']} />}>
            <Route element={<DashboardLayout />}>
              <Route index element={<Overview />} />
              <Route
                path="/orders"
                element={
                <Page>
                    <Orders />
                  </Page>
                } />
              
              <Route
                path="/trips"
                element={
                <Page>
                    <Trips />
                  </Page>
                } />
              
              <Route
                path="/trips/:tripId"
                element={
                <Page>
                    <TripDetail />
                  </Page>
                } />
              
              <Route
                path="/fleet"
                element={
                <Page>
                    <Fleet />
                  </Page>
                } />
              
              <Route
                path="/fleet/:lorryId"
                element={
                <Page>
                    <FleetDetail />
                  </Page>
                } />
              
              <Route
                path="/drivers"
                element={
                <Page>
                    <Drivers />
                  </Page>
                } />
              
              <Route
                path="/drivers/:driverId"
                element={
                <Page>
                    <DriverDetail />
                  </Page>
                } />
              
              <Route
                path="/loading-parties"
                element={
                <Page>
                    <LoadingParties />
                  </Page>
                } />
              
              <Route
                path="/loading-parties/:partyId"
                element={
                <Page>
                    <LoadingPartyDetail />
                  </Page>
                } />
              
              <Route
                path="/unloading-parties"
                element={
                <Page>
                    <UnloadingParties />
                  </Page>
                } />
              
              <Route
                path="/unloading-parties/:partyId"
                element={
                <Page>
                    <UnloadingPartyDetail />
                  </Page>
                } />
              
              <Route
                path="/district-rates"
                element={
                <Page>
                    <DistrictRates />
                  </Page>
                } />
              
              <Route
                path="/rates"
                element={
                <Page>
                    <StoneRates />
                  </Page>
                } />
              
              <Route
                path="/settings"
                element={
                <Page>
                    <Settings />
                  </Page>
                } />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </OrdersProvider>);

}