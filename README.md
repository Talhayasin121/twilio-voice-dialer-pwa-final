# Twilio Voice Dialer PWA

A premium, fully-functional browser-based phone dialer powered by **Twilio Voice JavaScript SDK 2.x**, built as a **Progressive Web App** with **Next.js**, deployable on **Vercel**.

## Features

- 📞 **Outbound Calling** — Dial any US number via Twilio PSTN
- 🔢 **DTMF Tones** — Send touch-tone digits during active calls
- 🎤 **Mute/Unmute** — Toggle microphone during calls
- ⏱️ **Call Timer** — Live elapsed time display
- 📋 **Call History** — Persistent log of recent calls (localStorage)
- 📶 **Network Quality** — Real-time warnings for poor connectivity
- ⭐ **Call Feedback** — Post-call quality rating
- 🔄 **Auto Token Refresh** — Proactive token renewal
- 📱 **PWA** — Installable on mobile, offline shell
- 🌙 **Dark Glassmorphism UI** — Premium design with animations

## Prerequisites

1. A [Twilio account](https://www.twilio.com/try-twilio) with a purchased phone number
2. Node.js 18+ installed
3. A [Vercel account](https://vercel.com) for deployment

## Twilio Console Setup

1. **Create an API Key**: Go to Account → API Keys → Create API Key. Save the **SID** and **Secret**.
2. **Create a TwiML App**: Go to Voice → TwiML → TwiML Apps → Create new.
   - Name: `Voice Dialer`
   - Voice Request URL: `https://YOUR-VERCEL-DOMAIN/api/voice` (set after deploying)
   - Method: `POST`
3. Note down your **TwiML App SID** (starts with `AP`).

## Environment Variables

Create `.env.local` with:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_KEY=SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_SECRET=your_api_secret_here
TWILIO_TWIML_APP_SID=APxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
```

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Note**: Calls won't work on localhost unless you use ngrok to create an HTTPS tunnel and update your TwiML App's Voice URL.

## Deploy to Vercel

1. Push this code to a GitHub repository
2. Import the project on [Vercel](https://vercel.com/new)
3. Add all environment variables in Vercel's project settings
4. Deploy
5. **Update your TwiML App's Voice URL** in Twilio Console to: `https://your-project.vercel.app/api/voice`

## Tech Stack

- **Next.js 16** (App Router)
- **@twilio/voice-sdk** 2.x
- **twilio** Node.js SDK (server-side)
- **@ducanh2912/next-pwa** for PWA support
- **Vanilla CSS** with glassmorphism design system
