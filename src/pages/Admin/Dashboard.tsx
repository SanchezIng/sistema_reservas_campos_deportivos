import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Users, Calendar, Settings, ClipboardList } from 'lucide-react';
import { getDashboardStats, type DashboardStats } from '../../lib/services/dashboard';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await getDashboardStats();
        setStats(data);
      } catch (err) {
        console.error('Error al cargar estadísticas:', err);
        setError('Error al cargar las estadísticas del dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const menuItems = [
    {
      title: 'Gestionar Instalaciones',
      icon: Settings,
      path: '/admin/instalaciones'
    },
    {
      title: 'Gestionar Usuarios',
      icon: Users,
      path: '/admin/usuarios'
    },
    {
      title: 'Gestionar Reservas',
      icon: Calendar,
      path: '/admin/reservas'
    },
    {
      title: 'Reportes',
      icon: ClipboardList,
      path: '/admin/reportes'
    }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Reservas Totales',
      value: stats?.total_reservas.toString() || '0',
      change: stats?.cambio_reservas || '+0%',
      icon: Calendar
    },
    {
      title: 'Usuarios Activos',
      value: stats?.usuarios_activos.toString() || '0',
      change: stats?.cambio_usuarios || '+0%',
      icon: Users
    },
    {
      title: 'Ingresos Mensuales',
      value: `S/ ${stats?.ingresos_mensuales.toLocaleString() || '0'}`,
      change: stats?.cambio_ingresos || '+0%',
      icon: BarChart3
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Panel de Administración</h1>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <Icon className="h-8 w-8 text-blue-600" />
              </div>
              <p className={`mt-2 ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                {stat.change} vs mes anterior
              </p>
            </div>
          );
        })}
      </div>

      {/* Menú de Gestión */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={index}
              onClick={() => navigate(item.path)}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <Icon className="h-8 w-8 text-blue-600 mb-3" />
              <h3 className="text-lg font-semibold">{item.title}</h3>
            </button>
          );
        })}
      </div>
    </div>
  );
}