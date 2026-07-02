const form = document.getElementById('recap-form');
const statusEl = document.getElementById('status');
const submitBtn = document.getElementById('submit-btn');
const resultEl = document.getElementById('result');
const resultImg = document.getElementById('result-img');
const resultSummary = document.getElementById('result-summary');
const resultSlackLink = document.getElementById('result-slack-link');

const dateInput = document.getElementById('meetingDate');
if (!dateInput.value) {
  dateInput.valueAsDate = new Date();
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  statusEl.className = 'working';
  statusEl.textContent = 'Generating summary and infographic, then posting to Slack… this can take up to a minute.';
  resultEl.style.display = 'none';
  submitBtn.disabled = true;

  const payload = {
    meetingTitle: document.getElementById('meetingTitle').value,
    meetingDate: document.getElementById('meetingDate').value,
    recordingUrl: document.getElementById('recordingUrl').value,
    transcript: document.getElementById('transcript').value
  };

  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Something went wrong.');

    statusEl.className = '';
    statusEl.textContent = 'Posted to #dchlounge!';
    resultImg.src = `recaps/images/${data.recap.imageFilename}`;
    resultSummary.textContent = data.recap.summary;
    if (data.recap.slackPermalink) {
      resultSlackLink.href = data.recap.slackPermalink;
      resultSlackLink.style.display = 'inline';
    } else {
      resultSlackLink.style.display = 'none';
    }
    resultEl.style.display = 'block';
    form.reset();
    dateInput.valueAsDate = new Date();
  } catch (err) {
    statusEl.className = 'error';
    statusEl.textContent = err.message;
  } finally {
    submitBtn.disabled = false;
  }
});
