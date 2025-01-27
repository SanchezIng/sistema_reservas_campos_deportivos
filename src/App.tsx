import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Instalaciones from './pages/Instalaciones';
import DetalleInstalacion from './pages/DetalleInstalacion';
import Reservar from './pages/Reservar';

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/instalaciones" element={<Instalaciones />} />
            <Route path="/instalaciones/:id" element={<DetalleInstalacion />} />
            <Route path="/reservar" element={<Reservar />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;