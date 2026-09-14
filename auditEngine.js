import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { syncLeadToGoogleSheet } from './googleSheetSync.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_STORE_PATH = path.join(__dirname, 'leads_data_store.json');
const LEADS_DB_PATH = path.join(__dirname, 'leads_database.json');
const SEARCH_QUEUE_PATH = path.join(__dirname, 'search_queue.json');

// Initialize local stores
function initStores() {
  if (!fs.existsSync(DATA_STORE_PATH)) {
    fs.writeFileSync(DATA_STORE_PATH, JSON.stringify({ processedIds: {} }, null, 2));
  }
  if (!fs.existsSync(LEADS_DB_PATH)) {
    fs.writeFileSync(LEADS_DB_PATH, JSON.stringify([], null, 2));
  }
  if (!fs.existsSync(SEARCH_QUEUE_PATH)) {
    const defaultQueue = [
      { id: '1', keyword: 'dentist', city: 'Mumbai', status: 'Ready', createdAt: new Date().toISOString() },
      { id: '2', keyword: 'restaurant', city: 'Delhi', status: 'Ready', createdAt: new Date().toISOString() },
      { id: '3', keyword: 'salon', city: 'Bangalore', status: 'Ready', createdAt: new Date().toISOString() }
    ];
    fs.writeFileSync(SEARCH_QUEUE_PATH, JSON.stringify(defaultQueue, null, 2));
  }
}

initStores();

export function getProcessedIds() {
  try {
    const data = JSON.parse(fs.readFileSync(DATA_STORE_PATH, 'utf-8'));
    return data.processedIds || {};
  } catch (err) {
    return {};
  }
}

export function saveProcessedId(osmKey) {
  try {
    const data = getProcessedIds();
    data[osmKey] = { processedAt: new Date().toISOString() };
    fs.writeFileSync(DATA_STORE_PATH, JSON.stringify({ processedIds: data }, null, 2));
  } catch (err) {
    console.error('Error saving processed ID:', err);
  }
}

export function getSavedLeads() {
  try {
    return JSON.parse(fs.readFileSync(LEADS_DB_PATH, 'utf-8'));
  } catch (err) {
    return [];
  }
}

export function saveLead(lead) {
  try {
    const leads = getSavedLeads();
    leads.unshift(lead);
    fs.writeFileSync(LEADS_DB_PATH, JSON.stringify(leads, null, 2));
  } catch (err) {
    console.error('Error saving lead:', err);
  }
}

export function getSearchQueue() {
  try {
    return JSON.parse(fs.readFileSync(SEARCH_QUEUE_PATH, 'utf-8'));
  } catch (err) {
    return [];
  }
}

export function saveSearchQueue(queue) {
  fs.writeFileSync(SEARCH_QUEUE_PATH, JSON.stringify(queue, null, 2));
}

// Top Worldwide Commercial Cities by Region
export const GLOBAL_CITIES = {
  USA: ['New York', 'Los Angeles', 'Chicago', 'Miami', 'Houston', 'San Francisco', 'Austin', 'Seattle', 'Las Vegas', 'Dallas', 'Boston', 'Atlanta'],
  UK: ['London', 'Manchester', 'Birmingham', 'Edinburgh', 'Leeds', 'Liverpool', 'Bristol', 'Glasgow'],
  UAE: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Doha', 'Riyadh'],
  Canada: ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa'],
  Australia: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide'],
  Europe: ['Berlin', 'Paris', 'Amsterdam', 'Dublin', 'Madrid', 'Rome', 'Zurich', 'Vienna'],
  India: ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Pune', 'Chennai', 'Kolkata', 'Ahmedabad', 'Jaipur'],
  Singapore: ['Singapore']
};

export const GLOBAL_NICHES = [
  'dentist',
  'clinic',
  'restaurant',
  'salon',
  'gym',
  'hotel',
  'cafe',
  'physiotherapist',
  'car_repair',
  'lawyer',
  'spa',
  'veterinary',
  'bakery',
  'bar',
  'dry_cleaning'
];

export function getRandomGlobalTarget(preferredRegion = 'Worldwide') {
  let cities = [];
  if (preferredRegion && preferredRegion !== 'Worldwide' && GLOBAL_CITIES[preferredRegion]) {
    cities = GLOBAL_CITIES[preferredRegion];
  } else {
    // Combine all cities worldwide
    cities = Object.values(GLOBAL_CITIES).flat();
  }

  const randomCity = cities[Math.floor(Math.random() * cities.length)];
  const randomKeyword = GLOBAL_NICHES[Math.floor(Math.random() * GLOBAL_NICHES.length)];

  return { city: randomCity, keyword: randomKeyword, region: preferredRegion };
}

// 1. Geocode City using Nominatim (with strict 5s timeout)
async function geocodeCity(city) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  try {
    const geoUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`;
    const res = await fetch(geoUrl, {
      headers: { 'User-Agent': 'LeadGenTool-Agency/1.0' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.length > 0 && data[0].boundingbox) {
      const [south, north, west, east] = data[0].boundingbox;
      return { south, north, west, east };
    }
  } catch (e) {
    clearTimeout(timeoutId);
  }
  return null;
}

// 2. Fetch businesses from OpenStreetMap Overpass API
export async function searchOverpass(keyword, city, maxResults = 20) {
  const cleanKeyword = keyword.toLowerCase().trim();
  const cleanCity = city.trim();

  // Try fast Geocoding first
  const bbox = await geocodeCity(cleanCity);
  
  let overpassQuery = '';
  if (bbox) {
    overpassQuery = `[out:json][timeout:15];
(
  nwr["amenity"~"${cleanKeyword}",i](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
  nwr["healthcare"~"${cleanKeyword}",i](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
  nwr["shop"~"${cleanKeyword}",i](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
  nwr["leisure"~"${cleanKeyword}",i](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
  nwr["office"~"${cleanKeyword}",i](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
  nwr["tourism"~"${cleanKeyword}",i](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
);
out center ${maxResults};`;
  } else {
    overpassQuery = `[out:json][timeout:15];
area["name"~"${cleanCity}",i]->.searchArea;
(
  nwr["amenity"~"${cleanKeyword}",i](area.searchArea);
  nwr["shop"~"${cleanKeyword}",i](area.searchArea);
  nwr["healthcare"~"${cleanKeyword}",i](area.searchArea);
  nwr["office"~"${cleanKeyword}",i](area.searchArea);
);
out center ${maxResults};`;
  }

  const endpoints = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://maps.mail.ru/osm/tools/overpass/api/interpreter'
  ];

  for (const ep of endpoints) {
    try {
      const bodyParams = new URLSearchParams();
      bodyParams.append('data', overpassQuery);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const res = await fetch(ep, {
        method: 'POST',
        headers: {
          'User-Agent': 'LeadGenTool-Agency/1.0',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: bodyParams.toString(),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data.elements && data.elements.length > 0) {
          return data.elements;
        }
      }
    } catch (err) {
      // Try next mirror
    }
  }

  return [];
}

// 3. Fast & Graceful Website Fetcher (6s timeout)
export async function fetchWebsite(url) {
  if (!url) return { ok: false, error: 'No URL provided' };
  
  let targetUrl = url.trim();
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = 'https://' + targetUrl;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      redirect: 'follow',
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return { ok: false, status: `HTTP ${response.status}`, url: targetUrl };
    }

    const html = await response.text();
    return { ok: true, html, url: response.url || targetUrl };
  } catch (error) {
    clearTimeout(timeoutId);
    return { ok: false, error: error.message, url: targetUrl };
  }
}

// 4. Rule-Based Website Audit Engine (No AI API, 100% Deterministic)
export function auditWebsiteHtml(html, siteUrl, businessName, category, city) {
  const lowerHtml = (html || '').toLowerCase();
  
  const isHttps = siteUrl.toLowerCase().startsWith('https://') || lowerHtml.includes('https://') ? 'Yes' : 'No';
  const hasViewport = lowerHtml.includes('name="viewport"') || lowerHtml.includes("name='viewport'") ? 'Yes' : 'No';
  const hasPhone = lowerHtml.includes('tel:') || lowerHtml.includes('call now') || lowerHtml.includes('phone') ? 'Detected' : 'Not detected';
  const hasCTA = lowerHtml.includes('contact') || lowerHtml.includes('get quote') || lowerHtml.includes('get started') || lowerHtml.includes('inquiry') || lowerHtml.includes('request a quote') ? 'Detected' : 'Not detected';
  const hasWhatsApp = lowerHtml.includes('wa.me') || lowerHtml.includes('whatsapp.com') || lowerHtml.includes('api.whatsapp.com') ? 'Detected' : 'Not detected';
  const hasBooking = lowerHtml.includes('calendly.com') || lowerHtml.includes('acuityscheduling.com') || lowerHtml.includes('appointment') || lowerHtml.includes('book now') || lowerHtml.includes('schedule') || lowerHtml.includes('zocdoc') ? 'Detected' : 'Not detected';
  const hasTracking = lowerHtml.includes('googletagmanager.com') || lowerHtml.includes('fbq(') || lowerHtml.includes('connect.facebook.net') || lowerHtml.includes('google_conversion') ? 'Detected' : 'Not detected';

  let score = 0;
  if (isHttps === 'No') score += 20;
  if (hasViewport === 'No') score += 25;
  if (hasWhatsApp === 'Not detected') score += 15;
  if (hasBooking === 'Not detected') score += 20;
  if (hasCTA === 'Not detected') score += 10;
  if (hasTracking === 'Not detected') score += 10;

  let leadPriority = 'Low';
  if (score >= 80) leadPriority = 'Hot';
  else if (score >= 60) leadPriority = 'Warm';
  else if (score >= 40) leadPriority = 'Potential';

  let recommendedService = 'Digital Marketing Setup';
  if (hasViewport === 'No') recommendedService = 'Mobile Optimization';
  else if (isHttps === 'No') recommendedService = 'Website Redesign';
  else if (hasBooking === 'Not detected') recommendedService = 'Online Booking System';
  else if (hasWhatsApp === 'Not detected') recommendedService = 'WhatsApp Automation';

  const reasons = [];
  if (isHttps === 'No') reasons.push('No SSL/HTTPS');
  if (hasViewport === 'No') reasons.push('Not Mobile Responsive');
  if (hasWhatsApp === 'Not detected') reasons.push('Missing Direct WhatsApp Hook');
  if (hasBooking === 'Not detected') reasons.push('No Instant Online Booking');
  if (hasTracking === 'Not detected') reasons.push('No Retargeting Pixel/Analytics');
  const auditReason = reasons.length > 0 ? reasons.join(', ') : 'Standard Web Maintenance';

  // Deterministic Outreach Pitch Generator (English & Hinglish)
  const missingFeaturesEn = [];
  const missingFeaturesHi = [];
  if (hasViewport === 'No') {
    missingFeaturesEn.push('mobile responsiveness');
    missingFeaturesHi.push('mobile-friendly design');
  }
  if (hasWhatsApp === 'Not detected') {
    missingFeaturesEn.push('1-click WhatsApp customer chat');
    missingFeaturesHi.push('direct WhatsApp customer chat button');
  }
  if (hasBooking === 'Not detected') {
    missingFeaturesEn.push('direct appointment booking');
    missingFeaturesHi.push('online appointment booking system');
  }
  
  const featureListEn = missingFeaturesEn.length > 0 ? missingFeaturesEn.join(' and ') : 'modern design upgrades';
  const featureListHi = missingFeaturesHi.length > 0 ? missingFeaturesHi.join(' aur ') : 'website upgrades';

  // Default to friendly Hinglish (highest conversion for Indian local businesses) with English fallback
  const outreachMessage = `Namaste ${businessName || 'Sir/Ma\'am'}, maine aapka ${category} business ${city} me review kiya. Aapki website ${siteUrl} par agar ${featureListHi} add karein toh aapko local clients se daily 2x se 3x zyada inquiries & bookings mil sakti hain. Hum ise 2 din me set up kar sakte hain. Kya hum ispar 5-min discuss kar sakte hain?`;

  return {
    isHttps,
    hasViewport,
    hasPhone,
    hasCTA,
    hasWhatsApp,
    hasBooking,
    hasTracking,
    calculatedScore: score,
    leadPriority,
    recommendedService,
    auditReason,
    outreachMessage,
    outreachMessageEn: `Hi ${businessName || 'Business Owner'}, I checked ${siteUrl} for your ${category} in ${city} and noticed you could attract significantly more clients by adding ${featureListEn}. We can set this up quickly for you. Would you be open to a quick 5-min demo?`,
    websiteQuality: score > 60 ? 'Needs Improvement' : 'Fair',
    automationStatus: score >= 60 ? 'High Opportunity' : 'Moderate Opportunity'
  };
}

// 5. Process a single OSM Element
export async function processElement(elem, queueKeyword, queueCity) {
  const osmType = elem.type || 'node';
  const osmId = elem.id;
  const leadId = `${osmType}:${osmId}`;
  
  const processedIds = getProcessedIds();
  if (processedIds[leadId]) {
    return { skipped: true, reason: 'Duplicate ID already processed', leadId };
  }

  const tags = elem.tags || {};
  const businessName = tags.name || 'Unnamed Business';
  const category = tags.amenity || tags.shop || tags.healthcare || tags.office || queueKeyword || 'Business';
  const city = tags['addr:city'] || queueCity || 'Unknown City';
  
  const addressParts = [
    tags['addr:housename'],
    tags['addr:housenumber'],
    tags['addr:street'],
    tags['addr:city'],
    tags['addr:postcode']
  ].filter(Boolean);
  const address = addressParts.length > 0 ? addressParts.join(', ') : `${city} Area`;
  const phone = tags.phone || tags['contact:phone'] || 'Not listed';

  const websiteUrl = tags.website || tags['contact:website'] || tags.url || '';
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

  let leadRecord = null;

  // ROUTE A: No Website
  if (!websiteUrl) {
    leadRecord = {
      leadId,
      businessName,
      category,
      city,
      address,
      phone,
      website: '',
      googleMapsUrl: 'Not available',
      rating: 'Not available',
      reviews: 'Not available',
      websiteStatus: 'No Website',
      websiteQuality: 'Poor',
      mobileFriendly: 'No',
      cta: 'Not visible',
      whatsApp: 'Not visible',
      onlineBooking: 'Not visible',
      adsStatus: 'Unknown',
      automationStatus: 'High Opportunity',
      aiOpportunity: 'Rule-based audit; no AI API used',
      leadScore: 85,
      leadPriority: 'Hot',
      recommendedService: 'Website Development',
      auditReason: 'Business has no publicly listed website',
      outreachMessage: `Namaste ${businessName || 'Sir/Ma\'am'}, maine notice kiya ki ${city} me aapke ${category} business ki koi active website nahi hai. Aaj kal 80% clients pehle Google pe search karte hain. Hum aapke business ke liye ek professional website & WhatsApp inquiry system bana sakte hain. Kya hum 5-min discuss kar sakte hain?`,
      outreachMessageEn: `Hi ${businessName}, noticed your ${category} in ${city} does not have an active website. We help local businesses build high-converting websites to generate daily inquiries. Would you be open for a quick demo?`,
      source: 'OpenStreetMap / Overpass',
      dateAdded: now
    };
  } else {
    // ROUTE B: Website Exists -> Fetch & Audit
    const fetchRes = await fetchWebsite(websiteUrl);
    
    if (!fetchRes.ok) {
      leadRecord = {
        leadId,
        businessName,
        category,
        city,
        address,
        phone,
        website: websiteUrl,
        googleMapsUrl: 'Not available',
        rating: 'Not available',
        reviews: 'Not available',
        websiteStatus: 'Unable to fetch',
        websiteQuality: 'Unknown',
        mobileFriendly: 'Unknown',
        cta: 'Unknown',
        whatsApp: 'Unknown',
        onlineBooking: 'Unknown',
        adsStatus: 'Unknown / Not publicly verifiable',
        automationStatus: 'High Opportunity',
        aiOpportunity: 'Rule-based audit; no AI API used',
        leadScore: 65,
        leadPriority: 'Warm',
        recommendedService: 'Website Redesign',
        auditReason: 'Website could not be fetched for automated inspection (Server down / SSL broken)',
        outreachMessage: `Hi ${businessName}, we noticed your website ${websiteUrl} seems to be down or inaccessible. Having an active site is critical for your ${category} in ${city}. Can we help you restore it?`,
        source: 'OpenStreetMap / Overpass',
        dateAdded: now
      };
    } else {
      const audit = auditWebsiteHtml(fetchRes.html, fetchRes.url, businessName, category, city);
      
      // Filter: Only leads with score >= 40
      if (audit.calculatedScore < 40) {
        return { skipped: true, reason: 'Lead score below qualification threshold (< 40)', leadId, score: audit.calculatedScore };
      }

      leadRecord = {
        leadId,
        businessName,
        category,
        city,
        address,
        phone,
        website: fetchRes.url,
        googleMapsUrl: 'Not available',
        rating: 'Not available',
        reviews: 'Not available',
        websiteStatus: 'Live',
        websiteQuality: audit.websiteQuality,
        mobileFriendly: audit.hasViewport,
        cta: audit.hasCTA,
        whatsApp: audit.hasWhatsApp,
        onlineBooking: audit.hasBooking,
        adsStatus: audit.hasTracking,
        automationStatus: audit.automationStatus,
        aiOpportunity: 'Rule-based audit; no AI API used',
        leadScore: audit.calculatedScore,
        leadPriority: audit.leadPriority,
        recommendedService: audit.recommendedService,
        auditReason: audit.auditReason,
        outreachMessage: audit.outreachMessage,
        source: 'OpenStreetMap / Overpass',
        dateAdded: now
      };
    }
  }

  // Save Lead and commit ID to duplicate store
  if (leadRecord) {
    saveLead(leadRecord);
    saveProcessedId(leadId);
    
    // Auto-sync to Google Sheet (if webhook URL is configured)
    syncLeadToGoogleSheet(leadRecord).catch(() => {});

    return { success: true, lead: leadRecord };
  }

  return { skipped: true, reason: 'Unspecified condition', leadId };
}
