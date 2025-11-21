-- Actualizar constraint de roles permitidos para usuarios
DO $$
BEGIN
  -- Actualizar roles antiguos
  UPDATE public.usuarios
  SET rol = 'taller-grafico'
  WHERE rol = 'taller';

  -- Eliminar constraint existente si la hubiera
  ALTER TABLE public.usuarios
    DROP CONSTRAINT IF EXISTS usuarios_rol_check;

  -- Crear nuevo constraint con los roles actualizados
  ALTER TABLE public.usuarios
    ADD CONSTRAINT usuarios_rol_check CHECK (
      rol IN (
        'administracion',
        'gerencia',
        'recursos-humanos',
        'diseno',
        'imprenta',
        'taller-grafico',
        'instalaciones',
        'metalurgica',
        'caja',
        'mostrador'
      )
    );
END $$;


