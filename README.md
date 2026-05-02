# Universal Interface Adapter — AI Accessibility Layer

> An AI-powered Chrome Extension that transforms **any website** into an accessible, personalized UI in real time — for users with low vision, color blindness, low literacy, or language barriers.

---

## 📁 Project Structure

```
universal-interface-adapter/
├── extension/                  # Chrome Extension (Manifest V3)
│   ├── manifest.json           # Extension config + permissions
│   ├── content.js              # Injected into every webpage
│   ├── content.css             # Injected CSS (isolated)
│   ├── background.js           # Service worker (API calls)
│   ├── popup.html              # Toolbar popup UI
│   ├── overlay.html            # Iframe shell for React app
│   └── icons/                  # Extension icons (you must add)
│
├── frontend/                   # React Overlay UI
│   ├── src/
│   │   ├── overlay/
│   │   │   ├── main.jsx        # React entry point
│   │   │   ├── App.jsx         # Root app + bridge
│   │   │   └── index.css       # Global styles + Tailwind
│   │   ├── components/
│   │   │   ├── Header.jsx      # Panel header + toggle
│   │   │   ├── TabBar.jsx      # Bottom navigation
│   │   │   ├── DashboardTab.jsx
│   │   │   ├── ModesTab.jsx    # Accessibility mode toggles
│   │   │   ├── VoiceTab.jsx    # Voice commands UI
│   │   │   ├── ExplainTab.jsx  # AI page explanation
│   │   │   └── SettingsTab.jsx # Preferences + language
│   │   └── hooks/
│   │       └── useBridge.js    # iframe ↔ content script bridge
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.extension.config.js
│
├── backend/                    # Node.js + Express API
│   ├── server.js               # Express app + middleware
│   ├── routes/
│   │   ├── ai.js
│   │   ├── user.js
│   │   └── analytics.js
│   ├── controllers/
│   │   ├── aiController.js
│   │   ├── userController.js
│   │   └── analyticsController.js
│   ├── middleware/
│   │   ├── auth.js             # Firebase token verification
│   │   └── firebase.js         # Firebase Admin SDK init
│   ├── package.json
│   └── .env.example
│
└── ai/
    └── aiService.js            # OpenAI integration (all prompts)
```

---

## 🚀 Setup Guide (Step by Step)

### Prerequisites
- Node.js 18+
- npm or yarn
- Google Chrome (latest)
- OpenAI API key ([platform.openai.com](https://platform.openai.com))
- Firebase project ([console.firebase.google.com](https://console.firebase.google.com))

---

### Step 1 — Clone & Install

```bash
# Clone the repo
git clone https://github.com/your-username/universal-interface-adapter.git
cd universal-interface-adapter

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

---

### Step 2 — Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **"Add project"** → name it `universal-interface-adapter`
3. Enable **Authentication**:
   - Build → Authentication → Sign-in method
   - Enable **Google** and/or **Email/Password**
4. Enable **Firestore**:
   - Build → Firestore Database → Create database
   - Start in **test mode** (you'll add security rules later)
5. Get Admin SDK credentials:
   - Project Settings (gear icon) → **Service Accounts**
   - Click **"Generate new private key"** → download JSON
6. Copy your credentials to backend `.env`:

```bash
cd backend
cp .env.example .env
# Edit .env with your actual values
```

**Firestore Security Rules** (Firestore → Rules):
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /analytics/{doc} {
      allow write: if true;
      allow read: if false;
    }
  }
}
```

---

### Step 3 — Configure Backend Environment

Edit `backend/.env`:

```env
OPENAI_API_KEY=sk-your-actual-openai-key
OPENAI_MODEL=gpt-4o-mini
PORT=4000
NODE_ENV=development

# From Firebase Console → Project Settings → Service Accounts
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nXXX\n-----END PRIVATE KEY-----\n"

# Add your extension ID after loading it in Chrome (Step 5)
ALLOWED_ORIGINS=chrome-extension://YOUR_EXTENSION_ID,http://localhost:3000
```

---

### Step 4 — Build the React Overlay

```bash
cd frontend

# Build the React app into the extension folder
npm run build:extension
```

This outputs `overlay.js` and `overlay.css` into the `extension/` folder.

> **Development mode**: Run `npm run dev` for hot-reload during development (serves on localhost:3000). Switch the overlay iframe src in `content.js` to `http://localhost:3000` during dev.

---

### Step 5 — Load the Extension in Chrome

1. Open Chrome → navigate to `chrome://extensions/`
2. Enable **"Developer mode"** (toggle top-right)
3. Click **"Load unpacked"**
4. Select the `extension/` folder
5. The extension appears in your toolbar 🎉
6. **Copy your Extension ID** (shown under the extension name, e.g. `abcdefghijklmnopqrstuvwxyz123456`)
7. Paste it into `backend/.env` → `ALLOWED_ORIGINS`

---

### Step 6 — Add Extension Icons

Create or download icons and save them as:
```
extension/icons/icon16.png   (16×16)
extension/icons/icon32.png   (32×32)
extension/icons/icon48.png   (48×48)
extension/icons/icon128.png  (128×128)
```

Use any accessibility symbol (♿, 👁, etc.) — you can use an online favicon generator.

---

### Step 7 — Start the Backend

```bash
cd backend
npm run dev
# ✅ UIA Backend running on http://localhost:4000
```

---

## 🧪 How to Run Locally (Full Stack)

Open **3 terminals**:

```bash
# Terminal 1 — Backend API
cd backend && npm run dev

# Terminal 2 — Frontend React dev server (optional during development)
cd frontend && npm run dev

# Terminal 3 — Rebuild extension after UI changes
cd frontend && npm run build:extension
```

Then visit any website in Chrome with the extension loaded.

---

## 🎬 Demo Flow

### Flow 1: Low Vision Mode
1. Visit any news site (e.g. bbc.com)
2. Click the ♿ extension icon in Chrome toolbar
3. Toggle **"Enable on this page"**
4. Click **"Low Vision"** mode
5. The page turns high-contrast (yellow on black), fonts enlarge 120%

### Flow 2: Explain This Page
1. Visit a complex site (e.g. government form, e-commerce checkout)
2. Open the extension panel
3. Click **"Explain This Page"**
4. Wait 2-3 seconds for the AI to analyze
5. See: Summary, Key Actions, Important Alerts, Reading Difficulty

### Flow 3: Voice Commands
1. Open the panel → click **"Voice"** tab
2. Click the microphone button
3. Say: *"Explain this page"*
4. The AI analyzes and speaks the result
5. Say: *"Scroll down"* → page scrolls
6. Say: *"Read page"* → text-to-speech reads main content

### Flow 4: Simple Mode + Translation
1. Visit a site with complex text
2. Enable **Simple Mode** — AI rewrites paragraphs in plain language, adds emoji icons to buttons
3. Enable **Translate** — full page translates to your chosen language
4. Go to Settings tab → select Spanish → save → re-enable Translate

### Flow 5: Color Blind Mode
1. Visit any site with red/green UI elements (alerts, success/error states)
2. Enable **Color Blind Mode**
3. Red and green elements get pattern overlays (hatching) for differentiation
4. SVG color matrix filter adjusts the full page for deuteranopia

---

## ⚙️ Architecture Overview

```
Chrome Tab (Any Website)
        │
        ▼
  content.js (injected)
  ├── DOM Scanner (MutationObserver)
  ├── Mode application (CSS injection)
  ├── Voice recognition (Web Speech API)
  └── Overlay iframe (React app)
        │
        ▼
  React Panel (overlay.html)
  ├── 5-tab UI (Dashboard, Modes, Voice, Explain, Settings)
  ├── useBridge hook (postMessage ↔ content.js)
  └── Framer Motion animations
        │
        ▼
  background.js (Service Worker)
  └── Proxies all API calls securely
        │
        ▼
  backend/server.js (Express + Node)
  ├── Rate limiting + CORS
  ├── Firebase auth verification
  ├── /api/ai/* routes
  └── /api/user/* routes
        │
        ▼
  ai/aiService.js
  └── OpenAI GPT-4o-mini
      ├── simplifyTexts()
      ├── translateTexts()
      ├── explainPage()
      └── interpretVoiceCommand()
```

---

## 🔐 Security Notes

- **API keys never leave the backend** — the extension only talks to your Express server
- Firebase ID tokens are verified server-side using the Admin SDK
- Rate limiting prevents abuse (30 req/min globally, 15 req/min for AI)
- CORS is locked to your extension ID + localhost
- Content scripts run in isolated worlds — can't access page JS variables

---

## 🌍 Supported Languages for Translation

English, Spanish, French, German, Hindi, Arabic, Chinese, Portuguese, Japanese, Tamil, Telugu, Bengali, Marathi, Korean, Italian, Russian (+ any language GPT-4o supports)

---

## 🔧 Customization

### Add a new accessibility mode:
1. Add toggle in `ModesTab.jsx`
2. Add state in `App.jsx`
3. Add CSS injection function in `content.js`
4. Wire up in `setMode()` switch statement

### Change AI model:
Set `OPENAI_MODEL=gpt-4o` in `.env` for higher quality (more expensive)

### Deploy backend to production:
```bash
# Railway, Render, or Fly.io
# Set all .env variables as environment secrets
# Update ALLOWED_ORIGINS to your extension ID
```

---

## 📦 Tech Stack Summary

| Layer | Technology |
|-------|------------|
| Extension | Chrome MV3, Content Scripts, Service Worker |
| UI | React 18, Framer Motion, Tailwind CSS |
| Voice | Web Speech API (SpeechRecognition + SpeechSynthesis) |
| Backend | Node.js, Express, Helmet, express-rate-limit |
| AI | OpenAI GPT-4o-mini (via secure backend proxy) |
| Auth + DB | Firebase Auth + Cloud Firestore |
| OCR | Tesseract.js (client-side) |
| Vision | TensorFlow.js (client-side element detection) |
| Build | Vite |

---

## 🐛 Troubleshooting

**Extension not injecting?**
- Reload the extension in `chrome://extensions/`
- Check for CSP errors in the page's DevTools console

**AI features not working?**
- Ensure backend is running: `curl http://localhost:4000/health`
- Check `OPENAI_API_KEY` is set correctly in `.env`
- Check CORS: extension ID in `ALLOWED_ORIGINS` must match

**Voice not working?**
- Chrome requires HTTPS or localhost for mic access
- Check microphone permissions in Chrome settings

**Overlay not appearing?**
- Open DevTools on the page → Console → look for UIA errors
- Try toggling the extension off and on from the popup
