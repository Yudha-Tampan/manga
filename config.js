// CLARA MANGA CONFIG - V1
const CONFIG = {
    api: {
        baseUrl: 'https://api.mangadex.org',
        timeout: 10000,
        retries: 2
    },
    
    cache: {
        ttl: 10 * 60 * 1000, // 10 menit - biar cepet
        maxSize: 200
    },
    
    ui: {
        itemsPerPage: 30,
        theme: 'dark'
    },
    
    version: '1.0.0'
};

window.CONFIG = CONFIG;
