-- Catálogo inicial de cursos de LUCO Estudio. Es idempotente: no duplica títulos existentes.
insert into public.courses (title, description, requires_active_subscription, status)
select v.title, v.description, v.requires_active_subscription, 'published'::public.course_status
from (values
  ('Basic',
   E'40 €/mes · 1,5 horas de clase a la semana.\nMatrícula incluida. Materiales y maquinaria incluidos, excepto tejidos.\nAtención personalizada desde cero, para todos los niveles.\nHorarios flexibles: L-V 10:00-13:00 / 17:00-20:00.',
   true),
  ('Doble',
   E'75 €/mes · 3 horas de clase a la semana.\nMatrícula incluida. Materiales y maquinaria incluidos, excepto tejidos.\nAtención personalizada desde cero, para todos los niveles.\nHorarios flexibles: L-V 10:00-13:00 / 17:00-20:00.',
   true),
  ('Intensivo',
   E'150 €/mes · 6 horas de clase a la semana (4 clases de 1,5 h o 2 clases de 3 h).\nMatrícula incluida. Materiales y maquinaria incluidos, excepto tejidos.\nAtención personalizada desde cero, para todos los niveles.\nHorarios flexibles: L-V 10:00-13:00 / 17:00-20:00.',
   true),
  ('Kids',
   E'30 €/mes · 1 hora de clase a la semana.\nMatrícula incluida. Materiales adaptados y maquinaria incluidos, excepto tejidos.\nPrograma creativo personalizado, grupos reducidos.\nViernes 16:00-17:00.',
   true),
  ('Experiencia Luco',
   E'50 €/persona · Experiencia de 3 horas para todos los niveles.\nProyecto de accesorios a elegir. Materiales y tejido incluidos.\nPaquete preparado para regalar.\nL-V 10:00-13:00 / 17:00-20:00.',
   false),
  ('Sewing party',
   E'35 €/persona · Sesión privada de 3 horas para despedidas de soltera, cumpleaños y celebraciones en Granada.\nConfección de un accesorio a elegir. Materiales, snacks y refrescos incluidos.\nMínimo 4 y máximo 8 personas. Sábado por la mañana.',
   false),
  ('Kids party',
   E'25 €/niño · Sesión privada de 2 horas para cumpleaños en Granada.\nConfección de una tote bag, actividad guiada paso a paso. Materiales, snacks y refrescos incluidos.\nMínimo 4 y máximo 8 niños. Fecha y horario a concretar.',
   false),
  ('Programa de especialización',
   E'1.440 € (pago único) · 3 meses, 12 sesiones, sábados 9:00-15:00.\nGrupos de 6 personas. Ediciones temáticas para nivel principiante y avanzado.\nProyecto final y seguimiento personalizado. Materiales incluidos, excepto tejidos específicos.\nFechas y temática se anunciarán con antelación.',
   false)
) as v(title, description, requires_active_subscription)
where not exists (select 1 from public.courses c where c.title = v.title);
