function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}

async function load() {
  const list = document.getElementById('list');
  const res = await fetch('/api/recaps');
  const recaps = await res.json();

  if (!recaps.length) {
    list.innerHTML = '<div class="empty">No recaps posted yet.</div>';
    return;
  }

  list.innerHTML = recaps
    .map(
      (r) => `
      <div class="recap-card">
        <img src="recaps/images/${esc(r.imageFilename)}" alt="${esc(r.meetingTitle)} infographic" />
        <div class="body">
          <div class="date">${esc(formatDate(r.meetingDate))}</div>
          <h3>${esc(r.meetingTitle)}</h3>
          <p>${esc(r.summary)}</p>
          <div class="links">
            <a href="recaps/images/${esc(r.imageFilename)}" target="_blank" rel="noopener">Infographic</a>
            ${r.recordingUrl ? `<a href="${esc(r.recordingUrl)}" target="_blank" rel="noopener">Recording</a>` : ''}
            ${r.slackPermalink ? `<a href="${esc(r.slackPermalink)}" target="_blank" rel="noopener">Slack Post</a>` : ''}
          </div>
        </div>
      </div>`
    )
    .join('');
}

load();
