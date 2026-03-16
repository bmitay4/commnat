import { sb } from '../supabase.js';
import i18n from '../i18n.js';
const t = (k, p) => i18n.t(k, p);
import { renderPageTopbar, bindPageNav } from '../nav.js';

// Default prices (overridden by game_config at render time)
let CFG = {
  intel_spy_base_cost:      5000,
  intel_sat_base_cost:      25000,
  intel_spy_level_cost:     15000,
  intel_sat_level_cost:     50000,
  intel_anti_spy_cost:      20000,
  intel_anti_sat_cost:      40000,
  intel_tech_level_cost:    30000,
  intel_spy_maint_2h:       200,
  intel_sat_maint_2h:       800,
  intel_cap_level:          10,
  intel_spy_cap_price:      500000,
  intel_sat_cap_price:      1500000,
  intel_anti_spy_cap_price: 750000,
  intel_anti_sat_cap_price: 1000000,
  intel_tech_cap_price:     2000000,
};

// Cost formula: levels 1–(cap-1) = base × level, cap+ = fixed cap price
function upgradeCost(baseKey, capKey, currentLevel) {
  const capLevel = CFG.intel_cap_level;
  if (currentLevel >= capLevel) return CFG[capKey];
  return CFG[baseKey] * (currentLevel + 1);
}

function upgradeLabel(currentLevel) {
  const capLevel = CFG.intel_cap_level;
  if (currentLevel >= capLevel) return t('intelligence.upgradeLevelCapLabel',{level:currentLevel+1});
  return t('intelligence.upgradeLevelLabel',{level:currentLevel+1});
}

export async function renderIntelligence(user, profile, nation) {
  const app = document.getElementById('app');
  app.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:60vh;font-size:13px;color:var(--text-muted);font-family:var(--font-body);">Loading Intelligence...</div>`;

  const [
    { data: intel },
    { data: missions },
    { data: configRows },
  ] = await Promise.all([
    sb.from('intelligence').select('*').eq('nation_id', nation.id).maybeSingle(),
    sb.from('intel_missions')
      .select('*, defender:defender_nation_id(name), attacker:attacker_nation_id(name)')
      .or(`attacker_nation_id.eq.${nation.id},defender_nation_id.eq.${nation.id}`)
      .order('executed_at', { ascending: false })
      .limit(15),
    sb.from('game_config').select('key, value').like('key', 'intel_%'),
  ]);

  // Merge config into CFG
  (configRows || []).forEach(r => {
    if (CFG[r.key] !== undefined) CFG[r.key] = Number(r.value) || CFG[r.key];
  });

  // Create intel record if missing
  if (!intel) {
    await sb.from('intelligence').insert({ nation_id: nation.id });
    return renderIntelligence(user, profile, nation);
  }

  const totalMaint2h = (intel.spies * 200) + (intel.satellites * 800);

  app.innerHTML = `
    ${renderPageTopbar(user, profile, nation, 'intelligence')}
    <div class="inner-page-wide">

      <!-- Header -->
      <div class="inner-topbar">
        <div class="inner-title-wrap">
          <span style="font-size:24px;">🔍</span>
          <div>
            <div class="inner-title">${t('intelligence.title')}</div>
            <div class="inner-sub">${nation.name} · Tech Level ${intel.tech_level} · $${totalMaint2h.toLocaleString()} maintenance/2h</div>
          </div>
        </div>
      </div>

      <!-- Message -->
      <div class="msg" id="intel-msg" style="margin-bottom:12px;"></div>

      <!-- Main grid -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">

        <!-- OFFENSIVE: Spies -->
        ${assetCard('spy', t('intelligence.spiesTitle'), intel.spies, intel.spy_level, nation.money,
          t('intelligence.spyDesc'),
          [
            { label: t('intelligence.recruitSpy'), action: 'buy_spy', cost: CFG.intel_spy_base_cost, desc: t('intelligence.spyMaintDesc',{maint:CFG.intel_spy_maint_2h}) },
            { label: upgradeLabel(intel.spy_level), action: 'upgrade_spy',
              cost: upgradeCost('intel_spy_level_cost', 'intel_spy_cap_price', intel.spy_level),
              desc: intel.spy_level >= CFG.intel_cap_level ? t('intelligence.capPrice') : t('intelligence.successPerLevel') },
          ]
        )}

        <!-- OFFENSIVE: Satellites -->
        ${assetCard('satellite', t('intelligence.satellitesTitle'), intel.satellites, intel.sat_level, nation.money,
          t('intelligence.satDesc'),
          [
            { label: t('intelligence.launchSat'), action: 'buy_sat', cost: CFG.intel_sat_base_cost, desc: t('intelligence.satMaintDesc',{maint:CFG.intel_sat_maint_2h}) },
            { label: upgradeLabel(intel.sat_level), action: 'upgrade_sat',
              cost: upgradeCost('intel_sat_level_cost', 'intel_sat_cap_price', intel.sat_level),
              desc: intel.sat_level >= CFG.intel_cap_level ? t('intelligence.capPrice') : t('intelligence.scanSuccessPerLevel') },
          ]
        )}

        <!-- DEFENSIVE: Anti-Spy -->
        ${defCard(t('intelligence.counterIntelTitle'), 'anti_spy', intel.anti_spy_level, nation.money,
          t('intelligence.counterDesc'),
          upgradeCost('intel_anti_spy_cost', 'intel_anti_spy_cap_price', intel.anti_spy_level)
        )}

        <!-- DEFENSIVE: Anti-Satellite -->
        ${defCard(t('intelligence.antiSatTitle'), 'anti_sat', intel.anti_sat_level, nation.money,
          t('intelligence.antiSatDesc'),
          upgradeCost('intel_anti_sat_cost', 'intel_anti_sat_cap_price', intel.anti_sat_level)
        )}

      </div>

      <!-- Tech Level — full width -->
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);
        padding:18px 20px;margin-bottom:16px;box-shadow:var(--shadow-sm);">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;">
          <div style="flex:1;">
            <div style="font-size:15px;font-weight:700;margin-bottom:4px;">${t('intelligence.techTitle')}</div>
            <div style="font-size:12px;color:var(--text-muted);font-weight:500;margin-bottom:12px;">
              ${t('intelligence.techDesc')} ${t('intelligence.unlimitedCapNote',{level:CFG.intel_cap_level})}
            </div>
            <div style="display:flex;gap:4px;margin-bottom:10px;">
              ${Array.from({length: Math.max(10, intel.tech_level + 2)}, (_, i) => `
                <div style="flex:1;height:8px;border-radius:4px;min-width:6px;
                  background:${i < intel.tech_level
                    ? 'linear-gradient(90deg,var(--accent),var(--accent-2))'
                    : i === intel.tech_level ? 'var(--border-dim)' : 'var(--border)'};
                  transition:background 0.3s;"></div>
              `).join('')}
            </div>
            <div style="font-size:12px;color:var(--text-muted);">
              Current: <strong>Level ${intel.tech_level}</strong>
              · ${t('intelligence.techBonus',{pct:intel.tech_level*5})}
              ${intel.tech_level >= CFG.intel_cap_level ? `· <span style="color:var(--warning);font-weight:600;">${t('intelligence.capActive')}</span>` : ''}
            </div>
          </div>
          <div style="flex-shrink:0;">
            ${upgradeBtn('upgrade_tech', upgradeLabel(intel.tech_level),
                upgradeCost('intel_tech_level_cost', 'intel_tech_cap_price', intel.tech_level), nation.money)}
          </div>
        </div>
      </div>

      <!-- Stats summary -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px;">
        ${iStat('🕵️', intel.spies, 'Spies', `Level ${intel.spy_level}`)}
        ${iStat('🛰️', intel.satellites, 'Satellites', `Level ${intel.sat_level}`)}
        ${iStat('🛡️', `Lv ${intel.anti_spy_level}`, 'Anti-Spy', `-${intel.anti_spy_level * 12}% enemy spy`)}
        ${iStat('📡', `Lv ${intel.anti_sat_level}`, 'Anti-Satellite', `-${intel.anti_sat_level * 12}% enemy sat`)}
      </div>

      <!-- Mission log -->
      ${(missions||[]).length > 0 ? `
        <div class="card">
          <div class="card-header">
            <div class="card-title">${t('intelligence.missionLog')}</div>
          </div>
          ${(missions||[]).map(m => missionRow(m, nation.id)).join('')}
        </div>
      ` : ''}

    </div>
  `;

  bindPageNav(user, profile, nation);
  bindIntelEvents(user, profile, nation, intel);
}

// ─── Components ───────────────────────────────────────────────────────────────

function assetCard(type, title, count, level, money, desc, actions) {
  return `
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);
      padding:18px 20px;box-shadow:var(--shadow-sm);">
      <div style="font-size:15px;font-weight:700;margin-bottom:4px;">${title}</div>
      <div style="font-size:12px;color:var(--text-muted);font-weight:500;margin-bottom:14px;">${desc}</div>

      <!-- Count + Level display -->
      <div style="display:flex;gap:10px;margin-bottom:14px;">
        <div style="flex:1;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-md);padding:10px;text-align:center;">
          <div style="font-size:24px;font-weight:800;color:var(--accent);">${count}</div>
          <div style="font-size:10px;color:var(--text-muted);font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-top:2px;">${t('intelligence.units')}</div>
        </div>
        <div style="flex:1;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-md);padding:10px;text-align:center;">
          <div style="font-size:24px;font-weight:800;color:var(--accent-2);">
            ${level > 0 ? level : '—'}
          </div>
          <div style="font-size:10px;color:var(--text-muted);font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-top:2px;">${t('intelligence.levelLabel')}</div>
        </div>
        <div style="flex:1;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-md);padding:10px;text-align:center;">
          <div style="font-size:18px;font-weight:800;color:var(--success);">
            ${Math.round(successChance(type, level, 0) * 100)}%
          </div>
          <div style="font-size:10px;color:var(--text-muted);font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-top:2px;">${t('intelligence.baseChance')}</div>
        </div>
      </div>

      <!-- Level progress bar -->
      <div style="display:flex;gap:3px;margin-bottom:14px;">
        ${Array.from({length: Math.max(10, level + 2)}, (_, i) => `
          <div style="flex:1;height:5px;border-radius:3px;min-width:5px;
            background:${i < level ? 'var(--accent)' : 'var(--border)'};"></div>
        `).join('')}
      </div>

      <!-- Action buttons -->
      <div style="display:flex;flex-direction:column;gap:8px;">
        ${actions.map(a => `
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;">
            <div style="font-size:12px;color:var(--text-muted);font-weight:500;">${a.desc}</div>
            ${upgradeBtn(a.action, a.label, a.cost, money, a.disabled)}
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function defCard(title, action, currentLevel, money, desc, cost) {
  const barCount = Math.max(10, currentLevel + 2);
  return `
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);
      padding:18px 20px;box-shadow:var(--shadow-sm);">
      <div style="font-size:15px;font-weight:700;margin-bottom:4px;">${title}</div>
      <div style="font-size:12px;color:var(--text-muted);font-weight:500;margin-bottom:14px;">${desc}</div>

      <div style="display:flex;gap:3px;margin-bottom:12px;">
        ${Array.from({length: barCount}, (_, i) => `
          <div style="flex:1;height:5px;border-radius:3px;min-width:5px;
            background:${i < currentLevel ? '#16a34a' : 'var(--border)'};"></div>
        `).join('')}
      </div>

      <div style="font-size:13px;color:var(--text-muted);font-weight:500;margin-bottom:12px;">
        ${t('intelligence.currentLevel',{level:currentLevel})}
        · Enemy penalty: <strong style="color:var(--success);">-${currentLevel * 12}%</strong>
        ${currentLevel >= CFG.intel_cap_level ? `· <span style="color:var(--warning);font-weight:600;">${t('intelligence.capLabel')}</span>` : ''}
      </div>

      ${upgradeBtn('upgrade_' + action, upgradeLabel(currentLevel), cost, money)}
    </div>
  `;
}

function upgradeBtn(action, label, cost, money, disabled = false) {
  const canAfford = money >= cost;
  const isDisabled = disabled || !canAfford;
  return `
    <button class="intel-btn btn" data-action="${action}"
      ${isDisabled ? 'disabled' : ''}
      style="font-size:12px;padding:7px 14px;white-space:nowrap;flex-shrink:0;
      ${isDisabled ? 'opacity:0.5;cursor:not-allowed;' : ''}
      background:${canAfford && !disabled ? 'var(--accent)' : 'var(--surface2)'};
      color:${canAfford && !disabled ? '#fff' : 'var(--text-muted)'};
      border:1.5px solid ${canAfford && !disabled ? 'var(--accent)' : 'var(--border)'};
      border-radius:var(--radius-md);">
      ${label} · $${cost.toLocaleString()}
    </button>
  `;
}

function iStat(icon, val, lbl, sub) {
  return `
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);
      padding:13px 14px;box-shadow:var(--shadow-sm);">
      <div style="font-size:18px;margin-bottom:6px;">${icon}</div>
      <div style="font-size:19px;font-weight:800;color:var(--accent);line-height:1;">${val}</div>
      <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.3px;margin-top:3px;">${lbl}</div>
      <div style="font-size:11px;color:var(--text-dim);margin-top:3px;font-weight:500;">${sub}</div>
    </div>
  `;
}

function missionRow(m, myNationId) {
  const isAttacker = m.attacker_nation_id === myNationId;
  const opponent = isAttacker ? m.defender : m.attacker;
  const win = m.success ? isAttacker : !isAttacker;
  const typeLabels = {
    spy_report: t('intelligence.missionSpy'),
    satellite_scan: t('intelligence.missionSat'),
    sabotage: t('intelligence.missionSabotage'),
    steal: t('intelligence.missionSteal'),
  };
  return `
    <div style="display:flex;align-items:flex-start;gap:10px;padding:11px 18px;
      border-bottom:1px solid var(--border-dim);">
      <div style="width:8px;height:8px;border-radius:50%;flex-shrink:0;margin-top:4px;
        background:${win ? 'var(--success)' : 'var(--danger)'};"></div>
      <div style="flex:1;">
        <div style="font-size:13px;font-weight:600;">
          ${isAttacker ? typeLabels[m.mission_type] || m.mission_type : t('intelligence.defendedAgainst') + ' ' + (typeLabels[m.mission_type] || m.mission_type)}
          ${isAttacker ? `${t('intelligence.missionOn')} <strong>${opponent?.name||'Unknown'}</strong>` : `${t('intelligence.missionBy')} <strong>${opponent?.name||'Unknown'}</strong>`}
        </div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">${m.result_summary || ''}</div>
      </div>
      <div style="font-size:11px;color:var(--text-dim);font-family:var(--font-mono);white-space:nowrap;flex-shrink:0;">
        ${new Date(m.executed_at).toLocaleTimeString()}
      </div>
    </div>
  `;
}

// Success chance preview (base, no defender counter)
function successChance(type, level, techLevel) {
  if (type === 'spy')       return Math.min(0.95, 0.45 + level * 0.1 + techLevel * 0.05);
  if (type === 'satellite') return Math.min(0.95, 0.50 + level * 0.1 + techLevel * 0.05);
  return 0.5;
}

// ─── Events ───────────────────────────────────────────────────────────────────

function bindIntelEvents(user, profile, nation, intel) {
  document.querySelectorAll('.intel-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const action = btn.getAttribute('data-action');
      btn.disabled = true;
      await handleIntelAction(action, user, profile, nation, intel);
    });
  });
}

async function handleIntelAction(action, user, profile, nation, intel) {
  const updates = {};
  let cost = 0;

  switch (action) {
    case 'buy_spy':
      cost = CFG.intel_spy_base_cost;
      updates.spies = intel.spies + 1;
      break;
    case 'buy_sat':
      cost = CFG.intel_sat_base_cost;
      updates.satellites = intel.satellites + 1;
      break;
    case 'upgrade_spy':
      cost = upgradeCost('intel_spy_level_cost', 'intel_spy_cap_price', intel.spy_level);
      updates.spy_level = intel.spy_level + 1;
      break;
    case 'upgrade_sat':
      cost = upgradeCost('intel_sat_level_cost', 'intel_sat_cap_price', intel.sat_level);
      updates.sat_level = intel.sat_level + 1;
      break;
    case 'upgrade_anti_spy':
      cost = upgradeCost('intel_anti_spy_cost', 'intel_anti_spy_cap_price', intel.anti_spy_level);
      updates.anti_spy_level = intel.anti_spy_level + 1;
      break;
    case 'upgrade_anti_sat':
      cost = upgradeCost('intel_anti_sat_cost', 'intel_anti_sat_cap_price', intel.anti_sat_level);
      updates.anti_sat_level = intel.anti_sat_level + 1;
      break;
    case 'upgrade_tech':
      cost = upgradeCost('intel_tech_level_cost', 'intel_tech_cap_price', intel.tech_level);
      updates.tech_level = intel.tech_level + 1;
      break;
    default:
      return;
  }

  if (nation.money < cost) {
    showMsg('error', t('intelligence.errNotEnough',{need:cost.toLocaleString(),have:nation.money.toLocaleString()}));
    return;
  }

  const { error: intelErr } = await sb.from('intelligence')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('nation_id', nation.id);

  if (intelErr) { showMsg('error', intelErr.message); return; }

  const { error: moneyErr } = await sb.from('nations')
    .update({ money: nation.money - cost })
    .eq('id', nation.id);

  if (moneyErr) { showMsg('error', moneyErr.message); return; }

  // Log activity
  try {
    await sb.from('activity_logs').insert({
      user_id: user.id, nation_id: nation.id,
      action: 'intel_purchase', details: { action, cost },
    });
  } catch (_) {}

  showMsg('success', t('intelligence.doneSuccess',{cost:cost.toLocaleString()}));
  setTimeout(() => renderIntelligence(user, profile, { ...nation, money: nation.money - cost }), 800);
}

function showMsg(type, text) {
  const el = document.getElementById('intel-msg');
  if (!el) return;
  el.textContent = text;
  el.className = 'msg ' + type + ' show';
  if (type === 'success') setTimeout(() => el.classList.remove('show'), 3000);
}
