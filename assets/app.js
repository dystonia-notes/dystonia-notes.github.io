(async function () {
  const html = document.documentElement;
  const L = html.lang === 'en' ? 'en' : 'ko';
  const page = html.dataset.page;
  const root = html.dataset.root || './';
  const get = (p) => fetch(root + 'data/' + p).then((r) => r.json());
  const t = (o) => (o && (o[L] || o.ko || o.en)) || '';
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const i18n = await get('i18n.json');
  const base = L === 'en' ? root + 'en/' : root;
  const other = L === 'en' ? root : root + 'en/';
  const file = { home: '', causes: 'causes.html', treatments: 'treatments.html', map: 'map.html' };

  document.querySelector('header').innerHTML = `<div class="wrap bar">
    <a class="brand" href="${base}">${esc(t(i18n.site))}</a>
    <nav>${['home', 'causes', 'treatments', 'map']
      .map((k) => `<a href="${base}${file[k]}" class="${k === page ? 'on' : ''}">${esc(t(i18n.nav[k]))}</a>`).join('')}
      <a class="lang" href="${other}${file[page]}">${esc(t(i18n.lang_switch))}</a></nav></div>`;
  document.querySelector('footer').innerHTML = `<div class="wrap">${esc(t(i18n.disclaimer))}</div>`;
  const main = document.querySelector('main .wrap');

  const itemHTML = (it) => {
    const title = it.url ? `<a href="${esc(it.url)}" target="_blank" rel="noopener">${esc(it.title)}</a>` : esc(it.title);
    const meta = [it.authors, it.year, it.source].filter(Boolean).map(esc).join(' · ');
    return `<li><span class="tag type">${esc(t(i18n.type[it.type]))}</span>` +
      (it.evidence ? `<span class="tag ${esc(it.evidence)}">${esc(t(i18n.evidence[it.evidence]))}</span>` : '') +
      `${title}${meta ? `<div class="meta">${meta}</div>` : ''}${it.note ? `<div class="meta">${esc(t(it.note))}</div>` : ''}</li>`;
  };
  const groupHTML = (g, extra = '') => `<section class="group" id="${esc(g.id)}">
    <h2>${esc(t(g.name))}</h2><p class="sum">${esc(t(g.summary))}</p>${extra}
    ${g.items.length ? `<ul class="items">${g.items.map(itemHTML).join('')}</ul>` : `<p class="empty">${esc(t(i18n.empty))}</p>`}</section>`;

  if (page === 'home') {
    const ev = Object.keys(i18n.evidence).map((k) =>
      `<span><span class="tag ${k}">${esc(t(i18n.evidence[k]))}</span></span><span>${esc(t(i18n.evidence_desc[k]))}</span>`).join('');
    main.innerHTML = `<h1>${esc(t(i18n.site))}</h1><p class="lead">${esc(t(i18n.tagline))}</p>
      <p>${esc(t(i18n.home_intro))}</p>
      <div class="cards">${['causes', 'treatments', 'map'].map((k) =>
        `<a class="card" href="${base}${file[k]}"><b>${esc(t(i18n.nav[k]))}</b></a>`).join('')}</div>
      <h2>${esc(t(i18n.evidence_title))}</h2><div class="legend">${ev}</div>`;
  }

  if (page === 'causes') {
    const causes = await get('causes.json');
    main.innerHTML = `<h1>${esc(t(i18n.nav.causes))}</h1><p class="lead">${esc(t(i18n.tagline))}</p>` + causes.map((g) => groupHTML(g)).join('');
  }

  if (page === 'treatments') {
    const [tr, causes] = await Promise.all([get('treatments.json'), get('causes.json')]);
    const byId = Object.fromEntries(causes.map((c) => [c.id, c]));
    main.innerHTML = `<h1>${esc(t(i18n.nav.treatments))}</h1><p class="lead">${esc(t(i18n.tagline))}</p>` +
      tr.map((g) => groupHTML(g, g.causes.length
        ? `<p class="links">${esc(t(i18n.related_causes))}: ${g.causes.filter((id) => byId[id])
            .map((id) => `<a href="${base}causes.html#${esc(id)}">${esc(t(byId[id].name))}</a>`).join(', ')}</p>` : '')).join('');
  }

  if (page === 'map') {
    const centers = await get('centers.json');
    main.innerHTML = `<h1>${esc(t(i18n.nav.map))}</h1><p class="lead">${esc(t(i18n.tagline))}</p><div id="map"></div>` +
      (centers.length ? `<ul class="items" style="margin-top:20px">${centers.map((c) =>
        `<li>${c.url ? `<a href="${esc(c.url)}" target="_blank" rel="noopener">${esc(t(c.name))}</a>` : esc(t(c.name))}` +
        `<div class="meta">${esc([c.city, c.country].join(', '))}${c.note ? ' · ' + esc(t(c.note)) : ''}</div></li>`).join('')}</ul>`
        : `<p class="empty">${esc(t(i18n.map_empty))}</p>`);
    if (!window.L) return;
    const map = window.L.map('map').setView([30, 10], 2);
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
    centers.forEach((c) => window.L.marker([c.lat, c.lng]).addTo(map).bindPopup(
      `<b>${esc(t(c.name))}</b><br>${esc([c.city, c.country].filter(Boolean).join(', '))}${c.note ? '<br>' + esc(t(c.note)) : ''}` +
      (c.url ? `<br><a href="${esc(c.url)}" target="_blank" rel="noopener">${esc(c.url)}</a>` : '')));
  }
})();
