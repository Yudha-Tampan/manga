// CLARA MANGA CONFIG - PROFESSIONAL

const CONFIG = {
    api: {
        baseUrl: 'https://api.mangadex.org',
        timeout: 10000,
        retries: 3
    },
    
    cache: {
        ttl: 5 * 60 * 1000, // 5 minutes
        maxSize: 200
    },
    
    ui: {
        itemsPerPage: 30,
        infiniteScroll: true,
        lazyLoad: true,
        theme: 'dark'
    },
    
    features: {
        bookmark: true,
        history: true,
        download: true,
        keyboardNav: true,
        swipeNav: true
    },
    
    version: '3.0.0'
};

window.CONFIG = CONFIG;