# DCH Team Meeting Recap Poster

A small internal web app that runs on the office Mac Mini. Emme pastes the Bubbles
meeting transcript, and the app:

1. Writes a summary of the meeting with Claude.
2. Generates a branded "Team Meeting Recap" infographic (same style as the July 1
   recap).
3. Posts the infographic + summary + recording link to `#dchlounge` in Slack,
   tagging everyone in the channel.
4. Adds the recap to a self-updating **Recap Archive** page, which you embed once
   into dchhub.com so new recaps show up there automatically.

Nothing about this app talks to Bubbles directly — Bubbles doesn't offer a public
API for pulling transcripts, so Emme pastes the transcript text in by hand (see
"Bubbles" note below).

---

## 1. One-time setup on the Mac Mini

### Install Node.js

Install Node 18 or newer. Easiest way on macOS:

```bash
brew install node
```

### Get the code onto the Mac Mini

```bash
git clone <this repo's URL> dchteammeetingrecap
cd dchteammeetingrecap
```

(Or `git pull` if it's already cloned.)

### Install dependencies

```bash
npm install
```

This also downloads a private copy of Chromium (via Playwright) that's used only to
render the infographic image — it does not install a visible browser app.

### Configure secrets

```bash
cp .env.example .env
```

Then open `.env` and fill in:

- `ANTHROPIC_API_KEY` — from https://console.anthropic.com (Settings → API Keys).
- `SLACK_BOT_TOKEN` and `SLACK_CHANNEL_ID` — see the Slack setup section below.
- The `COMPANY_*` values are already set for Dan Chin Homes; change them if the
  branding ever changes.

`.env` is never committed to git — it's the one file that's safe to store real
credentials in.

### Start the app

```bash
npm start
```

You'll see:

```
DCH Team Meeting Recap running at http://localhost:4747
Find your Mac Mini LAN IP (System Settings > Network) so Emme can reach it, e.g. http://192.168.1.50:4747
```

Find the Mac Mini's LAN IP address: **System Settings → Network → Wi-Fi/Ethernet →
Details → IP Address**. Give Emme that IP with the port, e.g.
`http://192.168.1.50:4747` — that's the URL she opens on her own computer (as long
as she's on the same office network/Wi-Fi).

### Keep it running permanently

`npm start` only runs while that terminal window is open. To have it start
automatically and stay running in the background, create a `launchd` job:

Create `~/Library/LaunchAgents/com.dch.meetingrecap.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>com.dch.meetingrecap</string>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/local/bin/node</string>
    <string>/Users/YOURUSER/dchteammeetingrecap/server.js</string>
  </array>
  <key>WorkingDirectory</key><string>/Users/YOURUSER/dchteammeetingrecap</string>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>/tmp/dch-meetingrecap.log</string>
  <key>StandardErrorPath</key><string>/tmp/dch-meetingrecap.err.log</string>
</dict>
</plist>
```

Replace `YOURUSER` and the `node` path (`which node` to confirm it), then load it:

```bash
launchctl load ~/Library/LaunchAgents/com.dch.meetingrecap.plist
```

Now the app restarts automatically if the Mac Mini reboots.

### Firewall

If macOS prompts "Do you want the application node to accept incoming network
connections?", click **Allow** — otherwise Emme's computer won't be able to reach
it.

---

## 2. Slack setup (one-time)

The app posts through a Slack **bot**, not a personal account, so the post always
comes from the same app no matter who's running it.

1. Go to https://api.slack.com/apps → **Create New App** → **From scratch**.
2. Name it something like "Meeting Recap Bot", pick your workspace.
3. In the app settings, go to **OAuth & Permissions** → scroll to **Scopes** → **Bot
   Token Scopes** → add:
   - `chat:write`
   - `files:write`
4. Scroll up and click **Install to Workspace**, approve it.
5. Copy the **Bot User OAuth Token** (starts with `xoxb-`) into `.env` as
   `SLACK_BOT_TOKEN`.
6. Invite the bot to the channel: in Slack, open `#dchlounge` and type
   `/invite @Meeting Recap Bot`.
7. Get the channel ID: in Slack, open `#dchlounge` → click the channel name at the
   top → scroll to the bottom of the "About" panel → copy the **Channel ID**
   (looks like `C0123ABC456`). Put it in `.env` as `SLACK_CHANNEL_ID`.

**About "@everyone":** Slack doesn't have an `@everyone` mention like Discord. The
closest equivalent is `<!channel>`, which notifies everyone currently in the
channel — that's what this app uses by default (`SLACK_NOTIFY_TAG` in `.env`). If
you'd rather it not notify everyone every time, set `SLACK_NOTIFY_TAG=` (blank) in
`.env`.

---

## 3. Using the app (for Emme)

1. Open the app URL on the office network (e.g. `http://192.168.1.50:4747`).
2. Paste the Bubbles recording URL.
3. Paste the full transcript text (see note below — this has to be text, not just
   the link).
4. Optionally set a meeting title/date.
5. Click **Generate & Post to Slack**.

Within about 30–60 seconds it will post directly to `#dchlounge` with the
infographic image, a summary, and the recording link, tagging the channel.

### About Bubbles

Bubbles (usebubbles.com) doesn't currently offer a public API or scrapeable page
that would let this app fetch the transcript automatically from just the
recording link — that's why the transcript has to be pasted in as text. In
Bubbles, use its **Copy transcript** / **Export** option and paste that into the
transcript box.

---

## 4. Adding recaps to dchhub.com

The app maintains a live **Recap Archive** page at:

```
http://<mac-mini-ip>:4747/recaps.html
```

It lists every recap ever posted (infographic, summary, recording link, Slack
link), newest first, and updates itself automatically every time Emme posts a new
one — no manual editing needed after the one-time setup below.

**One-time setup in Chrome:**

1. Open dchhub.com in Chrome and go into edit mode (Google Sites).
2. Click **Insert → Embed → By URL**.
3. Paste `http://<mac-mini-ip>:4747/recaps.html` and insert it.
4. Publish the site.

From then on, every new recap Emme posts shows up on dchhub.com automatically.

**Important caveat:** this only works for people viewing dchhub.com while on the
office network, because the Mac Mini's LAN IP isn't reachable from outside the
office (e.g. from home or a phone on cellular data). If you want the recap archive
visible from anywhere, the Mac Mini needs to be reachable from the internet — the
simplest safe way to do that is a tunnel like **Tailscale Funnel** or
**Cloudflare Tunnel**, which don't require opening ports on your router. That's a
separate follow-up if/when you need it; it isn't required for the office-network
use case described above.

---

## 5. Updating the branding or template

- Drop a `logo.png` into `public/assets/logo.png` and it'll automatically appear
  in the infographic header instead of the text logo.
- Colors, fonts, and layout live in `templates/infographicTemplate.js`.
- Company name/tagline/etc. are environment variables in `.env` (`COMPANY_*`).

## 6. Project structure

```
server.js                     Express server + /api routes
src/anthropic.js               Calls Claude to turn a transcript into structured recap content
src/infographic.js             Renders that content into a PNG via a headless browser
src/slack.js                   Uploads the PNG and posts it to Slack
src/store.js                   Reads/writes data/recaps.json (the archive)
templates/infographicTemplate.js   The HTML/CSS design of the infographic
public/index.html, app.js      The form Emme uses
public/recaps.html, recaps.js  The recap archive page (embed this in dchhub.com)
data/recaps.json               Recap history (created automatically, not in git)
data/images/                   Generated infographic PNGs (created automatically, not in git)
```
