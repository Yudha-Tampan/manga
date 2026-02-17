// config.js - CLARA Manga Configuration
const CONFIG = {
    // API Sources
    sources: [
        {
            name: 'MangaDex',
            baseUrl: 'https://api.mangadex.org',
            type: 'api',
            enabled: true
        },
        {
            name: 'MangaKakalot',
            baseUrl: 'https://mangakakalot.com',
            type: 'scrape',
            enabled: false
        }
    ],
    
    activeSource: 0,
    
    // Cache settings
    cache: {
        ttl: 3600000,
        maxSize: 100,
        enabled: true
    },
    
    // Rate limiting
    rateLimit: {
        requests: 2,
        perSecond: 1,
        enabled: true
    },
    
    // UI Settings
    ui: {
        theme: 'dark',
        accentColor: '#ec4899',
        itemsPerPage: 30,
        infiniteScroll: true,
        lazyLoadImages: true,
        readingMode: 'vertical'
    },
    
    // Features
    features: {
        bookmark: true,
        history: true,
        download: true,
        fullscreen: true,
        keyboardNav: true,
        swipeNav: true,
        share: true
    },
    
    debug: false,
    version: '1.0.0'
};

window.CONFIG = CONFIG;