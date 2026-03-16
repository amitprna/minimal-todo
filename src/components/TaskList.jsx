import { useState } from 'react';
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
  onSelectTask,
  selectedTaskId
}) {
  const [showCompleted, setShowCompleted] = useState(false);

  // Filter tasks
  const pinnedTasks = tasks.filter(t => t.pinned && !t.completed);
  const activeTasks = tasks.filter(t => !t.pinned && !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  if (tasks.length === 0) {
    return (
      <div className="empty-state animate-in">
        <p>No tasks yet. Create a beautiful moment.</p>
      </div>
    );
  }

  const renderTask = (task, delayIndex) => (
    <div key={task.id} style={{ animationDelay: `${delayIndex * 0.05}s` }}>
      <TaskItem 
        task={task}
        categoryColor={categoryColor}
        onToggleComplete={onToggleComplete}
        onTogglePin={onTogglePin}
        onDelete={onDelete}
        onUpdateSubtasks={onUpdateSubtasks}
        onSelectTask={onSelectTask}
        isSelected={selectedTaskId === task.id}
      />
    </div>
  );

  return (
    <div className="task-list-container">
      {/* Pinned Tasks */}
      {pinnedTasks.length > 0 && (
        <div className="task-group animate-in">
          {pinnedTasks.map((task, index) => renderTask(task, index))}
        </div>
      )}

      {/* Active Tasks */}
      {activeTasks.length > 0 && (
        <div className="task-group animate-in">
          {activeTasks.map((task, index) => renderTask(task, index + pinnedTasks.length))}
        </div>
      )}

      {/* Completed Tasks Collapsible section */}
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
