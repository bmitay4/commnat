import { sb } from '../supabase.js';
import { UNIT_SVGS } from '../unit-svgs.js';
import { renderPageTopbar, bindPageNav } from '../nav.js';

export async function renderMilitary(user, profile, nation) {
  const app = document.getElementById('app');
  app.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-size:13px;color:var(--text-muted);font-family:var(--font-body);">Loading Military...</div>`;

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

  const invMap = Object.fromEntries((inventory || []).map(i => [i.equipment_id, i.quantity]));

  let totalAttack = 0, totalDefense = 0, totalMaint = 0;
  (equipTypes || []).forEach(et => {
    const qty = invMap[et.id] || 0;
    totalAttack  += qty * et.attack_power;
    totalDefense += qty * et.defense_power;
    totalMaint   += qty * et.maintenance_per_2h;
  });

  const categories = [
    { id: 'ground',  label: '🪖 Ground Forces' },
    { id: 'air',     label: '✈️ Air Force' },
    { id: 'naval',   label: '🚢 Naval' },
    { id: 'missile', label: '🚀 Missiles' },
    { id: 'defense', label: '🛡️ Defense Systems' },
  ];

  app.innerHTML = `
    ${renderPageTopbar(user, profile, nation, 'military')}
    <div class="inner-page-wide">

      <!-- Page title -->
      <div class="inner-topbar">
        <div class="inner-title-wrap">
          <span style="font-size:24px;">⚔️</span>
          <div>
            <div class="inner-title">Military</div>
            <div class="inner-sub">${nation.name}</div>
          </div>
        </div>
      </div>

      <!-- Stats bar -->
      <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:1.2rem;">
        ${mStat('👥', 'Soldiers',   nation.soldiers.toLocaleString(),  'var(--accent)')}
        ${mStat('⚔️', 'Attack',     totalAttack.toLocaleString(),      '#e05252')}
        ${mStat('🛡️', 'Defense',    totalDefense.toLocaleString(),     '#3b82f6')}
        ${mStat('💰', 'Treasury',   '$'+nation.money.toLocaleString(), 'var(--accent)')}
        ${mStat('🔧', 'Maint/2h',   '-$'+totalMaint.toLocaleString(), totalMaint > nation.money ? '#e05252' : 'var(--text-muted)')}
      </div>

      <!-- Draft section -->
      <div style="background:var(--surface);border:1.5px solid var(--border);border-top:3px solid var(--accent);border-radius:8px;padding:1.2rem 1.5rem;margin-bottom:1rem;">
        <div style="font-family:var(--font-title);font-size:17px;letter-spacing:2px;color:var(--text);margin-bottom:1rem;">👥 SOLDIERS & DRAFT</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;align-items:center;">
          <div>
            <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-muted);letter-spacing:1px;margin-bottom:5px;">
              DRAFT RATE: <strong id="draft-pct-label" style="color:var(--accent);">${nation.draft_percent}%</strong>
              &nbsp;→&nbsp; max <strong id="draft-count" style="color:var(--accent);">${Math.floor(nation.population*nation.draft_percent/100).toLocaleString()}</strong> soldiers
            </div>
            <input type="range" id="draft-slider" min="5" max="40" step="1" value="${nation.draft_percent}"
              style="width:100%;accent-color:var(--accent);"/>
            <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);margin-top:3px;">
              $10/soldier · High draft rate lowers security index
            </div>
          </div>
          <div style="display:flex;gap:8px;align-items:center;">
            <input type="number" id="draft-amount" placeholder="Amount" min="1"
              style="flex:1;background:var(--surface2);border:1.5px solid var(--border);border-radius:6px;
              color:var(--text);font-family:var(--font-mono);font-size:13px;padding:8px 10px;outline:none;"/>
            <button class="btn-submit" id="btn-draft"
              style="width:auto;padding:8px 14px;font-size:13px;letter-spacing:1px;border-radius:6px;">Draft</button>
            <button class="btn-logout" id="btn-demob" style="font-size:11px;padding:8px 12px;white-space:nowrap;">
              Demob 50%↩
            </button>
          </div>
        </div>
        <div class="msg" id="draft-msg" style="margin-top:8px;"></div>
      </div>

      <!-- Equipment table -->
      <div style="background:var(--surface);border:1.5px solid var(--border);border-radius:8px;overflow:hidden;margin-bottom:1rem;">

        <!-- Order summary bar -->
        <div id="order-bar" style="display:none;background:var(--accent-bg);border-bottom:1.5px solid var(--border);
          padding:10px 1.5rem;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
          <div style="font-family:var(--font-mono);font-size:12px;color:var(--text-muted);">
            ORDER TOTAL: <strong id="order-total" style="color:var(--accent);font-size:15px;">$0</strong>
            &nbsp;·&nbsp; Items: <strong id="order-count" style="color:var(--accent);">0</strong>
          </div>
          <div style="display:flex;gap:8px;">
            <button class="btn-logout" id="btn-clear-order" style="font-size:11px;padding:6px 12px;">Clear</button>
            <button class="btn-submit" id="btn-purchase-all"
              style="width:auto;padding:8px 20px;font-size:14px;letter-spacing:1px;border-radius:6px;">
              Purchase All
            </button>
          </div>
        </div>

        ${categories.map(cat => {
          const items = (equipTypes||[]).filter(e => e.category === cat.id);
          return `
            <div>
              <div style="font-family:var(--font-title);font-size:14px;letter-spacing:2px;
                color:var(--text-muted);padding:8px 1.5rem;background:var(--surface2);
                border-bottom:1px solid var(--border);">${cat.label}</div>
              <table style="width:100%;border-collapse:collapse;">
                <colgroup>
                  <col style="width:56px">
                  <col style="width:160px">
                  <col style="width:80px">
                  <col style="width:80px">
                  <col style="width:80px">
                  <col style="width:100px">
                  <col style="width:100px">
                  <col style="width:110px">
                  <col style="width:50px">
                </colgroup>
                <thead>
                  <tr style="border-bottom:1px solid var(--border);">
                    <th style="padding:6px 8px;font-family:var(--font-mono);font-size:9px;color:var(--text-muted);letter-spacing:1.5px;text-align:center;background:var(--surface);">IMG</th>
                    <th style="padding:6px 8px;font-family:var(--font-mono);font-size:9px;color:var(--text-muted);letter-spacing:1.5px;text-align:start;background:var(--surface);">UNIT</th>
                    <th style="padding:6px 8px;font-family:var(--font-mono);font-size:9px;color:var(--text-muted);letter-spacing:1.5px;text-align:center;background:var(--surface);">⚔️ ATK</th>
                    <th style="padding:6px 8px;font-family:var(--font-mono);font-size:9px;color:var(--text-muted);letter-spacing:1.5px;text-align:center;background:var(--surface);">🛡️ DEF</th>
                    <th style="padding:6px 8px;font-family:var(--font-mono);font-size:9px;color:var(--text-muted);letter-spacing:1.5px;text-align:center;background:var(--surface);">🔧/2h</th>
                    <th style="padding:6px 8px;font-family:var(--font-mono);font-size:9px;color:var(--text-muted);letter-spacing:1.5px;text-align:center;background:var(--surface);">COST EACH</th>
                    <th style="padding:6px 8px;font-family:var(--font-mono);font-size:9px;color:var(--text-muted);letter-spacing:1.5px;text-align:center;background:var(--surface);">OWNED</th>
                    <th style="padding:6px 8px;font-family:var(--font-mono);font-size:9px;color:var(--text-muted);letter-spacing:1.5px;text-align:center;background:var(--surface);">QTY</th>
                    <th style="padding:6px 8px;background:var(--surface);"></th>
                  </tr>
                </thead>
                <tbody>
                  ${items.map(eq => equipRow(eq, invMap[eq.id]||0)).join('')}
                </tbody>
              </table>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Purchase result message -->
      <div class="msg" id="purchase-msg" style="margin-bottom:1rem;"></div>

      <!-- Sell section -->
      <div style="background:var(--surface);border:1.5px solid var(--border);border-radius:8px;padding:1.2rem 1.5rem;margin-bottom:1rem;">
        <div style="font-family:var(--font-title);font-size:16px;letter-spacing:2px;color:var(--text-muted);margin-bottom:0.8rem;">💸 SELL EQUIPMENT (50% refund)</div>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
          <select id="sell-type" style="background:var(--surface2);border:1.5px solid var(--border);border-radius:6px;
            color:var(--text);font-family:var(--font-mono);font-size:13px;padding:8px 10px;outline:none;flex:1;min-width:160px;">
            <option value="">Select equipment...</option>
            ${(equipTypes||[]).filter(e=>(invMap[e.id]||0)>0).map(e=>
              `<option value="${e.id}">${e.name} (owned: ${(invMap[e.id]||0).toLocaleString()})</option>`
            ).join('')}
          </select>
          <input type="number" id="sell-amount" placeholder="Qty" min="1"
            style="width:100px;background:var(--surface2);border:1.5px solid var(--border);border-radius:6px;
            color:var(--text);font-family:var(--font-mono);font-size:13px;padding:8px 10px;outline:none;"/>
          <button class="btn-logout" id="btn-sell" style="padding:8px 16px;font-size:12px;">Sell</button>
        </div>
        <div class="msg" id="sell-msg" style="margin-top:8px;"></div>
      </div>

      <!-- Maintenance log -->
      ${maintenanceLogs?.length ? `
        <div style="background:var(--surface);border:1.5px solid var(--border);
          border-radius:8px;padding:1rem 1.5rem;margin-bottom:1rem;">
          <div style="font-family:var(--font-title);font-size:15px;letter-spacing:2px;color:var(--text-muted);margin-bottom:0.8rem;">🔧 RECENT MAINTENANCE</div>
          ${maintenanceLogs.map(l=>`
            <div style="display:flex;justify-content:space-between;font-family:var(--font-mono);font-size:11px;
              color:var(--text-muted);padding:5px 0;border-bottom:1px solid var(--border-dim);">
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

// ─── Equipment row ────────────────────────────────────────────────────────────

function equipRow(eq, owned) {
  const svg = UNIT_SVGS[eq.id] || '';
  return `
    <tr class="equip-row" data-id="${eq.id}"
      style="border-bottom:1px solid var(--border-dim);transition:background 0.15s;"
      onmouseenter="this.style.background='var(--surface2)'"
      onmouseleave="this.style.background=''">

      <td style="padding:8px;text-align:center;">
        <div style="width:44px;height:44px;margin:0 auto;background:var(--surface2);
          border-radius:6px;overflow:hidden;padding:4px;border:1px solid var(--border);">
          ${svg}
        </div>
      </td>

      <td style="padding:8px;">
        <div style="font-family:var(--font-title);font-size:14px;letter-spacing:1px;color:var(--text);">${eq.name.toUpperCase()}</div>
      </td>

      <td style="padding:8px;text-align:center;font-family:var(--font-mono);font-size:12px;color:#e05252;font-weight:700;">${eq.attack_power}</td>
      <td style="padding:8px;text-align:center;font-family:var(--font-mono);font-size:12px;color:#3b82f6;font-weight:700;">${eq.defense_power}</td>
      <td style="padding:8px;text-align:center;font-family:var(--font-mono);font-size:12px;color:var(--text-muted);">${eq.maintenance_per_2h}</td>

      <td style="padding:8px;text-align:center;font-family:var(--font-mono);font-size:12px;color:var(--accent);">
        $${eq.cost_each.toLocaleString()}
      </td>

      <td style="padding:8px;text-align:center;font-family:var(--font-mono);font-size:13px;
        font-weight:700;color:${owned > 0 ? 'var(--accent)' : 'var(--text-muted)'};">
        ${owned.toLocaleString()}
      </td>

      <td style="padding:8px;text-align:center;">
        <input type="number" class="equip-qty" data-id="${eq.id}" data-cost="${eq.cost_each}" data-name="${eq.name}"
          placeholder="0" min="0"
          style="width:70px;background:var(--surface2);border:1.5px solid var(--border);border-radius:5px;
          color:var(--text);font-family:var(--font-mono);font-size:12px;padding:5px 6px;outline:none;text-align:center;"
          oninput="updateOrder()" />
      </td>

      <td style="padding:8px;text-align:center;font-family:var(--font-mono);font-size:11px;" id="row-total-${eq.id}"></td>
    </tr>
  `;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mStat(icon, label, value, color) {
  return `
    <div style="background:var(--surface);border:1.5px solid var(--border);border-radius:8px;padding:0.8rem;text-align:center;">
      <div style="font-size:16px;margin-bottom:2px;">${icon}</div>
      <div style="font-family:var(--font-title);font-size:18px;letter-spacing:1px;color:${color};">${value}</div>
      <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted);letter-spacing:1px;text-transform:uppercase;">${label}</div>
    </div>
  `;
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

// ─── Global order updater (called from inline oninput) ───────────────────────

window.updateOrder = function() {
  let total = 0, count = 0;
  document.querySelectorAll('.equip-qty').forEach(input => {
    const qty = parseInt(input.value) || 0;
    const cost = parseInt(input.getAttribute('data-cost')) || 0;
    const lineCost = qty * cost;
    total += lineCost;
    if (qty > 0) count++;
    const rowTotal = document.getElementById('row-total-' + input.getAttribute('data-id'));
    if (rowTotal) {
      rowTotal.textContent = qty > 0 ? '$' + lineCost.toLocaleString() : '';
      rowTotal.style.color = 'var(--accent)';
    }
  });

  const bar = document.getElementById('order-bar');
  const totalEl = document.getElementById('order-total');
  const countEl = document.getElementById('order-count');
  if (bar) bar.style.display = total > 0 ? 'flex' : 'none';
  if (totalEl) totalEl.textContent = '$' + total.toLocaleString();
  if (countEl) countEl.textContent = count;
};

// ─── Event bindings ───────────────────────────────────────────────────────────

function bindEvents(user, profile, nation, invMap, equipTypes) {

  // Draft slider
  const slider = document.getElementById('draft-slider');
  slider.addEventListener('input', () => {
    const pct = parseInt(slider.value);
    document.getElementById('draft-pct-label').textContent = pct + '%';
    document.getElementById('draft-count').textContent =
      Math.floor(nation.population * pct / 100).toLocaleString();
  });

  // Draft
  document.getElementById('btn-draft').addEventListener('click', async () => {
    const amount = parseInt(document.getElementById('draft-amount').value);
    if (!amount || amount < 1) { showMsg('draft-msg', 'error', 'Enter a valid amount.'); return; }
    const cost = amount * 10;
    if (cost > nation.money) { showMsg('draft-msg', 'error', `Need $${cost.toLocaleString()}, you have $${nation.money.toLocaleString()}.`); return; }
    const pct = parseInt(document.getElementById('draft-slider').value);
    const maxDraft = Math.floor(nation.population * pct / 100);
    if (nation.soldiers + amount > maxDraft) { showMsg('draft-msg', 'error', `Max soldiers at ${pct}% draft: ${maxDraft.toLocaleString()}.`); return; }

    const btn = document.getElementById('btn-draft');
    btn.disabled = true; btn.textContent = '...';
    const { error } = await sb.from('nations').update({
      soldiers: nation.soldiers + amount, money: nation.money - cost, draft_percent: pct,
    }).eq('id', nation.id);

    if (error) { showMsg('draft-msg', 'error', error.message); }
    else {
      await logActivity(user.id, nation.id, 'draft_soldiers', { amount, cost });
      renderMilitary(user, profile, { ...nation, soldiers: nation.soldiers + amount, money: nation.money - cost, draft_percent: pct });
      return;
    }
    btn.disabled = false; btn.textContent = 'Draft';
  });

  // Demobilize
  document.getElementById('btn-demob').addEventListener('click', async () => {
    const amount = parseInt(document.getElementById('draft-amount').value);
    if (!amount || amount < 1) { showMsg('draft-msg', 'error', 'Enter amount.'); return; }
    if (amount > nation.soldiers) { showMsg('draft-msg', 'error', `Only ${nation.soldiers.toLocaleString()} soldiers available.`); return; }
    const refund = Math.floor(amount * 10 * 0.5);
    if (!confirm(`Demobilize ${amount.toLocaleString()} soldiers? Receive $${refund.toLocaleString()}.`)) return;
    const { error } = await sb.from('nations').update({ soldiers: nation.soldiers - amount, money: nation.money + refund }).eq('id', nation.id);
    if (!error) {
      await logActivity(user.id, nation.id, 'demobilize', { amount, refund });
      renderMilitary(user, profile, { ...nation, soldiers: nation.soldiers - amount, money: nation.money + refund });
    }
  });

  // Clear order
  document.getElementById('btn-clear-order')?.addEventListener('click', () => {
    document.querySelectorAll('.equip-qty').forEach(i => { i.value = ''; });
    document.querySelectorAll('[id^="row-total-"]').forEach(el => el.textContent = '');
    window.updateOrder();
  });

  // Purchase ALL
  document.getElementById('btn-purchase-all')?.addEventListener('click', async () => {
    const orders = [];
    let grandTotal = 0;

    document.querySelectorAll('.equip-qty').forEach(input => {
      const qty = parseInt(input.value) || 0;
      if (qty <= 0) return;
      const id = input.getAttribute('data-id');
      const cost = parseInt(input.getAttribute('data-cost'));
      const name = input.getAttribute('data-name');
      orders.push({ id, qty, cost, name, lineCost: qty * cost });
      grandTotal += qty * cost;
    });

    if (!orders.length) return;

    if (grandTotal > nation.money) {
      showMsg('purchase-msg', 'error', `Total $${grandTotal.toLocaleString()} exceeds treasury $${nation.money.toLocaleString()}.`);
      return;
    }

    const btn = document.getElementById('btn-purchase-all');
    btn.disabled = true; btn.textContent = 'Processing...';

    // Upsert each unit type
    let failed = false;
    for (const order of orders) {
      const currentQty = invMap[order.id] || 0;
      const { error } = await sb.from('military_units').upsert({
        nation_id: nation.id,
        equipment_id: order.id,
        quantity: currentQty + order.qty,
      }, { onConflict: 'nation_id,equipment_id' });
      if (error) { showMsg('purchase-msg', 'error', error.message); failed = true; break; }
      invMap[order.id] = currentQty + order.qty;
    }

    if (!failed) {
      const { error } = await sb.from('nations').update({ money: nation.money - grandTotal }).eq('id', nation.id);
      if (error) { showMsg('purchase-msg', 'error', error.message); }
      else {
        await logActivity(user.id, nation.id, 'purchase_equipment', {
          orders: orders.map(o => ({ id: o.id, qty: o.qty })),
          total: grandTotal,
        });
        const summary = orders.map(o => `${o.qty}× ${o.name}`).join(', ');
        showMsg('purchase-msg', 'success', `Purchased: ${summary} — Total: $${grandTotal.toLocaleString()}`);
        nation.money -= grandTotal;
        // Refresh after short delay
        setTimeout(() => renderMilitary(user, profile, { ...nation }), 1500);
      }
    }

    btn.disabled = false; btn.textContent = 'Purchase All';
  });

  // Sell
  document.getElementById('btn-sell')?.addEventListener('click', async () => {
    const typeId = document.getElementById('sell-type').value;
    const qty = parseInt(document.getElementById('sell-amount').value);
    if (!typeId) { showMsg('sell-msg', 'error', 'Select equipment type.'); return; }
    if (!qty || qty < 1) { showMsg('sell-msg', 'error', 'Enter quantity.'); return; }
    const owned = invMap[typeId] || 0;
    if (qty > owned) { showMsg('sell-msg', 'error', `You only own ${owned}.`); return; }
    const eq = equipTypes.find(e => e.id === typeId);
    const refund = Math.floor(qty * eq.cost_each * 0.5);
    if (!confirm(`Sell ${qty}× ${eq.name} for $${refund.toLocaleString()}?`)) return;

    const newQty = owned - qty;
    const { error } = newQty > 0
      ? await sb.from('military_units').update({ quantity: newQty }).eq('nation_id', nation.id).eq('equipment_id', typeId)
      : await sb.from('military_units').delete().eq('nation_id', nation.id).eq('equipment_id', typeId);

    if (!error) {
      await sb.from('nations').update({ money: nation.money + refund }).eq('id', nation.id);
      await logActivity(user.id, nation.id, 'sell_equipment', { equipment: typeId, qty, refund });
      showMsg('sell-msg', 'success', `Sold ${qty}× ${eq.name} for $${refund.toLocaleString()}`);
      setTimeout(() => renderMilitary(user, profile, { ...nation, money: nation.money + refund }), 1500);
    } else {
      showMsg('sell-msg', 'error', error.message);
    }
  });
}
