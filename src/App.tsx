import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
import MapPage from './pages/MapPage';
import ServicesPage from './pages/ServicesPage';
import ServiceDetailPage from './pages/ServiceDetailPage';
import RequestPage from './pages/RequestPage';
import TrackingSearchPage from './pages/TrackingSearchPage';
import TrackPage from './pages/TrackPage';
import AboutPage from './pages/AboutPage';
import ResourcesPage from './pages/ResourcesPage';
import ResourceDetailPage from './pages/ResourceDetailPage';
import LoginPage from './pages/LoginPage';
import ProviderLayout from './components/ProviderLayout';
import ProviderDashboard from './pages/provider/Dashboard';
import ProviderRequests from './pages/provider/Requests';
import ProviderRequestDetail from './pages/provider/RequestDetail';
import ProviderProfile from './pages/provider/Profile';
import ProviderStats from './pages/provider/Stats';

function App() {
  const location = useLocation();
  const isProviderPage = location.pathname.startsWith('/provider');
  const isMap = location.pathname === '/map';
  const isLogin = location.pathname === '/login';

  // Hide Navbar and Footer on Dashboard and Map (Map has its own sidebar)
  const showNavFooter = !isProviderPage && !isMap && !isLogin;

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-rose-100 selection:text-rose-900">
      {showNavFooter && <Navbar />}
      
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/services/:id" element={<ServiceDetailPage />} />
        <Route path="/request/new" element={<RequestPage />} />
        <Route path="/track" element={<TrackingSearchPage />} />
        <Route path="/request/track/:id" element={<TrackPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/resources" element={<ResourcesPage />} />
        <Route path="/resources/:slug" element={<ResourceDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        
        <Route path="/provider" element={<ProviderLayout />}>
          <Route path="dashboard" element={<ProviderDashboard />} />
          <Route path="requests" element={<ProviderRequests />} />
          <Route path="requests/:id" element={<ProviderRequestDetail />} />
          <Route path="profile" element={<ProviderProfile />} />
          <Route path="stats" element={<ProviderStats />} />
        </Route>
      </Routes>

      {showNavFooter && <Footer />}
    </div>
  );
}

export default App;
