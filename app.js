// app.js - Clara Main Application

class ClaraApp {
    constructor() {
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupTheme();
        this.setupScrollProgress();
        this.setupBackToTop();
        this.setupToast();
        this.setupKeyboardNav();
        this.setupSwipeNav();
        
        // Start router
        Router.navigate(window.location.pathname || '/');
    }
    
    setupEventListeners() {
        // Search input with debounce
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce((e) => {
                if (e.target.value.length >= 3) {
                    Router.navigate(`/search?q=${encodeURIComponent(e.target.value)}`);
                }
            }, 500));
        }
        
        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }
        
        // Random button
        const randomBtn = document.getElementById('random-manga');
        if (randomBtn) {
            randomBtn.addEventListener('click', () => Router.navigate('/random'));
        }
        
        // Back to top
        const backToTop = document.getElementById('back-to-top');
        if (backToTop) {
            backToTop.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }
        
        // Scroll event
        window.addEventListener('scroll', this.debounce(() => {
            this.handleScroll();
        }, 100));
    }
    
    setupTheme() {
        const theme = State.get('user.theme');
        document.body.className = theme === 'amoled' ? 'dark-amoled' : theme;
    }
    
    toggleTheme() {
        const themes = ['dark', 'light', 'amoled'];
        const current = State.get('user.theme');
        const next = themes[(themes.indexOf(current) + 1) % themes.length];
        
        State.set('user.theme', next);
        document.body.className = next === 'amoled' ? 'dark-amoled' : next;
        State.showToast(`Theme: ${next}`, 'info');
    }
    
    setupKeyboardNav() {
        document.addEventListener('keydown', (e) => {
            if (!CONFIG.features.keyboardNav) return;
            
            switch (e.key) {
                case 'ArrowLeft':
                    window.history.back();
                    break;
                case 'ArrowRight':
                    if (State.get('ui.currentPage') === 'reader') {
                        // Next chapter logic
                    }
                    break;
                case 'Escape':
                    this.closeModal();
                    break;
                case 'f':
                case 'F':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        this.toggleFullscreen();
                    }
                    break;
            }
        });
    }
    
    setupSwipeNav() {
        if (!CONFIG.features.swipeNav) return;
        
        let touchstartX = 0;
        
        document.addEventListener('touchstart', (e) => {
            touchstartX = e.changedTouches[0].screenX;
        });
        
        document.addEventListener('touchend', (e) => {
            const touchendX = e.changedTouches[0].screenX;
            const diff = touchendX - touchstartX;
            
            if (Math.abs(diff) > 50) {
                if (diff > 0) {
                    window.history.back();
                } else {
                    // Next page
                }
            }
        });
    }
    
    setupScrollProgress() {
        const progressBar = document.getElementById('progress-bar');
        window.addEventListener('scroll', () => {
            const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = (winScroll / height) * 100;
            progressBar.style.width = scrolled + '%';
        });
    }
    
    setupBackToTop() {
        const backToTop = document.getElementById('back-to-top');
        window.addEventListener('scroll', () => {
            if (window.scrollY > 500) {
                backToTop.classList.remove('hidden');
            } else {
                backToTop.classList.add('hidden');
            }
        });
    }
    
    setupToast() {
        State.subscribe((state) => {
            const container = document.getElementById('toast-container');
            container.innerHTML = state.ui.toast.map(t => `
                <div class="glass px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-slideIn">
                    ${this.getToastIcon(t.type)}
                    <span>${t.message}</span>
                </div>
            `).join('');
        });
    }
    
    getToastIcon(type) {
        const icons = {
            success: '<i class="fas fa-check-circle text-green-500"></i>',
            error: '<i class="fas fa-exclamation-circle text-red-500"></i>',
            warning: '<i class="fas fa-exclamation-triangle text-yellow-500"></i>',
            info: '<i class="fas fa-info-circle text-blue-500"></i>'
        };
        return icons[type] || icons.info;
    }
    
    handleScroll() {
        const scrollY = window.scrollY;
        const height = document.documentElement.scrollHeight - window.innerHeight;
        
        if (scrollY > height - 100 && CONFIG.ui.infiniteScroll) {
            this.loadMore();
        }
    }
    
    async loadMore() {
        const currentView = State.get('ui.currentPage');
        if (currentView !== 'home') return;
        
        const currentPage = State.get('data.currentPage') || 1;
        State.set('ui.loading', true);
        
        const result = await Scraper.scrapeList(currentPage + 1);
        const currentList = State.get('data.mangaList');
        
        State.set('data.mangaList', [...currentList, ...result.manga]);
        State.set('data.currentPage', currentPage + 1);
        State.set('ui.loading', false);
    }
    
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }
    
    closeModal() {
        const modal = document.getElementById('modal');
        if (modal) modal.classList.add('hidden');
    }
    
    debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    window.UI = new ClaraApp();
    
    // Render navbar
    const app = document.getElementById('app');
    app.innerHTML = `
        <!-- Navbar -->
        <nav class="sticky top-0 z-40 glass">
            <div class="container mx-auto px-4 py-3">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-6">
                        <h1 class="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent logo">
                            Clara ✨
                        </h1>
                        <div class="hidden md:flex gap-4">
                            <a href="/" class="hover:text-pink-500 transition">Home</a>
                            <a href="/trending" class="hover:text-pink-500 transition">Trending</a>
                            <a href="/popular" class="hover:text-pink-500 transition">Popular</a>
                        </div>
                    </div>
                    
                    <div class="flex items-center gap-3">
                        <!-- Search -->
                        <div class="relative hidden md:block">
                            <input type="text" 
                                   id="search-input"
                                   placeholder="Search manga..." 
                                   class="glass pl-9 pr-4 py-2 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 w-64">
                            <i class="fas fa-search absolute left-3 top-3 text-gray-400 text-sm"></i>
                        </div>
                        
                        <!-- Theme Toggle -->
                        <button id="theme-toggle" class="p-2 hover:bg-gray-800 rounded-full">
                            <i class="fas fa-moon"></i>
                        </button>
                        
                        <!-- Random -->
                        <button id="random-manga" class="p-2 hover:bg-gray-800 rounded-full">
                            <i class="fas fa-shuffle"></i>
                        </button>
                        
                        <!-- Bookmarks -->
                        <a href="/bookmarks" class="p-2 hover:bg-gray-800 rounded-full relative">
                            <i class="fas fa-heart"></i>
                            <span id="bookmark-count" class="absolute -top-1 -right-1 bg-pink-500 text-xs rounded-full w-4 h-4 flex items-center justify-center hidden">0</span>
                        </a>
                        
                        <!-- History -->
                        <a href="/history" class="p-2 hover:bg-gray-800 rounded-full">
                            <i class="fas fa-clock"></i>
                        </a>
                        
                        <!-- Settings -->
                        <a href="/settings" class="p-2 hover:bg-gray-800 rounded-full">
                            <i class="fas fa-cog"></i>
                        </a>
                    </div>
                </div>
            </div>
        </nav>
        
        <!-- Main Content -->
        <main class="container mx-auto px-4 py-6"></main>
        
        <!-- Bottom Navigation for Mobile -->
        <div class="bottom-nav md:hidden">
            <a href="/" class="flex flex-col items-center text-xs">
                <i class="fas fa-home"></i>
                <span>Home</span>
            </a>
            <a href="/trending" class="flex flex-col items-center text-xs">
                <i class="fas fa-fire"></i>
                <span>Trending</span>
            </a>
            <a href="/search" class="flex flex-col items-center text-xs">
                <i class="fas fa-search"></i>
                <span>Search</span>
            </a>
            <a href="/bookmarks" class="flex flex-col items-center text-xs">
                <i class="fas fa-heart"></i>
                <span>Saved</span>
            </a>
            <a href="/settings" class="flex flex-col items-center text-xs">
                <i class="fas fa-user"></i>
                <span>Profile</span>
            </a>
        </div>
    `;
    
    // Update bookmark count
    State.subscribe((state) => {
        const count = state.user.bookmarks.length;
        const badge = document.getElementById('bookmark-count');
        if (badge) {
            if (count > 0) {
                badge.classList.remove('hidden');
                badge.textContent = count > 9 ? '9+' : count;
            } else {
                badge.classList.add('hidden');
            }
        }
    });
});