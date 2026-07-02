const fs = require('fs');

const API = 'https://slack.com/api';

async function callSlack(method, token, body, isForm) {
  const res = await fetch(`${API}/${method}`, {
    method: 'POST',
    headers: isForm
      ? { authorization: `Bearer ${token}` }
      : { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: isForm ? body : JSON.stringify(body)
  });
  const data = await res.json();
  if (!data.ok) {
    throw new Error(`Slack API ${method} failed: ${data.error || res.status}`);
  }
  return data;
}

function buildMessageText({ summary, recordingUrl, notifyTag }) {
  const lines = [];
  if (notifyTag) lines.push(notifyTag);
  lines.push('*Team Meeting Recap*');
  lines.push('');
  lines.push(summary.trim());
  lines.push('');
  if (recordingUrl) lines.push(`🎥 Recording: ${recordingUrl}`);
  return lines.join('\n');
}

/**
 * Uploads the infographic image to Slack and posts it to the channel with a
 * caption (summary + recording link + @channel tag) in a single message.
 */
async function postRecapToSlack({ imagePath, imageFilename, summary, recordingUrl }) {
  const token = process.env.SLACK_BOT_TOKEN;
  const channel = process.env.SLACK_CHANNEL_ID;
  if (!token) throw new Error('SLACK_BOT_TOKEN is not set. Add it to your .env file.');
  if (!channel) throw new Error('SLACK_CHANNEL_ID is not set. Add it to your .env file.');

  const notifyTag = process.env.SLACK_NOTIFY_TAG || '<!channel>';
  const fileBuffer = fs.readFileSync(imagePath);
  const stat = fs.statSync(imagePath);

  const uploadInfo = await callSlack('files.getUploadURLExternal', token, new URLSearchParams({
    filename: imageFilename,
    length: String(stat.size)
  }), true);

  const uploadForm = new FormData();
  uploadForm.append('file', new Blob([fileBuffer], { type: 'image/png' }), imageFilename);
  const uploadRes = await fetch(uploadInfo.upload_url, { method: 'POST', body: uploadForm });
  if (!uploadRes.ok) {
    throw new Error(`Slack file upload failed: ${uploadRes.status}`);
  }

  const complete = await callSlack('files.completeUploadExternal', token, {
    files: [{ id: uploadInfo.file_id, title: imageFilename }],
    channel_id: channel,
    initial_comment: buildMessageText({ summary, recordingUrl, notifyTag })
  }, false);

  const file = (complete.files || [])[0] || {};
  return {
    fileId: file.id,
    permalink: file.permalink || null
  };
}

module.exports = { postRecapToSlack };
