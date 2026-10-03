/**
 * ============================================================================
 * VELTIX & CO. — AI & Digital Services Automated Daily Lead Generation Engine
 * Portfolio: https://veltrixandco.vercel.app/
 * Services: Web Dev, E-commerce, SaaS, AI, Automation, APIs, Cloud & QA
 * ============================================================================
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const OUTPUT_CSV_PATH = path.join(__dirname, 'veltrix_leads.csv');
const OUTPUT_JSON_PATH = path.join(__dirname, 'veltrix_leads.json');
const LEADS_DB_PATH = path.join(__dirname, 'leads_database.json');

// Agency Details
export const VELTIX_CONFIG = {
  name: 'VELTIX & CO.',
  portfolioUrl: 'https://veltrixandco.vercel.app/',
  tagline: 'Digital Products • AI • Automation • Technology',
  services: [
    '🌐 Website Development',
    '🛒 E-commerce Development',
    '💻 Web App Development',
    '☁️ SaaS Development',
    '🤖 AI Development',
    '🔗 API & Integrations',
    '⚙️ Business Automation',
    '🛠️ Custom Software',
    '🔐 Security & Performance',
    '🧪 Testing / QA',
    '🚀 Deployment & Cloud',
    '🔧 Maintenance & Support'
  ]
};

// Target High-Ticket Categories
export const TARGET_CATEGORIES = {
  'real-estate': {
    label: 'Real Estate & Builders',
    osmQuery: 'real estate',
    pitchService: 'Custom Web App & WhatsApp Lead Qualifying Bot',
    painPoint: 'Lost buyer inquiries and lack of automated lead capture'
  },
  'clinics': {
    label: 'Clinics & Healthcare',
    osmQuery: 'clinic',
    pitchService: 'Modern Website with Instant Online Appointment & WhatsApp System',
    painPoint: 'Manual appointment booking and patient follow-up delays'
  },
  'interior': {
    label: 'Interior Designers & Architects',
    osmQuery: 'interior designer',
    pitchService: 'High-Converting 3D Portfolio Website & Inquiry Funnel',
    painPoint: 'Outdated portfolio display and weak Google search presence'
  },
  'gyms': {
    label: 'Fitness Centers & Gyms',
    osmQuery: 'gym',
    pitchService: 'Membership Portal, Automated WhatsApp Reminders & Web App',
    painPoint: 'Manual membership tracking and renewal churn'
  },
  'restaurants': {
    label: 'Fine Dining & Banquet Venues',
    osmQuery: 'restaurant',
    pitchService: 'Digital Menu, Table Booking System & WhatsApp Order Automation',
    painPoint: 'Heavy 30% commission loss to aggregators'
  },
  'hotels': {
    label: 'Luxury Hotels & Resorts',
    osmQuery: 'hotel',
    pitchService: 'Direct Booking Engine, Custom Web App & Cloud Infrastructure',
    painPoint: 'High OTA commissions and lack of direct guest retention'
  },
  'd2c': {
    label: 'E-commerce & Boutiques',
    osmQuery: 'boutique',
    pitchService: 'High-Performance E-commerce Storefront & WhatsApp Abandoned Cart Automation',
    painPoint: 'Slow loading speeds and high cart abandonment'
  }
};

/**
 * 1. Fetch Targeted Businesses from OpenStreetMap Nominatim API (100% Free, No API Key)
 */
export async function fetchLocalBusinessLeads(city = 'Delhi', categoryKey = 'clinics', limit = 20) {
  const categoryInfo = TARGET_CATEGORIES[categoryKey] || TARGET_CATEGORIES['clinics'];
  const query = `${categoryInfo.osmQuery} in ${city}`;
  
  console.log(`\n🔍 [VELTIX ENGINE] Searching for: "${query}" (Limit: ${limit})...`);

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=${limit}&addressdetails=1&extratags=1`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'VeltrixLeadGen/1.0 (contact@veltrixandco.com)',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    if (!response.ok) {
      throw new Error(`Nominatim returned status ${response.status}`);
    }

    const items = await response.json();
    console.log(`✅ [FOUND] ${items.length} raw business records for "${query}".`);

    const leads = [];
    for (const item of items) {
      const tags = item.extratags || {};
      const addr = item.address || {};

      const businessName = item.name || tags.name || tags['name:en'] || item.display_name.split(',')[0].trim();
      if (!businessName || businessName.length < 3 || businessName.toLowerCase().includes('unnamed')) {
        continue;
      }

      const website = tags.website || tags['contact:website'] || tags.url || '';
      const phone = tags.phone || tags['contact:phone'] || tags['contact:mobile'] || '';
      const email = tags.email || tags['contact:email'] || '';
      const hasWebsite = Boolean(website && website.trim().length > 4);

      // Determine pitch service & message
      const leadObj = generateVeltrixLeadData({
        businessName,
        category: categoryInfo.label,
        categoryKey,
        city,
        address: item.display_name,
        website,
        hasWebsite,
        phone,
        email,
        source: 'Free OpenStreetMap Global Discovery'
      });

      leads.push(leadObj);
    }

    return leads;
  } catch (error) {
    console.error(`❌ [ERROR] Failed to fetch leads:`, error.message);
    return [];
  }
}

/**
 * 2. Generate Hyper-Personalized Pitch & Veltrix Offering
 */
export function generateVeltrixLeadData(data) {
  const { businessName, category, categoryKey, city, website, hasWebsite, phone, email, address, source } = data;
  const categoryInfo = TARGET_CATEGORIES[categoryKey] || {
    pitchService: 'Modern Website & Business Automation',
    painPoint: 'manual lead capture and outdated digital presence'
  };

  let recommendedService = '';
  let outreachMessageEn = '';
  let outreachMessageHi = '';
  let auditStatus = '';

  if (!hasWebsite) {
    auditStatus = 'MISSING_WEBSITE';
    recommendedService = 'Website Development & Business Automation';
    
    outreachMessageEn = `Hi ${businessName}! 👋 We noticed your ${category} in ${city} does not have an active website. High-intent customers search online before choosing services. At VELTIX & CO. (https://veltrixandco.vercel.app/), we build high-speed websites with instant WhatsApp inquiry funnels. Would you be open to a quick 2-minute preview?`;

    outreachMessageHi = `Namaste ${businessName}! 👋 Maine notice kiya ki ${city} me aapke ${category} business ki koi active website nahi hai. Aaj kal high-value clients pehle online check karte hain. Hum VELTIX & CO. (https://veltrixandco.vercel.app/) se aapke liye modern website aur direct WhatsApp booking setup kar sakte hain. Kya hum ispar 2-min discuss kar sakte hain?`;
  } else {
    auditStatus = 'WEBSITE_EXISTS_UPGRADE_READY';
    recommendedService = 'AI Development, Web App & Business Automation';

    outreachMessageEn = `Hi ${businessName}! 👋 Came across your ${category} website (${website}). We help businesses streamline operations by integrating AI Chatbots, automated WhatsApp CRM, and custom web apps to double lead conversions. Check our portfolio: https://veltrixandco.vercel.app/ — would you like a free 2-minute performance audit?`;

    outreachMessageHi = `Namaste ${businessName}! 👋 Maine aapke ${category} business ki website (${website}) dekhi. Aapka kaam bohot badiya hai! Hum VELTIX & CO. (https://veltrixandco.vercel.app/) par AI Chatbots, WhatsApp CRM aur custom web apps integrate karke lead conversions 2x karte hain. Kya hum aapko ek free 2-minute audit share karein?`;
  }

  const score = (!hasWebsite ? 9.5 : 8.0) + (phone ? 0.5 : 0);

  return {
    leadId: `vlx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    businessName,
    category,
    city,
    hasWebsite,
    website: website || 'Not Listed',
    phone: phone || 'Search Online / G-Maps',
    email: email || 'Not Listed',
    address,
    source,
    leadScore: Math.min(10, score).toFixed(1),
    recommendedService,
    auditStatus,
    outreachMessageEn,
    outreachMessageHi,
    portfolioUrl: VELTIX_CONFIG.portfolioUrl,
    createdAt: new Date().toISOString()
  };
}

/**
 * 3. Generate Free Google & LinkedIn Dork Searches for Instant High-Intent Clients
 */
export function generateFreeDorkLinks(service = 'e-commerce') {
  return [
    {
      title: 'D2C Founders Looking for Web / Tech Developers (LinkedIn)',
      url: 'https://www.google.com/search?q=' + encodeURIComponent('site:linkedin.com/in ("Founder" OR "Co-founder" OR "Owner") ("D2C" OR "Shopify" OR "E-commerce") "India"')
    },
    {
      title: 'Clients Actively Looking for Web Developers (Twitter/X)',
      url: 'https://www.google.com/search?q=' + encodeURIComponent('site:twitter.com ("looking for a web developer" OR "need a website developer" OR "hiring react developer")')
    },
    {
      title: 'Startups Needing AI & Automation (LinkedIn)',
      url: 'https://www.google.com/search?q=' + encodeURIComponent('site:linkedin.com/in ("Founder" OR "CEO") ("AI Automation" OR "SaaS") "Looking for developer"')
    },
    {
      title: 'High-Ticket Real Estate Agencies without Proper Sites (Google)',
      url: 'https://www.google.com/search?q=' + encodeURIComponent('"Real Estate Agency" "Delhi" "phone" -site:magicbricks.com -site:99acres.com')
    }
  ];
}

/**
 * 4. Save Leads to CSV & JSON
 */
export function saveLeadsToFile(leads = []) {
  if (leads.length === 0) {
    console.log('⚠️ [VELTIX ENGINE] No leads to save.');
    return;
  }

  // 1. JSON
  let existingJson = [];
  if (fs.existsSync(OUTPUT_JSON_PATH)) {
    try {
      existingJson = JSON.parse(fs.readFileSync(OUTPUT_JSON_PATH, 'utf-8'));
    } catch (e) {
      existingJson = [];
    }
  }
  const combinedJson = [...leads, ...existingJson];
  // Deduplicate by businessName
  const uniqueJson = Array.from(new Map(combinedJson.map(item => [item.businessName.toLowerCase(), item])).values());
  fs.writeFileSync(OUTPUT_JSON_PATH, JSON.stringify(uniqueJson, null, 2));

  // 2. CSV
  const headers = [
    'Lead ID',
    'Business Name',
    'Category',
    'City',
    'Has Website',
    'Website',
    'Phone',
    'Email',
    'Lead Score',
    'Recommended Service',
    'English Pitch (Veltrix)',
    'Hindi Pitch (Veltrix)',
    'Portfolio URL',
    'Source',
    'Address'
  ];

  const escapeCsv = (str) => {
    if (!str) return '""';
    return `"${String(str).replace(/"/g, '""').replace(/[\r\n]+/g, ' ')}"`;
  };

  const rows = uniqueJson.map(l => [
    escapeCsv(l.leadId),
    escapeCsv(l.businessName),
    escapeCsv(l.category),
    escapeCsv(l.city),
    escapeCsv(l.hasWebsite ? 'YES' : 'NO'),
    escapeCsv(l.website),
    escapeCsv(l.phone),
    escapeCsv(l.email),
    escapeCsv(l.leadScore),
    escapeCsv(l.recommendedService),
    escapeCsv(l.outreachMessageEn),
    escapeCsv(l.outreachMessageHi),
    escapeCsv(l.portfolioUrl),
    escapeCsv(l.source),
    escapeCsv(l.address)
  ].join(','));

  const csvContent = [headers.join(','), ...rows].join('\n');
  fs.writeFileSync(OUTPUT_CSV_PATH, csvContent, 'utf-8');

  // Also update existing leads_database.json so Web Dashboard shows them!
  if (fs.existsSync(LEADS_DB_PATH)) {
    try {
      const existingDb = JSON.parse(fs.readFileSync(LEADS_DB_PATH, 'utf-8'));
      const dbCombined = [...leads, ...existingDb];
      const uniqueDb = Array.from(new Map(dbCombined.map(item => [item.businessName.toLowerCase(), item])).values());
      fs.writeFileSync(LEADS_DB_PATH, JSON.stringify(uniqueDb, null, 2));
      console.log(`🔗 [DASHBOARD SYNC] Synced ${leads.length} leads to existing Dashboard database!`);
    } catch (e) {
      console.warn('Could not sync to dashboard db:', e.message);
    }
  }

  console.log(`\n💾 [SAVED] Successfully saved ${uniqueJson.length} total leads to:`);
  console.log(`   📄 CSV:  ${OUTPUT_CSV_PATH}`);
  console.log(`   📊 JSON: ${OUTPUT_JSON_PATH}`);
}

/**
 * 5. Main Execution Function
 */
export async function runVeltrixLeadGeneration(options = {}) {
  const city = options.city || 'Delhi';
  const category = options.category || 'clinics';
  const limit = options.limit || 15;

  console.log('='.repeat(70));
  console.log(`🚀 ${VELTIX_CONFIG.name} — DAILY LEAD GENERATION ENGINE`);
  console.log(`🌐 Portfolio: ${VELTIX_CONFIG.portfolioUrl}`);
  console.log(`🎯 Target City: ${city} | Category: ${category} | Limit: ${limit}`);
  console.log('='.repeat(70));

  const leads = await fetchLocalBusinessLeads(city, category, limit);

  if (leads.length > 0) {
    saveLeadsToFile(leads);

    console.log('\n🌟 SAMPLE LEAD EXTRACTED FOR VELTIX & CO.:');
    const sample = leads[0];
    console.log(`   🏢 Name:    ${sample.businessName}`);
    console.log(`   📍 City:    ${sample.city}`);
    console.log(`   🌐 Website: ${sample.website}`);
    console.log(`   📞 Phone:   ${sample.phone}`);
    console.log(`   ⭐ Score:   ${sample.leadScore}/10`);
    console.log(`   🛠️ Pitch:   ${sample.recommendedService}`);
    console.log(`   💬 English Outreach:\n   "${sample.outreachMessageEn}"`);
    console.log(`   💬 Hindi Outreach:\n   "${sample.outreachMessageHi}"`);
  } else {
    console.log('⚠️ No fresh leads found for this query. Try another city or category.');
  }

  console.log('\n💡 FREE CLIENT SEARCH LINKS (DIRECT HIGH INTENT CLIENTS):');
  const dorks = generateFreeDorkLinks();
  dorks.forEach((d, i) => {
    console.log(`   ${i + 1}. ${d.title}:`);
    console.log(`      🔗 ${d.url}`);
  });

  return leads;
}

// Direct CLI Execution support
const args = process.argv.slice(2);
if (process.argv[1] && process.argv[1].endsWith('veltrixLeadGenerator.js')) {
  let targetCity = 'Delhi';
  let targetCategory = 'clinics';
  let targetLimit = 15;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--city' && args[i + 1]) targetCity = args[i + 1];
    if (args[i] === '--category' && args[i + 1]) targetCategory = args[i + 1];
    if (args[i] === '--limit' && args[i + 1]) targetLimit = parseInt(args[i + 1], 10);
  }

  runVeltrixLeadGeneration({ city: targetCity, category: targetCategory, limit: targetLimit });
}
