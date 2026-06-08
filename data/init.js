(function(){
  var p = window.location.pathname.replace(/\/+$/, '');
  if (p !== '' && p !== '/circle-blog' && p !== '/circle-blog/index.html') return;

  // ═══════════════════════════════════════
  //  Model Registry
  // ═══════════════════════════════════════
  var MODELS = [
    { key: 'tae',      name: 'Tae',     label: '花园多惠', path: '/circle-blog/data/tae/model.json' },
    { key: 'tsukushi', name: 'Tsukushi', label: '二叶筑紫', path: '/circle-blog/data/tsukushi/model.json' },
    { key: 'saaya',    name: 'Saaya',   label: '山吹沙绫', path: '/circle-blog/data/saaya/model.json' }
  ];

  // ═══════════════════════════════════════
  //  Persistent State
  // ═══════════════════════════════════════
  var currentKey   = localStorage.getItem('l2d-model') || 'tae';
  var currentScale = parseFloat(localStorage.getItem('l2d-scale')) || 1.0;

  function saveState() {
    localStorage.setItem('l2d-model', currentKey);
    localStorage.setItem('l2d-scale', currentScale);
  }

  function getModel(key) {
    for (var i = 0; i < MODELS.length; i++) {
      if (MODELS[i].key === key) return MODELS[i];
    }
    return MODELS[0];
  }

  // ═══════════════════════════════════════
  //  CSS Injection
  // ═══════════════════════════════════════
  function injectCSS() {
    var s = document.createElement('style');
    s.textContent = '#l2dw{overflow:visible!important}';
    document.head.appendChild(s);
  }

  // ═══════════════════════════════════════
  //  WebGL Health Check
  // ═══════════════════════════════════════
  function checkWebGL(canvas) {
    if (!canvas) return false;
    var gl = canvas.getContext('webgl2') ||
             canvas.getContext('webgl') ||
             canvas.getContext('experimental-webgl2') ||
             canvas.getContext('experimental-webgl');
    if (!gl) return false;
    // Try a trivial operation to verify the context works
    try { gl.clear(gl.COLOR_BUFFER_BIT); return true; }
    catch (e) { return false; }
  }

  // ═══════════════════════════════════════
  //  Live2D Widget Lifecycle
  // ═══════════════════════════════════════
  var widgetReady = false;
  var webglRetries = 0;
  var MAX_WEBGL_RETRIES = 5;

  function createWidget(modelKey) {
    widgetReady = false;
    var m = getModel(modelKey);
    L2Dwidget.init({
      model:   { jsonPath: m.path, scale: 0.85 },
      display: { superSample: 2, width: 200, height: 350, position: 'right', hOffset: 20, vOffset: 0 },
      mobile:  { show: true },
      name:    { canvas: 'l2dc', div: 'l2dw' },
      react:   { opacity: 1 },
      dialog:  { enable: false }
    });
  }

  function switchModel(modelKey) {
    if (modelKey === currentKey) return;
    currentKey = modelKey;
    saveState();

    // Hot-switch: uses patched widget.js method that directly calls
    // the internal changeModel on the existing live2DMgr — no DOM
    // recreation, no new WebGL context, no duplicate event listeners.
    var m = getModel(modelKey);
    L2Dwidget.changeModel(m.path);
    refreshUI();
  }

  // ═══════════════════════════════════════
  //  Scale
  // ═══════════════════════════════════════
  function applyScale(s, animate) {
    var c = document.getElementById('l2dc');
    if (c) {
      c.style.transition = animate === false ? 'none' : 'transform 0.15s ease';
      c.style.transform = 'scale(' + s + ')';
      c.style.transformOrigin = 'bottom right';
    }
    var slider = document.getElementById('l2d-scale-slider');
    if (slider && Math.abs(parseFloat(slider.value) - s) > 0.001) slider.value = s;
    var valEl = document.getElementById('l2d-scale-val');
    if (valEl) valEl.textContent = Math.round(s * 100) + '%';
    currentScale = s;
    saveState();
  }

  // ═══════════════════════════════════════
  //  Control Panel Builder
  // ═══════════════════════════════════════
  var SVG = {
    grid: '<svg width="15" height="15" viewBox="0 0 16 16"><rect x="1" y="1" width="5.5" height="5.5" rx="1" fill="currentColor"/><rect x="9.5" y="1" width="5.5" height="5.5" rx="1" fill="currentColor"/><rect x="1" y="9.5" width="5.5" height="5.5" rx="1" fill="currentColor"/><rect x="9.5" y="9.5" width="5.5" height="5.5" rx="1" fill="currentColor"/></svg>',
    zoom: '<svg width="15" height="15" viewBox="0 0 16 16"><circle cx="6.5" cy="6.5" r="5" fill="none" stroke="currentColor" stroke-width="1.4"/><line x1="10.5" y1="10.5" x2="14.5" y2="14.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    move: '<svg width="15" height="15" viewBox="0 0 16 16"><circle cx="3" cy="3" r="1.2" fill="currentColor"/><circle cx="8" cy="3" r="1.2" fill="currentColor"/><circle cx="13" cy="3" r="1.2" fill="currentColor"/><circle cx="3" cy="8" r="1.2" fill="currentColor"/><circle cx="8" cy="8" r="1.2" fill="currentColor"/><circle cx="13" cy="8" r="1.2" fill="currentColor"/><circle cx="3" cy="13" r="1.2" fill="currentColor"/><circle cx="8" cy="13" r="1.2" fill="currentColor"/><circle cx="13" cy="13" r="1.2" fill="currentColor"/></svg>'
  };

  function modelItemsHTML() {
    var h = '';
    for (var i = 0; i < MODELS.length; i++) {
      var m = MODELS[i];
      h += '<div class="l2d-model-item" data-model="' + m.key + '"><span class="dot"></span>' + m.label + '</div>';
    }
    return h;
  }

  function buildControls() {
    var ctrl = document.createElement('div');
    ctrl.id = 'l2d-ctrl';
    ctrl.className = 'l2d-ctrl';
    ctrl.innerHTML =
      '<div class="l2d-ctrl-btn" id="l2d-btn-model" title="切换看板娘">' + SVG.grid + '</div>' +
      '<div class="l2d-ctrl-panel" id="l2d-model-panel" style="top:0">' + modelItemsHTML() + '</div>' +
      '<div class="l2d-ctrl-btn" id="l2d-btn-scale" title="缩放">' + SVG.zoom + '</div>' +
      '<div class="l2d-ctrl-panel l2d-scale-panel" id="l2d-scale-panel">' +
        '<input type="range" id="l2d-scale-slider" min="0.5" max="2.0" step="0.05" value="' + currentScale + '">' +
        '<div class="scale-row"><span class="scale-reset" id="l2d-scale-reset">重置</span><span class="scale-val" id="l2d-scale-val">' + Math.round(currentScale * 100) + '%</span></div>' +
      '</div>' +
      '<div class="l2d-ctrl-btn" id="l2d-btn-drag" title="拖动位置">' + SVG.move + '</div>';
    return ctrl;
  }

  // ═══════════════════════════════════════
  //  Panel Helpers
  // ═══════════════════════════════════════
  function closeAllPanels(except) {
    var panels = document.querySelectorAll('#l2d-ctrl .l2d-ctrl-panel');
    for (var i = 0; i < panels.length; i++) {
      if (panels[i] !== except) panels[i].classList.remove('show');
    }
  }

  function togglePanel(panel) {
    var isOpen = panel.classList.contains('show');
    closeAllPanels(panel);
    if (!isOpen) panel.classList.add('show');
  }

  // ═══════════════════════════════════════
  //  Event Binding
  // ═══════════════════════════════════════
  var globalBound = false;

  function bindEvents(w) {
    // Model Switcher
    var btnModel  = document.getElementById('l2d-btn-model');
    var panelModel = document.getElementById('l2d-model-panel');
    if (btnModel && panelModel) {
      btnModel.addEventListener('click', function(e) {
        e.stopPropagation();
        togglePanel(panelModel);
        refreshUI();
      });
      panelModel.addEventListener('click', function(e) {
        var item = e.target.closest('.l2d-model-item');
        if (!item) return;
        var key = item.dataset.model;
        panelModel.classList.remove('show');
        if (key && key !== currentKey) switchModel(key);
      });
    }

    // Scale
    var btnScale   = document.getElementById('l2d-btn-scale');
    var panelScale = document.getElementById('l2d-scale-panel');
    var slider     = document.getElementById('l2d-scale-slider');
    var resetBtn   = document.getElementById('l2d-scale-reset');
    if (btnScale && panelScale) {
      btnScale.addEventListener('click', function(e) { e.stopPropagation(); togglePanel(panelScale); });
    }
    if (slider) {
      slider.addEventListener('input', function() { applyScale(parseFloat(this.value)); });
    }
    if (resetBtn) {
      resetBtn.addEventListener('click', function() { applyScale(1.0); });
    }

    // Drag Handle
    var btnDrag = document.getElementById('l2d-btn-drag');
    if (btnDrag) bindDragButton(btnDrag, w);

    // Canvas Drag
    var c = document.getElementById('l2dc');
    if (c) bindCanvasDrag(w, c);

    // Close panels on outside click (once)
    if (!globalBound) {
      globalBound = true;
      document.addEventListener('click', function(e) {
        if (!e.target.closest('#l2d-ctrl')) closeAllPanels();
      });
    }
  }

  function bindDragButton(btn, w) {
    var dragging = false, sx, sy;
    function startDrag(e) {
      e.preventDefault(); e.stopPropagation();
      dragging = true;
      btn.classList.add('drag-active');
      var rect = w.getBoundingClientRect();
      sx = (e.touches ? e.touches[0].clientX : e.clientX);
      sy = (e.touches ? e.touches[0].clientY : e.clientY);
      w.style.right = 'auto'; w.style.bottom = 'auto';
      w.style.left = rect.left + 'px'; w.style.top = rect.top + 'px';
    }
    function moveDrag(e) {
      if (!dragging) return;
      e.preventDefault();
      var cx = (e.touches ? e.touches[0].clientX : e.clientX);
      var cy = (e.touches ? e.touches[0].clientY : e.clientY);
      w.style.left = (parseFloat(w.style.left) + cx - sx) + 'px';
      w.style.top  = (parseFloat(w.style.top)  + cy - sy) + 'px';
      sx = cx; sy = cy;
    }
    function endDrag() {
      if (!dragging) return;
      dragging = false;
      btn.classList.remove('drag-active');
    }
    btn.addEventListener('mousedown', startDrag);
    btn.addEventListener('touchstart', startDrag, { passive: false });
    document.addEventListener('mousemove', moveDrag);
    document.addEventListener('touchmove', moveDrag, { passive: false });
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchend', endDrag);
  }

  function bindCanvasDrag(w, c) {
    var drag = false, moved = false, dsx, dsy, ol, ot;
    window.__L2D_dragged = false;
    c.addEventListener('mousedown', function(e) {
      if (e.button !== 0) return;
      drag = true; moved = false; window.__L2D_dragged = false;
      dsx = e.clientX; dsy = e.clientY;
      var r = w.getBoundingClientRect();
      ol = r.left; ot = r.top;
    });
    document.addEventListener('mousemove', function(e) {
      if (!drag) return;
      var dx = e.clientX - dsx, dy = e.clientY - dsy;
      if (!moved && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
        moved = true; window.__L2D_dragged = true;
        w.style.right = 'auto'; w.style.bottom = 'auto';
        w.style.left = ol + 'px'; w.style.top = ot + 'px';
      }
      if (moved) { w.style.left = (ol + dx) + 'px'; w.style.top = (ot + dy) + 'px'; }
    });
    document.addEventListener('mouseup', function() { drag = false; });
  }

  // ═══════════════════════════════════════
  //  DOM Setup (with WebGL health check + retry)
  // ═══════════════════════════════════════
  var setupCalled = false;

  function setupDOM() {
    if (setupCalled && widgetReady) return;
    var w = document.getElementById('l2dw');
    var c = document.getElementById('l2dc');
    if (!w || !c) { setTimeout(setupDOM, 200); return; }

    // Guard against bad WebGL context
    if (!checkWebGL(c)) {
      if (webglRetries < MAX_WEBGL_RETRIES) {
        webglRetries++;
        console.warn('Live2D: WebGL context failed, retrying (' + webglRetries + '/' + MAX_WEBGL_RETRIES + ')...');
        var old = document.getElementById('l2dw');
        if (old) old.remove();
        createWidget(currentKey);
        setTimeout(setupDOM, 1200);
        return;
      }
      // All retries exhausted — show fallback
      console.error('Live2D: WebGL unavailable after ' + MAX_WEBGL_RETRIES + ' retries.');
      w.innerHTML = '<div style="position:absolute;bottom:20px;right:0;width:200px;text-align:center;font-size:11px;color:#999;pointer-events:none">⚠ 模型加载失败<br><span style="font-size:10px">请检查浏览器 WebGL 支持</span></div>';
      return;
    }

    // WebGL is healthy — proceed
    webglRetries = 0;
    widgetReady = true;
    setupCalled = true;

    w.style.zIndex = '90';
    var oldCtrl = document.getElementById('l2d-ctrl');
    if (oldCtrl) oldCtrl.remove();
    w.appendChild(buildControls());
    applyScale(currentScale, false);
    bindEvents(w);
  }

  function refreshUI() {
    var items = document.querySelectorAll('#l2d-model-panel .l2d-model-item');
    for (var i = 0; i < items.length; i++) {
      items[i].classList.toggle('active', items[i].dataset.model === currentKey);
    }
  }

  // ═══════════════════════════════════════
  //  Bootstrap
  // ═══════════════════════════════════════
  function ready() {
    if (typeof L2Dwidget === 'undefined') { setTimeout(ready, 100); return; }
    injectCSS();
    createWidget(currentKey);

    // Poll for DOM elements. Once they appear, verify WebGL health.
    var pollAttempts = 0;
    function pollDOM() {
      var w = document.getElementById('l2dw');
      var c = document.getElementById('l2dc');
      if (w && c) { setupDOM(); return; }
      if (pollAttempts++ < 120) { setTimeout(pollDOM, 200); }
      else { console.error('Live2D: widget DOM never appeared'); }
    }
    setTimeout(pollDOM, 600);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ready);
  } else {
    ready();
  }
})();
