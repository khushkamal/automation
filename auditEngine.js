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

// High-Budget, High-Ticket Niches with High Purchasing Power & High Lifetime Client Value
export const HIGH_TICKET_NICHES = [
  {
    category: 'Dental & Implant Clinics',
    keywords: ['dentist', 'dental_clinic', 'orthodontist', 'implant_dentistry'],
    ticketSize: 'High Ticket (₹20k - ₹1.5L+ per patient)',
    purchasingPower: 'High Budget',
    budgetScore: 95
  },
  {
    category: 'Dermatology & Cosmetic Surgery',
    keywords: ['dermatologist', 'cosmetic_clinic', 'plastic_surgeon', 'hair_transplant', 'aesthetic_clinic'],
    ticketSize: 'High Ticket (₹25k - ₹2L+ per treatment)',
    purchasingPower: 'High Budget',
    budgetScore: 98
  },
  {
    category: 'Real Estate & Luxury Builders',
    keywords: ['real_estate', 'property_developer', 'real_estate_agency', 'builder', 'realtor'],
    ticketSize: 'Ultra High Ticket (₹50L - ₹5Cr+ per deal)',
    purchasingPower: 'High Budget',
    budgetScore: 99
  },
  {
    category: 'Architects & Luxury Interior Designers',
    keywords: ['interior_designer', 'architect', 'modular_kitchen', 'architectural_firm'],
    ticketSize: 'High Ticket (₹2L - ₹25L+ per project)',
    purchasingPower: 'High Budget',
    budgetScore: 94
  },
  {
    category: 'Corporate Lawyers & Legal Firms',
    keywords: ['lawyer', 'law_firm', 'advocate', 'legal_services'],
    ticketSize: 'High Ticket (₹50k - ₹5L+ retainer)',
    purchasingPower: 'High Budget',
    budgetScore: 92
  },
  {
    category: 'Chartered Accountants & Financial Advisors',
    keywords: ['chartered_accountant', 'tax_consultant', 'wealth_management', 'financial_advisor'],
    ticketSize: 'High Ticket (₹50k - ₹3L+ annual)',
    purchasingPower: 'High Budget',
    budgetScore: 90
  },
  {
    category: 'Luxury Hotels, Resorts & Banquets',
    keywords: ['hotel', 'resort', 'banquet_hall', 'wedding_venue', 'event_planner'],
    ticketSize: 'High Ticket (₹1L - ₹10L+ per event)',
    purchasingPower: 'High Budget',
    budgetScore: 96
  },
  {
    category: 'Car Detailing & Luxury Auto Studios',
    keywords: ['car_detailing', 'auto_customization', 'car_dealership', 'car_repair'],
    ticketSize: 'High Ticket (₹30k - ₹2L+ per vehicle)',
    purchasingPower: 'High Budget',
    budgetScore: 91
  },
  {
    category: 'Solar Rooftop & Energy Contractors',
    keywords: ['solar_installer', 'solar_energy', 'roofing_contractor', 'general_contractor'],
    ticketSize: 'High Ticket (₹1.5L - ₹15L+ per installation)',
    purchasingPower: 'High Budget',
    budgetScore: 93
  },
  {
    category: 'Immigration & Study Abroad Consultants',
    keywords: ['immigration_consultant', 'study_abroad', 'visa_consultancy'],
    ticketSize: 'High Ticket (₹50k - ₹3L+ per client)',
    purchasingPower: 'High Budget',
    budgetScore: 92
  },
  {
    category: 'Premium Wellness & Luxury Spas',
    keywords: ['spa', 'wellness_center', 'ayurvedic_resort', 'physiotherapy_center'],
    ticketSize: 'High Ticket (₹5k - ₹50k+ per package)',
    purchasingPower: 'High Budget',
    budgetScore: 88
  },
  {
    category: 'Fine Dining & Gourmet Lounges',
    keywords: ['fine_dining', 'restaurant', 'lounge', 'brewery'],
    ticketSize: 'High Volume / High Margin',
    purchasingPower: 'High Budget',
    budgetScore: 86
  }
];

// Negative Keywords & Low-Profit Micro-Store Exclusions (Filter out small budget shops)
export const LOW_PROFIT_EXCLUSIONS = [
  'kirana', 'general store', 'general_store', 'paan', 'pan shop', 'chai', 'tea stall', 'tea_stall',
  'ration', 'kiosk', 'convenience', 'tobacco', 'newsagent', 'greengrocer', 'butcher',
  'shoe_repair', 'tailor', 'xerox', 'cyber cafe', 'stationary', 'stationery', 'dairy',
  'laundry', 'cycle', 'puncture', 'snack_bar', 'dry_cleaning', 'variety store', 'provisions',
  'sweet shop', 'mithai', 'grocery', 'superette', 'hardware store small', 'bidi', 'pan corner',
  'small store', 'stall', 'shack', 'booth', 'hawker'
];

export function isLowProfitMicroBusiness(name, category, tags = {}) {
  const checkStr = `${name || ''} ${category || ''} ${tags.shop || ''} ${tags.amenity || ''} ${tags.craft || ''}`.toLowerCase();
  
  // Exclude unnamed elements
  if (!name || name === 'Unnamed Business' || name.trim().length < 3) return true;
  
  // Exclude micro-store keywords
  for (const neg of LOW_PROFIT_EXCLUSIONS) {
    if (checkStr.includes(neg)) return true;
  }
  return false;
}

// Top Worldwide Commercial Cities by Region
export const GLOBAL_CITIES = {
  USA: ['New York', 'Los Angeles', 'Chicago', 'Miami', 'Houston', 'San Francisco', 'Austin', 'Seattle', 'Las Vegas', 'Dallas', 'Boston', 'Atlanta'],
  UK: ['London', 'Manchester', 'Birmingham', 'Edinburgh', 'Leeds', 'Liverpool', 'Bristol', 'Glasgow'],
  UAE: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Doha', 'Riyadh'],
  Canada: ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa'],
  Australia: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide'],
  Europe: ['Berlin', 'Paris', 'Amsterdam', 'Dublin', 'Madrid', 'Rome', 'Zurich', 'Vienna'],
  India: ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Pune', 'Chennai', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Chandigarh', 'Gurgaon', 'Noida'],
  Singapore: ['Singapore']
};

export const GLOBAL_NICHES = [
  'cosmetic clinic',
  'dental clinic',
  'dermatologist',
  'real estate agency',
  'interior designer',
  'architect',
  'law firm',
  'chartered accountant',
  'luxury hotel',
  'car detailing',
  'solar installer',
  'immigration consultant',
  'wellness spa',
  'fine dining',
  'hair transplant'
];

export function getRandomGlobalTarget(preferredRegion = 'Worldwide') {
  let cities = [];
  if (preferredRegion && preferredRegion !== 'Worldwide' && GLOBAL_CITIES[preferredRegion]) {
    cities = GLOBAL_CITIES[preferredRegion];
  } else {
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

// Map user-friendly high ticket search queries to exact OpenStreetMap tags & filters
export function getOsmTagFilters(keyword) {
  const kw = (keyword || '').toLowerCase().trim();
  
  if (kw.includes('cosmetic') || kw.includes('dermatolog') || kw.includes('skin') || kw.includes('aesthetic') || kw.includes('hair transplant')) {
    return [
      '["amenity"="clinic"]',
      '["healthcare"="clinic"]',
      '["healthcare"="doctor"]',
      '["healthcare"="dermatologist"]',
      '["name"~"clinic|skin|cosmetic|laser|aesthetic|derma",i]'
    ];
  }
  if (kw.includes('dent') || kw.includes('implant') || kw.includes('orthodont')) {
    return [
      '["amenity"="dentist"]',
      '["healthcare"="dentist"]',
      '["name"~"dental|dentist|implant|smile|orthodont",i]'
    ];
  }
  if (kw.includes('real estate') || kw.includes('builder') || kw.includes('realtor') || kw.includes('property')) {
    return [
      '["office"="estate_agent"]',
      '["office"="property_management"]',
      '["name"~"realty|real estate|properties|developer|infra|builder",i]'
    ];
  }
  if (kw.includes('interior') || kw.includes('architect')) {
    return [
      '["office"="architect"]',
      '["office"="interior_decorator"]',
      '["craft"="interior_work"]',
      '["name"~"architect|interior|designer|studio|decor",i]'
    ];
  }
  if (kw.includes('law') || kw.includes('legal') || kw.includes('advocate') || kw.includes('attorney')) {
    return [
      '["office"="lawyer"]',
      '["office"="legal"]',
      '["name"~"law|legal|advocate|attorney|associates",i]'
    ];
  }
  if (kw.includes('ca') || kw.includes('account') || kw.includes('tax') || kw.includes('audit')) {
    return [
      '["office"="accountant"]',
      '["office"="tax_advisor"]',
      '["office"="financial_advisor"]',
      '["name"~"chartered|accountant|tax|audit|consulting",i]'
    ];
  }
  if (kw.includes('hotel') || kw.includes('resort') || kw.includes('banquet') || kw.includes('wedding')) {
    return [
      '["tourism"="hotel"]',
      '["tourism"="resort"]',
      '["amenity"="events_venue"]',
      '["name"~"hotel|resort|banquet|palace|suites",i]'
    ];
  }
  if (kw.includes('car') || kw.includes('auto') || kw.includes('detailing')) {
    return [
      '["shop"="car_repair"]',
      '["shop"="car"]',
      '["name"~"detailing|motors|auto|custom|garage|service",i]'
    ];
  }
  if (kw.includes('solar') || kw.includes('energy')) {
    return [
      '["office"="energy_supplier"]',
      '["craft"="electrician"]',
      '["name"~"solar|energy|renewable|power",i]'
    ];
  }
  if (kw.includes('spa') || kw.includes('wellness')) {
    return [
      '["amenity"="spa"]',
      '["leisure"="spa"]',
      '["name"~"spa|wellness|ayurveda|rejuvenation",i]'
    ];
  }
  if (kw.includes('visa') || kw.includes('immigrat') || kw.includes('study abroad')) {
    return [
      '["office"="educational_institution"]',
      '["office"="consulting"]',
      '["name"~"immigration|visa|study abroad|overseas|consultancy",i]'
    ];
  }

  // Fallback single-word token matching
  const token = kw.split(/\s+/)[0];
  return [
    `["amenity"~"${token}",i]`,
    `["office"~"${token}",i]`,
    `["healthcare"~"${token}",i]`,
    `["shop"~"${token}",i]`,
    `["tourism"~"${token}",i]`,
    `["name"~"${token}",i]`
  ];
}

// 2. Fetch businesses from OpenStreetMap Overpass API
export async function searchOverpass(keyword, city, maxResults = 20) {
  const cleanKeyword = (keyword || '').toLowerCase().trim();
  const cleanCity = (city || '').trim();

  // Try fast Geocoding first
  const bbox = await geocodeCity(cleanCity);
  const tagFilters = getOsmTagFilters(cleanKeyword);
  
  let overpassQuery = '';
  if (bbox) {
    const filterClauses = tagFilters.map(f => `  nwr${f}(${bbox.south},${bbox.west},${bbox.north},${bbox.east});`).join('\n');
    overpassQuery = `[out:json][timeout:15];
(
${filterClauses}
);
out center ${maxResults};`;
  } else {
    const filterClauses = tagFilters.map(f => `  nwr${f}(area.searchArea);`).join('\n');
    overpassQuery = `[out:json][timeout:15];
area["name"~"${cleanCity}",i]->.searchArea;
(
${filterClauses}
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

// Indian Cities list for language auto-detection
const INDIAN_CITIES_SET = new Set([
  'mumbai', 'delhi', 'bangalore', 'bengaluru', 'hyderabad', 'pune', 'chennai', 'kolkata',
  'ahmedabad', 'jaipur', 'surat', 'lucknow', 'kanpur', 'nagpur', 'indore', 'thane', 'bhopal',
  'visakhapatnam', 'patna', 'vadodara', 'ghaziabad', 'ludhiana', 'agra', 'nashik', 'faridabad',
  'meerut', 'rajkot', 'varanasi', 'srinagar', 'aurangabad', 'dhanbad', 'amritsar', 'navi mumbai',
  'allahabad', 'prayagraj', 'ranchi', 'howrah', 'coimbatore', 'jabalpur', 'gwalior', 'vijayawada',
  'jodhpur', 'madurai', 'raipur', 'kota', 'chandigarh', 'guwahati', 'solapur', 'hubli', 'mysore',
  'gurgaon', 'gurugram', 'noida', 'dehradun', 'mundara'
]);

export function isIndianLocation(city, phone) {
  const cleanCity = (city || '').toLowerCase().trim();
  const cleanPhone = (phone || '').replace(/[^0-9]/g, '');

  if (INDIAN_CITIES_SET.has(cleanCity)) return true;
  if (cleanPhone.startsWith('91') && cleanPhone.length === 12) return true;
  if (cleanPhone.length === 10) return true; // Standard 10 digit Indian number
  
  // Check if city matches any Indian state/region
  for (const c of INDIAN_CITIES_SET) {
    if (cleanCity.includes(c)) return true;
  }
  return false;
}

// 4. Rule-Based Website Audit Engine (No AI API, 100% Deterministic)
export function auditWebsiteHtml(html, siteUrl, businessName, category, city, phone) {
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
    missingFeaturesEn.push('1-click customer chat');
    missingFeaturesHi.push('direct WhatsApp customer chat button');
  }
  if (hasBooking === 'Not detected') {
    missingFeaturesEn.push('online appointment booking');
    missingFeaturesHi.push('online appointment booking system');
  }
  
  const featureListEn = missingFeaturesEn.length > 0 ? missingFeaturesEn.join(' and ') : 'modern UI design upgrades';
  const featureListHi = missingFeaturesHi.length > 0 ? missingFeaturesHi.join(' aur ') : 'website upgrades';

  const isIndia = isIndianLocation(city, phone);

  // High-converting messages
  const outreachMessageEn = `Hi ${businessName || 'Business Owner'}, I reviewed ${siteUrl} for your ${category} in ${city} and noticed you could attract significantly more clients by adding ${featureListEn}. We specialize in setting this up for local businesses. Would you be open to a quick 5-min demo?`;
  const outreachMessageHi = `Namaste ${businessName || 'Sir/Ma\'am'}, maine aapka ${category} business ${city} me review kiya. Aapki website ${siteUrl} par agar ${featureListHi} add karein toh aapko local clients se daily 2x se 3x zyada inquiries mil sakti hain. Kya hum ispar 5-min discuss kar sakte hain?`;

  // Auto-assign: If international -> Professional English, If India -> Hinglish
  const outreachMessage = isIndia ? outreachMessageHi : outreachMessageEn;

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
    outreachMessageEn,
    outreachMessageHi,
    isInternational: !isIndia,
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

  const phone = tags.phone || tags['contact:phone'] || tags['contact:mobile'] || '';
  const digits = phone.replace(/[^0-9]/g, '');

  // 1. Strict Phone Filter: Do NOT enter or qualify leads without a valid phone number!
  if (!phone || phone === 'Not listed' || phone === 'DM for Contact' || digits.length < 7) {
    return {
      skipped: true,
      reason: `Filtered: No valid contact/phone number available (${businessName})`,
      leadId
    };
  }

  // 2. Strict High-Budget Filter: Discard small micro-stores / low-profit shops
  if (isLowProfitMicroBusiness(businessName, category, tags)) {
    return { 
      skipped: true, 
      reason: `Filtered: Low-profit micro store / small retailer with low budget capacity (${businessName})`, 
      leadId 
    };
  }

  // 3. High-Ticket Niche Classification & Purchasing Power
  const nicheMatch = HIGH_TICKET_NICHES.find(n => 
    n.keywords.some(k => category.toLowerCase().includes(k) || (queueKeyword || '').toLowerCase().includes(k)) ||
    n.category.toLowerCase().includes(category.toLowerCase())
  );

  const purchasingPower = nicheMatch ? nicheMatch.purchasingPower : 'High Budget';
  const ticketSize = nicheMatch ? nicheMatch.ticketSize : 'High-Ticket B2B / Premium B2C';
  const budgetBonus = nicheMatch ? 10 : 0;
  
  const addressParts = [
    tags['addr:housename'],
    tags['addr:housenumber'],
    tags['addr:street'],
    tags['addr:city'],
    tags['addr:postcode']
  ].filter(Boolean);
  const address = addressParts.length > 0 ? addressParts.join(', ') : `${city} Area`;

  const websiteUrl = tags.website || tags['contact:website'] || tags.url || '';
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

  let leadRecord = null;

  // ROUTE A: No Website
  const isIndia = isIndianLocation(city, phone);
  const outreachMessageEnNoWeb = `Hi ${businessName || 'Team'}, noticed your ${category} practice in ${city} does not have an active website. High-intent clients actively search Google before booking high-value services. We build high-converting websites with instant appointment booking & WhatsApp inquiry funnels. Would you be open for a quick 2-min preview?`;
  const outreachMessageHiNoWeb = `Namaste ${businessName || 'Sir/Ma\'am'}, maine notice kiya ki ${city} me aapke ${category} business ki koi active website nahi hai. Aaj kal high-value clients aur patients pehle Google pe verify karke hi appointment book karte hain. Hum aapke business ke liye ek premium website & instant WhatsApp booking system setup kar sakte hain. Kya hum ispar 2-min discuss kar sakte hain?`;

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
      aiOpportunity: 'High-Ticket Web & WhatsApp Funnel Setup',
      leadScore: Math.min(100, 85 + budgetBonus),
      leadPriority: 'Hot',
      purchasingPower,
      ticketSize,
      recommendedService: 'Website Development',
      auditReason: 'High-ticket business has no active website (losing clients to competitors)',
      outreachMessage: isIndia ? outreachMessageHiNoWeb : outreachMessageEnNoWeb,
      outreachMessageEn: outreachMessageEnNoWeb,
      outreachMessageHi: outreachMessageHiNoWeb,
      isInternational: !isIndia,
      source: 'OpenStreetMap / Overpass',
      dateAdded: now
    };
  } else {
    // ROUTE B: Website Exists -> Fetch & Audit
    const fetchRes = await fetchWebsite(websiteUrl);
    
    if (!fetchRes.ok) {
      const brokenEn = `Hi ${businessName}, we noticed your website ${websiteUrl} seems to be down or inaccessible. Having an active site is critical for your ${category} practice in ${city}. Can we help you restore it?`;
      const brokenHi = `Namaste ${businessName}, maine dekha ki aapki website ${websiteUrl} open nahi ho rahi hai. ${city} me aapke ${category} business ke liye active website hona bohot zaroori hai. Kya hum ise restore karne me help karein?`;

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
        aiOpportunity: 'Website Recovery & Funnel Rebuild',
        leadScore: Math.min(100, 65 + budgetBonus),
        leadPriority: 'Warm',
        purchasingPower,
        ticketSize,
        recommendedService: 'Website Redesign',
        auditReason: 'Website could not be fetched for automated inspection (Server down / SSL broken)',
        outreachMessage: isIndia ? brokenHi : brokenEn,
        outreachMessageEn: brokenEn,
        outreachMessageHi: brokenHi,
        isInternational: !isIndia,
        source: 'OpenStreetMap / Overpass',
        dateAdded: now
      };
    } else {
      const audit = auditWebsiteHtml(fetchRes.html, fetchRes.url, businessName, category, city, phone);
      
      const finalScore = Math.min(100, audit.calculatedScore + budgetBonus);
      // Filter: Only leads with score >= 40
      if (finalScore < 40) {
        return { skipped: true, reason: 'Lead score below qualification threshold (< 40)', leadId, score: finalScore };
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
        aiOpportunity: 'High-Ticket Conversion Optimization & Booking System',
        leadScore: finalScore,
        leadPriority: finalScore >= 80 ? 'Hot' : (finalScore >= 60 ? 'Warm' : 'Potential'),
        purchasingPower,
        ticketSize,
        recommendedService: audit.recommendedService,
        auditReason: audit.auditReason,
        outreachMessage: audit.outreachMessage,
        outreachMessageEn: audit.outreachMessageEn,
        outreachMessageHi: audit.outreachMessageHi,
        isInternational: audit.isInternational,
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
