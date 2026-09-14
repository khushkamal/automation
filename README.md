# ⚡ Local Business Lead Generation & Website Audit Automation

> **100% Free, Standalone, Self-Hosted Lead Discovery, Deterministic Website Auditor & WhatsApp Auto-Messenger for Agencies.**  
> Zero paid APIs (No OpenAI, No Google Maps API fees, No Make.com/Twilio subscriptions).

---

## 🌟 Key Features

1. **OpenStreetMap Overpass Engine (100% Free Discovery)**:
   - Real-time local business discovery by Category (`dentist`, `salon`, `restaurant`, `gym`, `clinic`, `hotel`, etc.) and City.
   - Smart tag expansion and multi-mirror fallback failover.

2. **Deterministic Rule-Based Website Audit Engine (0% AI Cost)**:
   - Real-time live HTML analysis:
     - 🔒 **SSL/HTTPS** security status
     - 📱 **Mobile Viewport** responsiveness
     - 📞 **Click-to-Call** phone numbers & CTA language
     - 💬 **WhatsApp Chat Direct Hooks** (`wa.me`, `whatsapp.com`)
     - 📅 **Online Booking / Calendly** integrations
     - 📊 **Tracking Pixels & Analytics** (GTM, Meta Pixel, Google Ads)
   - Calculated Lead Score (`0–100`) & Priority (`Hot 🔥`, `Warm ⚡`, `Potential 💡`).
   - Service Recommendation: *Website Development, Mobile Optimization, Online Booking System, WhatsApp Automation, Website Redesign*.

3. **💬 100% Free WhatsApp Business Direct Auto-Sender**:
   - Built-in WhatsApp Web QR code connection via WebSockets.
   - **Personalized Outreach Engine**: Generates tailor-made pitches based on the client's exact website weaknesses.
   - **Language Toggle**: Supports **🇮🇳 Natural Hinglish** and **🇬🇧 Professional English**.
   - **1-Click Bulk Campaign**: Automated dispatching with randomized **6–10s anti-ban delays** to protect WhatsApp numbers.

4. **🛡️ Multi-Member Anti-Collision Registry**:
   - Prevents duplicate outreach when 3–4 team members use the tool simultaneously.
   - Global phone and lead locking (`sent_phone_registry.json`) blocks double messaging.

5. **📊 Real-Time Live Google Sheets Sync**:
   - Instant webhook sync via Google Apps Script (Exact 26-column schema).
   - Also includes 1-click **Export 26-Cols CSV**.

---

## 🚀 Quick Start (Local)

### Option 1: One-Click Launch (Windows)
Double-click [`start.cmd`](start.cmd). It starts the local server and opens your browser at [http://localhost:3000](http://localhost:3000).

### Option 2: Terminal
```bash
npm install
npm start
```
Open: [http://localhost:3000](http://localhost:3000)

---

## ☁️ Free Cloud Deployment (Render.com / Railway)

1. Push this repository to GitHub.
2. Sign up on **[Render.com](https://render.com/)** (Free Tier).
3. Click **New Web Service** and select your GitHub repository.
4. Settings:
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
5. Click **Deploy Web Service**. You will receive a free live HTTPS URL (e.g. `https://your-lead-engine.onrender.com`).

---

## 📋 26-Column Google Sheet Schema

| # | Field Name | Description / Source |
| :--- | :--- | :--- |
| 1 | **Lead ID** | Unique OpenStreetMap Node/Way ID (`node:123456`) |
| 2 | **Business Name** | Real business title |
| 3 | **Category** | Business niche (`dentist`, `salon`, `restaurant`, etc.) |
| 4 | **City** | City / Target Area |
| 5 | **Address** | Street, area, postcode |
| 6 | **Phone** | Calling / WhatsApp contact number |
| 7 | **Website** | Website URL (or blank) |
| 8 | **Google Maps URL** | `Not available` (OSM Free Tier) |
| 9 | **Rating** | `Not available` (OSM Free Tier) |
| 10 | **Reviews** | `Not available` (OSM Free Tier) |
| 11 | **Website Status** | `Live` / `No Website` / `Unable to fetch` |
| 12 | **Website Quality** | `Poor` / `Needs Improvement` / `Fair` |
| 13 | **Mobile Friendly** | `Yes` / `No` / `Unknown` |
| 14 | **CTA** | `Detected` / `Not detected` |
| 15 | **WhatsApp** | `Detected` / `Not detected` |
| 16 | **Online Booking** | `Detected` / `Not detected` |
| 17 | **Ads Status** | `Detected` / `Not detected` / `Unknown` |
| 18 | **Automation Status** | `High Opportunity` / `Moderate Opportunity` |
| 19 | **AI Opportunity** | `Rule-based audit; no AI API used` |
| 20 | **Lead Score** | `0–100` calculated score |
| 21 | **Lead Priority** | `Hot` / `Warm` / `Potential` / `Low` |
| 22 | **Recommended Service** | Targeted agency offer |
| 23 | **Audit Reason** | Specific weaknesses identified |
| 24 | **Outreach Message** | Dynamic tailored pitch hook |
| 25 | **Source** | `OpenStreetMap / Overpass` |
| 26 | **Date Added** | Timestamp |

---

## 📄 License
MIT License. Free to use and customize for agency lead generation.
