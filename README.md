<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&height=250&section=header&text=🗳️%20Democracy%20Nexus&fontSize=50&fontColor=ffffff&animation=fadeIn" alt="Democracy Nexus Banner" width="100%"/>

  <p><strong>An Intelligent, Interactive Guide to the Indian Electoral Process</strong></p>

  <!-- Badges -->
  <a href="https://github.com/kriashnam"><img src="https://img.shields.io/badge/Author-kriashnam-00b4d8?style=for-the-badge&logo=github" alt="Author Badge"/></a>
  <img src="https://img.shields.io/badge/Vanilla_JS-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase" />
  <img src="https://img.shields.io/badge/Gemini_AI-8E75B2?style=for-the-badge&logo=google&logoColor=white" alt="Google Gemini" />
</div>

<br />

## 📖 Overview

**Democracy Nexus** is a highly interactive, accessible, and responsive Single Page Application (SPA) designed to demystify the Indian election process. It empowers citizens with knowledge about voting steps, electoral timelines, and democratic frameworks through gamified learning and AI-powered assistance.

This project serves as an interactive assistant that breaks down complex timelines into easy-to-follow, digestible formats.

---

## ✨ Core Features

| Feature | Description |
| :--- | :--- |
| 🤖 **AI Assistant** | Powered by **Google Gemini 2.0 Flash**, our integrated chatbot acts as a personalized election tutor, ready to answer questions in real-time. |
| ⏱️ **Interactive Timeline** | Step-by-step visualizations of General, State, and Local elections, featuring expandable details, duration markers, and animations. |
| 🧠 **Knowledge Quiz** | A gamified testing module with categorized questions. Scores are tracked and synced via **Firebase Firestore** for a global leaderboard. |
| 📋 **Voter Readiness Checklist** | A personalized action plan that calculates age eligibility and guides new voters from registration to polling day. |
| 📚 **Smart Glossary** | An interactive, searchable dictionary designed to simplify complex electoral terminology (EVM, VVPAT, NOTA, MCC, etc.). |
| 📱 **PWA Capabilities** | Fully installable as a Progressive Web App, complete with offline support via Service Workers for on-the-go learning. |

---

## 🛠️ Technology Stack & Integrations

- **Frontend Core:** Vanilla JavaScript (ES Modules), HTML5, Custom CSS3 Variables (No heavy CSS frameworks).
- **Build Tool:** [Vite](https://vitejs.dev/) for ultra-fast HMR and highly optimized production builds (< 10 MB total repository size).
- **Google Services Integration:**
  - **Google Gemini API:** System-prompted Generative AI.
  - **Firebase Authentication:** Secure Google Sign-In and anonymous sessions.
  - **Cloud Firestore:** Real-time NoSQL database for syncing user progress and chat histories.
  - **Firebase Hosting & Analytics:** Global CDN deployment and user engagement tracking.

---

## 🔒 Security & Accessibility

We believe democracy should be accessible to everyone, safely.

- **Strict Accessibility (WCAG 2.1 AA):** Fully semantic HTML, comprehensive ARIA attributes, robust focus-trapping for modals, and dynamic live-region announcements for screen readers.
- **Motion Preferences:** Respects the user's OS-level `prefers-reduced-motion` settings.
- **Security:** 
  - Implements a strict `Content-Security-Policy` (CSP).
  - Employs `DOMPurify` to sanitize all AI and user inputs, eliminating XSS vulnerabilities.
  - Features robust API rate limiting to prevent abuse.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/en/) (v16.0.0 or higher)
- NPM or Yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/kriashnam/Democracy_Nexus.git
   cd Democracy_Nexus
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the root directory and add your keys:
   ```env
   # Firebase Configuration
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

   # Google Gemini Configuration
   VITE_GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Start the Development Server**
   ```bash
   npm run dev
   ```
   *The application will typically be available at `http://localhost:5173`.*

### Testing
Run the Jest unit test suite:
```bash
npm run test
```

### Production Build
Generate an optimized build suitable for deployment:
```bash
npm run build
```

---

## 🏆 Credits

Designed and developed by **[kriashnam](https://github.com/kriashnam)**.
