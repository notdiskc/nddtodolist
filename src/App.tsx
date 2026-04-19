import { type DragEvent, type FormEvent, useEffect, useState } from 'react'
import { TaskCard } from './components/TaskCard'

type Task = {
  id: number
  title: string
  completed: boolean
  deadline: string | null
}

const TASKS_STORAGE_KEY = 'tasks'

const defaultTasks: Task[] = []

const deadlineFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

function formatDeadline(deadline: string | null) {
  if (!deadline) {
    return null
  }

  const date = new Date(deadline)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return deadlineFormatter.format(date)
}

function loadTasks() {
  const savedTasks = localStorage.getItem(TASKS_STORAGE_KEY)

  if (!savedTasks) {
    return defaultTasks
  }

  try {
    const parsedTasks = JSON.parse(savedTasks)

    if (!Array.isArray(parsedTasks)) {
      return defaultTasks
    }

    return parsedTasks.filter(
      (task): task is Task =>
        typeof task?.id === 'number' &&
        typeof task?.title === 'string' &&
        typeof task?.completed === 'boolean' &&
        (typeof task?.deadline === 'string' || task?.deadline === null),
    )
  } catch {
    return defaultTasks
  }
}

function App() {
  const [tasks, setTasks] = useState<Task[]>(loadTasks)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDeadline, setNewTaskDeadline] = useState('')

  const activeTasks = tasks.filter((task) => !task.completed)
  const completedTasks = tasks.filter((task) => task.completed)

  useEffect(() => {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks))
  }, [tasks])

  const addTask = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const title = newTaskTitle.trim()

    if (!title) {
      return
    }

    setTasks((currentTasks) => {
      const newTask = {
        id: Date.now(),
        title,
        completed: false,
        deadline: newTaskDeadline || null,
      }
      const firstCompletedIndex = currentTasks.findIndex((task) => task.completed)

      if (firstCompletedIndex === -1) {
        return [...currentTasks, newTask]
      }

      return [
        ...currentTasks.slice(0, firstCompletedIndex),
        newTask,
        ...currentTasks.slice(firstCompletedIndex),
      ]
    })
    setNewTaskTitle('')
    setNewTaskDeadline('')
  }

  const deleteTask = (taskId: number) => {
    setTasks((currentTasks) =>
      currentTasks.filter((task) => task.id !== taskId),
    )
  }

  const toggleTask = (taskId: number) => {
    setTasks((currentTasks) => {
      const taskToToggle = currentTasks.find((task) => task.id === taskId)

      if (!taskToToggle) {
        return currentTasks
      }

      const remainingTasks = currentTasks.filter((task) => task.id !== taskId)
      const toggledTask = {
        ...taskToToggle,
        completed: !taskToToggle.completed,
      }

      if (toggledTask.completed) {
        return [...remainingTasks, toggledTask]
      }

      const firstCompletedIndex = remainingTasks.findIndex((task) => task.completed)

      if (firstCompletedIndex === -1) {
        return [...remainingTasks, toggledTask]
      }

      return [
        ...remainingTasks.slice(0, firstCompletedIndex),
        toggledTask,
        ...remainingTasks.slice(firstCompletedIndex),
      ]
    })
  }

  const handleDragStart = (
    event: DragEvent<HTMLElement>,
    taskId: number,
  ) => {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(taskId))
  }

  const handleDrop = (
    event: DragEvent<HTMLElement>,
    targetTaskId: number,
    completed: boolean,
  ) => {
    event.preventDefault()

    const sourceTaskId = Number(event.dataTransfer.getData('text/plain'))

    if (!sourceTaskId || sourceTaskId === targetTaskId) {
      return
    }

    setTasks((currentTasks) => {
      const sourceTask = currentTasks.find((task) => task.id === sourceTaskId)
      const targetTask = currentTasks.find((task) => task.id === targetTaskId)

      if (!sourceTask || !targetTask || sourceTask.completed !== completed) {
        return currentTasks
      }

      const sectionTasks = currentTasks.filter(
        (task) => task.completed === completed,
      )
      const sourceIndex = sectionTasks.findIndex((task) => task.id === sourceTaskId)
      const targetIndex = sectionTasks.findIndex((task) => task.id === targetTaskId)

      if (sourceIndex === -1 || targetIndex === -1) {
        return currentTasks
      }

      const reorderedTasks = [...sectionTasks]
      const [movedTask] = reorderedTasks.splice(sourceIndex, 1)
      reorderedTasks.splice(targetIndex, 0, movedTask)

      let reorderedIndex = 0

      return currentTasks.map((task) => {
        if (task.completed !== completed) {
          return task
        }

        const nextTask = reorderedTasks[reorderedIndex]
        reorderedIndex += 1
        return nextTask
      })
    })
  }

  return (
    <main className="app-shell">
      <section className="app-panel">
        <h1 className="app-title">Планировщик задач</h1>
        <form className="task-form" onSubmit={addTask}>
          <input
            className="task-form__input"
            type="text"
            placeholder="Добавить новую задачу"
            value={newTaskTitle}
            onChange={(event) => setNewTaskTitle(event.target.value)}
          />
          <input
            className="task-form__input task-form__input--date"
            type="datetime-local"
            value={newTaskDeadline}
            onChange={(event) => setNewTaskDeadline(event.target.value)}
          />
          <button className="task-form__submit" type="submit">
            Добавить
          </button>
        </form>
        <div className="task-columns">
          <section className="task-section">
            <div className="task-section__header">
              <h2 className="task-section__title">Текущие</h2>
              <span className="task-section__count">{activeTasks.length}</span>
            </div>
            <div className="task-list">
              {activeTasks.length === 0 ? (
                <p className="task-list__empty">Новых задач пока нет.</p>
              ) : (
                activeTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    title={task.title}
                    deadline={formatDeadline(task.deadline)}
                    completed={task.completed}
                    onToggle={() => toggleTask(task.id)}
                    onDelete={() => deleteTask(task.id)}
                    onDragStart={(event) => handleDragStart(event, task.id)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => handleDrop(event, task.id, false)}
                  />
                ))
              )}
            </div>
          </section>

          <section className="task-section">
            <div className="task-section__header">
              <h2 className="task-section__title">Выполненные</h2>
              <span className="task-section__count">
                {completedTasks.length}
              </span>
            </div>
            <div className="task-list">
              {completedTasks.length === 0 ? (
                <p className="task-list__empty">Выполненные задачи появятся здесь.</p>
              ) : (
                completedTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    title={task.title}
                    deadline={formatDeadline(task.deadline)}
                    completed={task.completed}
                    onToggle={() => toggleTask(task.id)}
                    onDelete={() => deleteTask(task.id)}
                    onDragStart={(event) => handleDragStart(event, task.id)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => handleDrop(event, task.id, true)}
                  />
                ))
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  )
}

export default App
