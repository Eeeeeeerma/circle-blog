(function(){
  function isHomepage() {
    var p = window.location.pathname.replace(/\/+$/, '');
    return p === '' || p === '/circle-blog' || p === '/circle-blog/index.html';
  }

  // Only create snow on homepage
  if (!isHomepage()) return;

  var canvas = document.createElement('canvas');
  canvas.id = 'snow-canvas';
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:91;';
  document.body.appendChild(canvas);

  var ctx = canvas.getContext('2d');
  var W, H;
  var particles = [];
  var COUNT = 60;
  var baseOpacity = 1;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // Create snow particles
  for (var i = 0; i < COUNT; i++) {
    particles.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 2.5 + 1,
      speed: Math.random() * 1.2 + 0.5,
      wind: Math.random() * 0.4 - 0.2,
      opacity: Math.random() * 0.6 + 0.4
    });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Fade snow based on scroll — stop when scrolled past hero
    var heroH = window.innerHeight;
    var scrolled = window.scrollY;
    var fade = Math.max(0, 1 - (scrolled / heroH));
    // Map to opacity range: if fade is 0, snow is fully hidden
    var globalAlpha = baseOpacity * fade;
    if (globalAlpha < 0.02) { requestAnimationFrame(draw); return; }

    for (var i = 0; i < COUNT; i++) {
      var p = particles[i];
      p.y += p.speed;
      p.x += p.wind + Math.sin(p.y * 0.02) * 0.3;
      if (p.y > H + 5) { p.y = -5; p.x = Math.random() * W; }
      if (p.x > W + 5) p.x = -5;
      if (p.x < -5) p.x = W + 5;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, ' + (p.opacity * globalAlpha) + ')';
      ctx.fill();
    }

    requestAnimationFrame(draw);
  }

  draw();

  // Handle SPA navigation: hide snow when leaving homepage, show when returning.
  // Hook history.pushState / replaceState since Swup uses them for page transitions.
  function updateCanvas() {
    canvas.style.display = isHomepage() ? '' : 'none';
  }

  var _push = history.pushState;
  history.pushState = function () {
    _push.apply(this, arguments);
    updateCanvas();
  };
  var _replace = history.replaceState;
  history.replaceState = function () {
    _replace.apply(this, arguments);
    updateCanvas();
  };
  window.addEventListener('popstate', updateCanvas);

  // Also catch Swup events (v3/v4)
  document.addEventListener('swup:contentReplaced', updateCanvas);
  document.addEventListener('swup:pageView', updateCanvas);
})();
