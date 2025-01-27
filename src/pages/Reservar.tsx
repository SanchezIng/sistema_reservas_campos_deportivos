import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Calendar, Clock, User, Phone, Building } from 'lucide-react';

// Mock data for demonstration - in production this would come from your database
const instalaciones = [
  {
    id: '1',
    nombre: 'Fútbol',
    campos: [
      { id: 'f1', nombre: 'Campo Principal - Césped Natural' },
      { id: 'f2', nombre: 'Campo 2 - Césped Sintético' },
      { id: 'f3', nombre: 'Campo 3 - Césped Sintético' }
    ]
  },
  {
    id: '2',
    nombre: 'Básquet',
    campos: [
      { id: 'b1', nombre: 'Cancha Cubierta Principal' },
      { id: 'b2', nombre: 'Cancha Exterior 1' }
    ]
  },
  {
    id: '3',
    nombre: 'Piscinas',
    campos: [
      { id: 'p1', nombre: 'Piscina Semiolímpica' },
      { id: 'p2', nombre: 'Piscina Recreativa' }
    ]
  }
];

export default function Reservar() {
  const [searchParams] = useSearchParams();
  const instalacionId = searchParams.get('instalacion');
  const campoId = searchParams.get('campo');
  
  const [formData, setFormData] = useState({
    instalacion: instalacionId || '',
    campo: campoId || '',
    fecha: '',
    horaInicio: '',
    horaFin: '',
    nombre: '',
    email: '',
    telefono: ''
  });

  // Find selected facility and field
  const instalacion = instalaciones.find(i => i.id === instalacionId);
  const campo = instalacion?.campos.find(c => c.id === campoId);

  useEffect(() => {
    if (instalacionId && campoId) {
      setFormData(prev => ({
        ...prev,
        instalacion: instalacionId,
        campo: campoId
      }));
    }
  }, [instalacionId, campoId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí iría la lógica para procesar la reserva
    console.log('Datos de la reserva:', formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Realizar Reserva</h1>
      
      <div className="bg-white rounded-lg shadow-lg p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Instalación y Campo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building className="inline-block w-5 h-5 mr-2" />
                Instalación
              </label>
              <select
                name="instalacion"
                value={formData.instalacion}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-2"
                required
              >
                <option value="">Seleccione una instalación</option>
                {instalaciones.map(inst => (
                  <option key={inst.id} value={inst.id}>
                    {inst.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building className="inline-block w-5 h-5 mr-2" />
                Campo
              </label>
              <select
                name="campo"
                value={formData.campo}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-2"
                required
              >
                <option value="">Seleccione un campo</option>
                {instalaciones
                  .find(i => i.id === formData.instalacion)
                  ?.campos.map(campo => (
                    <option key={campo.id} value={campo.id}>
                      {campo.nombre}
                    </option>
                  ))}
              </select>
            </div>

            {/* Fecha y Hora */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline-block w-5 h-5 mr-2" />
                Fecha
              </label>
              <input
                type="date"
                name="fecha"
                value={formData.fecha}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-2"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="inline-block w-5 h-5 mr-2" />
                Hora de Inicio
              </label>
              <input
                type="time"
                name="horaInicio"
                value={formData.horaInicio}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="inline-block w-5 h-5 mr-2" />
                Hora de Fin
              </label>
              <input
                type="time"
                name="horaFin"
                value={formData.horaFin}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-2"
                required
              />
            </div>

            {/* Datos personales */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="inline-block w-5 h-5 mr-2" />
                Nombre Completo
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="inline-block w-5 h-5 mr-2" />
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="inline-block w-5 h-5 mr-2" />
                Teléfono
              </label>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-2"
                required
              />
            </div>
          </div>

          {/* Resumen de la reserva */}
          {instalacion && campo && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">Resumen de la Reserva</h3>
              <p>Instalación: {instalacion.nombre}</p>
              <p>Campo: {campo.nombre}</p>
            </div>
          )}

          <div className="flex justify-end mt-6">
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Confirmar Reserva
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}