#!/usr/bin/env python3
"""
Lead Scoring and Outreach Automation System
Reads business leads from Google Sheets, scores leads and generates personalized outreach messages using Google Gemini 1.5 Flash, and writes results back to the sheet.
"""

import os
import sys
import json
import time
import re
from typing import Dict, Any, Optional, Tuple
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GOOGLE_SHEET_ID = os.getenv("GOOGLE_SHEET_ID")
CREDENTIALS_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "credentials.json")
SHEET_NAME = "Sheet1"

# Exact System Prompt as per specifications for VELTIX & CO.
GEMINI_SYSTEM_PROMPT = """Tum VELTIX & CO. (Digital Products • AI • Automation • Technology) ke expert outreach assistant ho.
Agency Portfolio: https://veltrixandco.vercel.app/
Services Offered:
- Website Development
- E-commerce Development
- Web App Development
- SaaS Development
- AI Development
- API & Integrations
- Business Automation
- Custom Software
- Security & Performance
- Testing / QA
- Deployment & Cloud
- Maintenance & Support

Tumhe ek business ka data diya jayega (Google Maps listed ya Instagram/Online business).
Tumhara kaam hai:
1. Business ka lead score (1-10) nikaalna — 10 matlab bahut promising client
2. Ek short reason dena ki yeh business VELTIX & CO. ki service ke liye kyu fit hai
3. Ek personalized outreach message likhna jo us specific business ki problem address kare

--- Scoring Rules ---
- Website na ho = high priority (+3 points) -> Pitch: Modern Website & Lead Automation
- Rating high ho (4+) but website na ho = bahut high priority (+2 extra points)
- Website hai but outdated/slow ho = Pitch: Web App Redesign, Performance, AI Integration
- E-commerce/Storefront ho = Pitch: WhatsApp Order Automation, Custom E-commerce
- Instagram business ho = Pitch: 1-Click WhatsApp Storefront & AI Chatbot

--- Outreach Message Rules ---
- 3-4 lines maximum
- Business naam aur category specific mention karo
- VELTIX & CO. portfolio mention karo: https://veltrixandco.vercel.app/
- Genuine helpful tone — salesy ya pushy nahi
- CTA: "Portfolio check karein: https://veltrixandco.vercel.app/ ya WhatsApp par baat karein"
- Hinglish ya simple Hindi/English mein
- Har message unique aur personalized lagni chahiye

Return ONLY valid JSON, no extra text, no markdown fences:
{
  "lead_score": <number 1-10>,
  "priority_reason": "<one line>",
  "outreach_message": "<message>"
}"""


def check_prerequisites():
    """Verify that required environment variables and credentials exist."""
    errors = []
    if not GEMINI_API_KEY or GEMINI_API_KEY.strip() == "" or "your_gemini_api_key_here" in GEMINI_API_KEY:
        errors.append("❌ GEMINI_API_KEY is missing or not set in .env file.")
    if not GOOGLE_SHEET_ID or GOOGLE_SHEET_ID.strip() == "" or "your_google_sheet_id_here" in GOOGLE_SHEET_ID:
        errors.append("❌ GOOGLE_SHEET_ID is missing or not set in .env file.")
    if not os.path.exists(CREDENTIALS_FILE):
        errors.append(f"❌ credentials.json not found at: {CREDENTIALS_FILE}\nPlease place your Google Cloud Service Account JSON key as 'credentials.json' in the project directory.")

    if errors:
        print("\n" + "=" * 60)
        print("🚨 CONFIGURATION ERROR")
        print("=" * 60)
        for err in errors:
            print(err)
        print("=" * 60)
        print("Please check your .env and credentials.json setup as detailed in README.md.")
        sys.exit(1)


def init_gemini():
    """Initialize the Google Gemini client."""
    try:
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_API_KEY)
        
        # We configure the model with the system instructions
        model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            system_instruction=GEMINI_SYSTEM_PROMPT,
            generation_config={"response_mime_type": "application/json"}
        )
        return model
    except Exception as e:
        print(f"\n❌ Error initializing Gemini API client: {e}")
        sys.exit(1)


def init_google_sheets():
    """Initialize gspread client and connect to Google Sheet."""
    try:
        import gspread
        client = gspread.service_account(filename=CREDENTIALS_FILE)
        
        try:
            spreadsheet = client.open_by_key(GOOGLE_SHEET_ID)
        except Exception as e:
            print(f"\n❌ Failed to open Google Sheet with ID '{GOOGLE_SHEET_ID}': {e}")
            print("👉 Make sure:")
            print("   1. The Google Sheet ID in .env is correct.")
            print("   2. You have shared the Google Sheet with the client_email from credentials.json (as Editor).")
            print("   3. Google Drive API and Google Sheets API are enabled in your Google Cloud Console.")
            sys.exit(1)

        try:
            worksheet = spreadsheet.worksheet(SHEET_NAME)
        except gspread.exceptions.WorksheetNotFound:
            print(f"⚠️ Worksheet '{SHEET_NAME}' not found. Using the first sheet '{spreadsheet.sheet1.title}'...")
            worksheet = spreadsheet.sheet1

        return worksheet
    except Exception as e:
        print(f"\n❌ Google Sheets connection error: {e}")
        sys.exit(1)


def extract_json(text: str) -> Optional[Dict[str, Any]]:
    """Clean markdown fences and extract valid JSON object from text."""
    if not text:
        return None
    cleaned = text.strip()
    # Remove markdown ```json ... ``` wrapper if present
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\s*```$", "", cleaned)
        cleaned = cleaned.strip()

    try:
        data = json.loads(cleaned)
        if isinstance(data, dict):
            return data
    except json.JSONDecodeError:
        # Try finding the first '{' and last '}'
        match = re.search(r"(\{.*\})", cleaned, re.DOTALL)
        if match:
            try:
                data = json.loads(match.group(1))
                if isinstance(data, dict):
                    return data
            except Exception:
                pass
    return None


def call_gemini_lead_scoring(model, lead_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Call Gemini API with business lead data and handle JSON parsing + retry logic.
    """
    prompt_content = f"""Here is the business lead data to evaluate:
- Business Name: {lead_data.get('name', '')}
- Category: {lead_data.get('category', '')}
- Address: {lead_data.get('address', '')}
- Rating: {lead_data.get('rating', '')}
- Total Reviews: {lead_data.get('reviews', '')}
- Website: {lead_data.get('website', '')}
- Lead Channel: {lead_data.get('lead_channel', '')}

Analyze this lead, score it (1-10), provide priority reason, and generate the tailored outreach message according to your instructions.
Return ONLY valid JSON."""

    # First attempt
    try:
        response = model.generate_content(prompt_content)
        parsed = extract_json(response.text)
        if parsed and "lead_score" in parsed:
            return parsed
        else:
            print("   ⚠️ Gemini returned non-JSON/invalid format. Retrying in 3 seconds...")
    except Exception as e:
        print(f"   ⚠️ Gemini API call failed: {e}. Retrying in 3 seconds...")

    # Retry once after 3 seconds as required
    time.sleep(3)
    try:
        response = model.generate_content(prompt_content)
        parsed = extract_json(response.text)
        if parsed and "lead_score" in parsed:
            return parsed
        else:
            print(f"   ❌ Retry failed to parse valid JSON for business: '{lead_data.get('name', 'Unknown')}'. Response: {response.text[:100]}...")
            return None
    except Exception as e:
        print(f"   ❌ Retry failed for business: '{lead_data.get('name', 'Unknown')}': {e}")
        return None


def run_automation():
    """Main execution workflow."""
    print("=" * 60)
    print("🚀 Local Business Lead Scoring & Outreach Automation")
    print("=" * 60)
    
    check_prerequisites()

    print("🔌 Connecting to Google Sheets...")
    worksheet = init_google_sheets()
    print(f"✅ Connected to Sheet: '{worksheet.spreadsheet.title}' (Worksheet: '{worksheet.title}')")

    print("🤖 Initializing Google Gemini 1.5 Flash...")
    gemini_model = init_gemini()
    print("✅ Gemini Model initialized successfully.")

    # Read all rows
    print("\n📋 Fetching rows from Google Sheets...")
    try:
        all_values = worksheet.get_all_values()
    except Exception as e:
        print(f"❌ Failed to fetch data from worksheet: {e}")
        sys.exit(1)

    if not all_values:
        print("⚠️ Sheet is completely empty. Please add headers and lead data.")
        return

    headers = [str(h).strip().lower() for h in all_values[0]]
    raw_headers = all_values[0]

    # Required columns
    expected_inputs = ["name", "category", "address", "rating", "reviews", "website", "lead_channel"]
    expected_outputs = ["lead_score", "priority_reason", "outreach_message"]

    # Map column headers to indices (0-indexed)
    col_map = {}
    for idx, header in enumerate(headers):
        col_map[header] = idx

    # Check if input columns exist
    missing_inputs = [col for col in expected_inputs if col not in col_map]
    if missing_inputs:
        print(f"⚠️ Warning: Some expected input columns were not found in row 1: {missing_inputs}")
        print(f"   Found columns: {raw_headers}")

    # Ensure output columns exist in sheet headers
    headers_updated = False
    for col in expected_outputs:
        if col not in col_map:
            new_col_idx = len(headers)
            headers.append(col)
            col_map[col] = new_col_idx
            # Add header to sheet
            try:
                worksheet.update_cell(1, new_col_idx + 1, col)
                print(f"➕ Added missing output header '{col}' at column {new_col_idx + 1}")
                headers_updated = True
            except Exception as e:
                print(f"❌ Failed to append header '{col}': {e}")

    rows_data = all_values[1:]  # Skip header row
    total_leads = len(rows_data)
    print(f"📊 Total lead rows in sheet: {total_leads}")

    score_col_idx = col_map.get("lead_score")
    reason_col_idx = col_map.get("priority_reason")
    message_col_idx = col_map.get("outreach_message")

    # Filter unprocessed rows (where lead_score is empty)
    unprocessed = []
    for idx, row in enumerate(rows_data):
        row_num = idx + 2  # 1-indexed for Google Sheets (Header = 1)
        score_val = row[score_col_idx].strip() if score_col_idx < len(row) else ""
        if not score_val:
            unprocessed.append((row_num, row))

    print(f"🔍 Unprocessed leads (where lead_score is empty): {len(unprocessed)}")

    if not unprocessed:
        print("\n✨ All leads have already been scored and processed! Nothing to do.")
        return

    print("\n" + "=" * 60)
    print("▶️ Processing Unprocessed Leads...")
    print("=" * 60)

    success_count = 0
    skipped_count = 0

    for current_i, (row_num, row) in enumerate(unprocessed, 1):
        def get_val(key):
            if key in col_map and col_map[key] < len(row):
                return row[col_map[key]].strip()
            return ""

        lead_data = {
            "name": get_val("name") or f"Lead #{row_num}",
            "category": get_val("category"),
            "address": get_val("address"),
            "rating": get_val("rating"),
            "reviews": get_val("reviews"),
            "website": get_val("website"),
            "lead_channel": get_val("lead_channel") or "Google Maps"
        }

        print(f"\n[{current_i}/{len(unprocessed)}] Row {row_num}: Processing '{lead_data['name']}' ({lead_data['category'] or 'Local Business'})...")

        # Call Gemini AI
        result = call_gemini_lead_scoring(gemini_model, lead_data)

        if not result:
            print(f"   ⏩ Skipping Row {row_num} ('{lead_data['name']}') due to evaluation error.")
            skipped_count += 1
            time.sleep(2)
            continue

        lead_score = result.get("lead_score", "")
        priority_reason = result.get("priority_reason", "")
        outreach_message = result.get("outreach_message", "")

        print(f"   ⭐ Lead Score: {lead_score}/10")
        print(f"   📌 Reason: {priority_reason}")
        print(f"   💬 Outreach Message Preview: {outreach_message[:80]}...")

        # Write back to Google Sheets
        try:
            # Update individual cells or range
            if score_col_idx is not None:
                worksheet.update_cell(row_num, score_col_idx + 1, lead_score)
            if reason_col_idx is not None:
                worksheet.update_cell(row_num, reason_col_idx + 1, priority_reason)
            if message_col_idx is not None:
                worksheet.update_cell(row_num, message_col_idx + 1, outreach_message)

            print(f"   💾 Saved to Google Sheet (Row {row_num}) ✅")
            success_count += 1
        except Exception as e:
            print(f"   ❌ Error updating Google Sheet at row {row_num}: {e}")
            skipped_count += 1

        # 2 second delay between API calls to avoid rate limiting
        time.sleep(2)

    print("\n" + "=" * 60)
    print("🎉 AUTOMATION COMPLETED")
    print(f"✅ Successfully processed: {success_count}")
    if skipped_count > 0:
        print(f"⚠️ Skipped / Failed: {skipped_count}")
    print("=" * 60)


if __name__ == "__main__":
    try:
        run_automation()
    except KeyboardInterrupt:
        print("\n\n🛑 Automation stopped by user.")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)
