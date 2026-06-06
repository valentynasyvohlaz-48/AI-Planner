import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Priority = 'must' | 'nice'

export type Task = {
  id: string
  title: string
  priority: Priority
  duration: number
  deadline: string | null
  done: boolean
  createdAt: number
}

type Store = {
  inbox: Task[]
  today: Task[]
  addToInbox: (tasks: Task[]) => void
  moveToToday: (id: string) => void
  deleteFromInbox: (id: string) => void
  toggleDone: (id: string) => void
}

export const usePlannerStore = create<Store>()(
  persist(
    (set) => ({
      inbox: [],
      today: [],

      addToInbox: (tasks) =>
        set((state) => ({ inbox: [...state.inbox, ...tasks] })),

      moveToToday: (id) =>
        set((state) => {
          const task = state.inbox.find((t) => t.id === id)
          if (!task) return state
          return {
            inbox: state.inbox.filter((t) => t.id !== id),
            today: [...state.today, task],
          }
        }),

      deleteFromInbox: (id) =>
        set((state) => ({ inbox: state.inbox.filter((t) => t.id !== id) })),

      toggleDone: (id) =>
        set((state) => ({
          today: state.today.map((t) =>
            t.id === id ? { ...t, done: !t.done } : t
          ),
        })),
    }),
    { name: 'ai-planner-store' }
  )
)
