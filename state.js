// CLARA STATE MANAGEMENT - PROFESSIONAL

class ClaraState {
  constructor() {
    this.data = {
      user: {
        bookmarks: JSON.parse(localStorage.getItem('clara_bookmarks') || '[]'),
        history: JSON.parse(localStorage.getItem('clara_history') || '[]'),
        progress: JSON.parse(localStorage.getItem('clara_progress') || '{}'),
        theme: localStorage.getItem('clara_theme') || 'dark'
      },
      
      manga: {
        latest: [],
        trending: [],
        popular: [],
        detail: null,
        chapters: []
      },
      
      ui: {
        loading: false,
        page: 'home',
        search: '',
        toast: [],
        modal: null
      }
    };
    
    this.listeners = [];
    this.init();
  }
  
  init() {
    document.body.className = this.data.user.theme;
  }
  
  get(path) {
    return path.split('.').reduce((obj, key) => obj?.[key], this.data);
  }
  
  set(path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((obj, key) => obj[key], this.data);
    
    if (target && lastKey) {
      target[lastKey] = value;
      this.notify();
      
      // Persist ke localStorage
      if (path.startsWith('user.')) {
        this.persist(path, value);
      }
    }
  }
  
  persist(path, value) {
    const key = 'clara_' + path.split('.').slice(1).join('_');
    localStorage.setItem(key, JSON.stringify(value));
  }
  
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }
  
  notify() {
    this.listeners.forEach(cb => cb(this.data));
  }
  
  // Bookmarks
  addBookmark(manga) {
    const bookmarks = [...this.data.user.bookmarks, { ...manga, addedAt: Date.now() }];
    this.set('user.bookmarks', bookmarks);
    this.showToast('❤️ Added to bookmarks', 'success');
  }
  
  removeBookmark(mangaId) {
    const bookmarks = this.data.user.bookmarks.filter(b => b.id !== mangaId);
    this.set('user.bookmarks', bookmarks);
    this.showToast('Removed from bookmarks', 'info');
  }
  
  isBookmarked(mangaId) {
    return this.data.user.bookmarks.some(b => b.id === mangaId);
  }
  
  // History
  addToHistory(manga, chapter) {
    const history = [
      { manga, chapter, readAt: Date.now() },
      ...this.data.user.history.filter(h => h.manga.id !== manga.id)
    ].slice(0, 50);
    
    this.set('user.history', history);
  }
  
  saveProgress(mangaId, chapterId, page) {
    const progress = {
      ...this.data.user.progress,
      [mangaId]: { chapterId, page, timestamp: Date.now() }
    };
    this.set('user.progress', progress);
  }
  
  // Toast
  showToast(message, type = 'info') {
    const toast = {
      id: Date.now(),
      message,
      type,
      timestamp: Date.now()
    };
    
    const toasts = [toast, ...this.data.ui.toast].slice(0, 3);
    this.set('ui.toast', toasts);
    
    setTimeout(() => {
      this.set('ui.toast', this.data.ui.toast.filter(t => t.id !== toast.id));
    }, 3000);
  }
  
  // Theme
  toggleTheme() {
    const themes = ['dark', 'light'];
    const current = this.data.user.theme;
    const next = themes.find(t => t !== current) || 'dark';
    
    this.set('user.theme', next);
    document.body.className = next;
    this.showToast(`✨ Theme: ${next}`, 'info');
  }
  
  // Clear data
  clearAll() {
    localStorage.clear();
    this.data.user = {
      bookmarks: [],
      history: [],
      progress: {},
      theme: 'dark'
    };
    this.notify();
    this.showToast('🗑️ All data cleared', 'warning');
  }
}

window.State = new ClaraState();