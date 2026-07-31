import axios from 'axios';
import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { episodeId } = req.query;
  if (!episodeId) return res.status(400).json({ error: '?episodeId= parametresi eksik.' });

  try {
    const { data } = await axios.get(`https://gogoanime3.co/${episodeId}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    const $ = cheerio.load(data);
    let iframeUrl = $('iframe').attr('src');

    if (iframeUrl && iframeUrl.startsWith('//')) {
      iframeUrl = 'https:' + iframeUrl;
    }

    return res.status(200).json({
      episodeId,
      embedUrl: iframeUrl, // <iframe src="..."> içinde doğrudan çalışacak izleme linki
    });
  } catch (err) {
    return res.status(500).json({ error: 'Video linki çekilemedi.', details: err.message });
  }
}
