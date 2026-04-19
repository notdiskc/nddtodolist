import { type DragEvent } from 'react'
import checkIcon from '../assets/check.svg'
import deleteIcon from '../assets/delete.svg'

type TaskCardProps = {
  title: string
  deadline: string | null
  completed: boolean
  onToggle: () => void
  onDelete: () => void
  onDragStart: (event: DragEvent<HTMLElement>) => void
  onDragOver: (event: DragEvent<HTMLElement>) => void
  onDrop: (event: DragEvent<HTMLElement>) => void
}

export function TaskCard({
  title,
  deadline,
  completed,
  onToggle,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
}: TaskCardProps) {
  return (
    <article
      className={`task-card${completed ? ' task-card--completed' : ''}`}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className="task-card__content">
        <span className="task-card__title">{title}</span>
        {deadline ? (
          <span className="task-card__deadline">Выполнить к {deadline}</span>
        ) : null}
      </div>
      <div className="task-card__actions">
        <button
          className={`task-card__check${completed ? ' task-card__check--completed' : ''}`}
          type="button"
          aria-label={
            completed
              ? `Отметить задачу "${title}" как невыполненную`
              : `Отметить задачу "${title}" как выполненную`
          }
          aria-pressed={completed}
          onClick={onToggle}
        >
          <img className="task-card__icon" src={checkIcon} alt="" aria-hidden="true" />
        </button>
        <button
          className="task-card__delete"
          type="button"
          aria-label={`Удалить задачу "${title}"`}
          onClick={onDelete}
        >
          <img className="task-card__icon" src={deleteIcon} alt="" aria-hidden="true" />
        </button>
      </div>
    </article>
  )
}
