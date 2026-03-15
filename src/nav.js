import i18n from './i18n.js';
import { sb } from './supabase.js';

const NAV_PAGES = [
  { id: 'dashboard', label: '🏛️ Dashboard' },
  { id: 'military',  label: '⚔️ Military' },
  { id: 'economy',   label: '🏭 Economy' },
  { id: 'attacks',   label: '💥 Attack' },
  { id: 'alliances',    label: '🤝 Alliances' },
  { id: 'intelligence', label: '🔍 Intel' },
  { id: 'rankings',     label: '📊 Rankings' },
  { id: 'hof',       label: '🏆 Hall of Fame' },
];

export function renderPageTopbar(user, profile, nation, activePage) {
  return `
    <div style="
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
        ${NAV_PAGES.map(p => `
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

      <!-- Right: utility only (lang, admin, sign out) -->
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
        ${profile?.is_admin ? `
          <button data-page="admin" style="
            background:none;border:1.5px solid var(--border);border-radius:var(--radius-sm);
            color:var(--text-muted);font-family:var(--font-body);font-size:12px;font-weight:600;
            padding:5px 10px;cursor:pointer;transition:all 0.15s;white-space:nowrap;
          ">⚙️ Admin</button>
        ` : ''}
        <button id="btn-signout" style="
          background:none;border:1.5px solid var(--border);border-radius:var(--radius-sm);
          color:var(--text-muted);font-family:var(--font-body);font-size:12px;font-weight:600;
          padding:5px 10px;cursor:pointer;transition:all 0.15s;white-space:nowrap;
        ">Sign out</button>
      </div>
    </div>
  `;
}

export function bindPageNav(user, profile, nation) {
  document.querySelectorAll('[data-page]').forEach(el => {
    el.addEventListener('click', () => _navigate(el.getAttribute('data-page'), user, profile, nation));
  });

  document.getElementById('btn-signout')?.addEventListener('click', () => sb.auth.signOut());

  document.querySelectorAll('[data-lang]').forEach(btn => {
    btn.addEventListener('click', () => {
      i18n.changeLanguage(btn.getAttribute('data-lang'));
      document.querySelectorAll('.lang-btn-light').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-lang') === btn.getAttribute('data-lang'));
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

  switch (page) {
    case 'intelligence':{ const { renderIntelligence } = await import('./pages/intelligence.js'); renderIntelligence(user, profile, n); break; }
    case 'alliances': { const { renderAlliances }  = await import('./pages/alliances.js'); renderAlliances(user, profile, n);    break; }
    case 'dashboard': { const { renderDashboard }  = await import('./pages/dashboard.js');  renderDashboard(user, profile);       break; }
    case 'military':  { const { renderMilitary }   = await import('./pages/military.js');   renderMilitary(user, profile, n);     break; }
    case 'economy':   { const { renderEconomy }    = await import('./pages/economy.js');    renderEconomy(user, profile, n);      break; }
    case 'attacks':   { const { renderAttacks }    = await import('./pages/attacks.js');    renderAttacks(user, profile, n);      break; }
    case 'rankings':  { const { renderRankings }   = await import('./pages/rankings.js');   renderRankings(user, profile, n);     break; }
    case 'hof':       { const { renderHallOfFame } = await import('./pages/hall-of-fame.js'); renderHallOfFame(user, profile);    break; }
    case 'admin':     { const { renderAdmin }      = await import('./pages/admin.js');      renderAdmin(user, profile);           break; }
  }
}
