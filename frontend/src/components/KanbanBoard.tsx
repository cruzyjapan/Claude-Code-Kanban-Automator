import React from 'react'
import { Task, TaskStatus } from '../types/index'
import KanbanColumn from './KanbanColumn'
import TaskCard from './TaskCard'
import { useLanguage } from '../contexts/LanguageContext'

interface KanbanBoardProps {
  tasks: Task[]
  onTasksChange: (tasks: Task[]) => void
}

export default function KanbanBoard({ tasks }: KanbanBoardProps) {
  const { t } = useLanguage()

  const columns: { id: TaskStatus; title: string }[] = [
    { id: 'pending', title: t('task.pending') },
    { id: 'requested', title: t('task.requested') },
    { id: 'working', title: t('task.working') },
    { id: 'review', title: t('task.review') },
    { id: 'completed', title: t('task.completed') },
  ]

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks
      .filter(task => task.status === status)
      .sort((a, b) => {
        // Sort by updated_at descending, then by created_at descending
        const aTime = new Date(a.updated_at).getTime()
        const bTime = new Date(b.updated_at).getTime()
        if (aTime !== bTime) {
          return bTime - aTime
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 h-[calc(100vh-300px)] min-h-[600px]">
      {columns.map((column) => {
        const columnTasks = getTasksByStatus(column.id)
        
        return (
          <KanbanColumn
            key={column.id}
            id={column.id}
            title={column.title}
            count={columnTasks.length}
          >
            {columnTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </KanbanColumn>
        )
      })}
    </div>
  )
}