import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Priority = 'must' | 'nice'

export const LIFE_AREAS = ['career', 'health', 'learning', 'relationships', 'hobby', 'personal'] as const
export type LifeArea = typeof LIFE_AREAS[number]

export const AREA_CONFIG: Record<LifeArea, { label: string; color: string; emoji: string }> = {
  career:        { label: "Кар'єра",  color: '#6366f1', emoji: '💼' },
  health:        { label: "Здоров'я", color: '#10b981', emoji: '💪' },
  learning:      { label: 'Навчання',  color: '#f59e0b', emoji: '📚' },
  relationships: { label: 'Стосунки', color: '#ec4899', emoji: '❤️' },
  hobby:         { label: 'Хобі',      color: '#3b82f6', emoji: '🎨' },
  personal:      { label: 'Особисте', color: '#a855f7', emoji: '⭐' },
}

export type Task = {
  id: string
  title: string
  priority: Priority
  duration: number
  deadline: string | null
  done: boolean
  createdAt: number
  lifeArea: LifeArea | null
  scheduledTime: string | null
  scheduledDate: string | null
}

export interface DebriefEntry {
  id: string
  date: string
  completedTaskIds: string[]
  partialTaskIds: string[]
  blockers: string[]
  longerTaskIds: string[]
  aiReflection: string
  createdAt: number
}

function fillTask(t: Partial<Task> & { id: string; title: string; priority: Priority; duration: number; done: boolean; createdAt: number }): Task {
  return {
    deadline: null,
    lifeArea: null,
    scheduledTime: null,
    scheduledDate: null,
    ...t,
  }
}

type Store = {
  inbox: Task[]
  today: Task[]
  history: Task[]
  debriefs: DebriefEntry[]
  lastDebriefDate: string | null

  addToInbox: (tasks: Task[]) => void
  moveToToday: (id: string) => void
  deleteFromInbox: (id: string) => void
  toggleDone: (id: string) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  scheduleTask: (id: string, time: string, date: string) => void
  addDebrief: (entry: DebriefEntry) => void
  archiveToday: () => void
  replaceToday: (tasks: Task[]) => void
}

export const usePlannerStore = create<Store>()(
  persist(
    (set) => ({
      inbox: [],
      today: [],
      history: [],
      debriefs: [],
      lastDebriefDate: null,

      addToInbox: (tasks) =>
        set((state) => ({
          inbox: [...state.inbox, ...tasks.map(fillTask)],
        })),

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

      updateTask: (id, updates) =>
        set((state) => ({
          inbox: state.inbox.map((t) => (t.id === id ? { ...t, ...updates } : t)),
          today: state.today.map((t) => (t.id === id ? { ...t, ...updates } : t)),
          history: state.history.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        })),

      scheduleTask: (id, time, date) =>
        set((state) => ({
          today: state.today.map((t) =>
            t.id === id ? { ...t, scheduledTime: time, scheduledDate: date } : t
          ),
        })),

      addDebrief: (entry) =>
        set((state) => ({
          debriefs: [...state.debriefs, entry],
          lastDebriefDate: entry.date,
        })),

      archiveToday: () =>
        set((state) => {
          const done = state.today.filter((t) => t.done)
          const notDone = state.today.filter((t) => !t.done)
          return {
            today: notDone,
            history: [...state.history, ...done],
          }
        }),

      replaceToday: (tasks) =>
        set(() => ({ today: tasks })),
    }),
    {
      name: 'ai-planner-store',
      version: 3,
      skipHydration: true,
      migrate: (persistedState: unknown, version: number) => {
        try {
          const state = persistedState as Partial<Store> & {
            inbox?: Partial<Task>[]
            today?: Partial<Task>[]
            history?: Partial<Task>[]
          }
          const patchTask = (t: Partial<Task>): Task => {
            const validLifeArea = LIFE_AREAS.includes(t.lifeArea as LifeArea)
              ? (t.lifeArea as LifeArea)
              : null
            return {
              deadline: null,
              scheduledTime: null,
              scheduledDate: null,
              ...t,
              // Sanitise lifeArea — replace any value not in the known list with null
              lifeArea: validLifeArea,
            } as Task
          }

          const patch = (tasks: Partial<Task>[] | undefined): Task[] =>
            (tasks ?? []).map(patchTask)

          // Always patch — sanitises lifeArea on all existing data regardless of version
          return {
            ...state,
            inbox: patch(state.inbox),
            today: patch(state.today),
            history: patch(state.history ?? []),
            debriefs: Array.isArray(state.debriefs) ? state.debriefs : [],
            lastDebriefDate: state.lastDebriefDate ?? null,
          } as Store
        } catch {
          // If migration crashes for any reason, start fresh
          return {
            inbox: [],
            today: [],
            history: [],
            debriefs: [],
            lastDebriefDate: null,
          } as unknown as Store
        }
      },
    }
  )
)
