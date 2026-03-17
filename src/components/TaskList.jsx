import { useState, useRef } from 'react';
import TaskItem from './TaskItem';
import { ChevronDown, ChevronRight } from 'lucide-react';
import './TaskList.css';

export default function TaskList({ 
  tasks, 
  categoryColor, 
  onToggleComplete, 
  onTogglePin, 
  onDelete,
  onUpdateSubtasks,
  onUpdateTitle,
  onReorder
}) {
  const [showCompleted, setShowCompleted] = useState(false);
  const dragIdRef = useRef(null);
  // { id, position: 'top' | 'bottom' }
  const [dropTarget, setDropTarget] = useState(null);

  const pinnedTasks    = tasks.filter(t => t.pinned && !t.completed);
  const activeTasks    = tasks.filter(t => !t.pinned && !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  if (tasks.length === 0) {
    return (
      <div className="empty-state animate-in">
        <p>No tasks yet.</p>
        <span className="empty-add-hint">↑ Add a task above</span>
      </div>
    );
  }

  const handleDragStart = (e, id) => {
    dragIdRef.current = id;
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, id) => {
    e.preventDefault();
    if (id === dragIdRef.current) return;
    // Determine top-half vs bottom-half
    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const position = e.clientY < midY ? 'top' : 'bottom';
    setDropTarget({ id, position });
  };

  const handleDrop = (e, targetId) => {
    e.preventDefault();
    const fromId = dragIdRef.current;
    if (!fromId || fromId === targetId) { resetDrag(); return; }

    const allIds = tasks.map(t => t.id);
    const fromIdx = allIds.indexOf(fromId);
    let toIdx = allIds.indexOf(targetId);
    if (fromIdx === -1 || toIdx === -1) { resetDrag(); return; }

    // Adjust insert index based on direction
    const position = dropTarget?.position ?? 'bottom';
    const reordered = [...tasks];
    const [moved] = reordered.splice(fromIdx, 1);
    // Recalculate toIdx after removal
    const newToIdx = reordered.findIndex(t => t.id === targetId);
    const insertAt = position === 'top' ? newToIdx : newToIdx + 1;
    reordered.splice(insertAt, 0, moved);
    onReorder(reordered);
    resetDrag();
  };

  const handleDragEnd = () => resetDrag();
  const resetDrag = () => { dragIdRef.current = null; setDropTarget(null); };

  const renderTask = (task, delayIndex) => {
    const isDragging = dragIdRef.current === task.id;
    const isTarget = dropTarget?.id === task.id && !isDragging;
    const pos = dropTarget?.position;
    return (
      <div
        key={task.id}
        draggable
        onDragStart={(e) => handleDragStart(e, task.id)}
        onDragOver={(e)  => handleDragOver(e,  task.id)}
        onDrop={(e)      => handleDrop(e,      task.id)}
        onDragEnd={handleDragEnd}
        className={[
          'task-drag-wrapper',
          isDragging ? 'dragging' : '',
          isTarget && pos === 'top'    ? 'drop-top'    : '',
          isTarget && pos === 'bottom' ? 'drop-bottom' : '',
        ].join(' ')}
        style={{ animationDelay: `${delayIndex * 0.05}s` }}
      >
        <TaskItem 
          task={task}
          categoryColor={categoryColor}
          onToggleComplete={onToggleComplete}
          onTogglePin={onTogglePin}
          onDelete={onDelete}
          onUpdateSubtasks={onUpdateSubtasks}
          onUpdateTitle={onUpdateTitle}
        />
      </div>
    );
  };

  return (
    <div className="task-list-container">
      {pinnedTasks.length > 0 && (
        <div className="task-group animate-in">
          {pinnedTasks.map((task, i) => renderTask(task, i))}
        </div>
      )}
      {activeTasks.length > 0 && (
        <div className="task-group animate-in">
          {activeTasks.map((task, i) => renderTask(task, i + pinnedTasks.length))}
        </div>
      )}
      {completedTasks.length > 0 && (
        <div className="completed-section animate-in" style={{ animationDelay: '0.2s' }}>
          <button className="completed-header" onClick={() => setShowCompleted(!showCompleted)}>
            <div className="completed-title-area">
              {showCompleted ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              <span>Completed ({completedTasks.length})</span>
            </div>
          </button>
          {showCompleted && (
            <div className="completed-list animate-in">
              {completedTasks.map((task, i) => renderTask(task, i))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
