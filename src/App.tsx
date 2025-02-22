import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Instalaciones from './pages/Instalaciones';
import DetalleInstalacion from './pages/DetalleInstalacion';
import Reservar from './pages/Reservar';
import Login from './pages/Login';
import Registro from './pages/Registro';
import RecuperarPassword from './pages/RecuperarPassword';
import RestablecerPassword from './pages/RestablecerPassword';
import Disponibilidad from './pages/Disponibilidad';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';

// Lazy loading para componentes de administración
const AdminDashboard = lazy(() => import('./pages/Admin/Dashboard'));
const GestionInstalaciones = lazy(() => import('./pages/Admin/GestionInstalaciones'));
const GestionUsuarios = lazy(() => import('./pages/Admin/GestionUsuarios'));
const GestionReservas = lazy(() => import('./pages/Admin/GestionReservas'));
const Reportes = lazy(() => import('./pages/Admin/Reportes'));

// Componente de carga
const LoadingSpinner = () => (
  <div className="flex justify-center items-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-grow">
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/instalaciones" element={<Instalaciones />} />
                <Route path="/instalaciones/:id" element={<DetalleInstalacion />} />
                <Route path="/reservar" element={<Reservar />} />
                <Route path="/login" element={<Login />} />
                <Route path="/registro" element={<Registro />} />
                <Route path="/recuperar-password" element={<RecuperarPassword />} />
                <Route path="/restablecer-password" element={<RestablecerPassword />} />
                <Route path="/disponibilidad" element={<Disponibilidad />} />
                
                {/* Rutas protegidas de administrador */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedAdminRoute>
                      <AdminDashboard />
                    </ProtectedAdminRoute>
                  }
                />
                <Route
                  path="/admin/instalaciones"
                  element={
                    <ProtectedAdminRoute>
                      <GestionInstalaciones />
                    </ProtectedAdminRoute>
                  }
                />
                <Route
                  path="/admin/usuarios"
                  element={
                    <ProtectedAdminRoute>
                      <GestionUsuarios />
                    </ProtectedAdminRoute>
                  }
                />
                <Route
                  path="/admin/reservas"
                  element={
                    <ProtectedAdminRoute>
                      <GestionReservas />
                    </ProtectedAdminRoute>
                  }
                />
                <Route
                  path="/admin/reportes"
                  element={
                    <ProtectedAdminRoute>
                      <Reportes />
                    </ProtectedAdminRoute>
                  }
                />
              </Routes>
            </Suspense>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;