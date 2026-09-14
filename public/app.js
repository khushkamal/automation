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
    'tab-whatsapp': { title: 'WhatsApp Outreach Center', sub: '100% Free Direct Web Socket automated client messenger' },
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
  const waQrImageBox = document.getElementById('wa-qr-image-box');
  const waConnectedContainer = document.getElementById('wa-connected-container');
  const waConnectedNumber = document.getElementById('wa-connected-number');
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

  let currentLeads = [];

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
              <h3 style="color:#fff;">Unable to load leads</h3>
              <p>${escapeHtml(err.message)}</p>
            </td>
          </tr>
        `;
      }
    }
  }

  // 3. Render Leads Table (Sleek UI)
  function renderLeadsTable(leads) {
    if (!leadsTbody) return;
    if (!leads || leads.length === 0) {
      leadsTbody.innerHTML = `
        <tr>
          <td colspan="8" class="empty-state-cell">
            <div class="empty-icon">🔍</div>
            <h3 style="color:#fff; font-size:15px; margin-bottom:4px;">No qualified leads found</h3>
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

      const phoneDisplay = (lead.phone && lead.phone !== 'Not listed')
        ? `<a href="tel:${escapeHtml(lead.phone)}" style="color:#34d399; font-weight:600; text-decoration:none; font-family:var(--font-mono); font-size:12px;">📞 ${escapeHtml(lead.phone)}</a>`
        : '<span style="color:#64748b; font-size:12px;">Not listed</span>';

      const isSent = lead.whatsappSent || false;
      const sentBadge = isSent 
        ? `<div style="font-size:10px; color:#059669; font-weight:700; margin-top:4px;">✅ Sent by ${escapeHtml(lead.whatsappSentBy || 'Team')}</div>`
        : '';

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
            <button class="btn btn-secondary btn-sm btn-pitch" data-id="${escapeHtml(lead.leadId || '')}" ${isSent ? 'style="border-color:#10b981; color:#059669;"' : ''}>
              ${isSent ? '✅ Sent' : '💬 Pitch'}
            </button>
          </td>
        </tr>
      `;
    }).join('');

    document.querySelectorAll('.btn-pitch').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const leadId = e.target.getAttribute('data-id');
        const lead = currentLeads.find(l => l.leadId === leadId);
        if (lead) openOutreachModal(lead);
      });
    });
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
    const phoneStr = String(activeModalLead.phone || '');
    const cleanPhone = phoneStr.replace(/[^0-9]/g, '');
    if (cleanPhone && cleanPhone.length >= 7) {
      btnWhatsappOutreach.href = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(outreachText.value)}`;
    }
  }

  if (btnPitchLangHi) btnPitchLangHi.addEventListener('click', () => updatePitchLanguage('hi'));
  if (btnPitchLangEn) btnPitchLangEn.addEventListener('click', () => updatePitchLanguage('en'));

  function openOutreachModal(lead) {
    activeModalLead = lead;
    if (!outreachLeadInfo || !outreachText || !outreachModal) return;
    outreachLeadInfo.innerHTML = `
      <div>
        <h4 style="color:#fff; font-size:16px; font-weight:700;">${escapeHtml(lead.businessName || 'Business')}</h4>
        <p style="font-size:12px; color:var(--text-secondary); margin-top:2px;">${escapeHtml(lead.category || '')} in ${escapeHtml(lead.city || '')} • Recommended Service: <strong style="color:#60a5fa">${escapeHtml(lead.recommendedService || '')}</strong></p>
      </div>
    `;
    
    // Default to Hinglish
    updatePitchLanguage('hi');

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

  // 9. WhatsApp Status & Campaign
  async function checkWhatsAppStatus() {
    try {
      const res = await fetch('/api/whatsapp/status');
      const data = await res.json();

      if (data.status === 'CONNECTED') {
        if (navWaBadge) navWaBadge.textContent = 'Active';
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
        }
      } else {
        if (navWaBadge) navWaBadge.textContent = 'Link App';
        if (waStatusDot) waStatusDot.className = 'status-dot';
        if (waSidebarText) waSidebarText.textContent = 'WhatsApp: Offline';

        if (waConnectedContainer) waConnectedContainer.classList.add('hidden');
        if (waQrContainer) waQrContainer.classList.remove('hidden');

        if (data.qrCode) {
          if (waQrImageBox) {
            waQrImageBox.innerHTML = `<img src="${data.qrCode}" alt="WhatsApp QR Code" style="width:240px; height:240px; display:block;" />`;
          }
        } else {
          if (waQrImageBox) {
            waQrImageBox.innerHTML = `<div class="spinner" style="margin:40px auto;"></div><p style="font-size:12px; color:var(--text-tertiary);">Generating QR code...</p>`;
          }
        }
      }
    } catch (err) {
      console.error('WhatsApp status check error:', err);
    }
  }

  if (btnWaLogout) {
    btnWaLogout.addEventListener('click', async () => {
      if (confirm('Disconnect WhatsApp device?')) {
        await fetch('/api/whatsapp/logout', { method: 'POST' });
        checkWhatsAppStatus();
      }
    });
  }

  const inputMemberName = document.getElementById('input-member-name');

  if (btnStartWaCampaign) {
    btnStartWaCampaign.addEventListener('click', async () => {
      const memberName = inputMemberName ? inputMemberName.value.trim() : 'Team Member';
      btnStartWaCampaign.disabled = true;
      try {
        const res = await fetch('/api/whatsapp/start-campaign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ memberName })
        });
        const data = await res.json();
        if (data.success) {
          alert(`🚀 Campaign launched by ${memberName}! Sending audit pitch to ${data.totalTargets || 'unsent'} qualified leads in background. (Any lead already contacted by other team members is automatically skipped)`);
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
  loadQueueData();
  loadSheetsSettings();
  checkWhatsAppStatus();
  setInterval(checkWhatsAppStatus, 5000);
});
