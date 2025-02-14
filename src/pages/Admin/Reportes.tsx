import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Calendar, DollarSign, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getReporteMensual, getReportePorInstalacion, type ReporteMensual, type ReporteInstalacion } from '../../lib/services/reportes';

export default function Reportes() {
  const [fecha, setFecha] = useState(format(new Date(), 'yyyy-MM'));
  const [reporteMensual, setReporteMensual] = useState<ReporteMensual | null>(null);
  const [reporteInstalaciones, setReporteInstalaciones] = useState<ReporteInstalacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReportes = async () => {
      try {
        setLoading(true);
        setError(null);
        const [mensual, instalaciones] = await Promise.all([
          getReporteMensual(fecha),
          getReportePorInstalacion(fecha)
        ]);
        setReporteMensual(mensual);
        setReporteInstalaciones(instalaciones);
      } catch (err) {
        console.error('Error al cargar reportes:', err);
        setError('Error al cargar los reportes. Por favor, intenta nuevamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchReportes();
  }, [fecha]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Reportes y Estadísticas</h1>
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-gray-500" />
          <input
            type="month"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="border rounded-lg px-3 py-2"
          />
        </div>
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

      {reporteMensual && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-500">Total Reservas</h3>
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <p className="text-2xl font-bold">{reporteMensual.total_reservas}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-500">Ingresos Totales</h3>
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-2xl font-bold">S/ {reporteMensual.ingresos_totales}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-500">Instalación más Reservada</h3>
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <p className="text-2xl font-bold">{reporteMensual.instalacion_mas_reservada}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-500">% Ocupación</h3>
              <BarChart3 className="h-6 w-6 text-orange-600" />
            </div>
            <p className="text-2xl font-bold">{reporteMensual.porcentaje_ocupacion}%</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-6">Reporte por Instalación</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Instalación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Total Reservas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Ingresos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Horas Ocupadas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  % Ocupación
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reporteInstalaciones.map((reporte, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {reporte.instalacion}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {reporte.total_reservas}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    S/ {reporte.ingresos}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {reporte.horas_ocupadas}h
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full"
                          style={{ width: `${reporte.porcentaje_ocupacion}%` }}
                        ></div>
                      </div>
                      <span>{reporte.porcentaje_ocupacion}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}