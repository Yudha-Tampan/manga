// router.js - CLARA Router

class ClaraRouter {
    constructor() {
        this.routes = {
            '/': 'home',
            '/home': 'home',
            '/manga/:id': 'detail',
            '/chapter/:id': 'reader',
            '/search': 'search',
            '/bookmarks': 'bookmarks',
            '/history': 'history',
            '/settings': 'settings',
            '/trending': 'trending',
            '/popular': 'popular',
            '/random': 'random',
            '/404': 'not-found'
        };
        
        this.params = {};
        this.query = {};
        
        window.addEventListener('popstate', () => this.handleNavigation());
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link && link.href && link.href.startsWith(window.location.origin)) {
                e.preventDefault();
                this.navigate(link.pathname);
            }
        });
    }
    
    matchRoute(path) {
        const [pathname, queryString] = path.split('?');
        this.query = Object.fromEntries(new URLSearchParams(queryString));
        
        if (this.routes[pathname]) {
            this.params = {};
            return this.routes[pathname];
        }
        
        for (const [route, view] of Object.entries(this.routes)) {
            if (route.includes(':')) {
                const routeParts = route.split('/');
                const pathParts = pathname.split('/');
                
                if (routeParts.length === pathParts.length) {
                    const params = {};
                    let match = true;
                    
                    for (let i = 0; i < routeParts.length; i++) {
                        if (routeParts[i].startsWith(':')) {
                            params[routeParts[i].slice(1)] = pathParts[i];
                        } else if (routeParts[i] !== pathParts[i]) {
                            match = false;
                            break;
                        }
                    }
                    
                    if (match) {
                        this.params = params;
                        return view;
                    }
                }
            }
        }
        
        return 'not-found';
    }
    
    navigate(path) {
        const view = this.matchRoute(path);
        window.history.pushState({}, '', path);
        this.loadView(view);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        State.set('ui.currentPage', view);
    }
    
    handleNavigation() {
        const path = window.location.pathname;
        const view = this.matchRoute(path);
        this.loadView(view);
    }
    
    async loadView(view) {
        const app = document.getElementById('app');
        app.classList.add('page-transition');
        State.set('ui.loading', true);
        
        switch (view) {
            case 'home':
                await this.renderHome(app);
                break;
            case 'detail':
                await this.renderDetail(app, this.params.id);
                break;
            case 'reader':
                await this.renderReader(app, this.params.id);
                break;
            case 'search':
                await this.renderSearch(app);
                break;
            case 'bookmarks':
                this.renderBookmarks(app);
                break;
            case 'history':
                this.renderHistory(app);
                break;
            case 'settings':
                this.renderSettings(app);
                break;
            case 'trending':
                await this.renderTrending(app);
                break;
            case 'popular':
                await this.renderPopular(app);
                break;
            case 'random':
                await this.renderRandom();
                break;
            default:
                this.renderNotFound(app);
        }
        
        State.set('ui.loading', false);
        setTimeout(() => app.classList.remove('page-transition'), 300);
    }
    
    async renderHome(container) {
        container.innerHTML = `
            <div class="space-y-8">
                <!-- Hero Section -->
                <div class="relative h-64 md:h-96 rounded-2xl overflow-hidden">
                    <div class="absolute inset-0 bg-gradient-to-r from-pink-500/50 to-purple-500/50 mix-blend-overlay"></div>
                    <img src="https://via.placeholder.com/1200x400/1a1a1a/ec4899?text=Clara+Manga" 
                         class="w-full h-full object-cover">
                    <div class="absolute bottom-0 left-0 p-6">
                        <h2 class="text-3xl md:text-4xl font-bold mb-2">Welcome to Clara ✨</h2>
                        <p class="text-gray-200">Baca ribuan manga gratis, update setiap hari!</p>
                    </div>
                </div>
                
                <!-- Trending Section -->
                <div>
                    <h2 class="text-2xl font-bold mb-4 flex items-center gap-2">
                        <i class="fas fa-fire text-pink-500"></i> Trending Now
                    </h2>
                    <div class="grid grid-cols-2 md:grid-cols-5 gap-4" id="trending-container">
                        ${Array(5).fill(0).map(() => `
                            <div class="glass rounded-xl p-3">
                                <div class="skeleton h-40 w-full rounded-lg"></div>
                                <div class="skeleton h-4 w-3/4 mt-2"></div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <!-- Recent Update -->
                <div>
                    <h2 class="text-2xl font-bold mb-4">📚 Recent Update</h2>
                    <div class="grid grid-cols-2 md:grid-cols-6 gap-3" id="recent-container">
                        ${Array(12).fill(0).map(() => `
                            <div class="glass rounded-lg p-2">
                                <div class="skeleton h-32 w-full rounded"></div>
                                <div class="skeleton h-3 w-full mt-1"></div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        // Load actual data
        const trending = await Scraper.getTrending();
        const recent = await Scraper.scrapeList(1);
        
        document.getElementById('trending-container').innerHTML = trending.map(m => `
            <div class="manga-card cursor-pointer" onclick="Router.navigate('/manga/${m.id}')">
                <img src="${m.cover}" class="w-full h-40 object-cover rounded-lg" loading="lazy">
                <h3 class="font-semibold mt-2 text-sm line-clamp-2">${m.title}</h3>
            </div>
        `).join('');
        
        document.getElementById('recent-container').innerHTML = recent.manga.slice(0, 12).map(m => `
            <div class="manga-card cursor-pointer" onclick="Router.navigate('/manga/${m.id}')">
                <img src="${m.cover}" class="w-full h-32 object-cover rounded-lg" loading="lazy">
                <h3 class="font-semibold mt-1 text-xs line-clamp-2">${m.title}</h3>
            </div>
        `).join('');
    }
    
    async renderDetail(container, id) {
        State.set('ui.loading', true);
        container.innerHTML = `
            <div class="glass p-4 rounded-xl">
                <div class="flex flex-col md:flex-row gap-6">
                    <div class="skeleton w-48 h-64 rounded-lg mx-auto md:mx-0"></div>
                    <div class="flex-1 space-y-3">
                        <div class="skeleton h-8 w-3/4"></div>
                        <div class="skeleton h-4 w-full"></div>
                        <div class="skeleton h-4 w-full"></div>
                        <div class="skeleton h-4 w-2/3"></div>
                        <div class="flex gap-2">
                            <div class="skeleton h-6 w-16 rounded-full"></div>
                            <div class="skeleton h-6 w-16 rounded-full"></div>
                        </div>
                    </div>
                </div>
                <div class="mt-6">
                    <div class="skeleton h-8 w-40 mb-3"></div>
                    <div class="space-y-2">
                        ${Array(5).fill(0).map(() => '<div class="skeleton h-12 w-full rounded"></div>').join('')}
                    </div>
                </div>
            </div>
        `;
        
        const data = await Scraper.scrapeDetail(id);
        State.set('data.currentManga', data.manga);
        State.set('data.chapters', data.chapters);
        
        const isBookmarked = State.isBookmarked(id);
        
        container.innerHTML = `
            <div class="glass p-4 rounded-xl">
                <div class="flex flex-col md:flex-row gap-6">
                    <img src="${data.manga.cover}" class="w-48 h-64 object-cover rounded-lg mx-auto md:mx-0">
                    
                    <div class="flex-1">
                        <h1 class="text-2xl font-bold mb-2">${data.manga.title}</h1>
                        <p class="text-gray-300 mb-4">${data.manga.description}</p>
                        
                        <div class="flex flex-wrap gap-2 mb-4">
                            ${data.manga.genres.map(g => 
                                `<span class="genre-badge">${g}</span>`
                            ).join('')}
                        </div>
                        
                        <div class="flex gap-2 mb-4">
                            <span class="text-sm bg-gray-800 px-3 py-1 rounded-full">
                                <i class="far fa-calendar mr-1"></i> ${data.manga.year || 'N/A'}
                            </span>
                            <span class="text-sm bg-gray-800 px-3 py-1 rounded-full">
                                <i class="far fa-clock mr-1"></i> ${data.manga.status}
                            </span>
                        </div>
                        
                        <div class="flex gap-3">
                            <button id="bookmark-btn" class="px-4 py-2 rounded-lg flex items-center gap-2 ${isBookmarked ? 'bg-pink-600' : 'bg-gray-700'}" 
                                    onclick="State.${isBookmarked ? 'removeBookmark' : 'addBookmark'}(State.get('data.currentManga'))">
                                <i class="fas fa-${isBookmarked ? 'heart' : 'heart'}"></i>
                                ${isBookmarked ? 'Bookmarked' : 'Bookmark'}
                            </button>
                            <button onclick="State.showToast('✨ Coming soon!', 'info')" class="bg-gray-700 px-4 py-2 rounded-lg">
                                <i class="fas fa-download"></i>
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="mt-6">
                    <h2 class="text-xl font-bold mb-3 flex items-center gap-2">
                        <i class="fas fa-list"></i> Chapters (${data.chapters.length})
                    </h2>
                    <div class="space-y-2 max-h-96 overflow-y-auto pr-2">
                        ${data.chapters.map(ch => `
                            <div class="glass p-3 rounded-lg hover:bg-gray-800 cursor-pointer flex justify-between items-center"
                                 onclick="Router.navigate('/chapter/${ch.id}')">
                                <div>
                                    <span class="font-semibold">${ch.title}</span>
                                    <span class="text-xs text-gray-400 ml-2">${ch.pages || '?'} pages</span>
                                </div>
                                <i class="fas fa-chevron-right text-gray-400"></i>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }
    
    async renderReader(container, id) {
        State.set('ui.loading', true);
        container.innerHTML = `
            <div class="text-center py-10">
                <div class="loading-spinner mx-auto"></div>
                <p class="mt-4">Loading chapter...</p>
            </div>
        `;
        
        const images = await Scraper.scrapeChapterImages(id);
        State.set('data.chapterImages', images);
        
        container.innerHTML = `
            <div class="max-w-3xl mx-auto">
                <div class="flex justify-between items-center mb-4">
                    <button onclick="window.history.back()" class="text-pink-500">
                        <i class="fas fa-arrow-left"></i> Back
                    </button>
                    <div class="flex gap-2">
                        <button onclick="UI.toggleFullscreen()" class="p-2 hover:bg-gray-800 rounded">
                            <i class="fas fa-expand"></i>
                        </button>
                        <button onclick="State.showToast('✨ Downloaded to history', 'success')" class="p-2 hover:bg-gray-800 rounded">
                            <i class="fas fa-download"></i>
                        </button>
                    </div>
                </div>
                
                <div class="space-y-4" id="chapter-images">
                    ${images.map(img => `
                        <img src="${img.url}" 
                             class="w-full rounded-lg" 
                             loading="lazy"
                             onerror="this.src='https://via.placeholder.com/800x1200/2a2a2a/ffffff?text=Image+Not+Found'">
                    `).join('')}
                </div>
                
                <!-- Chapter Progress -->
                <div class="sticky bottom-0 left-0 right-0 glass p-3 mt-4 rounded-t-xl">
                    <div class="chapter-progress" style="width: 0%"></div>
                    <div class="flex justify-between items-center text-sm">
                        <button class="text-pink-500"><i class="fas fa-chevron-left"></i> Prev</button>
                        <span>Page <span id="current-page">1</span> / ${images.length}</span>
                        <button class="text-pink-500">Next <i class="fas fa-chevron-right"></i></button>
                    </div>
                </div>
            </div>
        `;
        
        // Track reading progress
        const mangaId = new URLSearchParams(window.location.search).get('manga');
        if (mangaId) {
            State.saveProgress(mangaId, id, 1);
        }
    }
    
    renderBookmarks(container) {
        const bookmarks = State.get('user.bookmarks');
        container.innerHTML = `
            <div class="p-4">
                <h1 class="text-2xl font-bold mb-4 flex items-center gap-2">
                    <i class="fas fa-heart text-pink-500"></i> My Bookmarks
                </h1>
                ${bookmarks.length === 0 ? `
                    <div class="text-center py-10">
                        <i class="fas fa-book-open text-4xl text-gray-600 mb-3"></i>
                        <p class="text-gray-400">No bookmarks yet</p>
                        <a href="/" class="inline-block mt-3 bg-pink-500 text-white px-4 py-2 rounded-lg">
                            Browse Manga
                        </a>
                    </div>
                ` : `
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        ${bookmarks.map(m => `
                            <div class="manga-card cursor-pointer" onclick="Router.navigate('/manga/${m.id}')">
                                <img src="${m.cover}" class="w-full h-48 object-cover rounded-lg">
                                <h3 class="font-semibold mt-2 line-clamp-2">${m.title}</h3>
                                <button onclick="event.stopPropagation(); State.removeBookmark('${m.id}')" 
                                        class="text-sm text-pink-500 mt-1">
                                    <i class="fas fa-trash"></i> Remove
                                </button>
                            </div>
                        `).join('')}
                    </div>
                `}
            </div>
        `;
    }
    
    renderHistory(container) {
        const history = State.get('user.history');
        container.innerHTML = `
            <div class="p-4">
                <h1 class="text-2xl font-bold mb-4 flex items-center gap-2">
                    <i class="fas fa-clock text-pink-500"></i> Reading History
                </h1>
                ${history.length === 0 ? `
                    <div class="text-center py-10">
                        <i class="fas fa-history text-4xl text-gray-600 mb-3"></i>
                        <p class="text-gray-400">No history yet</p>
                    </div>
                ` : `
                    <div class="space-y-3">
                        ${history.map(h => `
                            <div class="glass p-3 rounded-lg flex items-center gap-3">
                                <img src="${h.manga.cover}" class="w-12 h-12 object-cover rounded">
                                <div class="flex-1">
                                    <h3 class="font-semibold">${h.manga.title}</h3>
                                    <p class="text-sm text-gray-400">
                                        ${h.chapter.title} • ${new Date(h.readAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <button onclick="Router.navigate('/manga/${h.manga.id}')" class="text-pink-500">
                                    <i class="fas fa-play"></i>
                                </button>
                            </div>
                        `).join('')}
                    </div>
                `}
            </div>
        `;
    }
    
    renderSettings(container) {
        container.innerHTML = `
            <div class="p-4 max-w-2xl mx-auto">
                <h1 class="text-2xl font-bold mb-6">⚙️ Settings</h1>
                
                <div class="space-y-4">
                    <div class="glass p-4 rounded-lg">
                        <h2 class="font-semibold mb-3">Appearance</h2>
                        <div class="space-y-2">
                            <button onclick="UI.toggleTheme()" class="w-full text-left p-2 hover:bg-gray-700 rounded">
                                Theme: ${State.get('user.theme')}
                            </button>
                        </div>
                    </div>
                    
                    <div class="glass p-4 rounded-lg">
                        <h2 class="font-semibold mb-3">Reading Streak</h2>
                        <p class="text-2xl font-bold text-pink-500">${State.get('user.readingStreak')} days</p>
                    </div>
                    
                    <div class="glass p-4 rounded-lg">
                        <h2 class="font-semibold mb-3">Data Management</h2>
                        <div class="space-y-2">
                            <button onclick="Scraper.clearCache()" class="w-full text-left p-2 hover:bg-gray-700 rounded">
                                Clear Cache
                            </button>
                            <button onclick="State.clearAllData()" class="w-full text-left p-2 hover:bg-gray-700 rounded text-red-500">
                                Clear All Data
                            </button>
                        </div>
                    </div>
                    
                    <div class="glass p-4 rounded-lg">
                        <h2 class="font-semibold mb-3">About Clara</h2>
                        <p class="text-sm text-gray-400">Version: ${CONFIG.version}</p>
                        <p class="text-sm text-gray-400">Source: ${CONFIG.sources[0].name}</p>
                        <p class="text-xs text-gray-500 mt-2">Made with ❤️ for manga lovers</p>
                    </div>
                </div>
            </div>
        `;
    }
    
    async renderTrending(container) {
        const trending = await Scraper.getTrending();
        container.innerHTML = `
            <div class="p-4">
                <h1 class="text-2xl font-bold mb-4 flex items-center gap-2">
                    <i class="fas fa-fire text-pink-500"></i> Trending Now
                </h1>
                <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
                    ${trending.map(m => `
                        <div class="manga-card cursor-pointer" onclick="Router.navigate('/manga/${m.id}')">
                            <img src="${m.cover}" class="w-full h-48 object-cover rounded-lg">
                            <h3 class="font-semibold mt-2 text-sm line-clamp-2">${m.title}</h3>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    async renderPopular(container) {
        const popular = await Scraper.getPopular();
        container.innerHTML = `
            <div class="p-4">
                <h1 class="text-2xl font-bold mb-4 flex items-center gap-2">
                    <i class="fas fa-star text-pink-500"></i> Most Popular
                </h1>
                <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
                    ${popular.map(m => `
                        <div class="manga-card cursor-pointer" onclick="Router.navigate('/manga/${m.id}')">
                            <img src="${m.cover}" class="w-full h-48 object-cover rounded-lg">
                            <h3 class="font-semibold mt-2 text-sm line-clamp-2">${m.title}</h3>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    async renderRandom() {
        const list = await Scraper.scrapeList(Math.floor(Math.random() * 10) + 1);
        const random = list.manga[Math.floor(Math.random() * list.manga.length)];
        if (random) this.navigate(`/manga/${random.id}`);
    }
    
    renderNotFound(container) {
        container.innerHTML = `
            <div class="min-h-[60vh] flex items-center justify-center">
                <div class="text-center">
                    <h1 class="text-4xl font-bold mb-4">404</h1>
                    <p class="text-gray-400 mb-4">Page not found</p>
                    <a href="/" class="bg-pink-500 text-white px-6 py-2 rounded-lg hover:bg-pink-600">
                        Go Home
                    </a>
                </div>
            </div>
        `;
    }
    
    async renderSearch(container) {
        const query = this.query.q || '';
        container.innerHTML = `
            <div class="p-4">
                <h1 class="text-2xl font-bold mb-4">🔍 Search Results for "${query}"</h1>
                <div class="grid grid-cols-2 md:grid-cols-5 gap-4" id="search-results">
                    ${Array(10).fill(0).map(() => `
                        <div class="glass rounded-lg p-2">
                            <div class="skeleton h-32 w-full"></div>
                            <div class="skeleton h-3 w-full mt-1"></div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        if (query) {
            const results = await Scraper.search(query);
            document.getElementById('search-results').innerHTML = results.manga.map(m => `
                <div class="manga-card cursor-pointer" onclick="Router.navigate('/manga/${m.id}')">
                    <img src="${m.cover}" class="w-full h-32 object-cover rounded-lg">
                    <h3 class="font-semibold mt-1 text-sm line-clamp-2">${m.title}</h3>
                </div>
            `).join('');
        }
    }
}

const Router = new ClaraRouter();
window.Router = Router;