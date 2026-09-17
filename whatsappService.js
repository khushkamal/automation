import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion
} from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { getSavedLeads } from './auditEngine.js';
import { isAlreadyContacted, markAsContacted } from './contactRegistry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AUTH_DIR = path.join(__dirname, 'whatsapp_auth');

let sock = null;
let qrCodeDataUrl = null;
let connectionStatus = 'DISCONNECTED'; // 'DISCONNECTED' | 'SCAN_QR' | 'CONNECTED' | 'CONNECTING'
let connectedUser = null;
let isCampaignRunning = false;
let campaignProgress = { total: 0, sent: 0, failed: 0, current: '', operator: '' };

// Clean and normalize phone number into standard international digits (E.164 without '+')
export function formatE164PhoneNumber(phone) {
  if (!phone) return null;
  let digits = String(phone).replace(/[^0-9]/g, '');
  if (!digits || digits.length < 8) return null;

  // If standard 10 digit Indian number without country code
  if (digits.length === 10) {
    digits = '91' + digits;
  }
  return digits;
}

// JID for Baileys socket
export function formatPhoneNumber(phone) {
  const digits = formatE164PhoneNumber(phone);
  if (!digits) return null;
  return `${digits}@s.whatsapp.net`;
}

// ================================================================
// 1. BAILEYS DIRECT SOCKET (QR Code Pairing & Direct Web Socket)
// ================================================================

export async function initWhatsApp() {
  try {
    if (!fs.existsSync(AUTH_DIR)) {
      fs.mkdirSync(AUTH_DIR, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    const { version } = await fetchLatestBaileysVersion().catch(() => ({ version: [2, 3000, 1015901307] }));

    connectionStatus = 'CONNECTING';

    sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: true,
      defaultQueryTimeoutMs: 60000,
      browser: ['Local Business Lead Auditor', 'Chrome', '1.0.0']
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        connectionStatus = 'SCAN_QR';
        qrCodeDataUrl = await QRCode.toDataURL(qr);
        console.log('\n================================================================');
        console.log('[WHATSAPP] 📱 New QR Code generated! Please scan from WhatsApp.');
        console.log('================================================================\n');
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        console.log(`[WHATSAPP] Connection closed (Status: ${statusCode}). Reconnecting: ${shouldReconnect}`);
        
        connectionStatus = 'DISCONNECTED';
        qrCodeDataUrl = null;
        connectedUser = null;

        if (statusCode === DisconnectReason.loggedOut) {
          if (fs.existsSync(AUTH_DIR)) {
            fs.rmSync(AUTH_DIR, { recursive: true, force: true });
          }
          setTimeout(initWhatsApp, 2000);
        } else if (shouldReconnect) {
          setTimeout(initWhatsApp, 4000);
        }
      } else if (connection === 'open') {
        connectionStatus = 'CONNECTED';
        qrCodeDataUrl = null;
        const rawUser = sock.user?.id ? sock.user.id.split(':')[0] : 'Connected';
        connectedUser = rawUser.replace(/[^0-9]/g, '');
        console.log(`\n================================================================`);
        console.log(`  ✅ [WHATSAPP CONNECTED] Logged in successfully as +${connectedUser}`);
        console.log(`================================================================\n`);
      }
    });

  } catch (err) {
    console.error('[WHATSAPP INIT ERROR]', err.message);
    connectionStatus = 'DISCONNECTED';
    setTimeout(initWhatsApp, 5000);
  }
}

// Get comprehensive status
export function getWhatsAppStatus() {
  return {
    status: connectionStatus,
    qrCode: qrCodeDataUrl,
    user: connectedUser,
    isCampaignRunning,
    campaignProgress
  };
}

// Send single message with Multi-Member Anti-Duplicate Protection
export async function sendWhatsAppMessage(phone, message, leadId = null, memberName = 'Team Member') {
  if (connectionStatus !== 'CONNECTED' || !sock) {
    throw new Error('WhatsApp is not connected. Please scan the QR code first.');
  }

  // Strict Multi-User Anti-Collision Check
  const check = isAlreadyContacted(phone, leadId);
  if (check.contacted) {
    throw new Error(`Client was already messaged by ${check.contactedBy || 'another team member'} on ${new Date(check.contactedAt).toLocaleString()}! Duplicate send blocked.`);
  }

  const jid = formatPhoneNumber(phone);
  if (!jid) {
    throw new Error(`Invalid phone number: "${phone}"`);
  }

  try {
    const result = await sock.sendMessage(jid, { text: message });
    markAsContacted(phone, leadId, memberName, message);

    if (leadId) {
      try {
        const allLeads = getSavedLeads();
        const idx = allLeads.findIndex(l => l.leadId === leadId);
        if (idx !== -1) {
          allLeads[idx].whatsappSent = true;
          allLeads[idx].whatsappSentBy = memberName;
          allLeads[idx].whatsappSentAt = new Date().toISOString();
          allLeads[idx].whatsappChannel = 'WhatsApp Direct';
          fs.writeFileSync(path.join(__dirname, 'leads_database.json'), JSON.stringify(allLeads, null, 2));
        }
      } catch (dbErr) {
        console.warn('[LEADS DB UPDATE ERROR]', dbErr.message);
      }
    }

    return { success: true, result, channel: 'WhatsApp Direct' };
  } catch (err) {
    console.error(`[WHATSAPP SEND ERROR] to ${phone}:`, err.message);
    throw err;
  }
}

// ================================================================
// 2. 1-CLICK CAMPAIGN DISPATCHER (BASED ON CLIENT AUDIT REQUIREMENTS)
// ================================================================

export async function startWhatsAppCampaign(memberName = 'Team Member', options = {}) {
  if (connectionStatus !== 'CONNECTED' || !sock) {
    throw new Error('WhatsApp is not connected. Please scan the QR code on Dashboard first.');
  }

  if (isCampaignRunning) {
    throw new Error('A campaign is already running in background.');
  }

  const leads = getSavedLeads();
  // Filter leads with valid phones that have NEVER been contacted by ANY team member
  const targetLeads = leads.filter(l => {
    const hasPhone = l.phone && l.phone !== 'Not listed' && l.phone !== 'DM for Contact' && l.phone.replace(/[^0-9]/g, '').length >= 8;
    if (!hasPhone) return false;
    
    // Check against global sent registry
    const check = isAlreadyContacted(l.phone, l.leadId);
    return !check.contacted && !l.whatsappSent;
  });

  if (targetLeads.length === 0) {
    return { success: true, message: 'All qualified leads have already been contacted! 0 duplicates sent.', total: 0 };
  }

  isCampaignRunning = true;
  campaignProgress = {
    total: targetLeads.length,
    sent: 0,
    failed: 0,
    current: '',
    operator: memberName
  };

  // Run automated campaign in background
  (async () => {
    console.log(`\n[WHATSAPP CAMPAIGN] Starting automated sending by ${memberName} to ${targetLeads.length} leads...`);
    
    for (const lead of targetLeads) {
      if (!isCampaignRunning) break;

      // Double-check lock before sending
      const doubleCheck = isAlreadyContacted(lead.phone, lead.leadId);
      if (doubleCheck.contacted) {
        console.log(`  🛡️ [DUPLICATE BLOCKED] ${lead.businessName} was already messaged by ${doubleCheck.contactedBy}`);
        continue;
      }

      campaignProgress.current = `${lead.businessName} (${lead.phone})`;
      try {
        console.log(`[WHATSAPP] Sending requirement-based pitch to ${lead.businessName} (${lead.phone}) by ${memberName}...`);
        
        const jid = formatPhoneNumber(lead.phone);
        const pitchText = lead.outreachMessage || `Namaste! Humne aapke business "${lead.businessName}" ke liye ek custom website & online growth audit ready kiya hai.`;
        
        await sock.sendMessage(jid, { text: pitchText });
        markAsContacted(lead.phone, lead.leadId, memberName, pitchText);
        
        lead.whatsappSent = true;
        lead.whatsappSentBy = memberName;
        lead.whatsappSentAt = new Date().toISOString();
        lead.whatsappChannel = 'WhatsApp Direct';
        
        const allLeads = getSavedLeads();
        const idx = allLeads.findIndex(l => l.leadId === lead.leadId);
        if (idx !== -1) {
          allLeads[idx] = lead;
          fs.writeFileSync(path.join(__dirname, 'leads_database.json'), JSON.stringify(allLeads, null, 2));
        }
        
        campaignProgress.sent++;
        console.log(`  ✅ [SENT] to ${lead.businessName} (${lead.phone})`);

      } catch (err) {
        campaignProgress.failed++;
        console.error(`  ❌ [FAILED] to ${lead.businessName}:`, err.message);
      }

      // Anti-ban delay: 6 to 10 seconds random delay between messages
      const delayMs = Math.floor(Math.random() * 4000) + 6000;
      await new Promise(r => setTimeout(r, delayMs));
    }

    isCampaignRunning = false;
    campaignProgress.current = 'Completed';
    console.log(`\n[WHATSAPP CAMPAIGN] Finished! Sent: ${campaignProgress.sent}, Failed: ${campaignProgress.failed}\n`);
  })();

  return { success: true, message: `Campaign started by ${memberName} in background`, totalTargets: targetLeads.length };
}

// Bulk Send to Custom List of Phone Numbers with Selected Pitch Template
export async function sendBulkCustomWhatsAppMessages(numbersList = [], messageText = '', memberName = 'Team Member') {
  if (connectionStatus !== 'CONNECTED' || !sock) {
    throw new Error('WhatsApp is not connected. Please scan the QR code on Dashboard first.');
  }

  if (!numbersList || numbersList.length === 0) {
    throw new Error('Please provide at least one phone number.');
  }
  if (!messageText || !messageText.trim()) {
    throw new Error('Message text cannot be empty.');
  }

  const validNumbers = [];
  for (const num of numbersList) {
    const cleanDigits = formatE164PhoneNumber(num);
    if (cleanDigits && cleanDigits.length >= 8 && !validNumbers.includes(cleanDigits)) {
      validNumbers.push(cleanDigits);
    }
  }

  if (validNumbers.length === 0) {
    throw new Error('No valid phone numbers found in the provided list.');
  }

  console.log(`\n[WHATSAPP BULK CUSTOM] Dispatching requirement pitch to ${validNumbers.length} numbers by ${memberName}...`);

  let sentCount = 0;
  let failedCount = 0;
  const dispatchReport = [];

  for (const phone of validNumbers) {
    try {
      const jid = `${phone}@s.whatsapp.net`;
      await sock.sendMessage(jid, { text: messageText });
      markAsContacted(phone, null, memberName, messageText);

      sentCount++;
      dispatchReport.push({ phone, status: 'SENT' });
      console.log(`  ✅ [CUSTOM BULK SENT] to +${phone}`);
    } catch (err) {
      failedCount++;
      dispatchReport.push({ phone, status: 'FAILED', error: err.message });
      console.error(`  ❌ [CUSTOM BULK FAILED] to +${phone}:`, err.message);
    }

    // Safety delay between sends
    await new Promise(r => setTimeout(r, 4500));
  }

  return {
    success: true,
    total: validNumbers.length,
    sent: sentCount,
    failed: failedCount,
    report: dispatchReport
  };
}

export function stopWhatsAppCampaign() {
  isCampaignRunning = false;
  return { success: true };
}

export async function logoutWhatsApp() {
  try {
    if (sock) {
      await sock.logout().catch(() => {});
    }
    if (fs.existsSync(AUTH_DIR)) {
      fs.rmSync(AUTH_DIR, { recursive: true, force: true });
    }
    connectionStatus = 'DISCONNECTED';
    connectedUser = null;
    qrCodeDataUrl = null;
    console.log('[WHATSAPP] Logged out. Regenerating QR Code in 2 seconds...');
    setTimeout(initWhatsApp, 2000);
    return { success: true };
  } catch (err) {
    return { error: err.message };
  }
}
