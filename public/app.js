document.addEventListener('DOMContentLoaded', () => {
  // Navigation Tabs
  const navItems = document.querySelectorAll('.nav-item');
  const tabContents = document.querySelectorAll('.tab-content');
  const topbarTitle = document.getElementById('topbar-page-title');
  const topbarSub = document.getElementById('topbar-page-sub');
  const navLeadsCount = document.getElementById('nav-leads-count');
  const navQueueCount = document.getElementById('nav-queue-count');
  const navWaBadge = document.getElementById('nav-wa-badge');
  const waStatusDot = document.getElementById('wa-status-dot');
  const waSidebarText = document.getElementById('wa-sidebar-text');

  const tabTitles = {
    'tab-leads': { title: 'Qualified Leads & Audits', sub: 'Discover local businesses via OpenStreetMap & run deterministic website inspections' },
    'tab-instagram': { title: 'Instagram Business Lead Discovery', sub: 'Random qualified D2C sellers, boutiques, home bakers & service brands with public WhatsApp' },
    'tab-whatsapp': { title: 'WhatsApp Outreach Center', sub: 'Scan QR Code to link your WhatsApp & blast requirement-based audit pitches' },
    'tab-queue': { title: 'Search Queue Manager', sub: 'Manage automated searches for different cities and business categories' },
    'tab-sheets': { title: 'Google Sheets Live Sync', sub: 'Automatic real-time row insertion into your Google Sheet' }
  };

  function switchTab(tabId) {
    navItems.forEach(item => {
      if (item.getAttribute('data-tab') === tabId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    tabContents.forEach(tab => {
      if (tab.id === tabId) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    if (tabTitles[tabId]) {
      topbarTitle.textContent = tabTitles[tabId].title;
      topbarSub.textContent = tabTitles[tabId].sub;
    }

    if (tabId === 'tab-instagram') {
      fetchInstagramLeads();
    } else if (tabId === 'tab-leads') {
      fetchLeads();
    } else if (tabId === 'tab-whatsapp') {
      checkWhatsAppStatus();
    }
  }

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const tabId = item.getAttribute('data-tab');
      switchTab(tabId);
    });
  });

  const btnQuickWaCampaign = document.getElementById('btn-quick-wa-campaign');
  if (btnQuickWaCampaign) {
    btnQuickWaCampaign.addEventListener('click', () => {
      switchTab('tab-whatsapp');
    });
  }

  // Sidebar Show/Hide Toggle Logic (Click to Show, Click to Hide)
  const appLayout = document.querySelector('.app-layout');
  const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
  const btnCollapseSidebar = document.getElementById('btn-collapse-sidebar');

  function toggleSidebar() {
    if (!appLayout) return;
    appLayout.classList.toggle('sidebar-collapsed');
    const isCollapsed = appLayout.classList.contains('sidebar-collapsed');
    localStorage.setItem('sidebar_collapsed', isCollapsed ? 'true' : 'false');
  }

  if (btnToggleSidebar) {
    btnToggleSidebar.addEventListener('click', toggleSidebar);
  }

  if (btnCollapseSidebar) {
    btnCollapseSidebar.addEventListener('click', toggleSidebar);
  }

  // Restore saved sidebar preference if any
  if (localStorage.getItem('sidebar_collapsed') === 'true' && appLayout) {
    appLayout.classList.add('sidebar-collapsed');
  }

  // Metric Stats Elements
  const statTotal = document.getElementById('stat-total');
  const statHot = document.getElementById('stat-hot');
  const statNoWeb = document.getElementById('stat-no-web');
  const statDedup = document.getElementById('stat-dedup');
  
  const leadsTbody = document.getElementById('leads-tbody');
  const searchInput = document.getElementById('search-input');
  const filterPriority = document.getElementById('filter-priority');
  const filterService = document.getElementById('filter-service');

  const quickRunForm = document.getElementById('quick-run-form');
  const inputKeyword = document.getElementById('input-keyword');
  const inputCity = document.getElementById('input-city');
  const inputMax = document.getElementById('input-max');
  const btnRunAudit = document.getElementById('btn-run-audit');

  const executionStatus = document.getElementById('execution-status');
  const statusText = document.getElementById('status-text');
  const statusDetail = document.getElementById('status-detail');

  const btnExportCsv = document.getElementById('btn-export-csv');

  // Queue Elements
  const btnRunAllQueue = document.getElementById('btn-run-all-queue');
  const addQueueForm = document.getElementById('add-queue-form');
  const queueKeyword = document.getElementById('queue-keyword');
  const queueCity = document.getElementById('queue-city');
  const queueStatus = document.getElementById('queue-status');
  const queueTbody = document.getElementById('queue-tbody');

  // Outreach Modal Elements
  const outreachModal = document.getElementById('outreach-modal');
  const btnCloseOutreach = document.getElementById('btn-close-outreach');
  const outreachLeadInfo = document.getElementById('outreach-lead-info');
  const outreachText = document.getElementById('outreach-text');
  const btnCopyOutreach = document.getElementById('btn-copy-outreach');
  const btnWhatsappOutreach = document.getElementById('btn-whatsapp-outreach');

  // WhatsApp Elements
  const waQrContainer = document.getElementById('wa-qr-container');
  const waConnectedContainer = document.getElementById('wa-connected-container');
  const waConnectedNumber = document.getElementById('wa-connected-number');
  const waQrImageBox = document.getElementById('wa-qr-image-box');
  const btnWaLogout = document.getElementById('btn-wa-logout');
  const btnStartWaCampaign = document.getElementById('btn-start-wa-campaign');
  const btnStopWaCampaign = document.getElementById('btn-stop-wa-campaign');
  const waCampaignProgressBox = document.getElementById('wa-campaign-progress-box');
  const waCampaignStatusText = document.getElementById('wa-campaign-status-text');
  const waCampaignCounter = document.getElementById('wa-campaign-counter');
  const waCampaignCurrentTarget = document.getElementById('wa-campaign-current-target');

  // Google Sheets Elements
  const sheetsConfigForm = document.getElementById('sheets-config-form');
  const inputWebhookUrl = document.getElementById('input-webhook-url');
  const btnSaveWebhook = document.getElementById('btn-save-webhook');
  const btnSyncAllNow = document.getElementById('btn-sync-all-now');
  const sheetsSyncStatus = document.getElementById('sheets-sync-status');

  // Instagram Discovery Elements
  const btnGenerateRandomIg = document.getElementById('btn-generate-random-ig');
  const igBatchSize = document.getElementById('ig-batch-size');
  const igBtnSpinner = document.getElementById('ig-btn-spinner');
  const igBtnText = document.getElementById('ig-btn-text');
  const igLeadsTbody = document.getElementById('ig-leads-tbody');
  const igSearchInput = document.getElementById('ig-search-input');
  const igFilterNiche = document.getElementById('ig-filter-niche');
  const igTableCount = document.getElementById('ig-table-count');
  const statIgTotal = document.getElementById('stat-ig-total');
  const statIgWa = document.getElementById('stat-ig-wa');
  const statIgScore = document.getElementById('stat-ig-score');
  const statIgPitches = document.getElementById('stat-ig-pitches');
  const navIgBadge = document.getElementById('nav-ig-badge');

  // Instagram Manual Modal Elements
  const btnOpenIgManualModal = document.getElementById('btn-open-ig-manual-modal');
  const igManualModal = document.getElementById('ig-manual-modal');
  const btnCloseIgManual = document.getElementById('btn-close-ig-manual');
  const btnCancelIgManual = document.getElementById('btn-cancel-ig-manual');
  const formAddIgManual = document.getElementById('form-add-ig-manual');
  const igManualHandle = document.getElementById('ig-manual-handle');
  const igManualName = document.getElementById('ig-manual-name');
  const igManualCategory = document.getElementById('ig-manual-category');
  const igManualCity = document.getElementById('ig-manual-city');
  const igManualPhone = document.getElementById('ig-manual-phone');
  const igManualBio = document.getElementById('ig-manual-bio');

  const inputMemberName = document.getElementById('input-member-name');

  let currentLeads = [];
  let currentInstagramLeads = [];
  let isCloudApiReady = false;

  // 1. Fetch Stats
  async function fetchStats() {
    try {
      const res = await fetch('/api/stats');
      if (!res.ok) throw new Error(`Stats HTTP error ${res.status}`);
      const data = await res.json();
      if (statTotal) statTotal.textContent = data.totalLeads ?? 0;
      if (statHot) statHot.textContent = data.hotLeads ?? 0;
      if (statNoWeb) statNoWeb.textContent = data.noWebsiteLeads ?? 0;
      if (statDedup) statDedup.textContent = data.totalUniqueProcessed ?? 0;
      if (navLeadsCount) navLeadsCount.textContent = data.totalLeads ?? 0;
      if (navQueueCount) navQueueCount.textContent = data.readyQueueCount ?? 0;
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }

  // 2. Fetch Leads
  async function fetchLeads() {
    try {
      const priority = filterPriority ? filterPriority.value : 'All';
      const service = filterService ? filterService.value : 'All';
      const search = searchInput ? searchInput.value.trim() : '';

      const params = new URLSearchParams({ priority, service, search });
      const res = await fetch(`/api/leads?${params.toString()}`);
      if (!res.ok) throw new Error(`Leads HTTP error ${res.status}`);
      const data = await res.json();

      currentLeads = data.leads || [];
      renderLeadsTable(currentLeads);
    } catch (err) {
      console.error('Error fetching leads:', err);
      if (leadsTbody) {
        leadsTbody.innerHTML = `
          <tr>
            <td colspan="8" class="empty-state-cell">
              <div class="empty-icon">⚠️</div>
              <h3 style="color:var(--text-primary);">Unable to load leads</h3>
              <p>${escapeHtml(err.message)}</p>
            </td>
          </tr>
        `;
      }
    }
  }

  // Helper to get clean phone number digits
  function getCleanDigits(phone) {
    if (!phone) return null;
    let digits = String(phone).replace(/[^0-9]/g, '');
    if (!digits || digits.length < 8) return null;
    if (digits.length === 10) digits = '91' + digits;
    return digits;
  }

  // 3. Render Leads Table (Sleek UI with 1-Click WhatsApp DM)
  function renderLeadsTable(leads) {
    if (!leadsTbody) return;
    if (!leads || leads.length === 0) {
      leadsTbody.innerHTML = `
        <tr>
          <td colspan="8" class="empty-state-cell">
            <div class="empty-icon">🔍</div>
            <h3 style="color:var(--text-primary); font-size:15px; margin-bottom:4px;">No qualified leads found</h3>
            <p style="font-size:12px;">Run a search query to discover local businesses or adjust your filters.</p>
          </td>
        </tr>
      `;
      return;
    }

    leadsTbody.innerHTML = leads.map(lead => {
      let scoreClass = 'potential';
      const score = Number(lead.leadScore) || 0;
      if (score >= 80) scoreClass = 'hot';
      else if (score >= 60) scoreClass = 'warm';

      const isNoWeb = !lead.website || lead.websiteStatus === 'No Website';
      
      let webDisplay = '<span class="pill-tag" style="color:#fb7185; background:rgba(244,63,94,0.1)">No Website</span>';
      if (!isNoWeb && lead.website) {
        let hostname = lead.website;
        try {
          const cleanUrl = lead.website.startsWith('http') ? lead.website : 'https://' + lead.website;
          const urlObj = new URL(cleanUrl);
          hostname = urlObj.hostname;
        } catch (e) {
          hostname = lead.website;
        }
        const fullHref = lead.website.startsWith('http') ? lead.website : 'https://' + lead.website;
        webDisplay = `<a href="${escapeHtml(fullHref)}" target="_blank" rel="noopener noreferrer" style="color:#60a5fa; font-weight:600; text-decoration:none;">${escapeHtml(hostname)} ↗</a>`;
      }

      const signalChips = isNoWeb ? `
        <span class="chip fail">Mobile: No</span>
        <span class="chip fail">WA: No</span>
        <span class="chip fail">Booking: No</span>
      ` : `
        <span class="chip ${lead.mobileFriendly === 'Yes' ? 'pass' : 'fail'}">Mobile: ${lead.mobileFriendly || 'No'}</span>
        <span class="chip ${lead.whatsApp === 'Detected' ? 'pass' : 'fail'}">WA: ${lead.whatsApp === 'Detected' ? 'Yes' : 'No'}</span>
        <span class="chip ${lead.onlineBooking === 'Detected' ? 'pass' : 'fail'}">Booking: ${lead.onlineBooking === 'Detected' ? 'Yes' : 'No'}</span>
      `;

      const cleanDigits = getCleanDigits(lead.phone);
      const phoneDisplay = (lead.phone && lead.phone !== 'Not listed' && lead.phone !== 'DM for Contact')
        ? `<a href="tel:${escapeHtml(lead.phone)}" style="color:#34d399; font-weight:600; text-decoration:none; font-family:var(--font-mono); font-size:12px;">📞 ${escapeHtml(lead.phone)}</a>`
        : '<span style="color:#64748b; font-size:12px;">Not listed</span>';

      const isSent = lead.whatsappSent || false;
      const sentBadge = isSent 
        ? `<div style="font-size:10px; color:#059669; font-weight:700; margin-top:4px;">✅ Sent by ${escapeHtml(lead.whatsappSentBy || 'Team')}</div>`
        : '';

      const ticketBadge = (lead.ticketSize || lead.purchasingPower) ? `
        <div style="margin-top:3px;">
          <span class="pill-tag" style="background:rgba(234,88,12,0.1); color:var(--brand-orange-dark); font-weight:700; font-size:10px; border-color:rgba(234,88,12,0.25);">
            💎 ${escapeHtml(lead.ticketSize || lead.purchasingPower)}
          </span>
        </div>
      ` : `
        <div style="margin-top:3px;">
          <span class="pill-tag" style="background:rgba(234,88,12,0.08); color:var(--brand-orange-dark); font-weight:700; font-size:10px;">
            💎 High-Ticket Niche
          </span>
        </div>
      `;

      // 1-Click WhatsApp Link URL
      const waLink = cleanDigits ? `https://wa.me/${cleanDigits}?text=${encodeURIComponent(lead.outreachMessage || '')}` : '#';

      return `
        <tr>
          <td>
            <div class="score-badge ${scoreClass}">
              ${score}
              <span>${escapeHtml(lead.leadPriority || 'Hot')}</span>
            </div>
          </td>
          <td>
            <div class="lead-name">${escapeHtml(lead.businessName || 'Unnamed Business')}</div>
            ${ticketBadge}
            <div class="lead-address">📍 ${escapeHtml(lead.city || '')} • ${escapeHtml(lead.address || '')}</div>
            ${sentBadge}
          </td>
          <td>
            <span class="pill-tag">${escapeHtml(lead.category || 'Business')}</span>
          </td>
          <td>
            ${phoneDisplay}
          </td>
          <td>
            <div>${webDisplay}</div>
            <div class="audit-chips">${signalChips}</div>
          </td>
          <td>
            <span class="service-pill">${escapeHtml(lead.recommendedService || 'Website Development')}</span>
          </td>
          <td>
            <div style="font-size:12px; color:var(--text-secondary); max-width:240px; line-height:1.4;">${escapeHtml(lead.auditReason || 'Opportunity detected')}</div>
          </td>
          <td>
            <div style="display:flex; flex-direction:column; gap:5px;">
              ${cleanDigits ? `
                <button class="btn btn-emerald btn-sm btn-lead-send-wa" data-phone="${escapeHtml(lead.phone)}" data-leadid="${escapeHtml(lead.leadId)}" style="padding:4px 8px; font-size:11px; white-space:nowrap;">
                  ⚡ ${isSent ? 'Resend WA' : '1-Click DM'}
                </button>
              ` : ''}
              <div style="display:flex; gap:4px;">
                <button class="btn btn-secondary btn-sm btn-pitch" data-id="${escapeHtml(lead.leadId || '')}" style="padding:3px 8px; font-size:11px; flex:1;">
                  💬 Pitch
                </button>
                ${cleanDigits ? `
                  <a href="${escapeHtml(waLink)}" target="_blank" rel="noopener noreferrer" class="btn btn-ghost btn-sm" title="Open in WhatsApp Web" style="padding:3px 6px; font-size:11px;">
                    ↗
                  </a>
                ` : ''}
              </div>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Bind Pitch buttons
    document.querySelectorAll('.btn-pitch').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const leadId = e.currentTarget.getAttribute('data-id');
        const lead = currentLeads.find(l => l.leadId === leadId);
        if (lead) openOutreachModal(lead);
      });
    });

    // Bind 1-Click WhatsApp Direct Send buttons
    document.querySelectorAll('.btn-lead-send-wa').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const leadId = e.currentTarget.getAttribute('data-leadid');
        const lead = currentLeads.find(l => l.leadId === leadId);
        if (!lead) return;

        await executeDirectWhatsAppSend(btn, lead);
      });
    });
  }

  // 3.1 Fetch & Render Instagram Leads
  async function fetchInstagramLeads() {
    try {
      const res = await fetch('/api/instagram/leads');
      if (!res.ok) throw new Error(`Instagram Leads HTTP error ${res.status}`);
      const data = await res.json();
      currentInstagramLeads = data.leads || [];

      // Update Instagram Stats
      if (statIgTotal) statIgTotal.textContent = currentInstagramLeads.length;
      const waReadyCount = currentInstagramLeads.filter(l => l.phone && l.phone !== 'DM for Contact' && l.phone !== 'Not listed').length;
      if (statIgWa) statIgWa.textContent = waReadyCount;
      if (statIgPitches) statIgPitches.textContent = currentInstagramLeads.length;
      if (navIgBadge) navIgBadge.textContent = currentInstagramLeads.length > 0 ? `${currentInstagramLeads.length} Hot` : 'D2C Hot';

      filterAndRenderInstagramTable();
    } catch (err) {
      console.error('Error fetching Instagram leads:', err);
    }
  }

  function filterAndRenderInstagramTable() {
    if (!igLeadsTbody) return;
    const search = igSearchInput ? igSearchInput.value.toLowerCase().trim() : '';
    const niche = igFilterNiche ? igFilterNiche.value : 'All';

    let filtered = currentInstagramLeads;
    if (niche !== 'All') {
      filtered = filtered.filter(l => l.category?.toLowerCase() === niche.toLowerCase());
    }
    if (search) {
      filtered = filtered.filter(l =>
        (l.businessName && l.businessName.toLowerCase().includes(search)) ||
        (l.instagramHandle && l.instagramHandle.toLowerCase().includes(search)) ||
        (l.city && l.city.toLowerCase().includes(search)) ||
        (l.phone && l.phone.toLowerCase().includes(search)) ||
        (l.category && l.category.toLowerCase().includes(search))
      );
    }

    if (igTableCount) igTableCount.textContent = filtered.length;
    renderInstagramTable(filtered);
  }

  function renderInstagramTable(leads) {
    if (!igLeadsTbody) return;
    if (!leads || leads.length === 0) {
      igLeadsTbody.innerHTML = `
        <tr>
          <td colspan="7" class="empty-state-cell">
            <div class="empty-icon">📸</div>
            <h3 style="color:var(--text-primary); font-size:15px; margin-bottom:4px;">No Instagram leads found</h3>
            <p style="font-size:12px;">Click <strong>"🎲 Generate Random Instagram Leads"</strong> above or add one manually.</p>
          </td>
        </tr>
      `;
      return;
    }

    igLeadsTbody.innerHTML = leads.map(lead => {
      const cleanHandle = (lead.instagramHandle || lead.businessName || '').replace(/^@/, '');
      const igProfileUrl = `https://instagram.com/${cleanHandle}`;
      const igDmUrl = `https://ig.me/m/${cleanHandle}`;
      const isSent = Boolean(lead.whatsappSent || lead.contactedBy || lead.contactStatus === 'Contacted');
      
      const cleanDigits = getCleanDigits(lead.phone);
      const phoneValid = Boolean(cleanDigits && lead.phone !== 'DM for Contact' && lead.phone !== 'Not listed');
      const waLink = cleanDigits ? `https://wa.me/${cleanDigits}?text=${encodeURIComponent(lead.outreachMessage || '')}` : '#';

      return `
        <tr>
          <td>
            <div class="score-badge hot" style="font-size:13px; font-weight:800;">
              ${lead.leadScore || 88}
              <span class="score-pill">🔥 Hot</span>
            </div>
          </td>
          <td>
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:18px;">📸</span>
              <div>
                <div class="lead-name">${escapeHtml(lead.businessName || '@' + cleanHandle)}</div>
                <a href="${escapeHtml(igProfileUrl)}" target="_blank" rel="noopener noreferrer" style="color:#f43f5e; font-weight:700; font-size:12px; text-decoration:none; display:inline-flex; align-items:center; gap:3px;">
                  @${escapeHtml(cleanHandle)} ↗
                </a>
              </div>
            </div>
            ${lead.bioSnippet ? `<div style="font-size:11px; color:var(--text-tertiary); margin-top:4px; max-width:220px; line-height:1.3; font-style:italic;">"${escapeHtml(lead.bioSnippet.substring(0, 80))}..."</div>` : ''}
          </td>
          <td>
            <span class="pill-tag" style="background:rgba(225,48,108,0.12); color:#f43f5e; font-weight:700; border:1px solid rgba(225,48,108,0.25);">${escapeHtml(lead.category || 'D2C Brand')}</span>
            <div class="lead-address" style="margin-top:4px;">📍 ${escapeHtml(lead.city || 'India')}</div>
          </td>
          <td>
            ${phoneValid ? `
              <div style="display:flex; align-items:center; gap:6px;">
                <span style="color:#10b981; font-weight:700; font-size:13px; font-family:var(--font-mono);">${escapeHtml(lead.phone)}</span>
              </div>
              <span class="pill-tag" style="font-size:10px; color:#10b981; background:rgba(16,185,129,0.1); margin-top:2px;">WhatsApp Ready</span>
            ` : `
              <span class="pill-tag" style="color:#fb7185; background:rgba(244,63,94,0.1);">DM for Contact</span>
            `}
          </td>
          <td>
            <div style="font-size:12px; color:#fb7185; font-weight:600;">Manual DM / WhatsApp Orders</div>
            <div style="font-size:11px; color:var(--text-tertiary); margin-top:2px;">No automated checkout</div>
          </td>
          <td>
            <span class="service-pill" style="border-color:rgba(225,48,108,0.3); color:#fb7185;">${escapeHtml(lead.recommendedService || 'WhatsApp Storefront')}</span>
          </td>
          <td>
            <div style="display:flex; flex-direction:column; gap:6px;">
              ${phoneValid ? `
                <button class="btn btn-emerald btn-sm btn-ig-send-wa" data-phone="${escapeHtml(lead.phone)}" data-leadid="${escapeHtml(lead.leadId)}" style="padding:4px 10px; font-size:11px;">
                  ⚡ ${isSent ? 'Resend WA' : '1-Click WhatsApp DM'}
                </button>
              ` : ''}
              <div style="display:flex; gap:4px;">
                <a href="${escapeHtml(igDmUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" style="padding:3px 8px; font-size:11px; color:#f43f5e; flex:1; text-align:center; text-decoration:none;">
                  📱 Open DM
                </a>
                <button class="btn btn-secondary btn-sm btn-ig-pitch" data-id="${escapeHtml(lead.leadId)}" style="padding:3px 8px; font-size:11px; flex:1;">
                  📋 Pitch
                </button>
                ${phoneValid ? `
                  <a href="${escapeHtml(waLink)}" target="_blank" rel="noopener noreferrer" class="btn btn-ghost btn-sm" title="Open in WhatsApp Web" style="padding:3px 6px; font-size:11px;">
                    ↗
                  </a>
                ` : ''}
              </div>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Bind action buttons
    document.querySelectorAll('.btn-ig-pitch').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const leadId = e.currentTarget.getAttribute('data-id');
        const lead = currentInstagramLeads.find(l => l.leadId === leadId) || currentLeads.find(l => l.leadId === leadId);
        if (lead) openOutreachModal(lead);
      });
    });

    document.querySelectorAll('.btn-ig-send-wa').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const leadId = e.currentTarget.getAttribute('data-leadid');
        const lead = currentInstagramLeads.find(l => l.leadId === leadId);
        if (!lead) return;

        await executeDirectWhatsAppSend(btn, lead);
      });
    });
  }

  // Unified Direct WhatsApp Send Handler
  async function executeDirectWhatsAppSend(btnElement, lead) {
    const memberName = inputMemberName ? inputMemberName.value.trim() : 'Team Member';
    const originalText = btnElement.textContent;
    btnElement.disabled = true;
    btnElement.textContent = '⏳ Sending...';

    try {
      const res = await fetch('/api/whatsapp/send-single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: lead.phone,
          message: lead.outreachMessage,
          leadId: lead.leadId,
          memberName
        })
      });
      const data = await res.json();

      if (data.success) {
        btnElement.textContent = '✅ Sent!';
        btnElement.style.background = '#10b981';
        btnElement.style.color = '#fff';
        lead.whatsappSent = true;
        await fetchStats();
        setTimeout(() => {
          btnElement.disabled = false;
          btnElement.textContent = '⚡ Resend WA';
        }, 3000);
      } else {
        // Fallback: If not configured, launch WhatsApp directly via Web/Desktop
        const cleanDigits = getCleanDigits(lead.phone);
        if (cleanDigits) {
          const directUrl = `https://wa.me/${cleanDigits}?text=${encodeURIComponent(lead.outreachMessage || '')}`;
          window.open(directUrl, '_blank');
          btnElement.textContent = '💬 Opened WA';
        } else {
          openOutreachModal(lead);
          btnElement.textContent = originalText;
        }
        btnElement.disabled = false;
      }
    } catch (err) {
      const cleanDigits = getCleanDigits(lead.phone);
      if (cleanDigits) {
        const directUrl = `https://wa.me/${cleanDigits}?text=${encodeURIComponent(lead.outreachMessage || '')}`;
        window.open(directUrl, '_blank');
      } else {
        openOutreachModal(lead);
      }
      btnElement.textContent = originalText;
      btnElement.disabled = false;
    }
  }

  // 4. Quick Run Audit
  if (quickRunForm) {
    quickRunForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const keyword = inputKeyword.value.trim();
      const city = inputCity.value.trim();
      const maxResults = parseInt(inputMax.value, 10) || 20;

      if (btnRunAudit) btnRunAudit.disabled = true;
      if (executionStatus) executionStatus.classList.remove('hidden');
      if (statusText) statusText.textContent = `Searching OpenStreetMap for "${keyword}" in ${city}...`;
      if (statusDetail) statusDetail.textContent = 'Querying Overpass API & running live deterministic website inspections...';

      try {
        const res = await fetch('/api/run-audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keyword, city, maxResults })
        });
        const data = await res.json();

        if (data.success) {
          if (statusText) statusText.textContent = `Completed! Discovered ${data.totalFoundInOSM || 0} businesses.`;
          if (statusDetail) statusDetail.textContent = `Added ${data.qualifiedAdded || 0} qualified leads to database.`;
          setTimeout(() => {
            if (executionStatus) executionStatus.classList.add('hidden');
          }, 4000);
        } else {
          if (statusText) statusText.textContent = `Error: ${data.error || 'Failed to complete'}`;
        }
        
        await fetchStats();
        await fetchLeads();
      } catch (err) {
        if (statusText) statusText.textContent = 'Network error during audit run.';
        console.error(err);
      } finally {
        if (btnRunAudit) btnRunAudit.disabled = false;
      }
    });
  }

  // Clear All Leads Handler
  const btnClearAllLeads = document.getElementById('btn-clear-all-leads');
  const btnClearIgLeads = document.getElementById('btn-clear-ig-leads');

  async function handleClearLeads() {
    if (!confirm('Are you sure you want to clear all leads? Next search will start with a fresh database.')) return;
    try {
      await fetch('/api/leads/clear', { method: 'POST' });
      await fetchStats();
      await fetchLeads();
      await fetchInstagramLeads();
    } catch (err) {
      alert('Error clearing leads: ' + err.message);
    }
  }

  if (btnClearAllLeads) {
    btnClearAllLeads.addEventListener('click', handleClearLeads);
  }
  if (btnClearIgLeads) {
    btnClearIgLeads.addEventListener('click', handleClearLeads);
  }

  // 4.0. High-Ticket Niche Preset Click Handlers
  document.querySelectorAll('.btn-niche-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      const keyword = btn.getAttribute('data-keyword');
      if (inputKeyword) {
        inputKeyword.value = keyword;
        inputKeyword.focus();
        if (inputCity && !inputCity.value.trim()) {
          inputCity.value = 'Delhi NCR';
        }
      }
    });
  });

  // 4.1. Random Worldwide Handlers
  const selectRandomRegion = document.getElementById('select-random-region');
  const btnRollRandomInputs = document.getElementById('btn-roll-random-inputs');
  const btnRunRandomWorldwide = document.getElementById('btn-run-random-worldwide');

  if (btnRollRandomInputs) {
    btnRollRandomInputs.addEventListener('click', async () => {
      const region = selectRandomRegion ? selectRandomRegion.value : 'Worldwide';
      try {
        const res = await fetch(`/api/random-suggestion?region=${encodeURIComponent(region)}`);
        const data = await res.json();
        if (inputKeyword) inputKeyword.value = data.keyword;
        if (inputCity) inputCity.value = data.city;
      } catch (err) {
        console.error(err);
      }
    });
  }

  if (btnRunRandomWorldwide) {
    btnRunRandomWorldwide.addEventListener('click', async () => {
      const region = selectRandomRegion ? selectRandomRegion.value : 'Worldwide';
      btnRunRandomWorldwide.disabled = true;

      if (executionStatus) executionStatus.classList.remove('hidden');
      if (statusText) statusText.textContent = `Picking random global city in ${region}...`;
      if (statusDetail) statusDetail.textContent = 'Querying OpenStreetMap and running instant website audits...';

      try {
        const res = await fetch('/api/run-random-audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ region, maxResults: 15 })
        });
        const data = await res.json();

        if (data.success) {
          if (statusText) statusText.textContent = `Completed! Discovered ${data.totalFoundInOSM || 0} ${data.query.keyword}s in ${data.query.city} (${data.query.region}).`;
          if (statusDetail) statusDetail.textContent = `Added ${data.qualifiedAdded || 0} qualified worldwide leads.`;
          if (inputKeyword) inputKeyword.value = data.query.keyword;
          if (inputCity) inputCity.value = data.query.city;
          setTimeout(() => {
            if (executionStatus) executionStatus.classList.add('hidden');
          }, 4000);
        } else {
          if (statusText) statusText.textContent = `Error: ${data.error || 'Failed to complete'}`;
        }

        await fetchStats();
        await fetchLeads();
      } catch (err) {
        if (statusText) statusText.textContent = 'Network error during random worldwide audit.';
        console.error(err);
      } finally {
        btnRunRandomWorldwide.disabled = false;
      }
    });
  }

  // 5. Run Queue
  if (btnRunAllQueue) {
    btnRunAllQueue.addEventListener('click', async () => {
      btnRunAllQueue.disabled = true;
      try {
        const res = await fetch('/api/run-queue', { method: 'POST' });
        const data = await res.json();
        if (data.success) {
          alert(`Queue execution completed! Processed ${data.processedItems?.length || 0} searches.`);
        }
        await fetchStats();
        await fetchLeads();
        loadQueueData();
      } catch (err) {
        console.error(err);
      } finally {
        btnRunAllQueue.disabled = false;
      }
    });
  }

  // 6. Export CSV
  if (btnExportCsv) {
    btnExportCsv.addEventListener('click', () => {
      window.location.href = '/api/export-csv';
    });
  }

  // 7. Queue Management
  async function loadQueueData() {
    try {
      const res = await fetch('/api/search-queue');
      const queue = await res.json();
      renderQueueTable(queue);
    } catch (err) {
      console.error(err);
    }
  }

  function renderQueueTable(queue) {
    if (!queueTbody) return;
    if (!queue || queue.length === 0) {
      queueTbody.innerHTML = `<tr><td colspan="5" class="empty-state-cell">Queue is empty</td></tr>`;
      return;
    }
    queueTbody.innerHTML = queue.map(item => `
      <tr>
        <td><strong>${escapeHtml(item.keyword)}</strong></td>
        <td>${escapeHtml(item.city)}</td>
        <td><span class="pill-tag" style="background:${item.status === 'Ready' ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)'}; color:${item.status === 'Ready' ? '#34d399' : '#94a3b8'};">${escapeHtml(item.status)}</span></td>
        <td style="font-size:12px; color:var(--text-tertiary);">${new Date(item.createdAt).toLocaleDateString()}</td>
        <td>
          <button class="btn btn-secondary btn-sm btn-del-queue" data-id="${escapeHtml(item.id)}" style="color:#fb7185;">✕ Remove</button>
        </td>
      </tr>
    `).join('');

    document.querySelectorAll('.btn-del-queue').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.getAttribute('data-id');
        await fetch(`/api/search-queue/${id}`, { method: 'DELETE' });
        loadQueueData();
        fetchStats();
      });
    });
  }

  if (addQueueForm) {
    addQueueForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const keyword = queueKeyword.value.trim();
      const city = queueCity.value.trim();
      const status = queueStatus.value;

      await fetch('/api/search-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, city, status })
      });

      queueKeyword.value = '';
      queueCity.value = '';
      loadQueueData();
      fetchStats();
    });
  }

  // 8. Outreach Pitch Modal
  let activeModalLead = null;
  const btnPitchLangHi = document.getElementById('btn-pitch-lang-hi');
  const btnPitchLangEn = document.getElementById('btn-pitch-lang-en');

  function updatePitchLanguage(lang) {
    if (!activeModalLead) return;
    if (lang === 'hi') {
      outreachText.value = activeModalLead.outreachMessage;
      if (btnPitchLangHi) btnPitchLangHi.className = 'btn btn-secondary btn-sm';
      if (btnPitchLangEn) btnPitchLangEn.className = 'btn btn-ghost btn-sm';
    } else {
      outreachText.value = activeModalLead.outreachMessageEn || activeModalLead.outreachMessage;
      if (btnPitchLangHi) btnPitchLangHi.className = 'btn btn-ghost btn-sm';
      if (btnPitchLangEn) btnPitchLangEn.className = 'btn btn-secondary btn-sm';
    }

    // Update WhatsApp link with new text
    const cleanDigits = getCleanDigits(activeModalLead.phone);
    if (cleanDigits && btnWhatsappOutreach) {
      btnWhatsappOutreach.href = `https://wa.me/${cleanDigits}?text=${encodeURIComponent(outreachText.value)}`;
    }
  }

  if (btnPitchLangHi) btnPitchLangHi.addEventListener('click', () => updatePitchLanguage('hi'));
  if (btnPitchLangEn) btnPitchLangEn.addEventListener('click', () => updatePitchLanguage('en'));

  function openOutreachModal(lead) {
    activeModalLead = lead;
    if (!outreachLeadInfo || !outreachText || !outreachModal) return;
    
    const countryFlag = lead.isInternational ? '🌍 International Client' : '🇮🇳 Indian Client';
    
    outreachLeadInfo.innerHTML = `
      <div>
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <h4 style="color:var(--text-primary); font-size:16px; font-weight:800;">${escapeHtml(lead.businessName || 'Business')}</h4>
          <span class="pill-tag" style="font-size:10px; font-weight:700;">${countryFlag}</span>
        </div>
        <p style="font-size:12px; color:var(--text-secondary); margin-top:2px;">${escapeHtml(lead.category || '')} in ${escapeHtml(lead.city || '')} • Recommended Service: <strong style="color:var(--brand-orange-dark)">${escapeHtml(lead.recommendedService || '')}</strong></p>
      </div>
    `;
    
    // Auto-detect default language: English for international, Hinglish for India
    const defaultLang = lead.isInternational ? 'en' : 'hi';
    updatePitchLanguage(defaultLang);

    outreachModal.classList.remove('hidden');
  }

  if (btnCloseOutreach) {
    btnCloseOutreach.addEventListener('click', () => {
      if (outreachModal) outreachModal.classList.add('hidden');
    });
  }

  if (btnCopyOutreach) {
    btnCopyOutreach.addEventListener('click', () => {
      if (outreachText) {
        navigator.clipboard.writeText(outreachText.value);
        btnCopyOutreach.textContent = '✅ Pitch Copied!';
        setTimeout(() => {
          btnCopyOutreach.textContent = '📋 Copy Pitch';
        }, 2000);
      }
    });
  }

  // ================================================================
  // 9. WHATSAPP DIRECT WEB SOCKET STATUS & QR CONNECTION
  // ================================================================

  async function checkWhatsAppStatus() {
    try {
      const res = await fetch('/api/whatsapp/status');
      const data = await res.json();

      if (data.status === 'CONNECTED') {
        if (navWaBadge) {
          navWaBadge.textContent = 'Active';
          navWaBadge.style.background = '#10b981';
          navWaBadge.style.color = '#fff';
        }
        if (waStatusDot) waStatusDot.className = 'status-dot online';
        if (waSidebarText) waSidebarText.textContent = `WhatsApp: +${data.user}`;

        if (waQrContainer) waQrContainer.classList.add('hidden');
        if (waConnectedContainer) waConnectedContainer.classList.remove('hidden');
        if (waConnectedNumber) waConnectedNumber.textContent = `+${data.user}`;

        if (data.isCampaignRunning) {
          if (waCampaignProgressBox) waCampaignProgressBox.classList.remove('hidden');
          if (btnStartWaCampaign) btnStartWaCampaign.classList.add('hidden');
          if (btnStopWaCampaign) btnStopWaCampaign.classList.remove('hidden');
          if (waCampaignCounter) waCampaignCounter.textContent = `${data.campaignProgress.sent} / ${data.campaignProgress.total}`;
          if (waCampaignCurrentTarget) waCampaignCurrentTarget.textContent = `Current: ${data.campaignProgress.current}`;
        } else {
          if (btnStartWaCampaign) btnStartWaCampaign.classList.remove('hidden');
          if (btnStopWaCampaign) btnStopWaCampaign.classList.add('hidden');
          if (waCampaignProgressBox) waCampaignProgressBox.classList.add('hidden');
        }

      } else {
        if (navWaBadge) {
          navWaBadge.textContent = 'Scan QR';
          navWaBadge.style.background = '#f59e0b';
          navWaBadge.style.color = '#fff';
        }
        if (waStatusDot) waStatusDot.className = 'status-dot';
        if (waSidebarText) waSidebarText.textContent = 'WhatsApp: Offline';

        if (waConnectedContainer) waConnectedContainer.classList.add('hidden');
        if (waQrContainer) waQrContainer.classList.remove('hidden');

        if (data.qrCode && waQrImageBox) {
          waQrImageBox.innerHTML = `
            <img src="${data.qrCode}" alt="WhatsApp QR Code" style="width:240px; height:240px; display:block; margin:0 auto; border-radius:8px;" />
            <div style="margin-top:10px; font-size:11px; color:#10b981; font-weight:700;">🟢 Live QR Ready - Scan Now</div>
          `;
        } else if (waQrImageBox) {
          waQrImageBox.innerHTML = `
            <div class="spinner" style="margin:80px auto 16px;"></div>
            <p style="font-size:12px; color:#64748b; font-weight:600;">Generating QR Code...</p>
          `;
        }
      }
    } catch (err) {
      console.error('WhatsApp status check error:', err);
    }
  }

  if (btnWaLogout) {
    btnWaLogout.addEventListener('click', async () => {
      if (confirm('Disconnect WhatsApp device and scan a new QR code?')) {
        await fetch('/api/whatsapp/logout', { method: 'POST' });
        checkWhatsAppStatus();
      }
    });
  }

  // ================================================================
  // 9.1 CUSTOM NUMBERS BULK DISPATCHER & TEMPLATES
  // ================================================================
  const bulkCustomNumbers = document.getElementById('bulk-custom-numbers');
  const btnLoadIgNumbers = document.getElementById('btn-load-ig-numbers');
  const btnLoadMapsNumbers = document.getElementById('btn-load-maps-numbers');
  const btnClearBulkNumbers = document.getElementById('btn-clear-bulk-numbers');
  const bulkNumbersCount = document.getElementById('bulk-numbers-count');
  const bulkTemplateSelect = document.getElementById('bulk-template-select');
  const bulkLangSelect = document.getElementById('bulk-lang-select');
  const bulkCustomMessage = document.getElementById('bulk-custom-message');
  const bulkDispatchStatus = document.getElementById('bulk-dispatch-status');
  const btnSendBulkCustomAuto = document.getElementById('btn-send-bulk-custom-auto');
  const btnLaunchBulkWebQueue = document.getElementById('btn-launch-bulk-web-queue');
  const bulkPreviewList = document.getElementById('bulk-preview-list');
  const previewBadgeCount = document.getElementById('preview-badge-count');
  const bulkTagBtns = document.querySelectorAll('.bulk-tag-btn');

  const pitchTemplates = {
    'dynamic-req': `[🎯 AUTO-PERSONALIZED BY CLIENT REQUIREMENT]\n\nHar lead ko unki exact audit findings ke mutabiq pitch jayegi:\n• No Website -> High-Converting Website & Booking Setup Pitch\n• Missing SEO/WhatsApp -> Specific Missing Issues & Inquiry Boost Pitch\n• Instagram Brand -> 1-Click WhatsApp Catalog & Storefront Pitch\n• Well Optimized -> Google & Local Ads Traffic Scaling Pitch`,
    'dynamic-vars': `Namaste {businessName}! 👋\n\nMaine {city} me aapke {category} business ki online presence audit ki. Isme {issue} optimize karke aap direct customer inquiries aur WhatsApp appointments 2x–3x boost kar sakte hain.\n\nHumne aapke liye ek short solution overview ready kiya hai. Kya hum ispar 2-min discuss kar sakte hain?`,
    'web-audit': `Namaste {businessName}! 🙏\n\nMain {city} me aapke {category} business ki online presence dekh raha tha. Humne aapke business ke liye ek Free Website & Digital Presence Audit prepare kiya hai jisse Google aur local search se direct customer inquiries 3x boost ho sakti hain.\n\nKya main aapke sath short 2-minute audit overview share karun?`,
    'ig-store': `Hi {businessName}! Loved your {category} collection on Instagram ✨\n\nAapke orders abhi manual DMs me process hote hain jisme kaafi time lagta hai. Hum aapke brand ke liye ek 1-Click WhatsApp Automated Storefront & Instant Catalog setup kar sakte hain jisse customer direct order place kar sakein.\n\nKya main aapke brand ke liye live demo share karun?`,
    'speed-opt': `Hello {businessName}! 🚀\n\nAapki website {website} inspection me mobile layout aur conversion speed optimization ke opportunities detect huye hain. Fast loading websites se customer conversion 40% tak improve hota hai.\n\nHumne aapke liye ek quick optimization plan banaya hai. Kya hum connect kar sakte hain?`,
    'custom': `Namaste! 🙏\n\nHum aapke business ke liye high-converting digital solutions aur website growth setup offer karte hain. Kya hum short discussion kar sakte hain?`
  };

  // Helper to find lead info from memory for a given phone
  function getLeadForPhone(phone) {
    if (!phone) return null;
    const clean = getCleanDigits(phone);
    if (!clean) return null;
    const last10 = clean.slice(-10);

    // 1. Check in current active leads
    const foundMaps = currentLeads.find(l => {
      const p = getCleanDigits(l.phone);
      return p && (p.endsWith(last10) || p === clean);
    });
    if (foundMaps) return foundMaps;

    // 2. Check in current Instagram leads
    const foundIg = currentInstagramLeads.find(l => {
      const p = getCleanDigits(l.phone);
      return p && (p.endsWith(last10) || p === clean);
    });
    if (foundIg) return foundIg;

    return null;
  }

  // Client-side Personalized Pitch Generator
  function generateClientSidePitch(lead, phone, templateType, templateText, lang) {
    const isEnglish = lang === 'en' || (lang === 'auto' && lead?.isInternational);
    const businessName = lead?.businessName || `Contact +${phone}`;
    const category = lead?.category || 'business';
    const city = lead?.city || 'your area';
    const website = lead?.website || '';
    const recommendedService = lead?.recommendedService || 'Digital Growth & WhatsApp Funnel Setup';
    const auditReason = lead?.auditReason || 'Online Presence & Lead Funnel Optimization';
    const isNoWeb = !website || lead?.websiteStatus === 'No Website';
    const isInstagram = lead?.source === 'Instagram Discovery' || (lead?.leadId && String(lead.leadId).startsWith('ig:'));

    // Mode 1: Auto Requirement Pitch
    if (templateType === 'dynamic-req' || !templateType) {
      if (lead) {
        if (isEnglish && lead.outreachMessageEn) return lead.outreachMessageEn;
        if (!isEnglish && lead.outreachMessageHi) return lead.outreachMessageHi;
        if (lead.outreachMessage) return lead.outreachMessage;
      }

      if (isInstagram) {
        return isEnglish
          ? `Hi ${businessName}! 👋 Loved your Instagram profile and your ${category}! We help active Instagram brands set up 1-Click WhatsApp Storefronts & instant product catalogs so customers order 24/7. Would you be open to a quick 2-minute demo preview?`
          : `Namaste ${businessName}! 👋 Maine aapka Instagram page dekha. Aapka ${category} collection bohot amazing hai! 🔥 Hum aapke brand ke liye 1-Click WhatsApp Automated Storefront setup karte hain jisse customers direct 24/7 order kar sakein. Kya main 2-min live preview share karun?`;
      }

      if (isNoWeb) {
        return isEnglish
          ? `Hi ${businessName}, noticed your ${category} practice in ${city} does not have an active website. High-intent clients actively search Google before booking high-value services. We build high-converting websites with instant appointment booking & WhatsApp inquiry funnels. Would you be open for a quick 2-min preview?`
          : `Namaste ${businessName}, maine notice kiya ki ${city} me aapke ${category} business ki koi active website nahi hai. Aaj kal high-value clients aur patients pehle Google pe verify karke hi appointment book karte hain. Hum aapke business ke liye ek premium website & instant WhatsApp booking system setup kar sakte hain. Kya hum ispar 2-min discuss kar sakte hain?`;
      }

      // Site exists with audit findings
      return isEnglish
        ? `Hi ${businessName}, I reviewed ${website || 'your website'} for your ${category} in ${city} and noticed potential improvements in ${auditReason}. Fixing these can boost your customer inquiries significantly. Can I share a quick 2-min overview?`
        : `Namaste ${businessName}, maine ${city} me aapke ${category} business ki website ${website || ''} audit ki. Isme ${auditReason} optimize karke aap direct customer inquiries 2x se 3x boost kar sakte hain. Kya main short 2-minute overview share karun?`;
    }

    // Mode 2: Dynamic Template with Placeholders
    let resolved = (templateText || pitchTemplates['dynamic-vars'] || '')
      .replace(/\{businessName\}|\{name\}/gi, businessName)
      .replace(/\{category\}|\{niche\}/gi, category)
      .replace(/\{city\}|\{location\}/gi, city)
      .replace(/\{requirement\}|\{service\}/gi, recommendedService)
      .replace(/\{issue\}|\{auditReason\}/gi, auditReason)
      .replace(/\{website\}/gi, website || (isNoWeb ? 'No Website listed' : 'your profile'))
      .replace(/\{handle\}/gi, lead?.instagramHandle || businessName);

    return resolved;
  }

  // Live Preview Renderer
  function updateLiveBulkPreview() {
    if (!bulkPreviewList) return;
    const numbers = extractValidNumbersFromText(bulkCustomNumbers ? bulkCustomNumbers.value : '');
    const templateType = bulkTemplateSelect ? bulkTemplateSelect.value : 'dynamic-req';
    const templateText = bulkCustomMessage ? bulkCustomMessage.value : '';
    const lang = bulkLangSelect ? bulkLangSelect.value : 'auto';

    if (previewBadgeCount) {
      previewBadgeCount.textContent = `${numbers.length} Recipient${numbers.length === 1 ? '' : 's'}`;
    }

    if (numbers.length === 0) {
      bulkPreviewList.innerHTML = `
        <div style="font-size:12px; color:var(--text-tertiary); text-align:center; padding:14px;">
          Numbers enter karein ya "+ Load Leads" par click karein to see customized pitches for each client.
        </div>
      `;
      return;
    }

    let previewHtml = '';
    const displayLimit = Math.min(numbers.length, 12);

    for (let i = 0; i < displayLimit; i++) {
      const phone = numbers[i];
      const lead = getLeadForPhone(phone);
      const pitch = generateClientSidePitch(lead, phone, templateType, templateText, lang);

      let reqBadge = `<span style="background:rgba(59,130,246,0.15); color:#60a5fa; padding:2px 8px; border-radius:10px; font-size:10px; font-weight:700;">🎯 Custom Growth Audit</span>`;
      if (lead) {
        if (lead.source === 'Instagram Discovery' || (lead.leadId && String(lead.leadId).startsWith('ig:'))) {
          reqBadge = `<span style="background:rgba(168,85,247,0.15); color:#c084fc; padding:2px 8px; border-radius:10px; font-size:10px; font-weight:700;">🛍️ Instagram Storefront Pitch</span>`;
        } else if (!lead.website || lead.websiteStatus === 'No Website') {
          reqBadge = `<span style="background:rgba(239,68,68,0.15); color:#f87171; padding:2px 8px; border-radius:10px; font-size:10px; font-weight:700;">🔴 No Website Listed (Web Setup Pitch)</span>`;
        } else if (lead.auditReason) {
          reqBadge = `<span style="background:rgba(245,158,11,0.15); color:#fbbf24; padding:2px 8px; border-radius:10px; font-size:10px; font-weight:700;">⚡ Audit: ${escapeHtml(lead.auditReason.substring(0, 35))}...</span>`;
        }
      }

      previewHtml += `
        <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); border-radius:var(--radius-sm); padding:10px 12px; display:flex; flex-direction:column; gap:6px;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:11px; font-weight:800; color:var(--brand-orange); font-family:var(--font-mono);">#${i + 1} +${phone}</span>
              <span style="font-size:12px; font-weight:700; color:var(--text-primary);">${escapeHtml(lead?.businessName || 'Business Lead')}</span>
              ${lead?.city ? `<span style="font-size:11px; color:var(--text-tertiary);">(${escapeHtml(lead.city)})</span>` : ''}
            </div>
            <div>${reqBadge}</div>
          </div>
          <div style="font-size:11px; color:var(--text-secondary); line-height:1.45; background:rgba(0,0,0,0.2); padding:6px 10px; border-radius:4px; font-family:var(--font-mono); white-space:pre-wrap;">${escapeHtml(pitch)}</div>
        </div>
      `;
    }

    if (numbers.length > displayLimit) {
      previewHtml += `
        <div style="font-size:11px; color:var(--text-tertiary); text-align:center; padding:6px;">
          ... and ${numbers.length - displayLimit} more leads will each receive their own customized pitch!
        </div>
      `;
    }

    bulkPreviewList.innerHTML = previewHtml;
  }

  // Initialize default template message
  if (bulkCustomMessage) {
    bulkCustomMessage.value = pitchTemplates['dynamic-req'];
  }

  if (bulkTemplateSelect) {
    bulkTemplateSelect.addEventListener('change', () => {
      const selected = bulkTemplateSelect.value;
      if (bulkCustomMessage && pitchTemplates[selected]) {
        bulkCustomMessage.value = pitchTemplates[selected];
      }
      updateLiveBulkPreview();
    });
  }

  if (bulkLangSelect) {
    bulkLangSelect.addEventListener('change', updateLiveBulkPreview);
  }

  // Dynamic Tag Click Handlers
  bulkTagBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tag = btn.getAttribute('data-tag');
      if (!tag || !bulkCustomMessage) return;

      // If in dynamic-req mode, switch to dynamic-vars so user can customize template
      if (bulkTemplateSelect && bulkTemplateSelect.value === 'dynamic-req') {
        bulkTemplateSelect.value = 'dynamic-vars';
        bulkCustomMessage.value = pitchTemplates['dynamic-vars'];
      }

      const start = bulkCustomMessage.selectionStart || bulkCustomMessage.value.length;
      const end = bulkCustomMessage.selectionEnd || bulkCustomMessage.value.length;
      const text = bulkCustomMessage.value;
      bulkCustomMessage.value = text.substring(0, start) + tag + text.substring(end);
      bulkCustomMessage.focus();
      bulkCustomMessage.selectionStart = bulkCustomMessage.selectionEnd = start + tag.length;
      updateLiveBulkPreview();
    });
  });

  function extractValidNumbersFromText(text) {
    if (!text) return [];
    // Match potential numbers separated by comma, space, newline, semicolons
    const rawTokens = text.split(/[\n,;\s]+/);
    const valid = [];
    for (const token of rawTokens) {
      const digits = getCleanDigits(token);
      if (digits && digits.length >= 8 && !valid.includes(digits)) {
        valid.push(digits);
      }
    }
    return valid;
  }

  function updateBulkNumbersCount() {
    if (!bulkCustomNumbers || !bulkNumbersCount) return;
    const nums = extractValidNumbersFromText(bulkCustomNumbers.value);
    bulkNumbersCount.textContent = nums.length;
    updateLiveBulkPreview();
  }

  if (bulkCustomNumbers) {
    bulkCustomNumbers.addEventListener('input', updateBulkNumbersCount);
  }

  if (bulkCustomMessage) {
    bulkCustomMessage.addEventListener('input', updateLiveBulkPreview);
  }

  if (btnLoadIgNumbers) {
    btnLoadIgNumbers.addEventListener('click', () => {
      const igPhones = [];
      for (const lead of currentInstagramLeads) {
        const clean = getCleanDigits(lead.phone);
        if (clean && !igPhones.includes(clean)) {
          igPhones.push(clean);
        }
      }
      if (igPhones.length === 0) {
        alert('No Instagram leads with phone numbers loaded yet. Click "Generate Random Instagram Leads" in Instagram tab first.');
        return;
      }
      const existing = bulkCustomNumbers ? bulkCustomNumbers.value.trim() : '';
      const combined = existing ? `${existing}\n${igPhones.join('\n')}` : igPhones.join('\n');
      if (bulkCustomNumbers) {
        bulkCustomNumbers.value = combined;
        updateBulkNumbersCount();
      }
      if (bulkTemplateSelect) {
        bulkTemplateSelect.value = 'dynamic-req';
        bulkCustomMessage.value = pitchTemplates['dynamic-req'];
      }
      updateLiveBulkPreview();
    });
  }

  if (btnLoadMapsNumbers) {
    btnLoadMapsNumbers.addEventListener('click', () => {
      const mapPhones = [];
      for (const lead of currentLeads) {
        const clean = getCleanDigits(lead.phone);
        if (clean && !mapPhones.includes(clean)) {
          mapPhones.push(clean);
        }
      }
      if (mapPhones.length === 0) {
        alert('No Google Maps leads found yet. Run an audit search in Leads tab first.');
        return;
      }
      const existing = bulkCustomNumbers ? bulkCustomNumbers.value.trim() : '';
      const combined = existing ? `${existing}\n${mapPhones.join('\n')}` : mapPhones.join('\n');
      if (bulkCustomNumbers) {
        bulkCustomNumbers.value = combined;
        updateBulkNumbersCount();
      }
      if (bulkTemplateSelect) {
        bulkTemplateSelect.value = 'dynamic-req';
        bulkCustomMessage.value = pitchTemplates['dynamic-req'];
      }
      updateLiveBulkPreview();
    });
  }

  if (btnClearBulkNumbers) {
    btnClearBulkNumbers.addEventListener('click', () => {
      if (bulkCustomNumbers) {
        bulkCustomNumbers.value = '';
        updateBulkNumbersCount();
      }
      if (bulkDispatchStatus) bulkDispatchStatus.textContent = '';
      updateLiveBulkPreview();
    });
  }

  // Auto Dispatcher to All Custom Numbers with Requirement Personalization
  if (btnSendBulkCustomAuto) {
    btnSendBulkCustomAuto.addEventListener('click', async () => {
      const numbers = extractValidNumbersFromText(bulkCustomNumbers ? bulkCustomNumbers.value : '');
      const templateType = bulkTemplateSelect ? bulkTemplateSelect.value : 'dynamic-req';
      const rawMessage = bulkCustomMessage ? bulkCustomMessage.value.trim() : '';
      const message = templateType === 'dynamic-req' ? 'dynamic-req' : rawMessage;
      const memberName = inputMemberName ? inputMemberName.value.trim() : 'Team Member';
      const lang = bulkLangSelect ? bulkLangSelect.value : 'auto';

      if (numbers.length === 0) {
        alert('Please enter or load at least one phone number in the box above.');
        return;
      }
      if (!message) {
        alert('Pitch message cannot be empty.');
        return;
      }

      btnSendBulkCustomAuto.disabled = true;
      if (bulkDispatchStatus) {
        bulkDispatchStatus.textContent = `⏳ Dispatching requirement-tailored pitches to ${numbers.length} leads in background...`;
        bulkDispatchStatus.style.color = '#3b82f6';
      }

      try {
        const allLoadedLeads = [...currentLeads, ...currentInstagramLeads];
        const res = await fetch('/api/whatsapp/send-bulk-custom', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            numbers,
            message,
            memberName,
            lang,
            leadsData: allLoadedLeads
          })
        });
        const data = await res.json();

        if (data.success) {
          if (bulkDispatchStatus) {
            const skippedText = data.skipped > 0 ? ` (${data.skipped} duplicates skipped)` : '';
            bulkDispatchStatus.textContent = `✅ Bulk Completed! Successfully sent requirement pitches to ${data.sent} of ${data.total} leads${skippedText}.`;
            bulkDispatchStatus.style.color = '#10b981';
          }
          await fetchStats();
        } else {
          // If server messaging failed, offer 1-click web queue
          if (bulkDispatchStatus) {
            bulkDispatchStatus.textContent = `⚠️ Server Notice: ${data.error || 'Failed'}. Use "1-Click Rapid Web Queue" button.`;
            bulkDispatchStatus.style.color = '#f59e0b';
          }
        }
      } catch (err) {
        if (bulkDispatchStatus) {
          bulkDispatchStatus.textContent = `❌ Error: ${err.message}. You can use "1-Click Rapid Web Queue" below.`;
          bulkDispatchStatus.style.color = '#ef4444';
        }
      } finally {
        btnSendBulkCustomAuto.disabled = false;
      }
    });
  }

  // 1-Click Rapid Web Queue (Zero-Config browser sequence with Requirement Personalization)
  let bulkQueueIndex = 0;
  let bulkQueueNumbers = [];

  if (btnLaunchBulkWebQueue) {
    btnLaunchBulkWebQueue.addEventListener('click', () => {
      bulkQueueNumbers = extractValidNumbersFromText(bulkCustomNumbers ? bulkCustomNumbers.value : '');
      const templateType = bulkTemplateSelect ? bulkTemplateSelect.value : 'dynamic-req';
      const templateText = bulkCustomMessage ? bulkCustomMessage.value.trim() : '';
      const lang = bulkLangSelect ? bulkLangSelect.value : 'auto';

      if (bulkQueueNumbers.length === 0) {
        alert('Please enter or load at least one phone number in the box above.');
        return;
      }

      if (bulkQueueIndex >= bulkQueueNumbers.length) {
        bulkQueueIndex = 0;
      }

      const currentNum = bulkQueueNumbers[bulkQueueIndex];
      const lead = getLeadForPhone(currentNum);
      const personalizedPitch = generateClientSidePitch(lead, currentNum, templateType, templateText, lang);

      const directUrl = `https://wa.me/${currentNum}?text=${encodeURIComponent(personalizedPitch)}`;
      window.open(directUrl, '_blank');

      bulkQueueIndex++;
      const targetName = lead ? lead.businessName : `+${currentNum}`;
      const targetReq = lead?.recommendedService || 'Custom Growth Audit';

      if (bulkDispatchStatus) {
        bulkDispatchStatus.innerHTML = `💬 Opened WhatsApp for <strong>${escapeHtml(targetName)}</strong> (+${currentNum}) with requirement: <em>${escapeHtml(targetReq)}</em> (${bulkQueueIndex}/${bulkQueueNumbers.length}). Click again to open next!`;
        bulkDispatchStatus.style.color = '#059669';
      }

      if (bulkQueueIndex < bulkQueueNumbers.length) {
        btnLaunchBulkWebQueue.textContent = `💬 Open Next (${bulkQueueIndex + 1}/${bulkQueueNumbers.length})`;
      } else {
        btnLaunchBulkWebQueue.textContent = `✅ All ${bulkQueueNumbers.length} Opened! (Restart)`;
        bulkQueueIndex = 0;
      }
    });
  }

  if (btnStartWaCampaign) {
    btnStartWaCampaign.addEventListener('click', async () => {
      const memberName = inputMemberName ? inputMemberName.value.trim() : 'Team Member';
      const templateType = bulkTemplateSelect ? bulkTemplateSelect.value : 'dynamic-req';
      const templateText = bulkCustomMessage ? bulkCustomMessage.value.trim() : '';
      const lang = bulkLangSelect ? bulkLangSelect.value : 'auto';

      btnStartWaCampaign.disabled = true;
      try {
        const res = await fetch('/api/whatsapp/start-campaign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            memberName,
            template: templateType === 'dynamic-req' ? 'dynamic-req' : templateText,
            lang
          })
        });
        const data = await res.json();
        if (data.success) {
          alert(`🚀 Campaign launched by ${memberName}! Sending requirement-tailored pitches to ${data.totalTargets || 'unsent'} qualified leads in background. (Any lead already contacted is automatically skipped)`);
        } else {
          alert(`Notice: ${data.error || 'No unsent leads available'}`);
        }
        checkWhatsAppStatus();
      } catch (err) {
        alert('Error: ' + err.message);
      } finally {
        btnStartWaCampaign.disabled = false;
      }
    });
  }

  if (btnStopWaCampaign) {
    btnStopWaCampaign.addEventListener('click', async () => {
      await fetch('/api/whatsapp/stop-campaign', { method: 'POST' });
      checkWhatsAppStatus();
    });
  }

  // 10. Google Sheets Sync
  async function loadSheetsSettings() {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (inputWebhookUrl && data.googleSheetWebhookUrl) {
        inputWebhookUrl.value = data.googleSheetWebhookUrl;
      }
    } catch (err) {
      console.error(err);
    }
  }

  if (sheetsConfigForm) {
    sheetsConfigForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const googleSheetWebhookUrl = inputWebhookUrl.value.trim();
      btnSaveWebhook.disabled = true;

      try {
        const res = await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ googleSheetWebhookUrl })
        });
        const data = await res.json();
        if (data.success) {
          sheetsSyncStatus.textContent = '✅ Google Sheet Webhook URL saved successfully! Auto-sync is active.';
          sheetsSyncStatus.classList.remove('hidden');
        }
      } catch (err) {
        sheetsSyncStatus.textContent = '❌ Failed to save: ' + err.message;
        sheetsSyncStatus.classList.remove('hidden');
      } finally {
        btnSaveWebhook.disabled = false;
      }
    });
  }

  if (btnSyncAllNow) {
    btnSyncAllNow.addEventListener('click', async () => {
      btnSyncAllNow.disabled = true;
      sheetsSyncStatus.textContent = '⏳ Pushing leads to Google Sheet...';
      sheetsSyncStatus.classList.remove('hidden');

      try {
        const res = await fetch('/api/sync-all-to-sheets', { method: 'POST' });
        const data = await res.json();
        if (data.success) {
          sheetsSyncStatus.textContent = `✅ Successfully pushed ${data.count} leads into your Google Sheet!`;
        } else {
          sheetsSyncStatus.textContent = `❌ ${data.error || 'Failed to sync'}`;
        }
      } catch (err) {
        sheetsSyncStatus.textContent = `❌ Error: ` + err.message;
      } finally {
        btnSyncAllNow.disabled = false;
      }
    });
  }

  // 11. Instagram Discovery Event Listeners
  if (btnGenerateRandomIg) {
    btnGenerateRandomIg.addEventListener('click', async () => {
      const count = igBatchSize ? parseInt(igBatchSize.value, 10) : 10;
      if (igBtnSpinner) igBtnSpinner.classList.remove('hidden');
      if (igBtnText) igBtnText.textContent = `Generating ${count} Random Leads...`;
      btnGenerateRandomIg.disabled = true;

      try {
        const res = await fetch('/api/instagram/generate-random', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ count })
        });
        const data = await res.json();
        if (data.success) {
          await fetchInstagramLeads();
          await fetchLeads();
          await fetchStats();
        } else {
          alert('Error: ' + (data.error || 'Failed to generate Instagram leads'));
        }
      } catch (err) {
        alert('Network Error: ' + err.message);
      } finally {
        if (igBtnSpinner) igBtnSpinner.classList.add('hidden');
        if (igBtnText) igBtnText.textContent = '🎲 Generate Random Instagram Leads';
        btnGenerateRandomIg.disabled = false;
      }
    });
  }

  if (igSearchInput) igSearchInput.addEventListener('input', filterAndRenderInstagramTable);
  if (igFilterNiche) igFilterNiche.addEventListener('change', filterAndRenderInstagramTable);

  // Manual Modal Listeners
  if (btnOpenIgManualModal) {
    btnOpenIgManualModal.addEventListener('click', () => {
      if (igManualModal) igManualModal.classList.remove('hidden');
    });
  }

  if (btnCloseIgManual) {
    btnCloseIgManual.addEventListener('click', () => {
      if (igManualModal) igManualModal.classList.add('hidden');
    });
  }

  if (btnCancelIgManual) {
    btnCancelIgManual.addEventListener('click', () => {
      if (igManualModal) igManualModal.classList.add('hidden');
    });
  }

  if (formAddIgManual) {
    formAddIgManual.addEventListener('submit', async (e) => {
      e.preventDefault();
      const handle = igManualHandle.value.trim();
      const businessName = igManualName.value.trim();
      const category = igManualCategory.value;
      const city = igManualCity.value.trim();
      const phone = igManualPhone.value.trim();
      const bio = igManualBio.value.trim();

      try {
        const res = await fetch('/api/instagram/manual-add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ handle, businessName, category, city, phone, bio })
        });
        const data = await res.json();
        if (data.success) {
          if (igManualModal) igManualModal.classList.add('hidden');
          formAddIgManual.reset();
          await fetchInstagramLeads();
          await fetchLeads();
          await fetchStats();
          if (data.lead) openOutreachModal(data.lead);
        } else {
          alert('Error: ' + (data.error || 'Failed to add Instagram lead'));
        }
      } catch (err) {
        alert('Network Error: ' + err.message);
      }
    });
  }

  // Filter Listeners
  if (searchInput) searchInput.addEventListener('input', fetchLeads);
  if (filterPriority) filterPriority.addEventListener('change', fetchLeads);
  if (filterService) filterService.addEventListener('change', fetchLeads);

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Initial Boot
  fetchStats();
  fetchLeads();
  fetchInstagramLeads();
  loadQueueData();
  loadSheetsSettings();
  checkWhatsAppStatus();
  setInterval(checkWhatsAppStatus, 4000);
});
