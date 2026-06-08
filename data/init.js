(function(){
  var p = window.location.pathname.replace(/\/+$/, '');
  if (p !== '' && p !== '/circle-blog' && p !== '/circle-blog/index.html') return;

  function ready() {
    if (typeof L2Dwidget === 'undefined') { setTimeout(ready, 100); return; }

    // Random pick: Tae or Tsukushi
    var models = [
      '/circle-blog/data/tae/model.json',
      '/circle-blog/data/tsukushi/model.json'
    ];
    var chosen = models[Math.floor(Math.random() * models.length)];

    L2Dwidget.init({
      model: { jsonPath: chosen, scale: 0.85 },
      display: { superSample: 2, width: 200, height: 350, position: 'right', hOffset: 20, vOffset: 0 },
      mobile: { show: false },
      name: { canvas: 'l2dc', div: 'l2dw' },
      react: { opacity: 1 },
      dialog: { enable: false }
    });

    var tries = 0;
    function fixDom() {
      var w = document.getElementById('l2dw');
      var c = document.getElementById('l2dc');
      if (!w || !c) { if (tries++ < 60) setTimeout(fixDom, 200); return; }

      w.style.zIndex = '90';

      // Drag — set a flag so widget's mouseup skips tap when dragging
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
    setTimeout(fixDom, 800);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready);
  else ready();
})();
