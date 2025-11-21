import { BOARD_COLUMNS } from '../data/mockData'
import type {
  HistorialMovimiento,
  MaterialRecord,
  OrdenTrabajo,
  SectorRecord,
  UsuarioRecord
} from '../types/api'
import { supabase } from './supabaseClient'

const LEGACY_API_BASE_URL = import.meta.env.VITE_API_BASE_URL
const hasLegacyBackend = Boolean(LEGACY_API_BASE_URL)

type ApiResponse<T> = {
  success: boolean
  data?: T
  error?: string
  message?: string
}

type ChatMessageUI = {
  id: number
  canal: string
  usuario_id: number
  nombre_usuario?: string
  contenido: string
  tipo: 'message' | 'alert' | 'buzz'
  timestamp: string
}

const fallbackOrdenes: OrdenTrabajo[] = []

const fallbackHistorial: HistorialMovimiento[] = []

const fallbackUsuarios: UsuarioRecord[] = []

const fallbackSectores: SectorRecord[] = BOARD_COLUMNS.map((col, index) => ({
  id: index + 1,
  nombre: col.label,
  color: col.accent
}))

const fallbackMateriales: MaterialRecord[] = []

const fallbackMensajes: ChatMessageUI[] = []

// Mapeo de canales a room_id - cada canal tiene su propio room
const chatChannelToRoom: Record<string, number> = {
  general: 1,
  produccion: 2,
  diseno: 3,
  imprenta: 4,
  instalaciones: 5,
  random: 6,
  'taller-grafico': 7,
  mostrador: 8
}

// Mapeo inverso: room_id -> canal
const roomToChatChannel: Record<number, string> = {
  1: 'general',
  2: 'produccion',
  3: 'diseno',
  4: 'imprenta',
  5: 'instalaciones',
  6: 'random',
  7: 'taller-grafico',
  8: 'mostrador'
}

class ApiService {
  private legacyRequest<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    if (!LEGACY_API_BASE_URL) {
      return Promise.resolve({ success: false, error: 'Backend legacy no configurado' })
    }

    const token = localStorage.getItem('auth_token')

    return fetch(`${LEGACY_API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers
      }
    })
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json().catch(() => null)
          throw new Error(
            errorData?.error || errorData?.message || `HTTP ${response.status}: ${response.statusText}`
          )
        }
        return response.json()
      })
      .catch((error) => ({
        success: false,
        error: error instanceof Error ? error.message : 'Error de conexión'
      }))
  }

  private handleFallback<T>(data: T): ApiResponse<T> {
    return { success: true, data }
  }

  // ========== ORDENES DE TRABAJO ==========
  async getOrdenes(): Promise<ApiResponse<OrdenTrabajo[]>> {
    if (supabase) {
      // Seleccionar columnas explícitamente para evitar errores si falta foto_url
      const { data, error } = await supabase
        .from('ordenes_trabajo')
        .select('id, numero_op, cliente, descripcion, estado, prioridad, fecha_creacion, fecha_entrega, fecha_ingreso, operario_asignado, complejidad, sector, materiales, nombre_creador, foto_url, usuario_trabajando_nombre')
        .order('fecha_creacion', { ascending: false })

      if (error) {
        // Si el error es por foto_url, intentar sin esa columna
        if (error.message.includes('foto_url')) {
          console.warn('⚠️ Columna foto_url no encontrada. Ejecuta el parche SQL: supabase/patches/2024-11-21_add_foto_url.sql')
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('ordenes_trabajo')
            .select('id, numero_op, cliente, descripcion, estado, prioridad, fecha_creacion, fecha_entrega, fecha_ingreso, operario_asignado, complejidad, sector, materiales, nombre_creador')
            .order('fecha_creacion', { ascending: false })
          
          if (fallbackError) {
            console.error('Supabase getOrdenes error:', fallbackError)
            return { success: false, error: fallbackError.message }
          }
          
          // Agregar foto_url como null para cada orden
          const dataWithFoto = (fallbackData || []).map((orden: any) => ({ ...orden, foto_url: null }))
          return { success: true, data: (dataWithFoto as OrdenTrabajo[]) ?? [] }
        }
        
        console.error('Supabase getOrdenes error:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data: (data as OrdenTrabajo[]) ?? [] }
    }

    if (hasLegacyBackend) {
      return this.legacyRequest('/ordenes.php')
    }

    return this.handleFallback(fallbackOrdenes)
  }

  async getOrden(id: number): Promise<ApiResponse<OrdenTrabajo>> {
    if (supabase) {
      const { data, error } = await supabase
        .from('ordenes_trabajo')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      if (error) return { success: false, error: error.message }
      if (!data) return { success: false, error: 'Orden no encontrada' }
      return { success: true, data: data as OrdenTrabajo }
    }

    if (hasLegacyBackend) {
      return this.legacyRequest(`/ordenes.php?id=${id}`)
    }

    const orden = fallbackOrdenes.find((o) => o.id === id)
    return orden
      ? { success: true, data: orden }
      : { success: false, error: 'Orden no encontrada en fallback' }
  }

  async createOrden(orden: Partial<OrdenTrabajo>): Promise<ApiResponse<OrdenTrabajo>> {
    if (supabase) {
      // Si foto_url no está definido o es null, no lo incluimos para evitar errores
      const ordenToInsert = { ...orden }
      if (!ordenToInsert.foto_url) {
        delete ordenToInsert.foto_url
      }
      
      const { data, error } = await supabase
        .from('ordenes_trabajo')
        .insert(ordenToInsert)
        .select()
        .single()

      if (error) {
        // Si el error es por foto_url, intentar sin esa columna
        if (error.message.includes('foto_url')) {
          console.warn('⚠️ Columna foto_url no encontrada. Ejecuta el parche SQL: supabase/patches/2024-11-21_add_foto_url.sql')
          const ordenWithoutFoto = { ...ordenToInsert }
          delete ordenWithoutFoto.foto_url
          
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('ordenes_trabajo')
            .insert(ordenWithoutFoto)
            .select()
            .single()
          
          if (fallbackError) return { success: false, error: fallbackError.message }
          return { success: true, data: { ...fallbackData, foto_url: null } as OrdenTrabajo }
        }
        return { success: false, error: error.message }
      }
      return { success: true, data: data as OrdenTrabajo }
    }

    if (hasLegacyBackend) {
      return this.legacyRequest('/ordenes.php', { method: 'POST', body: JSON.stringify(orden) })
    }

    const nuevo = { ...orden, id: fallbackOrdenes.length + 1 } as OrdenTrabajo
    fallbackOrdenes.push(nuevo)
    return { success: true, data: nuevo }
  }

  async updateOrden(id: number, orden: Partial<OrdenTrabajo>): Promise<ApiResponse<OrdenTrabajo>> {
    if (supabase) {
      // Si foto_url no está definido o es null, no lo incluimos para evitar errores
      const ordenToUpdate = { ...orden }
      if (!ordenToUpdate.foto_url) {
        delete ordenToUpdate.foto_url
      }
      
      const { data, error } = await supabase
        .from('ordenes_trabajo')
        .update(ordenToUpdate)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        // Si el error es por foto_url, intentar sin esa columna
        if (error.message.includes('foto_url')) {
          console.warn('⚠️ Columna foto_url no encontrada. Ejecuta el parche SQL: supabase/patches/2024-11-21_add_foto_url.sql')
          const ordenWithoutFoto = { ...ordenToUpdate }
          delete ordenWithoutFoto.foto_url
          
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('ordenes_trabajo')
            .update(ordenWithoutFoto)
            .eq('id', id)
            .select()
            .single()
          
          if (fallbackError) return { success: false, error: fallbackError.message }
          return { success: true, data: { ...fallbackData, foto_url: null } as OrdenTrabajo }
        }
        return { success: false, error: error.message }
      }
      return { success: true, data: data as OrdenTrabajo }
    }

    if (hasLegacyBackend) {
      return this.legacyRequest(`/ordenes.php?id=${id}`, {
        method: 'PUT',
        body: JSON.stringify(orden)
      })
    }

    const index = fallbackOrdenes.findIndex((o) => o.id === id)
    if (index === -1) return { success: false, error: 'Orden no encontrada' }
    fallbackOrdenes[index] = { ...fallbackOrdenes[index], ...orden }
    return { success: true, data: fallbackOrdenes[index] }
  }

  async deleteOrden(id: number): Promise<ApiResponse<void>> {
    if (supabase) {
      const { error } = await supabase.from('ordenes_trabajo').delete().eq('id', id)
      if (error) return { success: false, error: error.message }
      return { success: true }
    }

    if (hasLegacyBackend) {
      return this.legacyRequest(`/ordenes.php?id=${id}`, { method: 'DELETE' })
    }

    const index = fallbackOrdenes.findIndex((o) => o.id === id)
    if (index >= 0) fallbackOrdenes.splice(index, 1)
    return { success: true }
  }

  async moveOrden(id: number, nuevoEstado: string, usuarioId: number): Promise<ApiResponse<any>> {
    if (supabase) {
      const { data: current, error: fetchError } = await supabase
        .from('ordenes_trabajo')
        .select('estado')
        .eq('id', id)
        .maybeSingle()

      if (fetchError || !current) {
        return { success: false, error: fetchError?.message || 'Orden no encontrada' }
      }
      const currentEstado = (current as { estado: string }).estado

      const { error: updateError } = await supabase
        .from('ordenes_trabajo')
        .update({ estado: nuevoEstado })
        .eq('id', id)

      if (updateError) {
        return { success: false, error: updateError.message }
      }

      // Obtener nombre del usuario
      const usuarioData = localStorage.getItem('usuario')
      const nombreUsuario = usuarioData
        ? JSON.parse(usuarioData).nombre || 'Usuario'
        : 'Usuario'

      await supabase.from('historial_movimientos').insert({
        id_orden: id,
        estado_anterior: currentEstado,
        estado_nuevo: nuevoEstado,
        id_usuario: usuarioId,
        nombre_usuario: nombreUsuario,
        timestamp: new Date().toISOString()
      })

      return { success: true, data: { id, estado: nuevoEstado } }
    }

    if (hasLegacyBackend) {
      return this.legacyRequest('/ordenes/mover.php', {
        method: 'POST',
        body: JSON.stringify({ id_orden: id, estado_nuevo: nuevoEstado, id_usuario: usuarioId })
      })
    }

    return this.updateOrden(id, { estado: nuevoEstado })
  }

  // ========== HISTORIAL DE MOVIMIENTOS ==========
  async getHistorialMovimientos(filters?: {
    ordenId?: number
    usuarioId?: number
    limit?: number
  }): Promise<ApiResponse<HistorialMovimiento[]>> {
    if (supabase) {
      let query = supabase.from('historial_movimientos').select('*').order('timestamp', {
        ascending: false
      })

      if (filters?.ordenId) query = query.eq('id_orden', filters.ordenId)
      if (filters?.usuarioId) query = query.eq('id_usuario', filters.usuarioId)
      if (filters?.limit) query = query.limit(filters.limit)

      const { data, error } = await query
      if (error) return { success: false, error: error.message }
      return { success: true, data: (data as HistorialMovimiento[]) ?? [] }
    }

    if (hasLegacyBackend) {
      const params = new URLSearchParams()
      if (filters?.ordenId) params.append('orden_id', filters.ordenId.toString())
      if (filters?.usuarioId) params.append('usuario_id', filters.usuarioId.toString())
      if (filters?.limit) params.append('limit', filters.limit.toString())
      return this.legacyRequest(`/historial.php?${params.toString()}`)
    }

    return this.handleFallback(fallbackHistorial)
  }

  // ========== USUARIOS ==========
  async getUsuarios(): Promise<ApiResponse<UsuarioRecord[]>> {
    if (supabase) {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nombre, rol')
        .order('nombre', { ascending: true })

      if (error) return { success: false, error: error.message }
      return { success: true, data: (data as UsuarioRecord[]) ?? [] }
    }

    if (hasLegacyBackend) {
      return this.legacyRequest('/usuarios.php')
    }

    return this.handleFallback(fallbackUsuarios)
  }

  async getSectores(): Promise<ApiResponse<SectorRecord[]>> {
    if (supabase) {
      const { data, error } = await supabase
        .from('sectores')
        .select('id, nombre, color, activo, orden_visualizacion')
        .order('orden_visualizacion', { ascending: true })

      if (error) return { success: false, error: error.message }
      return { success: true, data: (data as SectorRecord[]) ?? [] }
    }

    return this.handleFallback(fallbackSectores)
  }

  async getMateriales(search?: string): Promise<ApiResponse<MaterialRecord[]>> {
    if (supabase) {
      let query = supabase.from('materiales').select('id, codigo, descripcion').order('descripcion', {
        ascending: true
      })

      if (search && search.trim().length >= 2) {
        query = query.ilike('descripcion', `%${search.trim()}%`)
      }

      const { data, error } = await query
      if (error) return { success: false, error: error.message }
      return { success: true, data: (data as MaterialRecord[]) ?? [] }
    }

    if (search && search.trim()) {
      const filtered = fallbackMateriales.filter((material) =>
        material.descripcion.toLowerCase().includes(search.trim().toLowerCase())
      )
      return { success: true, data: filtered }
    }

    return this.handleFallback(fallbackMateriales)
  }


  async getUsuario(id: number): Promise<ApiResponse<UsuarioRecord>> {
    if (supabase) {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nombre, rol')
        .eq('id', id)
        .maybeSingle()

      if (error) return { success: false, error: error.message }
      if (!data) return { success: false, error: 'Usuario no encontrado' }
      return { success: true, data: data as UsuarioRecord }
    }

    if (hasLegacyBackend) {
      return this.legacyRequest(`/usuarios.php?id=${id}`)
    }

    const usuario = fallbackUsuarios.find((u) => u.id === id)
    return usuario
      ? { success: true, data: usuario }
      : { success: false, error: 'Usuario no encontrado' }
  }

  // ========== CHAT ==========
  async getMensajesChat(canal: string, limit: number = 50): Promise<ApiResponse<ChatMessageUI[]>> {
    if (supabase) {
      const roomId = chatChannelToRoom[canal] ?? 1

      const { data, error } = await supabase
        .from('chat_messages')
        .select('id, room_id, id_usuario, nombre_usuario, mensaje, timestamp')
        .eq('room_id', roomId)
        .order('timestamp', { ascending: false })
        .limit(limit)

      if (error) return { success: false, error: error.message }

      const mensajes =
        data?.map((msg: any) => ({
          id: msg.id,
          canal: roomToChatChannel[msg.room_id] ?? canal,
          usuario_id: msg.id_usuario,
          nombre_usuario: msg.nombre_usuario,
          contenido: msg.mensaje,
          tipo: inferChatType(msg.mensaje),
          timestamp: msg.timestamp
        })) ?? []

      return { success: true, data: (mensajes.reverse() as ChatMessageUI[]) }
    }

    if (hasLegacyBackend) {
      return this.legacyRequest(`/chat/mensajes.php?canal=${canal}&limit=${limit}`)
    }

    return this.handleFallback(fallbackMensajes)
  }

  async enviarMensajeChat(mensaje: {
    canal: string
    contenido: string
    usuario_id: number
    tipo?: string
  }): Promise<ApiResponse<ChatMessageUI>> {
    if (supabase) {
      const roomId = chatChannelToRoom[mensaje.canal] ?? 1

      // Asegurar que el room existe antes de insertar
      await this.ensureChatRoomExists(roomId, mensaje.canal)

      const payload = {
        room_id: roomId,
        id_usuario: mensaje.usuario_id,
        nombre_usuario: localStorage.getItem('usuario')
          ? JSON.parse(localStorage.getItem('usuario') || '{}').nombre
          : 'Usuario',
        mensaje:
          mensaje.tipo === 'buzz'
            ? 'Te ha enviado un zumbido!'
            : mensaje.tipo === 'alert'
              ? '¡Atención! Revisar esto de inmediato.'
              : mensaje.contenido
      }

      const { data, error } = await supabase.from('chat_messages').insert(payload).select().single()

      if (error) return { success: false, error: error.message }

      return {
        success: true,
        data: {
          id: data.id,
          canal: mensaje.canal,
          usuario_id: mensaje.usuario_id,
          nombre_usuario: payload.nombre_usuario,
          contenido: payload.mensaje,
          tipo: mensaje.tipo === 'alert' ? 'alert' : mensaje.tipo === 'buzz' ? 'buzz' : 'message',
          timestamp: data.timestamp
        } as ChatMessageUI
      }
    }

    if (hasLegacyBackend) {
      return this.legacyRequest('/chat/mensajes.php', {
        method: 'POST',
        body: JSON.stringify(mensaje)
      })
    }

    const nuevoMensaje: ChatMessageUI = {
      id: fallbackMensajes.length + 1,
      canal: mensaje.canal,
      usuario_id: mensaje.usuario_id,
      contenido: mensaje.contenido,
      tipo: (mensaje.tipo as ChatMessageUI['tipo']) || 'message',
      timestamp: new Date().toISOString()
    }

    fallbackMensajes.push(nuevoMensaje)
    return { success: true, data: nuevoMensaje }
  }

  async enviarZumbido(
    _usuarioDestinoId: number,
    usuarioOrigenId: number,
    canal: string
  ): Promise<ApiResponse<ChatMessageUI>> {
    return this.enviarMensajeChat({
      canal,
      contenido: 'Te ha enviado un zumbido!',
      usuario_id: usuarioOrigenId,
      tipo: 'buzz'
    })
  }

  async enviarAlerta(
    _usuarioDestinoId: number,
    usuarioOrigenId: number,
    canal: string
  ): Promise<ApiResponse<ChatMessageUI>> {
    return this.enviarMensajeChat({
      canal,
      contenido: '¡Atención! Revisar esto de inmediato.',
      usuario_id: usuarioOrigenId,
      tipo: 'alert'
    })
  }

  // ========== AUTENTICACIÓN ==========
  async login(usuario: string, password: string): Promise<ApiResponse<{ usuario: UsuarioRecord }>> {
    if (supabase) {
      try {
        const { data, error } = await supabase.rpc('login_usuario', {
          p_usuario: usuario,
          p_password: password
        })

        if (error) {
          console.error('Error en login_usuario RPC:', error)
          return { success: false, error: `Error de autenticación: ${error.message}` }
        }

        // La función puede retornar un array vacío o null si las credenciales son inválidas
        if (!data || (Array.isArray(data) && data.length === 0)) {
          console.warn('Login fallido: credenciales inválidas o usuario no encontrado')
          return { success: false, error: 'Usuario o contraseña incorrectos' }
        }

        const usuarioDb = Array.isArray(data) ? data[0] : data

        if (!usuarioDb || !usuarioDb.id) {
          console.error('Login fallido: datos de usuario inválidos', usuarioDb)
          return { success: false, error: 'Error al obtener datos del usuario' }
        }

        localStorage.setItem('usuario', JSON.stringify(usuarioDb))
        localStorage.setItem('usuario_id', usuarioDb.id.toString())

        return { success: true, data: { usuario: usuarioDb } }
      } catch (err) {
        console.error('Excepción en login:', err)
        return { 
          success: false, 
          error: err instanceof Error ? err.message : 'Error inesperado al iniciar sesión' 
        }
      }
    }

    if (hasLegacyBackend) {
      return this.legacyRequest('/auth/login.php', {
        method: 'POST',
        body: JSON.stringify({ usuario, password })
      })
    }

    const mockUsuario: UsuarioRecord = {
      id: 1,
      nombre: usuario || 'Dev',
      rol: 'administracion'
    }

    localStorage.setItem('usuario', JSON.stringify(mockUsuario))
    return { success: true, data: { usuario: mockUsuario } }
  }

  async logout() {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('usuario')

    if (supabase) {
      await supabase.rpc('logout_usuario')
      return { success: true }
    }

    if (hasLegacyBackend) {
      return this.legacyRequest('/auth/logout.php', { method: 'POST' })
    }

    return { success: true }
  }

  async verificarToken() {
    if (supabase) {
      const usuario = localStorage.getItem('usuario')
      return usuario ? { success: true, data: JSON.parse(usuario) } : { success: false }
    }

    if (hasLegacyBackend) {
      return this.legacyRequest('/auth/verificar.php')
    }

    return { success: true }
  }

  // ========== ARCHIVOS ==========
  async subirArchivo(ordenId: number, archivo: File) {
    if (supabase) {
      const { data, error } = await supabase.storage
        .from('archivos')
        .upload(`ordenes/${ordenId}/${archivo.name}`, archivo, {
          cacheControl: '3600',
          upsert: true
        })

      if (error) return { success: false, error: error.message }
      return { success: true, data }
    }

    if (hasLegacyBackend) {
      const formData = new FormData()
      formData.append('archivo', archivo)
      formData.append('orden_id', ordenId.toString())

      try {
        const token = localStorage.getItem('auth_token')
        const response = await fetch(`${LEGACY_API_BASE_URL}/archivos/subir.php`, {
          method: 'POST',
          headers: {
            ...(token && { Authorization: `Bearer ${token}` })
          },
          body: formData
        })

        if (!response.ok) throw new Error('Error al subir archivo')
        return await response.json()
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
      }
    }

    return { success: false, error: 'Storage no disponible en modo mock' }
  }

  async getArchivosOrden(ordenId: number) {
    if (supabase) {
      const { data, error } = await supabase.storage.from('archivos').list(`ordenes/${ordenId}`)
      if (error) return { success: false, error: error.message }
      return { success: true, data }
    }

    if (hasLegacyBackend) {
      return this.legacyRequest(`/archivos.php?orden_id=${ordenId}`)
    }

    return { success: true, data: [] }
  }

  // ========== COMENTARIOS ==========
  async getComentariosOrden(ordenId: number): Promise<ApiResponse<any[]>> {
    if (supabase) {
      const { data, error } = await supabase
        .from('comentarios_orden')
        .select('*')
        .eq('id_orden', ordenId)
        .order('timestamp', { ascending: false })

      if (error) return { success: false, error: error.message }
      return { success: true, data: (data as any[]) ?? [] }
    }

    return { success: true, data: [] }
  }

  async addComentarioOrden(ordenId: number, comentario: string, usuarioNombre: string): Promise<ApiResponse<any>> {
    if (supabase) {
      const { data, error } = await supabase
        .from('comentarios_orden')
        .insert({
          id_orden: ordenId,
          comentario,
          usuario_nombre: usuarioNombre,
          timestamp: new Date().toISOString()
        })
        .select()
        .single()

      if (error) return { success: false, error: error.message }
      return { success: true, data }
    }

    return { success: false, error: 'Supabase no configurado' }
  }

  // Método privado para asegurar que un chat_room existe
  private async ensureChatRoomExists(roomId: number, canalNombre: string): Promise<void> {
    if (!supabase) return

    try {
      // Verificar si el room existe
      const { data: existingRoom, error: checkError } = await supabase
        .from('chat_rooms')
        .select('id')
        .eq('id', roomId)
        .maybeSingle()

      if (checkError && checkError.code !== 'PGRST116') {
        console.warn('Error verificando chat_room:', checkError)
      }

      // Si no existe, crearlo
      if (!existingRoom) {
        const roomNames: Record<number, string> = {
          1: 'General',
          2: 'Producción',
          3: 'Diseño',
          4: 'Imprenta',
          5: 'Instalaciones',
          6: 'Random',
          7: 'Taller Gráfico',
          8: 'Mostrador'
        }

        const { error: insertError } = await supabase
          .from('chat_rooms')
          .insert({
            id: roomId,
            nombre: roomNames[roomId] || canalNombre,
            tipo: 'publico'
          })

        if (insertError) {
          console.warn('Error creando chat_room:', insertError)
          // Si falla por IDENTITY, intentar sin especificar ID
          if (insertError.code === '23505' || insertError.message.includes('identity')) {
            const { error: retryError } = await supabase
              .from('chat_rooms')
              .insert({
                nombre: roomNames[roomId] || canalNombre,
                tipo: 'publico'
              })
            if (retryError) {
              console.error('Error creando chat_room sin ID:', retryError)
            }
          }
        } else {
          console.log(`✅ Chat room ${roomId} creado exitosamente`)
        }
      }
    } catch (error) {
      console.warn('Error en ensureChatRoomExists:', error)
    }
  }
}

function inferChatType(message: string): ChatMessageUI['tipo'] {
  if (!message) return 'message'
  if (message.toLowerCase().includes('zumbido')) return 'buzz'
  if (message.toLowerCase().includes('alerta') || message.includes('¡Atención!')) return 'alert'
  return 'message'
}

export const apiService = new ApiService()
export default apiService

