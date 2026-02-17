// state.js - CLARA State Management

class ClaraState {
  constructor() {
    this.state = {
      user: {
        theme: localStorage.getItem('theme') || CONFIG.ui.theme,
        bookmarks: JSON.parse(localStorage.getItem('clara_bookmarks') || '[]'),
        history: JSON.parse(localStorage.getItem('clara_history') || '[]'),
        readingProgress: JSON.parse(localStorage.getItem('clara_progress') || '{}'),
        readingStreak: parseInt(localStorage.getItem('clara_streak') || '0'),
        lastRead: localStorage.getItem('clara_lastRead') || null
      },
      
      ui: {
        currentPage: 'home',
        loading: false,
        searchQuery: '',
        selectedGenre: [],
        sortBy: 'popular',
        toast: []
      },
      
      data: {
        mangaList: [],
        currentManga: null,
        currentChapter: null,
        chapters: [],
        chapterImages: [],
        trending: [],
        popular: []
      }
    };
    
    this.listeners = [];
  }
  
  get(key) {
    return key.split('.').reduce((obj, k) => obj?.[k], this.state);
  }
  
  set(key, value) {
    const keys = key.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((obj, k) => obj[k], this.state);
    
    if (target && lastKey) {
      target[lastKey] = value;
      this.notify();
      
      if (key.startsWith('user.')) {
        this.persistToLocalStorage(key, value);
      }
    }
  }
  
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
  
  notify() {
    this.listeners.forEach(listener => listener(this.state));
  }
  
  persistToLocalStorage(key, value) {
    const storageKey = 'clara_' + key.replace('user.', '');
    localStorage.setItem(storageKey, JSON.stringify(value));
  }
  
  addBookmark(manga) {
    const bookmarks = [...this.state.user.bookmarks, { ...manga, bookmarkedAt: Date.now() }];
    this.set('user.bookmarks', bookmarks);
    this.showToast('❤️ Added to bookmarks!', 'success');
  }
  
  removeBookmark(mangaId) {
    const bookmarks = this.state.user.bookmarks.filter(b => b.id !== mangaId);
    this.set('user.bookmarks', bookmarks);
    this.showToast('Removed from bookmarks', 'info');
  }
  
  addToHistory(manga, chapter) {
    const history = [
      { manga, chapter, readAt: Date.now() },
      ...this.state.user.history.filter(h => h.manga.id !== manga.id)
    ].slice(0, 50);
    
    this.set('user.history', history);
    this.set('user.lastRead', Date.now());
    this.updateReadingStreak();
  }
  
  saveProgress(mangaId, chapterId, page) {
    const progress = {
      ...this.state.user.readingProgress,
      [mangaId]: { chapterId, page, timestamp: Date.now() }
    };
    this.set('user.readingProgress', progress);
  }
  
  updateReadingStreak() {
    const lastRead = this.state.user.lastRead;
    const now = Date.now();
    const oneDay = 86400000;
    
    if (!lastRead) {
      this.set('user.readingStreak', 1);
    } else if (now - lastRead < oneDay * 2) {
      this.set('user.readingStreak', this.state.user.readingStreak + 1);
    } else {
      this.set('user.readingStreak', 1);
    }
  }
  
  showToast(message, type = 'info') {
    const toast = {
      id: Date.now(),
      message,
      type,
      timestamp: Date.now()
    };
    
    const toasts = [toast, ...this.state.ui.toast].slice(0, 5);
    this.set('ui.toast', toasts);
    
    setTimeout(() => {
      this.set('ui.toast', this.state.ui.toast.filter(t => t.id !== toast.id));
    }, 3000);
  }
  
  clearAllData() {
    localStorage.clear();
    this.state.user = {
      theme: 'dark',
      bookmarks: [],
      history: [],
      readingProgress: {},
      readingStreak: 0,
      lastRead: null
    };
    this.set('user', this.state.user);
    this.showToast('✨ All data cleared!', 'warning');
  }
  
  isBookmarked(mangaId) {
    return this.state.user.bookmarks.some(b => b.id === mangaId);
  }
}

const State = new ClaraState();
window.State = State;