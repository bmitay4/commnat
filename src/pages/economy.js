import i18n from '../i18n.js';
const t = (k, p) => i18n.t(k, p);
const localName = (item) => i18n.language === 'he' && item.name_he ? item.name_he : item.name;
import { renderPageTopbar, bindPageNav } from '../nav.js';
import { sb } from '../supabase.js';
import { formatTimeLeft } from '../utils.js';

const FACILITY_SVGS = {
  farm: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="36" width="48" height="20" rx="2" fill="#4a7a2a"/>
    <polygon points="32,10 8,36 56,36" fill="#6a3a18"/>
    <rect x="24" y="44" width="16" height="12" rx="1" fill="#8a5a28"/>
    <rect x="10" y="40" width="10" height="8" rx="1" fill="#5a9a3a" opacity="0.7"/>
    <rect x="44" y="40" width="10" height="8" rx="1" fill="#5a9a3a" opacity="0.7"/>
    <line x1="32" y1="10" x2="32" y2="6" stroke="#5a3a18" stroke-width="2"/>
    <circle cx="32" cy="5" r="3" fill="#e8c840"/>
  </svg>`,

  mine: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <rect x="16" y="30" width="32" height="26" rx="2" fill="#5a5a5a"/>
    <polygon points="32,8 12,30 52,30" fill="#4a4a4a"/>
    <rect x="26" y="40" width="12" height="16" rx="1" fill="#2a2a2a"/>
    <rect x="18" y="34" width="8" height="10" rx="1" fill="#888" opacity="0.5"/>
    <rect x="38" y="34" width="8" height="10" rx="1" fill="#888" opacity="0.5"/>
    <line x1="20" y1="22" x2="16" y2="14" stroke="#6a6a6a" stroke-width="2"/>
    <line x1="44" y1="22" x2="48" y2="14" stroke="#6a6a6a" stroke-width="2"/>
    <rect x="12" y="10" width="8" height="6" rx="1" fill="#7a7a7a"/>
    <rect x="44" y="10" width="8" height="6" rx="1" fill="#7a7a7a"/>
  </svg>`,

  oil_rig: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <line x1="20" y1="8" x2="20" y2="56" stroke="#5a5a6a" stroke-width="3"/>
    <line x1="44" y1="8" x2="44" y2="56" stroke="#5a5a6a" stroke-width="3"/>
    <line x1="20" y1="8" x2="44" y2="8" stroke="#5a5a6a" stroke-width="2"/>
    <line x1="20" y1="20" x2="44" y2="20" stroke="#5a5a6a" stroke-width="2"/>
    <line x1="20" y1="32" x2="44" y2="32" stroke="#5a5a6a" stroke-width="2"/>
    <line x1="20" y1="44" x2="44" y2="44" stroke="#5a5a6a" stroke-width="2"/>
    <rect x="14" y="48" width="36" height="10" rx="2" fill="#4a4a5a"/>
    <rect x="28" y="4" width="8" height="10" rx="1" fill="#e08030"/>
    <ellipse cx="32" cy="4" rx="5" ry="3" fill="#e0a040" opacity="0.7"/>
  </svg>`,

  factory: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="30" width="52" height="26" rx="2" fill="#5a5a6a"/>
    <polygon points="6,30 6,46 22,38 22,46 38,38 38,46 54,38 54,30" fill="#4a4a5a"/>
    <rect x="10" y="10" width="12" height="22" rx="1" fill="#4a4a5a"/>
    <rect x="26" y="16" width="10" height="16" rx="1" fill="#4a4a5a"/>
    <rect x="8" y="38" width="8" height="10" rx="1" fill="#3a8aaa" opacity="0.6"/>
    <rect x="28" y="38" width="8" height="10" rx="1" fill="#3a8aaa" opacity="0.6"/>
    <rect x="48" y="38" width="8" height="10" rx="1" fill="#3a8aaa" opacity="0.6"/>
    <ellipse cx="16" cy="10" rx="4" ry="3" fill="#888" opacity="0.5"/>
    <ellipse cx="31" cy="16" rx="3" ry="2" fill="#888" opacity="0.5"/>
  </svg>`,

  power_plant: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="28" width="44" height="28" rx="2" fill="#4a5a4a"/>
    <rect x="18" y="14" width="12" height="16" rx="4" fill="#6a7a6a"/>
    <rect x="34" y="18" width="12" height="12" rx="4" fill="#6a7a6a"/>
    <ellipse cx="24" cy="14" rx="8" ry="4" fill="#8a9a8a" opacity="0.5"/>
    <ellipse cx="40" cy="18" rx="8" ry="4" fill="#8a9a8a" opacity="0.5"/>
    <polygon points="32,34 26,44 30,44 28,54 38,42 34,42" fill="#e8c840"/>
    <rect x="14" y="36" width="8" height="6" rx="1" fill="#3a6a3a" opacity="0.6"/>
    <rect x="42" y="36" width="8" height="6" rx="1" fill="#3a6a3a" opacity="0.6"/>
  </svg>`,

  port: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="44" width="56" height="14" rx="2" fill="#2a5a8a"/>
    <polygon points="8,44 12,28 52,28 56,44" fill="#3a6a9a" opacity="0.5"/>
    <rect x="18" y="20" width="28" height="12" rx="2" fill="#e8e8d8"/>
    <rect x="22" y="10" width="4" height="12" fill="#aaa"/>
    <rect x="34" y="12" width="4" height="10" fill="#aaa"/>
    <rect x="22" y="6" width="16" height="6" rx="1" fill="#e8c040" opacity="0.8"/>
    <rect x="14" y="30" width="8" height="5" rx="1" fill="#3a8aaa" opacity="0.5"/>
    <rect x="42" y="30" width="8" height="5" rx="1" fill="#3a8aaa" opacity="0.5"/>
    <line x1="4" y1="44" x2="60" y2="44" stroke="#1a4a7a" stroke-width="2"/>
  </svg>`,

  tech_lab: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="24" width="44" height="32" rx="3" fill="#3a3a5a"/>
    <rect x="16" y="30" width="10" height="16" rx="2" fill="#4a7aaa" opacity="0.7"/>
    <rect x="30" y="28" width="10" height="18" rx="2" fill="#7a4aaa" opacity="0.7"/>
    <rect x="44" y="32" width="8" height="14" rx="2" fill="#4aaa7a" opacity="0.7"/>
    <rect x="14" y="18" width="36" height="8" rx="2" fill="#2a2a4a"/>
    <circle cx="22" cy="14" r="4" fill="#4a7aaa" opacity="0.6"/>
    <circle cx="32" cy="12" r="5" fill="#7a4aaa" opacity="0.6"/>
    <circle cx="42" cy="14" r="4" fill="#4aaa7a" opacity="0.6"/>
    <line x1="22" y1="18" x2="22" y2="30" stroke="#4a7aaa" stroke-width="1" opacity="0.4"/>
    <line x1="35" y1="18" x2="35" y2="28" stroke="#7a4aaa" stroke-width="1" opacity="0.4"/>
  </svg>`,

  bank: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="48" width="48" height="8" rx="2" fill="#8a6a20"/>
    <rect x="12" y="28" width="40" height="20" rx="1" fill="#c8a840"/>
    <rect x="8" y="24" width="48" height="6" rx="1" fill="#a88828"/>
    <line x1="16" y1="28" x2="16" y2="48" stroke="#a88828" stroke-width="2"/>
    <line x1="24" y1="28" x2="24" y2="48" stroke="#a88828" stroke-width="2"/>
    <line x1="32" y1="28" x2="32" y2="48" stroke="#a88828" stroke-width="2"/>
    <line x1="40" y1="28" x2="40" y2="48" stroke="#a88828" stroke-width="2"/>
    <line x1="48" y1="28" x2="48" y2="48" stroke="#a88828" stroke-width="2"/>
    <polygon points="32,8 10,24 54,24" fill="#b89030"/>
    <rect x="28" y="15" width="8" height="10" rx="1" fill="#c8a840" opacity="0.5"/>
  </svg>`,

  market: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="28" width="48" height="28" rx="2" fill="#2a2a3a"/>
    <rect x="12" y="18" width="40" height="12" rx="2" fill="#3a2a4a"/>
    <rect x="8" y="14" width="20" height="8" rx="2" fill="#4a3a5a"/>
    <rect x="36" y="14" width="20" height="8" rx="2" fill="#4a3a5a"/>
    <rect x="20" y="36" width="12" height="16" rx="1" fill="#1a1a2a"/>
    <rect x="36" y="36" width="10" height="10" rx="1" fill="#5a3a2a" opacity="0.6"/>
    <circle cx="42" cy="24" r="4" fill="#e8c840" opacity="0.7"/>
    <circle cx="22" cy="24" r="3" fill="#e84040" opacity="0.6"/>
    <line x1="8" y1="28" x2="56" y2="28" stroke="#1a1a2a" stroke-width="2"/>
  </svg>`,

  solar: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <polygon points="8,48 56,48 50,28 14,28" fill="#2a5a8a"/>
    <line x1="20" y1="28" x2="20" y2="48" stroke="#1a4a7a" stroke-width="1"/>
    <line x1="30" y1="28" x2="30" y2="48" stroke="#1a4a7a" stroke-width="1"/>
    <line x1="40" y1="28" x2="40" y2="48" stroke="#1a4a7a" stroke-width="1"/>
    <line x1="50" y1="28" x2="50" y2="48" stroke="#1a4a7a" stroke-width="1"/>
    <line x1="12" y1="36" x2="52" y2="36" stroke="#1a4a7a" stroke-width="1"/>
    <circle cx="32" cy="14" r="8" fill="#e8c040"/>
    <line x1="32" y1="4" x2="32" y2="1" stroke="#e8c040" stroke-width="2"/>
    <line x1="44" y1="8" x2="46" y2="6" stroke="#e8c040" stroke-width="2"/>
    <line x1="48" y1="14" x2="51" y2="14" stroke="#e8c040" stroke-width="2"/>
    <line x1="20" y1="8" x2="18" y2="6" stroke="#e8c040" stroke-width="2"/>
    <line x1="16" y1="14" x2="13" y2="14" stroke="#e8c040" stroke-width="2"/>
    <rect x="28" y="48" width="8" height="8" rx="1" fill="#3a5a3a"/>
  </svg>`,

  airport: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="44" width="56" height="12" rx="2" fill="#5a5a6a"/>
    <line x1="4" y1="50" x2="60" y2="50" stroke="#ffffff" stroke-width="1" stroke-dasharray="6,4" opacity="0.4"/>
    <rect x="18" y="28" width="28" height="18" rx="2" fill="#4a5a6a"/>
    <rect x="22" y="22" width="20" height="8" rx="2" fill="#3a4a5a"/>
    <rect x="26" y="18" width="12" height="6" rx="1" fill="#2a3a4a"/>
    <rect x="20" y="32" width="8" height="6" rx="1" fill="#4a8aaa" opacity="0.6"/>
    <rect x="36" y="32" width="8" height="6" rx="1" fill="#4a8aaa" opacity="0.6"/>
    <polygon points="32,36 20,42 20,44 32,40 44,44 44,42" fill="#8a8a9a"/>
    <polygon points="32,36 32,30 26,36" fill="#7a7a8a"/>
    <polygon points="32,36 32,30 38,36" fill="#7a7a8a"/>
  </svg>`,
};

export async function renderEconomy(user, profile, nation) {
  const app = document.getElementById('app');
  app.innerHTML = `<div class="page"><div style="font-family:var(--font-mono);font-size:13px;color:var(--text-muted);letter-spacing:2px;">${t('economy.loading')}</div></div>`;

  const [
    { data: facilityTypes },
    { data: facilities },
    { data: incomeLogs },
  ] = await Promise.all([
    sb.from('facility_types').select('*').order('sort_order'),
    sb.from('facilities').select('*').eq('nation_id', nation.id),
    sb.from('income_logs').select('*').eq('nation_id', nation.id)
      .order('logged_at', { ascending: false }).limit(6),
  ]);

  const facMap = Object.fromEntries((facilities || []).map(f => [f.facility_type_id, f.quantity]));

  // Compute totals
  let totalIncome = 0, totalUpkeep = 0, landUsed = 0;
  (facilityTypes || []).forEach(ft => {
    const qty = facMap[ft.id] || 0;
    totalIncome += qty * ft.income_per_hour;
    totalUpkeep += qty * ft.maintenance_per_hour;
    landUsed    += qty * ft.land_required;
  });
  const netIncome = totalIncome - totalUpkeep;
  const landFree = nation.land - landUsed;

  // Next income countdown
  const nextIncomeMs = new Date(nation.last_income_at).getTime() + 3600000 - Date.now();

  app.innerHTML = `
    ${renderPageTopbar(user, profile, nation, 'economy')}
    <div class="inner-page-wide">

      <!-- Page title -->
      <div class="inner-topbar">
        <div class="inner-title-wrap">
          <span style="font-size:24px;">🏭</span>
          <div>
            <div class="inner-title">${t('economy.title')}</div>
            <div class="inner-sub">${nation.name}</div>
          </div>
        </div>
      </div>

      <!-- Stats bar -->
      <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:1.2rem;">
        ${eStat('💰', t('economy.treasury'),    '$' + nation.money.toLocaleString(),   'var(--accent)')}
        ${eStat('📈', t('economy.incomeHr'),   '+$' + totalIncome.toLocaleString(),   '#16a34a')}
        ${eStat('🔧', t('economy.upkeepHr'),   '-$' + totalUpkeep.toLocaleString(),  '#e05252')}
        ${eStat('💵', t('economy.netHr'),      (netIncome >= 0 ? '+' : '') + '$' + netIncome.toLocaleString(), netIncome >= 0 ? '#16a34a' : '#e05252')}
        ${eStat('🗺️', t('economy.land'),        `${landUsed}/${nation.land} used`,    landFree <= 5 ? '#e05252' : 'var(--text-muted)')}
      </div>

      <!-- Income countdown -->
      <div style="background:var(--surface);border:1.5px solid var(--border);
        border-inline-start:3px solid #16a34a;border-radius:0 8px 8px 0;padding:10px 1.5rem;
        margin-bottom:1.2rem;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
        <div style="font-family:var(--font-mono);font-size:12px;color:var(--text-muted);">
          ${t('economy.nextIncome')} <strong id="income-countdown" style="color:#16a34a;font-size:15px;">--:--</strong>
        </div>
        <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-muted);">
          ${t('economy.projected')} <strong style="color:#16a34a;">+$${netIncome.toLocaleString()}</strong> net
          &nbsp;·&nbsp;
          ${t('economy.securityBonus')} <strong style="color:var(--accent);">${getSecurityLabel(nation.security_index)}</strong>
        </div>
      </div>

      <!-- Order bar -->
      <div id="order-bar" style="display:none;width:100%;max-width:1000px;background:rgba(22,163,74,0.06);
        border:1.5px solid rgba(22,163,74,0.3);border-radius:8px;padding:10px 1.5rem;
        margin-bottom:1rem;display:none;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
        <div style="font-family:var(--font-mono);font-size:12px;color:var(--text-muted);">
          ${t('economy.buildCost')}: <strong id="order-total" style="color:#16a34a;font-size:15px;">$0</strong>
          &nbsp;·&nbsp; ${t('economy.orderLand')}: <strong id="order-land" style="color:var(--accent);">0</strong>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="btn-logout" id="btn-clear-order" style="font-size:11px;padding:6px 12px;">${t('economy.clearBtn')}</button>
          <button class="btn-submit" id="btn-build-all"
            style="width:auto;padding:8px 20px;font-size:14px;letter-spacing:1px;border-radius:6px;background:#16a34a;">
            Build All
          </button>
        </div>
      </div>

      <!-- Facilities table -->
      <div style="background:var(--surface);border:1.5px solid var(--border);border-radius:8px;overflow:hidden;margin-bottom:1rem;">
        <table style="width:100%;border-collapse:collapse;">
          <colgroup>
            <col style="width:56px">
            <col style="min-width:140px">
            <col style="width:80px">
            <col style="width:90px">
            <col style="width:90px">
            <col style="width:70px">
            <col style="width:80px">
            <col style="width:90px">
            <col style="width:60px">
          </colgroup>
          <thead>
            <tr style="background:var(--surface2);border-bottom:1.5px solid var(--border);">
              <th style="${thStyle()}"></th>
              <th style="${thStyle()}text-align:start;">${t('economy.facility')}</th>
              <th style="${thStyle()}">${t('economy.incomeCol')}</th>
              <th style="${thStyle()}">${t('economy.upkeepCol')}</th>
              <th style="${thStyle()}">${t('economy.buildCostCol')}</th>
              <th style="${thStyle()}">${t('economy.landCol')}</th>
              <th style="${thStyle()}">${t('economy.ownedCol')}</th>
              <th style="${thStyle()}">${t('economy.buildQtyCol')}</th>
              <th style="${thStyle()}"></th>
            </tr>
          </thead>
          <tbody>
            ${(facilityTypes || []).map(ft => facilityRow(ft, facMap[ft.id] || 0)).join('')}
          </tbody>
        </table>
      </div>

      <!-- Build result -->
      <div class="msg" id="build-msg" style="margin-bottom:1rem;"></div>

      <!-- Demolish section -->
      <div style="background:var(--surface);border:1.5px solid var(--border);border-radius:8px;padding:1.2rem 1.5rem;margin-bottom:1rem;">
        <div style="font-family:var(--font-title);font-size:16px;letter-spacing:2px;color:var(--text-muted);margin-bottom:0.8rem;">${t('economy.demolishTitle')}</div>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
          <select id="demo-type" style="background:var(--surface2);border:1.5px solid var(--border);border-radius:6px;
            color:var(--text);font-family:var(--font-mono);font-size:13px;padding:8px 10px;outline:none;flex:1;min-width:160px;">
            <option value="">Select facility...</option>
            ${(facilityTypes||[]).filter(ft=>(facMap[ft.id]||0)>0).map(ft=>
              `<option value="${ft.id}">${localName(ft)} (owned: ${facMap[ft.id]||0})</option>`
            ).join('')}
          </select>
          <input type="number" id="demo-amount" placeholder="Qty" min="1"
            style="width:90px;background:var(--surface2);border:1.5px solid var(--border);border-radius:6px;
            color:var(--text);font-family:var(--font-mono);font-size:13px;padding:8px 10px;outline:none;"/>
          <button class="btn-logout" id="btn-demolish" style="padding:8px 16px;font-size:12px;">${t('economy.demolishBtn')}</button>
        </div>
        <div class="msg" id="demo-msg" style="margin-top:8px;"></div>
      </div>

      <!-- Income history -->
      ${incomeLogs?.length ? `
        <div style="background:var(--surface);border:1.5px solid var(--border);
          border-radius:8px;padding:1.2rem 1.5rem;margin-bottom:1rem;">
          <div style="font-family:var(--font-title);font-size:15px;letter-spacing:2px;color:var(--text-muted);margin-bottom:0.8rem;">${t('economy.recentIncome')}</div>
          <table style="width:100%;border-collapse:collapse;font-family:var(--font-mono);font-size:11px;">
            <thead><tr style="border-bottom:1px solid var(--border);">
              <th style="padding:5px 8px;color:var(--text-muted);text-align:start;font-weight:400;">${t('economy.time')}</th>
              <th style="padding:5px 8px;color:#16a34a;text-align:center;">${t('economy.income')}</th>
              <th style="padding:5px 8px;color:#e05252;text-align:center;">${t('economy.upkeep')}</th>
              <th style="padding:5px 8px;color:var(--accent);text-align:center;">${t('economy.net')}</th>
              <th style="padding:5px 8px;color:var(--text-muted);text-align:end;">${t('economy.balance')}</th>
            </tr></thead>
            <tbody>
              ${incomeLogs.map(l=>`
                <tr style="border-bottom:1px solid var(--border-dim);">
                  <td style="padding:5px 8px;color:var(--text-muted);">${new Date(l.logged_at).toLocaleString()}</td>
                  <td style="padding:5px 8px;color:#16a34a;text-align:center;">+$${l.total_income.toLocaleString()}</td>
                  <td style="padding:5px 8px;color:#e05252;text-align:center;">-$${l.total_upkeep.toLocaleString()}</td>
                  <td style="padding:5px 8px;text-align:center;color:${l.net_income>=0?'#16a34a':'#e05252'};">
                    ${l.net_income>=0?'+':''}$${l.net_income.toLocaleString()}
                  </td>
                  <td style="padding:5px 8px;color:var(--accent);text-align:end;">$${l.money_after.toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}

    </div>
  `;

  startIncomeCountdown(nation.last_income_at, user, profile, nation);
  bindEconomyEvents(user, profile, nation, facMap, facilityTypes, landFree);
}

// ─── Facility row ─────────────────────────────────────────────────────────────

function facilityRow(ft, owned) {
  const svg = FACILITY_SVGS[ft.id] || '';
  const net = ft.income_per_hour - ft.maintenance_per_hour;
  return `
    <tr class="fac-row" data-id="${ft.id}"
      style="border-bottom:1px solid var(--border-dim);transition:background 0.15s;"
      onmouseenter="this.style.background='var(--surface2)'"
      onmouseleave="this.style.background=''">
      <td style="padding:8px;text-align:center;">
        <div style="width:44px;height:44px;margin:0 auto;background:var(--surface2);border-radius:6px;
          overflow:hidden;padding:4px;border:1px solid var(--border);">${svg}</div>
      </td>
      <td style="padding:8px;">
        <div style="font-family:var(--font-title);font-size:14px;letter-spacing:1px;color:var(--text);">${localName(ft).toUpperCase()}</div>
        <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted);margin-top:1px;">${ft.description || ''}</div>
      </td>
      <td style="padding:8px;text-align:center;font-family:var(--font-mono);font-size:12px;color:#16a34a;font-weight:700;">
        +$${ft.income_per_hour.toLocaleString()}
      </td>
      <td style="padding:8px;text-align:center;font-family:var(--font-mono);font-size:12px;color:#e05252;">
        -$${ft.maintenance_per_hour.toLocaleString()}
      </td>
      <td style="padding:8px;text-align:center;font-family:var(--font-mono);font-size:12px;color:var(--accent);">
        $${ft.build_cost.toLocaleString()}
      </td>
      <td style="padding:8px;text-align:center;font-family:var(--font-mono);font-size:12px;color:var(--text-muted);">
        ${ft.land_required} 🗺️
      </td>
      <td style="padding:8px;text-align:center;font-family:var(--font-title);font-size:16px;
        color:${owned > 0 ? '#16a34a' : 'var(--text-muted)'};">
        ${owned}
      </td>
      <td style="padding:8px;text-align:center;">
        <input type="number" class="fac-qty" data-id="${ft.id}"
          data-cost="${ft.build_cost}" data-land="${ft.land_required}" data-name="${ft.name}"
          placeholder="0" min="0"
          style="width:65px;background:var(--surface2);border:1.5px solid var(--border);border-radius:5px;
          color:var(--text);font-family:var(--font-mono);font-size:12px;padding:5px 6px;outline:none;text-align:center;"
          oninput="updateEconOrder()" />
      </td>
      <td style="padding:8px;text-align:center;font-family:var(--font-mono);font-size:11px;color:#16a34a;"
        id="fac-row-total-${ft.id}"></td>
    </tr>
  `;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function eStat(icon, label, value, color) {
  return `
    <div style="background:var(--surface);border:1.5px solid var(--border);border-radius:8px;padding:0.8rem;text-align:center;">
      <div style="font-size:16px;margin-bottom:2px;">${icon}</div>
      <div style="font-family:var(--font-title);font-size:18px;letter-spacing:1px;color:${color};">${value}</div>
      <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted);letter-spacing:1px;text-transform:uppercase;">${label}</div>
    </div>
  `;
}

function thStyle() {
  return 'padding:8px;font-family:var(--font-mono);font-size:9px;color:var(--text-muted);letter-spacing:1.5px;text-transform:uppercase;text-align:center;';
}

function getSecurityLabel(idx) {
  if (idx >= 80) return '100% (full income)';
  if (idx >= 50) return `${idx}% (reduced)`;
  return '40% (critical)';
}

function showMsg(id, type, text) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.className = 'msg ' + type + ' show';
  if (type === 'success') setTimeout(() => el.className = 'msg', 4000);
}

function startIncomeCountdown(lastIncomeAt, user, profile, nation) {
  const el = document.getElementById('income-countdown');
  if (!el) return;
  let wasOverdue = false;
  function update() {
    if (!document.getElementById('income-countdown')) return;
    const diff = new Date(lastIncomeAt).getTime() + 3600000 - Date.now();
    if (diff <= 0) {
      el.textContent = t('economy.collecting');
      el.style.color = '#16a34a';
      // Poll DB every 5s until last_income_at changes (collection happened)
      if (!wasOverdue) wasOverdue = true;
      setTimeout(async () => {
        if (!document.getElementById('income-countdown')) return;
        const { data } = await sb.from('nations').select('last_income_at').eq('id', nation.id).single();
        if (data && data.last_income_at !== lastIncomeAt) {
          // Income collected — reload the economy page
          const { renderEconomy } = await import('./economy.js');
          renderEconomy(user, profile, { ...nation, last_income_at: data.last_income_at });
        } else {
          update();
        }
      }, 5000);
      return;
    }
    const m = Math.floor(diff / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    el.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    setTimeout(update, 1000);
  }
  update();
}

// Global order updater
window.updateEconOrder = function() {
  let total = 0, land = 0, count = 0;
  document.querySelectorAll('.fac-qty').forEach(input => {
    const qty = parseInt(input.value) || 0;
    const cost = parseInt(input.getAttribute('data-cost')) || 0;
    const landReq = parseInt(input.getAttribute('data-land')) || 0;
    const lineCost = qty * cost;
    const lineLand = qty * landReq;
    total += lineCost;
    land  += lineLand;
    if (qty > 0) count++;
    const rowTotal = document.getElementById('fac-row-total-' + input.getAttribute('data-id'));
    if (rowTotal) {
      rowTotal.textContent = qty > 0 ? '$' + lineCost.toLocaleString() : '';
    }
  });

  const bar = document.getElementById('order-bar');
  const totalEl = document.getElementById('order-total');
  const landEl  = document.getElementById('order-land');
  if (bar) bar.style.display = total > 0 ? 'flex' : 'none';
  if (totalEl) totalEl.textContent = '$' + total.toLocaleString();
  if (landEl)  landEl.textContent  = land;
};

// ─── Events ───────────────────────────────────────────────────────────────────

function bindEconomyEvents(user, profile, nation, facMap, facilityTypes, landFree) {
  bindPageNav(user, profile, nation);

  // Clear order
  document.getElementById('btn-clear-order')?.addEventListener('click', () => {
    document.querySelectorAll('.fac-qty').forEach(i => i.value = '');
    document.querySelectorAll('[id^="fac-row-total-"]').forEach(el => el.textContent = '');
    window.updateEconOrder();
  });

  // Build All
  document.getElementById('btn-build-all')?.addEventListener('click', async () => {
    const orders = [];
    let grandCost = 0, grandLand = 0;

    document.querySelectorAll('.fac-qty').forEach(input => {
      const qty = parseInt(input.value) || 0;
      if (qty <= 0) return;
      const id   = input.getAttribute('data-id');
      const cost = parseInt(input.getAttribute('data-cost'));
      const land = parseInt(input.getAttribute('data-land'));
      const name = input.getAttribute('data-name');
      orders.push({ id, qty, cost, land, name, lineCost: qty * cost, lineLand: qty * land });
      grandCost += qty * cost;
      grandLand += qty * land;
    });

    if (!orders.length) return;

    if (grandCost > nation.money) {
      showMsg('build-msg', 'error', `${t('economy.errExceedsTreasury',{total:grandCost.toLocaleString(),balance:nation.money.toLocaleString()})}`);
      return;
    }
    if (grandLand > landFree) {
      showMsg('build-msg', 'error', t('economy.errNotEnoughLand',{need:grandLand,have:landFree}));
      return;
    }

    const btn = document.getElementById('btn-build-all');
    btn.disabled = true; btn.textContent = t('economy.building');

    let failed = false;
    for (const order of orders) {
      const current = facMap[order.id] || 0;
      const { error } = await sb.from('facilities').upsert({
        nation_id: nation.id,
        facility_type_id: order.id,
        quantity: current + order.qty,
      }, { onConflict: 'nation_id,facility_type_id' });
      if (error) { showMsg('build-msg', 'error', error.message); failed = true; break; }
      facMap[order.id] = current + order.qty;
    }

    if (!failed) {
      await sb.from('nations').update({ money: nation.money - grandCost }).eq('id', nation.id);
      try {
        await sb.from('activity_logs').insert({
          user_id: user.id, nation_id: nation.id, action: 'build_facilities',
          details: { orders: orders.map(o => ({ id: o.id, qty: o.qty })), total: grandCost },
        });
      } catch (_) {}
      const summary = orders.map(o => `${o.qty}× ${o.name}`).join(', ');
      showMsg('build-msg', 'success', t('economy.buildSuccess',{summary,cost:grandCost.toLocaleString()}));
      nation.money -= grandCost;
      setTimeout(() => renderEconomy(user, profile, { ...nation }), 1500);
    }

    btn.disabled = false; btn.textContent = t('economy.buildAllBtn');
  });

  // Demolish
  document.getElementById('btn-demolish')?.addEventListener('click', async () => {
    const typeId = document.getElementById('demo-type').value;
    const qty    = parseInt(document.getElementById('demo-amount').value);
    if (!typeId) { showMsg('demo-msg', 'error', t('economy.selectFacility')); return; }
    if (!qty || qty < 1) { showMsg('demo-msg', 'error', t('military.errEnterQty')); return; }
    const owned = facMap[typeId] || 0;
    if (qty > owned) { showMsg('demo-msg', 'error', t('economy.errOnlyOwned',{count:owned})); return; }
    const ft = facilityTypes.find(f => f.id === typeId);
    const refund = Math.floor(qty * ft.build_cost * 0.3);
    if (!confirm(`Demolish ${qty}× ${ft.name}? You'll receive $${refund.toLocaleString()} (30% refund).`)) return;

    const newQty = owned - qty;
    const { error } = newQty > 0
      ? await sb.from('facilities').update({ quantity: newQty })
          .eq('nation_id', nation.id).eq('facility_type_id', typeId)
      : await sb.from('facilities').delete()
          .eq('nation_id', nation.id).eq('facility_type_id', typeId);

    if (!error) {
      await sb.from('nations').update({ money: nation.money + refund }).eq('id', nation.id);
      showMsg('demo-msg', 'success', t('economy.demolishSuccess',{qty,name:localName(ft),refund:refund.toLocaleString()}));
      setTimeout(() => renderEconomy(user, profile, { ...nation, money: nation.money + refund }), 1500);
    } else {
      showMsg('demo-msg', 'error', error.message);
    }
  });
}
