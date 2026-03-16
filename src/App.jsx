import { useState } from 'react'
import { Plus, Edit3, Trash2, X } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { useLocalStorage } from './hooks/useLocalStorage'
import TaskList from './components/TaskList'
import TaskNotes from './components/TaskNotes'
import './App.css'

// Initial categories with richer Japandi colors
const initialCategories = [
  { id: '1', name: 'Personal', color: 'var(--color-sage)' },
  { id: '2', name: 'Work', color: 'var(--color-slate)' },
  { id: '3', name: 'Groceries', color: 'var(--color-sand)' },
  { id: '4', name: 'Projects', color: 'var(--color-clay)' },
  { id: '5', name: 'Ideas', color: 'var(--color-rose)' }
];

function App() {
  const [globalTitle, setGlobalTitle] = useLocalStorage('japandi-title', 'Moments');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState(globalTitle);

  const [categories, setCategories] = useLocalStorage('japandi-categories', initialCategories);
  const [activeCategory, setActiveCategory] = useState(initialCategories[0].id);
  
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  const [tasks, setTasks] = useLocalStorage('japandi-tasks', []);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  
  // Selected task for markdown notes pane
  const [selectedTask, setSelectedTask] = useState(null);
  
  // Modal state for deletion
  const [deletingCategory, setDeletingCategory] = useState(null);

  const currentCategory = categories.find(c => c.id === activeCategory);
  const categoryTasks = tasks.filter(t => t.categoryId === activeCategory);

  // --- Global Title Editing ---
  const saveGlobalTitle = () => {
    if (editTitleValue.trim()) {
      setGlobalTitle(editTitleValue.trim());
    } else {
      setEditTitleValue(globalTitle);
    }
    setIsEditingTitle(false);
  };

  // --- Category Management ---
  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      const newCat = {
        id: uuidv4(),
        name: newCategoryName.trim(),
        // Pick a random color from the palette to keep it simple
        color: initialCategories[Math.floor(Math.random() * initialCategories.length)].color
      };
      setCategories([...categories, newCat]);
      setActiveCategory(newCat.id);
      setNewCategoryName('');
      setIsAddingCategory(false);
    }
  };

  const confirmDeleteCategory = (id) => {
    setDeletingCategory(categories.find(c => c.id === id));
  };

  const deleteCategory = () => {
    if (deletingCategory) {
      setCategories(categories.filter(c => c.id !== deletingCategory.id));
      setTasks(tasks.filter(t => t.categoryId !== deletingCategory.id)); // Clean up tasks
      if (activeCategory === deletingCategory.id) {
        setActiveCategory(categories[0]?.id || null);
      }
      if (selectedTask?.categoryId === deletingCategory.id) {
        setSelectedTask(null);
      }
      setDeletingCategory(null);
    }
  };

  const renameCategory = (id, newName) => {
    if (newName.trim()) {
      setCategories(categories.map(c => c.id === id ? { ...c, name: newName.trim() } : c));
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
        notes: ''
      };
      setTasks([...tasks, newTask]);
      setNewTaskTitle('');
    }
  };

  const updateTaskField = (taskId, field, value) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, [field]: value } : t));
    // Also update selectedTask if it's the one being modified
    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask(prev => ({ ...prev, [field]: value }));
    }
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
             <h2 
               className="sidebar-title" 
               onClick={() => setIsEditingTitle(true)}
               title="Click to rename"
             >
               {globalTitle} <Edit3 size={14} className="title-edit-icon text-muted" />
             </h2>
          )}
        </div>
        
        <nav className="category-list">
          {categories.map(category => (
            <div 
              key={category.id}
              className={`category-item ${activeCategory === category.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(category.id)}
            >
              <div className="cat-main">
                <div 
                  className="category-color-dot" 
                  style={{ backgroundColor: category.color }} 
                />
                <span 
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => renameCategory(category.id, e.target.innerText)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); } }}
                  onClick={e => e.stopPropagation()} // Prevent setting active on edit click
                  className="editable-cat-name"
                >
                  {category.name}
                </span>
              </div>
              
              <button 
                className="delete-cat-btn"
                onClick={(e) => { e.stopPropagation(); confirmDeleteCategory(category.id); }}
                title="Delete List"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          
          {/* Add Category Section */}
          {isAddingCategory ? (
            <div className="add-cat-input-area animate-in">
              <input 
                type="text" 
                placeholder="List name..."
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAddCategory();
                  if (e.key === 'Escape') setIsAddingCategory(false);
                }}
                autoFocus
                className="add-cat-input"
              />
              <button className="add-cat-save" onClick={handleAddCategory}>Add</button>
            </div>
          ) : (
            <button className="add-cat-btn" onClick={() => setIsAddingCategory(true)}>
              <Plus size={16} /> Add List
            </button>
          )}
        </nav>
      </aside>

      {/* Main Content Split View Wrapper */}
      <div className="main-wrapper">
        <main className={`main-content ${selectedTask ? 'split-active' : ''}`}>
          <header className="header animate-in">
            <h1>{currentCategory?.name || 'Create a list'}</h1>
          </header>

          {/* Input Area */}
          <div className="add-task-container animate-in" style={{ animationDelay: '0.1s' }}>
            <Plus size={20} className="text-muted" style={{ color: 'var(--text-muted)' }} />
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

          {/* Task List */}
          <div className="task-board animate-in" style={{ animationDelay: '0.2s' }}>
            {activeCategory ? (
              <TaskList 
                tasks={categoryTasks}
                categoryColor={currentCategory?.color || 'var(--text-main)'}
                onToggleComplete={(id) => updateTaskField(id, 'completed', !tasks.find(t=>t.id===id).completed)}
                onTogglePin={(id) => updateTaskField(id, 'pinned', !tasks.find(t=>t.id===id).pinned)}
                onDelete={(id) => {
                  setTasks(tasks.filter(t => t.id !== id));
                  if (selectedTask?.id === id) setSelectedTask(null);
                }}
                onUpdateSubtasks={(id, st) => updateTaskField(id, 'subtasks', st)}
                onSelectTask={(task) => setSelectedTask(task)} // Pass select handler
                selectedTaskId={selectedTask?.id}
              />
            ) : (
              <div className="empty-state">Select or create a list to begin.</div>
            )}
          </div>
        </main>

        {/* Markdown Notes Panel */}
        {selectedTask && (
          <aside className="notes-sidebar animate-in">
            <TaskNotes 
              task={selectedTask}
              onClose={() => setSelectedTask(null)}
              onSaveNotes={(id, notes) => updateTaskField(id, 'notes', notes)}
              categoryColor={categories.find(c => c.id === selectedTask.categoryId)?.color}
            />
          </aside>
        )}
      </div>

      {/* Deletion Modal */}
      {deletingCategory && (
        <div className="modal-overlay animate-in">
          <div className="modal-content">
            <h3>Delete "{deletingCategory.name}"?</h3>
            <p>This will permanently delete the list and all its tasks. This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setDeletingCategory(null)}>Cancel</button>
              <button className="btn-delete" onClick={deleteCategory}>Delete List</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
