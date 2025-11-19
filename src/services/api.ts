import { initialActivity, initialTasks, teamMembers } from '../data/mockData'
import { supabase } from './supabaseClient'

const LEGACY_API_BASE_URL = import.meta.env.VITE_API_BASE_URL
const hasLegacyBackend = Boolean(LEGACY_API_BASE_URL)

type ApiResponse<T> = {
  success: boolean
  data?: T
  error?: string
  message?: string
}

type OrdenTrabajo = {
  id: number
  numero_op: string
  cliente: string
  descripcion?: string
  estado: string
  prioridad: string
  fecha_creacion?: string
  fecha_entrega?: string
  fecha_ingreso?: string
  operario_asignado?: string
  complejidad?: string
  sector?: string
  materiales?: string
  nombre_creador?: string
}

type UsuarioRecord = {
  id: number
  nombre: string
  rol: 'administracion' | 'taller' | 'mostrador'
}

type HistorialMovimiento = {
  id: number
  id_orden: number
  estado_anterior: string
  estado_nuevo: string
  id_usuario: number
  timestamp: string
  comentario?: string
}

type ChatMessage = {
  id: number
  canal: string
  usuario_id: number
  nombre_usuario?: string
  contenido: string
  tipo: 'message' | 'alert' | 'buzz'
  timestamp: string
}

const fallbackOrdenes: OrdenTrabajo[] = initialTasks.map((task, index) => ({
  id: index + 1,
  numero_op: task.opNumber,
  cliente: task.title,
  descripcion: task.summary,
  estado: mapStatusToEstado(task.status),
  prioridad: mapPriorityToDb(task.priority),
  fecha_creacion: task.createdAt,
  fecha_entrega: task.dueDate,
  fecha_ingreso: task.updatedAt,
  operario_asignado: task.ownerId,
  complejidad: mapImpactToComplejidad(task.impact),
  sector: task.assignedSector,
  materiales: task.materials?.join(', '),
  nombre_creador: task.createdBy
}))

const fallbackHistorial: HistorialMovimiento[] = initialActivity.map((event, index) => ({
  id: index + 1,
  id_orden: fallbackOrdenes[index % fallbackOrdenes.length]?.id ?? index + 1,
  estado_anterior: mapStatusToEstado(event.from),
  estado_nuevo: mapStatusToEstado(event.to),
  id_usuario: index + 1,
  timestamp: event.timestamp,
  comentario: event.note
}))

const fallbackUsuarios: UsuarioRecord[] = teamMembers.map((member, index) => ({
  id: index + 1,
  nombre: member.name,
  rol: (index % 2 === 0 ? 'administracion' : 'taller')
}))

const fallbackMensajes: ChatMessage[] = initialActivity.slice(0, 4).map((event, index) => ({
  id: index + 1,
  canal: 'general',
  usuario_id: index + 1,
  contenido: event.note || 'Actualización',
  tipo: 'message',
  timestamp: event.timestamp
}))

const chatChannelToRoom: Record<string, number> = {
  general: 1,
  'taller-grafico': 2,
  mostrador: 3
}

const roomToChatChannel = Object.fromEntries(
  Object.entries(chatChannelToRoom).map(([key, value]) => [value, key])
) as Record<number, string>

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
      const { data, error } = await supabase
        .from('ordenes_trabajo')
        .select('*')
        .order('fecha_creacion', { ascending: false })

      if (error) {
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
      const { data, error } = await supabase
        .from('ordenes_trabajo')
        .insert(orden)
        .select()
        .single()

      if (error) return { success: false, error: error.message }
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
      const { data, error } = await supabase
        .from('ordenes_trabajo')
        .update(orden)
        .eq('id', id)
        .select()
        .single()

      if (error) return { success: false, error: error.message }
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

      await supabase.from('historial_movimientos').insert({
        id_orden: id,
        estado_anterior: currentEstado,
        estado_nuevo: nuevoEstado,
        id_usuario: usuarioId,
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
  async getMensajesChat(canal: string, limit: number = 50): Promise<ApiResponse<ChatMessage[]>> {
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

      return { success: true, data: (mensajes.reverse() as ChatMessage[]) }
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
  }): Promise<ApiResponse<ChatMessage>> {
    if (supabase) {
      const roomId = chatChannelToRoom[mensaje.canal] ?? 1

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
        } as ChatMessage
      }
    }

    if (hasLegacyBackend) {
      return this.legacyRequest('/chat/mensajes.php', {
        method: 'POST',
        body: JSON.stringify(mensaje)
      })
    }

    const nuevoMensaje: ChatMessage = {
      id: fallbackMensajes.length + 1,
      canal: mensaje.canal,
      usuario_id: mensaje.usuario_id,
      contenido: mensaje.contenido,
      tipo: (mensaje.tipo as ChatMessage['tipo']) || 'message',
      timestamp: new Date().toISOString()
    }

    fallbackMensajes.push(nuevoMensaje)
    return { success: true, data: nuevoMensaje }
  }

  async enviarZumbido(
    _usuarioDestinoId: number,
    usuarioOrigenId: number,
    canal: string
  ): Promise<ApiResponse<ChatMessage>> {
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
  ): Promise<ApiResponse<ChatMessage>> {
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
}

function mapStatusToEstado(status: string): string {
  const mapping: Record<string, string> = {
    'diseno-grafico': 'Diseño Gráfico',
    'diseno-proceso': 'Diseño en Proceso',
    'en-espera': 'En Espera',
    imprenta: 'Imprenta (Área de Impresión)',
    'taller-imprenta': 'Taller de Imprenta',
    'taller-grafico': 'Taller Gráfico',
    instalaciones: 'Instalaciones',
    metalurgica: 'Metalúrgica',
    'finalizado-taller': 'Finalizado en Taller',
    'almacen-entrega': 'Almacén de Entrega'
  }
  return mapping[status] || status
}

function mapPriorityToDb(priority: string | undefined): string {
  const mapping: Record<string, string> = {
    alta: 'Alta',
    media: 'Normal',
    baja: 'Baja'
  }
  if (!priority) return 'Normal'
  return mapping[priority] || priority
}

function mapImpactToComplejidad(impact: string | undefined): string {
  const mapping: Record<string, string> = {
    alta: 'Alta',
    media: 'Media',
    low: 'Baja'
  }
  if (!impact) return 'Media'
  return mapping[impact] || impact
}

function inferChatType(message: string): ChatMessage['tipo'] {
  if (!message) return 'message'
  if (message.toLowerCase().includes('zumbido')) return 'buzz'
  if (message.toLowerCase().includes('alerta') || message.includes('¡Atención!')) return 'alert'
  return 'message'
}

export const apiService = new ApiService()
export default apiService

