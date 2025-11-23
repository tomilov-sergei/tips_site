document.addEventListener('DOMContentLoaded', async () => {
  const response = await fetch('tips.json');
  const tips = await response.json();
  let filtered = [...tips];
  const searchInput = document.getElementById('searchInput');
  const sortSelect = document.getElementById('sortSelect');
  const themeToggle = document.getElementById('themeToggle');
  const topicsContainer = document.getElementById('topicsContainer');
  const resultsContainer = document.getElementById('results');
  // hidden tips from localStorage
  let hidden = JSON.parse(localStorage.getItem('hiddenTips') || '[]');
  // Build topics list
  const topicsSet = new Set();
  tips.forEach(tip => {
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
  function applyFilters() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const activeTopics = Array.from(topicsContainer.children)
      .filter(child => child.classList.contains('active'))
      .map(child => child.textContent);
    filtered = tips.filter(tip => {
      const key = (tip.date || '') + '|' + tip.text;
      if (hidden.includes(key)) return false;
      const haystack = (tip.text + ' ' + (tip.author || '') + ' ' + ((tip.topics || []).join(' '))).toLowerCase();
      const matchesSearch = haystack.includes(searchTerm);
      const matchesTopics = activeTopics.length === 0 || (Array.isArray(tip.topics) ? activeTopics.every(t => tip.topics.includes(t)) : activeTopics.includes('Разное'));
      return matchesSearch && matchesTopics;
    });
    applySort();
    render();
  }
  function applySort() {
    const value = sortSelect.value;
    filtered.sort((a, b) => {
      if (value === 'date') {
        return new Date(b.date) - new Date(a.date);
      } else if (value === 'length') {
        return (b.text || '').length - (a.text || '').length;
      } else if (value === 'author') {
        return (a.author || '').localeCompare(b.author || '');
      }
      return 0;
    });
  }
  function render() {
    resultsContainer.innerHTML = '';
    filtered.forEach(tip => {
      const key = (tip.date || '') + '|' + tip.text;
      const card = document.createElement('div');
      card.className = 'card';
      if (tip.text && tip.text.length < 50) card.classList.add('short');
      if (tip.text && tip.text.length > 200) card.classList.add('long');
      const delBtn = document.createElement('button');
      delBtn.className = 'delete-btn';
      delBtn.textContent = '🗑️';
      delBtn.title = 'Скрыть';
      delBtn.addEventListener('click', () => {
        if (!hidden.includes(key)) {
          hidden.push(key);
          localStorage.setItem('hiddenTips', JSON.stringify(hidden));
          applyFilters();
        }
      });
      const h3 = document.createElement('h3');
      h3.textContent = tip.author || 'Аноним';
      const meta = document.createElement('div');
      meta.className = 'meta';
      try {
        const dateObj = new Date(tip.date);
        meta.textContent = dateObj.toLocaleString();
      } catch (e) {
        meta.textContent = tip.date;
      }
      const p = document.createElement('p');
      p.textContent = tip.text;
      const topicDiv = document.createElement('div');
      if (tip.topics && tip.topics.length > 0) {
        tip.topics.forEach(topic => {
          const tSpan = document.createElement('span');
          tSpan.className = 'topic';
          tSpan.textContent = topic;
          tSpan.addEventListener('click', () => {
            const side = Array.from(topicsContainer.children).find(el => el.textContent === topic);
            if (side) {
              side.classList.toggle('active');
              applyFilters();
            }
          });
          topicDiv.appendChild(tSpan);
        });
      }
      card.appendChild(delBtn);
      card.appendChild(h3);
      card.appendChild(meta);
      card.appendChild(p);
      card.appendChild(topicDiv);
      resultsContainer.appendChild(card);
    });
  }
  searchInput.addEventListener('input', () => applyFilters());
  sortSelect.addEventListener('change', () => { applySort(); render(); });
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark');
  });
  applyFilters();
});
