document.addEventListener('DOMContentLoaded', async () => {
  const response = await fetch('tips.json');
  const tipsData = await response.json();

  // Build mapping of tips by id and collect replies
  const tipsById = {};
  tipsData.forEach(t => {
    tipsById[t.id] = { ...t, replies: [] };
  });
  const topLevel = [];
  tipsData.forEach(t => {
    if (t.reply_to && tipsById[t.reply_to]) {
      tipsById[t.reply_to].replies.push(t);
    } else {
      topLevel.push(tipsById[t.id]);
    }
  });

  let filtered = [...topLevel];

  const searchInput = document.getElementById('searchInput');
  const sortSelect = document.getElementById('sortSelect');
  const themeToggle = document.getElementById('themeToggle');
  const topicsContainer = document.getElementById('topicsContainer');
  const resultsContainer = document.getElementById('results');

  // hidden tips IDs
  let hidden = JSON.parse(localStorage.getItem('hiddenTips') || '[]');

  // Build unique topics list
  const topicsSet = new Set();
  topLevel.forEach(tip => {
    if (Array.isArray(tip.topics) && tip.topics.length > 0) {
      tip.topics.forEach(topic => topicsSet.add(topic));
    } else {
      topicsSet.add('Разное');
    }
  });
  const topics = Array.from(topicsSet).sort();
  topics.forEach(topic => {
    const span = document.createElement('span');
    span.className = 'topic';
    span.textContent = topic;
    span.addEventListener('click', () => {
      span.classList.toggle('active');
      applyFilters();
    });
    topicsContainer.appendChild(span);
  });

  searchInput.addEventListener('input', applyFilters);
  sortSelect.addEventListener('change', applyFilters);
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark');
  });

  function applyFilters() {
    const searchTerm = searchInput.value.toLowerCase();
    const activeTopics = Array.from(topicsContainer.getElementsByClassName('active')).map(span => span.textContent);
    filtered = topLevel.filter(tip => {
      if (hidden.includes(tip.id)) return false;
      // topic filter
      if (activeTopics.length > 0) {
        if (!tip.topics || tip.topics.length === 0) {
          if (!activeTopics.includes('Разное')) return false;
        } else {
          const has = tip.topics.some(t => activeTopics.includes(t));
          if (!has) return false;
        }
      }
      // search filter
      const text = (tip.text || '').toLowerCase();
      const author = (tip.author || '').toLowerCase();
      const combinedTopics = (tip.topics || []).join(' ').toLowerCase();
      if (searchTerm && !(text.includes(searchTerm) || author.includes(searchTerm) || combinedTopics.includes(searchTerm))) {
        return false;
      }
      return true;
    });

    const sortValue = sortSelect.value;
    filtered.sort((a, b) => {
      if (sortValue === 'date') {
        return new Date(b.date) - new Date(a.date);
      } else if (sortValue === 'length') {
        return b.text.length - a.text.length;
      } else if (sortValue === 'author') {
        return (a.author || '').localeCompare(b.author || '');
      }
      return 0;
    });
    render();
  }

  function render() {
    resultsContainer.innerHTML = '';
    filtered.forEach(tip => {
      const card = document.createElement('div');
      card.className = 'card';

      // Author heading
      const h3 = document.createElement('h3');
      h3.textContent = tip.author || '';
      card.appendChild(h3);

      // Date meta
      const meta = document.createElement('div');
      meta.className = 'meta';
      const date = new Date(tip.date);
      meta.textContent = date.toLocaleDateString('fi-FI');
      card.appendChild(meta);

      // Main text with link formatting
      const p = document.createElement('p');
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const html = (tip.text || '').replace(urlRegex, url => `<a href="${url}" target="_blank">${url}</a>`);
      p.innerHTML = html;
      card.appendChild(p);

      // Topics chips inside card
      if (Array.isArray(tip.topics)) {
        const topicsDiv = document.createElement('div');
        tip.topics.forEach(t => {
          const chip = document.createElement('span');
          chip.className = 'topic';
          chip.textContent = t;
          chip.addEventListener('click', () => {
            const sidebarChip = Array.from(topicsContainer.children).find(s => s.textContent === t);
            if (sidebarChip) {
              sidebarChip.classList.toggle('active');
              applyFilters();
            }
          });
          topicsDiv.appendChild(chip);
        });
        card.appendChild(topicsDiv);
      }

      // delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete-btn';
      deleteBtn.innerHTML = '🗑️';
      deleteBtn.addEventListener('click', () => {
        hidden.push(tip.id);
        localStorage.setItem('hiddenTips', JSON.stringify(hidden));
        applyFilters();
      });
      card.appendChild(deleteBtn);

      // Replies
      if (tip.replies && tip.replies.length > 0) {
        const repliesContainer = document.createElement('div');
        repliesContainer.className = 'replies';
        tip.replies.forEach(reply => {
          const replyDiv = document.createElement('div');
          replyDiv.className = 'reply';
          const replyMeta = document.createElement('div');
          replyMeta.className = 'meta';
          const rDate = new Date(reply.date);
          replyMeta.textContent = `${reply.author || ''} · ${rDate.toLocaleDateString('fi-FI')}`;
          replyDiv.appendChild(replyMeta);
          const replyP = document.createElement('p');
          const replyHtml = (reply.text || '').replace(urlRegex, url => `<a href="${url}" target="_blank">${url}</a>`);
          replyP.innerHTML = replyHtml;
          replyDiv.appendChild(replyP);
          repliesContainer.appendChild(replyDiv);
        });
        card.appendChild(repliesContainer);
      }

      resultsContainer.appendChild(card);
    });
  }

  applyFilters();
});
