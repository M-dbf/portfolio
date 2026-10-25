(() => {
  'use strict';
  const dialog = document.querySelector('.cv-dialog');
  const viewport = dialog.querySelector('.cv-viewport');
  const sheet = dialog.querySelector('.cv-sheet');
  const image = sheet.querySelector('img');
  const help = dialog.querySelector('#cv-help');
  const pages = window.PORTFOLIO.cv;
  let page = 0, zoomed = false, width = 0, height = 0;
  let touch = null, suppressClick = false;
  let point = {x:.5,y:.5};
  const clamp = n => Math.max(0,Math.min(1,n));
  const scale = () => zoomed ? (viewport.clientWidth < 700 ? 3 : 2) : 1;

  function transform() {
    const zoom = scale();
    const dx = (.5-point.x)*Math.max(0,width*zoom-viewport.clientWidth);
    const dy = (.5-point.y)*Math.max(0,height*zoom-viewport.clientHeight);
    sheet.style.transform = `translate(${dx}px,${dy}px) scale(${zoom})`;
  }
  function fit() {
    if (!dialog.open) return;
    const ratio = pages[page].larghezza/pages[page].altezza;
    width = Math.min(viewport.clientWidth,viewport.clientHeight*ratio);
    height = width/ratio;
    sheet.style.width = `${width}px`;
    sheet.style.height = `${height}px`;
    transform();
  }
  function setZoom(value) {
    zoomed = value;
    dialog.classList.toggle('is-zoomed',zoomed);
    sheet.setAttribute('aria-label',zoomed ? 'Riduci la pagina del curriculum' : 'Ingrandisci la pagina del curriculum');
    help.textContent = zoomed ? 'Muovi il cursore o trascina per esplorare · Clicca per ridurre' : 'Clicca per ingrandire · X o sfondo per chiudere';
    transform();
  }
  function showPage(index) {
    page = Math.max(0,Math.min(pages.length-1,index));
    const item = pages[page];
    image.src = item.immagine;
    image.alt = `Curriculum di Michela De Buono Filippelli, pagina ${page+1} di ${pages.length}`;
    image.width = item.larghezza;
    image.height = item.altezza;
    dialog.querySelector('.cv-transcript').textContent = item.testo;
    dialog.querySelector('.cv-pages span').textContent = `${String(page+1).padStart(2,'0')} / ${String(pages.length).padStart(2,'0')}`;
    // Le frecce restano focalizzabili; ai limiti non cambiano pagina.
    dialog.querySelectorAll('[data-cv-page]').forEach(button => {
      button.setAttribute('aria-disabled',String(page+Number(button.dataset.cvPage)<0 || page+Number(button.dataset.cvPage)>=pages.length));
    });
    point = {x:.5,y:.5};
    setZoom(false);
    fit();
  }
  document.addEventListener('click',event => {
    if (!event.target.closest('[data-open-cv]')) return;
    dialog.showModal();
    showPage(0);
    dialog.querySelector('.cv-close').focus({preventScroll:true});
  });
  dialog.addEventListener('click',event => {
    const arrow = event.target.closest('[data-cv-page]');
    if (arrow) { showPage(page+Number(arrow.dataset.cvPage)); return; }
    if (event.target.closest('.cv-close')) { dialog.close(); return; }
    if (suppressClick) { suppressClick = false;return; }
    if (zoomed) { point = {x:.5,y:.5};setZoom(false);return; }
    if (!event.target.closest('.cv-sheet')) { dialog.close();return; }
    const rect = viewport.getBoundingClientRect();
    // Anche l'attivazione con tastiera ingrandisce dal centro.
    point = event.detail ? {x:clamp((event.clientX-rect.left)/rect.width),y:clamp((event.clientY-rect.top)/rect.height)} : {x:.5,y:.5};
    setZoom(true);
  });
  dialog.addEventListener('pointermove',event => {
    if (!zoomed || !event.target.closest('.cv-viewport')) return;
    if (touch?.id === event.pointerId && Math.hypot(event.clientX-touch.x,event.clientY-touch.y)>6) touch.moved = true;
    if (event.pointerType === 'mouse') {
      const rect = viewport.getBoundingClientRect();
      point = {x:clamp((event.clientX-rect.left)/rect.width),y:clamp((event.clientY-rect.top)/rect.height)};
    } else if (touch?.id === event.pointerId) {
      const dx = event.clientX-touch.x, dy = event.clientY-touch.y;
      if (Math.hypot(dx,dy)>6) touch.moved = true;
      const excessX = Math.max(1,width*scale()-viewport.clientWidth);
      const excessY = Math.max(1,height*scale()-viewport.clientHeight);
      point = {x:clamp(touch.point.x-dx/excessX),y:clamp(touch.point.y-dy/excessY)};
    } else return;
    transform();
  });
  viewport.addEventListener('pointerdown',event => {
    if (!zoomed || event.button !== 0) return;
    suppressClick = false;
    touch = {id:event.pointerId,x:event.clientX,y:event.clientY,point:{...point},moved:false};
    viewport.setPointerCapture(event.pointerId);
  });
  viewport.addEventListener('pointerup',event => {
    if (touch?.id !== event.pointerId) return;
    suppressClick = touch.moved;
    touch = null;
    if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
  });
  viewport.addEventListener('pointercancel',()=>{touch=null;suppressClick=false;});
  dialog.addEventListener('keydown',event => {
    if (event.key==='ArrowRight' || event.key==='ArrowLeft') {
      event.preventDefault();showPage(page+(event.key==='ArrowRight' ? 1 : -1));
    }
  });
  dialog.addEventListener('close',()=>{touch=null;suppressClick=false;setZoom(false);});
  new ResizeObserver(fit).observe(viewport);

  // Blocca la pagina sotto entrambe le viste a schermo intero e ne conserva il punto.
  let locked = false, scroll = 0, lockedRoute = '';
  const root = document.documentElement;
  function syncDialogs() {
    const open = !!document.querySelector('dialog[open]');
    if (open === locked) return;
    locked = open;
    if (open) {
      scroll = window.scrollY;
      lockedRoute = location.hash;
      root.style.setProperty('--locked-scroll',`${-scroll}px`);
      root.classList.add('modal-open');
    } else {
      root.classList.remove('modal-open');
      root.style.removeProperty('--locked-scroll');
      window.scrollTo({top:lockedRoute===location.hash ? scroll : 0,behavior:'instant'});
    }
  }
  const observer = new MutationObserver(syncDialogs);
  document.querySelectorAll('dialog').forEach(item=>observer.observe(item,{attributes:true,attributeFilter:['open']}));
  // Attributo nativo oltre al blocco del trascinamento, anche per le viste dinamiche.
  const noDrag = () => document.querySelectorAll('img:not([draggable="false"])').forEach(img=>img.draggable=false);
  noDrag();
  new MutationObserver(noDrag).observe(document.body,{childList:true,subtree:true});
})();
