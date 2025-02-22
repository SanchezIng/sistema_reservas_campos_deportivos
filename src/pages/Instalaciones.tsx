import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Filter, Clock, MapPin, CheckCircle, XCircle } from 'lucide-react';
import { config } from '../config/env';

interface Instalacion {
  id: string;
  nombre: string;
  tipo: string;
  superficie: string | null;
  descripcion: string;
  precio_por_hora: number;
  imagen_url: string;
  estado: 'disponible' | 'ocupado' | 'mantenimiento';
}

const EstadoIndicador = ({ estado }: { estado: string }) => {
  const getEstadoConfig = () => {
    switch (estado) {
      case 'disponible': return { icon: CheckCircle, color: 'text-green-500', texto: 'Disponible' };
      case 'ocupado': return { icon: XCircle, color: 'text-red-500', texto: 'Ocupado' };
      case 'mantenimiento': return { icon: Clock, color: 'text-yellow-500', texto: 'En Mantenimiento' };
      default: return { icon: CheckCircle, color: 'text-gray-500', texto: estado };
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
  const [searchParams] = useSearchParams();
  const tipoInicial = searchParams.get('tipo') || 'todos';
  
  const [instalaciones, setInstalaciones] = useState<Instalacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroTipo, setFiltroTipo] = useState(tipoInicial);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInstalaciones = async () => {
      try {
        const response = await fetch(`${config.apiUrl}/api/instalaciones`);
        if (!response.ok) {
          throw new Error('Error al cargar las instalaciones');
        }
        const data = await response.json();
        setInstalaciones(data.data || []);
      } catch (err) {
        console.error('Error:', err);
        setError('Error al cargar las instalaciones. Por favor, intenta nuevamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchInstalaciones();
  }, []);

  // Actualizar la URL cuando cambia el filtro
  useEffect(() => {
    if (filtroTipo === 'todos') {
      navigate('/instalaciones', { replace: true });
    } else {
      navigate(`/instalaciones?tipo=${filtroTipo}`, { replace: true });
    }
  }, [filtroTipo, navigate]);

  const instalacionesFiltradas = instalaciones.filter(inst => 
    (filtroTipo === 'todos' || inst.tipo === filtroTipo) &&
    (filtroEstado === 'todos' || inst.estado === filtroEstado)
  );

  const handleReservarClick = (instalacionId: string) => {
    navigate(`/reservar?instalacion=${instalacionId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

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
            <option value="volleyball">Volleyball</option>
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
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {instalacionesFiltradas.map((instalacion) => (
          <div key={instalacion.id} className="bg-white rounded-lg shadow-lg overflow-hidden transform transition-transform duration-300 hover:scale-105">
            <img
              src={instalacion.imagen_url}
              alt={instalacion.nombre}
              className="w-full h-56 object-cover"
            />
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-2">{instalacion.nombre}</h3>
              <div className="space-y-2 mb-4">
                <EstadoIndicador estado={instalacion.estado} />
                <div className="flex items-center text-gray-600">
                  <MapPin className="w-5 h-5 mr-1" />
                  <span>{instalacion.superficie || 'No especificada'}</span>
                </div>
                <p className="text-gray-600">{instalacion.descripcion}</p>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-blue-600">
                  S/ {instalacion.precio_por_hora}/hora
                </span>
                <button
                  onClick={() => handleReservarClick(instalacion.id)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    instalacion.estado === 'disponible'
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  }`}
                  disabled={instalacion.estado !== 'disponible'}
                >
                  {instalacion.estado === 'disponible' ? 'Reservar' : 'No Disponible'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}