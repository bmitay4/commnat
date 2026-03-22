import { sb } from '../supabase.js';
import i18n from '../i18n.js';
const t = (k, p) => i18n.t(k, p);
import { renderPageTopbar, bindPageNav } from '../nav.js';

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

function upgradeCost(baseKey, capKey, currentLevel) {
  if (currentLevel >= CFG.intel_cap_level) return CFG[capKey];
  return CFG[baseKey] * (currentLevel + 1);
}
function upgradeLabel(currentLevel) {
  if (currentLevel >= CFG.intel_cap_level) return t('intelligence.upgradeLevelCapLabel', { level: currentLevel + 1 });
  return t('intelligence.upgradeLevelLabel', { level: currentLevel + 1 });
}

// All missions definition
function getMissions(intel) {
  return [
    // Satellite recon
    { id: 'recon_military',     asset: 'satellite', cat: 'satellite', turns: 1,  name: t('intelligence.missionReconMilitary'),    desc: t('intelligence.descReconMilitary'),    icon: '🔭', color: '#3b82f6', requires: intel.satellites },
    { id: 'recon_industrial',   asset: 'satellite', cat: 'satellite', turns: 1,  name: t('intelligence.missionReconIndustrial'),  desc: t('intelligence.descReconIndustrial'),  icon: '🏭', color: '#8b5cf6', requires: intel.satellites },
    { id: 'recon_tech',         asset: 'satellite', cat: 'satellite', turns: 1,  name: t('intelligence.missionReconTech'),        desc: t('intelligence.descReconTech'),        icon: '⚙️', color: '#f59e0b', requires: intel.satellites },
    // Spy operations
    { id: 'tech_sting',         asset: 'spy',       cat: 'spy',       turns: 20, name: t('intelligence.missionTechSting'),        desc: t('intelligence.descTechSting'),        icon: '🖥️', color: '#e05252', requires: intel.spies },
    { id: 'industrial_sabotage',asset: 'spy',       cat: 'spy',       turns: 1,  name: t('intelligence.missionIndustrialSabotage'),desc: t('intelligence.descIndustrialSabotage'),icon: '💥', color: '#dc2626', requires: intel.spies },
    { id: 'trojan_horse',       asset: 'spy',       cat: 'spy',       turns: 1,  name: t('intelligence.missionTrojanHorse'),      desc: t('intelligence.descTrojanHorse'),      icon: '🐴', color: '#8b5cf6', requires: intel.spies },
    { id: 'unit_sabotage',      asset: 'spy',       cat: 'spy',       turns: 1,  name: t('intelligence.missionUnitSabotage'),     desc: t('intelligence.descUnitSabotage'),     icon: '✈️', color: '#f59e0b', requires: intel.spies },
    // Defensive (self-targeting)
    { id: 'counter_intel',      asset: 'spy',       cat: 'defensive', turns: 2,  name: t('intelligence.missionCounterIntel'),     desc: t('intelligence.descCounterIntel'),     icon: '🛡️', color: '#16a34a', requires: intel.spies, self: true },
  ];
}

export async function renderIntelligence(user, profile, nation) {
  const app = document.getElementById('app');
  app.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:60vh;font-size:13px;color:var(--text-muted);">Loading...</div>`;

  const [
    { data: intel },
    { data: missions },
    { data: configRows },
    { data: targets },
    { data: activeDebuffs },
  ] = await Promise.all([
    sb.from('intelligence').select('*').eq('nation_id', nation.id).maybeSingle(),
    sb.from('intel_missions')
      .select('*, defender:defender_nation_id(name), attacker:attacker_nation_id(name)')
      .or(`attacker_nation_id.eq.${nation.id},defender_nation_id.eq.${nation.id}`)
      .order('executed_at', { ascending: false }).limit(12),
    sb.from('game_config').select('key, value').like('key', 'intel_%'),
    sb.from('rankings').select('nation_id, nation_name, alliance_tag, overall_rank').eq('round', nation.round).neq('nation_id', nation.id).order('overall_rank', { ascending: true }),
    sb.from('nation_debuffs').select('*').eq('nation_id', nation.id).gt('expires_at', new Date().toISOString()),
  ]);

  (configRows || []).forEach(r => { if (CFG[r.key] !== undefined) CFG[r.key] = Number(r.value) || CFG[r.key]; });

  if (!intel) {
    await sb.from('intelligence').insert({ nation_id: nation.id });
    return renderIntelligence(user, profile, nation);
  }

  const totalMaint2h = (intel.spies * CFG.intel_spy_maint_2h) + (intel.satellites * CFG.intel_sat_maint_2h);
  const smokescreenActive = intel.smokescreen_active && intel.smokescreen_expires_at && new Date(intel.smokescreen_expires_at) > new Date();
  const alertnessActive = (activeDebuffs || []).some(d => d.debuff_type === 'alertness_bonus');
  const trojanActive = (activeDebuffs || []).some(d => d.debuff_type === 'trojan_horse_active');

  app.innerHTML = `
    ${renderPageTopbar(user, profile, nation, 'intelligence')}
    <div class="inner-page-wide">

      <!-- Header -->
      <div class="inner-topbar">
        <div class="inner-title-wrap">
          <span style="font-size:24px;">🔍</span>
          <div>
            <div class="inner-title">${t('intelligence.title')}</div>
            <div class="inner-sub">${nation.name} · ${t('intelligence.techLvSub', {lv: intel.tech_level, maint: totalMaint2h.toLocaleString()})}</div>
          </div>
        </div>
        <!-- Status badges -->
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
          ${smokescreenActive ? `
            <div style="background:rgba(22,163,74,0.1);border:1.5px solid #16a34a;border-radius:20px;padding:5px 12px;font-size:12px;font-weight:700;color:#16a34a;">
              🌫️ ${t('intelligence.smokescreenActive')}
            </div>` : ''}
          ${alertnessActive ? `
            <div style="background:rgba(220,38,38,0.1);border:1.5px solid #dc2626;border-radius:20px;padding:5px 12px;font-size:12px;font-weight:700;color:#dc2626;">
              🚨 ${t('intelligence.alertnessActive')}
            </div>` : ''}
          ${trojanActive ? `
            <div style="background:rgba(139,92,246,0.1);border:1.5px solid #8b5cf6;border-radius:20px;padding:5px 12px;font-size:12px;font-weight:700;color:#8b5cf6;">
              ${t('intelligence.trojanActive')}
            </div>` : ''}
        </div>
      </div>

      <!-- Message -->
      <div class="msg" id="intel-msg" style="margin-bottom:12px;"></div>

      <!-- Stats row -->
      <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:16px;">
        ${iStat('🕵️', intel.spies, t('intelligence.spiesTitle'), t('intelligence.levelNum',{level:intel.spy_level}))}
        ${iStat('🛰️', intel.satellites, t('intelligence.satellitesTitle'), t('intelligence.levelNum',{level:intel.sat_level}))}
        ${iStat('🛡️', t('intelligence.levelNum',{level:intel.anti_spy_level}), t('intelligence.counterIntelTitle'), `-${intel.anti_spy_level * 12}%`)}
        ${iStat('📡', t('intelligence.levelNum',{level:intel.anti_sat_level}), t('intelligence.antiSatTitle'), `-${intel.anti_sat_level * 12}%`)}
        ${iStat('⚗️', t('intelligence.levelNum',{level:intel.tech_level}), t('intelligence.techTitle'), t('intelligence.techSuccessBonus', {pct: intel.tech_level * 5}))}
      </div>

      <!-- Two-column layout: Assets left, Missions right -->
      <div style="display:grid;grid-template-columns:340px 1fr;gap:16px;margin-bottom:16px;">

        <!-- LEFT: Asset management -->
        <div style="display:flex;flex-direction:column;gap:12px;">

          ${assetCard('spy', t('intelligence.spiesTitle'), intel.spies, intel.spy_level, nation.money,
            t('intelligence.spyDesc'),
            [
              { label: t('intelligence.recruitSpy'), action: 'buy_spy', cost: CFG.intel_spy_base_cost, desc: t('intelligence.spyMaintDesc', { maint: CFG.intel_spy_maint_2h }) },
              { label: upgradeLabel(intel.spy_level), action: 'upgrade_spy',
                cost: upgradeCost('intel_spy_level_cost', 'intel_spy_cap_price', intel.spy_level),
                desc: t('intelligence.successPerLevel') },
            ]
          )}

          ${assetCard('satellite', t('intelligence.satellitesTitle'), intel.satellites, intel.sat_level, nation.money,
            t('intelligence.satDesc'),
            [
              { label: t('intelligence.launchSat'), action: 'buy_sat', cost: CFG.intel_sat_base_cost, desc: t('intelligence.satMaintDesc', { maint: CFG.intel_sat_maint_2h }) },
              { label: upgradeLabel(intel.sat_level), action: 'upgrade_sat',
                cost: upgradeCost('intel_sat_level_cost', 'intel_sat_cap_price', intel.sat_level),
                desc: t('intelligence.scanSuccessPerLevel') },
            ]
          )}

          <!-- Defenses compact -->
          <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:16px 18px;box-shadow:var(--shadow-sm);">
            <div style="font-size:13px;font-weight:700;margin-bottom:12px;color:var(--text);">${t('intelligence.defensesAndTech')}</div>
            <div style="display:flex;flex-direction:column;gap:8px;">
              ${defRow('anti_spy', t('intelligence.counterIntelTitle'), intel.anti_spy_level, nation.money,
                upgradeCost('intel_anti_spy_cost', 'intel_anti_spy_cap_price', intel.anti_spy_level))}
              ${defRow('anti_sat', t('intelligence.antiSatTitle'), intel.anti_sat_level, nation.money,
                upgradeCost('intel_anti_sat_cost', 'intel_anti_sat_cap_price', intel.anti_sat_level))}
              ${defRow('tech', t('intelligence.techTitle'), intel.tech_level, nation.money,
                upgradeCost('intel_tech_level_cost', 'intel_tech_cap_price', intel.tech_level))}
            </div>
          </div>
        </div>

        <!-- RIGHT: Mission launcher -->
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:18px 20px;box-shadow:var(--shadow-sm);">
          <div style="font-size:15px;font-weight:700;margin-bottom:4px;">${t('intelligence.operationsTitle')}</div>
          <div style="font-size:12px;color:var(--text-muted);margin-bottom:14px;">${t('intelligence.operationsSub')}</div>

          <!-- Target selector -->
          <div style="margin-bottom:14px;">
            <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">${t('intelligence.selectTargetNation')}</div>
            <select id="mission-target" style="width:100%;background:var(--surface2);border:1.5px solid var(--border);border-radius:var(--radius-md);color:var(--text);font-family:var(--font-body);font-size:13px;padding:9px 12px;outline:none;">
              <option value="">${t('intelligence.chooseTarget')}</option>
              <option value="self">— ${t('intelligence.selfMission')} —</option>
              ${(targets || []).map(n => `<option value="${n.nation_id}">#${n.overall_rank} · ${n.nation_name}${n.alliance_tag ? ' [' + n.alliance_tag + ']' : ''}</option>`).join('')}
            </select>
          </div>

          <!-- Mission cards grid -->
          <div style="display:flex;flex-direction:column;gap:10px;">
            ${['satellite', 'spy', 'defensive'].map(cat => {
              const catMissions = getMissions(intel).filter(m => m.cat === cat);
              const catLabel = cat === 'satellite' ? t('intelligence.catSatellite') : cat === 'spy' ? t('intelligence.catSpy') : t('intelligence.catDefensive');
              return `
                <div>
                  <div style="font-size:10px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid var(--border);">
                    ${catLabel}
                  </div>
                  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px;">
                    ${catMissions.map(m => missionCard(m, intel, nation.turns)).join('')}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>

      <!-- Mission result panel -->
      <div id="mission-result" style="display:none;margin-bottom:16px;"></div>

      <!-- Mission log -->
      ${(missions || []).length > 0 ? `
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;box-shadow:var(--shadow-sm);">
          <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted);letter-spacing:2px;
            padding:8px 1rem;background:var(--surface2);border-bottom:1px solid var(--border);">
            ${t('intelligence.missionLog')}
          </div>
          ${(missions || []).map(m => missionRow(m, nation.id)).join('')}
        </div>
      ` : ''}

    </div>
  `;

  window.__intelMissions = missions || [];
  bindPageNav(user, profile, nation);
  bindIntelEvents(user, profile, nation, intel);
}

// ─── Components ───────────────────────────────────────────────────────────────

function missionCard(m, intel, turns) {
  const hasAsset = m.requires > 0;
  const canAfford = turns >= m.turns;
  const dimmed = !hasAsset;
  const noTurns = !canAfford;
  return `
    <div class="mission-card" data-mission="${m.id}" data-asset="${m.asset}"
      style="background:var(--surface2);border:1.5px solid ${hasAsset && !dimmed ? m.color + '44' : 'var(--border)'};
      border-top:3px solid ${hasAsset ? m.color : 'var(--border)'};
      border-radius:var(--radius-md);padding:12px 14px;
      opacity:${dimmed ? '0.45' : '1'};cursor:${dimmed ? 'not-allowed' : 'pointer'};
      transition:all 0.15s;position:relative;">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:6px;margin-bottom:6px;">
        <div style="font-size:18px;">${m.icon}</div>
        <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;
          color:${m.color};background:${m.color}18;border:1px solid ${m.color}44;
          padding:2px 5px;border-radius:4px;flex-shrink:0;">${m.turns}T</span>
      </div>
      <div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:4px;line-height:1.3;">${m.name}</div>
      <div style="font-size:11px;color:var(--text-muted);line-height:1.4;margin-bottom:8px;">${m.desc}</div>
      <div style="font-family:var(--font-mono);font-size:10px;color:${!hasAsset ? '#e05252' : 'var(--text-dim)'};">
        ${!hasAsset ? (m.asset === 'spy' ? t('intelligence.noSpies') : t('intelligence.noSats')) : (m.asset === 'spy' ? `🕵️ ${intel.spies} ${t('intelligence.spiesTitle')}` : `🛰️ ${intel.satellites} ${t('intelligence.satellitesTitle')}`)}
        ${noTurns && hasAsset ? `<span style="color:#e05252;"> · ${t('intelligence.notEnoughTurns')}</span>` : ''}
      </div>
      ${!dimmed ? `
        <button class="btn-launch-mission" data-mission="${m.id}" data-asset="${m.asset}"
          ${noTurns ? 'disabled' : ''}
          style="margin-top:8px;width:100%;font-family:var(--font-mono);font-size:11px;font-weight:700;
          padding:6px;border-radius:var(--radius-sm);cursor:${noTurns ? 'not-allowed' : 'pointer'};
          border:1.5px solid ${noTurns ? 'var(--border)' : m.color};
          background:${noTurns ? 'transparent' : m.color + '18'};
          color:${noTurns ? 'var(--text-muted)' : m.color};
          opacity:${noTurns ? '0.5' : '1'};">
          ${t('intelligence.launchMission')}
        </button>
      ` : ''}
    </div>
  `;
}

function assetCard(type, title, count, level, money, desc, actions) {
  return `
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:16px 18px;box-shadow:var(--shadow-sm);">
      <div style="font-size:13px;font-weight:700;margin-bottom:3px;">${title}</div>
      <div style="font-size:11px;color:var(--text-muted);margin-bottom:12px;">${desc}</div>
      <div style="display:flex;gap:8px;margin-bottom:12px;">
        <div style="flex:1;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-md);padding:8px;text-align:center;">
          <div style="font-size:20px;font-weight:800;color:var(--accent);">${count}</div>
          <div style="font-size:9px;color:var(--text-muted);font-weight:700;text-transform:uppercase;">${t('intelligence.units')}</div>
        </div>
        <div style="flex:1;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-md);padding:8px;text-align:center;">
          <div style="font-size:20px;font-weight:800;color:var(--accent-2);">${level || '—'}</div>
          <div style="font-size:9px;color:var(--text-muted);font-weight:700;text-transform:uppercase;">${t('intelligence.levelLabel')}</div>
        </div>
        <div style="flex:1;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-md);padding:8px;text-align:center;">
          <div style="font-size:16px;font-weight:800;color:var(--success);">${Math.round(successChance(type, level) * 100)}%</div>
          <div style="font-size:9px;color:var(--text-muted);font-weight:700;text-transform:uppercase;">${t('intelligence.baseChance')}</div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;">
        ${actions.map(a => `
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
            <div style="font-size:11px;color:var(--text-muted);">${a.desc}</div>
            ${upgradeBtn(a.action, a.label, a.cost, money)}
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function defRow(action, label, level, money, cost) {
  return `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 0;border-bottom:1px solid var(--border-dim);">
      <div>
        <div style="font-size:12px;font-weight:600;color:var(--text);">${label} <span style="color:var(--accent);">${t('intelligence.levelNum',{level})}</span></div>
        <div style="font-size:10px;color:var(--text-muted);">${action === 'tech' ? t('intelligence.techSuccessBonus', {pct: level * 5}) : t('intelligence.enemyPenaltyPct', {pct: level * 12})}</div>
      </div>
      ${upgradeBtn('upgrade_' + action, upgradeLabel(level), cost, money)}
    </div>
  `;
}

function upgradeBtn(action, label, cost, money) {
  const canAfford = money >= cost;
  return `
    <button class="intel-btn btn" data-action="${action}" ${!canAfford ? 'disabled' : ''}
      style="font-size:11px;padding:6px 10px;white-space:nowrap;flex-shrink:0;
      ${!canAfford ? 'opacity:0.5;cursor:not-allowed;' : ''}
      background:${canAfford ? 'var(--accent)' : 'var(--surface2)'};
      color:${canAfford ? '#fff' : 'var(--text-muted)'};
      border:1.5px solid ${canAfford ? 'var(--accent)' : 'var(--border)'};
      border-radius:var(--radius-md);">
      ${label} · $${cost.toLocaleString()}
    </button>
  `;
}

function iStat(icon, val, lbl, sub) {
  return `
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:12px 14px;box-shadow:var(--shadow-sm);">
      <div style="font-size:16px;margin-bottom:4px;">${icon}</div>
      <div style="font-size:17px;font-weight:800;color:var(--accent);line-height:1;">${val}</div>
      <div style="font-size:10px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.3px;margin-top:2px;">${lbl}</div>
      <div style="font-size:10px;color:var(--text-dim);margin-top:2px;">${sub}</div>
    </div>
  `;
}

function missionRow(m, myNationId) {
  const isAttacker = m.attacker_nation_id === myNationId;
  const isSelf = m.attacker_nation_id === m.defender_nation_id;
  const opponent = isSelf ? null : (isAttacker ? m.defender : m.attacker);
  const win = m.success;
  const missionNames = {
    recon_military: t('intelligence.missionReconMilitary_log'),
    recon_industrial: t('intelligence.missionReconIndustrial_log'),
    recon_tech: t('intelligence.missionReconTech_log'),
    tech_sting: t('intelligence.missionTechSting_log'),
    industrial_sabotage: t('intelligence.missionIndustrialSabotage_log'),
    trojan_horse: t('intelligence.missionTrojanHorse_log'),
    unit_sabotage: t('intelligence.missionUnitSabotage_log'),
    counter_intel: t('intelligence.missionCounterIntel_log'),
  };
  const missionLabel = missionNames[m.mission_type] || m.mission_type;
  return `
    <div class="intel-log-row" data-mission-id="${m.id}"
      style="display:flex;align-items:flex-start;gap:10px;padding:10px 16px;border-bottom:1px solid var(--border-dim);cursor:pointer;transition:background 0.15s;"
      onmouseenter="this.style.background='var(--surface2)'" onmouseleave="this.style.background=''">
      <div style="width:8px;height:8px;border-radius:50%;flex-shrink:0;margin-top:5px;background:${win ? 'var(--success)' : 'var(--danger)'};">
      </div>
      <div style="flex:1;">
        <div style="font-size:12px;font-weight:600;">
          ${missionLabel}
          ${isSelf ? '' : (isAttacker ? ` → <strong>${opponent?.name || '?'}</strong>` : ` ← <strong>${opponent?.name || '?'}</strong>`)}
        </div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">${translateMissionSummary(m.result_summary, m.mission_type)}</div>
      </div>
      <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
        <div style="font-size:10px;color:var(--text-dim);font-family:var(--font-mono);">
          ${new Date(m.executed_at).toLocaleTimeString()}
        </div>
        <div style="font-size:9px;color:var(--accent);text-decoration:underline;">${t('intelligence.viewReport')}</div>
      </div>
    </div>
  `;
}

function successChance(type, level) {
  if (type === 'spy')       return Math.min(0.95, 0.45 + level * 0.08);
  if (type === 'satellite') return Math.min(0.95, 0.50 + level * 0.08);
  return 0.5;
}

// ─── Mission result rendering ──────────────────────────────────────────────────

function showMissionResult(data, missionId, targetName) {
  const el = document.getElementById('mission-result');
  if (!el) return;
  el.style.display = 'block';

  const success = data.success;
  const c = success
    ? { bg: 'rgba(22,163,74,0.08)', border: '#16a34a', text: '#16a34a' }
    : { bg: 'rgba(220,38,38,0.08)', border: '#dc2626', text: '#dc2626' };

  let extraHtml = '';
  const rd = data.result_data || {};

  if (success && rd.units) {
    const unitEntries = Object.entries(rd.units).filter(([, v]) => v > 0);
    if (unitEntries.length) {
      extraHtml += `<div style="margin-top:10px;">
        <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">
          ${t('intelligence.resultUnits')}${rd.smokescreen_warning ? ' ⚠️' : ''}
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">
          ${unitEntries.map(([unit, qty]) => `
            <span style="background:var(--surface2);border:1px solid var(--border);border-radius:4px;padding:3px 8px;font-family:var(--font-mono);font-size:11px;">
              ${unit.replace(/_/g,' ')}: <strong>${Number(qty).toLocaleString()}</strong>
            </span>`).join('')}
        </div>
      </div>`;
    }
  }

  if (success && rd.facilities) {
    const facEntries = Object.entries(rd.facilities).filter(([, v]) => v > 0);
    if (facEntries.length) {
      extraHtml += `<div style="margin-top:10px;">
        <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">
          ${t('intelligence.resultFacilities')} · ${t('intelligence.resultLand')}: ${rd.land}
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">
          ${facEntries.map(([fac, qty]) => `
            <span style="background:var(--surface2);border:1px solid var(--border);border-radius:4px;padding:3px 8px;font-family:var(--font-mono);font-size:11px;">
              ${fac.replace(/_/g,' ')}: <strong>${qty}</strong>
            </span>`).join('')}
        </div>
      </div>`;
    }
  }

  if (success && rd.tech_levels) {
    const techEntries = Object.entries(rd.tech_levels).filter(([, v]) => v > 0);
    if (techEntries.length) {
      extraHtml += `<div style="margin-top:10px;">
        <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">
          ${t('intelligence.resultTechLevels')}${rd.smokescreen_warning ? ' ⚠️' : ''}
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">
          ${techEntries.map(([unit, lv]) => `
            <span style="background:var(--surface2);border:1px solid var(--border);border-radius:4px;padding:3px 8px;font-family:var(--font-mono);font-size:11px;">
              ${unit.replace(/_/g,' ')}: <strong>${t('intelligence.levelNum',{level:lv})}</strong>
            </span>`).join('')}
        </div>
      </div>`;
    }
  }

  if (rd.smokescreen_warning) {
    extraHtml += `<div style="margin-top:8px;font-size:11px;color:#f59e0b;font-weight:600;">⚠️ ${t('intelligence.resultSmokescreenWarning')}</div>`;
  }

  el.innerHTML = `
    <div style="background:${c.bg};border:1.5px solid ${c.border};border-radius:var(--radius-lg);padding:16px 20px;position:relative;">
      <button id="btn-dismiss-mission" style="position:absolute;top:10px;inset-inline-end:12px;background:none;border:none;font-size:18px;cursor:pointer;color:var(--text-muted);">✕</button>
      <div style="font-size:16px;font-weight:800;color:${c.text};margin-bottom:6px;">
        ${success ? '✅ ' + t('intelligence.successSpy') : '❌ ' + t('intelligence.failSpy')}
        ${targetName ? `<span style="font-size:13px;font-weight:500;color:var(--text-muted);"> → ${targetName}</span>` : ''}
      </div>
      <div style="font-size:12px;color:var(--text-muted);line-height:1.6;">${data.summary}</div>
      ${extraHtml}
    </div>
  `;
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  document.getElementById('btn-dismiss-mission')?.addEventListener('click', () => { el.style.display = 'none'; });
}

// ─── Events ───────────────────────────────────────────────────────────────────

function bindIntelEvents(user, profile, nation, intel) {
  // Mission log row clicks
  document.querySelectorAll('.intel-log-row').forEach(row => {
    row.addEventListener('click', () => {
      const missionId = row.getAttribute('data-mission-id');
      const mission = (window.__intelMissions || []).find(m => m.id === missionId);
      if (mission) openMissionReport(mission, nation.id);
    });
  });

  // Asset upgrade buttons
  document.querySelectorAll('.intel-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      await handleIntelAction(btn.getAttribute('data-action'), user, profile, nation, intel);
    });
  });

  // Mission launch buttons
  document.querySelectorAll('.btn-launch-mission').forEach(btn => {
    btn.addEventListener('click', async () => {
      const missionId = btn.getAttribute('data-mission');
      const targetSelect = document.getElementById('mission-target');
      const targetId = targetSelect?.value;
      const targetName = targetSelect?.selectedOptions[0]?.text;

      if (!targetId) { showMsg('error', t('intelligence.operationsSub')); return; }

      const isSelf = targetId === 'self';
      if (isSelf && missionId !== 'counter_intel') {
        showMsg('error', t('intelligence.errNeedTarget')); return;
      }
      if (!isSelf && missionId === 'counter_intel') {
        showMsg('error', t('intelligence.errSelfOnly')); return;
      }

      document.querySelectorAll('.btn-launch-mission').forEach(b => b.disabled = true);

      const { data, error } = await sb.rpc('resolve_intel_mission', {
        p_attacker_id:  nation.id,
        p_defender_id:  isSelf ? nation.id : targetId,
        p_mission_type: missionId,
        p_asset_used:   btn.getAttribute('data-asset'),
      });

      document.querySelectorAll('.btn-launch-mission').forEach(b => b.disabled = false);

      if (error || data?.error) {
        const msg = { not_enough_turns: t('attacks.errNotEnoughTurns'), attacker_not_found: 'Nation not found', no_intel_record: 'No intel record' };
        showMsg('error', msg[data?.error || error?.message] || data?.error || error?.message);
        return;
      }

      showMissionResult(data, missionId, isSelf ? null : targetName);
      setTimeout(() => renderIntelligence(user, profile, { ...nation, turns: nation.turns - getMissions(intel).find(m => m.id === missionId)?.turns }), 2000);
    });
  });
}

async function handleIntelAction(action, user, profile, nation, intel) {
  const updates = {};
  let cost = 0;
  switch (action) {
    case 'buy_spy':      cost = CFG.intel_spy_base_cost; updates.spies = intel.spies + 1; break;
    case 'buy_sat':      cost = CFG.intel_sat_base_cost; updates.satellites = intel.satellites + 1; break;
    case 'upgrade_spy':  cost = upgradeCost('intel_spy_level_cost', 'intel_spy_cap_price', intel.spy_level); updates.spy_level = intel.spy_level + 1; break;
    case 'upgrade_sat':  cost = upgradeCost('intel_sat_level_cost', 'intel_sat_cap_price', intel.sat_level); updates.sat_level = intel.sat_level + 1; break;
    case 'upgrade_anti_spy': cost = upgradeCost('intel_anti_spy_cost', 'intel_anti_spy_cap_price', intel.anti_spy_level); updates.anti_spy_level = intel.anti_spy_level + 1; break;
    case 'upgrade_anti_sat': cost = upgradeCost('intel_anti_sat_cost', 'intel_anti_sat_cap_price', intel.anti_sat_level); updates.anti_sat_level = intel.anti_sat_level + 1; break;
    case 'upgrade_tech': cost = upgradeCost('intel_tech_level_cost', 'intel_tech_cap_price', intel.tech_level); updates.tech_level = intel.tech_level + 1; break;
    default: return;
  }
  if (nation.money < cost) { showMsg('error', t('intelligence.errNotEnough', { need: cost.toLocaleString(), have: nation.money.toLocaleString() })); return; }

  const { error: ie } = await sb.from('intelligence').update({ ...updates, updated_at: new Date().toISOString() }).eq('nation_id', nation.id);
  if (ie) { showMsg('error', ie.message); return; }
  await sb.from('nations').update({ money: nation.money - cost }).eq('id', nation.id);
  try { await sb.from('activity_logs').insert({ user_id: user.id, nation_id: nation.id, action: 'intel_purchase', details: { action, cost } }); } catch (_) {}
  showMsg('success', t('intelligence.doneSuccess', { cost: cost.toLocaleString() }));
  setTimeout(() => renderIntelligence(user, profile, { ...nation, money: nation.money - cost }), 800);
}



// Translate DB result summaries to current language
function translateMissionSummary(summary, missionType) {
  if (!summary) return '';
  const summaryMap = {
    'Military reconnaissance complete. Unit positions mapped.': t('intelligence.sumReconMilitary'),
    'Industrial scan complete. Facility layout and land usage captured.': t('intelligence.sumReconIndustrial'),
    'Tech scan complete. Enemy upgrade levels identified.': t('intelligence.sumReconTech'),
    'Signal lost due to electronic jamming. Satellites blinded.': t('intelligence.sumJammed'),
    'Smokescreen deployed. Enemy recon will receive false data for 12 hours.': t('intelligence.sumSmokescreen'),
    'System crash! Your real data is now more accessible to enemy recon for 6 hours.': t('intelligence.sumSmokecrash'),
    'Spies compromised. Defender is now on high alert for 24 hours.': t('intelligence.sumTechStingFail'),
    'Blockade broken! Your trade routes are restored.': t('intelligence.sumBlockadeBroken'),
  };
  // Check for partial matches for dynamic summaries
  if (summary.includes('Tech-Sting succeeded')) return t('intelligence.sumTechStingSuccess');
  if (summary.includes('Industrial sabotage succeeded')) return t('intelligence.sumSabotageSuccess');
  if (summary.includes('Spies captured and confessed')) return t('intelligence.sumSabotageFail');
  if (summary.includes('Trojan Horse deployed')) return t('intelligence.sumTrojanSuccess');
  if (summary.includes('Intrusion detected')) return t('intelligence.sumTrojanFail');
  if (summary.includes('Unit sabotage successful')) return t('intelligence.sumUnitSabotageSuccess');
  if (summary.includes('Agents neutralized')) return t('intelligence.sumUnitSabotageFail');
  if (summary.includes('no upgradeable units')) return t('intelligence.sumTechStingNoTarget');
  return summaryMap[summary] || summary; // fallback to original
}

// ─── Mission report popup ─────────────────────────────────────────────────────

function openMissionReport(m, myNationId) {
  document.getElementById('intel-report-overlay')?.remove();

  const isAttacker = m.attacker_nation_id === myNationId;
  const isSelf = m.attacker_nation_id === m.defender_nation_id;
  const opponent = isSelf ? null : (isAttacker ? m.defender : m.attacker);
  const win = m.success;
  const rd = m.result_data || {};

  const missionNames = {
    recon_military: t('intelligence.missionReconMilitary'),
    recon_industrial: t('intelligence.missionReconIndustrial'),
    recon_tech: t('intelligence.missionReconTech'),
    tech_sting: t('intelligence.missionTechSting'),
    industrial_sabotage: t('intelligence.missionIndustrialSabotage'),
    trojan_horse: t('intelligence.missionTrojanHorse'),
    unit_sabotage: t('intelligence.missionUnitSabotage'),
    counter_intel: t('intelligence.missionCounterIntel'),
  };

  const c = win
    ? { bg: 'rgba(22,163,74,0.07)', border: 'rgba(22,163,74,0.4)', text: '#16a34a', label: '✅ ' + t('intelligence.successSpy') }
    : { bg: 'rgba(220,38,38,0.07)', border: 'rgba(220,38,38,0.4)', text: '#dc2626', label: '❌ ' + t('intelligence.failSpy') };

  // Build result detail HTML
  let detailHtml = '';

  if (rd.units) {
    const entries = Object.entries(rd.units).filter(([,v]) => v > 0);
    if (entries.length) detailHtml += `
      <div style="margin-bottom:12px;">
        <div style="font-size:10px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">${t('intelligence.resultUnits')}${rd.smokescreen_warning ? ' ⚠️' : ''}</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">
          ${entries.map(([u,q]) => `<span style="background:var(--surface2);border:1px solid var(--border);border-radius:4px;padding:4px 10px;font-family:var(--font-mono);font-size:11px;">${u.replace(/_/g,' ')}: <strong>${Number(q).toLocaleString()}</strong></span>`).join('')}
        </div>
      </div>`;
  }
  if (rd.facilities) {
    const entries = Object.entries(rd.facilities).filter(([,v]) => v > 0);
    if (entries.length) detailHtml += `
      <div style="margin-bottom:12px;">
        <div style="font-size:10px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">${t('intelligence.resultFacilities')} · ${t('intelligence.resultLand')}: ${rd.land}</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">
          ${entries.map(([f,q]) => `<span style="background:var(--surface2);border:1px solid var(--border);border-radius:4px;padding:4px 10px;font-family:var(--font-mono);font-size:11px;">${f.replace(/_/g,' ')}: <strong>${q}</strong></span>`).join('')}
        </div>
      </div>`;
  }
  if (rd.tech_levels) {
    const entries = Object.entries(rd.tech_levels).filter(([,v]) => v > 0);
    if (entries.length) detailHtml += `
      <div style="margin-bottom:12px;">
        <div style="font-size:10px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">${t('intelligence.resultTechLevels')}${rd.smokescreen_warning ? ' ⚠️' : ''}</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">
          ${entries.map(([u,lv]) => `<span style="background:var(--surface2);border:1px solid var(--border);border-radius:4px;padding:4px 10px;font-family:var(--font-mono);font-size:11px;">${u.replace(/_/g,' ')}: <strong>${t('intelligence.levelLabel',{level:lv})}</strong></span>`).join('')}
        </div>
      </div>`;
  }
  if (rd.target_unit) detailHtml += `
    <div style="background:rgba(220,38,38,0.08);border:1px solid #dc262644;border-radius:6px;padding:10px 14px;margin-bottom:12px;font-family:var(--font-mono);font-size:12px;color:#dc2626;">
      🖥️ ${rd.target_unit.replace(/_/g,' ')}: ${t('intelligence.levelLabel',{level:rd.old_level})} → ${t('intelligence.levelLabel',{level:rd.new_level})}
    </div>`;
  if (rd.sec_drop) detailHtml += `
    <div style="background:rgba(220,38,38,0.08);border:1px solid #dc262644;border-radius:6px;padding:10px 14px;margin-bottom:12px;font-family:var(--font-mono);font-size:12px;color:#dc2626;">
      🛡️ ${t('intelligence.resultSecDrop', {pts: rd.sec_drop})}
    </div>`;
  if (rd.self_sec_drop) detailHtml += `
    <div style="background:rgba(220,38,38,0.08);border:1px solid #dc262644;border-radius:6px;padding:10px 14px;margin-bottom:12px;font-family:var(--font-mono);font-size:12px;color:#dc2626;">
      🛡️ ${t('intelligence.resultSelfSecDrop', {pts: rd.self_sec_drop})}
    </div>`;
  if (rd.jets_destroyed > 0 || rd.helis_destroyed > 0) detailHtml += `
    <div style="background:rgba(22,163,74,0.08);border:1px solid #16a34a44;border-radius:6px;padding:10px 14px;margin-bottom:12px;font-family:var(--font-mono);font-size:12px;color:#16a34a;">
      ✈️ ${rd.jets_destroyed} jets · 🚁 ${rd.helis_destroyed} helis ${t('intelligence.resultDestroyed')}
    </div>`;
  if (rd.disable_pct) detailHtml += `
    <div style="background:rgba(139,92,246,0.08);border:1px solid #8b5cf644;border-radius:6px;padding:10px 14px;margin-bottom:12px;font-family:var(--font-mono);font-size:12px;color:#8b5cf6;">
      🐴 ${Math.round(rd.disable_pct * 100)}% ABM/AA ${t('intelligence.resultDisabled')} · 30 min
    </div>`;
  if (rd.smokescreen_hours) detailHtml += `
    <div style="background:rgba(22,163,74,0.08);border:1px solid #16a34a44;border-radius:6px;padding:10px 14px;margin-bottom:12px;font-family:var(--font-mono);font-size:12px;color:#16a34a;">
      🌫️ ${t('intelligence.resultSmokescreen', {h: rd.smokescreen_hours})}
    </div>`;
  if (rd.spies_lost > 0) detailHtml += `
    <div style="background:rgba(220,38,38,0.08);border:1px solid #dc262644;border-radius:6px;padding:10px 14px;margin-bottom:12px;font-family:var(--font-mono);font-size:12px;color:#dc2626;">
      🕵️ ${t('intelligence.resultSpiesLost', {n: rd.spies_lost})}
    </div>`;
  if (rd.smokescreen_warning) detailHtml += `
    <div style="color:#f59e0b;font-size:11px;font-weight:600;margin-bottom:8px;">⚠️ ${t('intelligence.resultSmokescreenWarning')}</div>`;

  const date = new Date(m.executed_at);
  const overlay = document.createElement('div');
  overlay.id = 'intel-report-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.5);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;padding:16px;';
  overlay.innerHTML = `
    <div style="background:var(--surface);border:1.5px solid ${c.border};border-top:4px solid ${c.text};border-radius:12px;width:100%;max-width:540px;max-height:85vh;overflow-y:auto;box-shadow:0 24px 60px rgba(0,0,0,0.3);position:relative;">
      <button id="close-intel-report" style="position:absolute;top:12px;inset-inline-end:14px;background:none;border:none;font-size:20px;cursor:pointer;color:var(--text-muted);">✕</button>
      <div style="padding:20px 24px 16px;border-bottom:1px solid var(--border);">
        <div style="font-size:20px;font-weight:800;color:${c.text};margin-bottom:6px;">${c.label}</div>
        <div style="font-size:13px;font-weight:600;color:var(--text);">
          ${missionNames[m.mission_type] || m.mission_type}
          ${opponent ? `· <span style="color:var(--accent);">${opponent.name}</span>` : ''}
        </div>
        <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);margin-top:4px;">
          ${date.toLocaleDateString()} · ${date.toLocaleTimeString()}
        </div>
      </div>
      <div style="padding:16px 24px;border-bottom:1px solid var(--border);">
        <div style="font-family:var(--font-mono);font-size:12px;color:var(--text-muted);background:var(--surface2);padding:10px 14px;border-radius:6px;border-inline-start:3px solid ${c.text};line-height:1.6;">
          ${translateMissionSummary(m.result_summary, m.mission_type) || '—'}
        </div>
      </div>
      ${detailHtml ? `<div style="padding:16px 24px;">${detailHtml}</div>` : ''}
      <div style="padding:12px 24px;display:flex;justify-content:flex-end;">
        <button id="close-intel-report-btn" style="background:var(--surface2);border:1.5px solid var(--border);border-radius:6px;color:var(--text-muted);font-family:var(--font-body);font-size:13px;font-weight:600;padding:8px 20px;cursor:pointer;">
          ${t('close')}
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  const close = () => overlay.remove();
  document.getElementById('close-intel-report').addEventListener('click', close);
  document.getElementById('close-intel-report-btn').addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); } });
}

function showMsg(type, text) {
  const el = document.getElementById('intel-msg');
  if (!el) return;
  el.textContent = text;
  el.className = 'msg ' + type + ' show';
  if (type === 'success') setTimeout(() => el.classList.remove('show'), 3000);
}
