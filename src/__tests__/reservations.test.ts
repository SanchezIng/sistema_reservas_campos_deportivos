import { describe, test, expect } from 'vitest';
import { format, addHours, isWithinInterval } from 'date-fns';

// Función para validar disponibilidad de horario
function estaDisponibleHorario(
  horaInicioSolicitada: Date,
  horaFinSolicitada: Date,
  reservasExistentes: { inicio: Date; fin: Date }[]
): boolean {
  return !reservasExistentes.some(reserva =>
    isWithinInterval(horaInicioSolicitada, { start: reserva.inicio, end: reserva.fin }) ||
    isWithinInterval(horaFinSolicitada, { start: reserva.inicio, end: reserva.fin })
  );
}

// Función para calcular precio total
function calcularPrecioTotal(
  horaInicio: Date,
  horaFin: Date,
  precioPorHora: number
): number {
  const horas = (horaFin.getTime() - horaInicio.getTime()) / (1000 * 60 * 60);
  return Math.round(horas * precioPorHora * 100) / 100;
}

// Función para validar horario de operación
function estaEnHorarioOperacion(
  hora: Date,
  horarioOperacion: { apertura: string; cierre: string }
): boolean {
  const horaStr = format(hora, 'HH:mm');
  return horaStr >= horarioOperacion.apertura && horaStr <= horarioOperacion.cierre;
}

describe('Funciones Principales del Sistema de Reservas', () => {
  // Pruebas para validación de disponibilidad
  describe('estaDisponibleHorario', () => {
    const reservasExistentes = [
      {
        inicio: new Date('2024-02-20T14:00:00'),
        fin: new Date('2024-02-20T16:00:00')
      }
    ];

    test('debe retornar verdadero para un horario disponible', () => {
      const horaInicioSolicitada = new Date('2024-02-20T10:00:00');
      const horaFinSolicitada = new Date('2024-02-20T12:00:00');
      
      expect(estaDisponibleHorario(horaInicioSolicitada, horaFinSolicitada, reservasExistentes))
        .toBe(true);
    });

    test('debe retornar falso para un horario que se solapa', () => {
      const horaInicioSolicitada = new Date('2024-02-20T15:00:00');
      const horaFinSolicitada = new Date('2024-02-20T17:00:00');
      
      expect(estaDisponibleHorario(horaInicioSolicitada, horaFinSolicitada, reservasExistentes))
        .toBe(false);
    });

    test('debe retornar falso para un horario dentro de una reserva existente', () => {
      const horaInicioSolicitada = new Date('2024-02-20T14:30:00');
      const horaFinSolicitada = new Date('2024-02-20T15:30:00');
      
      expect(estaDisponibleHorario(horaInicioSolicitada, horaFinSolicitada, reservasExistentes))
        .toBe(false);
    });
  });

  // Pruebas para cálculo de precio
  describe('calcularPrecioTotal', () => {
    test('debe calcular el precio correcto para 1 hora', () => {
      const inicio = new Date('2024-02-20T10:00:00');
      const fin = new Date('2024-02-20T11:00:00');
      const precioPorHora = 100;
      
      expect(calcularPrecioTotal(inicio, fin, precioPorHora)).toBe(100);
    });

    test('debe calcular el precio correcto para 2.5 horas', () => {
      const inicio = new Date('2024-02-20T10:00:00');
      const fin = new Date('2024-02-20T12:30:00');
      const precioPorHora = 100;
      
      expect(calcularPrecioTotal(inicio, fin, precioPorHora)).toBe(250);
    });

    test('debe manejar duración cero', () => {
      const hora = new Date('2024-02-20T10:00:00');
      const precioPorHora = 100;
      
      expect(calcularPrecioTotal(hora, hora, precioPorHora)).toBe(0);
    });
  });

  // Pruebas para validación de horario de operación
  describe('estaEnHorarioOperacion', () => {
    const horarioOperacion = {
      apertura: '06:00',
      cierre: '22:00'
    };

    test('debe retornar verdadero para hora dentro del horario de operación', () => {
      const hora = new Date('2024-02-20T14:00:00');
      expect(estaEnHorarioOperacion(hora, horarioOperacion)).toBe(true);
    });

    test('debe retornar falso para hora antes de apertura', () => {
      const hora = new Date('2024-02-20T05:00:00');
      expect(estaEnHorarioOperacion(hora, horarioOperacion)).toBe(false);
    });

    test('debe retornar falso para hora después del cierre', () => {
      const hora = new Date('2024-02-20T23:00:00');
      expect(estaEnHorarioOperacion(hora, horarioOperacion)).toBe(false);
    });

    test('debe retornar verdadero para hora en momento de apertura', () => {
      const hora = new Date('2024-02-20T06:00:00');
      expect(estaEnHorarioOperacion(hora, horarioOperacion)).toBe(true);
    });

    test('debe retornar verdadero para hora en momento de cierre', () => {
      const hora = new Date('2024-02-20T22:00:00');
      expect(estaEnHorarioOperacion(hora, horarioOperacion)).toBe(true);
    });
  });
});