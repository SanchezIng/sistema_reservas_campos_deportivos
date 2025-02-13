import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, Search } from 'lucide-react';
import { format, addDays, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { config } from '../config/env';

interface TimeSlot {
  hora: string;
  disponible: boolean;
}

interface Instalacion {
  id: string;
  nombre: string;
  tipo: string;
  hora_apertura: string;
  hora_cierre: string;
  slots: TimeSlot[];
}

export default function Disponibilidad() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedType, setSelectedType] = useState('todos');
  const [instalaciones, setInstalaciones] = useState<Instalacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Generar días de la semana
  const weekDays = Array.from({ length: 7 }, (_, i) => 
    addDays(startOfWeek(selectedDate, { weekStartsOn: 1 }), i)
  );

  useEffect(() => {
    const fetchDisponibilidad = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${config.apiUrl}/api/disponibilidad?fecha=${format(selectedDate, 'yyyy-MM-dd')}`
        );
        
        if (!response.ok) {
          throw new Error('Error al cargar la disponibilidad');
        }
        
        const data = await response.json();
        setInstalaciones(data.data || []);
      } catch (err) {
        console.error('Error:', err);
        setError('Error al cargar la disponibilidad. Por favor, intenta nuevamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchDisponibilidad();
  }, [selectedDate]);

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

  const instalacionesFiltradas = instalaciones.filter(
    inst => selectedType === 'todos' || inst.tipo === selectedType
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Disponibilidad de Instalaciones</h1>

      {/* Filtros */}
      <div className="mb-8 flex flex-wrap gap-4">
        <div className="flex items-center space-x-2">
          <CalendarIcon className="h-5 w-5 text-gray-500" />
          <input
            type="date"
            value={format(selectedDate, 'yyyy-MM-dd')}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            className="border rounded-md px-3 py-2"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Search className="h-5 w-5 text-gray-500" />
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="border rounded-md px-3 py-2"
          >
            <option value="todos">Todas las instalaciones</option>
            <option value="soccer">Fútbol</option>
            <option value="basketball">Básquet</option>
            <option value="swimming">Natación</option>
            <option value="volleyball">Volleyball</option>
          </select>
        </div>
      </div>

      {/* Calendario semanal */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="grid grid-cols-8 border-b">
          <div className="p-4 font-semibold text-gray-600 border-r">Hora</div>
          {weekDays.map((day) => (
            <div key={format(day, 'yyyy-MM-dd')} className="p-4 text-center">
              <div className="font-semibold">{format(day, 'EEEE', { locale: es })}</div>
              <div className="text-sm text-gray-600">{format(day, 'd MMM')}</div>
            </div>
          ))}
        </div>

        {/* Horarios */}
        {instalacionesFiltradas.map((instalacion) => (
          <div key={instalacion.id} className="border-b last:border-b-0">
            <div className="bg-gray-50 p-4 font-semibold">
              {instalacion.nombre}
            </div>
            {instalacion.slots.map((slot, index) => (
              <div key={index} className="grid grid-cols-8 border-t">
                <div className="p-4 border-r flex items-center">
                  <Clock className="h-4 w-4 text-gray-500 mr-2" />
                  {slot.hora}
                </div>
                {Array.from({ length: 7 }).map((_, dayIndex) => {
                  const currentDate = weekDays[dayIndex];
                  const isAvailable = slot.disponible;
                  return (
                    <div
                      key={dayIndex}
                      className={`p-4 text-center ${
                        isAvailable
                          ? 'bg-green-50 text-green-800'
                          : 'bg-red-50 text-red-800'
                      }`}
                    >
                      {isAvailable ? 'Disponible' : 'Ocupado'}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}