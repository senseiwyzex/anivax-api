import express from 'express';
import { ANIME } from 'anime-sdk';

const app = express();

// Gogoanime sağlayıcısını kütüphaneden başlatıyoruz
const gogoanime = new ANIME.Gogoanime();

// CORS ve Header Ayarları (HTML sitenin rahatça bağlanabilmesi için)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Durum Kontrolü
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Anime API Yayında!' });
});

// 1. Anime Arama: /api/search?q=naruto
app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: 'Lütfen ?q= parametresi girin.' });

  try {
    const results = await gogoanime.search(query);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Arama yapılırken hata oluştu.', details: err.message });
  }
});

// 2. Anime Detay & Bölüm Listesi: /api/info?id=naruto
app.get('/api/info', async (req, res) => {
  const id = req.query.id;
  if (!id) return res.status(400).json({ error: 'Lütfen ?id= parametresi girin.' });

  try {
    const info = await gogoanime.fetchAnimeInfo(id);
    res.json(info);
  } catch (err) {
    res.status(500).json({ error: 'Detaylar alınırken hata oluştu.', details: err.message });
  }
});

// 3. Bölüm Video Linkleri: /api/watch?episodeId=naruto-episode-1
app.get('/api/watch', async (req, res) => {
  const episodeId = req.query.episodeId;
  if (!episodeId) return res.status(400).json({ error: 'Lütfen ?episodeId= parametresi girin.' });

  try {
    const sources = await gogoanime.fetchEpisodeSources(episodeId);
    res.json(sources);
  } catch (err) {
    res.status(500).json({ error: 'Video kaynakları çekilemedi.', details: err.message });
  }
});

export default app;
    
