import { useState, useEffect } from 'react';
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle, Filter, X, Search, Edit2, Plus } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { config } from '../../config/env';

interface Reserva {
  id: string;
  instalacion_id: string;
  instalacion_nombre: string;
  usuario_id: string;
  usuario_nombre: string;
  hora_inicio: string;
  hora_fin: string;
  estado: 'pendiente' | 'confirmada' | 'cancelada';
  precio_total: number;
}

interface FormData {
  instalacion_id: string;
  usuario_id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  estado: 'pendiente' | 'confirmada' | 'cancelada';
}

const initialFormData: FormData = {
  instalacion_id: '',
  usuario_id: '',
  fecha: format(new Date(), 'yyyy-MM-dd'),
  hora_inicio: '',
  hora_fin: '',
  estado: 'pendiente'
};

export default function GestionReservas() {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroFecha, setFiltroFecha] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [instalaciones, setInstalaciones] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    fetchReservas();
    fetchInstalaciones();
    fetchUsuarios();
  }, [filtroFecha, filtroEstado]);

  const fetchReservas = async () => {
    try {
      setLoading(true);
      let url = `${config.apiUrl}/api/reservas/admin?fecha=${filtroFecha}`;
      if (filtroEstado !== 'todos') {
        url += `&estado=${filtroEstado}`;
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

  const fetchInstalaciones = async () => {
    try {
      const response = await fetch(`${config.apiUrl}/api/instalaciones`);
      if (!response.ok) throw new Error('Error al cargar instalaciones');
      const data = await response.json();
      setInstalaciones(data.data);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const fetchUsuarios = async () => {
    try {
      const response = await fetch(`${config.apiUrl}/api/usuarios`);
      if (!response.ok) throw new Error('Error al cargar usuarios');
      const data = await response.json();
      setUsuarios(data.data);
    } catch (err) {
      console.error('Error:', err);
    }
  };

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

  const validateForm = () => {
    if (!formData.instalacion_id) {
      setError('Por favor, seleccione una instalación');
      return false;
    }
    if (!formData.usuario_id) {
      setError('Por favor, seleccione un usuario');
      return false;
    }
    if (!formData.fecha) {
      setError('Por favor, seleccione una fecha');
      return false;
    }
    if (!formData.hora_inicio) {
      setError('Por favor, seleccione una hora de inicio');
      return false;
    }
    if (!formData.hora_fin) {
      setError('Por favor, seleccione una hora de fin');
      return false;
    }
    if (!formData.estado) {
      setError('Por favor, seleccione un estado');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    try {
      const reservaData = {
        instalacion_id: formData.instalacion_id,
        usuario_id: formData.usuario_id,
        hora_inicio: `${formData.fecha}T${formData.hora_inicio}:00`,
        hora_fin: `${formData.fecha}T${formData.hora_fin}:00`,
        estado: formData.estado
      };

      const url = editingId 
        ? `${config.apiUrl}/api/reservas/${editingId}`
        : `${config.apiUrl}/api/reservas`;

      const response = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reservaData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar la reserva');
      }

      await fetchReservas();
      setShowForm(false);
      setFormData(initialFormData);
      setEditingId(null);
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'Error al guardar la reserva');
    }
  };

  const handleEdit = (reserva: Reserva) => {
    const fechaInicio = parseISO(reserva.hora_inicio);
    const fechaFin = parseISO(reserva.hora_fin);

    setFormData({
      instalacion_id: reserva.instalacion_id,
      usuario_id: reserva.usuario_id,
      fecha: format(fechaInicio, 'yyyy-MM-dd'),
      hora_inicio: format(fechaInicio, 'HH:mm'),
      hora_fin: format(fechaFin, 'HH:mm'),
      estado: reserva.estado
    });
    setEditingId(reserva.id);
    setShowForm(true);
  };

  const reservasFiltradas = reservas.filter(reserva =>
    reserva.instalacion_nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    reserva.usuario_nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

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
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-gray-500" />
          <input
            type="date"
            value={filtroFecha}
            onChange={(e) => setFiltroFecha(e.target.value)}
            className="border rounded-lg px-3 py-2"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-500" />
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

        <div className="flex-grow">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar por instalación o usuario..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-10 w-full border rounded-lg px-3 py-2"
            />
          </div>
        </div>

        <button
          onClick={() => {
            setFormData(initialFormData);
            setEditingId(null);
            setShowForm(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nueva Reserva
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingId ? 'Editar Reserva' : 'Nueva Reserva'}
              </h2>
              <button onClick={() => {
                setShowForm(false);
                setFormData(initialFormData);
                setEditingId(null);
                setError(null);
              }}>
                <X className="h-6 w-6 text-gray-500 hover:text-gray-700" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Instalación
                </label>
                <select
                  value={formData.instalacion_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, instalacion_id: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                >
                  <option value="">Seleccionar instalación</option>
                  {instalaciones.map(instalacion => (
                    <option key={instalacion.id} value={instalacion.id}>
                      {instalacion.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Usuario
                </label>
                <select
                  value={formData.usuario_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, usuario_id: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                >
                  <option value="">Seleccionar usuario</option>
                  {usuarios.map(usuario => (
                    <option key={usuario.id} value={usuario.id}>
                      {usuario.nombre_completo}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha
                </label>
                <input
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData(prev => ({ ...prev, fecha: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hora de Inicio
                  </label>
                  <input
                    type="time"
                    value={formData.hora_inicio}
                    onChange={(e) => setFormData(prev => ({ ...prev, hora_inicio: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hora de Fin
                  </label>
                  <input
                    type="time"
                    value={formData.hora_fin}
                    onChange={(e) => setFormData(prev => ({ ...prev, hora_fin: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  value={formData.estado}
                  onChange={(e) => setFormData(prev => ({ ...prev, estado: e.target.value as any }))}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="confirmada">Confirmada</option>
                  <option value="cancelada">Cancelada</option>
                </select>
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setFormData(initialFormData);
                    setEditingId(null);
                    setError(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingId ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
            {reservasFiltradas.map((reserva) => (
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
                  <button
                    onClick={() => handleEdit(reserva)}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                    title="Editar reserva"
                  >
                    <Edit2 className="h-5 w-5" />
                  </button>
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