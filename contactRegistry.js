import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REGISTRY_PATH = path.join(__dirname, 'sent_phone_registry.json');

// Initialize sent registry
function initRegistry() {
  if (!fs.existsSync(REGISTRY_PATH)) {
    fs.writeFileSync(REGISTRY_PATH, JSON.stringify({}, null, 2));
  }
}

initRegistry();

export function getSentRegistry() {
  try {
    return JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf-8'));
  } catch (e) {
    return {};
  }
}

/**
 * Check if a phone number or lead has already been messaged by ANY team member
 */
export function isAlreadyContacted(phone, leadId) {
  const registry = getSentRegistry();
  const cleanPhone = phone ? String(phone).replace(/[^0-9]/g, '') : '';

  // Check by Phone Number (Last 10 digits match)
  if (cleanPhone && cleanPhone.length >= 10) {
    const last10 = cleanPhone.slice(-10);
    for (const [savedPhone, data] of Object.entries(registry)) {
      if (savedPhone.endsWith(last10)) {
        return { contacted: true, ...data };
      }
    }
  }

  // Check by Lead ID
  if (leadId && registry[leadId]) {
    return { contacted: true, ...registry[leadId] };
  }

  return { contacted: false };
}

/**
 * Record that a message was sent to a client
 */
export function markAsContacted(phone, leadId, memberName = 'Team Member', messageText = '') {
  try {
    const registry = getSentRegistry();
    const cleanPhone = phone ? String(phone).replace(/[^0-9]/g, '') : '';
    const now = new Date().toISOString();

    const entry = {
      leadId,
      phone: cleanPhone || phone,
      contactedBy: memberName,
      contactedAt: now,
      snippet: messageText ? messageText.substring(0, 60) + '...' : ''
    };

    if (cleanPhone && cleanPhone.length >= 10) {
      const last10 = cleanPhone.slice(-10);
      registry[last10] = entry;
    }

    if (leadId) {
      registry[leadId] = entry;
    }

    fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2));
  } catch (err) {
    console.error('[REGISTRY ERROR]', err);
  }
}
