// CLARA API - MANGA DEX INTEGRATION

class ClaraAPI {
  constructor() {
    this.baseUrl = CONFIG.api.baseUrl;
    this.cache = new Map();
    this.requests = 0;
    this.lastRequest = 0;
  }
  
  async fetch(endpoint, options = {}) {
    // Rate limiting
    const now = Date.now();
    if (now - this.lastRequest < 200) {
      await new Promise(resolve => setTimeout(resolve, 200 - (now - this.lastRequest)));
    }
    
    // Cache check
    const cacheKey = `${endpoint}_${JSON.stringify(options)}`;
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < CONFIG.cache.ttl) {
        return cached.data;
      }
      this.cache.delete(cacheKey);
    }
    
    try {
      this.lastRequest = Date.now();
      this.requests++;
      
      const url = `${this.baseUrl}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        headers: {
          'User-Agent': 'ClaraManga/3.0',
          ...options.headers
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