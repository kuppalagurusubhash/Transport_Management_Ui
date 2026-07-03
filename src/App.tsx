import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
import { LoadingParties } from './pages/LoadingParties';
import { UnloadingParties } from './pages/UnloadingParties';
import { UnloadingPartyDetail } from './pages/UnloadingPartyDetail';
import { DistrictRates } from './pages/DistrictRates';
import { StoneRates } from './pages/StoneRates';
import { BuyerPortal } from './pages/BuyerPortal';
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
export function App() {
  return (
    <OrdersProvider>
      <BrowserRouter>
        <Routes>
          {/* Buyer (Kerala party) portal — separate from the owner layout */}
          <Route path="/buyer" element={<BuyerPortal />} />

          {/* Owner dashboard */}
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
              path="/loading-parties"
              element={
              <Page>
                  <LoadingParties />
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
            
          </Route>
        </Routes>
      </BrowserRouter>
    </OrdersProvider>);

}