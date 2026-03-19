import { useState, useEffect, useCallback } from 'react';
import { api, Category, Task } from '../api/client';
import { useAuth } from './useAuth';
import { initialCategories } from '../App'; // We'll export this from App.jsx

export function useCloudStore() {
  const { user } = useAuth();
  
  const [categories, setCategoriesState] = useState<Category[]>([]);
  const [tasks, setTasksState] = useState<Task[]>([]);
  const [categoryNotes, setCategoryNotesState] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // Load from API on mount
  useEffect(() => {
    if (!user) return;
    
    let isMounted = true;
    (async () => {
      try {
        const [apiCats, apiTasks] = await Promise.all([
          api.categories.list(),
          api.tasks.list()
        ]);
        
        if (!isMounted) return;

        // --- MIGRATION LOGIC ---
        // If API is completely empty AND we haven't migrated yet, migrate local data
        const hasMigrated = localStorage.getItem(`migrated_${user.userId}`) === 'true';
        if (apiCats.length === 0 && !hasMigrated) {
          console.log('Migrating local data to cloud...');
          
          const localCats = JSON.parse(localStorage.getItem('japandi-categories') || 'null') || initialCategories;
          const localTasks = JSON.parse(localStorage.getItem('japandi-tasks') || 'null') || [];
          const localNotes = JSON.parse(localStorage.getItem('japandi-cat-notes') || 'null') || {};
          
          setCategoriesState(localCats);
          setTasksState(localTasks);
          setCategoryNotesState(localNotes);
          
          // Bulk upload in background
          Promise.all([
            ...localCats.map((c: any, i: number) => api.categories.create({ ...c, order: i })),
            ...localTasks.map((t: any, i: number) => api.tasks.create({ ...t, order: i })),
            ...Object.entries(localNotes).map(([catId, content]) => 
               api.notes.save(catId, content as string)
            )
          ]).then(() => {
            localStorage.setItem(`migrated_${user.userId}`, 'true');
            console.log('Migration complete');
          }).catch(e => console.error('Migration failed', e));

        } else {
          setCategoriesState(apiCats);
          setTasksState(apiTasks);
          
          // Fetch notes for all categories in parallel
          const notesData = await Promise.all(
            apiCats.map(c => api.notes.get(c.id).catch(() => ({ categoryId: c.id, content: '' })))
          );
          const notesMap: Record<string, string> = {};
          for (const res of notesData) if (res && res.content) notesMap[res.categoryId] = res.content;
          setCategoryNotesState(notesMap);
        }
      } catch (err) {
        console.error('Failed to load data from API', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, [user]);

  // Wrappers to update local state optimistically AND sync to cloud
  const setCategories = useCallback((valOrUpdater: any) => {
    setCategoriesState(prev => {
      const next = typeof valOrUpdater === 'function' ? valOrUpdater(prev) : valOrUpdater;
      
      // Only PUT categories that changed or changed order
      next.forEach((cat: any, idx: number) => {
        const prevCat = prev.find(c => c.id === cat.id);
        const prevIdx = prev.findIndex(c => c.id === cat.id);
        if (!prevCat || prevIdx !== idx || JSON.stringify(prevCat) !== JSON.stringify(cat)) {
          api.categories.update(cat.id, { ...cat, order: idx });
        }
      });
      // Handle deletions
      prev.forEach(cat => {
        if (!next.find((c: any) => c.id === cat.id)) api.categories.delete(cat.id);
      });
      
      return next;
    });
  }, []);

  const addCategory = useCallback((cat: Category) => {
    setCategoriesState(prev => [...prev, cat]);
    api.categories.create(cat).catch(e => console.error(e));
  }, []);

  const deleteCategory = useCallback((id: string) => {
    setCategoriesState(prev => prev.filter(c => c.id !== id));
    api.categories.delete(id).catch(e => console.error(e));
  }, []);

  const setTasks = useCallback((valOrUpdater: any) => {
    setTasksState(prev => {
      const next = typeof valOrUpdater === 'function' ? valOrUpdater(prev) : valOrUpdater;
      
      // Only PUT tasks that changed or changed order
      next.forEach((task: any, idx: number) => {
        const prevTask = prev.find(t => t.id === task.id);
        const prevIdx = prev.findIndex(t => t.id === task.id);
        if (!prevTask || prevIdx !== idx || JSON.stringify(prevTask) !== JSON.stringify(task)) {
          api.tasks.update(task.id, { ...task, order: idx });
        }
      });
      // Handle deletions
      prev.forEach(task => {
        if (!next.find((t: any) => t.id === task.id)) api.tasks.delete(task.id);
      });
      
      return next;
    });
  }, []);

  const addTask = useCallback((task: Task) => {
    setTasksState(prev => [...prev, task]);
    api.tasks.create(task).catch(e => console.error(e));
  }, []);

  const updateTaskField = useCallback((id: string, field: keyof Task, value: any) => {
    setTasksState(prev => {
      const next = [...prev];
      const idx = next.findIndex(t => t.id === id);
      if (idx > -1) {
        next[idx] = { ...next[idx], [field]: value };
        api.tasks.update(id, next[idx]).catch(e => console.error(e));
      }
      return next;
    });
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasksState(prev => prev.filter(t => t.id !== id));
    api.tasks.delete(id).catch(e => console.error(e));
  }, []);

  const setCategoryNotes = useCallback((catId: string, content: string) => {
    setCategoryNotesState(prev => ({ ...prev, [catId]: content }));
    api.notes.save(catId, content).catch(e => console.error(e));
  }, []);

  return {
    categories,
    setCategories,
    addCategory,
    deleteCategory,
    tasks,
    setTasks,
    addTask,
    updateTaskField,
    deleteTask,
    categoryNotes,
    setCategoryNotes,
    loading
  };
}
