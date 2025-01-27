import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Filter, Clock, MapPin, CheckCircle, XCircle } from 'lucide-react';

const instalaciones = [
  {
    id: '1',
    nombre: 'Fútbol',
    tipo: 'soccer',
    campos: [
      {
        id: 'f1',
        nombre: 'Campo Principal - Césped Natural',
        estado: 'disponible',
        imagen: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&q=80&w=800',
        ubicacion: 'Zona Norte',
        precioPorHora: 120
      },
      {
        id: 'f2',
        nombre: 'Campo 2 - Césped Sintético',
        estado: 'ocupado',
        imagen: 'https://images.unsplash.com/photo-1459865264687-595d652de67e?auto=format&fit=crop&q=80&w=800',
        ubicacion: 'Zona Sur',
        precioPorHora: 100
      },
      {
        id: 'f3',
        nombre: 'Campo 3 - Césped Sintético',
        estado: 'disponible',
        imagen: 'https://images.unsplash.com/photo-1536122985607-4fe00b283652?auto=format&fit=crop&q=80&w=800',
        ubicacion: 'Zona Este',
        precioPorHora: 100
      }
    ]
  },
  {
    id: '2',
    nombre: 'Básquet',
    tipo: 'basketball',
    campos: [
      {
        id: 'b1',
        nombre: 'Cancha Cubierta Principal',
        estado: 'disponible',
        imagen: 'https://images.unsplash.com/photo-1505666287802-931dc83948e9?auto=format&fit=crop&q=80&w=800',
        ubicacion: 'Pabellón Central',
        precioPorHora: 80
      },
      {
        id: 'b2',
        nombre: 'Cancha Exterior 1',
        estado: 'mantenimiento',
        imagen: 'https://images.unsplash.com/photo-1544919982-b61976f0ba43?auto=format&fit=crop&q=80&w=800',
        ubicacion: 'Zona Oeste',
        precioPorHora: 60
      }
    ]
  },
  {
    id: '3',
    nombre: 'Piscinas',
    tipo: 'swimming',
    campos: [
      {
        id: 'p1',
        nombre: 'Piscina Semiolímpica',
        estado: 'disponible',
        imagen: 'https://images.unsplash.com/photo-1519315901367-f34ff9154487?auto=format&fit=crop&q=80&w=800',
        ubicacion: 'Edificio Principal',
        precioPorHora: 150
      },
      {
        id: 'p2',
        nombre: 'Piscina Recreativa',
        estado: 'ocupado',
        imagen: 'https://images.unsplash.com/photo-1576610616656-d3aa5d1f4534?auto=format&fit=crop&q=80&w=800',
        ubicacion: 'Zona Recreativa',
        precioPorHora: 100
      }
    ]
  }
];

const EstadoIndicador = ({ estado }: { estado: string }) => {
  const getEstadoConfig = () => {
    switch (estado) {
      case 'disponible':
        return { icon: CheckCircle, color: 'text-green-500', texto: 'Disponible' };
      case 'ocupado':
        return { icon: XCircle, color: 'text-red-500', texto: 'Ocupado' };
      case 'mantenimiento':
        return { icon: Clock, color: 'text-yellow-500', texto: 'En Mantenimiento' };
      default:
        return { icon: CheckCircle, color: 'text-gray-500', texto: estado };
    }
  };

  const config = getEstadoConfig();
  const Icon = config.icon;

  return (
    <div className={`flex items-center ${config.color}`}>
      <Icon className="w-5 h-5 mr-1" />
      <span>{config.texto}</span>
    </div>
  );
};

export default function Instalaciones() {
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const navigate = useNavigate();

  const instalacionesFiltradas = instalaciones
    .filter(inst => filtroTipo === 'todos' || inst.tipo === filtroTipo);

  const handleReservarClick = (deporteId: string, campoId: string) => {
    navigate(`/reservar?instalacion=${deporteId}&campo=${campoId}`);
  };

  return (
    <div className="py-8 px-4 max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold text-center mb-8">Nuestras Instalaciones</h1>
      
      {/* Filtros */}
      <div className="mb-8 flex items-center justify-center space-x-4">
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-500" />
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="border rounded-md px-3 py-2"
          >
            <option value="todos">Todos los deportes</option>
            <option value="soccer">Fútbol</option>
            <option value="basketball">Básquet</option>
            <option value="swimming">Piscinas</option>
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <Clock className="h-5 w-5 text-gray-500" />
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="border rounded-md px-3 py-2"
          >
            <option value="todos">Todos los estados</option>
            <option value="disponible">Disponible</option>
            <option value="ocupado">Ocupado</option>
            <option value="mantenimiento">En mantenimiento</option>
          </select>
        </div>
      </div>

      {/* Lista de instalaciones */}
      {instalacionesFiltradas.map((deporte) => (
        <div key={deporte.id} className="mb-12">
          <h2 className="text-2xl font-bold mb-6">{deporte.nombre}</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {deporte.campos
              .filter(campo => filtroEstado === 'todos' || campo.estado === filtroEstado)
              .map((campo) => (
                <div key={campo.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <img
                    src={campo.imagen}
                    alt={campo.nombre}
                    className="w-full h-56 object-cover"
                  />
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2">{campo.nombre}</h3>
                    <div className="space-y-2 mb-4">
                      <EstadoIndicador estado={campo.estado} />
                      <div className="flex items-center text-gray-600">
                        <MapPin className="w-5 h-5 mr-1" />
                        <span>{campo.ubicacion}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-blue-600">
                        S/ {campo.precioPorHora}/hora
                      </span>
                      <button
                        onClick={() => handleReservarClick(deporte.id, campo.id)}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          campo.estado === 'disponible'
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                        }`}
                        disabled={campo.estado !== 'disponible'}
                      >
                        {campo.estado === 'disponible' ? 'Reservar' : 'No Disponible'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}