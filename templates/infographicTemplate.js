function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const EYEBROW_LABELS = {
  wins: 'Wins & Gratitude',
  focus: "This Week's Focus",
  stats: 'Proof It Works',
  reminders: "Don't Forget",
  calendar: 'Mark Your Calendar',
  generic: null
};

function renderWins(section) {
  const items = (section.items || [])
    .map(
      (it) => `
      <div class="card">
        <div class="card-title">${esc(it.title)}</div>
        <div class="card-body">${esc(it.body)}</div>
      </div>`
    )
    .join('');
  const quote = section.quote && section.quote.text
    ? `<div class="quote">
        <p>&ldquo;${esc(section.quote.text)}&rdquo;</p>
        ${section.quote.attribution ? `<span>${esc(section.quote.attribution).toUpperCase()}</span>` : ''}
      </div>`
    : '';
  return `<div class="card-grid">${items}</div>${quote}`;
}

function renderFocus(section) {
  const items = (section.items || [])
    .map(
      (it, i) => `
      <div class="numbered-row">
        <div class="num">${i + 1}</div>
        <div>
          <div class="numbered-title">${esc(it.title)}</div>
          <div class="numbered-body">${esc(it.body)}</div>
        </div>
      </div>`
    )
    .join('');
  return `<div class="numbered-list">${items}</div>`;
}

function renderStats(section) {
  const s = section.stats || {};
  const box = (data, label) =>
    data
      ? `<div class="stat-box">
          <div class="stat-box-label">${esc(label)}</div>
          <div class="stat-box-value">${esc(data.value)}</div>
          <div class="stat-box-sub">${esc(data.sub)}</div>
        </div>`
      : '';
  return `
    <div class="stats-row">
      ${box(s.before, s.before && s.before.label)}
      ${box(s.after, s.after && s.after.label)}
    </div>
    ${s.note ? `<div class="stats-note">${esc(s.note)}</div>` : ''}`;
}

function renderReminders(section) {
  const items = (section.items || [])
    .map((it) =>
      it.urgent
        ? `<div class="alert-card">
            <div class="alert-title">${esc(it.title)}</div>
            <div class="alert-body">${esc(it.body)}</div>
          </div>`
        : `<div class="card">
            <div class="card-title">${esc(it.title)}</div>
            <div class="card-body">${esc(it.body)}</div>
          </div>`
    )
    .join('');
  return `<div class="card-grid">${items}</div>`;
}

function renderCalendar(section) {
  const items = (section.items || [])
    .map(
      (it) => `
      <div class="cal-row">
        <div class="cal-chip">
          <div class="cal-month">${esc(it.monthLabel)}</div>
          <div class="cal-day">${esc(it.dateLabel)}</div>
        </div>
        <div>
          <div class="cal-title">${esc(it.title)}</div>
          <div class="cal-body">${esc(it.body)}</div>
        </div>
      </div>`
    )
    .join('');
  return `<div class="cal-list">${items}</div>`;
}

function renderGeneric(section) {
  const items = (section.items || [])
    .map(
      (it) => `
      <div class="generic-row">
        <div class="generic-dot"></div>
        <div>
          <div class="numbered-title">${esc(it.title)}</div>
          <div class="numbered-body">${esc(it.body)}</div>
        </div>
      </div>`
    )
    .join('');
  return `<div class="numbered-list">${items}</div>`;
}

function renderSection(section) {
  const eyebrow = EYEBROW_LABELS[section.type] || esc(section.heading).toUpperCase();
  const isStats = section.type === 'stats';
  let body = '';
  if (section.type === 'wins') body = renderWins(section);
  else if (section.type === 'focus') body = renderFocus(section);
  else if (section.type === 'stats') body = renderStats(section);
  else if (section.type === 'reminders') body = renderReminders(section);
  else if (section.type === 'calendar') body = renderCalendar(section);
  else body = renderGeneric(section);

  return `
    <section class="section ${isStats ? 'section-stats' : ''}">
      <div class="eyebrow">${esc(eyebrow)}</div>
      <h2>${esc(section.heading)}</h2>
      ${section.intro ? `<p class="section-intro">${esc(section.intro)}</p>` : ''}
      ${body}
    </section>`;
}

function buildInfographicHtml({ content, branding, logoDataUri }) {
  const sections = (content.sections || []).map(renderSection).join('\n');
  const logo = logoDataUri
    ? `<img src="${logoDataUri}" alt="${esc(branding.companyName)}" class="logo-img" />`
    : `<span class="logo-mark"></span><span>${esc(branding.companyName).toUpperCase()}</span>`;

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  :root {
    --ink: #201c1c;
    --red: #8a2020;
    --red-dark: #631515;
    --muted: #6b6560;
    --line: #e7e1da;
    --cream: #faf7f4;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: -apple-system, "Helvetica Neue", Helvetica, Arial, sans-serif;
    color: var(--ink);
    background: #ffffff;
    width: 1200px;
  }
  .topbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 28px 56px;
    border-bottom: 1px solid var(--line);
  }
  .logo-mark {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--red);
    margin-right: 10px;
  }
  .logo-img { height: 32px; margin-right: 10px; vertical-align: middle; }
  .topbar-left { font-weight: 700; letter-spacing: 1px; font-size: 15px; display: flex; align-items: center; }
  .topbar-right { text-align: right; }
  .topbar-right .kicker-small { color: var(--red); font-weight: 700; font-size: 12px; letter-spacing: 1.5px; text-transform: uppercase; }
  .topbar-right .subline { color: var(--muted); font-size: 12px; margin-top: 4px; }
  .hero {
    background: var(--ink);
    color: #fff;
    padding: 56px 56px 48px;
  }
  .hero .kicker {
    color: #e2a5a5;
    font-weight: 700;
    letter-spacing: 3px;
    text-transform: uppercase;
    font-size: 13px;
    margin-bottom: 18px;
  }
  .hero h1 {
    font-size: 56px;
    line-height: 1.05;
    margin: 0 0 20px;
    font-weight: 800;
    letter-spacing: -0.5px;
  }
  .hero p {
    color: #cfc9c5;
    font-size: 18px;
    max-width: 760px;
    margin: 0;
    line-height: 1.5;
  }
  .section { padding: 44px 56px; border-bottom: 1px solid var(--line); }
  .eyebrow { color: var(--red); font-weight: 700; letter-spacing: 2px; text-transform: uppercase; font-size: 12px; margin-bottom: 10px; }
  .section h2 { font-size: 30px; margin: 0 0 10px; font-weight: 800; }
  .section-intro { color: var(--muted); font-size: 16px; max-width: 820px; margin: 0 0 26px; line-height: 1.5; }
  .card-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
  .card { background: var(--cream); border-radius: 10px; padding: 22px 24px; }
  .card-title { font-weight: 700; font-size: 17px; margin-bottom: 8px; }
  .card-body { color: var(--muted); font-size: 15px; line-height: 1.5; }
  .quote { background: var(--cream); border-radius: 10px; padding: 24px 28px; margin-top: 22px; }
  .quote p { font-size: 17px; font-style: italic; margin: 0 0 10px; line-height: 1.5; }
  .quote span { color: var(--muted); font-size: 12px; letter-spacing: 1px; text-transform: uppercase; font-weight: 700; }
  .numbered-list { display: flex; flex-direction: column; gap: 20px; }
  .numbered-row, .generic-row { display: flex; gap: 18px; align-items: flex-start; }
  .num { flex: none; width: 32px; height: 32px; border-radius: 50%; background: var(--red); color: #fff; font-weight: 800; font-size: 15px; display: flex; align-items: center; justify-content: center; }
  .generic-dot { flex: none; width: 10px; height: 10px; margin-top: 8px; border-radius: 50%; background: var(--red); }
  .numbered-title { font-weight: 700; font-size: 16px; margin-bottom: 4px; }
  .numbered-body { color: var(--muted); font-size: 15px; line-height: 1.5; }
  .section-stats { background: var(--red); color: #fff; border-bottom: none; }
  .section-stats .eyebrow { color: #f2c9c9; }
  .section-stats .section-intro { color: #f2d9d9; }
  .stats-row { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-top: 4px; }
  .stat-box { background: rgba(255,255,255,0.12); border-radius: 10px; padding: 22px 24px; }
  .stat-box-label { font-size: 12px; letter-spacing: 1px; text-transform: uppercase; opacity: 0.85; margin-bottom: 8px; font-weight: 700; }
  .stat-box-value { font-size: 42px; font-weight: 800; margin-bottom: 6px; }
  .stat-box-sub { font-size: 14px; opacity: 0.9; }
  .stats-note { margin-top: 20px; font-size: 15px; opacity: 0.95; }
  .alert-card { grid-column: 1 / -1; background: var(--red-dark); color: #fff; border-radius: 10px; padding: 22px 24px; }
  .alert-title { font-weight: 800; font-size: 17px; margin-bottom: 8px; }
  .alert-body { font-size: 15px; line-height: 1.5; opacity: 0.95; }
  .cal-list { display: flex; flex-direction: column; gap: 16px; }
  .cal-row { display: flex; gap: 20px; align-items: center; padding-bottom: 16px; border-bottom: 1px solid var(--line); }
  .cal-row:last-child { border-bottom: none; padding-bottom: 0; }
  .cal-chip { flex: none; width: 56px; height: 56px; border-radius: 8px; background: var(--red); color: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .cal-month { font-size: 11px; font-weight: 700; letter-spacing: 1px; }
  .cal-day { font-size: 20px; font-weight: 800; }
  .cal-title { font-weight: 700; font-size: 16px; margin-bottom: 2px; }
  .cal-body { color: var(--muted); font-size: 14px; }
  .footer { background: var(--ink); color: #fff; padding: 48px 56px; text-align: center; }
  .footer .tagline { font-size: 28px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 14px; }
  .footer .tagwords { color: #b8b1ac; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 18px; }
  .footer .fine { color: #6f6a66; font-size: 11px; }
</style>
</head>
<body>
  <div class="topbar">
    <div class="topbar-left">${logo}</div>
    <div class="topbar-right">
      <div class="kicker-small">${esc(branding.companyKicker).toUpperCase()}</div>
      <div class="subline">${esc(branding.companySubline)}</div>
    </div>
  </div>
  <div class="hero">
    <div class="kicker">${esc(content.kicker)}</div>
    <h1>${esc(content.meetingTitle)}</h1>
    <p>${esc(content.heroSubtitle)}</p>
  </div>
  ${sections}
  <div class="footer">
    <div class="tagline">${esc(content.closingTagline)}</div>
    <div class="tagwords">${esc(branding.companyTagwords)}</div>
    <div class="fine">${esc(branding.companyName)} &middot; Internal team recap</div>
  </div>
</body>
</html>`;
}

module.exports = { buildInfographicHtml };
