import { renderPageTopbar, bindPageNav } from '../nav.js';
import { sb } from '../supabase.js';

export async function renderAttacks(user, profile, nation) {
  const app = document.getElementById('app');
  app.innerHTML = loadingHTML('LOADING ATTACK CENTER...');

  // Fetch all alive nations (targets), plus recent attack log
  const [
    { data: targets },
    { data: recentAttacks },
  ] = await Promise.all([
    sb.from('nations')
      .select('id, name, flag_emoji, population, land, soldiers, security_index, money, is_bot')
      .eq('is_alive', true)
      .eq('round', nation.round)
      .neq('id', nation.id)
      .order('land', { ascending: false }),
    sb.from('attacks')
      .select('*, attacker:attacker_nation_id(name,flag_emoji), defender:defender_nation_id(name,flag_emoji)')
      .or(`attacker_nation_id.eq.${nation.id},defender_nation_id.eq.${nation.id}`)
      .order('attacked_at', { ascending: false })
      .limit(20),
  ]);

  // Compute attacker's military power
  const { data: myUnits } = await sb
    .from('military_units')
    .select('quantity, equipment_types(attack_power, defense_power)')
    .eq('nation_id', nation.id);

  let myAttack = 0, myDefense = 0;
  (myUnits || []).forEach(u => {
    myAttack  += u.quantity * (u.equipment_types?.attack_power || 0);
    myDefense += u.quantity * (u.equipment_types?.defense_power || 0);
  });
  myAttack  += Math.floor(nation.soldiers / 1000) * 50;
  myDefense += Math.floor(nation.soldiers / 1000) * 50;

  app.innerHTML = `
    ${renderPageTopbar(user, profile, nation, 'attacks')}
    <div class="inner-page-wide">

      <!-- Page title -->
      <div class="inner-topbar">
        <div class="inner-title-wrap">
          <span style="font-size:24px;">💥</span>
          <div>
            <div class="inner-title">Attack Center</div>
            <div class="inner-sub">${nation.name} · ${nation.turns} turns available</div>
          </div>
        </div>
      </div>

      <!-- My power stats -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:1.2rem;">
        ${aStat('⚔️', 'Your Attack',  myAttack.toLocaleString(),         '#e05252')}
        ${aStat('🛡️', 'Your Defense', myDefense.toLocaleString(),        '#3b82f6')}
        ${aStat('👥', 'Soldiers',     nation.soldiers.toLocaleString(),   'var(--accent)')}
        ${aStat('⏱️', 'Turns',        nation.turns + ' / 200',           nation.turns > 0 ? 'var(--accent)' : '#e05252')}
      </div>

      <!-- Attack type legend -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:1.2rem;">
        <div style="background:var(--surface);border:1.5px solid var(--border);border-inline-start:3px solid #e05252;border-radius:0 8px 8px 0;padding:0.8rem 1rem;">
          <div style="font-family:var(--font-title);font-size:15px;letter-spacing:2px;color:#e05252;margin-bottom:4px;">💥 DESTRUCTION ATTACK</div>
          <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);line-height:1.7;">
            Costs 1 turn · Damages security, money & soldiers<br>
            Use to weaken an enemy before conquest
          </div>
        </div>
        <div style="background:var(--surface);border:1.5px solid var(--border);border-inline-start:3px solid var(--accent);border-radius:0 8px 8px 0;padding:0.8rem 1rem;">
          <div style="font-family:var(--font-title);font-size:15px;letter-spacing:2px;color:var(--accent);margin-bottom:4px;">🏴 CONQUEST ATTACK</div>
          <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);line-height:1.7;">
            Costs 1 turn · Captures land & money on success<br>
            Both sides lose soldiers
          </div>
        </div>
      </div>

      <!-- Search targets -->
      <div style="margin-bottom:0.8rem;">
        <input class="admin-search" type="text" id="target-search"
          placeholder="Search nations by name..." style="width:100%;" />
      </div>

      <!-- Target list -->
      <div style="background:var(--surface);border:1.5px solid var(--border);border-radius:8px;overflow:hidden;margin-bottom:1.2rem;">
        <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted);letter-spacing:2px;
          padding:8px 1rem;background:var(--surface2);border-bottom:1px solid var(--border);">
          AVAILABLE TARGETS — ${(targets||[]).length} nations
        </div>
        <div id="target-list" style="max-height:400px;overflow-y:auto;">
          ${(targets||[]).map(t => targetRow(t, myAttack)).join('')}
        </div>
      </div>

      <!-- Attack result -->
      <div id="attack-result" style="margin-bottom:1rem;display:none;"></div>

      <!-- Battle log -->
      ${(recentAttacks||[]).length ? `
        <div style="background:var(--surface);border:1.5px solid var(--border);border-radius:8px;overflow:hidden;">
          <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted);letter-spacing:2px;
            padding:8px 1rem;background:var(--surface2);border-bottom:1px solid var(--border);">
            📜 RECENT BATTLE LOG
          </div>
          <div style="padding:0.5rem 0;">
            ${(recentAttacks||[]).map(a => battleLogRow(a, nation.id)).join('')}
          </div>
        </div>
      ` : ''}

    </div>
  `;

  bindAttackEvents(user, profile, nation, myAttack);
}

// ─── Target row ───────────────────────────────────────────────────────────────

function targetRow(t, myAttack) {
  // Estimate enemy defense
  const estimatedDef = Math.floor(t.soldiers / 1000) * 50;
  const powerRatio = estimatedDef === 0 ? 999 : myAttack / estimatedDef;
  const threatColor = powerRatio >= 2 ? '#16a34a' : powerRatio >= 0.8 ? '#f59e0b' : '#e05252';
  const threatLabel = powerRatio >= 2 ? 'Easy' : powerRatio >= 0.8 ? 'Even' : 'Hard';

  return `
    <div class="target-row" data-id="${t.id}" data-name="${t.name}"
      style="display:grid;grid-template-columns:auto 1fr auto auto auto auto;
      align-items:center;gap:12px;padding:10px 1rem;
      border-bottom:1px solid var(--border-dim);transition:background 0.15s;cursor:pointer;"
      onmouseenter="this.style.background='var(--surface2)'"
      onmouseleave="this.style.background=''">

      <!-- Flag + name -->
      
      <div>
        <div style="font-family:var(--font-title);font-size:15px;letter-spacing:1px;color:var(--text);">
          ${t.name.toUpperCase()}
          ${t.is_bot ? '<span style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted);background:var(--surface3);border:1px solid var(--border);padding:1px 5px;border-radius:8px;margin-inline-start:6px;">BOT</span>' : ''}
        </div>
        <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);">
          👥 ${(t.population/1000).toFixed(0)}k · 🗺️ ${t.land} · 🛡️ ${t.security_index}%
        </div>
      </div>

      <!-- Soldiers -->
      <div style="text-align:center;font-family:var(--font-mono);font-size:11px;color:var(--text-muted);">
        <div style="color:var(--text);font-weight:700;">${t.soldiers.toLocaleString()}</div>
        <div>soldiers</div>
      </div>

      <!-- Threat -->
      <div style="text-align:center;">
        <div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:${threatColor};">${threatLabel}</div>
        <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted);">threat</div>
      </div>

      <!-- Attack buttons -->
      <div style="display:flex;gap:6px;">
        <button class="btn-destroy" data-id="${t.id}" data-name="${t.name}"
          style="background:#fef2f2;border:1.5px solid #fca5a5;color:#dc2626;
          font-family:var(--font-mono);font-size:10px;letter-spacing:0.5px;
          padding:5px 10px;border-radius:5px;cursor:pointer;white-space:nowrap;
          transition:all 0.2s;">
          💥 Destroy
        </button>
        <button class="btn-conquer" data-id="${t.id}" data-name="${t.name}"
          style="background:rgba(40,88,208,0.06);border:1.5px solid rgba(40,88,208,0.3);color:var(--accent);
          font-family:var(--font-mono);font-size:10px;letter-spacing:0.5px;
          padding:5px 10px;border-radius:5px;cursor:pointer;white-space:nowrap;
          transition:all 0.2s;">
          🏴 Conquer
        </button>
      </div>
    </div>
  `;
}

// ─── Battle log row ───────────────────────────────────────────────────────────

function battleLogRow(a, myNationId) {
  const isAttacker = a.attacker_nation_id === myNationId;
  const opponent = isAttacker ? a.defender : a.attacker;
  const resultColor = a.success
    ? (isAttacker ? '#16a34a' : '#e05252')
    : (isAttacker ? '#e05252' : '#16a34a');
  const resultLabel = a.success
    ? (isAttacker ? 'WIN' : 'DEFEAT')
    : (isAttacker ? 'LOST' : 'DEFENDED');

  return `
    <div style="display:flex;align-items:center;gap:12px;padding:8px 1rem;
      border-bottom:1px solid var(--border-dim);font-family:var(--font-mono);font-size:11px;">
      <span style="font-size:16px;">${isAttacker ? '⚔️' : '🛡️'}</span>
      <div style="flex:1;min-width:0;">
        <div style="color:var(--text);">
          ${isAttacker ? 'Attack on' : 'Attacked by'}
          <strong>${opponent?.name || 'Unknown'}</strong>
          <span style="color:var(--text-muted);font-size:10px;margin-inline-start:6px;">${a.attack_type}</span>
        </div>
        <div style="color:var(--text-muted);font-size:10px;margin-top:2px;">${a.result_summary || ''}</div>
      </div>
      <div style="text-align:end;flex-shrink:0;">
        <div style="font-weight:700;color:${resultColor};">${resultLabel}</div>
        <div style="color:var(--text-muted);font-size:10px;">${new Date(a.attacked_at).toLocaleTimeString()}</div>
      </div>
    </div>
  `;
}

// ─── Events ───────────────────────────────────────────────────────────────────

function bindAttackEvents(user, profile, nation, myAttack) {
  bindPageNav(user, profile, nation);

  // Search
  document.getElementById('target-search').addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll('.target-row').forEach(row => {
      row.style.display = row.getAttribute('data-name').toLowerCase().includes(q) ? '' : 'none';
    });
  });

  // Destruction attacks
  document.querySelectorAll('.btn-destroy').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const defId = btn.getAttribute('data-id');
      const defName = btn.getAttribute('data-name');
      if (nation.turns < 1) { showResult('error', 'Not enough turns!'); return; }
      await doAttack(user, profile, nation, defId, defName, 'destruction', 'airstrike');
    });
  });

  // Conquest attacks
  document.querySelectorAll('.btn-conquer').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const defId = btn.getAttribute('data-id');
      const defName = btn.getAttribute('data-name');
      if (nation.turns < 1) { showResult('error', 'Not enough turns!'); return; }
      await doAttack(user, profile, nation, defId, defName, 'conquest', 'ground');
    });
  });
}

async function doAttack(user, profile, nation, defId, defName, type, subType) {
  // Disable all attack buttons during processing
  document.querySelectorAll('.btn-destroy, .btn-conquer').forEach(b => b.disabled = true);
  showResult('loading', `⚔️ Engaging ${defName}...`);

  const { data, error } = await sb.rpc('resolve_attack', {
    p_attacker_id: nation.id,
    p_defender_id: defId,
    p_attack_type: type,
    p_sub_type: subType,
  });

  if (error || data?.error) {
    const msg = data?.error === 'not_enough_turns' ? 'Not enough turns!'
      : data?.error === 'cannot_attack_self' ? 'Cannot attack yourself!'
      : error?.message || 'Attack failed.';
    showResult('error', msg);
    document.querySelectorAll('.btn-destroy, .btn-conquer').forEach(b => b.disabled = false);
    return;
  }

  // Log to activity
  try {
    await sb.from('activity_logs').insert({
      user_id: user.id, nation_id: nation.id,
      action: type + '_attack',
      details: { defender: defName, success: data.success, ...data },
    });
  } catch (_) {}

  // Show result
  const isWin = data.success;
  showResult(isWin ? 'success' : 'defeat', data.summary, data);

  // Reload page after 2s to reflect updated stats
  setTimeout(() => renderAttacks(user, profile, {
    ...nation,
    turns: nation.turns - 1,
  }), 2500);
}

function showResult(type, message, data) {
  const el = document.getElementById('attack-result');
  if (!el) return;
  el.style.display = 'block';

  const colors = {
    success: { bg: 'rgba(22,163,74,0.08)', border: '#16a34a', text: '#15803d' },
    defeat:  { bg: 'rgba(220,38,38,0.08)', border: '#dc2626', text: '#dc2626' },
    error:   { bg: 'rgba(220,38,38,0.08)', border: '#dc2626', text: '#dc2626' },
    loading: { bg: 'rgba(40,88,208,0.06)', border: 'var(--accent)', text: 'var(--accent)' },
  };
  const c = colors[type] || colors.loading;

  el.innerHTML = `
    <div style="background:${c.bg};border:1.5px solid ${c.border};border-radius:8px;padding:1rem 1.5rem;">
      <div style="font-family:var(--font-title);font-size:18px;letter-spacing:2px;color:${c.text};margin-bottom:${data ? '8px' : '0'};">
        ${type === 'success' ? '🏆 VICTORY' : type === 'defeat' ? '💀 DEFEAT' : type === 'loading' ? '⚔️ ATTACKING...' : '⚠️ ERROR'}
      </div>
      <div style="font-family:var(--font-mono);font-size:12px;color:var(--text-muted);">${message}</div>
      ${data ? `
        <div style="display:flex;gap:16px;flex-wrap:wrap;margin-top:10px;">
          ${data.land_loss > 0 ? `<span style="font-family:var(--font-mono);font-size:11px;color:var(--accent);">🗺️ +${data.land_loss} land captured</span>` : ''}
          ${data.money_loss > 0 && data.success ? `<span style="font-family:var(--font-mono);font-size:11px;color:#16a34a;">💰 +$${Math.floor(data.money_loss/2).toLocaleString()} looted</span>` : ''}
          ${data.def_soldiers_lost > 0 ? `<span style="font-family:var(--font-mono);font-size:11px;color:#e05252;">⚔️ ${data.def_soldiers_lost.toLocaleString()} enemy soldiers killed</span>` : ''}
          ${data.att_soldiers_lost > 0 ? `<span style="font-family:var(--font-mono);font-size:11px;color:#f59e0b;">💀 ${data.att_soldiers_lost.toLocaleString()} of your soldiers lost</span>` : ''}
          ${data.sec_loss > 0 && data.success ? `<span style="font-family:var(--font-mono);font-size:11px;color:#e05252;">🛡️ -${data.sec_loss} enemy security</span>` : ''}
        </div>
      ` : ''}
    </div>
  `;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function aStat(icon, label, value, color) {
  return `
    <div style="background:var(--surface);border:1.5px solid var(--border);border-radius:8px;padding:0.8rem;text-align:center;">
      <div style="font-size:16px;margin-bottom:2px;">${icon}</div>
      <div style="font-family:var(--font-title);font-size:18px;letter-spacing:1px;color:${color};">${value}</div>
      <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted);letter-spacing:1px;text-transform:uppercase;">${label}</div>
    </div>
  `;
}

function loadingHTML(msg) {
  return `<div class="page"><div style="font-family:var(--font-mono);font-size:13px;color:var(--text-muted);letter-spacing:2px;">${msg}</div></div>`;
}
