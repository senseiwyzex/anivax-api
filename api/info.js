import axios from 'axios';
import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: '?id= parametresi eksik.' });

  try {
    const { data } = await axios.get(`https://gogoanime3.co/category/${id}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    const $ = cheerio.load(data);
    const movie_id = $('#movie_id').val();

    const epReq = await axios.get(`https://ajax.gogo-load.com/ajax/load-list-episode?ep_start=0&ep_end=2000&id=${movie_id}`);
    const $ep = cheerio.load(epReq.data);

    const episodes = [];
    $ep('#episode_related li').each((_, el) => {
      const episodeId = $ep(el).find('a').attr('href')?.trim().replace('/', '');
      const number = $ep(el).find('.name').text().replace('EP ', '').trim();
      if (episodeId) episodes.push({ episodeId, number });
    });

    return res.status(200).json({ id, episodes: episodes.reverse() });
  } catch (err) {
    return res.status(500).json({ error: 'Bölümler çekilemedi.', details: err.message });
  }
}
