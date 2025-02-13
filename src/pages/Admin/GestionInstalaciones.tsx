import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import {
  getInstalaciones,
  deleteInstalacion,
  type Instalacion
} from '../../lib/services/instalaciones';

export default function GestionInstalaciones() {
  const [instalaciones, setInstalaciones] = useState<Instalacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInstalaciones = async () => {
      try {
        const data = await getInstalaciones();
        setInstalaciones(data);
      } catch (err) {
        setError('Error al cargar las instalaciones');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchInstalaciones();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta instalación?')) return;
    try {
      await deleteInstalacion(id);
      setInstalaciones((prev) => prev.filter(inst => inst.id !== id));
    } catch (err) {
      setError('Error al eliminar la instalación');
      console.error(err);
    }
  };

  if (loading) return <div className="p-6">Cargando...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestión de Instalaciones</h1>
        <button
          onClick={() => alert('Funcionalidad en desarrollo')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nueva Instalación
        </button>
      </div>

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
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{instalacion.nombre}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{instalacion.tipo}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    instalacion.estado === 'disponible' ? 'bg-green-100 text-green-800' :
                    instalacion.estado === 'mantenimiento' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {instalacion.estado}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">S/ {instalacion.precio_por_hora}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button onClick={() => alert('Edición en desarrollo')} className="text-blue-600 hover:text-blue-900 mr-3">
                    <Edit2 className="h-5 w-5" />
                  </button>
                  <button onClick={() => handleDelete(instalacion.id)} className="text-red-600 hover:text-red-900">
                    <Trash2 className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
