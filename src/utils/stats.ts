import { format, subDays } from 'date-fns'
import type { ActivityEvent, Task, TaskStatus, TeamMember } from '../types/board'

export const statusDistribution = (tasks: Task[]) => {
  return tasks.reduce<Record<string, number>>((acc, task) => {
    acc[task.status] = (acc[task.status] ?? 0) + 1
    return acc
  }, {})
}

const COMPLETED_STATUS: TaskStatus = 'almacen-entrega'

export const throughputSeries = (activity: ActivityEvent[], days = 7) => {
  const today = new Date()
  return Array.from({ length: days }).map((_, index) => {
    const day = subDays(today, days - index - 1)
    const label = format(day, 'EEE')
    const total = activity.filter(
      (event) => event.to === COMPLETED_STATUS && isSameDay(day, new Date(event.timestamp))
    ).length
    return { label, total }
  })
}

const isSameDay = (dateA: Date, dateB: Date) => {
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  )
}

export const workloadByMember = (tasks: Task[], members: TeamMember[]) => {
  return members.map((member) => ({
    name: member.name.split(' ')[0],
    total: tasks.filter((task) => task.ownerId === member.id).length,
    productivity: member.productivity
  }))
}

export const movementByMember = (activity: ActivityEvent[], members: TeamMember[]) => {
  return members
    .map((member) => ({
      member,
      moves: activity.filter((event) => event.actorId === member.id).length
    }))
    .sort((a, b) => b.moves - a.moves)
}

