import express from 'express';

const app = express();

// CORS Ayarları
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  next();
});

// Dynamic Import ile SDK yükleme (Cold-start çökmesini önler)
async function getSDK() {
  const sdk = await import('anime-sdk');
  return sdk;
}

// Ana Sayfa / Health Check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Anivax Anime SDK API Yayında!' });
});

// 1. ANİME ARAMA: /api/search?q=naruto
app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: '?q= parametresi eksik.' });

  try {
    const sdk = await getSDK();
    // Dokümantasyondaki Provider kullanımı (Gogoanime / HiAnime)
    const provider = new (sdk.ANIME?.Gogoanime || sdk.Gogoanime)();
    const results = await provider.search(query);
    return res.json(results);
  } catch (err) {
    try {
      // Yedek Sağlayıcı Denemesi
      const sdk = await getSDK();
      const backupProvider = new (sdk.ANIME?.HiAnime || sdk.HiAnime)();
      const results = await backupProvider.search(query);
      return res.json(results);
    } catch (backupErr) {
      return res.status(500).json({ 
        error: 'Arama yapılırken hata oluştu.', 
        details: err.message 
      });
    }
  }
});

// 2. ANİME DETAY & BÖLÜM LİSTESİ: /api/info?id=naruto
app.get('/api/info', async (req, res) => {
  const id = req.query.id;
  if (!id) return res.status(400).json({ error: '?id= parametresi eksik.' });

  try {
    const sdk = await getSDK();
    const provider = new (sdk.ANIME?.Gogoanime || sdk.Gogoanime)();
    const info = await provider.fetchAnimeInfo(id);
    return res.json(info);
  } catch (err) {
    return res.status(500).json({ 
      error: 'Detaylar alınırken hata oluştu.', 
      details: err.message 
    });
  }
});

// 3. BÖLÜM VİDEO LİNKLERİ: /api/watch?episodeId=naruto-episode-1
app.get('/api/watch', async (req, res) => {
  const episodeId = req.query.episodeId;
  if (!episodeId) return res.status(400).json({ error: '?episodeId= parametresi eksik.' });

  try {
    const sdk = await getSDK();
    const provider = new (sdk.ANIME?.Gogoanime || sdk.Gogoanime)();
    const sources = await provider.fetchEpisodeSources(episodeId);
    return res.json(sources);
  } catch (err) {
    return res.status(500).json({ 
      error: 'Video kaynakları alınamadı.', 
      details: err.message 
    });
  }
});

export default app;
