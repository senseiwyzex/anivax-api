import express from 'express';
import { Gogoanime } from '../lib/sdk.js';

const app = express();
const gogoanime = new Gogoanime();

// CORS Ayarları
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  next();
});

// Sağlık Kontrolü (Ana Sayfa)
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Anivax API Yerel SDK ile Yayında!' });
});

// 1. Arama Endpoint'i: /api/search?q=naruto
app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: '?q= parametresi eksik.' });

  try {
    const results = await gogoanime.search(query);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Arama sırasında bir hata oluştu.', details: err.message });
  }
});

// 2. Detay Endpoint'i: /api/info?id=naruto
app.get('/api/info', async (req, res) => {
  const id = req.query.id;
  if (!id) return res.status(400).json({ error: '?id= parametresi eksik.' });

  try {
    const info = await gogoanime.fetchAnimeInfo(id);
    res.json(info);
  } catch (err) {
    res.status(500).json({ error: 'Detay çekilirken hata oluştu.', details: err.message });
  }
});

// 3. İzleme Linki Endpoint'i: /api/watch?episodeId=naruto-episode-1
app.get('/api/watch', async (req, res) => {
  const episodeId = req.query.episodeId;
  if (!episodeId) return res.status(400).json({ error: '?episodeId= parametresi eksik.' });

  try {
    const sources = await gogoanime.fetchEpisodeSources(episodeId);
    res.json(sources);
  } catch (err) {
    res.status(500).json({ error: 'Kaynak çekilirken hata oluştu.', details: err.message });
  }
});

export default app;
