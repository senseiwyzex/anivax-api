import axios from 'axios';
import * as cheerio from 'cheerio';

const client = axios.create({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
  },
  timeout: 10000
});

export class Gogoanime {
  constructor() {
    this.baseUrl = 'https://gogoanime3.co';
  }

  async search(query) {
    const { data } = await client.get(`${this.baseUrl}/search.html?keyword=${encodeURIComponent(query)}`);
    const $ = cheerio.load(data);
    const results = [];

    $('.last_episodes ul.items li').each((_, el) => {
      const title = $(el).find('p.name a').attr('title') || $(el).find('p.name a').text();
      const id = $(el).find('p.name a').attr('href')?.replace('/category/', '');
      const image = $(el).find('div.img a img').attr('src');
      const releaseDate = $(el).find('p.released').text().trim();

      if (id) results.push({ id, title, image, releaseDate });
    });

    return { results };
  }

  async fetchAnimeInfo(id) {
    const { data } = await client.get(`${this.baseUrl}/category/${id}`);
    const $ = cheerio.load(data);

    const title = $('.anime_info_body_bg h1').text().trim();
    const image = $('.anime_info_body_bg img').attr('src');
    const description = $('.anime_info_body_bg p.type').eq(2).text().replace('Plot Summary: ', '').trim();
    const movie_id = $('#movie_id').val();

    const epData = await client.get(`https://ajax.gogo-load.com/ajax/load-list-episode?ep_start=0&ep_end=2000&id=${movie_id}`);
    const $ep = cheerio.load(epData.data);
    const episodes = [];

    $ep('#episode_related li').each((_, el) => {
      const epId = $ep(el).find('a').attr('href')?.trim().replace('/', '');
      const num = $ep(el).find('.name').text().replace('EP ', '').trim();
      if (epId) episodes.push({ id: epId, number: num });
    });

    return { id, title, image, description, episodes: episodes.reverse() };
  }

  async fetchEpisodeSources(episodeId) {
    const { data } = await client.get(`${this.baseUrl}/${episodeId}`);
    const $ = cheerio.load(data);
    let iframeUrl = $('iframe').attr('src');

    if (iframeUrl && iframeUrl.startsWith('//')) {
      iframeUrl = 'https:' + iframeUrl;
    }

    return { episodeId, headers: { Referer: this.baseUrl }, sources: [{ url: iframeUrl, isM3U8: false }] };
  }
}
