const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

const RECAP_SCHEMA = {
  name: 'emit_recap',
  description: 'Structured content for a team meeting recap infographic and Slack post.',
  input_schema: {
    type: 'object',
    additionalProperties: false,
    required: ['meetingTitle', 'kicker', 'heroSubtitle', 'slackSummary', 'sections', 'closingTagline'],
    properties: {
      meetingTitle: { type: 'string', description: 'Big headline, e.g. "TEAM MEETING RECAP"' },
      kicker: { type: 'string', description: 'Small label above the headline, e.g. "TEAM MEETING · JULY 1, 2026"' },
      heroSubtitle: { type: 'string', description: 'One sentence teaser summarizing the meeting, shown under the headline.' },
      slackSummary: {
        type: 'string',
        description: 'A punchy Slack-ready summary of the meeting in Slack mrkdwn (use *bold* and "• " bullets, no headers). 4-8 lines covering the key highlights, decisions, and action items.'
      },
      closingTagline: { type: 'string', description: 'Short punchy closing line for the footer, e.g. "Let\'s keep selling houses."' },
      sections: {
        type: 'array',
        description: 'Ordered content sections built from what was actually discussed. Omit a section type entirely if the transcript has nothing for it. Use at most one of each type except "generic".',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['type', 'heading'],
          properties: {
            type: {
              type: 'string',
              enum: ['wins', 'focus', 'stats', 'reminders', 'calendar', 'generic'],
              description: 'wins=celebrations/gratitude, focus=key playbook or discussion topics (numbered), stats=a before/after or metric comparison, reminders=operational reminders/warnings, calendar=upcoming dates/events, generic=anything else worth including (e.g. action items, blockers).'
            },
            heading: { type: 'string' },
            intro: { type: 'string', description: 'Optional one-sentence intro under the heading.' },
            quote: {
              type: 'object',
              additionalProperties: false,
              properties: {
                text: { type: 'string' },
                attribution: { type: 'string' }
              },
              description: 'Optional standout quote, only for a "wins" section.'
            },
            items: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  title: { type: 'string' },
                  body: { type: 'string' },
                  urgent: { type: 'boolean', description: 'Only for reminders: true = show as a bold red warning card.' },
                  dateLabel: { type: 'string', description: 'Only for calendar items, e.g. "23" (day of month).' },
                  monthLabel: { type: 'string', description: 'Only for calendar items, e.g. "JUL".' }
                }
              }
            },
            stats: {
              type: 'object',
              additionalProperties: false,
              description: 'Only for a "stats" section: a before/after comparison.',
              properties: {
                subject: { type: 'string', description: 'Who/what the stats are about.' },
                before: {
                  type: 'object',
                  additionalProperties: false,
                  properties: { label: { type: 'string' }, value: { type: 'string' }, sub: { type: 'string' } }
                },
                after: {
                  type: 'object',
                  additionalProperties: false,
                  properties: { label: { type: 'string' }, value: { type: 'string' }, sub: { type: 'string' } }
                },
                note: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }
};

const SYSTEM_PROMPT = `You turn internal real-estate team meeting transcripts into a recap for two outputs:
1) An internal Slack post (a short, punchy summary).
2) A branded infographic (structured sections).

Only use information present in the transcript. Do not invent names, numbers, or events that were not mentioned.
Keep tone upbeat and direct, matching an internal team-culture recap (celebration of wins, clear action items, practical reminders).
Prefer concrete numbers and names when the transcript gives them. Keep every text field concise — this is a scannable recap, not a full transcript.
Call the emit_recap tool exactly once with the complete structured result.`;

async function generateRecapContent({ transcript, meetingDate }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set. Add it to your .env file.');
  }
  const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';

  const userMessage = `Meeting date: ${meetingDate || 'unspecified'}\n\nTRANSCRIPT:\n"""\n${transcript}\n"""`;

  const res = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      tools: [RECAP_SCHEMA],
      tool_choice: { type: 'tool', name: 'emit_recap' },
      messages: [{ role: 'user', content: userMessage }]
    })
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Anthropic API error ${res.status}: ${body}`);
  }

  const data = await res.json();
  const toolUse = (data.content || []).find((block) => block.type === 'tool_use' && block.name === 'emit_recap');
  if (!toolUse) {
    throw new Error('Anthropic response did not include the expected structured output.');
  }
  return toolUse.input;
}

module.exports = { generateRecapContent };
