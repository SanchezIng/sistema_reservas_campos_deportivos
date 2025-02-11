import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, User, LogIn, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">DeporteYa</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link to="/instalaciones" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
              Instalaciones
            </Link>
            <Link to="/disponibilidad" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
              Disponibilidad
            </Link>
            
            {isAuthenticated ? (
              <>
                <div className="flex items-center text-gray-700">
                  <User className="h-5 w-5 mr-1" />
                  <span className="text-sm font-medium">{user?.nombreCompleto}</span>
                </div>
                <button
                  onClick={logout}
                  className="inline-flex items-center text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  <LogOut className="h-5 w-5 mr-1" />
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <Link to="/login" className="inline-flex items-center text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                <LogIn className="h-5 w-5 mr-1" />
                Iniciar Sesión
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}