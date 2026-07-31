import express from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';

const app = express();
const BASE_URL = 'https://gogoanime3.co';

// CORS Ayarları
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  next();
});

// Kök Dizin Kontrolü
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Anivax Anime API Yayında!' });
});

// 1. Anime Arama: /api/search?q=naruto
app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: 'Lütfen ?q= parametresi girin.' });

  try {
    const { data } = await axios.get(`${BASE_URL}/search.html?keyword=${encodeURIComponent(query)}`);
    const $ = cheerio.load(data);
    const results = [];

    $('.last_episodes ul.items li').each((_, el) => {
      const title = $(el).find('p.name a').attr('title') || $(el).find('p.name a').text();
      const id = $(el).find('p.name a').attr('href')?.replace('/category/', '');
      const image = $(el).find('div.img a img').attr('src');
      const releaseDate = $(el).find('p.released').text().trim();

      if (id) {
        results.push({ id, title, image, releaseDate });
      }
    });

    res.json({ results });
  } catch (err) {
    res.status(500).json({ error: 'Arama yapılırken hata oluştu.', details: err.message });
  }
});

// 2. Anime Detay & Bölüm Listesi: /api/info?id=naruto
app.get('/api/info', async (req, res) => {
  const id = req.query.id;
  if (!id) return res.status(400).json({ error: 'Lütfen ?id= parametresi girin.' });

  try {
    const { data } = await axios.get(`${BASE_URL}/category/${id}`);
    const $ = cheerio.load(data);

    const title = $('.anime_info_body_bg h1').text().trim();
    const image = $('.anime_info_body_bg img').attr('src');
    const description = $('.anime_info_body_bg p.type').eq(2).text().replace('Plot Summary: ', '').trim();
    const movie_id = $('#movie_id').val();

    // Bölümleri çekme
    const epListUrl = `https://ajax.gogo-load.com/ajax/load-list-episode?ep_start=0&ep_end=2000&id=${movie_id}`;
    const epData = await axios.get(epListUrl);
    const $ep = cheerio.load(epData.data);
    const episodes = [];

    $ep('#episode_related li').each((_, el) => {
      const epId = $ep(el).find('a').attr('href')?.trim().replace('/', '');
      const num = $ep(el).find('.name').text().replace('EP ', '').trim();
      if (epId) episodes.push({ id: epId, number: num });
    });

    res.json({ id, title, image, description, episodes: episodes.reverse() });
  } catch (err) {
    res.status(500).json({ error: 'Detaylar alınırken hata oluştu.', details: err.message });
  }
});

// 3. Bölüm Video Embed Linki: /api/watch?episodeId=naruto-episode-1
app.get('/api/watch', async (req, res) => {
  const episodeId = req.query.episodeId;
  if (!episodeId) return res.status(400).json({ error: 'Lütfen ?episodeId= parametresi girin.' });

  try {
    const { data } = await axios.get(`${BASE_URL}/${episodeId}`);
    const $ = cheerio.load(data);
    
    let iframeUrl = $('iframe').attr('src');
    if (iframeUrl && iframeUrl.startsWith('//')) {
      iframeUrl = 'https:' + iframeUrl;
    }

    res.json({ episodeId, streamUrl: iframeUrl || null });
  } catch (err) {
    res.status(500).json({ error: 'Video adresi çekilemedi.', details: err.message });
  }
});

export default app;
