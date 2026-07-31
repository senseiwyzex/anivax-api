import axios from 'axios';
import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { q } = req.query;
  if (!q) return res.status(400).json({ error: '?q= parametresi eksik.' });

  try {
    const { data } = await axios.get(`https://gogoanime3.co/search.html?keyword=${encodeURIComponent(q)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    const $ = cheerio.load(data);
    const results = [];

    $('.last_episodes ul.items li').each((_, el) => {
      const title = $(el).find('p.name a').attr('title') || $(el).find('p.name a').text();
      const id = $(el).find('p.name a').attr('href')?.replace('/category/', '');
      const image = $(el).find('div.img a img').attr('src');
      if (id) results.push({ id, title, image });
    });

    return res.status(200).json({ results });
  } catch (err) {
    return res.status(500).json({ error: 'Arama hatası.', details: err.message });
  }
}
