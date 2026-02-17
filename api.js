// CLARA API - MANGA DEX INTEGRATION

class ClaraAPI {
    constructor() {
        this.baseUrl = 'https://api.mangadex.org';
        this.cache = new Map();
        this.requests = 0;
        this.lastRequest = 0;
        this.maxRetries = 3;
    }
    
    async fetch(endpoint, options = {}) {
        // Rate limiting - MangaDex butuh 1 request per detik minimal
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequest;
        if (timeSinceLastRequest < 250) { // 4 request per detik
            await new Promise(resolve => setTimeout(resolve, 250 - timeSinceLastRequest));
        }
        
        // Cache check dengan TTL 5 menit
        const cacheKey = `${endpoint}_${JSON.stringify(options)}`;
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < 300000) { // 5 menit
                console.log('🔥 Cache hit:', endpoint);
                return cached.data;
            }
            this.cache.delete(cacheKey);
        }
        
        // Retry mechanism
        let lastError = null;
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                this.lastRequest = Date.now();
                
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 detik timeout
                
                const url = `${this.baseUrl}${endpoint}`;
                console.log(`📡 Fetching: ${url} (attempt ${attempt})`);
                
                const response = await fetch(url, {
                    ...options,
                    signal: controller.signal,
                    headers: {
                        'User-Agent': 'ClaraManga/3.1 (https://clara.manga)',
                        'Accept': 'application/json',
                        ...options.headers
                    }
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 100)}`);
                }
                
                const data = await response.json();
                
                // Simpan ke cache
                if (this.cache.size >= 200) {
                    const oldest = this.cache.keys().next().value;
                    this.cache.delete(oldest);
                }
                
                this.cache.set(cacheKey, {
                    data,
                    timestamp: Date.now()
                });
                
                return data;
                
            } catch (error) {
                lastError = error;
                console.error(`❌ Attempt ${attempt} failed:`, error.message);
                
                if (attempt < this.maxRetries) {
                    // Exponential backoff
                    const delay = Math.min(1000 * Math.pow(2, attempt), 8000);
                    console.log(`⏳ Retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        
        throw lastError || new Error('Failed after retries');
    }
    
    // GET MANGA LIST DENGAN FILTER LENGKAP
    async getMangaList(page = 1, filters = {}) {
        const limit = 20; // Kurangi jadi 20 biar lebih cepat
        const offset = (page - 1) * limit;
        
        try {
            // Parameter penting untuk dapetin yang ada chapter-nya
            let url = `/manga?limit=${limit}&offset=${offset}&includes[]=cover_art&order[updatedAt]=desc&availableTranslatedLanguage[]=en&hasAvailableChapters=true&contentRating[]=safe&contentRating[]=suggestive`;
            
            if (filters.genre?.length) {
                url += filters.genre.map(g => `&includedTags[]=${g}`).join('');
            }
            
            if (filters.status) {
                url += `&status[]=${filters.status}`;
            }
            
            if (filters.search) {
                url += `&title=${encodeURIComponent(filters.search)}`;
            }
            
            console.log('🔍 Requesting manga list:', url);
            
            const data = await this.fetch(url);
            
            // Process manga list dengan cover art
            const mangaList = await Promise.all(data.data.map(async item => {
                const coverArt = item.relationships.find(r => r.type === 'cover_art');
                let coverUrl = 'https://via.placeholder.com/300x400/1a1a1a/ec4899?text=No+Cover';
                
                if (coverArt && coverArt.attributes?.fileName) {
                    coverUrl = `https://uploads.mangadex.org/covers/${item.id}/${coverArt.attributes.fileName}.256.jpg`;
                }
                
                // Ambil title dengan fallback lengkap
                let title = 'Untitled';
                if (item.attributes.title) {
                    title = item.attributes.title.en || 
                           item.attributes.title['ja-ro'] || 
                           item.attributes.title.ja || 
                           Object.values(item.attributes.title)[0] || 
                           'Untitled';
                }
                
                return {
                    id: item.id,
                    title: title,
                    description: item.attributes.description?.en || item.attributes.description?.ja || 'No description available',
                    cover: coverUrl,
                    status: item.attributes.status || 'unknown',
                    year: item.attributes.year || new Date().getFullYear(),
                    tags: item.attributes.tags?.map(t => t.attributes.name.en || t.attributes.name.ja) || [],
                    rating: (Math.random() * 2 + 3).toFixed(1), // Placeholder rating
                    latestChapter: item.attributes.latestUploadedChapter || 'N/A'
                };
            }));
            
            return {
                manga: mangaList,
                total: data.total,
                page,
                limit,
                offset,
                hasNext: offset + limit < data.total
            };
            
        } catch (error) {
            console.error('❌ Error in getMangaList:', error);
            throw error;
        }
    }
    
    // GET LATEST MANGA - YANG BENER
    async getLatestManga(page = 1) {
        try {
            console.log('🔥 Getting latest manga...');
            return await this.getMangaList(page, {});
        } catch (error) {
            console.error('Error in getLatestManga:', error);
            return {
                manga: this.getFallbackManga(),
                total: 30,
                page,
                hasNext: true
            };
        }
    }
    
    // GET MANGA DETAIL DENGAN CHAPTERS
    async getMangaDetail(id) {
        try {
            console.log('📖 Getting manga detail:', id);
            
            // Ambil detail manga
            const mangaData = await this.fetch(`/manga/${id}?includes[]=cover_art&includes[]=author&includes[]=artist`);
            
            // Ambil chapters - PAKAI PARAMETER YANG BENAR [citation:1][citation:10]
            const chaptersData = await this.fetch(
                `/manga/${id}/feed?limit=100&translatedLanguage[]=en&order[chapter]=desc&includeFuturePublishAt=0&includeEmptyPages=0&contentRating[]=safe&contentRating[]=suggestive`
            );
            
            const coverArt = mangaData.data.relationships.find(r => r.type === 'cover_art');
            const coverUrl = coverArt?.attributes?.fileName 
                ? `https://uploads.mangadex.org/covers/${id}/${coverArt.attributes.fileName}.512.jpg`
                : 'https://via.placeholder.com/300x400/1a1a1a/ec4899?text=No+Cover';
            
            // Parse title dengan fallback
            let title = 'Untitled';
            if (mangaData.data.attributes.title) {
                title = mangaData.data.attributes.title.en || 
                       mangaData.data.attributes.title['ja-ro'] || 
                       mangaData.data.attributes.title.ja || 
                       Object.values(mangaData.data.attributes.title)[0] || 
                       'Untitled';
            }
            
            const manga = {
                id: mangaData.data.id,
                title: title,
                description: mangaData.data.attributes.description?.en || 
                           mangaData.data.attributes.description?.ja || 
                           'No description available',
                cover: coverUrl,
                status: mangaData.data.attributes.status || 'unknown',
                year: mangaData.data.attributes.year || new Date().getFullYear(),
                tags: mangaData.data.attributes.tags?.map(t => t.attributes.name.en || t.attributes.name.ja) || [],
                rating: (Math.random() * 2 + 3).toFixed(1)
            };
            
            // Parse chapters
            const chapters = chaptersData.data.map(item => ({
                id: item.id,
                title: item.attributes.title || `Chapter ${item.attributes.chapter}`,
                chapter: parseFloat(item.attributes.chapter) || 0,
                volume: item.attributes.volume,
                pages: item.attributes.pages || 0,
                published: item.attributes.publishAt || new Date().toISOString(),
                group: item.relationships.find(r => r.type === 'scanlation_group')?.attributes?.name || 'Unknown',
                lang: item.attributes.translatedLanguage || 'en'
            })).filter(ch => ch.lang === 'en'); // Filter hanya English
            
            return { manga, chapters };
            
        } catch (error) {
            console.error('Error in getMangaDetail:', error);
            return {
                manga: this.getFallbackManga(id)[0],
                chapters: this.getFallbackChapters()
            };
        }
    }
    
    // GET CHAPTER IMAGES
    async getChapterImages(chapterId) {
        try {
            console.log('🖼️ Getting chapter images:', chapterId);
            
            const data = await this.fetch(`/at-home/server/${chapterId}`);
            
            if (!data || !data.chapter || !data.chapter.data) {
                throw new Error('Invalid chapter data');
            }
            
            const images = data.chapter.data.map((filename, index) => ({
                url: `${data.baseUrl}/data/${data.chapter.hash}/${filename}`,
                dataSaverUrl: `${data.baseUrl}/data-saver/${data.chapter.hash}/${filename}`,
                page: index + 1,
                filename
            }));
            
            return images;
            
        } catch (error) {
            console.error('Error in getChapterImages:', error);
            // Return fallback images
            return Array.from({ length: 20 }, (_, i) => ({
                url: `https://via.placeholder.com/800x1200/2a2a2a/ec4899?text=Page+${i+1}`,
                page: i + 1,
                filename: `page-${i+1}.jpg`
            }));
        }
    }
    
    // SEARCH MANGA
    async searchManga(query, page = 1) {
        if (!query || query.length < 2) {
            return this.getLatestManga(page);
        }
        
        try {
            return await this.getMangaList(page, { search: query });
        } catch (error) {
            console.error('Error in searchManga:', error);
            return {
                manga: this.getFallbackManga(),
                total: 10,
                page,
                hasNext: false
            };
        }
    }
    
    // GET TRENDING (based on rating/views)
    async getTrending() {
        try {
            const data = await this.fetch('/manga?limit=10&includes[]=cover_art&order[rating]=desc&hasAvailableChapters=true&contentRating[]=safe&contentRating[]=suggestive');
            
            return await this.processMangaList(data);
        } catch (error) {
            console.error('Error in getTrending:', error);
            return this.getFallbackManga();
        }
    }
    
    // GET POPULAR (based on follows)
    async getPopular() {
        try {
            const data = await this.fetch('/manga?limit=10&includes[]=cover_art&order[followedCount]=desc&hasAvailableChapters=true&contentRating[]=safe&contentRating[]=suggestive');
            
            return await this.processMangaList(data);
        } catch (error) {
            console.error('Error in getPopular:', error);
            return this.getFallbackManga();
        }
    }
    
    // Helper: process manga list from raw API response
    async processMangaList(data) {
        if (!data || !data.data) return [];
        
        return data.data.map(item => {
            const coverArt = item.relationships.find(r => r.type === 'cover_art');
            const coverUrl = coverArt?.attributes?.fileName 
                ? `https://uploads.mangadex.org/covers/${item.id}/${coverArt.attributes.fileName}.256.jpg`
                : 'https://via.placeholder.com/300x400/1a1a1a/ec4899?text=No+Cover';
            
            let title = 'Untitled';
            if (item.attributes.title) {
                title = item.attributes.title.en || 
                       item.attributes.title['ja-ro'] || 
                       item.attributes.title.ja || 
                       Object.values(item.attributes.title)[0] || 
                       'Untitled';
            }
            
            return {
                id: item.id,
                title: title,
                cover: coverUrl,
                status: item.attributes.status || 'unknown',
                year: item.attributes.year || new Date().getFullYear(),
                tags: item.attributes.tags?.map(t => t.attributes.name.en || t.attributes.name.ja) || [],
                rating: (Math.random() * 2 + 3).toFixed(1)
            };
        });
    }
    
    // FALLBACK DATA
    getFallbackManga(count = 10) {
        const titles = [
            'One Piece', 'Naruto', 'Jujutsu Kaisen', 'Demon Slayer', 'Attack on Titan',
            'My Hero Academia', 'Chainsaw Man', 'Spy x Family', 'Blue Lock', 'Kaiju No. 8'
        ];
        
        return Array.from({ length: Math.min(count, titles.length) }, (_, i) => ({
            id: `fallback-${i}`,
            title: titles[i % titles.length],
            description: 'This is fallback data. Please check your internet connection.',
            cover: `https://via.placeholder.com/300x400/1a1a1a/ec4899?text=${titles[i % titles.length].replace(' ', '+')}`,
            status: 'ongoing',
            year: 2024,
            tags: ['Action', 'Adventure'],
            rating: (4 + Math.random()).toFixed(1)
        }));
    }
    
    getFallbackChapters(count = 20) {
        return Array.from({ length: count }, (_, i) => ({
            id: `fallback-ch-${i+1}`,
            title: `Chapter ${i+1}`,
            chapter: i+1,
            volume: 1,
            pages: 30 + Math.floor(Math.random() * 20),
            published: new Date(Date.now() - (i * 86400000)).toISOString(),
            group: 'Fallback Group',
            lang: 'en'
        }));
    }
    
    // CLEAR CACHE
    clearCache() {
        this.cache.clear();
        console.log('🧹 Cache cleared');
        if (window.State) {
            window.State.showToast('🧹 Cache cleared', 'info');
        }
    }
    
    // HEALTH CHECK
    async checkHealth() {
        try {
            const data = await this.fetch('/ping', { timeout: 5000 });
            return { status: 'ok', data };
        } catch (error) {
            console.error('Health check failed:', error);
            return { status: 'error', error: error.message };
        }
    }
}

// Initialize API
window.API = new ClaraAPI();          ...options.headers
        }
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      
      // Simpan ke cache
      if (this.cache.size >= CONFIG.cache.maxSize) {
        const oldest = this.cache.keys().next().value;
        this.cache.delete(oldest);
      }
      
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      return data;
      
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }
  
  // Get manga list with filters
  async getMangaList(page = 1, filters = {}) {
    const limit = CONFIG.ui.itemsPerPage;
    const offset = (page - 1) * limit;
    
    let url = `/manga?limit=${limit}&offset=${offset}&includes[]=cover_art&order[updatedAt]=desc`;
    
    if (filters.genre?.length) {
      url += filters.genre.map(g => `&includedTags[]=${g}`).join('');
    }
    
    if (filters.status) {
      url += `&status[]=${filters.status}`;
    }
    
    if (filters.search) {
      url += `&title=${encodeURIComponent(filters.search)}`;
    }
    
    const data = await this.fetch(url);
    
    // Process cover art
    const mangaList = await Promise.all(data.data.map(async item => {
      const coverArt = item.relationships.find(r => r.type === 'cover_art');
      let coverUrl = 'https://via.placeholder.com/300x400/1a1a1a/ec4899?text=No+Cover';
      
      if (coverArt) {
        coverUrl = `https://uploads.mangadex.org/covers/${item.id}/${coverArt.attributes?.fileName}.256.jpg`;
      }
      
      return {
        id: item.id,
        title: item.attributes.title.en || Object.values(item.attributes.title)[0] || 'Untitled',
        description: item.attributes.description?.en || 'No description available',
        cover: coverUrl,
        status: item.attributes.status || 'unknown',
        year: item.attributes.year,
        tags: item.attributes.tags?.map(t => t.attributes.name.en) || [],
        rating: (Math.random() * 2 + 3).toFixed(1) // Placeholder rating
      };
    }));
    
    return {
      manga: mangaList,
      total: data.total,
      page,
      hasNext: offset + limit < data.total
    };
  }
  
  // Get latest manga (terbaru)
  async getLatestManga(page = 1) {
    return this.getMangaList(page, { order: 'updatedAt' });
  }
  
  // Get manga detail
  async getMangaDetail(id) {
    const data = await this.fetch(`/manga/${id}?includes[]=cover_art&includes[]=author&includes[]=artist`);
    
    const coverArt = data.data.relationships.find(r => r.type === 'cover_art');
    const coverUrl = coverArt ?
      `https://uploads.mangadex.org/covers/${id}/${coverArt.attributes?.fileName}.512.jpg` :
      'https://via.placeholder.com/300x400/1a1a1a/ec4899?text=No+Cover';
    
    return {
      id: data.data.id,
      title: data.data.attributes.title.en || Object.values(data.data.attributes.title)[0],
      description: data.data.attributes.description?.en || 'No description',
      cover: coverUrl,
      status: data.data.attributes.status,
      year: data.data.attributes.year,
      tags: data.data.attributes.tags?.map(t => t.attributes.name.en) || [],
      rating: (Math.random() * 2 + 3).toFixed(1)
    };
  }
  
  // Get chapters
  async getChapters(mangaId) {
    const data = await this.fetch(
      `/manga/${mangaId}/feed?limit=100&translatedLanguage[]=en&order[chapter]=desc&includes[]=scanlation_group`
    );
    
    return data.data.map(item => ({
      id: item.id,
      title: item.attributes.title || `Chapter ${item.attributes.chapter}`,
      chapter: parseFloat(item.attributes.chapter) || 0,
      volume: item.attributes.volume,
      pages: item.attributes.pages,
      published: item.attributes.publishAt,
      group: item.relationships.find(r => r.type === 'scanlation_group')?.attributes?.name || 'Unknown'
    }));
  }
  
  // Get chapter images
  async getChapterImages(chapterId) {
    const data = await this.fetch(`/at-home/server/${chapterId}`);
    
    return data.chapter.data.map((filename, index) => ({
      url: `${data.baseUrl}/data/${data.chapter.hash}/${filename}`,
      page: index + 1,
      filename
    }));
  }
  
  // Search manga
  async searchManga(query, page = 1) {
    return this.getMangaList(page, { search: query });
  }
  
  // Get trending (based on views)
  async getTrending() {
    // Simulasi trending dengan random
    const data = await this.getMangaList(1);
    return data.manga.sort(() => Math.random() - 0.5).slice(0, 10);
  }
  
  // Get popular
  async getPopular() {
    const data = await this.getMangaList(1);
    return data.manga.sort(() => Math.random() - 0.5).slice(0, 10);
  }
  
  // Clear cache
  clearCache() {
    this.cache.clear();
    State.showToast('🧹 Cache cleared', 'info');
  }
}

window.API = new ClaraAPI();
