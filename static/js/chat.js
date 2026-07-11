/* ── WanderAI Chat Engine ── */

// Send message to /api/chat and call callbacks
function sendChatMessage(message, history, profile, onSuccess, onError) {
  fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history, profile })
  })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        onError(data.error);
      } else {
        onSuccess(data.reply || '');
      }
    })
    .catch(err => onError(err.message || 'Network error'));
}

// ── Dashboard Chat Logic ── (only runs on dashboard page)
document.addEventListener('DOMContentLoaded', function () {
  const chatMessages = document.getElementById('chatMessages');
  if (!chatMessages) return; // not on dashboard

  let chatHistory = [];
  let travelerProfile = {};
  let chatCount = 0;

  // Load profile from server
  fetch('/api/get-profile')
    .then(r => r.json())
    .then(data => { if (data.profile) travelerProfile = data.profile; })
    .catch(() => {});

  // ── append a message bubble to chat
  function appendMessage(content, role) {
    const wrapper = document.createElement('div');
    wrapper.className = `chat-message ${role === 'user' ? 'user-message' : 'ai-message'}`;

    if (role === 'user') {
      wrapper.innerHTML = `
        <div class="msg-avatar user-av-full"><i class="bi bi-person-fill"></i></div>
        <div class="msg-bubble">${escapeHtml(content)}</div>`;
    } else {
      wrapper.innerHTML = `
        <div class="msg-avatar">✈</div>
        <div class="msg-bubble">${formatMarkdown(content)}</div>`;
    }
    chatMessages.appendChild(wrapper);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return wrapper;
  }

  // ── typing indicator
  function showTyping() {
    const el = document.createElement('div');
    el.className = 'chat-message ai-message';
    el.id = 'typingIndicator';
    el.innerHTML = `
      <div class="msg-avatar">✈</div>
      <div class="msg-bubble">
        <div class="typing-indicator">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      </div>`;
    chatMessages.appendChild(el);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function hideTyping() {
    const el = document.getElementById('typingIndicator');
    if (el) el.remove();
  }

  // ── send message
  window.sendMessage = function () {
    const input = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    const msg = (input.value || '').trim();
    if (!msg) return;

    input.value = '';
    input.style.height = 'auto';
    appendMessage(msg, 'user');
    chatHistory.push({ role: 'user', content: msg });

    sendBtn.disabled = true;
    sendBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
    showTyping();

    sendChatMessage(msg, chatHistory.slice(-10), travelerProfile,
      function (reply) {
        hideTyping();
        appendMessage(reply, 'ai');
        chatHistory.push({ role: 'assistant', content: reply });
        sendBtn.disabled = false;
        sendBtn.innerHTML = '<i class="bi bi-send-fill"></i>';
        chatCount++;
        const cc = document.getElementById('chatCount');
        if (cc) cc.textContent = chatCount;
      },
      function (err) {
        hideTyping();
        appendMessage('Sorry, I encountered an error: ' + err + ' Please check your API configuration.', 'ai');
        sendBtn.disabled = false;
        sendBtn.innerHTML = '<i class="bi bi-send-fill"></i>';
      }
    );
  };

  // ── keyboard shortcut
  const chatInput = document.getElementById('chatInput');
  if (chatInput) {
    chatInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }

  // ── suggestion buttons
  window.insertSuggestion = function (btn) {
    const input = document.getElementById('chatInput');
    if (input) {
      input.value = btn.textContent.trim();
      input.focus();
    }
  };

  // ── clear chat
  window.clearChat = function () {
    chatHistory = [];
    chatMessages.innerHTML = '';
    // Re-add welcome message
    const welcome = document.createElement('div');
    welcome.className = 'chat-message ai-message';
    welcome.innerHTML = `
      <div class="msg-avatar">✈</div>
      <div class="msg-bubble">
        <p class="mb-1">Chat cleared! I'm <strong>WanderAI</strong>, ready for your next adventure 🌍</p>
        <p class="mb-0">Where would you like to travel?</p>
      </div>`;
    chatMessages.appendChild(welcome);
  };

  // ── destination shortcut
  window.askAbout = function (destination) {
    const input = document.getElementById('chatInput');
    if (input) {
      input.value = `Tell me about visiting ${destination} — best time, highlights, and estimated budget.`;
      input.focus();
    }
  };
});
