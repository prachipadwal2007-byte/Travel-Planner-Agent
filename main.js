/* ── WanderAI Main JS — Shared Utilities ── */

// ── Markdown → HTML formatter
function formatMarkdown(text) {
  if (!text) return '';
  return text
    // Headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold + italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Horizontal rule
    .replace(/^---$/gm, '<hr/>')
    // Unordered lists
    .replace(/^\s*[-•]\s+(.+)$/gm, '<li>$1</li>')
    // Numbered lists
    .replace(/^\s*\d+\.\s+(.+)$/gm, '<li>$1</li>')
    // Wrap consecutive <li> in <ul>
    .replace(/(<li>.*<\/li>\n?)+/g, m => `<ul>${m}</ul>`)
    // Paragraphs (double newline)
    .replace(/\n\n/g, '</p><p>')
    // Single newline to <br>
    .replace(/\n/g, '<br/>')
    // Wrap in paragraphs if not already wrapped
    .replace(/^(?!<[houpl]|<br)(.+)$/gm, (m) => m.startsWith('<') ? m : `<p>${m}</p>`);
}

// ── HTML escape
function escapeHtml(text) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(text));
  return div.innerHTML;
}

// ── Show toast notification
function showToast(msg, type = 'success') {
  const existing = document.getElementById('wanderToast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'wanderToast';
  toast.style.cssText = `
    position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 9999;
    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
    color: white; padding: .75rem 1.25rem; border-radius: 10px;
    font-size: .875rem; font-weight: 500; box-shadow: 0 4px 16px rgba(0,0,0,.2);
    display: flex; align-items: center; gap: .5rem;
    animation: slideInRight .3s ease;
    max-width: 340px;
  `;
  toast.innerHTML = `<i class="bi bi-${type === 'success' ? 'check-circle' : type === 'error' ? 'x-circle' : 'info-circle'}-fill"></i> ${escapeHtml(msg)}`;

  // Add animation
  const style = document.createElement('style');
  style.textContent = `@keyframes slideInRight { from { opacity:0; transform: translateX(20px); } to { opacity:1; transform: none; } }`;
  document.head.appendChild(style);

  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity .4s'; setTimeout(() => toast.remove(), 400); }, 3500);
}

// ── Copy to clipboard
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('Copied to clipboard!');
  }).catch(() => {
    showToast('Copy failed — please select and copy manually.', 'error');
  });
}

// ── Intersection Observer for fade-in animations
document.addEventListener('DOMContentLoaded', function () {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.animationPlayState = 'running';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.fade-in-up, .fade-in-right').forEach(el => {
    el.style.animationPlayState = 'paused';
    observer.observe(el);
  });

  // Auto-resize textareas
  document.querySelectorAll('textarea.chat-textarea').forEach(ta => {
    ta.addEventListener('input', function () {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });
  });
});

// ── Budget/Interest selector helpers (shared)
function initBudgetSelector(selectorId, hiddenId) {
  const container = document.getElementById(selectorId);
  const hidden = document.getElementById(hiddenId);
  if (!container || !hidden) return;

  container.querySelectorAll('.budget-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      container.querySelectorAll('.budget-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      hidden.value = this.dataset.value;
    });
  });
}

function initInterestTags(containerId, hiddenId) {
  const container = document.getElementById(containerId);
  const hidden = document.getElementById(hiddenId);
  if (!container || !hidden) return;

  function updateHidden() {
    const selected = [...container.querySelectorAll('.interest-tag.selected')]
      .map(t => t.dataset.value);
    hidden.value = selected.join(',');
  }

  container.querySelectorAll('.interest-tag').forEach(tag => {
    if (tag.classList.contains('selected')) {} // already selected
    tag.addEventListener('click', function () {
      this.classList.toggle('selected');
      updateHidden();
    });
  });
  updateHidden();
}
