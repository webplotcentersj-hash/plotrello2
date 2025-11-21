-- Función para crear usuarios con hash de contraseña
-- Esta función permite crear usuarios de forma segura desde la aplicación

CREATE OR REPLACE FUNCTION public.crear_usuario(
  p_nombre text,
  p_password text,
  p_rol text
)
RETURNS TABLE (id integer, nombre text, rol text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id integer;
  password_hash text;
BEGIN
  -- Validar que el rol sea válido (roles operativos, no administración)
  IF p_rol NOT IN (
    'diseno',
    'imprenta',
    'taller-grafico',
    'instalaciones',
    'metalurgica',
    'caja',
    'mostrador',
    'recursos-humanos',
    'gerencia'
  ) THEN
    RAISE EXCEPTION 'Rol no permitido. Usa uno de: Diseño, Imprenta, Taller Gráfico, Instalaciones, Metalúrgica, Caja, Mostrador, Recursos Humanos o Gerencia.';
  END IF;

  -- Validar que el nombre no esté vacío
  IF trim(p_nombre) = '' THEN
    RAISE EXCEPTION 'El nombre de usuario no puede estar vacío';
  END IF;

  -- Validar que la contraseña tenga al menos 6 caracteres
  IF length(p_password) < 6 THEN
    RAISE EXCEPTION 'La contraseña debe tener al menos 6 caracteres';
  END IF;

  -- Verificar que el usuario no exista
  IF EXISTS (SELECT 1 FROM public.usuarios u WHERE lower(u.nombre) = lower(trim(p_nombre))) THEN
    RAISE EXCEPTION 'El usuario "%" ya existe', trim(p_nombre);
  END IF;

  -- Hashear la contraseña
  password_hash := crypt(p_password, gen_salt('bf'));

  -- Insertar el nuevo usuario
  INSERT INTO public.usuarios (nombre, password_hash, rol)
  VALUES (trim(p_nombre), password_hash, p_rol)
  RETURNING id INTO new_user_id;

  -- Retornar el usuario creado (sin la contraseña)
  RETURN QUERY
  SELECT 
    new_user_id AS id,
    trim(p_nombre) AS nombre,
    p_rol AS rol;
END;
$$;

-- Comentario sobre la función
COMMENT ON FUNCTION public.crear_usuario IS 'Crea un nuevo usuario con hash de contraseña. Permite roles operativos (Diseño, Imprenta, Taller Gráfico, Instalaciones, Metalúrgica, Caja, Mostrador, Recursos Humanos y Gerencia). Los administradores deben crearse directamente desde la base de datos.';

