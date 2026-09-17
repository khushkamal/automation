import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { saveLead, getSavedLeads, isIndianLocation } from './auditEngine.js';
import { syncLeadToGoogleSheet } from './googleSheetSync.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Diverse Niche & Category definitions with specific pain points
export const INSTAGRAM_NICHES = [
  {
    category: 'Boutique & Designer Wear',
    keywords: ['boutique', 'designer dresses', 'sarees', 'ethnic wear', 'lehenga', 'western wear'],
    painPointEn: 'manually replying to hundreds of "Price Please" DMs and sharing outfit photos one-by-one',
    painPointHi: 'DMs me har customer ko alag-alag price aur photo bhejna jisme bohot time waste hota hai',
    solutionEn: 'a 1-click Instagram catalog store where customers can select sizes, view prices, and pay directly',
    solutionHi: 'ek 1-click Instagram catalog website jahan customer direct collection dekh kar order aur payment kar sake'
  },
  {
    category: 'Home Baker & Custom Cakes',
    keywords: ['home baker', 'custom cakes', 'desserts', 'cupcakes', 'patisserie'],
    painPointEn: 'coordinating cake customisation, delivery dates, and advance payments manually on WhatsApp',
    painPointHi: 'custom cake orders, advance payment aur delivery date manually chat par confirm karna',
    solutionEn: 'an instant cake booking storefront with automated date picker, flavour selection, and advance payment checkout',
    solutionHi: 'ek instant cake ordering page jisme flavour, delivery date aur advance payment customer khud select kar le'
  },
  {
    category: 'Handmade Jewelry & Silver',
    keywords: ['handmade jewelry', 'silver jewelry', 'earrings', 'accessories', 'custom jewelry'],
    painPointEn: 'dealing with out-of-stock inquiries and manual address collection in DMs',
    painPointHi: 'out-of-stock items ke DMs handle karna aur customer se bar bar address mangna',
    solutionEn: 'an automated live inventory catalog where customers order in 30 seconds via WhatsApp or online checkout',
    solutionHi: 'ek automated live stock catalog jahan customer direct WhatsApp ya website se 30 sec me order kar sake'
  },
  {
    category: 'Thrift & Vintage Store',
    keywords: ['thrift store', 'vintage clothing', 'sustainable fashion', 'thrifted', 'preloved'],
    painPointEn: 'the "First to DM to book" chaos and losing buyers due to delayed replies',
    painPointHi: '"DM to claim/book" me chaos hona aur late reply ki wajah se buyers ka drop hona',
    solutionEn: 'a quick-drop flash storefront that automatically marks items sold out the second a buyer claims them',
    solutionHi: 'ek fast flash-sale website jo item book hote hi automatically "Sold Out" mark kar de'
  },
  {
    category: 'Organic Skincare & Haircare',
    keywords: ['organic skincare', 'hair oils', 'natural cosmetics', 'handmade soap', 'ayurvedic beauty'],
    painPointEn: 'explaining skin type recommendations and ingredients repeatedly in chat',
    painPointHi: 'har buyer ko baar-baar skin type aur product benefits manually chat par samjhana',
    solutionEn: 'a smart skin-routine product quiz and instant checkout store that increases average order value',
    solutionHi: 'ek smart product catalog jo customer ko right product recommend karke instant order le le'
  },
  {
    category: 'Custom Gifts & Hampers',
    keywords: ['custom gifts', 'gift hampers', 'personalized gifts', 'resin art', 'corporate gifts'],
    painPointEn: 'customization photo uploads and payment screenshot verification taking too much manual time',
    painPointHi: 'custom photos collect karna aur payment screenshots verify karne me time lagna',
    solutionEn: 'an easy customization portal where clients upload photos, select text, and pay in one smooth flow',
    solutionHi: 'ek simple custom gift portal jahan customer direct photo upload karke payment kar sake'
  },
  {
    category: 'Makeup Artist & Bridal Studio',
    keywords: ['makeup artist', 'bridal makeup', 'mua', 'hair stylist', 'makeover studio'],
    painPointEn: 'answering repeated date availability and bridal package pricing questions in DMs',
    painPointHi: 'har client ko package price aur date availability manually chat par batana',
    solutionEn: 'a stunning bridal portfolio & automated date availability checker with instant WhatsApp booking',
    solutionHi: 'ek premium bridal portfolio aur date booking link jahan se direct clients confirm ho jayein'
  },
  {
    category: 'Cloud Kitchen & Gourmet Treats',
    keywords: ['cloud kitchen', 'gourmet food', 'homemade pickles', 'snacks', 'artisanal treats'],
    painPointEn: 'taking manual food orders on WhatsApp without automatic menu calculation or address tracking',
    painPointHi: 'WhatsApp par manual menu share karna aur daily order totals calculate karna',
    solutionEn: 'a dynamic WhatsApp digital menu where customers add food items to cart and send pre-calculated orders',
    solutionHi: 'ek digital WhatsApp menu jahan customer direct items add kare aur instant calculated order send ho jaye'
  }
];

// Helper to normalize Indian mobile numbers
export function cleanPhoneNumber(rawPhone) {
  if (!rawPhone) return '';
  const digits = rawPhone.replace(/[^\d+]/g, '');
  if (digits.startsWith('+91') && digits.length === 13) {
    return `+91 ${digits.substring(3, 8)} ${digits.substring(8)}`;
  }
  const cleanDigits = digits.replace(/[^\d]/g, '');
  if (cleanDigits.length === 10 && ['6', '7', '8', '9'].includes(cleanDigits[0])) {
    return `+91 ${cleanDigits.substring(0, 5)} ${cleanDigits.substring(5)}`;
  }
  if (cleanDigits.startsWith('91') && cleanDigits.length === 12) {
    return `+91 ${cleanDigits.substring(2, 7)} ${cleanDigits.substring(7)}`;
  }
  return rawPhone.trim();
}

// 4. Generate Highly-Targeted Pitch for Instagram Business
export function generateInstagramPitch({ businessName, handle, category, city, phone }) {
  const cleanHandle = (handle || '').replace(/^@/, '');
  const nicheInfo = INSTAGRAM_NICHES.find(n => n.category.toLowerCase() === (category || '').toLowerCase()) || INSTAGRAM_NICHES[0];
  const isIndia = isIndianLocation(city, phone);

  // High-converting Hinglish Pitch for Instagram Sellers
  const outreachMessageHi = `Namaste ${businessName || 'ji'}! 👋 Maine aapka Instagram page dekha (@${cleanHandle}). Aapka ${category || 'collection'} bohot amazing hai! 🔥

Lekin humne notice kiya ki aap orders aur price inquiries DMs aur WhatsApp par manually handle karte hain. Isme dikkat yeh hoti hai ki ${nicheInfo.painPointHi}.

Hum aapke brand ke liye ${nicheInfo.solutionHi} setup karte hain. Isse aapke customers 1-click me catalog dekh kar direct order kar sakenge aur aapka bohot saara time bach jayega.

Kya main aapko iska 2-min ka quick demo preview WhatsApp par share kar sakta hu?`;

  // High-converting Professional English Pitch
  const outreachMessageEn = `Hi ${businessName || 'Team'}! 👋 Loved your Instagram profile (@${cleanHandle}) and your ${category || 'products'}!

I noticed you manage customer inquiries and orders directly through DMs and WhatsApp. However, one key bottleneck is ${nicheInfo.painPointEn}.

We help Instagram brands set up ${nicheInfo.solutionEn}. This eliminates manual "Price Please" chats and allows your followers to order 24/7 seamlessly.

Would you be open to a quick 2-minute demo preview customized for your brand?`;

  return {
    outreachMessage: isIndia ? outreachMessageHi : outreachMessageEn,
    outreachMessageHi,
    outreachMessageEn,
    isInternational: !isIndia
  };
}

// 5. Main Lead Formatter & Scorer
export function buildInstagramLeadRecord(rawLead) {
  const handle = (rawLead.handle || '').replace(/^@/, '').trim();
  const leadId = `ig:${handle || Date.now().toString()}`;
  const businessName = rawLead.businessName || (handle ? `@${handle}` : 'Instagram Seller');
  const category = rawLead.category || 'Boutique & Designer Wear';
  const city = rawLead.city || 'Delhi NCR';
  const phone = cleanPhoneNumber(rawLead.phone) || 'DM for Contact';
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

  const pitches = generateInstagramPitch({ businessName, handle, category, city, phone });

  const leadRecord = {
    leadId,
    businessName,
    category,
    city,
    address: `${city}, India (Instagram D2C)`,
    phone,
    website: `https://instagram.com/${handle}`,
    instagramHandle: `@${handle}`,
    instagramDmUrl: `https://ig.me/m/${handle}`,
    instagramUrl: `https://instagram.com/${handle}`,
    googleMapsUrl: 'Not available (Instagram Business)',
    rating: 'Active Store',
    reviews: 'D2C Brand',
    websiteStatus: 'Instagram Storefront (No E-com Site)',
    websiteQuality: 'DM / WhatsApp Dependent',
    mobileFriendly: 'Yes (Instagram App)',
    cta: 'DM to Order',
    whatsApp: phone !== 'DM for Contact' ? 'Detected in Bio' : 'Not detected',
    onlineBooking: 'Not visible (Manual Orders)',
    adsStatus: 'High Opportunity (Instagram Traffic)',
    automationStatus: 'High Opportunity (DM to Webstore)',
    aiOpportunity: 'Instagram Catalog Automation & WhatsApp Bot',
    leadScore: 88,
    leadPriority: 'Hot',
    recommendedService: 'Instant E-Commerce Website & WhatsApp Storefront',
    auditReason: 'Business relies 100% on manual Instagram DMs/WhatsApp orders without an automated checkout store',
    outreachMessage: pitches.outreachMessage,
    outreachMessageHi: pitches.outreachMessageHi,
    outreachMessageEn: pitches.outreachMessageEn,
    isInternational: pitches.isInternational,
    bioSnippet: rawLead.bio || '',
    source: 'Instagram Discovery',
    dateAdded: now
  };

  return leadRecord;
}

// 6. Get Saved Instagram Leads
export async function generateRandomInstagramLeads(count = 10) {
  const allLeads = getSavedLeads();
  const igLeads = allLeads.filter(l => l.source === 'Instagram Discovery' || (l.leadId && String(l.leadId).startsWith('ig:')));
  return igLeads.slice(0, count);
}

// 7. Add Real / Manual Instagram Lead
export function addManualInstagramLead({ handle, businessName, category, city, phone, bio }) {
  if (!handle && !phone) {
    throw new Error('Either Instagram Handle or Phone Number is required');
  }

  const cleanHandle = (handle || '').replace(/^@/, '').trim();
  const rawLead = {
    handle: cleanHandle || `brand_${Date.now()}`,
    businessName: businessName || (cleanHandle ? `@${cleanHandle}` : 'Instagram Seller'),
    category: category || 'Boutique & Designer Wear',
    city: city || 'Delhi NCR',
    phone: phone || '',
    bio: bio || ''
  };

  const leadRecord = buildInstagramLeadRecord(rawLead);
  saveLead(leadRecord);
  syncLeadToGoogleSheet(leadRecord).catch(() => {});
  return leadRecord;
}
