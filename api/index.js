import express from 'express';
import axios from 'axios';

const app = express();

// User-Agent ile Cloudflare / Bot engellerini aşıyoruz
const client = axios.create({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*'
  },
  timeout: 10000
});

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
    // Güncel açık kaynak Consumet/Anify anime arama endpoint'i
    const { data } = await client.get(`https://api.consumet.org/anime/gogoanime/${encodeURIComponent(query)}`);
    res.json(data);
  } catch (err) {
    // Yedek sağlayıcı (Zoro / HiAnime)
    try {
      const backup = await client.get(`https://api.consumet.org/anime/zoro/${encodeURIComponent(query)}`);
      res.json(backup.data);
    } catch (backupErr) {
      res.status(500).json({ error: 'Arama yapılırken hata oluştu.', details: err.message });
    }
  }
});

// 2. Anime Detay & Bölüm Listesi: /api/info?id=naruto
app.get('/api/info', async (req, res) => {
  const id = req.query.id;
  if (!id) return res.status(400).json({ error: 'Lütfen ?id= parametresi girin.' });

  try {
    const { data } = await client.get(`https://api.consumet.org/anime/gogoanime/info/${encodeURIComponent(id)}`);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Detaylar alınırken hata oluştu.', details: err.message });
  }
});

// 3. Bölüm Video Linkleri: /api/watch?episodeId=naruto-episode-1
app.get('/api/watch', async (req, res) => {
  const episodeId = req.query.episodeId;
  if (!episodeId) return res.status(400).json({ error: 'Lütfen ?episodeId= parametresi girin.' });

  try {
    const { data } = await client.get(`https://api.consumet.org/anime/gogoanime/watch/${encodeURIComponent(episodeId)}`);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Video kaynakları çekilemedi.', details: err.message });
  }
});

export default app;
