import express from 'express';
import { ANIME } from '@consumet/extensions';

const app = express();

// SDK Sağlayıcıları
const gogoanime = new ANIME.Gogoanime();
const zoro = new ANIME.Zoro();

// CORS Ayarları
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  next();
});

// Sağlık Kontrolü
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Anivax Anime API Yayında!' });
});

// 1. Anime Arama: /api/search?q=naruto
app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: 'Lütfen ?q= parametresi girin.' });

  try {
    const results = await gogoanime.search(query);
    return res.json(results);
  } catch (err) {
    try {
      // Gogoanime patlarsa Zoro SDK'sı devreye girer
      const zoroResults = await zoro.search(query);
      return res.json(zoroResults);
    } catch (zErr) {
      return res.status(500).json({ error: 'Arama hatası.', details: err.message });
    }
  }
});

// 2. Anime Detay & Bölümler: /api/info?id=naruto
app.get('/api/info', async (req, res) => {
  const id = req.query.id;
  if (!id) return res.status(400).json({ error: 'Lütfen ?id= parametresi girin.' });

  try {
    const info = await gogoanime.fetchAnimeInfo(id);
    return res.json(info);
  } catch (err) {
    try {
      const zoroInfo = await zoro.fetchAnimeInfo(id);
      return res.json(zoroInfo);
    } catch (zErr) {
      return res.status(500).json({ error: 'Detay hatası.', details: err.message });
    }
  }
});

// 3. Bölüm Video Linkleri: /api/watch?episodeId=naruto-episode-1
app.get('/api/watch', async (req, res) => {
  const episodeId = req.query.episodeId;
  if (!episodeId) return res.status(400).json({ error: 'Lütfen ?episodeId= parametresi girin.' });

  try {
    const sources = await gogoanime.fetchEpisodeSources(episodeId);
    return res.json(sources);
  } catch (err) {
    try {
      const zoroSources = await zoro.fetchEpisodeSources(episodeId);
      return res.json(zoroSources);
    } catch (zErr) {
      return res.status(500).json({ error: 'Video kaynağı hatası.', details: err.message });
    }
  }
});

export default app;
