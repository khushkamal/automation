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
    fs.writeFileSync(SEARCH_QUEUE_PATH, JSON.stringify([], null, 2));
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

export function clearAllLeads() {
  try {
    fs.writeFileSync(LEADS_DB_PATH, JSON.stringify([], null, 2));
    fs.writeFileSync(DATA_STORE_PATH, JSON.stringify({ processedIds: {} }, null, 2));
    console.log('  🗑️ [LEADS CLEARED] Old database cleared. Fresh generation initiated.');
    return { success: true };
  } catch (err) {
    console.error('Error clearing leads:', err);
    return { success: false, error: err.message };
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

const KNOWN_CITY_BBOXES = {
  mumbai: { south: '18.88', north: '19.32', west: '72.75', east: '73.05' },
  delhi: { south: '28.40', north: '28.88', west: '76.84', east: '77.35' },
  'delhi ncr': { south: '28.30', north: '28.90', west: '76.80', east: '77.55' },
  gurgaon: { south: '28.35', north: '28.55', west: '76.90', east: '77.12' },
  noida: { south: '28.45', north: '28.65', west: '77.28', east: '77.45' },
  bangalore: { south: '12.80', north: '13.15', west: '77.45', east: '77.80' },
  bengaluru: { south: '12.80', north: '13.15', west: '77.45', east: '77.80' },
  hyderabad: { south: '17.20', north: '17.60', west: '78.20', east: '78.60' },
  pune: { south: '18.40', north: '18.65', west: '73.70', east: '74.05' },
  chennai: { south: '12.90', north: '13.25', west: '80.10', east: '80.35' },
  kolkata: { south: '22.45', north: '22.75', west: '88.25', east: '88.50' },
  ahmedabad: { south: '22.90', north: '23.20', west: '72.45', east: '72.75' },
  jaipur: { south: '26.75', north: '27.05', west: '75.65', east: '75.95' },
  chandigarh: { south: '30.65', north: '30.80', west: '76.70', east: '76.85' },
  lucknow: { south: '26.75', north: '27.00', west: '80.85', east: '81.05' },
  indore: { south: '22.65', north: '22.80', west: '75.80', east: '76.00' },
  surat: { south: '21.10', north: '21.30', west: '72.75', east: '72.95' },
  'new york': { south: '40.47', north: '40.91', west: '-74.26', east: '-73.70' },
  london: { south: '51.28', north: '51.69', west: '-0.51', east: '0.33' },
  dubai: { south: '24.95', north: '25.35', west: '55.05', east: '55.45' },
  toronto: { south: '43.58', north: '43.85', west: '-79.64', east: '-79.11' },
  sydney: { south: '-34.05', north: '-33.65', west: '150.95', east: '151.35' }
};

// 1. Geocode City using Fast BBox / Nominatim
async function geocodeCity(city) {
  const norm = (city || '').toLowerCase().trim();
  if (KNOWN_CITY_BBOXES[norm]) {
    return KNOWN_CITY_BBOXES[norm];
  }
  for (const [k, bbox] of Object.entries(KNOWN_CITY_BBOXES)) {
    if (norm.includes(k) || k.includes(norm)) {
      return bbox;
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);
  try {
    const geoUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`;
    const res = await fetch(geoUrl, {
      headers: { 'User-Agent': 'LeadGenAuditTool/2.0 (Windows NT 10.0; Win64; x64)' },
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

// 3. Fast & Robust Website Fetcher (with HTTPS->HTTP fallback and browser emulation)
export async function fetchWebsite(url) {
  if (!url) return { ok: false, error: 'No URL provided' };
  
  let targetUrl = url.trim();
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = 'https://' + targetUrl;
  }

  const browserHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9,hi;q=0.8',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1'
  };

  // Attempt 1: Fetch target URL
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: browserHeaders,
      redirect: 'follow',
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const html = await response.text();
      return { ok: true, html, url: response.url || targetUrl };
    }
  } catch (err) {
    // If HTTPS failed, fallback to HTTP
    if (targetUrl.startsWith('https://')) {
      const httpUrl = 'http://' + targetUrl.replace('https://', '');
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        const response = await fetch(httpUrl, {
          method: 'GET',
          headers: browserHeaders,
          redirect: 'follow',
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (response.ok) {
          const html = await response.text();
          return { ok: true, html, url: response.url || httpUrl };
        }
      } catch (httpErr) {
        // Fallback failed
      }
    }
  }

  return { ok: false, error: 'Website inaccessible / server timeout', url: targetUrl };
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

// 4. Rule-Based Website & SEO Audit Engine (100% Deterministic & Realistic)
export function auditWebsiteHtml(html, siteUrl, businessName, category, city, phone) {
  const lowerHtml = (html || '').toLowerCase();
  
  // 1. SSL & Security Check
  const isHttps = siteUrl.toLowerCase().startsWith('https://') || lowerHtml.includes('https://') ? 'Yes' : 'No';
  
  // 2. Mobile Responsiveness Check
  const hasViewport = lowerHtml.includes('name="viewport"') || lowerHtml.includes("name='viewport'") ? 'Yes' : 'No';
  
  // 3. SEO Meta & Title Checks
  const hasTitleTag = lowerHtml.includes('<title>') && lowerHtml.includes('</title>');
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const titleText = titleMatch ? titleMatch[1].trim() : '';
  const hasGoodTitle = Boolean(titleText && titleText.length >= 5 && !titleText.toLowerCase().includes('untitled'));
  
  const hasMetaDescription = lowerHtml.includes('name="description"') || lowerHtml.includes("name='description'") || lowerHtml.includes('property="og:description"');
  const hasSchema = lowerHtml.includes('application/ld+json') || lowerHtml.includes('schema.org') || lowerHtml.includes('itemscope');

  // 4. Conversion & CTAs Checks
  const hasPhone = lowerHtml.includes('tel:') || lowerHtml.includes('call now') || lowerHtml.includes('phone') || lowerHtml.includes('contact');
  const hasCTA = lowerHtml.includes('contact') || lowerHtml.includes('get quote') || lowerHtml.includes('get started') || lowerHtml.includes('inquiry') || lowerHtml.includes('request a quote') || lowerHtml.includes('<form');
  const hasWhatsApp = lowerHtml.includes('wa.me') || lowerHtml.includes('whatsapp.com') || lowerHtml.includes('api.whatsapp.com') ? 'Detected' : 'Not detected';
  const hasBooking = lowerHtml.includes('calendly.com') || lowerHtml.includes('acuityscheduling.com') || lowerHtml.includes('appointment') || lowerHtml.includes('book now') || lowerHtml.includes('schedule') || lowerHtml.includes('zocdoc') || lowerHtml.includes('practo') ? 'Detected' : 'Not detected';
  const hasTracking = lowerHtml.includes('googletagmanager.com') || lowerHtml.includes('fbq(') || lowerHtml.includes('connect.facebook.net') || lowerHtml.includes('gtag(') || lowerHtml.includes('google-analytics.com') ? 'Detected' : 'Not detected';

  // 5. Accurate Opportunity / Penalty Scoring (Lower = Website is already great; Higher = High need for service)
  let penaltyScore = 0;
  const missingIssues = [];

  if (isHttps === 'No') {
    penaltyScore += 30;
    missingIssues.push('No SSL/HTTPS (Unsecured site)');
  }
  if (hasViewport === 'No') {
    penaltyScore += 35;
    missingIssues.push('Not Mobile Responsive');
  }
  if (!hasGoodTitle || !hasMetaDescription) {
    penaltyScore += 15;
    missingIssues.push('Missing SEO Meta Tags');
  }
  if (!hasCTA) {
    penaltyScore += 15;
    missingIssues.push('No Clear Contact / CTA Button');
  }
  if (hasWhatsApp === 'Not detected') {
    penaltyScore += 10;
    missingIssues.push('Missing Direct WhatsApp Hook');
  }
  if (hasBooking === 'Not detected') {
    penaltyScore += 10;
    missingIssues.push('No Instant Online Booking System');
  }
  if (hasTracking === 'Not detected') {
    penaltyScore += 5;
    missingIssues.push('No Retargeting Pixel/Analytics');
  }

  // Cap score between 10 and 100
  let calculatedScore = Math.max(10, Math.min(100, penaltyScore));

  // Determine Website Quality based on real factors
  let websiteQuality = 'Good';
  let leadPriority = 'Low';

  if (hasViewport === 'No' || isHttps === 'No' || calculatedScore >= 70) {
    websiteQuality = 'Poor / Needs Redesign';
    leadPriority = 'Hot';
  } else if (calculatedScore >= 45) {
    websiteQuality = 'Fair / Optimization Needed';
    leadPriority = 'Warm';
  } else if (calculatedScore >= 25) {
    websiteQuality = 'Good';
    leadPriority = 'Potential';
  } else {
    websiteQuality = 'Excellent / Fully Optimized';
    leadPriority = 'Low';
  }

  // Determine Recommended Service accurately
  let recommendedService = 'Digital Growth & WhatsApp Funnel';
  if (hasViewport === 'No') recommendedService = 'Mobile Responsive Redesign';
  else if (isHttps === 'No') recommendedService = 'SSL & Website Security Overhaul';
  else if (!hasGoodTitle || !hasMetaDescription) recommendedService = 'Local SEO & Meta Optimization';
  else if (hasWhatsApp === 'Not detected') recommendedService = 'WhatsApp Lead Automation';
  else if (hasBooking === 'Not detected') recommendedService = 'Online Booking Funnel';
  else if (calculatedScore <= 25) recommendedService = 'Advanced SEO & Paid Ads Scaling';

  const auditReason = missingIssues.length > 0 
    ? missingIssues.slice(0, 3).join(', ') 
    : 'Website is already well-optimized with active SSL, mobile responsiveness & SEO structure';

  // Deterministic Outreach Pitch Generator (Honest & tailored to what is actually missing)
  const isIndia = isIndianLocation(city, phone);
  let outreachMessageEn = '';
  let outreachMessageHi = '';

  if (calculatedScore <= 25) {
    // If website is already great, compliment it and pitch traffic / WhatsApp scaling
    outreachMessageEn = `Hi ${businessName || 'Team'}, I reviewed your website ${siteUrl} for ${category} in ${city}. Your web presence and design look solid! We help established businesses integrate 1-click WhatsApp customer conversion funnels & run high-ROI local ads. Would you be open to a 2-min chat on scaling inquiries?`;
    outreachMessageHi = `Namaste ${businessName || 'Sir/Ma\'am'}, maine aapka ${category} business ${city} me review kiya. Aapki website ${siteUrl} ka design aur online presence kaafi accha hai! Hum established businesses ke liye direct WhatsApp conversion funnels aur Google Ads setup karte hain jisse high-ticket clients attract hon. Kya hum ispar short 2-min discuss kar sakte hain?`;
  } else {
    // If missing features, mention exact missing gaps
    const missingEn = missingIssues.slice(0, 2).join(' and ');
    const missingHi = missingIssues.slice(0, 2).join(' aur ');
    
    outreachMessageEn = `Hi ${businessName || 'Business Owner'}, I reviewed ${siteUrl} for your ${category} in ${city} and noticed potential improvements in ${missingEn}. Fixing these can boost your customer inquiries significantly. Can I share a quick 2-min overview?`;
    outreachMessageHi = `Namaste ${businessName || 'Sir/Ma\'am'}, maine ${city} me aapke ${category} business ki website ${siteUrl} audit ki. Isme ${missingHi} optimize karke aap direct customer inquiries 2x se 3x boost kar sakte hain. Kya main short 2-minute overview share karun?`;
  }

  const outreachMessage = isIndia ? outreachMessageHi : outreachMessageEn;

  return {
    isHttps,
    hasViewport,
    hasPhone: hasPhone ? 'Detected' : 'Not detected',
    hasCTA: hasCTA ? 'Detected' : 'Not detected',
    hasWhatsApp,
    hasBooking,
    hasTracking,
    hasSEO: hasGoodTitle && hasMetaDescription ? 'Yes' : 'Basic',
    calculatedScore,
    leadPriority,
    recommendedService,
    auditReason,
    outreachMessage,
    outreachMessageEn,
    outreachMessageHi,
    isInternational: !isIndia,
    websiteQuality,
    automationStatus: calculatedScore >= 50 ? 'High Opportunity' : 'Moderate Opportunity'
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
  const businessName = tags.name || tags['name:en'] || tags.brand || tags.operator || '';
  const category = tags.amenity || tags.healthcare || tags.shop || tags.office || tags.craft || tags.tourism || queueKeyword || 'Business';
  const city = tags['addr:city'] || queueCity || 'City';

  // Extract phone across all possible OSM tag standards
  const rawPhone = tags.phone || tags['contact:phone'] || tags['contact:mobile'] || tags.mobile || tags['phone:mobile'] || tags['contact:whatsapp'] || tags.whatsapp || '';
  const firstPhone = rawPhone.split(/[;,/]/)[0].trim();
  const digits = firstPhone.replace(/[^0-9]/g, '');

  // 1. Strict Name Filter: Discard elements without a valid real business name
  if (!businessName || businessName.trim().length < 3 || businessName.toLowerCase().includes('unnamed') || businessName === 'undefined') {
    return {
      skipped: true,
      reason: 'Filtered: Business name is missing or unnamed',
      leadId
    };
  }

  // 2. Strict Phone Filter: Do NOT enter or qualify leads without a valid phone number!
  if (!firstPhone || firstPhone === 'Not listed' || firstPhone === 'DM for Contact' || digits.length < 7) {
    return {
      skipped: true,
      reason: `Filtered: No valid contact/phone number available (${businessName})`,
      leadId
    };
  }

  // Format clean readable phone
  let phone = firstPhone;
  if (digits.length === 10 && ['6', '7', '8', '9'].includes(digits[0])) {
    phone = `+91 ${digits.substring(0, 5)} ${digits.substring(5)}`;
  } else if (digits.startsWith('91') && digits.length === 12) {
    phone = `+91 ${digits.substring(2, 7)} ${digits.substring(7)}`;
  }

  // 2. Strict High-Budget Filter: Discard small micro-stores / low-profit shops
  if (isLowProfitMicroBusiness(businessName, category, tags)) {
    return { 
      skipped: true, 
      reason: `Filtered: Low-profit micro store / small retailer with low budget capacity (${businessName || 'Unnamed'})`, 
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
    tags['addr:suburb'] || tags['addr:district'],
    tags['addr:city'] || city,
    tags['addr:postcode']
  ].filter(Boolean);
  const address = addressParts.length > 0 ? addressParts.join(', ') : `${city} Area`;

  // Real Google Maps Location URL based on coordinates or place name
  const lat = elem.lat || elem.center?.lat;
  const lon = elem.lon || elem.center?.lon;
  const googleMapsUrl = (lat && lon)
    ? `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(businessName + ' ' + city)}`;

  const websiteUrl = tags.website || tags['contact:website'] || tags.url || tags['website:en'] || '';
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

  let leadRecord = null;

  // ROUTE A: No Website
  const isIndia = isIndianLocation(city, phone);
  const outreachMessageEnNoWeb = `Hi ${businessName || 'Team'}, noticed your ${category} practice in ${city} does not have an active website. High-intent clients actively search Google before booking high-value services. We build high-converting websites with instant appointment booking & WhatsApp inquiry funnels. Would you be open for a quick 2-min preview?`;
  const outreachMessageHiNoWeb = `Namaste ${businessName || 'Sir/Ma\'am'}, maine notice kiya ki ${city} me aapke ${category} business ki koi active website nahi hai. Aaj kal high-value clients aur patients pehle Google pe verify karke hi appointment book karte hain. Hum aapke business ke liye ek premium website & instant WhatsApp booking system setup kar sakte hain. Kya hum ispar 2-min discuss kar sakte hain?`;

  if (!websiteUrl) {
    leadRecord = {
      leadId,
      businessName: businessName || `${category} (${city})`,
      category,
      city,
      address,
      phone,
      website: '',
      googleMapsUrl,
      rating: 'Active Store',
      reviews: 'Local Listing',
      websiteStatus: 'No Website',
      websiteQuality: 'None',
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
      recommendedService: 'Website Development & Funnel Setup',
      auditReason: 'Business has no verified website listed on Google / Maps directory',
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
        googleMapsUrl,
        rating: 'Active Store',
        reviews: 'Local Listing',
        websiteStatus: 'Unable to fetch',
        websiteQuality: 'Needs Check',
        mobileFriendly: 'Unknown',
        cta: 'Unknown',
        whatsApp: 'Unknown',
        onlineBooking: 'Unknown',
        adsStatus: 'Unknown / Not publicly verifiable',
        automationStatus: 'High Opportunity',
        aiOpportunity: 'Website Recovery & Funnel Rebuild',
        leadScore: Math.min(100, 60 + budgetBonus),
        leadPriority: 'Warm',
        purchasingPower,
        ticketSize,
        recommendedService: 'Website Redesign & Security Fix',
        auditReason: 'Website could not be fetched for automated inspection (Server down / SSL broken / Bot blocked)',
        outreachMessage: isIndia ? brokenHi : brokenEn,
        outreachMessageEn: brokenEn,
        outreachMessageHi: brokenHi,
        isInternational: !isIndia,
        source: 'OpenStreetMap / Overpass',
        dateAdded: now
      };
    } else {
      const audit = auditWebsiteHtml(fetchRes.html, fetchRes.url, businessName, category, city, phone);
      
      // Only apply budget bonus if the website genuinely has audit opportunities (score >= 40)
      const finalScore = audit.calculatedScore >= 40 
        ? Math.min(100, audit.calculatedScore + budgetBonus)
        : audit.calculatedScore;

      let leadPriority = 'Low';
      if (finalScore >= 75) leadPriority = 'Hot';
      else if (finalScore >= 45) leadPriority = 'Warm';
      else if (finalScore >= 25) leadPriority = 'Potential';
      else leadPriority = 'Low';

      leadRecord = {
        leadId,
        businessName,
        category,
        city,
        address,
        phone,
        website: fetchRes.url,
        googleMapsUrl,
        rating: 'Active Store',
        reviews: 'Local Listing',
        websiteStatus: 'Live',
        websiteQuality: audit.websiteQuality,
        mobileFriendly: audit.hasViewport,
        cta: audit.hasCTA,
        whatsApp: audit.hasWhatsApp,
        onlineBooking: audit.hasBooking,
        adsStatus: audit.hasTracking,
        automationStatus: audit.automationStatus,
        aiOpportunity: finalScore >= 50 ? 'Conversion Optimization & Booking Funnel' : 'Advanced Traffic & Ads Scaling',
        leadScore: finalScore,
        leadPriority,
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
