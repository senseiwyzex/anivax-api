export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { q } = req.query;
  if (!q) return res.status(400).json({ error: '?q= parametresi eksik.' });

  try {
    const response = await fetch(`https://api.consumet.org/anime/gogoanime/${encodeURIComponent(q)}`);
    if (!response.ok) throw new Error(`HTTP Hata: ${response.status}`);
    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Arama servisine ulaşılamadı.', details: err.message });
  }
}
