export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { episodeId } = req.query;
  if (!episodeId) return res.status(400).json({ error: '?episodeId= parametresi eksik.' });

  try {
    const response = await fetch(`https://api.consumet.org/anime/gogoanime/watch/${encodeURIComponent(episodeId)}`);
    if (!response.ok) throw new Error(`HTTP Hata: ${response.status}`);
    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'İzleme servisine ulaşılamadı.', details: err.message });
  }
}
