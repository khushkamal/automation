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
import { getSettings, saveSettings } from './googleSheetSync.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AUTH_DIR = path.join(__dirname, 'whatsapp_auth');

let sock = null;
let qrCodeDataUrl = null;
let connectionStatus = 'DISCONNECTED'; // 'DISCONNECTED' | 'SCAN_QR' | 'CONNECTED' | 'CONNECTING'
let connectedUser = null;
let isCampaignRunning = false;
let campaignProgress = { total: 0, sent: 0, failed: 0, current: '', mode: 'CLOUD_API' };

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
// 1. OFFICIAL META WHATSAPP BUSINESS CLOUD API
// ================================================================

/**
 * Test WhatsApp Cloud API connection and retrieve Business profile info
 */
export async function testWhatsAppCloudApiConnection(phoneNumberId, accessToken, apiVersion = 'v20.0') {
  if (!phoneNumberId || !accessToken) {
    throw new Error('Phone Number ID and Access Token are required to test connection.');
  }

  const cleanPhoneId = String(phoneNumberId).trim();
  const cleanToken = String(accessToken).trim();
  const v = apiVersion || 'v20.0';

  const url = `https://graph.facebook.com/${v}/${cleanPhoneId}?fields=id,verified_name,display_phone_number,quality_rating,code_verification_status`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${cleanToken}`,
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const data = await res.json();

    if (!res.ok || data.error) {
      const errMsg = data.error?.message || `Meta API Error ${res.status}`;
      const errType = data.error?.type || 'OAuthException';
      throw new Error(`[Meta Cloud API Error] ${errMsg} (Type: ${errType})`);
    }

    return {
      success: true,
      id: data.id,
      verifiedName: data.verified_name || 'WhatsApp Business Account',
      displayPhoneNumber: data.display_phone_number || '',
      qualityRating: data.quality_rating || 'UNKNOWN'
    };
  } catch (err) {
    console.error('[WHATSAPP CLOUD API TEST ERROR]', err.message);
    throw err;
  }
}

/**
 * Send WhatsApp message using Official Meta WhatsApp Business Cloud API
 */
export async function sendWhatsAppCloudApiMessage(phone, message, leadId = null, memberName = 'Team Member') {
  const settings = getSettings();
  const phoneNumberId = (settings.waPhoneNumberId || '').trim();
  const accessToken = (settings.waAccessToken || '').trim();
  const apiVersion = settings.waApiVersion || 'v20.0';

  if (!phoneNumberId || !accessToken) {
    throw new Error('WhatsApp Business Cloud API is not configured. Please enter your Phone Number ID and Access Token in Settings.');
  }

  // Strict Multi-User Anti-Collision Check
  const check = isAlreadyContacted(phone, leadId);
  if (check.contacted) {
    throw new Error(`Client was already messaged by ${check.contactedBy || 'another team member'} on ${new Date(check.contactedAt).toLocaleString()}! Duplicate send blocked.`);
  }

  const cleanRecipientPhone = formatE164PhoneNumber(phone);
  if (!cleanRecipientPhone) {
    throw new Error(`Invalid phone number format: "${phone}"`);
  }

  const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: cleanRecipientPhone,
    type: 'text',
    text: {
      preview_url: false,
      body: message
    }
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const data = await res.json();

    if (!res.ok || data.error) {
      const errMsg = data.error?.message || `Meta Cloud API HTTP ${res.status}`;
      console.error(`[META CLOUD API ERROR] to ${cleanRecipientPhone}:`, data.error);
      throw new Error(`[Meta WhatsApp API] ${errMsg}`);
    }

    // Register in global registry
    markAsContacted(phone, leadId, memberName, message);

    // Update lead in leads_database.json if leadId is provided
    if (leadId) {
      try {
        const allLeads = getSavedLeads();
        const idx = allLeads.findIndex(l => l.leadId === leadId);
        if (idx !== -1) {
          allLeads[idx].whatsappSent = true;
          allLeads[idx].whatsappSentBy = memberName;
          allLeads[idx].whatsappSentAt = new Date().toISOString();
          allLeads[idx].whatsappChannel = 'Meta Cloud API';
          fs.writeFileSync(path.join(__dirname, 'leads_database.json'), JSON.stringify(allLeads, null, 2));
        }
      } catch (dbErr) {
        console.warn('[LEADS DB UPDATE ERROR]', dbErr.message);
      }
    }

    console.log(`  ✅ [WHATSAPP CLOUD API SENT] to +${cleanRecipientPhone} by ${memberName} (Message ID: ${data.messages?.[0]?.id || 'OK'})`);

    return {
      success: true,
      messageId: data.messages?.[0]?.id,
      channel: 'Meta Cloud API',
      recipient: cleanRecipientPhone
    };
  } catch (err) {
    console.error(`[WHATSAPP CLOUD API DISPATCH ERROR] to ${phone}:`, err.message);
    throw err;
  }
}

// ================================================================
// 2. UNIFIED DISPATCHER (Cloud API vs Baileys vs Direct 1-Click)
// ================================================================

export function isCloudApiConfigured() {
  const settings = getSettings();
  return Boolean(settings.waPhoneNumberId && settings.waAccessToken);
}

// Send single message with Multi-Member Anti-Duplicate Protection
export async function sendWhatsAppMessage(phone, message, leadId = null, memberName = 'Team Member') {
  // If Meta Cloud API is configured, use it first (Zero scan required!)
  if (isCloudApiConfigured()) {
    return await sendWhatsAppCloudApiMessage(phone, message, leadId, memberName);
  }

  // Fallback to Baileys socket if connected
  if (connectionStatus === 'CONNECTED' && sock) {
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
        const allLeads = getSavedLeads();
        const idx = allLeads.findIndex(l => l.leadId === leadId);
        if (idx !== -1) {
          allLeads[idx].whatsappSent = true;
          allLeads[idx].whatsappSentBy = memberName;
          allLeads[idx].whatsappSentAt = new Date().toISOString();
          allLeads[idx].whatsappChannel = 'Baileys Socket';
          fs.writeFileSync(path.join(__dirname, 'leads_database.json'), JSON.stringify(allLeads, null, 2));
        }
      }

      return { success: true, result, channel: 'Baileys Socket' };
    } catch (err) {
      console.error(`[WHATSAPP SEND ERROR] to ${phone}:`, err.message);
      throw err;
    }
  }

  throw new Error('WhatsApp is not configured. Please add your WhatsApp Business Cloud API credentials in Settings, or use the 1-Click WhatsApp DM button.');
}

// Get comprehensive status
export function getWhatsAppStatus() {
  const settings = getSettings();
  const cloudConfigured = Boolean(settings.waPhoneNumberId && settings.waAccessToken);

  let effectiveStatus = 'DISCONNECTED';
  let effectiveUser = null;

  if (cloudConfigured) {
    effectiveStatus = 'CONNECTED_CLOUD_API';
    effectiveUser = settings.waBusinessPhone || settings.waPhoneNumberId || 'Meta Cloud API';
  } else if (connectionStatus === 'CONNECTED') {
    effectiveStatus = 'CONNECTED';
    effectiveUser = connectedUser;
  } else if (connectionStatus === 'SCAN_QR') {
    effectiveStatus = 'SCAN_QR';
  }

  return {
    status: effectiveStatus,
    mode: cloudConfigured ? 'CLOUD_API' : 'BAILEYS',
    cloudApi: {
      configured: cloudConfigured,
      phoneNumberId: settings.waPhoneNumberId || '',
      businessPhone: settings.waBusinessPhone || '',
      verifiedName: settings.waVerifiedName || 'WhatsApp Business'
    },
    qrCode: qrCodeDataUrl,
    user: effectiveUser,
    isCampaignRunning,
    campaignProgress
  };
}

// ================================================================
// 3. CAMPAIGN DISPATCHER (Works with Meta Cloud API & Baileys)
// ================================================================

export async function startWhatsAppCampaign(memberName = 'Team Member', options = {}) {
  const cloudConfigured = isCloudApiConfigured();
  const baileysConnected = connectionStatus === 'CONNECTED' && sock;

  if (!cloudConfigured && !baileysConnected) {
    throw new Error('WhatsApp is not connected. Please add your WhatsApp Business Cloud API credentials in Settings.');
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
    operator: memberName,
    mode: cloudConfigured ? 'Meta Cloud API' : 'Baileys Socket'
  };

  // Run in background
  (async () => {
    console.log(`\n[WHATSAPP CAMPAIGN] Starting automated sending by ${memberName} to ${targetLeads.length} leads using ${campaignProgress.mode}...`);
    
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
        
        if (cloudConfigured) {
          await sendWhatsAppCloudApiMessage(lead.phone, lead.outreachMessage, lead.leadId, memberName);
        } else {
          const jid = formatPhoneNumber(lead.phone);
          await sock.sendMessage(jid, { text: lead.outreachMessage });
          markAsContacted(lead.phone, lead.leadId, memberName, lead.outreachMessage);
          
          lead.whatsappSent = true;
          lead.whatsappSentBy = memberName;
          lead.whatsappSentAt = new Date().toISOString();
          lead.whatsappChannel = 'Baileys Socket';
          
          const allLeads = getSavedLeads();
          const idx = allLeads.findIndex(l => l.leadId === lead.leadId);
          if (idx !== -1) {
            allLeads[idx] = lead;
            fs.writeFileSync(path.join(__dirname, 'leads_database.json'), JSON.stringify(allLeads, null, 2));
          }
        }
        
        campaignProgress.sent++;
        console.log(`  ✅ [SENT] to ${lead.businessName} (by ${memberName})`);

      } catch (err) {
        campaignProgress.failed++;
        console.error(`  ❌ [FAILED] to ${lead.businessName}:`, err.message);
      }

      // Delay between messages: 3-5 seconds for Cloud API, 6-10 seconds for Baileys
      const minDelay = cloudConfigured ? 3000 : 6000;
      const randomAdd = cloudConfigured ? 2000 : 4000;
      const delayMs = Math.floor(Math.random() * randomAdd) + minDelay;
      await new Promise(r => setTimeout(r, delayMs));
    }

    isCampaignRunning = false;
    campaignProgress.current = 'Completed';
    console.log(`\n[WHATSAPP CAMPAIGN] Finished! Sent: ${campaignProgress.sent}, Failed: ${campaignProgress.failed}\n`);
  })();

  return { success: true, message: `Campaign started by ${memberName} in background using ${campaignProgress.mode}`, totalTargets: targetLeads.length };
}

// Bulk Send to Custom List of Phone Numbers
export async function sendBulkCustomWhatsAppMessages(numbersList = [], messageText = '', memberName = 'Team Member') {
  if (!numbersList || numbersList.length === 0) {
    throw new Error('Please provide at least one phone number.');
  }
  if (!messageText || !messageText.trim()) {
    throw new Error('Message text cannot be empty.');
  }

  const cloudConfigured = isCloudApiConfigured();
  const baileysConnected = connectionStatus === 'CONNECTED' && sock;

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

  console.log(`\n[WHATSAPP BULK CUSTOM] Dispatching message to ${validNumbers.length} numbers by ${memberName}...`);

  let sentCount = 0;
  let failedCount = 0;
  const dispatchReport = [];

  for (const phone of validNumbers) {
    try {
      if (cloudConfigured) {
        await sendWhatsAppCloudApiMessage(phone, messageText, null, memberName);
      } else if (baileysConnected) {
        const jid = `${phone}@s.whatsapp.net`;
        await sock.sendMessage(jid, { text: messageText });
        markAsContacted(phone, null, memberName, messageText);
      } else {
        throw new Error('No active WhatsApp connection available.');
      }

      sentCount++;
      dispatchReport.push({ phone, status: 'SENT' });
      console.log(`  ✅ [CUSTOM BULK SENT] to +${phone}`);
    } catch (err) {
      failedCount++;
      dispatchReport.push({ phone, status: 'FAILED', error: err.message });
      console.error(`  ❌ [CUSTOM BULK FAILED] to +${phone}:`, err.message);
    }

    // Safety delay between sends
    await new Promise(r => setTimeout(r, cloudConfigured ? 2500 : 5000));
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

// ================================================================
// 4. OPTIONAL BAILEYS SOCKET (For legacy QR code pairing)
// ================================================================

export async function initWhatsApp() {
  const settings = getSettings();
  // If Cloud API is configured, Baileys QR code is optional
  if (settings.waPhoneNumberId && settings.waAccessToken) {
    connectionStatus = 'CONNECTED_CLOUD_API';
    return;
  }

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
      }

      if (connection === 'close') {
        const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
        connectionStatus = 'DISCONNECTED';
        qrCodeDataUrl = null;
        connectedUser = null;
        if (shouldReconnect && !isCloudApiConfigured()) {
          setTimeout(initWhatsApp, 4000);
        }
      } else if (connection === 'open') {
        connectionStatus = 'CONNECTED';
        qrCodeDataUrl = null;
        connectedUser = sock.user?.id ? sock.user.id.split(':')[0] : 'Connected';
        console.log(`\n================================================================`);
        console.log(`  ✅ [WHATSAPP BAILEYS CONNECTED] Successfully logged in as +${connectedUser}`);
        console.log(`================================================================\n`);
      }
    });

  } catch (err) {
    console.error('[WHATSAPP BAILEYS INIT NOTICE]', err.message);
    connectionStatus = 'DISCONNECTED';
  }
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
    return { success: true };
  } catch (err) {
    return { error: err.message };
  }
}
