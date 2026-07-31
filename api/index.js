import express from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';

const app = express();

// Senin tespit ettiğin güncel ve çalışan adres!
const BASE_URL = 'https://anineko.to';

// Bot ve 451 korumalarını atlatmak için Vercel sunucusunu "gerçek bir Chrome tarayıcı" gibi gösteriyoruz
const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
    'Referer': BASE_URL
  },
  timeout: 15000
});

// HTML'nin rahatça veri çekebilmesi için CORS izni
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  next();
});

// 1. ANİME ARAMA (anineko.to/search.html sayfasını kazır)
app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: '?q= parametresi eksik.' });

  try {
    const { data } = await client.get(`/search.html?keyword=${encodeURIComponent(query)}`);
    const $ = cheerio.load(data);
    const results = [];

    // anineko.to'nun arama sonuçları HTML yapısı
    $('.last_episodes ul.items li').each((i, el) => {
      const title = $(el).find('p.name a').attr('title') || $(el).find('p.name a').text();
      const id = $(el).find('p.name a').attr('href')?.replace('/category/', '');
      const image = $(el).find('div.img a img').attr('src');
      const released = $(el).find('p.released').text().trim();

      if (id) results.push({ id, title, image, released });
    });

    res.json({ results });
  } catch (err) {
    res.status(500).json({ error: 'Arama hatası (anineko engelledi veya ulaşılamıyor).', details: err.message });
  }
});

// 2. ANİME DETAY VE BÖLÜM LİSTESİ (anineko.to/category/id sayfasını kazır)
app.get('/api/info', async (req, res) => {
  const id = req.query.id;
  if (!id) return res.status(400).json({ error: '?id= parametresi eksik.' });

  try {
    // Önce anime ana sayfasına giriyoruz
    const { data } = await client.get(`/category/${id}`);
    const $ = cheerio.load(data);

    const title = $('.anime_info_body_bg h1').text().trim();
    const image = $('.anime_info_body_bg img').attr('src');
    const movie_id = $('#movie_id').val();
    const alias = $('#alias_anime').val();
    
    // Anineko, bölümleri AJAX ile gizli bir URL'den yükler (SDK'nin yaptığı hile de budur)
    const ajaxUrl = `https://ajax.gogo-load.com/ajax/load-list-episode?ep_start=0&ep_end=9999&id=${movie_id}&default_ep=0&alias=${alias}`;
    const epData = await axios.get(ajaxUrl, { headers: client.defaults.headers });
    const $ep = cheerio.load(epData.data);
    
    const episodes = [];
    $ep('li').each((i, el) => {
      const epId = $(el).find('a').attr('href')?.trim().replace('/', '');
      const number = $(el).find('.name').text().replace('EP', '').trim();
      if (epId) episodes.push({ id: epId, number });
    });

    // İlk bölümden son bölüme doğru sıralayıp gönderiyoruz
    res.json({ id, title, image, episodes: episodes.reverse() });
  } catch (err) {
    res.status(500).json({ error: 'Bölümler çekilemedi.', details: err.message });
  }
});

// 3. İZLEME LİNKİNİ ÇEKME (anineko.to/bolum-id sayfasındaki Player Iframe'i alır)
app.get('/api/watch', async (req, res) => {
  const episodeId = req.query.episodeId;
  if (!episodeId) return res.status(400).json({ error: '?episodeId= parametresi eksik.' });

  try {
    const { data } = await client.get(`/${episodeId}`);
    const $ = cheerio.load(data);
    
    // HTML'den iframe etiketini buluyoruz
    let iframeUrl = $('div.play-video iframe').attr('src');
    if (!iframeUrl) iframeUrl = $('iframe').attr('src');
    
    if (iframeUrl && iframeUrl.startsWith('//')) {
      iframeUrl = 'https:' + iframeUrl;
    }

    res.json({ episodeId, streamUrl: iframeUrl });
  } catch (err) {
    res.status(500).json({ error: 'Video adresi çekilemedi.', details: err.message });
  }
});

export default app;
