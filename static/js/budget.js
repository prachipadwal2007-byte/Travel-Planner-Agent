/* ── Budget Planner JS ── */

document.addEventListener('DOMContentLoaded', function () {
  initBudgetSelector('budgetTierSelector', 'budgetTierVal');
});

window.generateBudget = function () {
  const destination = document.getElementById('budgetDest').value.trim();
  const days = parseInt(document.getElementById('budgetDays').value) || 7;
  const travelers = parseInt(document.getElementById('numTravelers').value) || 1;
  const budgetTier = document.getElementById('budgetTierVal').value;

  if (!destination) {
    showToast('Please enter a destination.', 'error');
    document.getElementById('budgetDest').focus();
    return;
  }

  const btn = document.getElementById('budgetBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Calculating...';

  document.getElementById('budgetPlaceholder').classList.add('d-none');
  document.getElementById('budgetResult').classList.add('d-none');
  document.getElementById('budgetLoading').classList.remove('d-none');

  fetch('/api/budget-planner', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ destination, days, travelers, budget_tier: budgetTier })
  })
    .then(r => r.json())
    .then(data => {
      document.getElementById('budgetLoading').classList.add('d-none');
      if (data.error) {
        showToast('Error: ' + data.error, 'error');
        document.getElementById('budgetPlaceholder').classList.remove('d-none');
      } else {
        document.getElementById('budgetTitle').textContent =
          `${days}-Day ${destination} Budget`;
        document.getElementById('budgetMeta').textContent =
          `${travelers} traveler${travelers > 1 ? 's' : ''} · ${budgetTier} · IBM Granite AI`;
        document.getElementById('budgetOutput').innerHTML = formatMarkdown(data.budget_plan);
        document.getElementById('budgetResult').classList.remove('d-none');
        window._lastBudget = data.budget_plan;

        if (window.innerWidth < 992) {
          document.getElementById('budgetResult').scrollIntoView({ behavior: 'smooth' });
        }
      }
    })
    .catch(err => {
      document.getElementById('budgetLoading').classList.add('d-none');
      document.getElementById('budgetPlaceholder').classList.remove('d-none');
      showToast('Request failed: ' + err.message, 'error');
    })
    .finally(() => {
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-calculator me-2"></i>Calculate Budget';
    });
};

window.copyBudget = function () {
  if (window._lastBudget) {
    copyToClipboard(window._lastBudget);
  }
};
