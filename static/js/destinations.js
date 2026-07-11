/* ── Destinations JS ── */

document.addEventListener('DOMContentLoaded', function () {
  initInterestTags('prefTags', 'selectedPrefs');
});

window.discoverDestinations = function () {
  const prefs = document.getElementById('selectedPrefs').value || 'Beaches, History, Culture';
  const budget = document.getElementById('destBudget').value;
  const season = document.getElementById('travelSeason').value;
  const addl = document.getElementById('addlPrefs').value.trim();
  const preferences = prefs + (addl ? ', ' + addl : '');

  const btn = document.getElementById('discoverBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Discovering...';

  document.getElementById('featuredSection').classList.add('d-none');
  document.getElementById('aiResultsPanel').classList.add('d-none');
  document.getElementById('destLoading').classList.remove('d-none');

  fetch('/api/recommend-destinations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ preferences, budget, season })
  })
    .then(r => r.json())
    .then(data => {
      document.getElementById('destLoading').classList.add('d-none');
      if (data.error) {
        showToast('Error: ' + data.error, 'error');
        document.getElementById('featuredSection').classList.remove('d-none');
      } else {
        document.getElementById('aiDestOutput').innerHTML = formatMarkdown(data.recommendations);
        document.getElementById('aiResultsPanel').classList.remove('d-none');
        window._lastDestRec = data.recommendations;
      }
    })
    .catch(err => {
      document.getElementById('destLoading').classList.add('d-none');
      document.getElementById('featuredSection').classList.remove('d-none');
      showToast('Request failed: ' + err.message, 'error');
    })
    .finally(() => {
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-stars me-2"></i>Discover Destinations';
    });
};

window.resetDestinations = function () {
  document.getElementById('aiResultsPanel').classList.add('d-none');
  document.getElementById('featuredSection').classList.remove('d-none');
};

window.askAboutDestination = function (destination) {
  // Navigate to dashboard with a pre-filled query
  const query = encodeURIComponent(`Tell me about visiting ${destination} — highlights, best time to visit, estimated budget, and top experiences.`);
  window.location.href = `/dashboard?q=${query}`;
};
