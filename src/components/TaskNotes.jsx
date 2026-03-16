import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { X, Edit3, Eye } from 'lucide-react';
import './TaskNotes.css';

export default function TaskNotes({ task, onClose, onSaveNotes, categoryColor }) {
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState(task.notes || '');

  useEffect(() => {
    setNotes(task.notes || '');
    setIsEditing(false); // Reset to preview when switching tasks
  }, [task.id]);

  const handleSave = () => {
    onSaveNotes(task.id, notes);
    setIsEditing(false);
  };

  return (
    <div className="task-notes-panel animate-in">
      <div className="notes-header">
        <h3 className="notes-title" style={{ color: categoryColor }}>
          {task.title}
        </h3>
        <div className="notes-actions">
          <button 
            className="icon-btn" 
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            title={isEditing ? "Preview" : "Edit Notes"}
          >
            {isEditing ? <Eye size={18} /> : <Edit3 size={18} />}
          </button>
          <button className="icon-btn close-btn" onClick={onClose} title="Close Panel">
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="notes-content">
        {isEditing ? (
          <textarea
            className="notes-editor"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Write your markdown notes here..."
            autoFocus
          />
        ) : (
          <div className="markdown-preview">
            {notes ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {notes}
              </ReactMarkdown>
            ) : (
              <div className="empty-notes">
                <p>No notes written yet.</p>
                <button className="start-writing-btn" onClick={() => setIsEditing(true)}>
                  Start writing...
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
