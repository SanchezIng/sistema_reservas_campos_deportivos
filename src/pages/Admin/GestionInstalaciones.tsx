import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, AlertCircle, X } from 'lucide-react';
import {
  getInstalaciones,
  deleteInstalacion,
  createInstalacion,
  updateInstalacion,
  type Instalacion
} from '../../lib/services/instalaciones';

interface FormData {
  nombre: string;
  tipo: string;
  superficie: string;
  descripcion: string;
  precio_por_hora: number;
  imagen_url: string;
}

const initialFormData: FormData = {
  nombre: '',
  tipo: 'soccer',
  superficie: 'cesped',
  descripcion: '',
  precio_por_hora: 0,
  imagen_url: ''
};

export default function GestionInstalaciones() {
  const [instalaciones, setInstalaciones] = useState<Instalacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchInstalaciones();
  }, []);

  const fetchInstalaciones = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getInstalaciones();
      setInstalaciones(data);
    } catch (err) {
      console.error('Error al cargar instalaciones:', err);
      setError('Error al cargar las instalaciones. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteInstalacion(id);
      setInstalaciones((prev) => prev.filter(inst => inst.id !== id));
      setShowConfirmDelete(null);
    } catch (err) {
      setError('Error al eliminar la instalación');
      console.error(err);
    }
  };

  const handleEdit = (instalacion: Instalacion) => {
    setFormData({
      nombre: instalacion.nombre,
      tipo: instalacion.tipo,
      superficie: instalacion.superficie || '',
      descripcion: instalacion.descripcion || '',
      precio_por_hora: instalacion.precio_por_hora,
      imagen_url: instalacion.imagen_url || ''
    });
    setEditingId(instalacion.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateInstalacion(editingId, formData);
      } else {
        await createInstalacion(formData);
      }
      await fetchInstalaciones();
      setShowForm(false);
      setFormData(initialFormData);
      setEditingId(null);
    } catch (err) {
      console.error('Error al guardar la instalación:', err);
      setError('Error al guardar la instalación. Por favor, intenta nuevamente.');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setFormData(initialFormData);
    setEditingId(null);
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestión de Instalaciones</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nueva Instalación
        </button>
      </div>

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

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingId ? 'Editar Instalación' : 'Nueva Instalación'}
              </h2>
              <button onClick={handleCancel}>
                <X className="h-6 w-6 text-gray-500 hover:text-gray-700" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo
                </label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                >
                  <option value="soccer">Fútbol</option>
                  <option value="basketball">Básquet</option>
                  <option value="volleyball">Volleyball</option>
                  <option value="swimming">Natación</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Superficie
                </label>
                <select
                  value={formData.superficie}
                  onChange={(e) => setFormData(prev => ({ ...prev, superficie: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">Sin superficie</option>
                  <option value="cesped">Césped</option>
                  <option value="concreto">Concreto</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio por Hora (S/)
                </label>
                <input
                  type="number"
                  value={formData.precio_por_hora}
                  onChange={(e) => setFormData(prev => ({ ...prev, precio_por_hora: Number(e.target.value) }))}
                  className="w-full border rounded-lg px-3 py-2"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL de la Imagen
                </label>
                <input
                  type="url"
                  value={formData.imagen_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, imagen_url: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                />
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={handleCancel}
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio/Hora</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {instalaciones.map((instalacion) => (
              <tr key={instalacion.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {instalacion.nombre}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {instalacion.tipo}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    instalacion.estado === 'disponible' ? 'bg-green-100 text-green-800' :
                    instalacion.estado === 'mantenimiento' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {instalacion.estado}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  S/ {instalacion.precio_por_hora}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button 
                    onClick={() => handleEdit(instalacion)} 
                    className="text-blue-600 hover:text-blue-900 mr-3"
                    title="Editar instalación"
                  >
                    <Edit2 className="h-5 w-5" />
                  </button>
                  <button 
                    onClick={() => setShowConfirmDelete(instalacion.id)}
                    className="text-red-600 hover:text-red-900"
                    title="Eliminar instalación"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de confirmación de eliminación */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Confirmar eliminación</h3>
            <p className="mb-6">¿Estás seguro de que deseas eliminar esta instalación? Esta acción no se puede deshacer.</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowConfirmDelete(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={() => showConfirmDelete && handleDelete(showConfirmDelete)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}