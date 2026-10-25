(() => {
  'use strict';
  const finePointer = matchMedia('(any-hover: hover) and (any-pointer: fine)');
  const forcedColors = matchMedia('(forced-colors: active)');
  const root = document.documentElement;
  const cursor = document.createElement('div');
  cursor.className = 'creative-cursor';
  cursor.setAttribute('aria-hidden','true');
  cursor.dataset.state = 'default';
  const dot = document.createElement('span');
  dot.className = 'creative-cursor__dot';
  cursor.append(dot);
  document.body.append(cursor);
  let x = -100, y = -100;
  let inside = false;
  let frame = 0;

  function hide() {
    inside = false;
    cursor.classList.remove('is-visible','is-pressed');
    root.classList.remove('cursor-enabled','cursor-native');
  }

  function refresh() {
    frame = 0;
    if (!inside || !finePointer.matches || forcedColors.matches || document.fullscreenElement) {
      hide();
      return;
    }
    const dialog = [...document.querySelectorAll('dialog[open]')].at(-1);
    const parent = dialog || document.body;
    if (cursor.parentElement !== parent) parent.append(cursor);
    cursor.classList.toggle('in-lightbox',!!dialog);
    cursor.style.transform = `translate3d(${x}px,${y}px,0)`;
    const hit = document.elementFromPoint(x,y);
    // I controlli video e i campi nativi conservano il proprio cursore.
    const native = !!hit?.closest('video,iframe,select,textarea,input:not([type="file"]),[contenteditable="true"]');
    root.classList.add('cursor-enabled');
    root.classList.toggle('cursor-native',native);
    cursor.classList.toggle('is-visible',!native && !!hit);
    if (native || !hit) return;
    const dragging = !!document.querySelector('.scene-card.is-dragging');
    const opensImage = !!hit.closest('a.scene-card,button[data-enlarge],[data-open-cv],.cv-dialog:not(.is-zoomed) .cv-sheet');
    const sceneContent = 'a,button,video,.screen,input,select,textarea,summary,[role="button"],h1,h2,p,dt,dd,.eyebrow,.media-strip>span,.scene-pagination-mark';
    const sceneBlank = document.body.classList.contains('scene-open') && !hit.closest(sceneContent);
    const control = !!hit.closest('a,button,label.file-label,summary,[role="button"],input[type="file"],.cv-dialog') || sceneBlank;
    cursor.dataset.state = dragging ? 'drag' : opensImage ? 'open' : control ? 'control' : 'default';
  }

  function schedule() { if (!frame) frame = requestAnimationFrame(refresh); }

  document.addEventListener('pointermove',event => {
    if (event.pointerType !== 'mouse') { hide(); return; }
    x = event.clientX;
    y = event.clientY;
    inside = true;
    schedule();
  },{passive:true});
  document.addEventListener('pointerover',schedule,{passive:true});
  document.addEventListener('pointerout',event => {
    if (!event.relatedTarget) hide();
    else schedule();
  },{passive:true});
  document.addEventListener('pointerdown',event => {
    if (event.pointerType !== 'mouse') { hide(); return; }
    cursor.classList.add('is-pressed');
    schedule();
  },{passive:true});
  document.addEventListener('pointerup',()=>{cursor.classList.remove('is-pressed');schedule();},{passive:true});
  document.addEventListener('pointercancel',hide,{passive:true});
  document.addEventListener('scroll',schedule,{passive:true,capture:true});
  document.addEventListener('keydown',event=>{if(event.key==='Tab')hide();});
  document.addEventListener('fullscreenchange',hide);
  window.addEventListener('blur',hide);
  window.addEventListener('resize',schedule,{passive:true});
  finePointer.addEventListener('change',hide);
  forcedColors.addEventListener('change',hide);

  const contentObserver = new MutationObserver(schedule);
  contentObserver.observe(document.querySelector('main'),{childList:true,subtree:true});
  const themeObserver = new MutationObserver(schedule);
  themeObserver.observe(document.body,{attributes:true,attributeFilter:['class']});
  document.querySelectorAll('dialog').forEach(dialog => {
    const observer = new MutationObserver(schedule);
    observer.observe(dialog,{attributes:true,attributeFilter:['open']});
    dialog.addEventListener('close',schedule);
  });
})();
