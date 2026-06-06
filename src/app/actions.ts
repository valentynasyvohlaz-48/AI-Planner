'use server'

import { anthropic } from '@/lib/claude'
import { Task } from '@/store/usePlannerStore'

export async function parseTasksWithClaude(rawText: string): Promise<Task[]> {
  const today = new Date().toLocaleDateString('uk-UA')

  const message = await anthropic.messages.create({
    model: 'claude-3-5-haiku-20241022',
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

Формат відповіді:
[{"title":"...","priority":"must","duration":30,"deadline":"15:00"}, ...]

Brain dump:
${rawText}`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response')

  const raw = content.text.trim()
  // extract JSON array even if wrapped in markdown code block
  const match = raw.match(/\[[\s\S]*\]/)
  if (!match) throw new Error('No JSON array found in response')

  const tasks = JSON.parse(match[0])
  return tasks.map((t: Omit<Task, 'id' | 'done' | 'createdAt'>) => ({
    ...t,
    id: crypto.randomUUID(),
    done: false,
    createdAt: Date.now(),
  }))
}
