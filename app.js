(() => {
  'use strict';
  const data = window.PORTFOLIO;
  const main = document.querySelector('main');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let category = 'Tutti';
  let indexMode = false;
  let activeScene = null;
  let currentRoute = '';
  let transition = null;
  let pendingFrame = 0;
  const mediaChoices = new Map();
  let mediaResize = null;
  let chooseMedia = null;
  let preparedVideo = null;
  let galleryResize = null;
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const number = index => String(index + 1).padStart(2, '0');
  const years = data.scene.map(scene=>Number(scene.anno));
  const period = `${Math.min(...years)}–${Math.max(...years)}`;
  const signature = `PORTFOLIO PERSONALE / ${escape(data.nome)}`;
  const footer = () => `<footer class="page-footer">${signature}</footer>`;
  const selectedMedia = scene => scene.media[mediaChoices.get(scene.id) || 0];
  const duration = seconds => `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(Math.floor(seconds%60)).padStart(2,'0')}`;
  const imageTag = (scene, extra = '', sizes = '100vw') => `<img src="${escape(scene.anteprima || scene.immagine)}"${scene.anteprima ? ` srcset="${escape(scene.anteprima)} 720w, ${escape(scene.immagine)} ${scene.larghezza}w" sizes="${sizes}"` : ''} alt="${escape(scene.alt)}"${scene.larghezza && scene.altezza ? ` width="${scene.larghezza}" height="${scene.altezza}"` : ''} ${extra}>`;
  const card = (scene, index) => `<a class="scene-card" href="#scena/${scene.id}" data-scene="${scene.id}" draggable="false" aria-label="Apri ${escape(scene.titolo)}, ${escape(scene.categoria)}" aria-description="Clicca per aprire. Trascina con il mouse e rilascia per tornare al punto di partenza."><span class="card-number">${number(index)} / ${scene.anno}</span><span class="card-image">${imageTag(scene,'draggable="false"','(max-width:700px) 50vw, 30vw')}<span class="card-arrow" aria-hidden="true">↗</span></span><span class="card-caption"><strong>${escape(scene.titolo)}</strong><small>${escape(scene.categoria)}</small></span></a>`;
  function playerMarkup(scene, media, index) {
    if (media.tipo === 'video') return `<video controls autoplay muted playsinline preload="metadata" poster="${escape(media.poster)}" src="${escape(media.src)}" aria-label="Video: ${escape(scene.titolo)}, estratto ${index+1}"></video>`;
    if (media.tipo === 'embed') return `<div class="external-video"><img src="${escape(media.poster)}" alt=""><button class="external-play" data-play-external>Riproduci video <span aria-hidden="true">▶</span></button></div>`;
    return `<img src="${escape(media.src)}" alt="${escape(scene.alt)}">`;
  }
  function home() {
    return `<section class="home${indexMode ? ' index-mode' : ''}" aria-label="Esplorazione dei progetti"><img class="home-backdrop" src="${escape(data.sfondoHome)}" alt=""><div class="home-intro"><p class="eyebrow">PROGETTI SELEZIONATI / ${period}</p><h1>Dare forma<br><em>all’invisibile.</em></h1><p class="intro-caption"><span>Tra il corpo e lo spazio,</span><span>tra l’immagine e l’attesa.</span><span>Teatro, recitazione e regia audiovisiva.</span></p></div><span class="featured-label">FRAMMENTI DI UN IMMAGINARIO</span><span class="crosshair" aria-hidden="true">+</span><div class="scene-cloud">${data.scene.map(card).join('')}</div><div class="home-bottom"><div class="view-controls" role="group" aria-label="Disposizione dei progetti"><button class="view-toggle" data-view="free" aria-pressed="${!indexMode}">LIBERA</button><span aria-hidden="true">/</span><button class="view-toggle" data-view="index" aria-pressed="${indexMode}">INDICE</button></div><div class="filters" role="group" aria-label="Filtra per disciplina">${['Tutti','Teatro','Regia'].map(c => `<button data-filter="${c}" aria-pressed="${(category === 'Tutte' ? 'Tutti' : category) === c}">${c.toUpperCase()}</button>`).join('')}</div><span class="version-note">${signature}</span></div></section>`;
  }
  function scenePage(scene) {
    const index = data.scene.indexOf(scene);
    const next = data.scene[(index + 1) % data.scene.length];
    const previous = data.scene[(index + data.scene.length - 1) % data.scene.length];
    const media = selectedMedia(scene);
    const mediaIndex = mediaChoices.get(scene.id) || 0;
    const label = media.tipo === 'video' ? 'ESTRATTI' : 'FOTOGRAFIE';
    const selector = scene.media.length > 1 ? `<div class="media-strip" role="group" aria-label="Materiali di ${escape(scene.titolo)}"><span>${label}</span>${scene.media.map((item,i)=>`<button data-media-index="${i}" aria-label="${item.tipo === 'video' ? 'Estratto' : 'Fotografia'} ${i+1} di ${scene.media.length}" aria-pressed="${i===mediaIndex}">${number(i)}${item.durata ? `<small>${duration(item.durata)}</small>` : ''}</button>`).join('')}</div>` : '';
    return `<article class="scene-stage" aria-label="Progetto ${escape(scene.titolo)}"><div class="scene-topline"><span class="eyebrow">PROGETTO ${number(index)} / ${number(data.scene.length - 1)}</span><span class="eyebrow">${escape(scene.categoria)} / ${scene.anno}</span></div><div class="scene-layout"><figure class="scene-media"><div class="media-canvas" data-scene-dismiss><div class="screen"${media.tipo === 'embed' ? ` data-provider="${media.provider}"` : ''}>${playerMarkup(scene,media,mediaIndex)}</div></div>${selector}${media.url ? `<a class="external-access text-link" href="${escape(media.url)}" target="_blank" rel="noopener noreferrer">Apri ${media.provider === 'youtube' ? 'su YouTube' : media.provider === 'vimeo' ? 'su Vimeo' : 'il video'} ↗</a>` : ''}<p class="media-error" id="video-message" role="status" hidden></p></figure><aside class="scene-info"><p class="eyebrow">${escape(scene.categoria)}</p><h1 tabindex="-1">${escape(scene.titolo)}</h1><dl class="scene-facts"><div><dt>Anno</dt><dd>${scene.anno}</dd></div><div><dt>Ruolo</dt><dd>${escape(scene.ruolo)}</dd></div><div><dt>Ambito</dt><dd>${escape(scene.ambito)}</dd></div><div><dt>Regia</dt><dd>${escape(scene.regia)}</dd></div></dl><div class="direction-note"><p class="note-title">IL PROGETTO</p><p class="scene-note">${escape(scene.nota)}</p></div></aside></div><nav class="scene-pagination" aria-label="Altri progetti"><a class="text-link" href="#scena/${previous.id}"><span aria-hidden="true">←</span> Precedente</a><span class="scene-pagination-mark" aria-hidden="true">MDBF / ${number(index)}</span><a class="next-scene" href="#scena/${next.id}"><small class="eyebrow">PROSSIMO PROGETTO</small><span class="next-title">${escape(next.titolo)} <span aria-hidden="true">↗</span></span></a></nav></article>`;
  }
  function gallery() {
    const item = (s,i) => `<figure class="gallery-item${s.tecnica ? ' gallery-work' : ''}"><button data-enlarge="${i}" aria-label="Ingrandisci ${escape(s.titolo)}, immagine ${i+1}"><span class="gallery-image image-frame" data-rotation="${s.rotazione || ''}">${imageTag(s,'loading="lazy"',s.tecnica ? '(max-width:560px) 86vw, 44vw' : '(max-width:560px) 86vw, (max-width:1199px) 44vw, 29vw')}</span></button><figcaption><span class="gallery-caption-title">${escape(s.titolo)}${s.tecnica ? `<small>${escape(s.tecnica)}</small>` : ''}</span><span>${s.anno || 'OPERA'}</span></figcaption></figure>`;
    const group = works => data.galleria.map((s,i) => Boolean(s.tecnica) === works ? item(s,i) : '').join('');
    return `<section class="page-shell"><p class="eyebrow">GALLERIA</p><h1 class="page-title" tabindex="-1">Fotografie <em>e opere.</em></h1><p class="page-intro">Una selezione di immagini e lavori, tra scena, colore e segno. Seleziona un’immagine per osservarla da vicino.</p><div class="gallery"><div class="gallery-photos">${group(false)}</div><div class="gallery-works">${group(true)}</div></div>${footer()}</section>`;
  }
  function profile() {
    return `<section class="page-shell"><div class="profile-layout"><div class="profile-text"><p class="eyebrow">CHI SONO</p><h1 class="page-title" tabindex="-1">Michela.</h1><div class="profile-copy"><p class="profile-lead">Attrice e regista.</p>${data.biografia.split(/(?=Il mio )/).map(paragraph=>`<p>${escape(paragraph.trim())}</p>`).join('')}</div><a class="text-link" href="#contatti">Lavoriamo insieme <span aria-hidden="true">↗</span></a></div><img class="profile-image" width="${data.ritrattoDimensioni?.[0] || 1469}" height="${data.ritrattoDimensioni?.[1] || 2200}" decoding="async" src="${escape(data.ritratto)}" alt="Ritratto di Michela De Buono Filippelli"></div>${footer()}</section>`;
  }
  function contact() {
    return `<section class="page-shell contact-page"><div class="contact-main"><p class="eyebrow">CONTATTI</p><h1 class="page-title" tabindex="-1">Ogni incontro,<br><em>una possibilità.</em></h1><p class="page-intro">Per un progetto, una collaborazione,<br>o una conversazione ancora da cominciare.</p>${data.email ? `<a class="contact-link" href="mailto:${escape(data.email)}">${escape(data.email)} ↗</a>` : '<p class="contact-empty">Il tuo indirizzo email troverà posto qui.<br>Questa prima proposta attende i tuoi contatti e i tuoi collegamenti professionali.</p>'}<a class="text-link contact-return" href="#">Torna alle scene <span aria-hidden="true">↗</span></a></div>${footer()}</section>`;
  }
  function applyFilters() {
    document.querySelectorAll('.scene-card').forEach(card => {card.hidden = category !== 'Tutti' && category !== 'Tutte' && data.scene.find(s => s.id === card.dataset.scene).categoria !== category;});
    document.querySelectorAll('[data-filter]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === category)));
  }
  function draw() {
    document.querySelector('video')?.pause();
    mediaResize?.disconnect();
    mediaResize = null;
    chooseMedia = null;
    galleryResize?.disconnect();
    galleryResize = null;
    const route = location.hash.slice(1);
    const scene = route.startsWith('scena/') && data.scene.find(s => s.id === route.slice(6));
    activeScene = scene || null;
    currentRoute = scene ? route : ['immagini','profilo','contatti'].includes(route) ? route : '';
    document.body.classList.toggle('paper', !!currentRoute && !scene);
    document.body.classList.toggle('scene-open', !!scene);
    document.querySelector('.scene-home-link').hidden = !scene;
    main.innerHTML = scene ? `<div class="scene-backdrop" inert aria-hidden="true">${imageTag({immagine:selectedMedia(scene).poster,alt:scene.alt},'class="home-backdrop"')}</div>${scenePage(scene)}` : currentRoute === 'immagini' ? gallery() : currentRoute === 'profilo' ? profile() : currentRoute === 'contatti' ? contact() : home();
    if (preparedVideo) {
      if (scene?.id === preparedVideo.id) main.querySelector('video').replaceWith(preparedVideo.element);
      else preparedVideo.element.pause();
      preparedVideo = null;
    }
    main.toggleAttribute('data-scene-dismiss',!!scene);
    document.querySelector('.site-header').toggleAttribute('data-scene-dismiss',!!scene);
    if (scene) main.querySelectorAll('.scene-stage,.scene-layout,.scene-topline,.scene-pagination').forEach(element=>element.setAttribute('data-scene-dismiss',''));
    document.title = `${scene ? scene.titolo : ({immagini:'Galleria',profilo:'Chi sono',contatti:'Contatti'}[currentRoute] || data.claim)} — ${data.nome}`;
    document.querySelectorAll('[data-nav]').forEach(link => {if(link.dataset.nav === (scene ? 'home' : currentRoute || 'home')) link.setAttribute('aria-current','page'); else link.removeAttribute('aria-current');});
    applyFilters();
    main.querySelector('h1')?.setAttribute('tabindex','-1');
    if (scene) main.querySelector('.screen > img, .screen > video')?.style.setProperty('view-transition-name','scene-image');
    else if (transitionScene) main.querySelector(`[data-scene="${transitionScene}"] img`)?.style.setProperty('view-transition-name','scene-image');
    window.scrollTo({top:0,behavior:'instant'});
    const video = main.querySelector('video');
    if (video) setupPlayer(scene,video);
    else if (scene && selectedMedia(scene).tipo === 'embed') setupExternalPlayer(scene);
    if (currentRoute === 'immagini') setupGallery();
  }
  function setupGallery() {
    const gallery = main.querySelector('.gallery');
    let previousWidth = 0;
    const fit = () => {
      gallery.querySelectorAll('.gallery-photos .gallery-item').forEach(item => {
        const imageHeight = item.querySelector('button').getBoundingClientRect().height;
        const caption = item.querySelector('figcaption');
        const captionHeight = caption.getBoundingClientRect().height + parseFloat(getComputedStyle(caption).marginTop);
        item.style.gridRowEnd = `span ${Math.ceil((imageHeight + captionHeight + 32) / 8)}`;
      });
    };
    galleryResize = new ResizeObserver(() => {
      if (gallery.clientWidth === previousWidth) return;
      previousWidth = gallery.clientWidth;
      fit();
    });
    galleryResize.observe(gallery);
    gallery.querySelectorAll('img').forEach(img => img.addEventListener('load',fit));
    document.fonts.ready.then(() => { if (gallery.isConnected) fit(); });
    fit();
  }
  function setupExternalPlayer(scene) {
    const canvas = main.querySelector('.media-canvas');
    const screen = canvas.querySelector('.screen');
    const media = selectedMedia(scene);
    const fit = () => {
      const width = Math.min(canvas.clientWidth,canvas.clientHeight*media.rapporto);
      screen.style.width = `${width}px`;
      screen.style.height = `${media.provider === 'youtube' ? Math.max(200,width/media.rapporto) : width/media.rapporto}px`;
    };
    mediaResize = new ResizeObserver(fit);
    mediaResize.observe(canvas);
    fit();
  }
  function setupPlayer(scene, video) {
    const canvas = video.closest('.media-canvas');
    const screen = video.parentElement;
    const status = main.querySelector('#video-message');
    const fit = () => {
      const ratio = video.videoWidth && video.videoHeight ? video.videoWidth / video.videoHeight : selectedMedia(scene).rapporto || 16/9;
      const width = Math.min(canvas.clientWidth, canvas.clientHeight * ratio);
      screen.style.width = `${width}px`;
      screen.style.height = `${width / ratio}px`;
    };
    const play = () => video.play().catch(error => {
      if (error.name === 'NotAllowedError' && video.isConnected) {
        status.textContent = 'Premi play per avviare il video.';
        status.hidden = false;
      }
    });
    mediaResize = new ResizeObserver(fit);
    mediaResize.observe(canvas);
    video.addEventListener('loadedmetadata', fit);
    video.addEventListener('playing', () => { status.hidden = true; });
    video.addEventListener('error', () => {
      status.hidden = false;
      status.textContent = 'Impossibile riprodurre questo estratto.';
    });
    // Conserva lo stesso lettore: volume, audio e schermo intero restano coerenti tra le clip.
    chooseMedia = (index, withAudio = false) => {
      const item = scene.media[index];
      mediaChoices.set(scene.id,index);
      main.querySelectorAll('[data-media-index]').forEach(button => {
        button.setAttribute('aria-pressed',String(Number(button.dataset.mediaIndex) === index));
      });
      status.hidden = true;
      video.poster = item.poster;
      video.src = item.src;
      video.setAttribute('aria-label',`Video: ${scene.titolo}, estratto ${index+1}`);
      main.querySelector('.scene-backdrop img').src = item.poster;
      video.load();
      if (withAudio) {
        video.muted = false;
        if (!video.volume) video.volume = 1;
      }
      play();
    };
    video.loop = scene.media.length === 1;
    video.addEventListener('ended', () => {if (video.isConnected) chooseMedia?.(((mediaChoices.get(scene.id) || 0) + 1) % scene.media.length);});
    fit();
    play();
  }
  let transitionScene = null;
  async function navigate() {
    if (transition) transition.skipTransition();
    main.querySelectorAll('img').forEach(img => img.style.removeProperty('view-transition-name'));
    transitionScene = activeScene?.id || (location.hash.startsWith('#scena/') ? location.hash.slice(7) : null);
    if (transitionScene) {
      const source = activeScene ? main.querySelector('.screen > img, .screen > video') : main.querySelector(`[data-scene="${transitionScene}"] img`);
      source?.style.setProperty('view-transition-name','scene-image');
    }
    if (document.startViewTransition && !motion.matches) {
      const own = document.startViewTransition(draw);
      transition = own;
      // Il cambio di dimensione/orientamento può annullare solo l'animazione.
      own.ready.catch(() => {});
      await own.finished.catch(() => {});
      if (transition !== own) return;
      transition = null;
    } else draw();
    (main.querySelector('.scene-info h1') || main.querySelector('h1'))?.focus({preventScroll:true});
  }
  document.addEventListener('click', event => {
    if (event.target.closest('[data-play-external]') && activeScene) {
      const media = selectedMedia(activeScene);
      const iframe = document.createElement('iframe');
      iframe.src = window.PortfolioVideo.playURL(media);
      iframe.title = `Video: ${activeScene.titolo}`;
      iframe.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media';
      iframe.allowFullscreen = true;
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      main.querySelector('.screen').replaceChildren(iframe);
      return;
    }
    const sceneLink = event.target.closest('a[href^="#scena/"]');
    if (sceneLink && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
      const scene = data.scene.find(s => s.id === sceneLink.hash.slice(7));
      if (scene && sceneLink.hash !== location.hash) {
        preparedVideo?.element.pause();
        const item = selectedMedia(scene);
        if (item.tipo === 'video') {
        const player = document.createElement('video');
        player.controls = true;
        player.autoplay = true;
        player.playsInline = true;
        player.preload = 'metadata';
        player.poster = item.poster;
        player.src = item.src;
        player.setAttribute('aria-label',`Video: ${scene.titolo}, estratto ${(mediaChoices.get(scene.id) || 0)+1}`);
        preparedVideo = {id:scene.id,element:player};
        // La riproduzione parte nel gesto del clic, prima della transizione asincrona.
        document.querySelector('video')?.pause();
        player.play().catch(() => {});
        }
      }
    }
    const mediaButton = event.target.closest('[data-media-index]');
    if (mediaButton && activeScene) {
      const chosen = Number(mediaButton.dataset.mediaIndex);
      if (chosen >= 0 && chosen < activeScene.media.length) {
        chooseMedia?.(chosen,true);
        main.querySelector(`[data-media-index="${chosen}"]`)?.focus({preventScroll:true});
      }
      return;
    }
    const sceneContent = 'a,button,video,.screen,input,select,textarea,summary,[role="button"],h1,h2,p,dt,dd,.eyebrow,.media-strip>span,.scene-pagination-mark';
    if (activeScene && !event.target.closest(sceneContent) && !document.querySelector('dialog').open && !document.fullscreenElement) {
      location.hash = '';
      return;
    }
    if(event.target.closest('.skip-link')){event.preventDefault();main.focus();main.scrollIntoView();return;}
    const filter = event.target.closest('[data-filter]');
    if(filter){category=filter.dataset.filter;applyFilters();}
    const view = event.target.closest('[data-view]');
    if(view){indexMode=view.dataset.view==='index';document.querySelector('.home').classList.toggle('index-mode',indexMode);document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String((b.dataset.view==='index')===indexMode)));}
    const enlarge = event.target.closest('[data-enlarge]');
    if(enlarge){const photo=data.galleria[Number(enlarge.dataset.enlarge)];dialogPhoto=photo;dialog.querySelector('img').src=photo.immagine;dialog.querySelector('img').alt=photo.alt;dialog.querySelector('.image-frame').dataset.rotation=photo.rotazione || '';dialog.querySelector('p').textContent=[photo.titolo,photo.tecnica || photo.anno].filter(Boolean).join(' / ');dialog.showModal();fitLightbox();}
  });
  const dialog = document.querySelector('dialog');
  let dialogPhoto = null;
  function fitLightbox() {
    if (!dialog.open || !dialogPhoto) return;
    const area = dialog.querySelector('.lightbox-viewer');
    const frame = area.querySelector('.image-frame');
    const ratio = dialogPhoto.rotazione ? dialogPhoto.altezza/dialogPhoto.larghezza : dialogPhoto.larghezza/dialogPhoto.altezza;
    const width = Math.min(area.clientWidth,area.clientHeight*ratio);
    frame.style.width = `${width}px`;
    frame.style.height = `${width/ratio}px`;
  }
  new ResizeObserver(fitLightbox).observe(dialog);
  dialog.querySelector('button').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click', event=>{if(event.target===dialog)dialog.close();});
  main.addEventListener('pointermove', event => {
    if(motion.matches || event.pointerType!=='mouse' || currentRoute || indexMode || pendingFrame)return;
    if (dragState) return;
    pendingFrame=requestAnimationFrame(()=>{const x=(event.clientX/window.innerWidth-.5)*88;const y=(event.clientY/window.innerHeight-.5)*66;main.querySelectorAll('.scene-card').forEach((card,i)=>{const depth=[1,-.75,.55,-.55,.4,-.4,.35,-.35][i%8];card.style.setProperty('--mx',`${x*depth}px`);card.style.setProperty('--my',`${y*depth}px`);});pendingFrame=0;});
  });
  main.addEventListener('pointerleave',()=>{if (!dragState) main.querySelectorAll('.scene-card').forEach(card=>{card.style.removeProperty('--mx');card.style.removeProperty('--my');});});
  let dragState = null;
  let lastDrag = null;
  main.addEventListener('dragstart', event => { if (event.target.closest('.scene-card')) event.preventDefault(); });
  main.addEventListener('pointerdown', event => {
    const card = event.target.closest('.scene-card');
    if (!card || currentRoute || indexMode || event.button !== 0 || event.pointerType === 'touch') return;
    const rect = card.getBoundingClientRect();
    const footerTop = main.querySelector('.home-bottom').getBoundingClientRect().top;
    const headerBottom = document.querySelector('.site-header').getBoundingClientRect().bottom;
    dragState = {card, pointer:event.pointerId, x:event.clientX, y:event.clientY, moved:false,
      minX:Math.min(0,16-rect.left),maxX:Math.max(0,innerWidth-16-rect.right),
      minY:Math.min(0,Math.max(16,headerBottom+10)-rect.top),maxY:Math.max(0,Math.min(innerHeight,footerTop)-16-rect.bottom)};
    card.classList.remove('is-returning');
    card.setPointerCapture(event.pointerId);
  });
  main.addEventListener('pointermove', event => {
    const state = dragState;
    if (!state || state.pointer !== event.pointerId) return;
    const dx = event.clientX - state.x, dy = event.clientY - state.y;
    if (!state.moved && Math.hypot(dx,dy)<6) return;
    state.moved = true;
    state.card.classList.add('is-dragging');
    state.card.style.setProperty('--dx',`${Math.max(state.minX,Math.min(state.maxX,dx))}px`);
    state.card.style.setProperty('--dy',`${Math.max(state.minY,Math.min(state.maxY,dy))}px`);
    if (event.cancelable) event.preventDefault();
  });
  function finishDrag(event) {
    const state = dragState;
    if (!state || state.pointer !== event.pointerId) return;
    dragState = null;
    if (state.moved) {
      lastDrag = {card:state.card, until:performance.now()+400};
      state.card.classList.add('is-returning');
      state.card.classList.remove('is-dragging');
      state.card.style.setProperty('--dx','0px');
      state.card.style.setProperty('--dy','0px');
      state.card.style.removeProperty('--mx');
      state.card.style.removeProperty('--my');
      if (motion.matches) state.card.classList.remove('is-returning');
      else {
        const onReturnEnd = event => {
          if (event.target !== state.card || event.propertyName !== 'transform') return;
          state.card.classList.remove('is-returning');
          state.card.removeEventListener('transitionend',onReturnEnd);
          state.card.removeEventListener('transitioncancel',onReturnEnd);
        };
        state.card.addEventListener('transitionend',onReturnEnd);
        state.card.addEventListener('transitioncancel',onReturnEnd);
      }
    }
    if (state.card.hasPointerCapture(event.pointerId)) state.card.releasePointerCapture(event.pointerId);
  }
  main.addEventListener('pointerup',finishDrag);
  main.addEventListener('pointercancel',finishDrag);
  main.addEventListener('lostpointercapture',finishDrag);
  document.addEventListener('click', event => {
    if (lastDrag && performance.now()<lastDrag.until && event.target.closest('.scene-card')===lastDrag.card) {
      event.preventDefault();event.stopImmediatePropagation();lastDrag=null;
    }
  },true);
  window.addEventListener('hashchange',navigate);
  window.addEventListener('resize',()=>transition?.skipTransition());
  document.addEventListener('keydown',event=>{if(event.key==='Escape' && activeScene && !document.querySelector('dialog').open && !document.fullscreenElement)location.hash='';});
  draw();
})();
