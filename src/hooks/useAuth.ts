import { useState, useEffect } from 'react'

export type Usuario = {
  id: number
  nombre: string
  rol: 'administracion' | 'taller' | 'mostrador'
}

export function useAuth() {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Cargar usuario desde localStorage
    const usuarioStr = localStorage.getItem('usuario')
    if (usuarioStr) {
      try {
        const usuarioData = JSON.parse(usuarioStr)
        setUsuario(usuarioData)
      } catch (error) {
        console.error('Error al parsear usuario:', error)
        localStorage.removeItem('usuario')
        localStorage.removeItem('auth_token')
      }
    } else if (import.meta.env.DEV) {
      // Modo desarrollo: crear un usuario mock si no hay usuario
      // Para pruebas, puedes cambiar el rol aquí: 'administracion', 'taller', 'mostrador'
      const mockUsuario: Usuario = {
        id: 1,
        nombre: 'Usuario Dev',
        rol: 'administracion' // Cambia esto para probar diferentes roles
      }
      setUsuario(mockUsuario)
      console.log('⚠️ Modo desarrollo: Usando usuario mock', mockUsuario)
    }
    setLoading(false)
  }, [])

  const isAdmin = usuario?.rol === 'administracion'
  const isTaller = usuario?.rol === 'taller'
  const isMostrador = usuario?.rol === 'mostrador'

  return {
    usuario,
    isAdmin,
    isTaller,
    isMostrador,
    loading,
    setUsuario
  }
}

