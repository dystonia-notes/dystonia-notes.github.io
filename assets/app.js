(async function () {
  const html = document.documentElement;
  const L = html.lang === 'en' ? 'en' : 'ko';
  const page = html.dataset.page;
  const root = html.dataset.root || './';
  const get = (p) => fetch(root + 'data/' + p, { cache: 'no-cache' }).then((r) => r.json());
  const t = (o) => (o == null ? '' : typeof o === 'string' ? o : (o[L] || o.ko || o.en || ''));
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const i18n = await get('i18n.json');
  const base = L === 'en' ? root + 'en/' : root;
  const other = L === 'en' ? root : root + 'en/';
  const file = { home: '', topics: 'topics.html', videos: 'videos.html', library: 'library.html', map: 'map.html' };
  const navKey = page === 'topic' ? 'topics' : page;
  const selfFile = page === 'topic' ? `topic-${html.dataset.topic}.html` : file[page];

  document.querySelector('header').innerHTML = `<div class="wrap bar">
    <a class="brand" href="${base}">${esc(t(i18n.site))}</a>
    <nav>${['home', 'topics', 'videos', 'map']
      .map((k) => `<a href="${base}${file[k]}" class="${k === navKey ? 'on' : ''}">${esc(t(i18n.nav[k]))}</a>`).join('')}
      <a class="lang" href="${other}${selfFile}">${esc(t(i18n.lang_switch))}</a></nav></div>`;
  document.querySelector('footer').innerHTML = `<div class="wrap">${esc(t(i18n.disclaimer))}</div>`;
  const main = document.querySelector('main .wrap');

  const figHTML = (f) => (f && f.src && f.src[L])
    ? `<figure><img src="${root}${esc(f.src[L])}" alt="${esc(t(f.caption))}" loading="lazy"><figcaption>${esc(t(f.caption))}</figcaption></figure>` : '';
  const itemHTML = (it) => {
    const dt = it.detail && it.detail[L];
    const link = (txt) => `<a href="${esc(it.url)}" target="_blank" rel="noopener">${txt}</a>`;
    const title = (it.url && !dt) ? link(esc(t(it.title))) : esc(t(it.title));
    const meta = [it.authors, it.year, it.source].filter(Boolean).map(esc).join(' · ');
    const tags = `<span class="tag type">${esc(t(i18n.type[it.type]))}</span>` +
      (it.evidence ? `<span class="tag ${esc(it.evidence)}">${esc(t(i18n.evidence[it.evidence]))}</span>` : '') +
      (it.aspects || []).map((a) => `<span class="tag aspect ${esc(a)}">${esc(t(i18n.aspect[a]))}</span>`).join('');
    const free = it.free ? `<a class="free" href="${esc(it.free)}" target="_blank" rel="noopener">${esc(t(i18n.free_link))}</a>` : '';
    const head = `${tags}<span class="ttl">${title}</span>${free}${meta ? `<div class="meta">${meta}</div>` : ''}${it.note ? `<div class="note">${esc(t(it.note))}</div>` : ''}`;
    if (!dt) return `<li>${head}</li>`;
    return `<li class="has-detail"><details><summary>${head}<span class="more">${esc(t(i18n.more))}</span></summary>
      <div class="detail">${figHTML(it.figure)}
        ${dt.sections.map(([h, p]) => `<h4>${esc(h)}</h4><p>${esc(p)}</p>`).join('')}
        <p class="basis">${esc(dt.basis)}${it.url ? ' · ' + link(esc(t(i18n.source_link))) : ''}</p></div></details></li>`;
  };
  const listHTML = (items) => items.length ? `<ul class="items">${items.map(itemHTML).join('')}</ul>` : `<p class="empty">${esc(t(i18n.empty))}</p>`;
  const groupHTML = (g, extra = '') => `<section class="group" id="${esc(g.id)}">
    <h2>${esc(t(g.name))}</h2><p class="sum">${esc(t(g.summary))}</p>${extra}${listHTML(g.items)}</section>`;
  const legendHTML = () => `<div class="legend">${Object.keys(i18n.evidence).map((k) =>
    `<span><span class="tag ${k}">${esc(t(i18n.evidence[k]))}</span></span><span>${esc(t(i18n.evidence_desc[k]))}</span>`).join('')}</div>`;
  const inLang = (tp) => !tp.langs || tp.langs.includes(L);
  const datesHTML = (o) => (o.created || o.updated) ? `<small class="dates">${[['created_label', o.created], ['updated_label', o.updated]]
    .filter((x) => x[1]).map((x) => `<i>${esc(t(i18n[x[0]]))} ${esc(x[1])}</i>`).join('')}</small>` : '';
  const cardsHTML = (topics, dates = true) => topics.filter(inLang).map((tp) =>
    `<a class="card" href="${base}topic-${esc(tp.id)}.html"><b>${esc(t(tp.name))}</b><span>${esc(t(tp.summary))}</span>${dates ? datesHTML(tp) : ''}</a>`).join('');

  if (page === 'home') {
    const topics = await get('topics.json');
    main.innerHTML = `<h1>${esc(t(i18n.site))}</h1><p class="lead">${esc(t(i18n.tagline))}</p>
      <p>${esc(t(i18n.home_intro))}</p>
      <div class="cards">${cardsHTML(topics, false)}
        <a class="card" href="${base}videos.html"><b>${esc(t(i18n.nav.videos))}</b><span>${esc(t(i18n.videos_intro).split('.')[0])}</span></a>
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
    const OL = L === 'en' ? 'ko' : 'en';
    if (meta.langs && !meta.langs.includes(OL)) { const sw = document.querySelector('header a.lang'); if (sw) sw.href = other + file.topics; }
    const tp = await get(meta.file);
    document.title = `${t(tp.name)} · ${t(i18n.site)}`;
    main.innerHTML = `<h1>${esc(t(tp.name))}</h1><p class="lead">${esc(t(tp.summary))}</p>
      <p class="tools"><button type="button" id="toggle-all">${esc(t(i18n.open_all))}</button></p>` +
      tp.layers.map((ly) => `<section class="group layer" id="${esc(ly.id)}"><h2>${esc(t(ly.name))}</h2>
        <p class="sum">${esc(t(ly.intro))}</p>${figHTML(ly.figure)}${ly.figure && !ly.items.length ? '' : listHTML(ly.items)}
        ${ly.view ? `<div class="view"><b>${esc(t(i18n.view_title))}</b><p>${esc(t(ly.view))}</p></div>` : ''}</section>`).join('') +
      `<section class="group"><h2>${esc(t(i18n.evidence_title))}</h2>${legendHTML()}</section>`;
    const btn = document.getElementById('toggle-all');
    if (btn) btn.addEventListener('click', () => {
      const all = [...main.querySelectorAll('details')];
      const open = all.some((x) => !x.open);
      all.forEach((x) => { x.open = open; });
      btn.textContent = t(open ? i18n.close_all : i18n.open_all);
    });
  }

  if (page === 'videos') {
    const chans = await get('videos.json');
    const ts = (o) => (o && o[L]) || '';
    const topics = await get('topics.json');
    const viewHTML = (c) => {
      const ps = [].concat(ts(c.view) || []);
      if (!ps.length) return '';
      const tp = topics.find((x) => x.id === c.view_topic && inLang(x));
      return `<div class="view"><b>${esc(t(i18n.view_title))}</b>${ps.map((p) => `<p>${esc(p)}</p>`).join('')}` +
        (tp ? `<p class="links"><a href="${base}topic-${esc(tp.id)}.html">${esc(t(tp.name))} →</a></p>` : '') + `</div>`;
    };
    const chanHTML = (c) => `<section class="group" id="${esc(c.id)}">
        ${ts(c.about) ? `<p class="sum">${esc(ts(c.about))}</p>` : ''}
        ${ts(c.covers) ? `<p class="covers-t">${esc(t(i18n.covers_title))}</p><ul class="covers">${ts(c.covers).map((x) => `<li><b>${esc(x.h)}</b> ${esc(x.p)}</li>`).join('')}</ul>` : ''}
        ${c.site && ts(c.site.note) ? `<p class="sum">${esc(ts(c.site.note))}</p>` : ''}
        <p class="links"><a href="${esc(c.url)}" target="_blank" rel="noopener">${esc(t(i18n.channel_link))}</a>${c.site ? ` · <a href="${esc(c.site.url)}" target="_blank" rel="noopener">${esc(t(i18n.site_link))}</a>` : ''}</p>
        ${ts(c.caution) ? `<div class="view"><p>${esc(ts(c.caution))}</p></div>` : ''}
        ${viewHTML(c)}
        ${c.groups.map((g) => `<h3 class="vg">${esc(t(g.name))}</h3><ul class="items">${g.videos.map((v) =>
          `<li><span class="tag type">${esc(t(i18n.type.video))}</span><span class="tag ${esc(v.evidence)}">${esc(t(i18n.evidence[v.evidence]))}</span>` +
          `<a class="ttl" href="https://www.youtube.com/watch?v=${esc(v.id)}" target="_blank" rel="noopener">${esc(v.title)}</a>` +
          `<div class="meta">${[v.duration, ts(v.note)].filter(Boolean).map(esc).join(' · ')}</div>` +
          `<button type="button" class="play" data-id="${esc(v.id)}">${esc(t(i18n.play_here))}</button><div class="player"></div></li>`).join('')}</ul>`).join('')}
        ${datesHTML(c)}
      </section>`;
    const render = () => {
      const want = new URLSearchParams(location.search).get('c') || location.hash.slice(1);
      const c = chans.find((x) => x.id === want);
      const sw = document.querySelector('header a.lang');
      if (sw) sw.href = other + file.videos + (c ? `?c=${encodeURIComponent(c.id)}` : '');
      if (c) {
        document.title = `${c.name} · ${t(i18n.site)}`;
        main.innerHTML = `<p class="back"><a href="${base}${file.videos}">${esc(t(i18n.videos_back))}</a></p><h1>${esc(c.name)}</h1>` + chanHTML(c);
      } else {
        document.title = `${t(i18n.nav.videos)} · ${t(i18n.site)}`;
        main.innerHTML = `<h1>${esc(t(i18n.nav.videos))}</h1><p class="lead">${esc(t(i18n.videos_intro))}</p>
          <div class="cards">${chans.map((x) => `<a class="card" href="${base}${file.videos}?c=${encodeURIComponent(x.id)}"><b>${esc(x.name)}</b><span>${esc(ts(x.summary))}</span>${datesHTML(x)}</a>`).join('')}</div>`;
      }
      window.scrollTo(0, 0);
    };
    render();
    window.addEventListener('hashchange', render);
    main.addEventListener('click', (e) => {
      const btn = e.target.closest('button.play');
      if (!btn) return;
      const box = btn.nextElementSibling;
      if (box.firstChild) { box.innerHTML = ''; btn.textContent = t(i18n.play_here); return; }
      box.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(btn.dataset.id)}" title="YouTube video player" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
      btn.textContent = t(i18n.close_player);
    });
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
