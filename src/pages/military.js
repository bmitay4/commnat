import i18n from '../i18n.js';
const t = (k, p) => i18n.t(k, p);
import { sb } from '../supabase.js';
import { UNIT_SVGS } from '../unit-svgs.js';
import { renderPageTopbar, bindPageNav } from '../nav.js';

const MAX_LEVEL = 50;
const HIDDEN_PURCHASE_EQUIPMENT_IDS = new Set(['carrier']);
const localName = (item) => i18n.language === 'he' && item.name_he ? item.name_he : item.name;

function upgradeCost(eq, currentLevel) {
  return Math.floor(eq.cost_each * currentLevel * (eq.upgrade_cost_multiplier ?? 0.5));
}
function effectivePower(base, level) {
  return Math.round(base * (1 + (level - 1) * 0.06));
}

function categoryLabel(catId) {
  const map = {
    ground:  t('military.groundForces'),
    air:     t('military.airForce'),
    naval:   t('military.naval'),
    missile: t('military.missiles'),
    defense: t('military.defenseSystems'),
  };
  return map[catId] || catId;
}

export async function renderMilitary(user, profile, nation) {
  const app = document.getElementById('app');
  app.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-size:13px;color:var(--text-muted);font-family:var(--font-body);">${t('military.loading')}</div>`;

  const [
    { data: equipTypes },
    { data: inventory },
    { data: maintenanceLogs },
  ] = await Promise.all([
    sb.from('equipment_types').select('*').order('sort_order'),
    sb.from('military_units').select('*').eq('nation_id', nation.id),
    sb.from('maintenance_logs').select('*').eq('nation_id', nation.id)
      .order('logged_at', { ascending: false }).limit(5),
  ]);

  const invMap = Object.fromEntries(
    (inventory || []).map(i => [i.equipment_id, { quantity: i.quantity, level: i.level || 1, id: i.id }])
  );

  let totalAttack = 0, totalDefense = 0, totalMaint = 0;
  (equipTypes || []).forEach(et => {
    const inv = invMap[et.id];
    if (!inv) return;
    totalAttack  += inv.quantity * effectivePower(et.attack_power,  inv.level);
    totalDefense += inv.quantity * effectivePower(et.defense_power, inv.level);
    totalMaint   += inv.quantity * et.maintenance_per_2h;
  });

  const categories = ['ground','air','naval','missile','defense'];

  app.innerHTML = `
    ${renderPageTopbar(user, profile, nation, 'military')}
    <div class="inner-page-wide">

      <div class="inner-topbar">
        <div class="inner-title-wrap">
          <span style="font-size:24px;">⚔️</span>
          <div>
            <div class="inner-title">${t('military.title')}</div>
            <div class="inner-sub">${nation.name}</div>
          </div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:1.2rem;">
        ${mStat('👥', t('military.soldiers'),    nation.soldiers.toLocaleString(),   'var(--accent)')}
        ${mStat('⚔️', t('military.attack'),      totalAttack.toLocaleString(),       '#e05252')}
        ${mStat('🛡️', t('military.defense'),     totalDefense.toLocaleString(),      '#3b82f6')}
        ${mStat('💰', t('military.treasury'),    '$'+nation.money.toLocaleString(),  'var(--accent)')}
        ${mStat('🔧', t('military.maintenance'), '-$'+totalMaint.toLocaleString(),   totalMaint > nation.money ? '#e05252' : 'var(--text-muted)')}
      </div>

      <div style="background:var(--surface);border:1.5px solid var(--border);border-top:3px solid var(--accent);border-radius:8px;padding:1.2rem 1.5rem;margin-bottom:1rem;">
        <div style="font-family:var(--font-title);font-size:17px;letter-spacing:2px;color:var(--text);margin-bottom:1rem;">👥 ${t('military.draftTitle')}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;align-items:center;">
          <div>
            <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-muted);letter-spacing:1px;margin-bottom:5px;">
              ${t('military.draftRate')}: <strong id="draft-pct-label" style="color:var(--accent);">${nation.draft_percent}%</strong>
              &nbsp;→&nbsp; max <strong id="draft-count" style="color:var(--accent);">${Math.floor(nation.population*nation.draft_percent/100).toLocaleString()}</strong> ${t('military.soldiers')}
            </div>
            <input type="range" id="draft-slider" min="5" max="40" step="1" value="${nation.draft_percent}" style="width:100%;accent-color:var(--accent);"/>
            <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);margin-top:3px;">${t('military.draftCost')}</div>
            <div id="draft-security-warning" style="font-family:var(--font-mono);font-size:10px;color:#e05252;margin-top:4px;font-weight:700;display:${nation.draft_percent > 20 ? 'block' : 'none'};">
              ${nation.draft_percent > 20 ? t('military.draftSecWarning', { pct: nation.draft_percent, drain: (nation.draft_percent * 0.3).toFixed(1) }) : ''}
            </div>
            <div id="draft-cap-warning" style="font-family:var(--font-mono);font-size:10px;color:#f59e0b;margin-top:4px;font-weight:700;display:${nation.soldiers >= Math.floor(nation.population * nation.draft_percent / 100) ? 'block' : 'none'};">
              ${nation.soldiers >= Math.floor(nation.population * nation.draft_percent / 100) ? t('military.draftAtCap', { soldiers: nation.soldiers.toLocaleString(), max: Math.floor(nation.population * nation.draft_percent / 100).toLocaleString() }) : ''}
            </div>
          </div>
          <div style="display:flex;gap:8px;align-items:center;">
            <input type="number" id="draft-amount" min="1"
              value="${Math.max(0, Math.floor(nation.population * nation.draft_percent / 100) - nation.soldiers)}"
              style="flex:1;background:var(--surface2);border:1.5px solid var(--border);border-radius:6px;color:var(--text);font-family:var(--font-mono);font-size:13px;padding:8px 10px;outline:none;"/>
            <button class="btn-submit" id="btn-draft" style="width:auto;padding:8px 14px;font-size:13px;letter-spacing:1px;border-radius:6px;">${t('military.draftBtn')}</button>
            <button class="btn-logout" id="btn-demob" style="font-size:11px;padding:8px 12px;white-space:nowrap;">${t('military.demobBtn')}</button>
          </div>
        </div>
        <div class="msg" id="draft-msg" style="margin-top:8px;"></div>
      </div>

      <div style="background:var(--surface);border:1.5px solid var(--border);border-radius:8px;overflow:hidden;margin-bottom:1rem;">
        <div id="order-bar" style="display:none;background:var(--accent-bg);border-bottom:1.5px solid var(--border);padding:10px 1.5rem;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
          <div style="font-family:var(--font-mono);font-size:12px;color:var(--text-muted);">
            ${t('military.orderTotal')}: <strong id="order-total" style="color:var(--accent);font-size:15px;">$0</strong>
            &nbsp;·&nbsp; ${t('military.items')}: <strong id="order-count" style="color:var(--accent);">0</strong>
          </div>
          <div style="display:flex;gap:8px;">
            <button class="btn-logout" id="btn-clear-order" style="font-size:11px;padding:6px 12px;">${t('military.clearBtn')}</button>
            <button class="btn-submit" id="btn-purchase-all" style="width:auto;padding:8px 20px;font-size:14px;letter-spacing:1px;border-radius:6px;">${t('military.purchaseAllBtn')}</button>
          </div>
        </div>

        ${categories.map(catId => {
          const items = (equipTypes||[]).filter(
            e => e.category === catId && !HIDDEN_PURCHASE_EQUIPMENT_IDS.has(e.id)
          );
          if (!items.length) return '';
          return `
            <div>
              <div style="font-family:var(--font-title);font-size:14px;letter-spacing:2px;color:var(--text-muted);padding:8px 1.5rem;background:var(--surface2);border-bottom:1px solid var(--border);">${categoryLabel(catId)}</div>
              <table style="width:100%;border-collapse:collapse;">
                <colgroup>
                  <col style="width:52px"><col style="min-width:130px"><col style="width:90px"><col style="width:90px">
                  <col style="width:70px"><col style="width:95px"><col style="width:75px"><col style="width:130px">
                  <col style="width:110px"><col style="width:90px"><col style="width:46px">
                </colgroup>
                <thead>
                  <tr style="border-bottom:1px solid var(--border);">
                    <th style="${th()}"></th>
                    <th style="${th()}text-align:start;">${t('military.unit')}</th>
                    <th style="${th()}">⚔️ ${t('military.atk')}</th>
                    <th style="${th()}">🛡️ ${t('military.def')}</th>
                    <th style="${th()}">${t('military.maint2h')}</th>
                    <th style="${th()}">${t('military.costEach')}</th>
                    <th style="${th()}">${t('military.owned')}</th>
                    <th style="${th()}">${t('military.level')}</th>
                    <th style="${th()}">${t('military.upgrade')}</th>
                    <th style="${th()}">${t('military.buyQty')}</th>
                    <th style="${th()}"></th>
                  </tr>
                </thead>
                <tbody>
                  ${items.map(eq => equipRow(eq, invMap[eq.id] || { quantity: 0, level: 1 }, nation.money)).join('')}
                </tbody>
              </table>
            </div>
          `;
        }).join('')}
      </div>

      <div class="msg" id="purchase-msg" style="margin-bottom:1rem;"></div>

      <div style="background:var(--surface);border:1.5px solid var(--border);border-radius:8px;padding:1.2rem 1.5rem;margin-bottom:1rem;">
        <div style="font-family:var(--font-title);font-size:16px;letter-spacing:2px;color:var(--text-muted);margin-bottom:0.8rem;">💸 ${t('military.sellTitle')}</div>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
          <select id="sell-type" style="background:var(--surface2);border:1.5px solid var(--border);border-radius:6px;color:var(--text);font-family:var(--font-mono);font-size:13px;padding:8px 10px;outline:none;flex:1;min-width:160px;">
            <option value="">${t('military.selectEquipment')}</option>
            ${(equipTypes||[]).filter(e=>(invMap[e.id]?.quantity||0)>0).map(e=>
              `<option value="${e.id}">${localName(e)} (${t('military.owned').toLowerCase()}: ${(invMap[e.id]?.quantity||0).toLocaleString()}, lv ${invMap[e.id]?.level||1})</option>`
            ).join('')}
          </select>
          <input type="number" id="sell-amount" placeholder="${t('military.buyQty')}" min="1"
            style="width:100px;background:var(--surface2);border:1.5px solid var(--border);border-radius:6px;color:var(--text);font-family:var(--font-mono);font-size:13px;padding:8px 10px;outline:none;"/>
          <button class="btn-logout" id="btn-sell" style="padding:8px 16px;font-size:12px;">${t('military.sellBtn')}</button>
        </div>
        <div class="msg" id="sell-msg" style="margin-top:8px;"></div>
      </div>

      ${maintenanceLogs?.length ? `
        <div style="background:var(--surface);border:1.5px solid var(--border);border-radius:8px;padding:1rem 1.5rem;margin-bottom:1rem;">
          <div style="font-family:var(--font-title);font-size:15px;letter-spacing:2px;color:var(--text-muted);margin-bottom:0.8rem;">🔧 ${t('military.maintenanceTitle')}</div>
          ${maintenanceLogs.map(l=>`
            <div style="display:flex;justify-content:space-between;font-family:var(--font-mono);font-size:11px;color:var(--text-muted);padding:5px 0;border-bottom:1px solid var(--border-dim);">
              <span>${new Date(l.logged_at).toLocaleString()}</span>
              <span style="color:#e05252;">-$${l.total_cost.toLocaleString()}</span>
              <span>→ $${l.money_after.toLocaleString()}</span>
            </div>
          `).join('')}
        </div>
      ` : ''}

    </div>
  `;

  bindPageNav(user, profile, nation);
  bindEvents(user, profile, nation, invMap, equipTypes);
}

function equipRow(eq, inv, money) {
  const svg      = UNIT_SVGS[eq.id] || '';
  const qty      = inv.quantity;
  const level    = inv.level || 1;
  const hasUnits = qty > 0;
  const effAtk   = effectivePower(eq.attack_power,  level);
  const effDef   = effectivePower(eq.defense_power, level);
  const upCost   = upgradeCost(eq, level);
  const atMax    = level >= MAX_LEVEL;
  const canAfford = money >= upCost;
  const pipsTotal = 10;
  const pipsFilled = Math.round((level / MAX_LEVEL) * pipsTotal);
  const levelBar = Array.from({ length: pipsTotal }, (_, i) => `
    <div style="width:8px;height:8px;border-radius:2px;background:${i < pipsFilled ? (level >= MAX_LEVEL ? '#f59e0b' : 'var(--accent)') : 'var(--border)'};flex-shrink:0;"></div>
  `).join('');

  return `
    <tr class="equip-row" data-id="${eq.id}"
      style="border-bottom:1px solid var(--border-dim);transition:background 0.15s;"
      onmouseenter="this.style.background='var(--surface2)'"
      onmouseleave="this.style.background=''">
      <td style="padding:8px;text-align:center;">
        <div style="width:44px;height:44px;margin:0 auto;background:var(--surface2);border-radius:6px;overflow:hidden;padding:4px;border:1px solid var(--border);">${svg}</div>
      </td>
      <td style="padding:8px;">
        <div style="font-family:var(--font-title);font-size:13px;letter-spacing:1px;color:var(--text);">${localName(eq).toUpperCase()}</div>
      </td>
      <td style="padding:8px;text-align:center;font-family:var(--font-mono);font-size:12px;font-weight:700;">
        <span style="color:#e05252;">${effAtk}</span>
        ${level > 1 ? `<div style="font-size:9px;color:var(--text-dim);">${t('military.basePower',{val:eq.attack_power})}</div>` : ''}
      </td>
      <td style="padding:8px;text-align:center;font-family:var(--font-mono);font-size:12px;font-weight:700;">
        <span style="color:#3b82f6;">${effDef}</span>
        ${level > 1 ? `<div style="font-size:9px;color:var(--text-dim);">${t('military.basePower',{val:eq.defense_power})}</div>` : ''}
      </td>
      <td style="padding:8px;text-align:center;font-family:var(--font-mono);font-size:12px;color:var(--text-muted);">${eq.maintenance_per_2h}</td>
      <td style="padding:8px;text-align:center;font-family:var(--font-mono);font-size:12px;color:var(--accent);">$${eq.cost_each.toLocaleString()}</td>
      <td style="padding:8px;text-align:center;font-family:var(--font-title);font-size:16px;color:${hasUnits ? '#16a34a' : 'var(--text-muted)'};">${qty.toLocaleString()}</td>
      <td style="padding:8px;text-align:center;">
        <div style="font-family:var(--font-mono);font-size:13px;font-weight:800;color:${level >= MAX_LEVEL ? '#f59e0b' : (hasUnits ? 'var(--accent)' : 'var(--text-muted)')};margin-bottom:4px;">
          ${level >= MAX_LEVEL ? t('military.maxLevel') : t('military.levelLabel',{level})}
        </div>
        <div style="display:flex;gap:2px;justify-content:center;">${levelBar}</div>
        <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-top:3px;">+${(level-1)*10}% power</div>
      </td>
      <td style="padding:8px;text-align:center;">
        ${!atMax ? `
          <button class="btn-upgrade" data-id="${eq.id}" data-cost="${upCost}" ${!canAfford ? 'disabled' : ''}
            style="font-family:var(--font-mono);font-size:10px;font-weight:700;padding:5px 10px;border-radius:5px;white-space:nowrap;cursor:pointer;
            border:1.5px solid ${canAfford ? 'var(--accent)' : 'var(--border)'};
            background:${canAfford ? 'var(--accent-bg)' : 'var(--surface2)'};
            color:${canAfford ? 'var(--accent)' : 'var(--text-muted)'};opacity:${canAfford ? 1 : 0.6};">
            ${t('military.upgradeToLv',{level:level+1})}<br><span style="font-size:9px;">$${upCost.toLocaleString()}</span>
          </button>
        ` : `
          <span style="font-family:var(--font-mono);font-size:10px;color:#f59e0b;font-weight:700;">${t('military.maxLevel')}</span>
        `}
      </td>
      <td style="padding:8px;text-align:center;">
        <input type="number" class="equip-qty" data-id="${eq.id}" data-cost="${eq.cost_each}" data-name="${eq.name}"
          placeholder="0" min="0"
          style="width:70px;background:var(--surface2);border:1.5px solid var(--border);border-radius:5px;color:var(--text);font-family:var(--font-mono);font-size:12px;padding:5px 6px;outline:none;text-align:center;"
          oninput="updateOrder()" />
      </td>
      <td style="padding:8px;text-align:center;font-family:var(--font-mono);font-size:11px;" id="row-total-${eq.id}"></td>
    </tr>
  `;
}

function mStat(icon, label, value, color) {
  return `
    <div style="background:var(--surface);border:1.5px solid var(--border);border-radius:8px;padding:0.8rem;text-align:center;">
      <div style="font-size:16px;margin-bottom:2px;">${icon}</div>
      <div style="font-family:var(--font-title);font-size:18px;letter-spacing:1px;color:${color};">${value}</div>
      <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted);letter-spacing:1px;text-transform:uppercase;">${label}</div>
    </div>
  `;
}

function th() {
  return 'padding:6px 8px;font-family:var(--font-mono);font-size:9px;color:var(--text-muted);letter-spacing:1.5px;text-align:center;background:var(--surface);';
}

function showMsg(id, type, text) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.className = 'msg ' + type + ' show';
  if (type === 'success') setTimeout(() => el.className = 'msg', 4000);
}

async function logActivity(userId, nationId, action, details) {
  try { await sb.from('activity_logs').insert({ user_id: userId, nation_id: nationId, action, details }); }
  catch (_) {}
}

window.updateOrder = function() {
  let total = 0, count = 0;
  document.querySelectorAll('.equip-qty').forEach(input => {
    const qty  = parseInt(input.value) || 0;
    const cost = parseInt(input.getAttribute('data-cost')) || 0;
    const lineCost = qty * cost;
    total += lineCost;
    if (qty > 0) count++;
    const rowTotal = document.getElementById('row-total-' + input.getAttribute('data-id'));
    if (rowTotal) { rowTotal.textContent = qty > 0 ? '$' + lineCost.toLocaleString() : ''; rowTotal.style.color = 'var(--accent)'; }
  });
  const bar = document.getElementById('order-bar');
  if (bar) bar.style.display = total > 0 ? 'flex' : 'none';
  const totalEl = document.getElementById('order-total');
  const countEl = document.getElementById('order-count');
  if (totalEl) totalEl.textContent = '$' + total.toLocaleString();
  if (countEl) countEl.textContent = count;
};

function bindEvents(user, profile, nation, invMap, equipTypes) {
  const slider = document.getElementById('draft-slider');
  let draftSaveTimer = null;
  slider.addEventListener('input', () => {
    const pct = parseInt(slider.value);
    const maxAtPct = Math.floor(nation.population * pct / 100);
    const canDraft = Math.max(0, maxAtPct - nation.soldiers);
    document.getElementById('draft-pct-label').textContent = pct + '%';
    document.getElementById('draft-count').textContent = maxAtPct.toLocaleString();
    const amountInput = document.getElementById('draft-amount');
    if (amountInput) amountInput.value = canDraft > 0 ? canDraft : 0;
    const capWarning = document.getElementById('draft-cap-warning');
    if (capWarning) {
      if (nation.soldiers >= maxAtPct) {
        capWarning.textContent = t('military.draftAtCap', { soldiers: nation.soldiers.toLocaleString(), max: maxAtPct.toLocaleString() });
        capWarning.style.display = 'block';
      } else {
        capWarning.style.display = 'none';
      }
    }

    // Show security warning if above 20%
    const warningEl = document.getElementById('draft-security-warning');
    if (warningEl) {
      if (pct > 20) {
        const drain = (pct * 0.3).toFixed(1);
        warningEl.textContent = t('military.draftSecWarning', { pct, drain });
        warningEl.style.display = 'block';
      } else {
        warningEl.style.display = 'none';
      }
    }

    // Save draft_percent to DB immediately (debounced 600ms)
    clearTimeout(draftSaveTimer);
    draftSaveTimer = setTimeout(async () => {
      await sb.from('nations').update({ draft_percent: pct }).eq('id', nation.id);
      nation.draft_percent = pct;
    }, 600);
  });

  document.getElementById('btn-draft').addEventListener('click', async () => {
    const amount = parseInt(document.getElementById('draft-amount').value);
    if (!amount || amount < 1) { showMsg('draft-msg', 'error', t('military.errEnterAmount')); return; }
    const cost = amount * 10;
    if (cost > nation.money) { showMsg('draft-msg', 'error', t('military.errNotEnoughMoney', { cost: cost.toLocaleString(), balance: nation.money.toLocaleString() })); return; }
    const pct = parseInt(document.getElementById('draft-slider').value);
    const maxDraft = Math.floor(nation.population * pct / 100);
    if (nation.soldiers + amount > maxDraft) { showMsg('draft-msg', 'error', t('military.errMaxDraft', { pct, max: maxDraft.toLocaleString() })); return; }
    const btn = document.getElementById('btn-draft');
    btn.disabled = true; btn.textContent = t('military.processing');
    const { error } = await sb.from('nations').update({ soldiers: nation.soldiers + amount, money: nation.money - cost, draft_percent: pct }).eq('id', nation.id);
    if (error) { showMsg('draft-msg', 'error', error.message); btn.disabled = false; btn.textContent = t('military.draftBtn'); }
    else { await logActivity(user.id, nation.id, 'draft_soldiers', { amount, cost }); renderMilitary(user, profile, { ...nation, soldiers: nation.soldiers + amount, money: nation.money - cost, draft_percent: pct }); }
  });

  document.getElementById('btn-demob').addEventListener('click', async () => {
    const amount = parseInt(document.getElementById('draft-amount').value);
    if (!amount || amount < 1) { showMsg('draft-msg', 'error', t('military.errEnterAmount')); return; }
    if (amount > nation.soldiers) { showMsg('draft-msg', 'error', t('military.errOnlySoldiers', { count: nation.soldiers.toLocaleString() })); return; }
    const refund = Math.floor(amount * 10 * 0.5);
    if (!confirm(t('military.demobConfirm', { count: amount.toLocaleString(), refund: refund.toLocaleString() }))) return;
    const { error } = await sb.from('nations').update({ soldiers: nation.soldiers - amount, money: nation.money + refund }).eq('id', nation.id);
    if (!error) { await logActivity(user.id, nation.id, 'demobilize', { amount, refund }); renderMilitary(user, profile, { ...nation, soldiers: nation.soldiers - amount, money: nation.money + refund }); }
  });

  document.getElementById('btn-clear-order')?.addEventListener('click', () => {
    document.querySelectorAll('.equip-qty').forEach(i => { i.value = ''; });
    document.querySelectorAll('[id^="row-total-"]').forEach(el => el.textContent = '');
    window.updateOrder();
  });

  document.getElementById('btn-purchase-all')?.addEventListener('click', async () => {
    const orders = [];
    let grandTotal = 0;
    document.querySelectorAll('.equip-qty').forEach(input => {
      const qty = parseInt(input.value) || 0;
      if (qty <= 0) return;
      const id = input.getAttribute('data-id'), cost = parseInt(input.getAttribute('data-cost')), name = input.getAttribute('data-name');
      orders.push({ id, qty, cost, name, lineCost: qty * cost });
      grandTotal += qty * cost;
    });
    if (!orders.length) return;
    if (grandTotal > nation.money) { showMsg('purchase-msg', 'error', t('military.errNotEnoughMoney', { cost: grandTotal.toLocaleString(), balance: nation.money.toLocaleString() })); return; }
    const btn = document.getElementById('btn-purchase-all');
    btn.disabled = true; btn.textContent = t('military.processing');
    let failed = false;
    for (const order of orders) {
      const cur = invMap[order.id] || { quantity: 0, level: 1 };
      // Always preserve the existing level — never overwrite it on purchase
      const { error } = await sb.from('military_units').upsert(
        { nation_id: nation.id, equipment_id: order.id, quantity: cur.quantity + order.qty, level: cur.level },
        { onConflict: 'nation_id,equipment_id', ignoreDuplicates: false }
      );
      if (error) { showMsg('purchase-msg', 'error', error.message); failed = true; break; }
      invMap[order.id] = { ...cur, quantity: cur.quantity + order.qty };
    }
    if (!failed) {
      const { error } = await sb.from('nations').update({ money: nation.money - grandTotal }).eq('id', nation.id);
      if (error) { showMsg('purchase-msg', 'error', error.message); }
      else {
        await logActivity(user.id, nation.id, 'purchase_equipment', { orders: orders.map(o=>({id:o.id,qty:o.qty})), total: grandTotal });
        showMsg('purchase-msg', 'success', t('military.purchaseSuccess', { summary: orders.map(o=>`${o.qty}× ${o.name}`).join(', '), total: grandTotal.toLocaleString() }));
        nation.money -= grandTotal;
        // Security gain: +2% per 1000 units purchased in this order
        const totalUnits = orders.reduce((s, o) => s + o.qty, 0);
        const secGain = Math.floor(totalUnits / 1000) * 2;
        if (secGain > 0) {
          const newSec = Math.min(100, (nation.security_index || 0) + secGain);
          await sb.from('nations').update({ security_index: newSec }).eq('id', nation.id);
          nation.security_index = newSec;
        }
        setTimeout(() => renderMilitary(user, profile, { ...nation }), 1500);
      }
    }
    btn.disabled = false; btn.textContent = t('military.purchaseAllBtn');
  });

  document.querySelectorAll('.btn-upgrade').forEach(btn => {
    btn.addEventListener('click', async () => {
      const eqId  = btn.getAttribute('data-id');
      const cost  = parseInt(btn.getAttribute('data-cost'));
      const eq    = equipTypes.find(e => e.id === eqId);
      if (!eq) return;
      
      let inv = invMap[eqId];
      
      // If no inventory record exists, create one with quantity 0 and level 1
      if (!inv) {
        const { error: createErr } = await sb.from('military_units')
          .insert({ nation_id: nation.id, equipment_id: eqId, quantity: 0, level: 1 });
        if (createErr) { showMsg('purchase-msg', 'error', createErr.message); return; }
        inv = { quantity: 0, level: 1 };
        invMap[eqId] = inv;
      }
      
      if (nation.money < cost) { showMsg('purchase-msg', 'error', t('military.errNotEnoughMoney', { cost: cost.toLocaleString(), balance: nation.money.toLocaleString() })); return; }
      btn.disabled = true; btn.innerHTML = t('military.processing');
      const newLevel = inv.level + 1;
      const { error: lvlErr } = await sb.from('military_units').update({ level: newLevel }).eq('nation_id', nation.id).eq('equipment_id', eqId);
      if (lvlErr) { showMsg('purchase-msg', 'error', lvlErr.message); btn.disabled = false; return; }
      await sb.from('nations').update({ money: nation.money - cost }).eq('id', nation.id);
      await logActivity(user.id, nation.id, 'upgrade_unit', { equipment: eqId, level: newLevel, cost });
      showMsg('purchase-msg', 'success', t('military.upgradeSuccess', { name: localName(eq), level: newLevel, cost: cost.toLocaleString() }));
      nation.money -= cost;
      setTimeout(() => renderMilitary(user, profile, { ...nation }), 800);
    });
  });

  document.getElementById('btn-sell')?.addEventListener('click', async () => {
    const typeId = document.getElementById('sell-type').value;
    const qty    = parseInt(document.getElementById('sell-amount').value);
    if (!typeId) { showMsg('sell-msg', 'error', t('military.errSelectEquip')); return; }
    if (!qty || qty < 1) { showMsg('sell-msg', 'error', t('military.errEnterQty')); return; }
    const inv = invMap[typeId] || { quantity: 0 };
    if (qty > inv.quantity) { showMsg('sell-msg', 'error', t('military.errNotEnough', { count: inv.quantity })); return; }
    const eq = equipTypes.find(e => e.id === typeId);
    const refund = Math.floor(qty * eq.cost_each * 0.5);
    if (!confirm(t('military.sellConfirm', { qty, name: localName(eq), refund: refund.toLocaleString() }))) return;
    const newQty = inv.quantity - qty;
    // Always UPDATE (never delete) so that the level is preserved even when qty reaches 0
    const { error } = await sb.from('military_units')
      .update({ quantity: newQty })
      .eq('nation_id', nation.id)
      .eq('equipment_id', typeId);
    if (!error) {
      await sb.from('nations').update({ money: nation.money + refund }).eq('id', nation.id);
      await logActivity(user.id, nation.id, 'sell_equipment', { equipment: typeId, qty, refund });
      showMsg('sell-msg', 'success', t('military.soldSuccess', { qty, name: localName(eq), refund: refund.toLocaleString() }));
      setTimeout(() => renderMilitary(user, profile, { ...nation, money: nation.money + refund }), 1500);
    } else {
      showMsg('sell-msg', 'error', error.message);
    }
  });
}
