(() => {
  'use strict';
  function parse(value) {
    let url;
    try { url = new URL(value); } catch { return null; }
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    const host = url.hostname.toLowerCase();
    if (['youtube.com','www.youtube.com','m.youtube.com','youtube-nocookie.com','www.youtube-nocookie.com','youtu.be','www.youtu.be'].includes(host)) {
      const parts = url.pathname.split('/').filter(Boolean);
      const id = host.endsWith('youtu.be') ? parts[0] : url.searchParams.get('v') || (['embed','shorts','live'].includes(parts[0]) ? parts[1] : '');
      if (!/^[\w-]{11}$/.test(id || '')) return null;
      const src = new URL(`https://www.youtube-nocookie.com/embed/${id}`);
      src.search = new URLSearchParams({autoplay:'0',playsinline:'1',loop:'1',playlist:id,rel:'0'}).toString();
      return {tipo:'embed',provider:'youtube',src:src.href,url:url.href};
    }
    if (['vimeo.com','www.vimeo.com','player.vimeo.com'].includes(host)) {
      const parts = url.pathname.split('/').filter(Boolean);
      const index = parts[0] === 'video' ? 1 : 0;
      const id = parts[index];
      if (!/^\d+$/.test(id || '')) return null;
      const src = new URL(`https://player.vimeo.com/video/${id}`);
      const hash = url.searchParams.get('h') || parts[index+1];
      if (hash) {
        if (!/^[a-zA-Z0-9]+$/.test(hash)) return null;
        src.searchParams.set('h',hash);
      }
      src.searchParams.set('autoplay','0');
      src.searchParams.set('loop','1');
      src.searchParams.set('dnt','1');
      return {tipo:'embed',provider:'vimeo',src:src.href,url:url.href};
    }
    if (/\.mp4$/i.test(url.pathname)) return {tipo:'video',src:url.href,url:url.href};
    return null;
  }
  function ratio(value) {
    const match = /^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)$/.exec(value || '16:9');
    const result = match ? Number(match[1])/Number(match[2]) : 16/9;
    return Number.isFinite(result) && result >= .2 && result <= 5 ? result : 16/9;
  }
  function playURL(media) {
    const url = new URL(media.src);
    url.searchParams.set('autoplay','1');
    return url.href;
  }
  window.PortfolioVideo = {parse,ratio,playURL};
  for (const scene of window.PORTFOLIO.scene) {
    const config = window.CONFIG_VIDEO?.[scene.id];
    if (!config?.url?.trim()) continue;
    const media = parse(config.url.trim());
    if (!media) {
      console.warn(`Collegamento video non valido per ${scene.titolo}: uso gli estratti locali.`);
      continue;
    }
    scene.media = [{...scene.media[0],...media,durata:null,rapporto:ratio(config.proporzioni)}];
  }
})();
