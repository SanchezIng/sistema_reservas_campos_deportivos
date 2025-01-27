import React from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Contáctanos</h3>
            <div className="space-y-2">
              <p className="flex items-center">
                <Phone className="h-5 w-5 mr-2" />
                +51 (01) 123-4567
              </p>
              <p className="flex items-center">
                <Mail className="h-5 w-5 mr-2" />
                contacto@deporteya.com
              </p>
              <p className="flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Av. Deportiva 123, Lima
              </p>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Enlaces Rápidos</h3>
            <ul className="space-y-2">
              <li><a href="/nosotros" className="hover:text-blue-400">Sobre Nosotros</a></li>
              <li><a href="/instalaciones" className="hover:text-blue-400">Nuestras Instalaciones</a></li>
              <li><a href="/preguntas" className="hover:text-blue-400">Preguntas Frecuentes</a></li>
              <li><a href="/contacto" className="hover:text-blue-400">Contacto</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Horario de Atención</h3>
            <ul className="space-y-2">
              <li>Lunes - Viernes: 6:00 - 22:00</li>
              <li>Sábados: 7:00 - 21:00</li>
              <li>Domingos: 8:00 - 20:00</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-700 text-center">
          <p>&copy; {new Date().getFullYear()} DeporteYa. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}