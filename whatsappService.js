import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion
} from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { getSavedLeads, saveLead } from './auditEngine.js';
import { isAlreadyContacted, markAsContacted } from './contactRegistry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AUTH_DIR = path.join(__dirname, 'whatsapp_auth');

let sock = null;
let qrCodeDataUrl = null;
let connectionStatus = 'DISCONNECTED'; // 'DISCONNECTED' | 'SCAN_QR' | 'CONNECTED' | 'CONNECTING'
let connectedUser = null;
let isCampaignRunning = false;
let campaignProgress = { total: 0, sent: 0, failed: 0, current: '' };

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
      printQRInTerminal: false,
      defaultQueryTimeoutMs: 60000,
      browser: ['Local Business Lead Auditor', 'Chrome', '1.0.0']
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        connectionStatus = 'SCAN_QR';
        qrCodeDataUrl = await QRCode.toDataURL(qr);
        console.log('\n[WHATSAPP] New QR Code generated! Please scan from WhatsApp on your phone.\n');
      }

      if (connection === 'close') {
        const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
        connectionStatus = 'DISCONNECTED';
        qrCodeDataUrl = null;
        connectedUser = null;
        console.log('[WHATSAPP] Connection closed. Reconnecting:', shouldReconnect);
        if (shouldReconnect) {
          setTimeout(initWhatsApp, 3000);
        }
      } else if (connection === 'open') {
        connectionStatus = 'CONNECTED';
        qrCodeDataUrl = null;
        connectedUser = sock.user?.id ? sock.user.id.split(':')[0] : 'Connected';
        console.log(`\n================================================================`);
        console.log(`  ✅ [WHATSAPP CONNECTED] Successfully logged in as +${connectedUser}`);
        console.log(`================================================================\n`);
      }
    });

  } catch (err) {
    console.error('[WHATSAPP INIT ERROR]', err.message);
    connectionStatus = 'DISCONNECTED';
  }
}

export function getWhatsAppStatus() {
  return {
    status: connectionStatus,
    qrCode: qrCodeDataUrl,
    user: connectedUser,
    isCampaignRunning,
    campaignProgress
  };
}

// Clean and normalize phone number for WhatsApp JID
export function formatPhoneNumber(phone) {
  if (!phone) return null;
  let digits = String(phone).replace(/[^0-9]/g, '');
  if (!digits || digits.length < 8) return null;

  // If standard 10 digit Indian number without country code
  if (digits.length === 10) {
    digits = '91' + digits;
  }
  
  return `${digits}@s.whatsapp.net`;
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
    
    // Register in persistent global sent database
    markAsContacted(phone, leadId, memberName, message);

    return { success: true, result };
  } catch (err) {
    console.error(`[WHATSAPP SEND ERROR] to ${phone}:`, err.message);
    throw err;
  }
}

// Run Auto-Sender Campaign (Filters out ANY lead already contacted by any member)
export async function startWhatsAppCampaign(memberName = 'Team Member', options = {}) {
  if (connectionStatus !== 'CONNECTED' || !sock) {
    throw new Error('WhatsApp is not connected. Please connect WhatsApp first.');
  }

  if (isCampaignRunning) {
    throw new Error('A campaign is already running in background.');
  }

  const leads = getSavedLeads();
  // Filter leads with valid phones that have NEVER been contacted by ANY team member
  const targetLeads = leads.filter(l => {
    const hasPhone = l.phone && l.phone !== 'Not listed' && l.phone.replace(/[^0-9]/g, '').length >= 10;
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

  // Run in background
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
        console.log(`[WHATSAPP] Sending pitch to ${lead.businessName} (${lead.phone}) by ${memberName}...`);
        
        const jid = formatPhoneNumber(lead.phone);
        await sock.sendMessage(jid, { text: lead.outreachMessage });
        
        // Register in global registry
        markAsContacted(lead.phone, lead.leadId, memberName, lead.outreachMessage);

        // Mark as sent in DB
        lead.whatsappSent = true;
        lead.whatsappSentBy = memberName;
        lead.whatsappSentAt = new Date().toISOString();
        campaignProgress.sent++;
        console.log(`  ✅ [SENT] to ${lead.businessName} (by ${memberName})`);

        // Update in leads database
        const allLeads = getSavedLeads();
        const idx = allLeads.findIndex(l => l.leadId === lead.leadId);
        if (idx !== -1) {
          allLeads[idx] = lead;
          fs.writeFileSync(path.join(__dirname, 'leads_database.json'), JSON.stringify(allLeads, null, 2));
        }

      } catch (err) {
        campaignProgress.failed++;
        console.error(`  ❌ [FAILED] to ${lead.businessName}:`, err.message);
      }

      // Safe anti-ban delay: 6 to 10 seconds random delay between messages
      const delayMs = Math.floor(Math.random() * 4000) + 6000;
      await new Promise(r => setTimeout(r, delayMs));
    }

    isCampaignRunning = false;
    campaignProgress.current = 'Completed';
    console.log(`\n[WHATSAPP CAMPAIGN] Finished! Sent: ${campaignProgress.sent}, Failed: ${campaignProgress.failed}\n`);
  })();

  return { success: true, message: `Campaign started by ${memberName} in background`, totalTargets: targetLeads.length };
}

export function stopWhatsAppCampaign() {
  isCampaignRunning = false;
  return { success: true };
}

export async function logoutWhatsApp() {
  try {
    if (sock) {
      await sock.logout();
    }
    if (fs.existsSync(AUTH_DIR)) {
      fs.rmSync(AUTH_DIR, { recursive: true, force: true });
    }
    connectionStatus = 'DISCONNECTED';
    connectedUser = null;
    qrCodeDataUrl = null;
    setTimeout(initWhatsApp, 2000);
    return { success: true };
  } catch (err) {
    return { error: err.message };
  }
}
