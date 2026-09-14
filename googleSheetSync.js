import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SETTINGS_PATH = path.join(__dirname, 'settings.json');

// Initialize settings
export function getSettings() {
  try {
    if (fs.existsSync(SETTINGS_PATH)) {
      return JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf-8'));
    }
  } catch (e) {}
  return { googleSheetWebhookUrl: '' };
}

export function saveSettings(settings) {
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2));
}

/**
 * Send a qualified lead row directly to Google Sheets via Free Web App Webhook
 */
export async function syncLeadToGoogleSheet(lead) {
  const settings = getSettings();
  const webhookUrl = settings.googleSheetWebhookUrl;

  if (!webhookUrl || !webhookUrl.startsWith('https://script.google.com/')) {
    // Webhook not configured yet
    return { synced: false, reason: 'Google Sheet Webhook URL not configured' };
  }

  const sanitize = (val) => {
    if (val === null || val === undefined) return '';
    const s = String(val).trim();
    if (s.startsWith('+') || s.startsWith('=')) {
      return "'" + s;
    }
    return s;
  };

  // Exact 26 column row array (sanitized to prevent formula parse error)
  const rowData = [
    sanitize(lead.leadId),
    sanitize(lead.businessName),
    sanitize(lead.category),
    sanitize(lead.city),
    sanitize(lead.address),
    sanitize(lead.phone),
    sanitize(lead.website),
    sanitize(lead.googleMapsUrl),
    sanitize(lead.rating),
    sanitize(lead.reviews),
    sanitize(lead.websiteStatus),
    sanitize(lead.websiteQuality),
    sanitize(lead.mobileFriendly),
    sanitize(lead.cta),
    sanitize(lead.whatsApp),
    sanitize(lead.onlineBooking),
    sanitize(lead.adsStatus),
    sanitize(lead.automationStatus),
    sanitize(lead.aiOpportunity),
    lead.leadScore ?? 0,
    sanitize(lead.leadPriority),
    sanitize(lead.recommendedService),
    sanitize(lead.auditReason),
    sanitize(lead.outreachMessage),
    sanitize(lead.source),
    sanitize(lead.dateAdded)
  ];

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'addLead',
        lead: rowData
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const json = await res.json().catch(() => ({}));
    return { synced: true, result: json };
  } catch (err) {
    console.warn(`[GOOGLE SHEET SYNC] Failed to sync lead ${lead.leadId}:`, err.message);
    return { synced: false, error: err.message };
  }
}
