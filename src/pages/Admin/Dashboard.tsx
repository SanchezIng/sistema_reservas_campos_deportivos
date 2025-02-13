
import { useNavigate } from 'react-router-dom';
import { BarChart3, Users, Calendar, Settings, ClipboardList } from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();

  const stats = [
    {
      title: 'Reservas Totales',
      value: '156',
      change: '+12%',
      icon: Calendar
    },
    {
      title: 'Usuarios Activos',
      value: '2,345',
      change: '+3.2%',
      icon: Users
    },
    {
      title: 'Ingresos Mensuales',
      value: 'S/ 12,456',
      change: '+8.1%',
      icon: BarChart3
    }
  ];

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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Panel de Administración</h1>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, index) => {
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