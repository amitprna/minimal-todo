import { useState } from 'react';
import { CheckCircle2, Circle, ChevronDown, ChevronRight, Pin, Plus, Trash2, Edit3 } from 'lucide-react';
import './TaskItem.css';
import { v4 as uuidv4 } from 'uuid';

export default function TaskItem({ 
  task, 
  categoryColor, 
  onToggleComplete, 
  onTogglePin, 
  onDelete,
  onUpdateSubtasks,
  onUpdateTitle,
  onSelectTask,
  isSelected
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [newSubtask, setNewSubtask] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);

  const saveEdit = () => {
    if (editTitle.trim() && editTitle.trim() !== task.title) {
      onUpdateTitle(task.id, editTitle.trim());
    } else {
      setEditTitle(task.title);
    }
    setIsEditing(false);
  };

  const toggleSubtask = (subtaskId) => {
    const updatedSubtasks = task.subtasks.map(st => 
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    onUpdateSubtasks(task.id, updatedSubtasks);
  };

  const addSubtask = (e) => {
    if (e.key === 'Enter' && newSubtask.trim()) {
      const updatedSubtasks = [
        ...task.subtasks,
        { id: uuidv4(), title: newSubtask.trim(), completed: false }
      ];
      onUpdateSubtasks(task.id, updatedSubtasks);
      setNewSubtask('');
    }
  };

  const deleteSubtask = (subtaskId) => {
    const updatedSubtasks = task.subtasks.filter(st => st.id !== subtaskId);
    onUpdateSubtasks(task.id, updatedSubtasks);
  };

  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  
  // Completed subtasks count
  const completedSubtasks = task.subtasks?.filter(st => st.completed).length || 0;

  return (
    <div 
      className={`task-item animate-in ${task.pinned ? 'pinned' : ''} ${task.completed ? 'completed' : ''} ${isSelected ? 'selected' : ''}`}
      style={{ '--task-color': categoryColor }}
      onClick={() => onSelectTask && onSelectTask(task)}
    >
      <div className="task-main">
        {/* Check button */}
        <button 
          className="task-check-btn" 
          onClick={() => onToggleComplete(task.id)}
          aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
        >
          {task.completed ? 
            <CheckCircle2 className="icon-completed" size={24} style={{ color: categoryColor }} /> : 
            <Circle className="icon-incomplete" size={24} />
          }
        </button>

        {/* Title area */}
        <div className="task-content">
          {isEditing ? (
            <input 
              type="text"
              className="task-edit-input"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={saveEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveEdit();
                if (e.key === 'Escape') { setEditTitle(task.title); setIsEditing(false); }
              }}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div className="task-title-wrapper" onClick={() => setIsExpanded(!isExpanded)}>
              <span className={`task-title ${task.completed ? 'text-muted strike' : ''}`}>
                {task.title}
              </span>
              {hasSubtasks && (
                <span className="subtask-indicator">
                  {completedSubtasks}/{task.subtasks.length}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="task-actions">
          <button 
            className="action-btn edit-btn"
            onClick={(e) => { e.stopPropagation(); setIsEditing(true); setIsExpanded(false); }}
            aria-label="Edit task"
            title="Edit"
          >
            <Edit3 size={18} />
          </button>
          <button 
            className={`action-btn ${task.pinned ? 'active-pin' : ''}`}
            onClick={(e) => { e.stopPropagation(); onTogglePin(task.id); }}
            aria-label={task.pinned ? "Unpin task" : "Pin task"}
            title={task.pinned ? "Unpin" : "Pin"}
          >
            <Pin size={18} fill={task.pinned ? "currentColor" : "none"} />
          </button>
          <button 
            className="action-btn delete-btn"
            onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
            aria-label="Delete task"
            title="Delete"
          >
            <Trash2 size={18} />
          </button>
          <button 
            className="action-btn"
            onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>
      </div>

      {/* Subtasks Section */}
      {isExpanded && !task.completed && (
        <div className="subtasks-container animate-in">
          <div className="subtasks-list">
            {task.subtasks?.map(subtask => (
              <div key={subtask.id} className="subtask-item">
                <button 
                  className="task-check-btn subtask-check" 
                  onClick={() => toggleSubtask(subtask.id)}
                >
                  {subtask.completed ? 
                    <CheckCircle2 size={18} style={{ color: categoryColor }} /> : 
                    <Circle size={18} className="text-muted" />
                  }
                </button>
                <span className={`subtask-title ${subtask.completed ? 'text-muted strike' : ''}`}>
                  {subtask.title}
                </span>
                <button 
                  className="action-btn delete-btn small"
                  onClick={() => deleteSubtask(subtask.id)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          
          <div className="add-subtask-container">
            <Plus size={16} className="text-muted" />
            <input 
              type="text" 
              className="add-subtask-input" 
              placeholder="Add subtask..."
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              onKeyDown={addSubtask}
            />
          </div>
        </div>
      )}
    </div>
  );
}
