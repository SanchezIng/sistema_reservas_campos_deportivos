import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Search, ClipboardList } from 'lucide-react';

const instalaciones = [
  {
    id: 1,
    nombre: 'Cancha de Fútbol',
    tipo: 'soccer',
    imagen: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&q=80&w=800',
    descripcion: 'Cancha de fútbol profesional con iluminación nocturna'
  },
  {
    id: 2,
    nombre: 'Cancha de Básquet',
    tipo: 'basketball',
    imagen: 'https://images.unsplash.com/photo-1505666287802-931dc83948e9?auto=format&fit=crop&q=80&w=800',
    descripcion: 'Cancha de básquet techada con piso premium'
  },
  {
    id: 3,
    nombre: 'Piscina',
    tipo: 'swimming',
    imagen: 'https://images.unsplash.com/photo-1519315901367-f34ff9154487?auto=format&fit=crop&q=80&w=800',
    descripcion: 'Piscina semiolímpica con temperatura controlada'
  }
];

export default function Home() {
  const navigate = useNavigate();

  const handleVerMas = (tipo: string) => {
    navigate(`/instalaciones?tipo=${tipo}`);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Sección Hero */}
      <section className="relative h-[600px] flex items-center justify-center text-white">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1542652694-40abf526446e?auto=format&fit=crop&q=80&w=1920)',
          }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        </div>
        
        <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
          <h1 className="text-5xl font-bold mb-6">Reserva tu Espacio Deportivo</h1>
          <p className="text-xl mb-8">Reserva fácilmente canchas de fútbol, básquet y piscinas en línea</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/instalaciones"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-colors"
            >
              Reservar Ahora
            </Link>
            <Link
              to="/disponibilidad"
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 rounded-lg font-semibold text-lg transition-colors"
            >
              Ver Disponibilidad
            </Link>
          </div>
        </div>
      </section>

      {/* Sección Características */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">¿Cómo Funciona?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <Search className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Encuentra tu Espacio</h3>
              <p className="text-gray-600">Explora nuestras instalaciones disponibles y verifica la disponibilidad en tiempo real</p>
            </div>
            <div className="text-center p-6">
              <Calendar className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Reserva tu Horario</h3>
              <p className="text-gray-600">Selecciona la fecha y hora que prefieras para la instalación</p>
            </div>
            <div className="text-center p-6">
              <ClipboardList className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Confirma y Juega</h3>
              <p className="text-gray-600">Recibe confirmación instantánea y prepárate para jugar</p>
            </div>
          </div>
        </div>
      </section>

      {/* Sección Instalaciones */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Nuestras Instalaciones</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {instalaciones.map((instalacion) => (
              <div key={instalacion.id} className="bg-white rounded-lg shadow-md overflow-hidden transform transition-transform duration-300 hover:scale-105">
                <img 
                  src={instalacion.imagen} 
                  alt={instalacion.nombre}
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{instalacion.nombre}</h3>
                  <p className="text-gray-600 mb-4">{instalacion.descripcion}</p>
                  <button
                    onClick={() => handleVerMas(instalacion.tipo)}
                    className="text-blue-600 hover:text-blue-700 font-medium flex items-center group"
                  >
                    Ver Más 
                    <span className="transform transition-transform duration-300 group-hover:translate-x-2">→</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}