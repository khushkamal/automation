# Scenario Specification: LOCAL BUSINESS LEAD GENERATION AUDIT

## Scenario Overview
- **Scenario Name**: `LOCAL BUSINESS LEAD GENERATION AUDIT`
- **Execution Policy**: Build-only configuration. Not scheduled, not run, no test data generated.
- **Data Stores**: `Local Lead Place IDs` (1 MB, Primary key: `OSM type:OSM ID`)
- **Input Spreadsheet**: `Automation` → Sheet: `Search Queue` (`Keyword | City | Status`)
- **Output Spreadsheet**: `Automation` → Sheet: `Leads` (26 Columns)

---

## 1. Flow Diagram

```
[Module 1: Google Sheets - Watch Search Queue Rows]
                     │
         [Filter: Only Ready searches] (Status = 'Ready')
                     │
       [Module 2: HTTP - Search Overpass API] (POST 15s timeout, max 20)
                     │
    [Module 3: Iterator - Iterate OSM elements[]]
                     │
  [Module 4: Data Store - Check Duplicate Record] (Key: type:id)
                     │
       [Module 5: Router - Website Decision]
        ├── ROUTE A: New businesses without websites
        │        │
        │     [Filter: Exists = false AND website tags do not exist]
        │        │
        │     [Module 6: Google Sheets - Add Row to Leads] (Lead Score: 85, Hot)
        │        │
        │     [Module 7: Data Store - Add/Replace Record] (Save type:id)
        │
        └── ROUTE B: Businesses with websites
                 │
              [Filter: Exists = false AND website tag exists]
                 │
              [Module 8: HTTP - Fetch Website] (GET, Redirects on, 20s timeout)
                 │
              [Module 9: Tools - Rule-Based Audit & Deterministic Scoring]
                 │
              [Filter: Lead Score >= 40]
                 │
              [Module 10: Google Sheets - Add Row to Leads]
                 │
              [Module 11: Data Store - Add/Replace Record] (Save type:id)
```

---

## 2. Detailed Module Configuration

### Module 1: Google Sheets → Watch New Rows
- **Spreadsheet**: `Automation`
- **Sheet**: `Search Queue`
- **Headers**: `Keyword`, `City`, `Status`
- **Trigger Filter**: `Status` = `Ready`

### Module 2: HTTP → Make a Request (OpenStreetMap Discovery)
- **URL**: `https://overpass-api.de/api/interpreter`
- **Method**: `POST`
- **Headers**:
  - `User-Agent`: `Make-Local-Business-Lead-Workflow/1.0`
  - `Content-Type`: `text/plain`
- **Body**:
```text
[out:json][timeout:15];
area["name"="{{1.City}}"]["boundary"="administrative"]->.searchArea;
(
  nwr["amenity"="{{1.Keyword}}"](area.searchArea);
  nwr["shop"="{{1.Keyword}}"](area.searchArea);
  nwr["office"="{{1.Keyword}}"](area.searchArea);
);
out center 20;
```
- **Parse Response**: `Yes`
- **Timeout**: `15 seconds`

### Module 3: Iterator
- **Array**: `{{2.data.elements}}`

### Module 4: Data Store → Check existence of a record
- **Data Store**: `Local Lead Place IDs`
- **Key**: `{{3.type}}:{{3.id}}`

---

## 3. Router Branching & Filtering

### ROUTE A: New businesses without websites
- **Filter Conditions**:
  - `4.exists` Equal to `false` (Boolean)
  - `3.tags.website` Does not exist
  - `3.tags.contact:website` Does not exist
  - `3.tags.url` Does not exist

#### Module 6: Write No-Website Lead (Google Sheets `Leads`)
- Fixed values mapped:
  - **Website**: *(blank)*
  - **Website Status**: `No Website`
  - **Website Quality**: `Poor`
  - **Mobile Friendly**: `No`
  - **CTA**: `Not visible`
  - **WhatsApp**: `Not visible`
  - **Online Booking**: `Not visible`
  - **Ads Status**: `Unknown`
  - **Automation Status**: `High Opportunity`
  - **AI Opportunity**: `Rule-based audit; no AI API used`
  - **Lead Score**: `85`
  - **Lead Priority**: `Hot`
  - **Recommended Service**: `Website Development`
  - **Audit Reason**: `Business has no publicly listed website`
  - **Source**: `OpenStreetMap / Overpass`
  - **Date Added**: `{{now}}`

#### Module 7: Data Store → Add/Replace Record
- **Data Store**: `Local Lead Place IDs`
- **Key**: `{{3.type}}:{{3.id}}`
- *(Executed only after Module 6 completes)*

---

### ROUTE B: Businesses with websites
- **Filter Conditions**:
  - `4.exists` Equal to `false` (Boolean)
  - `3.tags.website` OR `3.tags.contact:website` OR `3.tags.url` Exists

#### Module 8: HTTP → Make a Request (Fetch Website)
- **URL**: `{{ifempty(3.tags.website; ifempty(3.tags.`contact:website`; 3.tags.url))}}`
- **Method**: `GET`
- **Follow Redirects**: `Yes`
- **Timeout**: `20 seconds`
- **Error Directive**: Handled gracefully without terminating scenario.

#### Module 9: Rule-Based HTML Audit & Scoring Engine (Set Variables)
Deterministic rules evaluating raw HTML string:
- **`isHttps`**: Check URL prefix and HTML schema links
- **`hasViewport`**: Check `<meta name="viewport"` tag
- **`hasPhone`**: Check `tel:` links and contact numbers
- **`hasCTA`**: Check keywords `contact`, `quote`, `get started`, `inquiry`
- **`hasWhatsApp`**: Check `wa.me`, `whatsapp.com`, `api.whatsapp`
- **`hasBooking`**: Check `calendly.com`, `acuityscheduling.com`, `appointment`, `book now`, `schedule`
- **`hasTracking`**: Check `googletagmanager.com`, `fbq(`, `connect.facebook.net`, `google_conversion`
- **`calculatedScore`**:
  - `+20` if No HTTPS
  - `+25` if Not Mobile Responsive (No viewport)
  - `+15` if No WhatsApp direct integration
  - `+20` if No Online Booking system
  - `+10` if No Clear CTA
  - `+10` if No Tracking / Retargeting Pixel
- **`leadPriority`**:
  - `80–100` = `Hot`
  - `60–79` = `Warm`
  - `40–59` = `Potential`
  - `< 40` = `Low`

#### Filter: Lead Score >= 40
Only qualified leads continue to insertion.

#### Module 10: Write Website Lead (Google Sheets `Leads`)
- Maps audited variables into the 26 columns.

#### Module 11: Data Store → Add/Replace Record
- **Data Store**: `Local Lead Place IDs`
- **Key**: `{{3.type}}:{{3.id}}`
- *(Executed only after Module 10 completes)*

---

## 4. Exact 26 Columns Schema Mapping (Output Sheet: `Leads`)

| # | Column Name | Source / Formula |
| :--- | :--- | :--- |
| 1 | **Lead ID** | `{{3.type}}:{{3.id}}` |
| 2 | **Business Name** | `{{ifempty(3.tags.name; "Unnamed Business")}}` |
| 3 | **Category** | `{{ifempty(3.tags.amenity; ifempty(3.tags.shop; ifempty(3.tags.office; 1.Keyword)))}}` |
| 4 | **City** | `{{ifempty(3.tags.addr:city; 1.City)}}` |
| 5 | **Address** | `{{trim(join(array(3.tags.addr:housenumber; 3.tags.addr:street; 3.tags.addr:city; 3.tags.addr:postcode); ", "))}}` |
| 6 | **Phone** | `{{ifempty(3.tags.phone; "Not listed")}}` |
| 7 | **Website** | Website URL or *blank* |
| 8 | **Google Maps URL** | `Not available` |
| 9 | **Rating** | `Not available` |
| 10 | **Reviews** | `Not available` |
| 11 | **Website Status** | `Live` / `No Website` / `Unable to fetch` |
| 12 | **Website Quality** | `Poor` / `Needs Improvement` / `Fair` |
| 13 | **Mobile Friendly** | `Yes` / `No` / `Unknown` |
| 14 | **CTA** | `Detected` / `Not detected` / `Not visible` |
| 15 | **WhatsApp** | `Detected` / `Not detected` / `Not visible` |
| 16 | **Online Booking** | `Detected` / `Not detected` / `Not visible` |
| 17 | **Ads Status** | `Detected` / `Not detected` / `Unknown` |
| 18 | **Automation Status** | `High Opportunity` / `Moderate Opportunity` |
| 19 | **AI Opportunity** | `Rule-based audit; no AI API used` |
| 20 | **Lead Score** | `85` (No website) or `0–100` calculated |
| 21 | **Lead Priority** | `Hot` / `Warm` / `Potential` / `Low` |
| 22 | **Recommended Service** | `Website Development` / `Mobile Optimization` / `Online Booking System` / `WhatsApp Automation` / `Website Redesign` |
| 23 | **Audit Reason** | Deterministic summary of identified weaknesses |
| 24 | **Outreach Message** | Deterministic pitch hook mentioning business name & detected gaps |
| 25 | **Source** | `OpenStreetMap / Overpass` |
| 26 | **Date Added** | `{{formatDate(now; "YYYY-MM-DD HH:mm:ss")}}` |
