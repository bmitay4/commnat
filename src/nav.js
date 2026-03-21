import i18n from './i18n.js';
import { sb } from './supabase.js';
import { initNotifications, openNotificationsPanel, destroyNotifications } from './notifications.js';

const NAV_ICONS = {
  dashboard:    '🏛️',
  military:     '⚔️',
  economy:      '🏭',
  attacks:      '💥',
  alliances:    '🤝',
  intelligence: '🔍',
  rankings:     '📊',
  hof:          '🏆',
};

function navPages() {
  return [
    { id: 'dashboard',    label: NAV_ICONS.dashboard    + ' ' + i18n.t('nav.dashboard') },
    { id: 'military',     label: NAV_ICONS.military     + ' ' + i18n.t('nav.military') },
    { id: 'economy',      label: NAV_ICONS.economy      + ' ' + i18n.t('nav.economy') },
    { id: 'attacks',      label: NAV_ICONS.attacks      + ' ' + i18n.t('nav.attacks') },
    { id: 'alliances',    label: NAV_ICONS.alliances    + ' ' + i18n.t('nav.alliances') },
    { id: 'intelligence', label: NAV_ICONS.intelligence + ' ' + i18n.t('nav.intelligence') },
    { id: 'rankings',     label: NAV_ICONS.rankings     + ' ' + i18n.t('nav.rankings') },
    { id: 'hof',          label: NAV_ICONS.hof          + ' ' + i18n.t('nav.hof') },
  ];
}

export function renderPageTopbar(user, profile, nation, activePage) {
  return `
    <div class="nav-topbar" style="
      background:var(--surface);
      border-bottom:1px solid var(--border);
      padding:0 20px;
      display:flex;
      align-items:center;
      position:sticky;
      top:0;
      z-index:50;
      box-shadow:0 1px 3px rgba(0,0,0,0.04);
      height:48px;
      gap:0;
    ">
      <!-- Logo -->
      <div style="
        display:flex;align-items:center;gap:8px;
        font-size:14px;font-weight:800;color:var(--accent);
        padding-inline-end:16px;
        border-inline-end:1px solid var(--border);
        height:100%;flex-shrink:0;
        margin-inline-end:4px;
      ">
        <div style="
          width:26px;height:26px;background:var(--accent);border-radius:7px;
          display:flex;align-items:center;justify-content:center;
          font-size:13px;color:#fff;flex-shrink:0;
        ">⚔</div>
        NC
      </div>

      <!-- Nav tabs -->
      <div style="display:flex;align-items:stretch;flex:1;overflow-x:auto;scrollbar-width:none;height:100%;">
        ${navPages().map(p => `
          <button data-page="${p.id}" style="
            display:flex;align-items:center;gap:5px;
            padding:0 12px;height:100%;
            font-family:var(--font-body);
            font-size:13px;
            font-weight:${p.id === activePage ? '700' : '500'};
            color:${p.id === activePage ? 'var(--accent)' : 'var(--text-muted)'};
            border:none;
            border-bottom:2px solid ${p.id === activePage ? 'var(--accent)' : 'transparent'};
            background:none;cursor:pointer;white-space:nowrap;
            transition:color 0.15s,border-color 0.15s;
            flex-shrink:0;
          ">${p.label}</button>
        `).join('')}
      </div>

      <!-- Right: lang switcher, notifications, admin, sign out -->
      <div style="
        display:flex;align-items:center;gap:6px;flex-shrink:0;
        padding-inline-start:14px;
        border-inline-start:1px solid var(--border);
        height:100%;
      ">
        <div class="lang-switcher-light" style="display:flex;gap:4px;">
          <button class="lang-btn-light ${i18n.language === 'en' ? 'active' : ''}" data-lang="en">EN</button>
          <button class="lang-btn-light ${i18n.language === 'he' ? 'active' : ''}" data-lang="he">עב</button>
        </div>

        ${nation ? `
          <button id="btn-notif-bell" style="
            position:relative;
            background:none;border:1.5px solid var(--border);
            border-radius:var(--radius-sm);
            color:var(--text-muted);
            font-size:15px;
            width:34px;height:34px;
            display:flex;align-items:center;justify-content:center;
            cursor:pointer;flex-shrink:0;
            transition:all 0.15s;
          " title="Notifications">
            🔔
            <span id="notif-badge" style="
              display:none;
              position:absolute;top:-5px;right:-5px;
              background:var(--danger);color:#fff;
              font-size:9px;font-weight:700;
              min-width:16px;height:16px;
              border-radius:999px;
              align-items:center;justify-content:center;
              padding:0 3px;
              border:2px solid var(--surface);
              font-family:var(--font-body);
            "></span>
          </button>
        ` : ''}
        ${profile?.is_admin ? `
          <button data-page="admin" style="
            background:none;border:1.5px solid var(--border);border-radius:var(--radius-sm);
            color:var(--text-muted);font-family:var(--font-body);font-size:12px;font-weight:600;
            padding:5px 10px;cursor:pointer;transition:all 0.15s;white-space:nowrap;
          ">⚙️ ${i18n.t('nav.admin')}</button>
        ` : ''}
        <button id="btn-signout" style="
          background:none;border:1.5px solid var(--border);border-radius:var(--radius-sm);
          color:var(--text-muted);font-family:var(--font-body);font-size:12px;font-weight:600;
          padding:5px 10px;cursor:pointer;transition:all 0.15s;white-space:nowrap;
        ">${i18n.t('nav.signOut')}</button>
      </div>
    </div>
  `;
}

export function bindPageNav(user, profile, nation) {
  document.querySelectorAll('[data-page]').forEach(el => {
    el.addEventListener('click', () => _navigate(el.getAttribute('data-page'), user, profile, nation));
  });

  document.getElementById('btn-signout')?.addEventListener('click', () => sb.auth.signOut());

  // Notification bell
  document.getElementById('btn-notif-bell')?.addEventListener('click', () => openNotificationsPanel());

  // Init notifications (fetch unread count + subscribe realtime)
  if (nation) {
    destroyNotifications(); // clean up any previous subscription
    initNotifications(nation);
  }

  document.querySelectorAll('[data-lang]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const lang = btn.getAttribute('data-lang');
      await i18n.changeLanguage(lang);
      // i18n 'languageChanged' event in main.js handles full re-render
      // Just update button states immediately
      document.querySelectorAll('.lang-btn-light').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-lang') === lang);
      });
    });
  });
}

async function _navigate(page, user, profile, nation) {
  const { data: fresh } = await sb
    .from('nations')
    .select('*')
    .eq('owner_id', user.id)
    .eq('is_alive', true)
    .maybeSingle();
  const n = fresh || nation;

  // Track current page for lang-change re-rendering
  if (window.__setCurrentPage) window.__setCurrentPage(page, user, profile, n);

  switch (page) {
    case 'intelligence': { const { renderIntelligence } = await import('./pages/intelligence.js'); renderIntelligence(user, profile, n); break; }
    case 'alliances':    { const { renderAlliances }    = await import('./pages/alliances.js');    renderAlliances(user, profile, n);    break; }
    case 'dashboard':    { const { renderDashboard }    = await import('./pages/dashboard.js');    renderDashboard(user, profile);       break; }
    case 'military':     { const { renderMilitary }     = await import('./pages/military.js');     renderMilitary(user, profile, n);     break; }
    case 'economy':      { const { renderEconomy }      = await import('./pages/economy.js');      renderEconomy(user, profile, n);      break; }
    case 'attacks':      { const { renderAttacks }      = await import('./pages/attacks.js');      renderAttacks(user, profile, n);      break; }
    case 'rankings':     { const { renderRankings }     = await import('./pages/rankings.js');     renderRankings(user, profile, n);     break; }
    case 'hof':          { const { renderHallOfFame }   = await import('./pages/hall-of-fame.js'); renderHallOfFame(user, profile);      break; }
    case 'admin':        { const { renderAdmin }        = await import('./pages/admin.js');        renderAdmin(user, profile);           break; }
  }
}
