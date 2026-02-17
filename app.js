// CLARA APP V4 - ZERO LOADING ANIMATION
// Data langsung muncul, gak pake skeleton

class ClaraApp {
    constructor() {
        this.init();
    }
    
    async init() {
        this.renderLayout();
        await this.loadHomeData(); // Langsung load data, gak pake loading
        this.setupEventListeners();
    }
    
    renderLayout() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <!-- Navbar -->
            <nav class="sticky top-0 z-50 glass-premium mx-4 my-2 px-6 py-3">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-8">
                        <h1 class="text-2xl font-bold">
                            <span class="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">Clara</span>
                            <span class="text-white">.manga</span>
                        </h1>
                    </div>
                    
                    <div class="flex items-center gap-3">
                        <div class="relative">
                            <i class="fas fa-search absolute left-3 top-3 text-gray-400"></i>
                            <input type="text" 
                                   id="search-input"
                                   placeholder="Search manga..." 
                                   class="bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-2 w-64 focus:outline-none focus:border-pink-500">
                        </div>
                    </div>
                </div>
            </nav>
            
            <!-- Main Content - Langsung diisi nanti -->
            <main id="main-content" class="container mx-auto px-4 py-6"></main>
        `;
    }
    
    async loadHomeData() {
        const main = document.getElementById('main-content');
        
        // Langsung fetch data tanpa loading
        const [latest, trending] = await Promise.all([
            API.getLatestManga(),
            API.getLatestManga() // Buat trending, nanti diacak
        ]);
        
        // Randomize untuk trending
        const trendingManga = [...latest].sort(() => Math.random() - 0.5).slice(0, 10);
        
        main.innerHTML = `
            <!-- Hero Section -->
            <div class="bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-3xl p-8 mb-8">
                <h1 class="text-3xl font-bold mb-2">Welcome to Clara 🌸</h1>
                <p class="text-gray-300">Baca manga gratis, update setiap hari</p>
            </div>
            
            <!-- Trending Now -->
            <section class="mb-8">
                <h2 class="text-xl font-bold mb-4 flex items-center gap-2">
                    <i class="fas fa-fire text-pink-500"></i> Trending Now
                </h2>
                <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
                    ${trendingManga.map(m => this.renderMangaCard(m)).join('')}
                </div>
            </section>
            
            <!-- Latest Updates -->
            <section>
                <h2 class="text-xl font-bold mb-4 flex items-center gap-2">
                    <i class="fas fa-clock text-pink-500"></i> Latest Updates
                </h2>
                <div class="grid grid-cols-2 md:grid-cols-6 gap-3">
                    ${latest.map(m => this.renderMangaCard(m)).join('')}
                </div>
            </section>
        `;
    }
    
    renderMangaCard(manga) {
        return `
            <div class="cursor-pointer hover:scale-105 transition-transform" 
                 onclick="app.showMangaDetail('${manga.id}')">
                <img src="${manga.cover}" 
                     class="w-full aspect-[3/4] object-cover rounded-xl"
                     onerror="this.src='https://via.placeholder.com/300x400/1a1a1a/ec4899?text=Error'">
                <h3 class="font-semibold mt-2 text-sm line-clamp-2">${manga.title}</h3>
                <div class="flex items-center justify-between mt-1 text-xs text-gray-400">
                    <span>${manga.year}</span>
                    <span>⭐ ${manga.rating}</span>
                </div>
            </div>
        `;
    }
    
    async showMangaDetail(id) {
        const main = document.getElementById('main-content');
        
        // Langsung fetch detail
        const { manga, chapters } = await API.getMangaDetail(id);
        
        main.innerHTML = `
            <div class="max-w-4xl mx-auto">
                <button onclick="app.loadHomeData()" class="mb-4 text-pink-500">
                    ← Back
                </button>
                
                <div class="bg-white/5 rounded-2xl p-6">
                    <div class="flex gap-6">
                        <img src="${manga.cover}" class="w-48 h-64 object-cover rounded-xl">
                        
                        <div class="flex-1">
                            <h1 class="text-2xl font-bold mb-2">${manga.title}</h1>
                            <div class="flex gap-2 mb-4">
                                ${manga.tags.slice(0, 3).map(t => `
                                    <span class="bg-pink-500/20 text-pink-500 px-3 py-1 rounded-full text-xs">${t}</span>
                                `).join('')}
                            </div>
                            <p class="text-gray-300 mb-4">${manga.description || 'No description'}</p>
                            <div class="flex gap-4 text-sm">
                                <span>📅 ${manga.year}</span>
                                <span>📖 ${manga.status}</span>
                                <span>⭐ ${manga.rating}</span>
                            </div>
                        </div>
                    </div>
                    
                    <h2 class="text-xl font-bold mt-6 mb-3">Chapters</h2>
                    <div class="space-y-2 max-h-96 overflow-y-auto">
                        ${chapters.map(ch => `
                            <div class="bg-white/5 p-3 rounded-lg hover:bg-white/10 cursor-pointer"
                                 onclick="app.showChapter('${ch.id}', '${id}')">
                                <span class="font-semibold">${ch.title}</span>
                                <span class="text-sm text-gray-400 ml-2">${ch.pages} pages</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }
    
    async showChapter(chapterId, mangaId) {
        const main = document.getElementById('main-content');
        
        // Langsung fetch images
        const images = await API.getChapterImages(chapterId);
        
        main.innerHTML = `
            <div class="max-w-3xl mx-auto">
                <button onclick="app.showMangaDetail('${mangaId}')" class="mb-4 text-pink-500">
                    ← Back to Manga
                </button>
                
                <div class="space-y-2">
                    ${images.map(img => `
                        <img src="${img.url}" 
                             class="w-full rounded-lg"
                             onerror="this.src='https://via.placeholder.com/800x1200/2a2a2a/ec4899?text=Error'">
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    setupEventListeners() {
        // Search dengan debounce
        let timeout;
        document.getElementById('search-input')?.addEventListener('input', (e) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                const query = e.target.value;
                if (query.length >= 2) {
                    this.searchManga(query);
                }
            }, 300);
        });
    }
    
    async searchManga(query) {
        const main = document.getElementById('main-content');
        
        // Langsung search
        const results = await API.searchManga(query);
        
        main.innerHTML = `
            <h2 class="text-xl font-bold mb-4">Search: "${query}"</h2>
            <div class="grid grid-cols-2 md:grid-cols-6 gap-3">
                ${results.map(m => this.renderMangaCard(m)).join('')}
            </div>
        `;
    }
}

// Start app
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ClaraApp();
});                            <a href="/popular" class="nav-link px-4 py-2 rounded-full hover:bg-white/5 transition" data-route="/popular">Popular</a>
                            <a href="/latest" class="nav-link px-4 py-2 rounded-full hover:bg-white/5 transition" data-route="/latest">Latest</a>
                        </div>
                    </div>
                    
                    <div class="flex items-center gap-3">
                        <!-- Search -->
                        <div class="relative hidden md:block">
                            <i class="fas fa-search search-icon"></i>
                            <input type="text" 
                                   id="search-input"
                                   placeholder="Search manga..." 
                                   class="search-premium w-64">
                        </div>
                        
                        <!-- Theme Toggle -->
                        <button id="theme-toggle" class="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 transition flex items-center justify-center">
                            <i class="fas fa-${State.get('user.theme') === 'dark' ? 'sun' : 'moon'}"></i>
                        </button>
                        
                        <!-- Bookmarks -->
                        <a href="/bookmarks" class="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 transition flex items-center justify-center relative">
                            <i class="fas fa-heart"></i>
                            <span id="bookmark-badge" class="absolute -top-1 -right-1 w-4 h-4 bg-pink-500 text-[10px] rounded-full flex items-center justify-center hidden">0</span>
                        </a>
                        
                        <!-- History -->
                        <a href="/history" class="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 transition flex items-center justify-center">
                            <i class="fas fa-clock"></i>
                        </a>
                        
                        <!-- Settings -->
                        <a href="/settings" class="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 transition flex items-center justify-center">
                            <i class="fas fa-cog"></i>
                        </a>
                    </div>
                </div>
            </nav>
            
            <!-- Mobile Search (visible only on mobile) -->
            <div class="md:hidden px-4 mt-2">
                <div class="relative">
                    <i class="fas fa-search search-icon"></i>
                    <input type="text" 
                           id="mobile-search"
                           placeholder="Search manga..." 
                           class="search-premium">
                </div>
            </div>
            
            <!-- Main Content -->
            <main id="main-content" class="container mx-auto px-4 py-6 page-transition"></main>
            
            <!-- Bottom Navigation -->
            <div class="bottom-nav">
                <a href="/" class="flex flex-col items-center" data-route="/">
                    <i class="fas fa-home text-xl"></i>
                    <span>Home</span>
                </a>
                <a href="/trending" class="flex flex-col items-center" data-route="/trending">
                    <i class="fas fa-fire text-xl"></i>
                    <span>Trending</span>
                </a>
                <a href="/latest" class="flex flex-col items-center" data-route="/latest">
                    <i class="fas fa-clock text-xl"></i>
                    <span>Latest</span>
                </a>
                <a href="/bookmarks" class="flex flex-col items-center" data-route="/bookmarks">
                    <i class="fas fa-heart text-xl"></i>
                    <span>Saved</span>
                </a>
                <a href="/settings" class="flex flex-col items-center" data-route="/settings">
                    <i class="fas fa-user text-xl"></i>
                    <span>Profile</span>
                </a>
            </div>
        `;
        
        // Highlight active nav
        this.highlightActiveNav();
    }
    
    highlightActiveNav() {
        const path = window.location.pathname;
        document.querySelectorAll('[data-route]').forEach(link => {
            if (link.getAttribute('data-route') === path) {
                link.classList.add('text-pink-500');
            } else {
                link.classList.remove('text-pink-500');
            }
        });
    }
    
    setupEventListeners() {
        // Search debounce
        const searchInputs = ['search-input', 'mobile-search'];
        searchInputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('input', this.debounce((e) => {
                    const query = e.target.value;
                    if (query.length >= 2) {
                        Router.go(`/search?q=${encodeURIComponent(query)}`);
                    }
                }, 500));
            }
        });
        
        // Theme toggle
        document.getElementById('theme-toggle')?.addEventListener('click', () => {
            State.toggleTheme();
        });
        
        // Back to top
        document.getElementById('back-to-top')?.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        
        // Scroll event
        window.addEventListener('scroll', this.debounce(() => {
            this.handleScroll();
        }, 100));
    }
    
    setupRouter() {
        window.addEventListener('popstate', () => {
            this.loadPage(window.location.pathname);
        });
        
        // Intercept clicks
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href]');
            if (link && link.href.startsWith(window.location.origin)) {
                e.preventDefault();
                const path = link.pathname;
                window.history.pushState({}, '', path);
                this.loadPage(path);
                this.highlightActiveNav();
            }
        });
    }
    
    setupStateSubscription() {
        State.subscribe((data) => {
            // Update bookmark badge
            const badge = document.getElementById('bookmark-badge');
            if (badge) {
                const count = data.user.bookmarks.length;
                if (count > 0) {
                    badge.classList.remove('hidden');
                    badge.textContent = count > 9 ? '9+' : count;
                } else {
                    badge.classList.add('hidden');
                }
            }
            
            // Update theme icon
            const themeIcon = document.querySelector('#theme-toggle i');
            if (themeIcon) {
                themeIcon.className = `fas fa-${data.user.theme === 'dark' ? 'sun' : 'moon'}`;
            }
            
            // Update toasts
            const container = document.getElementById('toast-container');
            if (container) {
                container.innerHTML = data.ui.toast.map(t => 
                    Components.toast(t.message, t.type)
                ).join('');
            }
        });
    }
    
    async loadPage(path) {
        const main = document.getElementById('main-content');
        if (!main) return;
        
        // Show loading
        main.innerHTML = Components.spinner();
        State.set('ui.loading', true);
        
        // Parse path
        if (path === '/') await this.renderHome(main);
        else if (path === '/trending') await this.renderTrending(main);
        else if (path === '/popular') await this.renderPopular(main);
        else if (path === '/latest') await this.renderLatest(main);
        else if (path.startsWith('/manga/')) await this.renderMangaDetail(main, path.split('/')[2]);
        else if (path.startsWith('/chapter/')) await this.renderChapter(main, path.split('/')[2]);
        else if (path === '/search') await this.renderSearch(main);
        else if (path === '/bookmarks') this.renderBookmarks(main);
        else if (path === '/history') this.renderHistory(main);
        else if (path === '/settings') this.renderSettings(main);
        else await this.renderNotFound(main);
        
        State.set('ui.loading', false);
        State.set('ui.page', path);
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    async renderHome(container) {
        // Load data
        const [latest, trending] = await Promise.all([
            API.getLatestManga(1),
            API.getTrending()
        ]);
        
        container.innerHTML = `
            ${Components.hero()}
            
            <!-- Trending Now -->
            <section class="mb-10">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-xl font-bold flex items-center gap-2">
                        <i class="fas fa-fire text-pink-500"></i>
                        Trending Now
                    </h2>
                    <a href="/trending" class="text-sm text-pink-500 hover:underline">View All →</a>
                </div>
                
                <div class="manga-grid">
                    ${trending.map(m => Components.mangaCard(m)).join('')}
                </div>
            </section>
            
            <!-- Latest Updates -->
            <section>
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-xl font-bold flex items-center gap-2">
                        <i class="fas fa-clock text-pink-500"></i>
                        Latest Updates
                    </h2>
                    <a href="/latest" class="text-sm text-pink-500 hover:underline">View All →</a>
                </div>
                
                <div class="manga-grid" id="latest-grid">
                    ${latest.manga.map(m => Components.mangaCard(m)).join('')}
                </div>
                
                <!-- Load More -->
                <div class="text-center mt-8">
                    <button id="load-more" class="bg-white/5 hover:bg-white/10 px-6 py-3 rounded-full transition">
                        Load More <i class="fas fa-chevron-down ml-2"></i>
                    </button>
                </div>
            </section>
        `;
        
        // Load more handler
        document.getElementById('load-more')?.addEventListener('click', async () => {
            this.currentPage++;
            const more = await API.getLatestManga(this.currentPage);
            
            const grid = document.getElementById('latest-grid');
            more.manga.forEach(m => {
                grid.insertAdjacentHTML('beforeend', Components.mangaCard(m));
            });
        });
    }
    
    async renderTrending(container) {
        const trending = await API.getTrending();
        
        container.innerHTML = `
            <div class="mb-6">
                <h1 class="text-2xl font-bold mb-2">🔥 Trending Now</h1>
                <p class="text-gray-400">Manga paling populer minggu ini</p>
            </div>
            
            <div class="manga-grid">
                ${trending.map(m => Components.mangaCard(m)).join('')}
            </div>
        `;
    }
    
    async renderPopular(container) {
        const popular = await API.getPopular();
        
        container.innerHTML = `
            <div class="mb-6">
                <h1 class="text-2xl font-bold mb-2">⭐ Most Popular</h1>
                <p class="text-gray-400">Manga dengan pembaca terbanyak</p>
            </div>
            
            <div class="manga-grid">
                ${popular.map(m => Components.mangaCard(m)).join('')}
            </div>
        `;
    }
    
    async renderLatest(container) {
        const latest = await API.getLatestManga(1);
        
        container.innerHTML = `
            <div class="mb-6">
                <h1 class="text-2xl font-bold mb-2">🆕 Latest Updates</h1>
                <p class="text-gray-400">Manga terbaru yang diupdate</p>
            </div>
            
            <div class="manga-grid" id="latest-grid">
                ${latest.manga.map(m => Components.mangaCard(m)).join('')}
            </div>
            
            <div class="text-center mt-8">
                <button id="load-more" class="bg-white/5 hover:bg-white/10 px-6 py-3 rounded-full transition">
                    Load More <i class="fas fa-chevron-down ml-2"></i>
                </button>
            </div>
        `;
        
        document.getElementById('load-more')?.addEventListener('click', async () => {
            this.currentPage++;
            const more = await API.getLatestManga(this.currentPage);
            
            const grid = document.getElementById('latest-grid');
            more.manga.forEach(m => {
                grid.insertAdjacentHTML('beforeend', Components.mangaCard(m));
            });
        });
    }
    
    async renderMangaDetail(container, id) {
        const [manga, chapters] = await Promise.all([
            API.getMangaDetail(id),
            API.getChapters(id)
        ]);
        
        State.set('manga.detail', manga);
        State.set('manga.chapters', chapters);
        
        const isBookmarked = State.isBookmarked(id);
        
        container.innerHTML = `
            <div class="glass-premium p-6">
                <div class="flex flex-col md:flex-row gap-8">
                    <!-- Cover -->
                    <div class="md:w-64">
                        <img src="${manga.cover}" 
                             alt="${manga.title}"
                             class="w-full rounded-2xl shadow-2xl">
                        
                        <div class="flex gap-2 mt-4">
                            <button id="bookmark-btn" 
                                    class="flex-1 ${isBookmarked ? 'bg-pink-500' : 'bg-white/10'} hover:bg-pink-600 py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2"
                                    onclick="State.${isBookmarked ? 'removeBookmark' : 'addBookmark'}(State.get('manga.detail'))">
                                <i class="fas fa-${isBookmarked ? 'heart' : 'heart'}"></i>
                                ${isBookmarked ? 'Bookmarked' : 'Bookmark'}
                            </button>
                            
                            <button class="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-xl transition">
                                <i class="fas fa-share-alt"></i>
                            </button>
                        </div>
                    </div>
                    
                    <!-- Info -->
                    <div class="flex-1">
                        <h1 class="text-3xl font-bold mb-3">${manga.title}</h1>
                        
                        <div class="flex flex-wrap gap-2 mb-4">
                            ${manga.tags.map(tag => `
                                <span class="badge-premium">${tag}</span>
                            `).join('')}
                        </div>
                        
                        <div class="grid grid-cols-3 gap-4 mb-6">
                            ${Components.statCard('star', 'Rating', manga.rating)}
                            ${Components.statCard('calendar', 'Year', manga.year || 'N/A')}
                            ${Components.statCard('clock', 'Status', manga.status)}
                        </div>
                        
                        <div class="prose prose-invert max-w-none">
                            <h3 class="text-lg font-semibold mb-2">Synopsis</h3>
                            <p class="text-gray-300 leading-relaxed">${manga.description}</p>
                        </div>
                    </div>
                </div>
                
                <!-- Chapters -->
                <div class="mt-8">
                    <h2 class="text-xl font-bold mb-4 flex items-center gap-2">
                        <i class="fas fa-list"></i>
                        Chapters (${chapters.length})
                    </h2>
                    
                    <div class="space-y-2 max-h-96 overflow-y-auto pr-2">
                        ${chapters.map(ch => Components.chapterItem(ch, id)).join('')}
                    </div>
                </div>
            </div>
        `;
    }
    
    async renderChapter(container, id) {
        const params = new URLSearchParams(window.location.search);
        const mangaId = params.get('manga');
        
        const [images] = await Promise.all([
            API.getChapterImages(id)
        ]);
        
        container.innerHTML = `
            <div class="reader-container">
                <div class="flex items-center justify-between mb-4 sticky top-20 z-40 glass-premium p-3 rounded-xl">
                    <button onclick="window.history.back()" class="flex items-center gap-2 text-pink-500">
                        <i class="fas fa-arrow-left"></i>
                        Back
                    </button>
                    
                    <div class="flex items-center gap-2">
                        <button class="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-lg transition" onclick="UI.toggleFullscreen()">
                            <i class="fas fa-expand"></i>
                        </button>
                        <button class="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-lg transition" onclick="State.showToast('Download feature coming soon')">
                            <i class="fas fa-download"></i>
                        </button>
                    </div>
                </div>
                
                <div class="space-y-4" id="chapter-images">
                    ${images.map((img, i) => `
                        <div class="reader-page relative">
                            <img src="${img.url}" 
                                 class="w-full"
                                 loading="${i < 5 ? 'eager' : 'lazy'}"
                                 onerror="this.src='https://via.placeholder.com/800x1200/1a1a1a/ec4899?text=Error+Loading'">
                            <span class="absolute bottom-2 right-2 bg-black/50 backdrop-blur px-2 py-1 rounded text-xs">
                                ${img.page}/${images.length}
                            </span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        // Save progress
        if (mangaId) {
            State.saveProgress(mangaId, id, 1);
            State.addToHistory({ id: mangaId, title: 'Loading...' }, { id, title: 'Chapter' });
        }
        
        // Scroll progress
        const progressBar = document.createElement('div');
        progressBar.className = 'reading-progress';
        document.body.appendChild(progressBar);
        
        window.addEventListener('scroll', () => {
            const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = (winScroll / height) * 100;
            progressBar.style.width = scrolled + '%';
        });
    }
    
    async renderSearch(container) {
        const params = new URLSearchParams(window.location.search);
        const query = params.get('q') || '';
        
        if (!query) {
            container.innerHTML = `
                <div class="text-center py-10">
                    <i class="fas fa-search text-4xl text-gray-600 mb-3"></i>
                    <p class="text-gray-400">Type something to search</p>
                </div>
            `;
            return;
        }
        
        const results = await API.searchManga(query);
        
        container.innerHTML = `
            <div class="mb-6">
                <h1 class="text-2xl font-bold mb-2">🔍 Search Results</h1>
                <p class="text-gray-400">Found ${results.total} manga for "${query}"</p>
            </div>
            
            <div class="manga-grid">
                ${results.manga.map(m => Components.mangaCard(m)).join('')}
            </div>
        `;
    }
    
    renderBookmarks(container) {
        const bookmarks = State.get('user.bookmarks');
        
        if (bookmarks.length === 0) {
            container.innerHTML = Components.emptyState(
                'heart',
                'No bookmarks yet',
                "Router.go('/')"
            );
            return;
        }
        
        container.innerHTML = `
            <h1 class="text-2xl font-bold mb-4">❤️ My Bookmarks</h1>
            <div class="manga-grid">
                ${bookmarks.map(m => Components.mangaCard(m)).join('')}
            </div>
        `;
    }
    
    renderHistory(container) {
        const history = State.get('user.history');
        
        if (history.length === 0) {
            container.innerHTML = Components.emptyState(
                'clock',
                'No reading history',
                "Router.go('/')"
            );
            return;
        }
        
        container.innerHTML = `
            <h1 class="text-2xl font-bold mb-4">📚 Reading History</h1>
            <div class="space-y-3">
                ${history.map(h => `
                    <div class="glass-premium p-4 flex items-center gap-4 cursor-pointer hover:border-pink-500 transition"
                         onclick="Router.go('/manga/${h.manga.id}')">
                        <img src="${h.manga.cover}" class="w-12 h-12 object-cover rounded-lg">
                        <div class="flex-1">
                            <h3 class="font-semibold">${h.manga.title}</h3>
                            <p class="text-sm text-gray-400">
                                ${h.chapter.title} • ${new Date(h.readAt).toLocaleDateString()}
                            </p>
                        </div>
                        <i class="fas fa-chevron-right text-gray-400"></i>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    renderSettings(container) {
        const bookmarks = State.get('user.bookmarks').length;
        const history = State.get('user.history').length;
        
        container.innerHTML = `
            <h1 class="text-2xl font-bold mb-6">⚙️ Settings</h1>
            
            <div class="space-y-4 max-w-2xl">
                <!-- Stats -->
                <div class="grid grid-cols-3 gap-4">
                    ${Components.statCard('heart', 'Bookmarks', bookmarks)}
                    ${Components.statCard('clock', 'History', history)}
                    ${Components.statCard('star', 'Version', CONFIG.version)}
                </div>
                
                <!-- Appearance -->
                <div class="glass-premium p-6">
                    <h2 class="font-semibold mb-4">Appearance</h2>
                    <div class="flex items-center justify-between">
                        <span>Dark Mode</span>
                        <button onclick="State.toggleTheme()" 
                                class="w-12 h-6 bg-gray-600 rounded-full relative">
                            <span class="w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${State.get('user.theme') === 'dark' ? 'right-1' : 'left-1'}"></span>
                        </button>
                    </div>
                </div>
                
                <!-- Data Management -->
                <div class="glass-premium p-6">
                    <h2 class="font-semibold mb-4">Data Management</h2>
                    <div class="space-y-3">
                        <button onclick="API.clearCache()" class="w-full text-left p-3 hover:bg-white/5 rounded-lg transition">
                            Clear Cache
                        </button>
                        <button onclick="State.clearAll()" class="w-full text-left p-3 hover:bg-white/5 rounded-lg transition text-red-500">
                            Clear All Data
                        </button>
                    </div>
                </div>
                
                <!-- About -->
                <div class="glass-premium p-6">
                    <h2 class="font-semibold mb-4">About</h2>
                    <p class="text-sm text-gray-400 mb-2">Clara Manga v${CONFIG.version}</p>
                    <p class="text-sm text-gray-400">Made with ❤️ for manga lovers</p>
                </div>
            </div>
        `;
    }
    
    renderNotFound(container) {
        container.innerHTML = Components.emptyState(
            'exclamation-triangle',
            'Page not found',
            "Router.go('/')"
        );
    }
    
    handleScroll() {
        // Back to top button
        const backToTop = document.getElementById('back-to-top');
        if (backToTop) {
            if (window.scrollY > 500) {
                backToTop.classList.remove('hidden');
            } else {
                backToTop.classList.add('hidden');
            }
        }
        
        // Infinite scroll
        if (!CONFIG.ui.infiniteScroll) return;
        
        const scrollY = window.scrollY;
        const height = document.documentElement.scrollHeight - window.innerHeight;
        
        if (scrollY > height - 200 && !State.get('ui.loading')) {
            this.loadMore();
        }
    }
    
    async loadMore() {
        const page = State.get('ui.page');
        if (!['/', '/latest'].includes(page)) return;
        
        this.currentPage++;
        const more = await API.getLatestManga(this.currentPage);
        
        const grid = document.getElementById('latest-grid');
        if (grid) {
            more.manga.forEach(m => {
                grid.insertAdjacentHTML('beforeend', Components.mangaCard(m));
            });
        }
    }
    
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }
    
    debounce(func, wait) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }
}

// Router helper
const Router = {
    go(path) {
        window.history.pushState({}, '', path);
        window.app.loadPage(path);
        window.app.highlightActiveNav();
    }
};

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ClaraApp();
});
