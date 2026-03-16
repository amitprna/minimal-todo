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
  onReorder   // (newOrderedTasks) => void
}) {
  const [showCompleted, setShowCompleted] = useState(false);
  const dragIdRef  = useRef(null); // id of item being dragged
  const dragOverIdRef = useRef(null); // id of item being dragged over
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);

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

  // ── Drag helpers ───────────────────────────────────────────────────────────
  const handleDragStart = (e, id) => {
    dragIdRef.current = id;
    setDraggingId(id);
    e.dataTransfer.effectAllowed = 'move';
    // minimal ghost: use the element itself
    e.dataTransfer.setDragImage(e.currentTarget, 20, 20);
  };

  const handleDragOver = (e, id) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (id !== dragIdRef.current) {
      dragOverIdRef.current = id;
      setDragOverId(id);
    }
  };

  const handleDrop = (e, targetId) => {
    e.preventDefault();
    const fromId = dragIdRef.current;
    if (!fromId || fromId === targetId) return;

    // Reorder within the full tasks array (preserving non-dragged items' order)
    const allIds = tasks.map(t => t.id);
    const fromIdx = allIds.indexOf(fromId);
    const toIdx   = allIds.indexOf(targetId);
    if (fromIdx === -1 || toIdx === -1) return;

    const reordered = [...tasks];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    onReorder(reordered);

    dragIdRef.current    = null;
    dragOverIdRef.current = null;
    setDraggingId(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    dragIdRef.current    = null;
    dragOverIdRef.current = null;
    setDraggingId(null);
    setDragOverId(null);
  };

  // ── Render a single draggable task row ────────────────────────────────────
  const renderTask = (task, delayIndex) => (
    <div
      key={task.id}
      draggable
      onDragStart={(e) => handleDragStart(e, task.id)}
      onDragOver={(e)  => handleDragOver(e,  task.id)}
      onDrop={(e)      => handleDrop(e,      task.id)}
      onDragEnd={handleDragEnd}
      className={`task-drag-wrapper
        ${draggingId === task.id ? 'dragging' : ''}
        ${dragOverId === task.id && draggingId !== task.id ? 'drag-over' : ''}
      `}
      style={{ animationDelay: `${delayIndex * 0.05}s` }}
    >
      <TaskItem 
        task={task}
        categoryColor={categoryColor}
        onToggleComplete={onToggleComplete}
        onTogglePin={onTogglePin}
        onDelete={onDelete}
        onUpdateSubtasks={onUpdateSubtasks}
      />
    </div>
  );

  return (
    <div className="task-list-container">
      {pinnedTasks.length > 0 && (
        <div className="task-group animate-in">
          {pinnedTasks.map((task, index) => renderTask(task, index))}
        </div>
      )}

      {activeTasks.length > 0 && (
        <div className="task-group animate-in">
          {activeTasks.map((task, index) => renderTask(task, index + pinnedTasks.length))}
        </div>
      )}

      {completedTasks.length > 0 && (
        <div className="completed-section animate-in" style={{ animationDelay: '0.2s' }}>
          <button 
            className="completed-header"
            onClick={() => setShowCompleted(!showCompleted)}
          >
            <div className="completed-title-area">
              {showCompleted ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              <span>Completed ({completedTasks.length})</span>
            </div>
          </button>
          
          {showCompleted && (
            <div className="completed-list animate-in">
              {completedTasks.map((task, index) => renderTask(task, index))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
