(async function () {
  const html = document.documentElement;
  const L = html.lang === 'en' ? 'en' : 'ko';
  const page = html.dataset.page;
  const root = html.dataset.root || './';
  const get = (p) => fetch(root + 'data/' + p).then((r) => r.json());
  const t = (o) => (o == null ? '' : typeof o === 'string' ? o : (o[L] || o.ko || o.en || ''));
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const i18n = await get('i18n.json');
  const base = L === 'en' ? root + 'en/' : root;
  const other = L === 'en' ? root : root + 'en/';
  const file = { home: '', topics: 'topics.html', library: 'library.html', map: 'map.html' };
  const navKey = page === 'topic' ? 'topics' : page;
  const selfFile = page === 'topic' ? `topic-${html.dataset.topic}.html` : file[page];

  document.querySelector('header').innerHTML = `<div class="wrap bar">
    <a class="brand" href="${base}">${esc(t(i18n.site))}</a>
    <nav>${['home', 'topics', 'library', 'map']
      .map((k) => `<a href="${base}${file[k]}" class="${k === navKey ? 'on' : ''}">${esc(t(i18n.nav[k]))}</a>`).join('')}
      <a class="lang" href="${other}${selfFile}">${esc(t(i18n.lang_switch))}</a></nav></div>`;
  document.querySelector('footer').innerHTML = `<div class="wrap">${esc(t(i18n.disclaimer))}</div>`;
  const main = document.querySelector('main .wrap');

  const itemHTML = (it) => {
    const title = it.url ? `<a href="${esc(it.url)}" target="_blank" rel="noopener">${esc(t(it.title))}</a>` : esc(t(it.title));
    const meta = [it.authors, it.year, it.source].filter(Boolean).map(esc).join(' · ');
    const tags = `<span class="tag type">${esc(t(i18n.type[it.type]))}</span>` +
      (it.evidence ? `<span class="tag ${esc(it.evidence)}">${esc(t(i18n.evidence[it.evidence]))}</span>` : '') +
      (it.aspects || []).map((a) => `<span class="tag aspect ${esc(a)}">${esc(t(i18n.aspect[a]))}</span>`).join('');
    return `<li>${tags}${title}${meta ? `<div class="meta">${meta}</div>` : ''}${it.note ? `<div class="note">${esc(t(it.note))}</div>` : ''}</li>`;
  };
  const listHTML = (items) => items.length ? `<ul class="items">${items.map(itemHTML).join('')}</ul>` : `<p class="empty">${esc(t(i18n.empty))}</p>`;
  const groupHTML = (g, extra = '') => `<section class="group" id="${esc(g.id)}">
    <h2>${esc(t(g.name))}</h2><p class="sum">${esc(t(g.summary))}</p>${extra}${listHTML(g.items)}</section>`;
  const legendHTML = () => `<div class="legend">${Object.keys(i18n.evidence).map((k) =>
    `<span><span class="tag ${k}">${esc(t(i18n.evidence[k]))}</span></span><span>${esc(t(i18n.evidence_desc[k]))}</span>`).join('')}</div>`;
  const cardsHTML = (topics) => topics.map((tp) =>
    `<a class="card" href="${base}topic-${esc(tp.id)}.html"><b>${esc(t(tp.name))}</b><span>${esc(t(tp.summary))}</span></a>`).join('');

  if (page === 'home') {
    const topics = await get('topics.json');
    main.innerHTML = `<h1>${esc(t(i18n.site))}</h1><p class="lead">${esc(t(i18n.tagline))}</p>
      <p>${esc(t(i18n.home_intro))}</p>
      <div class="cards">${cardsHTML(topics)}
        <a class="card" href="${base}library.html"><b>${esc(t(i18n.nav.library))}</b><span>${esc(t(i18n.library_intro))}</span></a>
        <a class="card" href="${base}map.html"><b>${esc(t(i18n.nav.map))}</b></a></div>
      <h2>${esc(t(i18n.evidence_title))}</h2>${legendHTML()}`;
  }

  if (page === 'topics') {
    const topics = await get('topics.json');
    main.innerHTML = `<h1>${esc(t(i18n.nav.topics))}</h1><p class="lead">${esc(t(i18n.topics_intro))}</p>
      <div class="cards">${cardsHTML(topics)}</div>`;
  }

  if (page === 'topic') {
    const topics = await get('topics.json');
    const meta = topics.find((x) => x.id === html.dataset.topic);
    const tp = await get(meta.file);
    document.title = `${t(tp.name)} · ${t(i18n.site)}`;
    main.innerHTML = `<h1>${esc(t(tp.name))}</h1><p class="lead">${esc(t(tp.summary))}</p>` +
      tp.layers.map((ly) => `<section class="group layer" id="${esc(ly.id)}"><h2>${esc(t(ly.name))}</h2>
        <p class="sum">${esc(t(ly.intro))}</p>${listHTML(ly.items)}
        ${ly.view ? `<div class="view"><b>${esc(t(i18n.view_title))}</b><p>${esc(t(ly.view))}</p></div>` : ''}</section>`).join('') +
      `<section class="group"><h2>${esc(t(i18n.evidence_title))}</h2>${legendHTML()}</section>`;
  }

  if (page === 'library') {
    const [causes, tr] = await Promise.all([get('causes.json'), get('treatments.json')]);
    const byId = Object.fromEntries(causes.map((c) => [c.id, c]));
    main.innerHTML = `<h1>${esc(t(i18n.nav.library))}</h1><p class="lead">${esc(t(i18n.library_intro))}</p>
      <h2 class="part">${esc(t(i18n.lib_causes))}</h2>` + causes.map((g) => groupHTML(g)).join('') +
      `<h2 class="part">${esc(t(i18n.lib_treatments))}</h2>` +
      tr.map((g) => groupHTML(g, g.causes.length
        ? `<p class="links">${esc(t(i18n.related_causes))}: ${g.causes.filter((id) => byId[id])
            .map((id) => `<a href="#${esc(id)}">${esc(t(byId[id].name))}</a>`).join(', ')}</p>` : '')).join('');
  }

  if (page === 'map') {
    const centers = await get('centers.json');
    main.innerHTML = `<h1>${esc(t(i18n.nav.map))}</h1><p class="lead">${esc(t(i18n.tagline))}</p><div id="map"></div>` +
      (centers.length ? `<ul class="items" style="margin-top:20px">${centers.map((c) =>
        `<li>${c.url ? `<a href="${esc(c.url)}" target="_blank" rel="noopener">${esc(t(c.name))}</a>` : esc(t(c.name))}` +
        `<div class="meta">${esc([c.city, c.country].join(', '))}${c.note ? ' · ' + esc(t(c.note)) : ''}</div></li>`).join('')}</ul>`
        : `<p class="empty">${esc(t(i18n.map_empty))}</p>`);
    if (!window.L) return;
    const map = window.L.map('map').setView([30, 60], 2);
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
    centers.forEach((c) => window.L.marker([c.lat, c.lng]).addTo(map).bindPopup(
      `<b>${esc(t(c.name))}</b><br>${esc([c.city, c.country].filter(Boolean).join(', '))}${c.note ? '<br>' + esc(t(c.note)) : ''}` +
      (c.url ? `<br><a href="${esc(c.url)}" target="_blank" rel="noopener">${esc(c.url)}</a>` : '')));
  }
})();
