/* ── Profile JS ── */

document.addEventListener('DOMContentLoaded', function () {
  // Init selectors
  initBudgetSelector('profBudgetSelector', 'profBudget');
  initInterestTags('profInterestTags', 'profInterests');
  initStyleSelector();

  // Load saved profile
  loadProfile();

  // Live preview update
  ['profName', 'profCountry', 'profGroup', 'profDietary'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', updatePreview);
    if (el && el.tagName === 'SELECT') el.addEventListener('change', updatePreview);
  });
});

function initStyleSelector() {
  const container = document.getElementById('styleSelector');
  const hidden = document.getElementById('profStyle');
  if (!container || !hidden) return;

  container.querySelectorAll('.style-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      container.querySelectorAll('.style-btn').forEach(b => b.classList.remove('selected'));
      this.classList.add('selected');
      hidden.value = this.dataset.value;
      updatePreview();
    });
  });
}

function updatePreview() {
  const name = document.getElementById('profName').value || 'Your Name';
  const country = document.getElementById('profCountry').value || '—';
  const group = document.getElementById('profGroup').value || '—';
  const dietary = document.getElementById('profDietary').value || '—';
  const style = document.getElementById('profStyle').value || 'Not set';
  const budget = document.getElementById('profBudget').value || '—';
  const interests = document.getElementById('profInterests').value || '';

  // Update display name
  const dn = document.getElementById('profileDisplayName');
  if (dn) dn.textContent = name;
  const ds = document.getElementById('profileDisplayStyle');
  if (ds) ds.textContent = `Travel Style: ${style}`;

  // Update traveler card
  setCardField('tcName', name);
  setCardField('tcStyle', style || 'Not set');
  setCardField('tcCountry', country);
  setCardField('tcGroup', group);
  setCardField('tcBudget', budget);
  setCardField('tcDietary', dietary);

  // Update interests chips
  const tcInterests = document.getElementById('tcInterests');
  if (tcInterests && interests) {
    tcInterests.innerHTML = interests.split(',').map(i =>
      `<span class="dest-tag">${i.trim()}</span>`
    ).join('');
  }

  // Avatar emoji based on style
  const avatars = {
    'Backpacker': '🎒', 'City Explorer': '🏙', 'Beach Lover': '🏖',
    'Nature Seeker': '🌿', 'Luxury Traveler': '💎', 'Photographer': '📷'
  };
  const emoji = avatars[style] || '🧳';
  ['profileAvatar', 'tcAvatar'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = emoji;
  });
}

function setCardField(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function loadProfile() {
  fetch('/api/get-profile')
    .then(r => r.json())
    .then(data => {
      if (!data.profile || !Object.keys(data.profile).length) return;
      const p = data.profile;

      setInputVal('profName', p.name);
      setInputVal('profCountry', p.home_country);
      setInputVal('profPassport', p.passport);
      setSelectVal('profGroup', p.group_type);
      setSelectVal('profDietary', p.dietary);

      // Budget selector
      const budgetBtns = document.querySelectorAll('#profBudgetSelector .budget-btn');
      budgetBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.value === p.budget_tier);
      });
      const profBudget = document.getElementById('profBudget');
      if (profBudget) profBudget.value = p.budget_tier || 'Mid-range';

      // Style selector
      document.querySelectorAll('#styleSelector .style-btn').forEach(btn => {
        if (btn.dataset.value === p.travel_style) {
          btn.classList.add('selected');
          const hidden = document.getElementById('profStyle');
          if (hidden) hidden.value = p.travel_style;
        }
      });

      // Interests
      if (p.interests) {
        const selectedInterests = p.interests.split(',').map(s => s.trim());
        document.querySelectorAll('#profInterestTags .interest-tag').forEach(tag => {
          if (selectedInterests.includes(tag.dataset.value)) {
            tag.classList.add('selected');
          }
        });
        const hidden = document.getElementById('profInterests');
        if (hidden) hidden.value = p.interests;
      }

      updatePreview();
    })
    .catch(() => {});
}

function setInputVal(id, val) {
  const el = document.getElementById(id);
  if (el && val) el.value = val;
}

function setSelectVal(id, val) {
  const el = document.getElementById(id);
  if (el && val) el.value = val;
}

window.saveProfile = function () {
  const profile = {
    name: document.getElementById('profName').value,
    home_country: document.getElementById('profCountry').value,
    passport: document.getElementById('profPassport').value,
    travel_style: document.getElementById('profStyle').value,
    group_type: document.getElementById('profGroup').value,
    budget_tier: document.getElementById('profBudget').value,
    dietary: document.getElementById('profDietary').value,
    interests: document.getElementById('profInterests').value
  };

  fetch('/api/save-profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile)
  })
    .then(r => r.json())
    .then(data => {
      if (data.status === 'success') {
        const toast = document.getElementById('profileToast');
        if (toast) {
          toast.classList.remove('d-none');
          setTimeout(() => toast.classList.add('d-none'), 4000);
        }
        showToast('Profile saved successfully!');
        updatePreview();
      } else {
        showToast('Failed to save profile.', 'error');
      }
    })
    .catch(() => showToast('Network error. Try again.', 'error'));
};

window.clearProfile = function () {
  if (!confirm('Clear your profile? This cannot be undone.')) return;
  ['profName', 'profCountry', 'profPassport'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('profStyle').value = '';
  document.getElementById('profInterests').value = '';
  document.querySelectorAll('#styleSelector .style-btn').forEach(b => b.classList.remove('selected'));
  document.querySelectorAll('#profInterestTags .interest-tag').forEach(t => t.classList.remove('selected'));
  updatePreview();
  showToast('Profile cleared.', 'info');
};
