import { useState, useCallback, useRef } from 'react'
import { Plus, Edit3, Trash2, Palette } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { useLocalStorage } from './hooks/useLocalStorage'
import TaskList from './components/TaskList'
import TaskNotes from './components/TaskNotes'
import './App.css'

const CATEGORY_COLORS = [
  'var(--color-sage)',
  'var(--color-slate)',
  'var(--color-sand)',
  'var(--color-clay)',
  'var(--color-rose)',
  'var(--color-peach)',
];

// Resolved hex-like values for the color swatch display
const COLOR_SWATCHES = [
  { label: 'Sage',  value: 'var(--color-sage)',  hex: '#6fa664' },
  { label: 'Slate', value: 'var(--color-slate)', hex: '#6d8fa3' },
  { label: 'Sand',  value: 'var(--color-sand)',  hex: '#c4aa8f' },
  { label: 'Clay',  value: 'var(--color-clay)',  hex: '#b8714f' },
  { label: 'Rose',  value: 'var(--color-rose)',  hex: '#c8788a' },
  { label: 'Peach', value: 'var(--color-peach)', hex: '#e88a66' },
];

const initialCategories = [
  { id: '1', name: 'Personal', color: 'var(--color-sage)' },
  { id: '2', name: 'Work', color: 'var(--color-slate)' },
  { id: '3', name: 'Groceries', color: 'var(--color-sand)' },
  { id: '4', name: 'Projects', color: 'var(--color-clay)' },
  { id: '5', name: 'Ideas', color: 'var(--color-rose)' }
];

// iPhone-style "ding" — single clean C6 tone with fast attack, smooth decay
const playCompleteSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const t = ctx.currentTime;

    // Primary tone: C6 (1046 Hz) — the core iPhone ding pitch
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1046.5, t);
    // Fast linear attack to prevent click
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.28, t + 0.008);
    // Smooth exponential decay like a physical bell
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
    osc.start(t);
    osc.stop(t + 0.7);

    // Subtle harmonic at 2x to add warmth
    const osc2  = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(2093, t);
    gain2.gain.setValueAtTime(0, t);
    gain2.gain.linearRampToValueAtTime(0.08, t + 0.008);
    gain2.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    osc2.start(t);
    osc2.stop(t + 0.35);
  } catch (e) { /* audio not supported */ }
};

function App() {
  const [globalTitle, setGlobalTitle] = useLocalStorage('japandi-title', 'Moments');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState(globalTitle);

  const [categories, setCategories] = useLocalStorage('japandi-categories', initialCategories);
  const [activeCategory, setActiveCategory] = useState(() => {
    const cats = JSON.parse(localStorage.getItem('japandi-categories') || 'null');
    return (cats && cats[0]?.id) || initialCategories[0].id;
  });

  // Per-category notes stored by category id
  const [categoryNotes, setCategoryNotes] = useLocalStorage('japandi-cat-notes', {});

  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingCategoryValue, setEditingCategoryValue] = useState('');
  const [colorPickerCatId, setColorPickerCatId] = useState(null); // which cat is showing the palette

  const [tasks, setTasks] = useLocalStorage('japandi-tasks', []);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Notes panel is open by default
  const [notesPanelOpen, setNotesPanelOpen] = useState(true);

  // Modal for category deletion
  const [deletingCategory, setDeletingCategory] = useState(null);

  const currentCategory = categories.find(c => c.id === activeCategory);
  const categoryTasks = tasks.filter(t => t.categoryId === activeCategory);

  // --- Global Title ---
  const saveGlobalTitle = () => {
    if (editTitleValue.trim()) setGlobalTitle(editTitleValue.trim());
    else setEditTitleValue(globalTitle);
    setIsEditingTitle(false);
  };

  // --- Category Management ---
  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      const colorIdx = categories.length % CATEGORY_COLORS.length;
      const newCat = { id: uuidv4(), name: newCategoryName.trim(), color: CATEGORY_COLORS[colorIdx] };
      setCategories([...categories, newCat]);
      setActiveCategory(newCat.id);
      setNewCategoryName('');
      setIsAddingCategory(false);
    }
  };

  const startEditCategory = (e, cat) => {
    e.stopPropagation();
    setEditingCategoryId(cat.id);
    setEditingCategoryValue(cat.name);
  };

  const saveEditCategory = () => {
    if (editingCategoryValue.trim()) {
      setCategories(categories.map(c => c.id === editingCategoryId ? { ...c, name: editingCategoryValue.trim() } : c));
    }
    setEditingCategoryId(null);
  };

  const confirmDeleteCategory = (e, id) => {
    e.stopPropagation();
    setColorPickerCatId(null);
    setDeletingCategory(categories.find(c => c.id === id));
  };

  const changeCategoryColor = (catId, colorValue) => {
    setCategories(categories.map(c => c.id === catId ? { ...c, color: colorValue } : c));
    setColorPickerCatId(null);
  };

  const deleteCategory = () => {
    if (deletingCategory) {
      const remaining = categories.filter(c => c.id !== deletingCategory.id);
      setCategories(remaining);
      setTasks(tasks.filter(t => t.categoryId !== deletingCategory.id));
      const newNotes = { ...categoryNotes };
      delete newNotes[deletingCategory.id];
      setCategoryNotes(newNotes);
      if (activeCategory === deletingCategory.id) {
        setActiveCategory(remaining[0]?.id || null);
      }
      setDeletingCategory(null);
    }
  };

  // --- Task Management ---
  const addTask = () => {
    if (newTaskTitle.trim() && activeCategory) {
      const newTask = {
        id: uuidv4(),
        categoryId: activeCategory,
        title: newTaskTitle.trim(),
        completed: false,
        pinned: false,
        subtasks: [],
      };
      setTasks([...tasks, newTask]);
      setNewTaskTitle('');
    }
  };

  const updateTaskField = useCallback((taskId, field, value) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, [field]: value } : t));
  }, [setTasks]);

  const handleToggleComplete = useCallback((id) => {
    const task = tasks.find(t => t.id === id);
    if (task && !task.completed) playCompleteSound();
    updateTaskField(id, 'completed', !task?.completed);
  }, [tasks, updateTaskField]);

  const handleSaveCategoryNotes = (catId, notes) => {
    setCategoryNotes(prev => ({ ...prev, [catId]: notes }));
  };

  // --- Category drag-and-drop ---
  const catDragIdRef     = useRef(null);
  const [catDraggingId, setCatDraggingId] = useState(null);
  const [catDragOverId, setCatDragOverId] = useState(null);

  const handleCatDragStart = (e, id) => {
    catDragIdRef.current = id;
    setCatDraggingId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleCatDragOver = (e, id) => {
    e.preventDefault();
    if (id !== catDragIdRef.current) setCatDragOverId(id);
  };

  const handleCatDrop = (e, targetId) => {
    e.preventDefault();
    const fromId = catDragIdRef.current;
    if (!fromId || fromId === targetId) return;
    const fromIdx = categories.findIndex(c => c.id === fromId);
    const toIdx   = categories.findIndex(c => c.id === targetId);
    const reordered = [...categories];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    setCategories(reordered);
    catDragIdRef.current = null;
    setCatDraggingId(null);
    setCatDragOverId(null);
  };

  const handleCatDragEnd = () => {
    catDragIdRef.current = null;
    setCatDraggingId(null);
    setCatDragOverId(null);
  };

  // --- Task reorder ---
  const handleReorderTasks = (newOrderedCategoryTasks) => {
    // Replace the tasks for the current category in the global list, preserving order of other categories
    const otherTasks = tasks.filter(t => t.categoryId !== activeCategory);
    setTasks([...otherTasks, ...newOrderedCategoryTasks]);
  };

  // --- Render ---
  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          {isEditingTitle ? (
            <input
              type="text"
              className="title-edit-input"
              value={editTitleValue}
              onChange={e => setEditTitleValue(e.target.value)}
              onBlur={saveGlobalTitle}
              onKeyDown={e => e.key === 'Enter' && saveGlobalTitle()}
              autoFocus
            />
          ) : (
            <div className="sidebar-title-row">
              <h2 className="sidebar-title">{globalTitle}</h2>
              <button className="title-edit-btn" onClick={() => { setIsEditingTitle(true); setEditTitleValue(globalTitle); }} title="Rename">
                <Edit3 size={13} />
              </button>
            </div>
          )}
        </div>

        <nav className="category-list">
          {categories.map(category => (
            <div
              key={category.id}
              className={`category-item ${
                activeCategory === category.id ? 'active' : ''} ${
                catDraggingId === category.id ? 'cat-dragging' : ''} ${
                catDragOverId === category.id && catDraggingId !== category.id ? 'cat-drag-over' : ''}`}
              draggable
              onDragStart={(e) => handleCatDragStart(e, category.id)}
              onDragOver={(e)  => handleCatDragOver(e,  category.id)}
              onDrop={(e)      => handleCatDrop(e,      category.id)}
              onDragEnd={handleCatDragEnd}
              onClick={() => { setActiveCategory(category.id); setColorPickerCatId(null); }}
            >
              <div className="cat-main">
                <div className="category-color-dot" style={{ backgroundColor: category.color }} />
                {editingCategoryId === category.id ? (
                  <input
                    className="cat-rename-input"
                    value={editingCategoryValue}
                    onChange={e => setEditingCategoryValue(e.target.value)}
                    onBlur={saveEditCategory}
                    onKeyDown={e => { if (e.key === 'Enter') saveEditCategory(); if (e.key === 'Escape') setEditingCategoryId(null); }}
                    onClick={e => e.stopPropagation()}
                    autoFocus
                  />
                ) : (
                  <span className="cat-name">{category.name}</span>
                )}
              </div>
              <div className="cat-actions">
                <button className="cat-action-btn" onClick={(e) => startEditCategory(e, category)} title="Rename">
                  <Edit3 size={13} />
                </button>
                <button className="cat-action-btn" onClick={(e) => { e.stopPropagation(); setColorPickerCatId(colorPickerCatId === category.id ? null : category.id); }} title="Change color">
                  <Palette size={13} />
                </button>
                <button className="cat-action-btn delete-cat-btn" onClick={(e) => confirmDeleteCategory(e, category.id)} title="Delete">
                  <Trash2 size={13} />
                </button>
              </div>

              {/* Inline color picker popover */}
              {colorPickerCatId === category.id && (
                <div className="color-popover animate-in" onClick={e => e.stopPropagation()}>
                  {COLOR_SWATCHES.map(swatch => (
                    <button
                      key={swatch.label}
                      className={`color-swatch ${category.color === swatch.value ? 'selected' : ''}`}
                      style={{ backgroundColor: swatch.hex }}
                      onClick={() => changeCategoryColor(category.id, swatch.value)}
                      title={swatch.label}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}

          {isAddingCategory ? (
            <div className="add-cat-input-area animate-in">
              <input
                type="text"
                placeholder="List name… press Enter"
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddCategory(); if (e.key === 'Escape') setIsAddingCategory(false); }}
                autoFocus
                className="add-cat-input"
              />
            </div>
          ) : (
            <button className="add-cat-btn" onClick={() => setIsAddingCategory(true)}>
              <Plus size={16} /> Add List
            </button>
          )}
        </nav>
      </aside>

      {/* Main Content Split View */}
      <div className="main-wrapper">
        <main className={`main-content ${notesPanelOpen ? 'split-active' : ''}`}>
          <header className="header animate-in">
            <div className="header-left">
              <div className="header-color-bar" style={{ backgroundColor: currentCategory?.color }} />
              <h1>{currentCategory?.name || 'Select a list'}</h1>
            </div>
          </header>

          <div className="add-task-container animate-in" style={{ animationDelay: '0.1s' }}>
            <Plus size={20} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="add-task-input"
              placeholder="Add task..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTask()}
              disabled={!activeCategory}
            />
          </div>

          <div className="task-board animate-in" style={{ animationDelay: '0.2s' }}>
            {activeCategory ? (
              <TaskList
                tasks={categoryTasks}
                categoryColor={currentCategory?.color || 'var(--text-main)'}
                onToggleComplete={handleToggleComplete}
                onTogglePin={(id) => updateTaskField(id, 'pinned', !tasks.find(t => t.id === id).pinned)}
                onDelete={(id) => setTasks(tasks.filter(t => t.id !== id))}
                onUpdateSubtasks={(id, st) => updateTaskField(id, 'subtasks', st)}
                onReorder={handleReorderTasks}
              />
            ) : (
              <div className="empty-state">Select or create a list to begin.</div>
            )}
          </div>
        </main>

        {/* Category-level Markdown Notes Panel */}
        {notesPanelOpen && currentCategory && (
          <aside className="notes-sidebar animate-in">
            <TaskNotes
              key={currentCategory.id}
              task={{ id: currentCategory.id, title: `${currentCategory.name} — Notes`, notes: categoryNotes[currentCategory.id] || '' }}
              onClose={() => setNotesPanelOpen(false)}
              onSaveNotes={(id, notes) => handleSaveCategoryNotes(id, notes)}
              categoryColor={currentCategory.color}
            />
          </aside>
        )}
      </div>

      {/* Deletion Modal */}
      {deletingCategory && (
        <div className="modal-overlay animate-in">
          <div className="modal-content">
            <h3>Delete "{deletingCategory.name}"?</h3>
            <p>This will permanently delete the list and all its tasks. This cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setDeletingCategory(null)}>Cancel</button>
              <button className="btn-delete" onClick={deleteCategory}>Delete List</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App
