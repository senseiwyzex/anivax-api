import axios from 'axios';
import * as cheerio from 'cheerio';

const BASE_URL = 'https://anineko.to';

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Referer': BASE_URL
  },
  timeout: 10000
});

export class Gogoanime {
  async search(query) {
    try {
      const { data } = await client.get(`/search.html?keyword=${encodeURIComponent(query)}`);
      const $ = cheerio.load(data);
      const results = [];

      $('.last_episodes ul.items li').each((_, el) => {
        const title = $(el).find('p.name a').attr('title') || $(el).find('p.name a').text().trim();
        const id = $(el).find('p.name a').attr('href')?.replace('/category/', '').trim();
        const image = $(el).find('div.img a img').attr('src');
        const releaseDate = $(el).find('p.released').text().trim();

        if (id) results.push({ id, title, image, releaseDate });
      });

      return { results };
    } catch (err) {
      return { results: [], error: err.message };
    }
  }

  async fetchAnimeInfo(id) {
    try {
      const { data } = await client.get(`/category/${id}`);
      const $ = cheerio.load(data);

      const title = $('.anime_info_body_bg h1').text().trim();
      const image = $('.anime_info_body_bg img').attr('src');
      const description = $('.anime_info_body_bg p.type').eq(2).text().replace('Plot Summary: ', '').trim();
      const movie_id = $('#movie_id').val();

      // Anineko ajax yüklemesi
      const epData = await client.get(`https://ajax.gogo-load.com/ajax/load-list-episode?ep_start=0&ep_end=2000&id=${movie_id}`);
      const $ep = cheerio.load(epData.data);
      const episodes = [];

      $ep('#episode_related li').each((_, el) => {
        const epId = $ep(el).find('a').attr('href')?.trim().replace('/', '');
        const num = $ep(el).find('.name').text().replace('EP ', '').trim();
        if (epId) episodes.push({ id: epId, number: num });
      });

      return { id, title, image, description, episodes: episodes.reverse() };
    } catch (err) {
      return { error: err.message };
    }
  }

  async fetchEpisodeSources(episodeId) {
    try {
      const { data } = await client.get(`/${episodeId}`);
      const $ = cheerio.load(data);
      let iframeUrl = $('iframe').attr('src');

      if (iframeUrl && iframeUrl.startsWith('//')) {
        iframeUrl = 'https:' + iframeUrl;
      }

      return { episodeId, headers: { Referer: BASE_URL }, sources: [{ url: iframeUrl, isM3U8: false }] };
    } catch (err) {
      return { error: err.message };
    }
  }
}
