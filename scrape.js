// scraper.js - CLARA Scraper

class ClaraScraper {
    constructor() {
        this.cache = new Map();
        this.lastRequestTime = 0;
        this.retryCount = 3;
    }
    
    async rateLimiter() {
        if (!CONFIG.rateLimit.enabled) return;
        
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        const minDelay = 1000 / CONFIG.rateLimit.requests;
        
        if (timeSinceLastRequest < minDelay) {
            await new Promise(resolve => setTimeout(resolve, minDelay - timeSinceLastRequest));
        }
        
        this.lastRequestTime = Date.now();
    }
    
    getCache(key) {
        if (!CONFIG.cache.enabled) return null;
        
        const cached = this.cache.get(key);
        if (!cached) return null;
        
        if (Date.now() - cached.timestamp > CONFIG.cache.ttl) {
            this.cache.delete(key);
            return null;
        }
        
        return cached.data;
    }
    
    setCache(key, data) {
        if (!CONFIG.cache.enabled) return;
        
        if (this.cache.size >= CONFIG.cache.maxSize) {
            const oldestKey = this.cache.keys().next().value;
            this.cache.delete(oldestKey);
        }
        
        this.cache.set(key, { data, timestamp: Date.now() });
    }
    
    async fetchWithRetry(url, options = {}, retries = this.retryCount) {
        for (let i = 0; i < retries; i++) {
            try {
                await this.rateLimiter();
                
                const res = await fetch(url, {
                    ...options,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        ...options.headers
                    }
                });
                
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return await res.json();
            } catch (error) {
                if (i === retries - 1) throw error;
                await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
            }
        }
    }
    
    async scrapeList(page = 1, filters = {}) {
        const cacheKey = `list-${page}-${JSON.stringify(filters)}`;
        const cached = this.getCache(cacheKey);
        if (cached) return cached;
        
        try {
            const url = `${CONFIG.sources[0].baseUrl}/manga?limit=${CONFIG.ui.itemsPerPage}&offset=${(page-1)*CONFIG.ui.itemsPerPage}&includes[]=cover_art`;
            const data = await this.fetchWithRetry(url);
            
            const mangaList = await Promise.all(data.data.map(async item => {
                const coverArt = item.relationships.find(r => r.type === 'cover_art');
                const coverUrl = coverArt ?
                    `https://uploads.mangadex.org/covers/${item.id}/${coverArt.attributes?.fileName}` :
                    'https://via.placeholder.com/300x400?text=No+Cover';
                
                return {
                    id: item.id,
                    title: item.attributes.title.en || Object.values(item.attributes.title)[0] || 'Unknown',
                    description: item.attributes.description?.en || 'No description available',
                    cover: coverUrl,
                    status: item.attributes.status || 'unknown',
                    year: item.attributes.year,
                    genres: item.attributes.tags?.map(t => t.attributes.name.en) || []
                };
            }));
            
            const result = {
                manga: mangaList,
                total: data.total,
                page,
                hasNext: (page * CONFIG.ui.itemsPerPage) < data.total
            };
            
            this.setCache(cacheKey, result);
            return result;
            
        } catch (error) {
            console.error('Scrape error:', error);
            return {
                manga: this.generateFallbackList(page),
                total: 9999,
                page,
                hasNext: true
            };
        }
    }
    
    async scrapeDetail(id) {
        const cacheKey = `detail-${id}`;
        const cached = this.getCache(cacheKey);
        if (cached) return cached;
        
        try {
            const mangaData = await this.fetchWithRetry(`${CONFIG.sources[0].baseUrl}/manga/${id}?includes[]=cover_art`);
            
            const coverArt = mangaData.data.relationships.find(r => r.type === 'cover_art');
            const coverUrl = coverArt ?
                `https://uploads.mangadex.org/covers/${id}/${coverArt.attributes?.fileName}` :
                'https://via.placeholder.com/300x400?text=No+Cover';
            
            const manga = {
                id: mangaData.data.id,
                title: mangaData.data.attributes.title.en || Object.values(mangaData.data.attributes.title)[0],
                description: mangaData.data.attributes.description?.en || 'No description',
                cover: coverUrl,
                status: mangaData.data.attributes.status,
                year: mangaData.data.attributes.year,
                genres: mangaData.data.attributes.tags?.map(t => t.attributes.name.en) || []
            };
            
            // Get chapters
            const chaptersData = await this.fetchWithRetry(
                `${CONFIG.sources[0].baseUrl}/manga/${id}/feed?limit=500&translatedLanguage[]=en&order[chapter]=desc`
            );
            
            const chapters = chaptersData.data.map(ch => ({
                id: ch.id,
                title: ch.attributes.title || `Chapter ${ch.attributes.chapter}`,
                number: parseFloat(ch.attributes.chapter) || 0,
                pages: 0,
                lang: ch.attributes.translatedLanguage
            })).sort((a, b) => b.number - a.number);
            
            const result = { manga, chapters };
            this.setCache(cacheKey, result);
            return result;
            
        } catch (error) {
            console.error('Detail error:', error);
            return {
                manga: this.generateFallbackManga(id),
                chapters: this.generateFallbackChapters()
            };
        }
    }
    
    async scrapeChapterImages(chapterId) {
        const cacheKey = `chapter-${chapterId}`;
        const cached = this.getCache(cacheKey);
        if (cached) return cached;
        
        try {
            const data = await this.fetchWithRetry(`${CONFIG.sources[0].baseUrl}/at-home/server/${chapterId}`);
            
            const images = data.chapter.data.map((filename, index) => ({
                url: `${data.baseUrl}/data/${data.chapter.hash}/${filename}`,
                filename,
                page: index + 1
            }));
            
            this.setCache(cacheKey, images);
            return images;
            
        } catch (error) {
            console.error('Chapter error:', error);
            return Array.from({ length: 20 }, (_, i) => ({
                url: `https://via.placeholder.com/800x1200/2a2a2a/ffffff?text=Page+${i+1}`,
                filename: `page-${i+1}.jpg`,
                page: i + 1
            }));
        }
    }
    
    async search(query, page = 1) {
        if (!query) return this.scrapeList(page);
        
        const cacheKey = `search-${query}-${page}`;
        const cached = this.getCache(cacheKey);
        if (cached) return cached;
        
        try {
            const url = `${CONFIG.sources[0].baseUrl}/manga?title=${encodeURIComponent(query)}&limit=${CONFIG.ui.itemsPerPage}&offset=${(page-1)*CONFIG.ui.itemsPerPage}`;
            const data = await this.fetchWithRetry(url);
            
            const results = data.data.map(item => ({
                id: item.id,
                title: item.attributes.title.en || Object.values(item.attributes.title)[0],
                cover: `https://via.placeholder.com/300x400?text=${encodeURIComponent(item.attributes.title.en || 'Manga')}`,
                year: item.attributes.year
            }));
            
            const result = {
                manga: results,
                total: data.total,
                page,
                hasNext: (page * CONFIG.ui.itemsPerPage) < data.total
            };
            
            this.setCache(cacheKey, result);
            return result;
            
        } catch (error) {
            return this.scrapeList(page);
        }
    }
    
    async getTrending() {
        const list = await this.scrapeList(1);
        return list.manga.slice(0, 10);
    }
    
    async getPopular() {
        const list = await this.scrapeList(1);
        return [...list.manga].sort(() => Math.random() - 0.5).slice(0, 10);
    }
    
    generateFallbackList(page) {
        return Array.from({ length: CONFIG.ui.itemsPerPage }, (_, i) => ({
            id: `fallback-${page}-${i}`,
            title: `Manga Populer ${i + 1}`,
            cover: 'https://via.placeholder.com/300x400/2a2a2a/ffffff?text=Manga',
            status: 'ongoing',
            year: 2024,
            genres: ['Action', 'Adventure']
        }));
    }
    
    generateFallbackManga(id) {
        return {
            id,
            title: 'Sample Manga',
            description: 'This is a sample manga description. The actual data could not be loaded.',
            cover: 'https://via.placeholder.com/300x400/2a2a2a/ffffff?text=Manga',
            status: 'ongoing',
            year: 2024,
            genres: ['Action', 'Comedy']
        };
    }
    
    generateFallbackChapters() {
        return Array.from({ length: 20 }, (_, i) => ({
            id: `chapter-${i+1}`,
            title: `Chapter ${i+1}`,
            number: i + 1,
            pages: 30
        }));
    }
    
    clearCache() {
        this.cache.clear();
        State.showToast('✨ Cache cleared!', 'info');
    }
}

const Scraper = new ClaraScraper();
window.Scraper = Scraper;