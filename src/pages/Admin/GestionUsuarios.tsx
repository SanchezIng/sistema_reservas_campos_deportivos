import { useState, useEffect } from 'react';
import { Trash2, Shield, ShieldOff, Search, AlertCircle } from 'lucide-react';
import { getUsuarios, actualizarRolUsuario, eliminarUsuario, type Usuario } from '../../lib/services/usuarios';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    const cargarUsuarios = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getUsuarios();
        setUsuarios(data);
      } catch (err) {
        console.error('Error al cargar usuarios:', err);
        setError('Error al cargar los usuarios. Por favor, intenta nuevamente.');
      } finally {
        setLoading(false);
      }
    };

    cargarUsuarios();
  }, []);

  const handleToggleRole = async (id: string, currentRole: 'admin' | 'user') => {
    try {
      const newRole = currentRole === 'admin' ? 'user' : 'admin';
      await actualizarRolUsuario(id, newRole);
      setUsuarios(usuarios.map(user => 
        user.id === id ? { ...user, role: newRole } : user
      ));
    } catch (err) {
      console.error('Error al actualizar rol:', err);
      setError('Error al actualizar el rol del usuario');
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await eliminarUsuario(id);
      setUsuarios(usuarios.filter(user => user.id !== id));
      setConfirmDelete(null);
    } catch (err) {
      console.error('Error al eliminar usuario:', err);
      setError('Error al eliminar el usuario');
    }
  };

  const usuariosFiltrados = usuarios.filter(usuario =>
    usuario.nombre_completo.toLowerCase().includes(busqueda.toLowerCase()) ||
    usuario.email.toLowerCase().includes(busqueda.toLowerCase())
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
      <h1 className="text-3xl font-bold mb-8">Gestión de Usuarios</h1>

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

      <div className="mb-6 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Buscar por nombre o email..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="pl-10 w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {usuarios.length === 0 && !error ? (
        <div className="text-center py-8 text-gray-500">
          No hay usuarios para mostrar
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha de Registro
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {usuariosFiltrados.map((usuario) => (
                <tr key={usuario.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {usuario.nombre_completo}
                      </div>
                      <div className="text-sm text-gray-500">{usuario.email}</div>
                      {usuario.telefono && (
                        <div className="text-sm text-gray-500">{usuario.telefono}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      usuario.role === 'admin' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {usuario.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(usuario.created_at), 'PPpp', { locale: es })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleToggleRole(usuario.id, usuario.role)}
                      className={`mr-3 ${
                        usuario.role === 'admin' 
                          ? 'text-purple-600 hover:text-purple-900' 
                          : 'text-green-600 hover:text-green-900'
                      }`}
                      title={usuario.role === 'admin' ? 'Quitar admin' : 'Hacer admin'}
                    >
                      {usuario.role === 'admin' ? (
                        <ShieldOff className="h-5 w-5" />
                      ) : (
                        <Shield className="h-5 w-5" />
                      )}
                    </button>
                    <button
                      onClick={() => setConfirmDelete(usuario.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Eliminar usuario"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Confirmar eliminación</h3>
            <p className="mb-6">¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={() => confirmDelete && handleDeleteUser(confirmDelete)}
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