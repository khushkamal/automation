import express from 'express';
import cors from 'cors';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import {
  searchOverpass,
  processElement,
  getSavedLeads,
  getProcessedIds,
  getSearchQueue,
  saveSearchQueue
} from './auditEngine.js';
import {
  generateRandomInstagramLeads,
  addManualInstagramLead
} from './instagramDiscovery.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 1. Get Search Queue
app.get('/api/search-queue', (req, res) => {
  res.json(getSearchQueue());
});

// 2. Add / Update Search Queue item
app.post('/api/search-queue', (req, res) => {
  const { keyword, city, status } = req.body;
  if (!keyword || !city) {
    return res.status(400).json({ error: 'Keyword and City are required' });
  }

  const queue = getSearchQueue();
  const newItem = {
    id: Date.now().toString(),
    keyword: keyword.trim().toLowerCase(),
    city: city.trim(),
    status: status || 'Ready',
    createdAt: new Date().toISOString()
  };
  queue.push(newItem);
  saveSearchQueue(queue);
  console.log(`[QUEUE] Added: "${newItem.keyword}" in ${newItem.city} (Status: ${newItem.status})`);
  res.json({ success: true, item: newItem });
});

// 3. Delete Search Queue item
app.delete('/api/search-queue/:id', (req, res) => {
  const { id } = req.params;
  let queue = getSearchQueue();
  queue = queue.filter(item => item.id !== id);
  saveSearchQueue(queue);
  res.json({ success: true });
});

// 4. Run Audit for specific keyword & city
app.post('/api/run-audit', async (req, res) => {
  const { keyword, city, maxResults = 20 } = req.body;
  if (!keyword || !city) {
    return res.status(400).json({ error: 'Keyword and City are required' });
  }

  console.log(`\n--------------------------------------------------`);
  console.log(`[AUDIT] Starting search: "${keyword}" in "${city}" (Max: ${maxResults})`);

  try {
    const rawElements = await searchOverpass(keyword, city, maxResults);
    console.log(`[OSM] Discovered ${rawElements.length} local businesses from OpenStreetMap.`);
    
    const results = [];
    let addedCount = 0;
    let skippedCount = 0;

    for (const elem of rawElements) {
      const bizName = elem.tags?.name || 'Unnamed Business';
      const processRes = await processElement(elem, keyword, city);
      
      if (processRes.success) {
        addedCount++;
        console.log(`  ✅ [LEAD QUALIFIED] ${bizName} | Score: ${processRes.lead.leadScore} | Service: ${processRes.lead.recommendedService}`);
      } else {
        skippedCount++;
        console.log(`  ⏩ [SKIPPED] ${bizName} (${processRes.reason})`);
      }

      results.push({
        elementId: `${elem.type}:${elem.id}`,
        name: bizName,
        ...processRes
      });
    }

    // Update queue status if matched
    const queue = getSearchQueue();
    let updated = false;
    queue.forEach(item => {
      if (item.keyword.toLowerCase() === keyword.toLowerCase() && item.city.toLowerCase() === city.toLowerCase() && item.status === 'Ready') {
        item.status = 'Completed';
        item.lastRun = new Date().toISOString();
        updated = true;
      }
    });
    if (updated) saveSearchQueue(queue);

    console.log(`[AUDIT COMPLETED] Qualified Leads Added: ${addedCount} | Skipped: ${skippedCount}\n`);

    res.json({
      success: true,
      query: { keyword, city },
      totalFoundInOSM: rawElements.length,
      qualifiedAdded: addedCount,
      skipped: skippedCount,
      processedResults: results
    });
  } catch (err) {
    console.error(`[ERROR] Audit failed:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// 4.1. Run Random Worldwide Audit Endpoint
import { getRandomGlobalTarget } from './auditEngine.js';

app.get('/api/random-suggestion', (req, res) => {
  const { region } = req.query;
  const target = getRandomGlobalTarget(region || 'Worldwide');
  res.json(target);
});

app.post('/api/run-random-audit', async (req, res) => {
  const { region = 'Worldwide', maxResults = 15 } = req.body;
  const target = getRandomGlobalTarget(region);
  
  console.log(`\n==================================================`);
  console.log(`[RANDOM WORLDWIDE] Picked Target: "${target.keyword}" in "${target.city}" (${target.region})`);
  console.log(`==================================================\n`);

  try {
    const rawElements = await searchOverpass(target.keyword, target.city, maxResults);
    console.log(`[OSM] Discovered ${rawElements.length} businesses in ${target.city}.`);
    
    const results = [];
    let addedCount = 0;
    let skippedCount = 0;

    for (const elem of rawElements) {
      const bizName = elem.tags?.name || 'Unnamed Business';
      const processRes = await processElement(elem, target.keyword, target.city);
      
      if (processRes.success) {
        addedCount++;
        console.log(`  ✅ [LEAD QUALIFIED] ${bizName} (${target.city}) | Score: ${processRes.lead.leadScore}`);
      } else {
        skippedCount++;
      }

      results.push({
        elementId: `${elem.type}:${elem.id}`,
        name: bizName,
        ...processRes
      });
    }

    res.json({
      success: true,
      query: { keyword: target.keyword, city: target.city, region: target.region },
      totalFoundInOSM: rawElements.length,
      qualifiedAdded: addedCount,
      skipped: skippedCount,
      processedResults: results
    });
  } catch (err) {
    console.error(`[RANDOM AUDIT ERROR]`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// 4.2. Instagram Business Lead Discovery Endpoints
app.post('/api/instagram/generate-random', async (req, res) => {
  const { count = 10 } = req.body;
  console.log(`\n==================================================`);
  console.log(`[INSTAGRAM] Request to generate ${count} random qualified leads`);
  console.log(`==================================================\n`);

  try {
    const leads = await generateRandomInstagramLeads(parseInt(count) || 10);
    res.json({
      success: true,
      count: leads.length,
      leads
    });
  } catch (err) {
    console.error(`[INSTAGRAM DISCOVERY ERROR]`, err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/instagram/manual-add', (req, res) => {
  try {
    const lead = addManualInstagramLead(req.body);
    res.json({ success: true, lead });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/instagram/leads', (req, res) => {
  const leads = getSavedLeads().filter(l => l.source === 'Instagram Discovery');
  res.json({ success: true, total: leads.length, leads });
});

// 5. Run All 'Ready' Queue Items
app.post('/api/run-queue', async (req, res) => {
  const queue = getSearchQueue();
  const readyItems = queue.filter(item => item.status === 'Ready');
  
  if (readyItems.length === 0) {
    return res.json({ success: true, message: 'No items with status "Ready" found in queue', processed: 0 });
  }

  console.log(`\n[QUEUE BATCH] Running ${readyItems.length} ready queue searches...`);
  const batchReport = [];

  for (const item of readyItems) {
    console.log(`[QUEUE] Processing: "${item.keyword}" in ${item.city}...`);
    const rawElements = await searchOverpass(item.keyword, item.city, 20);
    let addedCount = 0;
    let skippedCount = 0;

    for (const elem of rawElements) {
      const processRes = await processElement(elem, item.keyword, item.city);
      if (processRes.success) addedCount++;
      else skippedCount++;
    }

    item.status = 'Completed';
    item.lastRun = new Date().toISOString();
    batchReport.push({
      keyword: item.keyword,
      city: item.city,
      totalOSM: rawElements.length,
      leadsAdded: addedCount,
      skipped: skippedCount
    });
  }

  saveSearchQueue(queue);
  console.log(`[QUEUE BATCH COMPLETED] Done processing all items.\n`);
  res.json({ success: true, processedItems: batchReport });
});

// 6. Get Saved Leads with filtering
app.get('/api/leads', (req, res) => {
  const { priority, service, search } = req.query;
  let leads = getSavedLeads();

  if (priority && priority !== 'All') {
    leads = leads.filter(l => l.leadPriority?.toLowerCase() === priority.toLowerCase());
  }

  if (service && service !== 'All') {
    leads = leads.filter(l => l.recommendedService?.toLowerCase() === service.toLowerCase());
  }

  if (search) {
    const q = search.toLowerCase();
    leads = leads.filter(l =>
      (l.businessName && l.businessName.toLowerCase().includes(q)) ||
      (l.category && l.category.toLowerCase().includes(q)) ||
      (l.city && l.city.toLowerCase().includes(q)) ||
      (l.phone && l.phone.toLowerCase().includes(q))
    );
  }

  res.json({ success: true, total: leads.length, leads });
});

// 7. Get Summary Stats
app.get('/api/stats', (req, res) => {
  const leads = getSavedLeads();
  const processedIds = getProcessedIds();
  const queue = getSearchQueue();

  const hotCount = leads.filter(l => l.leadPriority === 'Hot').length;
  const warmCount = leads.filter(l => l.leadPriority === 'Warm').length;
  const noWebsiteCount = leads.filter(l => l.websiteStatus === 'No Website').length;
  const readyQueueCount = queue.filter(q => q.status === 'Ready').length;

  res.json({
    totalLeads: leads.length,
    hotLeads: hotCount,
    warmLeads: warmCount,
    noWebsiteLeads: noWebsiteCount,
    totalUniqueProcessed: Object.keys(processedIds).length,
    readyQueueCount
  });
});

// 8. Export CSV (Exact 26 columns)
app.get('/api/export-csv', (req, res) => {
  const leads = getSavedLeads();
  
  const headers = [
    'Lead ID',
    'Business Name',
    'Category',
    'City',
    'Address',
    'Phone',
    'Website',
    'Google Maps URL',
    'Rating',
    'Reviews',
    'Website Status',
    'Website Quality',
    'Mobile Friendly',
    'CTA',
    'WhatsApp',
    'Online Booking',
    'Ads Status',
    'Automation Status',
    'AI Opportunity',
    'Lead Score',
    'Lead Priority',
    'Recommended Service',
    'Audit Reason',
    'Outreach Message',
    'Source',
    'Date Added'
  ];

  const escapeCsv = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = leads.map(l => [
    escapeCsv(l.leadId),
    escapeCsv(l.businessName),
    escapeCsv(l.category),
    escapeCsv(l.city),
    escapeCsv(l.address),
    escapeCsv(l.phone),
    escapeCsv(l.website),
    escapeCsv(l.googleMapsUrl),
    escapeCsv(l.rating),
    escapeCsv(l.reviews),
    escapeCsv(l.websiteStatus),
    escapeCsv(l.websiteQuality),
    escapeCsv(l.mobileFriendly),
    escapeCsv(l.cta),
    escapeCsv(l.whatsApp),
    escapeCsv(l.onlineBooking),
    escapeCsv(l.adsStatus),
    escapeCsv(l.automationStatus),
    escapeCsv(l.aiOpportunity),
    escapeCsv(l.leadScore),
    escapeCsv(l.leadPriority),
    escapeCsv(l.recommendedService),
    escapeCsv(l.auditReason),
    escapeCsv(l.outreachMessage),
    escapeCsv(l.source),
    escapeCsv(l.dateAdded)
  ].join(','));

  const csvContent = [headers.join(','), ...rows].join('\r\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="leads_export_26_columns.csv"');
  res.send(csvContent);
});

// 9. Get / Update Google Sheet Settings
import { getSettings, saveSettings } from './googleSheetSync.js';

app.get('/api/settings', (req, res) => {
  res.json(getSettings());
});

app.post('/api/settings', (req, res) => {
  const { googleSheetWebhookUrl } = req.body;
  const settings = getSettings();
  settings.googleSheetWebhookUrl = (googleSheetWebhookUrl || '').trim();
  saveSettings(settings);
  console.log(`[SETTINGS] Updated Google Sheet Webhook URL: ${settings.googleSheetWebhookUrl ? 'Configured' : 'Cleared'}`);
  res.json({ success: true, settings });
});

// 10. Sync All Existing Leads to Google Sheets
app.post('/api/sync-all-to-sheets', async (req, res) => {
  const settings = getSettings();
  const webhookUrl = settings.googleSheetWebhookUrl;

  if (!webhookUrl) {
    return res.status(400).json({ error: 'Please configure your Google Sheet Webhook URL first in Settings!' });
  }

  const leads = getSavedLeads();
  if (leads.length === 0) {
    return res.json({ success: true, message: 'No leads to sync', count: 0 });
  }

  const sanitize = (val) => {
    if (val === null || val === undefined) return '';
    const s = String(val).trim();
    if (s.startsWith('+') || s.startsWith('=')) {
      return "'" + s;
    }
    return s;
  };

  const rows = leads.map(lead => [
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
  ]);

  try {
    const fetchRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'syncAll', leads: rows })
    });
    const json = await fetchRes.json().catch(() => ({}));
    res.json({ success: true, count: leads.length, response: json });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 11. WhatsApp Auto-Sender & Official Meta Cloud API Endpoints
import {
  initWhatsApp,
  getWhatsAppStatus,
  sendWhatsAppMessage,
  startWhatsAppCampaign,
  stopWhatsAppCampaign,
  logoutWhatsApp,
  testWhatsAppCloudApiConnection,
  sendBulkCustomWhatsAppMessages
} from './whatsappService.js';

app.get('/api/whatsapp/status', (req, res) => {
  res.json(getWhatsAppStatus());
});

// WhatsApp Cloud API Configuration
app.get('/api/whatsapp/config', (req, res) => {
  const settings = getSettings();
  res.json({
    waPhoneNumberId: settings.waPhoneNumberId || '',
    waAccessToken: settings.waAccessToken || '',
    waBusinessPhone: settings.waBusinessPhone || '',
    waAccountId: settings.waAccountId || '',
    waApiVersion: settings.waApiVersion || 'v20.0',
    waMode: settings.waMode || 'CLOUD_API',
    waVerifiedName: settings.waVerifiedName || '',
    isConfigured: Boolean(settings.waPhoneNumberId && settings.waAccessToken)
  });
});

app.post('/api/whatsapp/config', async (req, res) => {
  try {
    const { waPhoneNumberId, waAccessToken, waBusinessPhone, waAccountId, waApiVersion, waMode } = req.body;
    const settings = getSettings();

    settings.waPhoneNumberId = (waPhoneNumberId || '').trim();
    settings.waAccessToken = (waAccessToken || '').trim();
    settings.waBusinessPhone = (waBusinessPhone || '').trim();
    settings.waAccountId = (waAccountId || '').trim();
    settings.waApiVersion = (waApiVersion || 'v20.0').trim();
    settings.waMode = waMode || 'CLOUD_API';

    saveSettings(settings);
    console.log(`[SETTINGS] Updated WhatsApp Business Cloud API Configuration (Phone ID: ${settings.waPhoneNumberId || 'None'})`);

    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Test Meta WhatsApp Cloud API Connection
app.post('/api/whatsapp/test-cloud-api', async (req, res) => {
  const { phoneNumberId, accessToken, apiVersion } = req.body;
  try {
    const testResult = await testWhatsAppCloudApiConnection(phoneNumberId, accessToken, apiVersion);
    
    // Auto-save verified name & phone number to settings
    const settings = getSettings();
    if (testResult.verifiedName) settings.waVerifiedName = testResult.verifiedName;
    if (testResult.displayPhoneNumber && !settings.waBusinessPhone) {
      settings.waBusinessPhone = testResult.displayPhoneNumber;
    }
    saveSettings(settings);

    res.json({ success: true, ...testResult });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/whatsapp/init', async (req, res) => {
  await initWhatsApp();
  res.json({ success: true });
});

app.post('/api/whatsapp/send-single', async (req, res) => {
  const { phone, message, leadId, memberName } = req.body;
  if (!phone || !message) {
    return res.status(400).json({ error: 'Phone and Message are required' });
  }
  try {
    const result = await sendWhatsAppMessage(phone, message, leadId, memberName || 'Team Member');
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/whatsapp/send-bulk-custom', async (req, res) => {
  const { numbers, message, memberName } = req.body;
  if (!numbers || !message) {
    return res.status(400).json({ error: 'Phone numbers list and Message are required' });
  }
  try {
    const result = await sendBulkCustomWhatsAppMessages(numbers, message, memberName || 'Team Member');
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/whatsapp/start-campaign', async (req, res) => {
  const { memberName } = req.body;
  try {
    const result = await startWhatsAppCampaign(memberName || 'Team Member');
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

import { getSentRegistry } from './contactRegistry.js';

app.get('/api/contact-registry', (req, res) => {
  res.json(getSentRegistry());
});

app.post('/api/whatsapp/stop-campaign', (req, res) => {
  res.json(stopWhatsAppCampaign());
});

app.post('/api/whatsapp/logout', async (req, res) => {
  res.json(await logoutWhatsApp());
});

// Start WhatsApp on startup
initWhatsApp();

const server = app.listen(PORT, () => {
  console.log(`\n================================================================`);
  console.log(`  🚀 LOCAL BUSINESS LEAD GENERATION & WEBSITE AUDIT SYSTEM`);
  console.log(`  🌐 Dashboard URL: http://localhost:${PORT}`);
  console.log(`  🛡️ 100% Free - OpenStreetMap + Deterministic Auditor`);
  console.log(`================================================================\n`);
  
  // Auto-open browser on Windows
  if (process.platform === 'win32') {
    exec(`start http://localhost:${PORT}`);
  }
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n[PORT IN USE] Port ${PORT} is already occupied. Retrying on port ${Number(PORT) + 1}...`);
    app.listen(Number(PORT) + 1, () => {
      console.log(`\n🚀 Dashboard started at http://localhost:${Number(PORT) + 1}`);
      if (process.platform === 'win32') {
        exec(`start http://localhost:${Number(PORT) + 1}`);
      }
    });
  } else {
    console.error(`[SERVER ERROR]`, err);
  }
});
