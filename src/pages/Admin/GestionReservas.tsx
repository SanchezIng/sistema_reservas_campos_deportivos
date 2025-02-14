import { useState, useEffect } from 'react';
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { config } from '../../config/env';

interface Reserva {
  id: string;
  instalacion_nombre: string;
  usuario_nombre: string;
  hora_inicio: string;
  hora_fin: string;
  estado: 'pendiente' | 'confirmada' | 'cancelada';
  precio_total: number;
}

type TipoFiltroFecha = 'dia' | 'mes' | 'año' | 'intervalo';

export default function GestionReservas() {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tipoFiltroFecha, setTipoFiltroFecha] = useState<TipoFiltroFecha>('dia');
  const [filtroFecha, setFiltroFecha] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [filtroMes, setFiltroMes] = useState(format(new Date(), 'yyyy-MM'));
  const [filtroAño, setFiltroAño] = useState(format(new Date(), 'yyyy'));
  const [fechaInicio, setFechaInicio] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [fechaFin, setFechaFin] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [filtroEstado, setFiltroEstado] = useState('todos');

  useEffect(() => {
    const fetchReservas = async () => {
      try {
        setLoading(true);
        let url = `${config.apiUrl}/api/reservas/admin?estado=${filtroEstado}`;

        switch (tipoFiltroFecha) {
          case 'dia':
            url += `&fecha=${filtroFecha}`;
            break;
          case 'mes':
            url += `&mes=${filtroMes}`;
            break;
          case 'año':
            url += `&año=${filtroAño}`;
            break;
          case 'intervalo':
            url += `&fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`;
            break;
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error('Error al cargar las reservas');
        const data = await response.json();
        setReservas(data.data);
      } catch (err) {
        console.error('Error:', err);
        setError('Error al cargar las reservas. Por favor, intenta nuevamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchReservas();
  }, [filtroFecha, filtroMes, filtroAño, fechaInicio, fechaFin, filtroEstado, tipoFiltroFecha]);

  const actualizarEstadoReserva = async (id: string, nuevoEstado: string) => {
    try {
      const response = await fetch(`${config.apiUrl}/api/reservas/${id}/estado`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      if (!response.ok) throw new Error('Error al actualizar el estado');

      setReservas(prev =>
        prev.map(reserva =>
          reserva.id === id ? { ...reserva, estado: nuevoEstado as any } : reserva
        )
      );
    } catch (err) {
      console.error('Error:', err);
      setError('Error al actualizar el estado de la reserva');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Gestión de Reservas</h1>

      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-700 hover:text-red-900"
          >
            ×
          </button>
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-4">
        {/* Selector de tipo de filtro */}
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-500" />
          <select
            value={tipoFiltroFecha}
            onChange={(e) => setTipoFiltroFecha(e.target.value as TipoFiltroFecha)}
            className="border rounded-lg px-3 py-2"
          >
            <option value="dia">Por Día</option>
            <option value="mes">Por Mes</option>
            <option value="año">Por Año</option>
            <option value="intervalo">Por Intervalo</option>
          </select>
        </div>

        {/* Filtros de fecha según el tipo seleccionado */}
        {tipoFiltroFecha === 'dia' && (
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-gray-500" />
            <input
              type="date"
              value={filtroFecha}
              onChange={(e) => setFiltroFecha(e.target.value)}
              className="border rounded-lg px-3 py-2"
            />
          </div>
        )}

        {tipoFiltroFecha === 'mes' && (
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-gray-500" />
            <input
              type="month"
              value={filtroMes}
              onChange={(e) => setFiltroMes(e.target.value)}
              className="border rounded-lg px-3 py-2"
            />
          </div>
        )}

        {tipoFiltroFecha === 'año' && (
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-gray-500" />
            <input
              type="number"
              value={filtroAño}
              onChange={(e) => setFiltroAño(e.target.value)}
              min="2000"
              max="2100"
              className="border rounded-lg px-3 py-2 w-24"
            />
          </div>
        )}

        {tipoFiltroFecha === 'intervalo' && (
          <>
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-gray-500" />
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="border rounded-lg px-3 py-2"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-gray-500" />
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="border rounded-lg px-3 py-2"
              />
            </div>
          </>
        )}

        <div className="flex items-center space-x-2">
          <CheckCircle className="h-5 w-5 text-gray-500" />
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="border rounded-lg px-3 py-2"
          >
            <option value="todos">Todos los estados</option>
            <option value="pendiente">Pendientes</option>
            <option value="confirmada">Confirmadas</option>
            <option value="cancelada">Canceladas</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Instalación
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Usuario
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Fecha y Hora
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reservas.map((reserva) => (
              <tr key={reserva.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {reserva.instalacion_nombre}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {reserva.usuario_nombre}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex flex-col">
                    <span>{format(new Date(reserva.hora_inicio), 'PPP', { locale: es })}</span>
                    <span className="text-xs text-gray-400">
                      {format(new Date(reserva.hora_inicio), 'HH:mm')} - 
                      {format(new Date(reserva.hora_fin), 'HH:mm')}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    reserva.estado === 'confirmada' ? 'bg-green-100 text-green-800' :
                    reserva.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {reserva.estado}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  S/ {reserva.precio_total}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {reserva.estado === 'pendiente' && (
                    <>
                      <button
                        onClick={() => actualizarEstadoReserva(reserva.id, 'confirmada')}
                        className="text-green-600 hover:text-green-900 mr-3"
                        title="Confirmar reserva"
                      >
                        <CheckCircle className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => actualizarEstadoReserva(reserva.id, 'cancelada')}
                        className="text-red-600 hover:text-red-900"
                        title="Cancelar reserva"
                      >
                        <XCircle className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}