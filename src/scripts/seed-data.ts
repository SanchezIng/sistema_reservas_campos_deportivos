import { createInstalacion } from '../lib/services/instalaciones';
import { createHorarioInstalacion } from '../lib/services/horarios';

async function seedData() {
  try {
    // Crear instalaciones
    const instalaciones = [
      {
        nombre: 'Campo Principal - Césped Natural',
        tipo: 'soccer',
        superficie: 'cesped',
        descripcion: 'Campo de fútbol profesional con césped natural de primera calidad',
        precio_por_hora: 120,
        imagen_url: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&q=80&w=800',
        estado: 'disponible',
        capacidad: 22
      },
      {
        nombre: 'Campo 2 - Césped Sintético',
        tipo: 'soccer',
        superficie: 'sintetico',
        descripcion: 'Campo de fútbol con césped sintético de última generación',
        precio_por_hora: 100,
        imagen_url: 'https://images.unsplash.com/photo-1459865264687-595d652de67e?auto=format&fit=crop&q=80&w=800',
        estado: 'disponible',
        capacidad: 22
      },
      {
        nombre: 'Cancha de Básquet Cubierta',
        tipo: 'basketball',
        superficie: 'concreto',
        descripcion: 'Cancha de básquet techada con piso premium',
        precio_por_hora: 80,
        imagen_url: 'https://images.unsplash.com/photo-1505666287802-931dc83948e9?auto=format&fit=crop&q=80&w=800',
        estado: 'disponible',
        capacidad: 10
      },
      {
        nombre: 'Piscina Semiolímpica',
        tipo: 'swimming',
        descripcion: 'Piscina semiolímpica con temperatura controlada',
        precio_por_hora: 150,
        imagen_url: 'https://images.unsplash.com/photo-1519315901367-f34ff9154487?auto=format&fit=crop&q=80&w=800',
        estado: 'disponible',
        capacidad: 30
      }
    ];

    for (const instalacion of instalaciones) {
      const createdInstalacion = await createInstalacion(instalacion as any);
      console.log('Instalación creada:', createdInstalacion.id);

      // Crear horarios para cada instalación
      const horarios = [
        { dia_semana: 1, hora_apertura: '06:00', hora_cierre: '22:00' },
        { dia_semana: 2, hora_apertura: '06:00', hora_cierre: '22:00' },
        { dia_semana: 3, hora_apertura: '06:00', hora_cierre: '22:00' },
        { dia_semana: 4, hora_apertura: '06:00', hora_cierre: '22:00' },
        { dia_semana: 5, hora_apertura: '06:00', hora_cierre: '22:00' },
        { dia_semana: 6, hora_apertura: '07:00', hora_cierre: '21:00' },
        { dia_semana: 0, hora_apertura: '08:00', hora_cierre: '20:00' }
      ];

      for (const horario of horarios) {
        await createHorarioInstalacion({
          instalacion_id: createdInstalacion.id,
          ...horario
        });
      }
    }

    console.log('Datos de prueba creados exitosamente');
  } catch (error) {
    console.error('Error al crear datos de prueba:', error);
  }
}

seedData();