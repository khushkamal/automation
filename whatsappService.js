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
// Helper: Find lead from database or memory by phone number
// ================================================================
export function findLeadByPhone(phone, customLeads = []) {
  if (!phone) return null;
  const clean = String(phone).replace(/[^0-9]/g, '');
  if (!clean || clean.length < 8) return null;
  const last10 = clean.slice(-10);

  // 1. Check in custom leads passed in options
  if (Array.isArray(customLeads) && customLeads.length > 0) {
    const found = customLeads.find(l => {
      const p = l.phone ? String(l.phone).replace(/[^0-9]/g, '') : '';
      return p.endsWith(last10) || p === clean;
    });
    if (found) return found;
  }

  // 2. Check in main leads database
  try {
    const allLeads = getSavedLeads();
    const found = allLeads.find(l => {
      const p = l.phone ? String(l.phone).replace(/[^0-9]/g, '') : '';
      return p.endsWith(last10) || p === clean;
    });
    if (found) return found;
  } catch (err) {
    console.warn('[FIND LEAD ERROR]', err.message);
  }

  return null;
}

// ================================================================
// Dynamic Requirement Pitch Generator
// Generates unique, requirement-specific messages for every lead
// ================================================================
export function generateLeadSpecificPitch(lead = null, options = {}) {
  const template = options.template || 'dynamic-req';
  const lang = options.lang || 'auto'; // 'auto' | 'hi' | 'en'

  // If lead is not provided or just a phone string
  if (!lead || typeof lead !== 'object') {
    if (template && template !== 'dynamic-req' && template !== 'AUTO_REQUIREMENT') {
      return template
        .replace(/\{businessName\}|\{name\}/gi, 'Business Owner')
        .replace(/\{category\}|\{niche\}/gi, 'business')
        .replace(/\{city\}|\{location\}/gi, 'your area')
        .replace(/\{requirement\}|\{service\}/gi, 'Website & Growth Funnel')
        .replace(/\{issue\}|\{auditReason\}/gi, 'Online presence optimization')
        .replace(/\{website\}/gi, 'your profile')
        .replace(/\{handle\}/gi, '');
    }
    return lang === 'en'
      ? `Hi! We reviewed your local business profile and prepared a custom website & WhatsApp growth audit to help you scale customer inquiries. Would you be open for a quick 2-minute overview?`
      : `Namaste! Humne aapke business profile ke liye ek custom website & WhatsApp lead generation audit review kiya hai. Kya hum ispar short 2-minute discuss kar sakte hain?`;
  }

  const businessName = lead.businessName || 'Sir/Ma\'am';
  const category = lead.category || 'business';
  const city = lead.city || 'your city';
  const website = lead.website || '';
  const recommendedService = lead.recommendedService || 'Digital Growth & WhatsApp Funnel Setup';
  const auditReason = lead.auditReason || 'Online Lead Conversion Optimization';
  const isNoWeb = !website || lead.websiteStatus === 'No Website';
  const isInstagram = lead.source === 'Instagram Discovery' || (lead.leadId && String(lead.leadId).startsWith('ig:'));
  const isEnglish = lang === 'en' || (lang === 'auto' && lead.isInternational);

  // If template is set to auto dynamic requirement mode
  if (!template || template === 'dynamic-req' || template === 'AUTO_REQUIREMENT') {
    // If pre-computed messages exist on the lead
    if (isEnglish && lead.outreachMessageEn) return lead.outreachMessageEn;
    if (!isEnglish && lead.outreachMessageHi) return lead.outreachMessageHi;
    if (lead.outreachMessage) return lead.outreachMessage;

    // Generate requirement-tailored message based on audit status
    if (isInstagram) {
      const handle = lead.instagramHandle ? lead.instagramHandle.replace('@', '') : businessName;
      if (isEnglish) {
        return `Hi ${businessName}! 👋 Loved your Instagram profile (@${handle}) and your ${category}! We help active Instagram brands set up 1-Click WhatsApp Storefronts & instant product catalogs so customers order 24/7 without manual DM delays. Would you be open to a quick 2-minute demo preview?`;
      }
      return `Namaste ${businessName}! 👋 Maine aapka Instagram page dekha (@${handle}). Aapka ${category} collection bohot amazing hai! 🔥 Lekin customer inquiries aur orders DMs me manually handle karne me kaafi time lagta hai. Hum aapke brand ke liye 1-Click WhatsApp Automated Storefront setup karte hain jisse customers direct 24/7 order place kar sakein. Kya main aapke sath 2-min ka demo preview share karun?`;
    }

    if (isNoWeb) {
      if (isEnglish) {
        return `Hi ${businessName}, noticed your ${category} practice in ${city} does not have an active website. High-intent clients actively search Google before booking high-value services. We build high-converting websites with instant appointment booking & WhatsApp inquiry funnels. Would you be open for a quick 2-min preview?`;
      }
      return `Namaste ${businessName}, maine notice kiya ki ${city} me aapke ${category} business ki koi active website nahi hai. Aaj kal high-value clients aur patients pehle Google pe verify karke hi appointment book karte hain. Hum aapke business ke liye ek premium website & instant WhatsApp booking system setup kar sakte hain. Kya hum ispar 2-min discuss kar sakte hain?`;
    }

    // Website exists with audit findings
    if (isEnglish) {
      return `Hi ${businessName}, I reviewed ${website} for your ${category} in ${city} and noticed potential improvements in ${auditReason}. Fixing these can boost your customer inquiries significantly. Can I share a quick 2-min overview?`;
    }
    return `Namaste ${businessName}, maine ${city} me aapke ${category} business ki website ${website} audit ki. Isme ${auditReason} optimize karke aap direct customer inquiries 2x se 3x boost kar sakte hain. Kya main short 2-minute overview share karun?`;
  }

  // Custom template with dynamic variables replacement
  let resolved = template
    .replace(/\{businessName\}|\{name\}/gi, businessName)
    .replace(/\{category\}|\{niche\}/gi, category)
    .replace(/\{city\}|\{location\}/gi, city)
    .replace(/\{requirement\}|\{service\}/gi, recommendedService)
    .replace(/\{issue\}|\{auditReason\}/gi, auditReason)
    .replace(/\{website\}/gi, website || (isNoWeb ? 'No Website' : 'your profile'))
    .replace(/\{handle\}/gi, lead.instagramHandle || businessName);

  return resolved;
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
    console.log(`\n[WHATSAPP CAMPAIGN] Starting requirement-based automated sending by ${memberName} to ${targetLeads.length} leads...`);
    
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
        const jid = formatPhoneNumber(lead.phone);
        // Build lead-specific personalized pitch according to audit findings
        const pitchText = generateLeadSpecificPitch(lead, {
          template: options.template || 'dynamic-req',
          lang: options.lang || 'auto'
        });
        
        console.log(`[WHATSAPP CAMPAIGN] Pitching tailored requirement [${lead.recommendedService || 'Custom Audit'}] to ${lead.businessName} (${lead.phone})...`);
        
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

  return { success: true, message: `Requirement-based campaign started by ${memberName} in background`, totalTargets: targetLeads.length };
}

// Bulk Send to Custom List of Phone Numbers with Requirement Personalization
export async function sendBulkCustomWhatsAppMessages(numbersList = [], messageText = '', memberName = 'Team Member', options = {}) {
  if (connectionStatus !== 'CONNECTED' || !sock) {
    throw new Error('WhatsApp is not connected. Please scan the QR code on Dashboard first.');
  }

  if (!numbersList || numbersList.length === 0) {
    throw new Error('Please provide at least one phone number.');
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

  console.log(`\n[WHATSAPP BULK DISPATCH] Preparing personalized requirement pitches for ${validNumbers.length} numbers by ${memberName}...`);

  let sentCount = 0;
  let failedCount = 0;
  let skippedCount = 0;
  const dispatchReport = [];

  for (const phone of validNumbers) {
    try {
      // Find lead details for this phone number
      const lead = findLeadByPhone(phone, options.leadsData || []);
      const leadId = lead ? lead.leadId : null;
      const businessName = lead ? lead.businessName : `Contact +${phone}`;

      // Check anti-collision lock
      const check = isAlreadyContacted(phone, leadId);
      if (check.contacted) {
        skippedCount++;
        dispatchReport.push({
          phone,
          businessName,
          status: 'SKIPPED_DUPLICATE',
          message: `Already messaged by ${check.contactedBy || 'team'}`
        });
        console.log(`  🛡️ [DUPLICATE BLOCKED] +${phone} (${businessName}) was already contacted by ${check.contactedBy}`);
        continue;
      }

      // Generate requirement-tailored pitch for this specific lead
      const personalizedPitch = generateLeadSpecificPitch(lead, {
        template: messageText || 'dynamic-req',
        lang: options.lang || 'auto'
      });

      const jid = `${phone}@s.whatsapp.net`;
      console.log(`  🚀 [SENDING PITCH] to ${businessName} (+${phone}) -> Requirement: [${lead?.recommendedService || 'General Audit'}]`);

      await sock.sendMessage(jid, { text: personalizedPitch });
      markAsContacted(phone, leadId, memberName, personalizedPitch);

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
          console.warn('[DB UPDATE ERROR]', dbErr.message);
        }
      }

      sentCount++;
      dispatchReport.push({
        phone,
        businessName,
        status: 'SENT',
        requirement: lead?.recommendedService || 'Requirement Pitch',
        pitchPreview: personalizedPitch.substring(0, 70) + '...'
      });
      console.log(`  ✅ [SENT] to ${businessName} (+${phone})`);
    } catch (err) {
      failedCount++;
      dispatchReport.push({ phone, status: 'FAILED', error: err.message });
      console.error(`  ❌ [FAILED] to +${phone}:`, err.message);
    }

    // Safety delay between sends (5 to 8 seconds)
    const delayMs = Math.floor(Math.random() * 3000) + 5000;
    await new Promise(r => setTimeout(r, delayMs));
  }

  return {
    success: true,
    total: validNumbers.length,
    sent: sentCount,
    failed: failedCount,
    skipped: skippedCount,
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
