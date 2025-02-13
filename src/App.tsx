import React from 'react';
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


import Disponibilidad from './pages/Disponibilidad';
import AdminDashboard from './pages/Admin/Dashboard';
import GestionInstalaciones from './pages/Admin/GestionInstalaciones';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/instalaciones" element={<Instalaciones />} />
              <Route path="/instalaciones/:id" element={<DetalleInstalacion />} />
              <Route path="/reservar" element={<Reservar />} />
              <Route path="/login" element={<Login />} />
              <Route path="/registro" element={<Registro />} />
              <Route path="/disponibilidad" element={<Disponibilidad />} />
              <Route path="/admin" element={<AdminDashboard />} />
              
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;