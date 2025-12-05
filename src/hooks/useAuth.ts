import { useState, useEffect } from 'react'
import type { UsuarioRecord } from '../types/api'

export function useAuth() {
  const [usuario, setUsuario] = useState<UsuarioRecord | null>(null)
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
      const mockUsuario: UsuarioRecord = {
        id: 1,
        nombre: 'Usuario Dev',
        rol: 'admin'
      }
      setUsuario(mockUsuario)
      console.log('⚠️ Modo desarrollo: Usando usuario mock', mockUsuario)
    }
    setLoading(false)
  }, [])

  const isAdmin = usuario?.rol === 'admin'

  return {
    usuario,
    isAdmin,
    loading,
    setUsuario
  }
}
