import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import NotionEditor from './NotionEditor';
import './TaskNotes.css';

export default function TaskNotes({ task, onClose, onSaveNotes, categoryColor }) {
  // Save on unmount with latest content (handled by onSave inside NotionEditor via debounce)
  return (
    <div className="task-notes-panel animate-in">
      <div className="notes-header">
        <div className="notes-title-area">
          <div className="notes-color-bar" style={{ backgroundColor: categoryColor }} />
          <h3 className="notes-title">{task.title}</h3>
        </div>
        <button className="icon-btn close-btn" onClick={onClose} title="Close panel">
          <X size={18} />
        </button>
      </div>

      <div className="notes-body">
        <NotionEditor
          initialContent={task.notes || ''}
          onSave={(text) => onSaveNotes(task.id, text)}
          placeholder="Markdown supported..."
        />
      </div>
    </div>
  );
}
