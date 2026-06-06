'use server'

import { anthropic } from '@/lib/claude'
import { Task } from '@/store/usePlannerStore'

export async function parseTasksWithClaude(rawText: string): Promise<Task[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set in environment variables')

  const today = new Date().toLocaleDateString('uk-UA')

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Сьогодні ${today}.

Розбий цей brain dump на окремі задачі. Поверни ТІЛЬКИ валідний JSON масив, без пояснень.

Для кожної задачі визнач:
- title: коротка назва задачі (до 60 символів)
- priority: "must" якщо терміново/важливо, "nice" якщо бажано
- duration: оцінка в хвилинах (15, 30, 60, 90, 120)
- deadline: час або дата якщо згадувалась (напр. "15:00", "завтра"), або null
- lifeArea: ОБОВ'ЯЗКОВО обери одну з категорій — "career" (робота, проекти, кар'єра, бізнес), "health" (спорт, здоров'я, медицина, харчування, сон), "learning" (навчання, книги, курси, скіли, розвиток), "relationships" (сім'я, друзі, стосунки, спілкування, зустрічі), "hobby" (хобі, творчість, ігри, розваги, відпочинок), "personal" (особисте, побут, фінанси, покупки, адміністративне). Якщо задача не вписується чітко — обирай найближчу. НІКОЛИ не повертай null.

Формат відповіді:
[{"title":"...","priority":"must","duration":30,"deadline":"15:00","lifeArea":"career"}, ...]

Brain dump:
${rawText}`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response')

  const raw = content.text.trim()
  const match = raw.match(/\[[\s\S]*\]/)
  if (!match) throw new Error('No JSON array found in response')

  const tasks = JSON.parse(match[0])
  return tasks.map((t: Omit<Task, 'id' | 'done' | 'createdAt' | 'scheduledTime' | 'scheduledDate'>) => ({
    ...t,
    id: crypto.randomUUID(),
    done: false,
    createdAt: Date.now(),
    scheduledTime: null,
    scheduledDate: null,
  }))
}

export async function optimizeSchedule(
  tasks: Task[]
): Promise<Array<{ id: string; scheduledTime: string }>> {
  if (tasks.length === 0) return []

  const taskList = tasks
    .map((t, i) => `${i + 1}. [${t.id}] ${t.title} (${t.duration} хв, пріоритет: ${t.priority})`)
    .join('\n')

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: `Ти планувальник часу. Склади оптимальний розклад для цих задач на сьогодні. Починай з 09:00. Враховуй:
- "must" задачі — ставь спочатку
- між задачами роби паузу 5-15 хвилин
- обідня перерва 13:00-14:00

Задачі:
${taskList}

Поверни ТІЛЬКИ валідний JSON масив без пояснень:
[{"id":"<id задачі>","scheduledTime":"HH:MM"}, ...]`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response')

  const raw = content.text.trim()
  const match = raw.match(/\[[\s\S]*\]/)
  if (!match) return []

  return JSON.parse(match[0]) as Array<{ id: string; scheduledTime: string }>
}

export async function generateDebriefReflection(data: {
  date: string
  completedTasks: string[]
  partialTasks: string[]
  notStartedTasks: string[]
  blockers: string[]
  longerTasks: string[]
}): Promise<string> {
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: `Ти особистий коуч-планувальник. Напиши коротку рефлексію дня (3-5 речень) українською мовою.

Дані за ${data.date}:
- Виконані задачі: ${data.completedTasks.length > 0 ? data.completedTasks.join(', ') : 'немає'}
- Частково виконані: ${data.partialTasks.length > 0 ? data.partialTasks.join(', ') : 'немає'}
- Не розпочаті: ${data.notStartedTasks.length > 0 ? data.notStartedTasks.join(', ') : 'немає'}
- Перешкоди: ${data.blockers.length > 0 ? data.blockers.join(', ') : 'немає'}
- Зайняло більше часу: ${data.longerTasks.length > 0 ? data.longerTasks.join(', ') : 'немає'}

Напиши мотивуючу та конструктивну рефлексію. Відзнач успіхи, запропонуй одну конкретну пораду на завтра. Тільки текст, без заголовків.`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response')
  return content.text.trim()
}

export async function generateLifeInsights(data: {
  areaStats: Record<string, { tasks: number; hours: number; done: number }>
  balanceScore: number
  debriefCount: number
}): Promise<string> {
  const statsText = Object.entries(data.areaStats)
    .map(([area, s]) => `${area}: ${s.done}/${s.tasks} задач виконано, ${s.hours.toFixed(1)} год`)
    .join('\n')

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: `Ти особистий коуч. Проаналізуй баланс життєвих сфер і дай конкретні поради (4-6 речень) українською мовою.

Life Balance Score: ${data.balanceScore}/100
Кількість деб'рифів: ${data.debriefCount}

Статистика по сферах:
${statsText}

Визнач найслабші та найсильніші сфери. Запропонуй 1-2 конкретні дії для покращення балансу. Тільки текст, без заголовків і списків.`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response')
  return content.text.trim()
}
