import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Clock, Calendar, DollarSign, MapPin, CheckCircle, XCircle } from 'lucide-react';

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
        precioPorHora: 120,
        descripcion: 'Campo de fútbol profesional con césped natural de primera calidad. Perfecto para partidos oficiales y entrenamientos de alto nivel.',
        caracteristicas: [
          'Césped natural certificado',
          'Iluminación LED profesional',
          'Graderías para 500 personas',
          'Vestuarios equipados',
          'Área de calentamiento'
        ],
        horarios: {
          semana: '6:00 - 22:00',
          finDeSemana: '8:00 - 20:00'
        },
        proximasReservas: [
          { fecha: '2024-02-20', hora: '16:00 - 18:00' },
          { fecha: '2024-02-21', hora: '18:00 - 20:00' }
        ]
      },
      {
        id: 'f2',
        nombre: 'Campo 2 - Césped Sintético',
        estado: 'ocupado',
        imagen: 'https://images.unsplash.com/photo-1459865264687-595d652de67e?auto=format&fit=crop&q=80&w=800',
        ubicacion: 'Zona Sur',
        precioPorHora: 100,
        descripcion: 'Campo de fútbol con césped sintético de última generación. Ideal para partidos amateur y entrenamientos.',
        caracteristicas: [
          'Césped sintético profesional',
          'Iluminación nocturna',
          'Vestuarios',
          'Área de hidratación',
          'Estacionamiento cercano'
        ],
        horarios: {
          semana: '6:00 - 22:00',
          finDeSemana: '8:00 - 20:00'
        },
        proximasReservas: [
          { fecha: '2024-02-20', hora: '15:00 - 17:00' }
        ]
      }
      // ... otros campos
    ]
  },
  // ... otros deportes
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

export default function DetalleInstalacion() {
  const { id, campoId } = useParams();
  const deporte = instalaciones.find(d => d.id === id);
  const campo = deporte?.campos.find(c => c.id === campoId);

  if (!deporte || !campo) {
    return <div className="text-center py-12">Instalación no encontrada</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="md:flex">
          <div className="md:w-1/2">
            <img
              src={campo.imagen}
              alt={campo.nombre}
              className="w-full h-96 object-cover"
            />
          </div>
          <div className="md:w-1/2 p-8">
            <div className="flex justify-between items-start mb-4">
              <h1 className="text-3xl font-bold">{campo.nombre}</h1>
              <EstadoIndicador estado={campo.estado} />
            </div>
            
            <div className="flex items-center text-gray-600 mb-4">
              <MapPin className="w-5 h-5 mr-2" />
              <span>{campo.ubicacion}</span>
            </div>
            
            <p className="text-gray-600 mb-6">{campo.descripcion}</p>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-blue-600 mr-2" />
                <div>
                  <p className="font-semibold">Horario entre semana</p>
                  <p className="text-gray-600">{campo.horarios.semana}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-blue-600 mr-2" />
                <div>
                  <p className="font-semibold">Fin de semana</p>
                  <p className="text-gray-600">{campo.horarios.finDeSemana}</p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-3">Características</h3>
              <ul className="grid grid-cols-2 gap-2">
                {campo.caracteristicas.map((caracteristica, index) => (
                  <li key={index} className="flex items-center text-gray-600">
                    <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                    {caracteristica}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-3">Próximas Reservas</h3>
              <ul className="space-y-2">
                {campo.proximasReservas.map((reserva, index) => (
                  <li key={index} className="text-gray-600">
                    {reserva.fecha}: {reserva.hora}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <DollarSign className="h-6 w-6 text-blue-600 mr-2" />
                <span className="text-2xl font-bold">S/ {campo.precioPorHora}/hora</span>
              </div>
              {campo.estado === 'disponible' && (
                <Link
                  to={`/reservar?instalacion=${id}&campo=${campo.id}`}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Reservar Ahora
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}