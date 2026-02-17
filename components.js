// CLARA COMPONENTS - UI COMPONENTS

class ClaraComponents {
    // Manga Card
    static mangaCard(manga) {
        const isBookmarked = State.isBookmarked(manga.id);
        
        return `
            <div class="manga-card group" onclick="Router.go('/manga/${manga.id}')">
                <div class="relative overflow-hidden">
                    <img src="${manga.cover}" 
                         alt="${manga.title}"
                         class="w-full aspect-[3/4] object-cover"
                         loading="lazy"
                         onerror="this.src='https://via.placeholder.com/300x400/1a1a1a/ec4899?text=Error'">
                    
                    <div class="absolute top-2 right-2">
                        <div class="badge-premium">
                            <i class="fas fa-star text-[10px]"></i>
                            <span>${manga.rating}</span>
                        </div>
                    </div>
                    
                    <button class="absolute top-2 left-2 w-8 h-8 bg-black/50 backdrop-blur rounded-full flex items-center justify-center hover:bg-pink-500 transition-all"
                            onclick="event.stopPropagation(); ${isBookmarked ? 'State.removeBookmark' : 'State.addBookmark'}(this.manga)"
                            data-manga='${JSON.stringify(manga)}'>
                        <i class="fas fa-${isBookmarked ? 'heart' : 'heart'} text-${isBookmarked ? 'pink-500' : 'white'}"></i>
                    </button>
                    
                    ${manga.status === 'completed' ? `
                        <div class="absolute bottom-2 left-2 badge-outline">
                            <i class="fas fa-check-circle text-[10px]"></i> Completed
                        </div>
                    ` : ''}
                </div>
                
                <div class="p-3">
                    <h3 class="font-semibold text-sm line-clamp-2 group-hover:text-pink-500 transition">${manga.title}</h3>
                    
                    <div class="flex flex-wrap gap-1 mt-2">
                        ${manga.tags.slice(0, 2).map(tag => `
                            <span class="text-[10px] px-2 py-1 bg-white/5 rounded-full">${tag}</span>
                        `).join('')}
                    </div>
                    
                    <div class="flex items-center justify-between mt-2 text-xs text-gray-400">
                        <span><i class="far fa-calendar mr-1"></i>${manga.year || 'N/A'}</span>
                        <span><i class="far fa-eye mr-1"></i>${Math.floor(Math.random() * 100)}k</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Skeleton Card
    static skeletonCard() {
        return `
            <div class="manga-card">
                <div class="skeleton-premium aspect-[3/4] w-full"></div>
                <div class="p-3 space-y-2">
                    <div class="skeleton-premium h-4 w-3/4"></div>
                    <div class="skeleton-premium h-3 w-1/2"></div>
                    <div class="flex gap-1">
                        <div class="skeleton-premium h-5 w-12 rounded-full"></div>
                        <div class="skeleton-premium h-5 w-12 rounded-full"></div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Chapter Item
    static chapterItem(chapter, mangaId) {
        const progress = State.get('user.progress')[mangaId];
        const isCurrent = progress?.chapterId === chapter.id;
        
        return `
            <div class="chapter-item flex items-center justify-between" 
                 onclick="Router.go('/chapter/${chapter.id}?manga=${mangaId}')">
                <div class="flex-1">
                    <div class="flex items-center gap-2">
                        <h4 class="font-semibold">${chapter.title}</h4>
                        ${isCurrent ? '<span class="badge-premium text-[10px] py-1">Continue</span>' : ''}
                    </div>
                    <div class="flex items-center gap-3 text-xs text-gray-400 mt-1">
                        <span><i class="far fa-file-image mr-1"></i>${chapter.pages || '?'} pages</span>
                        <span><i class="far fa-clock mr-1"></i>${new Date(chapter.published).toLocaleDateString()}</span>
                        <span><i class="far fa-user mr-1"></i>${chapter.group}</span>
                    </div>
                </div>
                
                <div class="flex items-center gap-2">
                    ${progress?.chapterId === chapter.id ? `
                        <div class="text-xs text-pink-500">
                            Page ${progress.page}
                        </div>
                    ` : ''}
                    <i class="fas fa-chevron-right text-gray-400"></i>
                </div>
            </div>
        `;
    }
    
    // Genre Chip
    static genreChip(genre, active = false) {
        return `
            <button class="genre-chip ${active ? 'active' : ''}" data-genre="${genre}">
                ${genre}
            </button>
        `;
    }
    
    // Toast
    static toast(message, type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        
        return `
            <div class="glass-premium px-4 py-3 rounded-xl flex items-center gap-3 toast-enter">
                <i class="fas fa-${icons[type]} text-${type === 'success' ? 'green' : type}-500"></i>
                <span class="text-sm">${message}</span>
            </div>
        `;
    }
    
    // Stat Card
    static statCard(icon, label, value) {
        return `
            <div class="stat-card">
                <i class="fas fa-${icon} text-2xl text-pink-500 mb-2"></i>
                <div class="text-2xl font-bold">${value}</div>
                <div class="text-xs text-gray-400">${label}</div>
            </div>
        `;
    }
    
    // Loading Spinner
    static spinner() {
        return `
            <div class="flex items-center justify-center py-10">
                <div class="spinner"></div>
            </div>
        `;
    }
    
    // Empty State
    static emptyState(icon, message, action) {
        return `
            <div class="empty-state">
                <i class="fas fa-${icon}"></i>
                <p class="text-gray-400 mb-4">${message}</p>
                ${action ? `
                    <button class="bg-pink-500 text-white px-6 py-2 rounded-full hover:bg-pink-600 transition" onclick="${action}">
                        Explore Manga
                    </button>
                ` : ''}
            </div>
        `;
    }
    
    // Hero Section
    static hero() {
        return `
            <div class="hero-gradient glass-premium p-8 rounded-3xl mb-8 relative overflow-hidden">
                <div class="relative z-10">
                    <h1 class="text-4xl md:text-5xl font-bold mb-3">Welcome to <span class="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">Clara</span> 🌸</h1>
                    <p class="text-gray-300 text-lg mb-6">Baca ribuan manga gratis, update setiap hari dengan kualitas terbaik</p>
                    
                    <div class="flex flex-wrap gap-4">
                        <div class="stat-card !p-4 !bg-white/5">
                            <div class="text-2xl font-bold">1000+</div>
                            <div class="text-xs text-gray-400">Manga</div>
                        </div>
                        <div class="stat-card !p-4 !bg-white/5">
                            <div class="text-2xl font-bold">50k+</div>
                            <div class="text-xs text-gray-400">Chapters</div>
                        </div>
                        <div class="stat-card !p-4 !bg-white/5">
                            <div class="text-2xl font-bold">24/7</div>
                            <div class="text-xs text-gray-400">Updates</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

window.Components = ClaraComponents;