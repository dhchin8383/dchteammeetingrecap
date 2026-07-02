require('dotenv').config();
const path = require('path');
const crypto = require('crypto');
const express = require('express');

const { generateRecapContent } = require('./src/anthropic');
const { renderInfographic } = require('./src/infographic');
const { postRecapToSlack } = require('./src/slack');
const { listRecaps, addRecap } = require('./src/store');

const app = express();
app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/recaps/images', express.static(path.join(__dirname, 'data', 'images')));

app.get('/api/recaps', (req, res) => {
  res.json(listRecaps());
});

app.post('/api/generate', async (req, res) => {
  const { meetingTitle, meetingDate, recordingUrl, transcript } = req.body || {};
  const dryRun = req.query.dryRun === '1';

  if (!transcript || !transcript.trim()) {
    return res.status(400).json({ error: 'Paste the meeting transcript text.' });
  }

  const id = crypto.randomBytes(6).toString('hex');

  try {
    const content = await generateRecapContent({
      transcript,
      meetingDate: meetingDate || null
    });
    if (meetingTitle && meetingTitle.trim()) {
      content.meetingTitle = meetingTitle.trim();
    }

    const { filePath, filename } = await renderInfographic({ content, id });

    let slackResult = { fileId: null, permalink: null };
    if (!dryRun) {
      slackResult = await postRecapToSlack({
        imagePath: filePath,
        imageFilename: filename,
        summary: content.slackSummary,
        recordingUrl: recordingUrl || null
      });
    }

    const recap = {
      id,
      meetingTitle: content.meetingTitle,
      meetingDate: meetingDate || null,
      recordingUrl: recordingUrl || null,
      summary: content.slackSummary,
      imageFilename: filename,
      slackPermalink: slackResult.permalink,
      createdAt: new Date().toISOString()
    };
    addRecap(recap);

    res.json({ ok: true, recap, dryRun });
  } catch (err) {
    console.error('generate failed:', err);
    res.status(500).json({ error: err.message || 'Something went wrong generating the recap.' });
  }
});

const PORT = process.env.PORT || 4747;
app.listen(PORT, () => {
  console.log(`DCH Team Meeting Recap running at http://localhost:${PORT}`);
  console.log('Find your Mac Mini LAN IP (System Settings > Network) so Emme can reach it, e.g. http://192.168.1.50:' + PORT);
});
