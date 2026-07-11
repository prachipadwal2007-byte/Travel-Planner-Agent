/* ── Dashboard Extra Logic ── */

document.addEventListener('DOMContentLoaded', function () {
  // ── Pre-fill chat from URL ?q= param (e.g. from Destinations page)
  const urlParams = new URLSearchParams(window.location.search);
  const preQuery = urlParams.get('q');
  if (preQuery) {
    const input = document.getElementById('chatInput');
    if (input) {
      input.value = decodeURIComponent(preQuery);
      // Auto-send after a short delay
      setTimeout(() => { if (typeof sendMessage === 'function') sendMessage(); }, 600);
    }
    // Clean URL
    window.history.replaceState({}, '', '/dashboard');
  }

  // ── Tips Carousel auto-rotate
  const tips = document.querySelectorAll('.tip-item');
  if (tips.length) {
    let idx = 0;
    setInterval(function () {
      tips.forEach(t => t.classList.remove('active'));
      idx = (idx + 1) % tips.length;
      tips[idx].classList.add('active');
    }, 5000);
  }

  // ── Navbar toggler icon
  const toggler = document.querySelector('.navbar-toggler');
  if (toggler) {
    toggler.addEventListener('click', function () {
      const icon = this.querySelector('i');
      if (icon) {
        const isOpen = document.getElementById('navMenu').classList.contains('show');
        icon.className = isOpen ? 'bi bi-list' : 'bi bi-x-lg';
      }
    });
  }
});
