import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { X } from 'lucide-react';
import './TaskNotes.css';

export default function TaskNotes({ task, onClose, onSaveNotes, categoryColor }) {
  const [notes, setNotes] = useState(task.notes || '');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef(null);
  const saveTimerRef = useRef(null);

  // Reset when switching category
  useEffect(() => {
    setNotes(task.notes || '');
    setIsFocused(false);
  }, [task.id]);

  // Debounced auto-save
  const handleChange = useCallback((e) => {
    const val = e.target.value;
    setNotes(val);
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      onSaveNotes(task.id, val);
    }, 600);
  }, [task.id, onSaveNotes]);

  // Save on explicit blur
  const handleBlur = () => {
    setIsFocused(false);
    clearTimeout(saveTimerRef.current);
    onSaveNotes(task.id, notes);
  };

  // Auto-grow textarea to content height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [notes]);

  const handlePreviewClick = () => {
    setIsFocused(true);
    setTimeout(() => {
      textareaRef.current?.focus();
      // Place cursor at end
      const len = textareaRef.current?.value?.length || 0;
      textareaRef.current?.setSelectionRange(len, len);
    }, 50);
  };

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

      <div className="notes-body" onClick={handlePreviewClick}>
        {/* Ghost preview - shown when not focused */}
        {!isFocused && (
          <div className={`notes-preview ${!notes ? 'empty' : ''}`}>
            {notes ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{notes}</ReactMarkdown>
            ) : (
              <p className="notes-placeholder">Click to start writing notes…</p>
            )}
          </div>
        )}

        {/* Textarea - always present in DOM for focus, hidden when not focused */}
        <textarea
          ref={textareaRef}
          className={`notes-textarea ${isFocused ? 'visible' : 'hidden'}`}
          value={notes}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          placeholder="# Notes&#10;&#10;Start writing… markdown is supported."
          spellCheck
        />
      </div>

      {isFocused && (
        <div className="notes-toolbar animate-in">
          <span className="notes-hint">**bold** _italic_ # heading — Markdown supported</span>
          <button className="notes-done-btn" onMouseDown={(e) => { e.preventDefault(); textareaRef.current?.blur(); }}>
            Done
          </button>
        </div>
      )}
    </div>
  );
}
