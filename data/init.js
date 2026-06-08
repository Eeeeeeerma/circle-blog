(function(){
  var p = window.location.pathname.replace(/\/+$/, '');
  if (p !== '' && p !== '/circle-blog' && p !== '/circle-blog/index.html') return;

  function ready() {
    if (typeof L2Dwidget === 'undefined') { setTimeout(ready, 100); return; }

    L2Dwidget.init({
      model: { jsonPath: '/circle-blog/data/model.json', scale: 0.85 },
      display: { superSample: 2, width: 200, height: 350, position: 'right', hOffset: 20, vOffset: 0 },
      mobile: { show: false },
      name: { canvas: 'l2dc', div: 'l2dw' },
      react: { opacity: 1 },
      dialog: { enable: false }
    });

    var tries = 0;
    function fixDom() {
      var w = document.getElementById('l2dw');
      if (!w) { if (tries++ < 60) setTimeout(fixDom, 200); return; }
      w.style.zIndex = '90';
      w.style.pointerEvents = 'auto';
      w.style.cursor = 'grab';

      // --- Drag ---
      var drag = false, moved = false, dsx, dsy, ol, ot;
      w.addEventListener('mousedown', function(e) {
        if (e.button !== 0) return;
        drag = true; moved = false;
        dsx = e.clientX; dsy = e.clientY;
        var r = w.getBoundingClientRect();
        ol = r.left; ot = r.top;
        w.style.cursor = 'grabbing';
      });
      document.addEventListener('mousemove', function(e) {
        if (!drag) return;
        var dx = e.clientX - dsx, dy = e.clientY - dsy;
        if (!moved && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
          moved = true;
          w.style.right = 'auto'; w.style.bottom = 'auto';
          w.style.left = ol + 'px'; w.style.top = ot + 'px';
        }
        if (moved) { w.style.left = (ol + dx) + 'px'; w.style.top = (ot + dy) + 'px'; }
      });
      document.addEventListener('mouseup', function() {
        if (drag && !moved) {
          var c = document.getElementById('l2dc');
          if (c) {
            var r = c.getBoundingClientRect();
            ['mousedown','mouseup','click'].forEach(function(t) {
              c.dispatchEvent(new MouseEvent(t, {bubbles:true, clientX:r.left+r.width/2, clientY:r.top+r.height/3, button:0}));
            });
          }
        }
        drag = false; w.style.cursor = 'grab';
      });
    }
    setTimeout(fixDom, 800);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready);
  else ready();
})();
