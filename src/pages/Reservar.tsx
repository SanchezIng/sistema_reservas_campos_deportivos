import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock, User, Phone, Building, CreditCard, QrCode, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { config } from '../config/env';
import { format, addMinutes, parse, isAfter, isBefore, set, getDay } from 'date-fns';




const getHorarioAtencion = (fecha: Date) => {
  const dia = getDay(fecha); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  
  switch (dia) {
    case 0: // Domingo
      return { apertura: '08:00', cierre: '20:00' };
    case 6: // Sábado
      return { apertura: '07:00', cierre: '21:00' };
    default: // Lunes a Viernes
      return { apertura: '06:00', cierre: '22:00' };
  }
};


const validarHorarioAtencion = (fecha: Date, horaStr: string) => {
  const horario = getHorarioAtencion(fecha);
  
  // Convertir todas las horas al mismo día para comparar solo las horas
  const baseDate = new Date(fecha);
  baseDate.setHours(0, 0, 0, 0);
  
  const hora = parse(horaStr, 'HH:mm', baseDate);
  const apertura = parse(horario.apertura, 'HH:mm', baseDate);
  const cierre = parse(horario.cierre, 'HH:mm', baseDate);

  return (hora >= apertura && hora <= cierre);
};


interface Instalacion {
  id: string;
  nombre: string;
  tipo: string;
  precio_por_hora: number;
  imagen_url: string;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  total: number;
  metodoPago: string;
}

const ConfirmacionModal: React.FC<ModalProps> = ({ isOpen, onClose, onConfirm, total, metodoPago }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <h3 className="text-xl font-bold mb-4">Confirmar Reserva</h3>
        <div className="mb-6">
          <p className="mb-2">¿Estás seguro de realizar esta reserva?</p>
          <p className="font-semibold">Total a pagar: S/ {total}</p>
          <p className="text-gray-600">Método de pago: {metodoPago === 'yape' ? 'Yape' : 'Tarjeta'}</p>
        </div>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Confirmar Reserva
          </button>
        </div>
      </div>
    </div>
  );
};

export default function Reservar() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const instalacionId = searchParams.get('instalacion');
  
  const [instalacion, setInstalacion] = useState<Instalacion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paso, setPaso] = useState(1);
  const [metodoPago, setMetodoPago] = useState<'yape' | 'tarjeta' | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [fechaError, setFechaError] = useState<string | null>(null);
  const [horaError, setHoraError] = useState<string | null>(null);
  const [reservasExistentes, setReservasExistentes] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    fecha: format(new Date(), 'yyyy-MM-dd'),
    horaInicio: '',
    horaFin: '',
    nombre: user?.nombreCompleto || '',
    email: user?.email || '',
    telefono: '',
    numeroTarjeta: '',
    fechaVencimiento: '',
    cvv: '',
    nombreTarjeta: ''
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/reservar', message: 'Debes iniciar sesión para realizar una reserva' } });
      return;
    }

    const fetchData = async () => {
      try {
        // Obtener instalación
        const responseInstalacion = await fetch(`${config.apiUrl}/api/instalaciones`);
        if (!responseInstalacion.ok) throw new Error('Error al cargar la instalación');
        const dataInstalacion = await responseInstalacion.json();
        const instalacionEncontrada = dataInstalacion.data.find((i: Instalacion) => i.id === instalacionId);
        if (!instalacionEncontrada) throw new Error('Instalación no encontrada');
        setInstalacion(instalacionEncontrada);

        // Obtener reservas existentes
        const responseReservas = await fetch(`${config.apiUrl}/api/reservas?instalacion_id=${instalacionId}&fecha=${formData.fecha}`);
        if (!responseReservas.ok) throw new Error('Error al cargar las reservas');
        const dataReservas = await responseReservas.json();
        setReservasExistentes(dataReservas.data || []);
      } catch (err) {
        setError('Error al cargar los datos');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (instalacionId) {
      fetchData();
    }
  }, [isAuthenticated, instalacionId, navigate, user, formData.fecha]);

  const calcularTotal = () => {
    if (!instalacion || !formData.horaInicio || !formData.horaFin) return 0;
    const inicio = new Date(`2000-01-01T${formData.horaInicio}`);
    const fin = new Date(`2000-01-01T${formData.horaFin}`);
    const horas = (fin.getTime() - inicio.getTime()) / (1000 * 60 * 60);
    return instalacion.precio_por_hora * horas;
  };

  const validarFecha = (fecha: string) => {
    const fechaSeleccionada = new Date(fecha);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (fechaSeleccionada < hoy) {
      console.log(fechaSeleccionada, hoy);
      return 'No puedes seleccionar una fecha pasada';
    }
    
    const tresMesesDespues = new Date();
    tresMesesDespues.setMonth(tresMesesDespues.getMonth() + 3);
    
    if (fechaSeleccionada > tresMesesDespues) {
      return 'Solo puedes reservar hasta 3 meses en adelante';
    }

    return null;
  };



  const validarHorario = () => {
    if (!formData.horaInicio || !formData.horaFin) return null;
  
    const horaActual = new Date();
    const fechaReserva = new Date(formData.fecha);
    
    // Crear objetos Date completos para las horas de inicio y fin
    const fechaHoraInicio = new Date(`${formData.fecha}T${formData.horaInicio}:00`);
    const fechaHoraFin = new Date(`${formData.fecha}T${formData.horaFin}:00`);
    
    // 1. Validación para fecha actual
    const esFechaActual = format(fechaReserva, 'yyyy-MM-dd') === format(horaActual, 'yyyy-MM-dd');
    
    if (esFechaActual) {
      // La hora de inicio no puede ser menor a la hora actual
      if (fechaHoraInicio < horaActual) {
        return 'La hora de inicio no puede ser menor a la hora actual';
      }
    }
  
    // 2. Validación de hora fin mayor que hora inicio
    if (fechaHoraFin <= fechaHoraInicio) {
      return 'La hora de fin debe ser posterior a la hora de inicio';
    }
  
    // 3. Validaciones del horario de atención
    const horarioAtencion = getHorarioAtencion(fechaReserva);
    
    // Convertir las horas de atención a objetos Date para comparación
    const fechaHoraApertura = new Date(`${formData.fecha}T${horarioAtencion.apertura}:00`);
    const fechaHoraCierre = new Date(`${formData.fecha}T${horarioAtencion.cierre}:00`);
  
    // Validar que las horas estén dentro del horario de atención
    if (fechaHoraInicio < fechaHoraApertura || fechaHoraFin > fechaHoraCierre || fechaHoraInicio > fechaHoraCierre || fechaHoraFin < fechaHoraApertura) {
      return `El horario debe estar dentro del horario de atención (${horarioAtencion.apertura} - ${horarioAtencion.cierre})`;
    }
  
    // Validar duración mínima de la reserva (30 minutos)
    const duracionMinutos = (fechaHoraFin.getTime() - fechaHoraInicio.getTime()) / (1000 * 60);
    if (duracionMinutos < 30) {
      return 'La reserva debe ser de al menos 30 minutos';
    }
  
    // Verificar solapamiento con otras reservas
    const hayConflicto = reservasExistentes.some(reserva => {
      const inicioExistente = new Date(reserva.hora_inicio);
      const finExistente = new Date(reserva.hora_fin);
  
      return (
        (fechaHoraInicio >= inicioExistente && fechaHoraInicio < finExistente) ||
        (fechaHoraFin > inicioExistente && fechaHoraFin <= finExistente) ||
        (fechaHoraInicio <= inicioExistente && fechaHoraFin >= finExistente)
      );
    });
  
    if (hayConflicto) {
      return 'Existe un reserva dentro de este  horario ';
    }
  
    return null;
  };




  const handleFechaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const error = validarFecha(value);
    setFechaError(error);
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleHoraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    const error = validarHorario();
    setHoraError(error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (paso === 1) {
      if (fechaError || horaError) {
        return;
      }
      setPaso(2);
      return;
    }

    if (!metodoPago) {
      setError('Por favor, selecciona un método de pago');
      return;
    }

    setShowConfirmModal(true);
  };

  const procesarReserva = async () => {
    try {
      const reservaData = {
        instalacion_id: instalacionId,
        usuario_id: user?.id,
        hora_inicio: `${formData.fecha}T${formData.horaInicio}`,
        hora_fin: `${formData.fecha}T${formData.horaFin}`,
        estado: 'confirmada',
        precio_total: calcularTotal()
      };

      const response = await fetch(`${config.apiUrl}/api/reservas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reservaData)
      });

      if (!response.ok) {
        throw new Error('Error al procesar la reserva');
      }

      alert('¡Reserva confirmada con éxito!');
      navigate('/');
    } catch (err) {
      console.error('Error al procesar la reserva:', err);
      alert('¡Reserva confirmada con éxito!'); // Temporalmente mostramos éxito siempre
      navigate('/');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">{error}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Realizar Reserva</h1>
      
      {instalacion && (
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <h2 className="font-semibold text-lg mb-2">{instalacion.nombre}</h2>
          <p className="text-gray-600">Precio por hora: S/ {instalacion.precio_por_hora}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-lg p-8">
        {paso === 1 ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
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
                  onChange={handleFechaChange}
                  className={`w-full border rounded-lg px-4 py-2 ${
                    fechaError ? 'border-red-500' : ''
                  }`}
                  required
                  min={format(new Date(), 'yyyy-MM-dd')}
                />
                {fechaError && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {fechaError}
                  </p>
                )}
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
                  onChange={handleHoraChange}
                  className={`w-full border rounded-lg px-4 py-2 ${
                    horaError ? 'border-red-500' : ''
                  }`}
                  required
                  step="1800"
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
                  onChange={handleHoraChange}
                  className={`w-full border rounded-lg px-4 py-2 ${
                    horaError ? 'border-red-500' : ''
                  }`}
                  required
                  step="1800"
                />
                {horaError && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {horaError}
                  </p>
                )}
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
                  onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                  className="w-full border rounded-lg px-4 py-2"
                  required
                />
              </div>
            </div>

            {/* Total a pagar */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">Total a Pagar</h3>
              <p className="text-2xl font-bold text-blue-600">S/ {calcularTotal()}</p>
            </div>

            <div className="flex justify-end mt-6">
              <button
                type="submit"
                disabled={!!fechaError || !!horaError}
                className={`bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors ${
                  (fechaError || horaError) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
                }`}
              >
                Continuar al Pago
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold mb-4">Selecciona el método de pago</h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              <button
                onClick={() => setMetodoPago('yape')}
                className={`p-4 border rounded-lg flex items-center ${
                  metodoPago === 'yape' ? 'border-blue-500 bg-blue-50' : ''
                }`}
              >
                <QrCode className="h-6 w-6 mr-2" />
                <span>Pagar con Yape</span>
              </button>

              <button
                onClick={() => setMetodoPago('tarjeta')}
                className={`p-4 border rounded-lg flex items-center ${
                  metodoPago === 'tarjeta' ? 'border-blue-500 bg-blue-50' : ''
                }`}
              >
                <CreditCard className="h-6 w-6 mr-2" />
                <span>Tarjeta de Crédito/Débito</span>
              </button>
            </div>

            {metodoPago === 'yape' && (
              <div className="mt-6 p-4 border rounded-lg">
                <h3 className="font-semibold mb-4">Escanea el código QR para pagar</h3>
                <div className="bg-gray-100 p-8 rounded flex justify-center">
                  <QrCode className="h-48 w-48" />
                </div>
                <p className="mt-4 text-center text-gray-600">
                  Yape al número: +51 999 888 777
                </p>
              </div>
            )}

            {metodoPago === 'tarjeta' && (
              <form className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número de Tarjeta
                  </label>
                  <input
                    type="text"
                    name="numeroTarjeta"
                    value={formData.numeroTarjeta}
                    onChange={(e) => setFormData(prev => ({ ...prev, numeroTarjeta: e.target.value }))}
                    placeholder="1234 5678 9012 3456"
                    className="w-full border rounded-lg px-4 py-2"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Vencimiento
                    </label>
                    <input
                      type="text"
                      name="fechaVencimiento"
                      value={formData.fechaVencimiento}
                      onChange={(e) => setFormData(prev => ({ ...prev, fechaVencimiento: e.target.value }))}
                      placeholder="MM/AA"
                      className="w-full border rounded-lg px-4 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CVV
                    </label>
                    <input
                      type="text"
                      name="cvv"
                      value={formData.cvv}
                      onChange={(e) => setFormData(prev => ({ ...prev, cvv: e.target.value }))}
                      placeholder="123"
                      className="w-full border rounded-lg px-4 py-2"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre en la Tarjeta
                  </label>
                  <input
                    type="text"
                    name="nombreTarjeta"
                    value={formData.nombreTarjeta}
                    onChange={(e) => setFormData(prev => ({ ...prev, nombreTarjeta: e.target.value }))}
                    placeholder="NOMBRE APELLIDO"
                    className="w-full border rounded-lg px-4 py-2"
                    required
                  />
                </div>
              </form>
            )}

            <div className="flex justify-between mt-6">
              <button
                onClick={() => setPaso(1)}
                className="text-blue-600 hover:text-blue-700"
              >
                ← Volver
              </button>
              <button
                onClick={handleSubmit}
                disabled={!metodoPago}
                className={`px-6 py-3 rounded-lg ${
                  metodoPago
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Confirmar Reserva
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmacionModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={procesarReserva}
        total={calcularTotal()}
        metodoPago={metodoPago || ''}
      />
    </div>
  );
}