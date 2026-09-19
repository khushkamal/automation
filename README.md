# 🚀 Local Business Lead Scoring & Outreach Automation System

A Python automation system that reads local business leads from **Google Sheets**, uses **Google Gemini 1.5 Flash (Free Tier)** to intelligently score each lead (1–10) and craft tailored, human-like outreach messages in natural Hinglish/Hindi, and writes the results back to the Google Sheet.

---

## 📋 Table of Contents
1. [Overview & Tech Stack](#-overview--tech-stack)
2. [Google Sheet Structure](#-google-sheet-structure)
3. [Prerequisites & Installation](#-prerequisites--installation)
4. [Setup Guide: Google Cloud Service Account](#-setup-guide-google-cloud-service-account-for-google-sheets)
5. [Setup Guide: Google Gemini API Key (Free)](#-setup-guide-google-gemini-api-key-free)
6. [Environment Configuration (`.env`)](#-environment-configuration-env)
7. [Running the Automation](#-running-the-automation)
8. [Scoring & Outreach Logic](#-scoring--outreach-logic)
9. [Troubleshooting & FAQs](#-troubleshooting--faqs)

---

## 🛠 Overview & Tech Stack

- **Language:** Python 3.8+
- **AI Engine:** Google Gemini 1.5 Flash (`gemini-1.5-flash`) via `google-generativeai`
- **Spreadsheet Integration:** `gspread`, `google-auth`, `oauth2client`
- **Environment Management:** `python-dotenv`

---

## 📊 Google Sheet Structure

The automation connects to **`Sheet1`** in your Google Sheet.

### Input Columns (Read by Automation)
| Column Name | Type | Description |
| :--- | :--- | :--- |
| `name` | Text | Business name (e.g., *Apex Dental Clinic*) |
| `category` | Text | Type of business (e.g., *Dentist*, *Salon*, *Bakery*) |
| `address` | Text | Location / City / Street address |
| `rating` | Number | Google Maps or Instagram rating (e.g., `4.5`) |
| `reviews` | Number | Total review count (e.g., `18`) |
| `website` | Text | Website URL if exists, or left empty |
| `lead_channel` | Text | Value: `"Google Maps"` or `"Instagram"` |

### Output Columns (Written by Automation)
The automation processes only rows where `lead_score` is blank/empty:
| Column Name | Type | Description |
| :--- | :--- | :--- |
| `lead_score` | Number | Score from `1` to `10` (10 = highest potential lead) |
| `priority_reason` | Text | One-line reasoning explaining agency service fit |
| `outreach_message` | Text | Personalized 3-4 line outreach pitch with WhatsApp CTA |

> 💡 *Note: If `lead_score`, `priority_reason`, or `outreach_message` headers are not present in row 1, the script automatically appends them.*

---

## ⚙️ Prerequisites & Installation

### 1. Clone or Open Workspace
Ensure your terminal is in the project root:
```bash
cd d:\Project\Automation
```

### 2. (Optional) Create a Python Virtual Environment
```bash
python -m venv venv
# On Windows PowerShell / CMD:
.\venv\Scripts\activate
# On macOS / Linux:
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

---

## 🔑 Setup Guide: Google Cloud Service Account (For Google Sheets)

To allow the Python script to read and write to your Google Sheet without popup authentication:

1. Go to the **[Google Cloud Console](https://console.cloud.google.com/)**.
2. Create a new project (e.g. `Lead-Outreach-Automation`) or select an existing one.
3. Enable Required APIs:
   - Go to **APIs & Services** > **Library**.
   - Search for **Google Sheets API** and click **Enable**.
   - Search for **Google Drive API** and click **Enable**.
4. Create Service Account Credentials:
   - Go to **APIs & Services** > **Credentials**.
   - Click **Create Credentials** > **Service Account**.
   - Give it a name (e.g. `sheets-bot`) and click **Done**.
5. Generate and Download JSON Key:
   - In the Service Accounts list, click on your newly created service account email.
   - Go to the **Keys** tab > **Add Key** > **Create new key**.
   - Select **JSON** and click **Create**.
   - A `.json` file will download to your computer.
6. Place in Project Directory:
   - Rename the downloaded file to **`credentials.json`**.
   - Place `credentials.json` in the root folder of this project (`d:\Project\Automation\credentials.json`).

### 🔗 Share Your Google Sheet with the Service Account
1. Open your `credentials.json` file and copy the **`client_email`** value (e.g. `sheets-bot@your-project.iam.gserviceaccount.com`).
2. Open your Google Sheet in your web browser.
3. Click the green **Share** button in the top right corner.
4. Paste the service account email and give it **Editor** permissions.
5. Uncheck "Notify people" and click **Share**.

---

## 🤖 Setup Guide: Google Gemini API Key (Free)

1. Go to **[Google AI Studio](https://aistudio.google.com/)**.
2. Sign in with your Google account.
3. Click **Get API key** in the left sidebar.
4. Click **Create API key** (you can select your Google Cloud project or create a default key).
5. Copy your Gemini API key.

---

## 📁 Environment Configuration (`.env`)

1. Copy the `.env.example` file to create `.env`:
   ```bash
   cp .env.example .env
   ```
   *(On Windows CMD: `copy .env.example .env`)*

2. Open `.env` and fill in your details:
   ```env
   # Google Gemini API Key (from Google AI Studio)
   GEMINI_API_KEY=AIzaSy...YourKeyHere

   # Google Sheet ID (from Google Sheet URL)
   GOOGLE_SHEET_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
   ```

### 📌 How to find your `GOOGLE_SHEET_ID`:
Look at your Google Sheet URL in your browser:
```
https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
                                       ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                       This highlighted part is your GOOGLE_SHEET_ID
```

---

## ▶️ Running the Automation

Run the script directly via terminal:
```bash
python main.py
```

### Console Output Example:
```
============================================================
🚀 Local Business Lead Scoring & Outreach Automation
============================================================
🔌 Connecting to Google Sheets...
✅ Connected to Sheet: 'Local Business Leads' (Worksheet: 'Sheet1')
🤖 Initializing Google Gemini 1.5 Flash...
✅ Gemini Model initialized successfully.

📋 Fetching rows from Google Sheets...
📊 Total lead rows in sheet: 15
🔍 Unprocessed leads (where lead_score is empty): 4

============================================================
▶️ Processing Unprocessed Leads...
============================================================

[1/4] Row 2: Processing 'Dr. Smile Dental Care' (Dentist)...
   ⭐ Lead Score: 9/10
   📌 Reason: High rated dental clinic (4.8 rating) with 80+ reviews but no active website.
   💬 Outreach Message Preview: Namaste Dr. Smile team! Aapka dental clinic Google par 4.8 star rating ke saath ka...
   💾 Saved to Google Sheet (Row 2) ✅

[2/4] Row 3: Processing 'Sweet Crust Bakery' (Bakery)...
   ⭐ Lead Score: 8/10
   📌 Reason: Instagram DM-based baker with growing orders but manual DM overload.
   💬 Outreach Message Preview: Hello Sweet Crust team! Aapke bakery cakes ka presentation shandaar hai. DMs man...
   💾 Saved to Google Sheet (Row 3) ✅

============================================================
🎉 AUTOMATION COMPLETED
✅ Successfully processed: 4
============================================================
```

---

## 🧠 Scoring & Outreach Logic

The system follows specific agency matching and scoring rules:

### 1. Google Maps Businesses
- **No Website:** High priority (`+3` points)
- **High Rating (4.0+) without Website:** Immediate priority (`+2` extra points)
- **Low Reviews (<20):** New business, automation/ads angle (`+1` point)
- **Listed with low ranking/visibility:** SEO angle (`+2` points)
- **Outdated/Basic Website:** Redesign + SEO conversion angle

### 2. Instagram/DM-Run Businesses
- **`lead_channel = "Instagram"`:** High priority (`+3` points)
- **Pitch Focus:** WhatsApp automated catalog, auto-reply bots, landing page
- **High Engagement/Content:** Higher score

### 3. Outreach Rules
- **Length:** 3–4 lines maximum
- **Tone:** Genuine, friendly, helpful (non-salesy)
- **Language:** Natural Hinglish / Hindi tailored for Indian local business owners
- **CTA:** Directed to agency contact: `+91 79 7638 5008`

---

## 🛡️ Error Handling & Reliability

- **JSON Validation & Retry:** If Gemini returns an unparseable response, the system waits 3 seconds and automatically retries once before skipping.
- **Rate-Limit Throttling:** Automatically waits **2 seconds** between rows to maintain free-tier quota limits.
- **Selective Updating:** Skips rows that have already been evaluated (`lead_score` is not empty), preventing duplicate processing or overwriting manual edits.

---

## ❓ Troubleshooting & FAQs

### 1. `gspread.exceptions.SpreadsheetNotFound` or `APIError: 403 Forbidden`
- **Cause:** The Google Sheet is not shared with the service account.
- **Fix:** Copy `client_email` from `credentials.json` and share your Google Sheet with that email as **Editor**.

### 2. `APIError: 403 Google Sheets API has not been used...`
- **Fix:** Click the activation link printed in the error or enable **Google Sheets API** and **Google Drive API** in your Google Cloud Console.

### 3. `❌ credentials.json not found`
- **Fix:** Ensure you downloaded the service account JSON key from Google Cloud Console and saved it as `credentials.json` in this directory.

### 4. `ResourceExhausted: 429 Quota Exceeded`
- **Fix:** Google Gemini 1.5 Flash free tier allows 15 requests per minute (RPM). The built-in 2-second sleep manages this automatically. If you hit limits, wait 60 seconds and run `python main.py` again (it will seamlessly resume unprocessed leads).

---

## 📄 License
MIT License. Created for local business lead generation and agency outreach automation.
