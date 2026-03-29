/**
 * battleReport.js
 * Renders a full battle report popup for any attack record.
 * Fully translated via i18n.
 */

import { sb } from './supabase.js';
import i18n from './i18n.js';

const t = (key, p) => i18n.t(key, p);

export async function openBattleReport(attack, myNationId) {
  const { data: myUnits } = await sb.from('military_units')
    .select('quantity, equipment_types(id, name, attack_power, defense_power, category)')
    .eq('nation_id', myNationId);

  showPopup(attack, myNationId, myUnits || []);
}

function showPopup(a, myNationId, myUnits) {
  document.getElementById('battle-report-overlay')?.remove();

  const isAttacker = a.attacker_nation_id === myNationId;
  const opponent   = isAttacker ? a.defender : a.attacker;

  const isWin = isAttacker ? a.success : !a.success;

  const WIN_COLOR  = '#16a34a';
  const LOSS_COLOR = '#dc2626';
  const outcomeColor  = isWin ? WIN_COLOR : LOSS_COLOR;
  const outcomeBg     = isWin ? 'rgba(22,163,74,0.07)' : 'rgba(220,38,38,0.07)';
  const outcomeBorder = isWin ? 'rgba(22,163,74,0.35)' : 'rgba(220,38,38,0.35)';
  const outcomeLabel  = isWin
    ? (isAttacker ? `🏆 ${t('battleReport.victory')}` : `🛡️ ${t('battleReport.defended')}`)
    : (isAttacker ? `💀 ${t('battleReport.defeat')}`  : `⚔️ ${t('battleReport.overrun')}`);

  const attSoldiersLost = a.attacker_soldiers_lost || a.att_soldiers_lost || 0;
  const defSoldiersLost = a.defender_soldiers_lost || a.def_soldiers_lost || 0;
  const landGained      = a.land_loss        || 0;
  const moneyLooted     = (a.money_loss && a.success && isAttacker) ? Math.floor(a.money_loss / 2) : 0;
  const secLoss         = a.sec_loss         || 0;

  const mySecChange = isAttacker
    ? null
    : (a.success ? -secLoss : 0);

  const mySoldiers  = isAttacker ? attSoldiersLost : defSoldiersLost;
  const oppSoldiers = isAttacker ? defSoldiersLost : attSoldiersLost;
  const revealEnemyLosses = isAttacker ? !!a.success : !a.success;

  // Count total equipment lost (for summary bar)
  const myEquipLost  = isAttacker ? a.attacker_equipment_lost : a.defender_equipment_lost;
  const oppEquipLost = isAttacker ? a.defender_equipment_lost : a.attacker_equipment_lost;
  const countEquip   = obj => obj && typeof obj === 'object' ? Object.values(obj).reduce((s, v) => s + (v || 0), 0) : 0;
  const myEquipTotal  = countEquip(myEquipLost);
  const oppEquipTotal = revealEnemyLosses ? countEquip(oppEquipLost) : 0;
  const myTotalLosses  = mySoldiers + myEquipTotal;
  const oppTotalLosses = revealEnemyLosses ? (oppSoldiers + oppEquipTotal) : 0;

  const date    = new Date(a.attacked_at);
  const dateStr = date.toLocaleDateString(i18n.language === 'he' ? 'he-IL' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const timeStr = date.toLocaleTimeString(i18n.language === 'he' ? 'he-IL' : 'en-US');

  const overlay = document.createElement('div');
  overlay.id = 'battle-report-overlay';
  overlay.style.cssText = `
    position:fixed;inset:0;z-index:9999;
    background:rgba(0,0,0,0.55);backdrop-filter:blur(3px);
    display:flex;align-items:center;justify-content:center;
    padding:16px;overflow-y:auto;
  `;

  overlay.innerHTML = `
    <div id="battle-report-modal" style="
      background:var(--surface);
      border:0.5px solid ${outcomeBorder};
      border-top:3px solid ${outcomeColor};
      border-radius:12px;
      width:100%;max-width:680px;
      max-height:90vh;overflow-y:auto;
      box-shadow:0 20px 50px rgba(0,0,0,0.3);
      position:relative;
    ">

      <!-- Close button -->
      <button id="close-battle-report" style="
        position:absolute;top:12px;inset-inline-end:14px;
        background:none;border:none;font-size:20px;cursor:pointer;
        color:var(--text-muted);line-height:1;padding:4px;
        transition:color 0.15s;
      " title="${t('close')}">✕</button>

      <!-- Header -->
      <div style="padding:20px 24px;border-bottom:0.5px solid var(--border);">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
          <span style="font-size:28px;">${isWin ? '🏆' : '💀'}</span>
          <div style="flex:1;">
            <div style="font-size:20px;font-weight:500;color:${outcomeColor};margin-bottom:2px;">
              ${isWin ? (isAttacker ? t('battleReport.victory') : t('battleReport.defended')) : (isAttacker ? t('battleReport.defeat') : t('battleReport.overrun'))}
            </div>
            <div style="font-size:13px;color:var(--text-muted);">
              ${isAttacker ? t('attacks.attackOn') : t('attacks.attackedBy')}
              <span style="color:var(--text);">${opponent?.name || t('battleReport.unknownNation')}</span>
              <span style="margin-inline-start:6px;">•</span>
              <span style="margin-inline-start:6px;">${dateStr}</span>
            </div>
          </div>
        </div>
        ${landGained > 0 && isAttacker && a.success 
          ? `<div style="background:${outcomeBg};border:0.5px solid ${outcomeBorder};border-inline-start:3px solid ${outcomeColor};padding:10px 14px;border-radius:6px;">
              <div style="font-size:14px;font-weight:500;color:${outcomeColor};margin-bottom:2px;">
                +${landGained} ${t('battleReport.units')} ${t('battleReport.landCaptured')}
              </div>
              <div style="font-size:12px;color:var(--text-muted);">
                ${typeLabel(a.attack_type, a.scenario_type)}
              </div>
            </div>`
          : moneyLooted > 0
          ? `<div style="background:${outcomeBg};border:0.5px solid ${outcomeBorder};border-inline-start:3px solid ${outcomeColor};padding:10px 14px;border-radius:6px;">
              <div style="font-size:14px;font-weight:500;color:${outcomeColor};margin-bottom:2px;">
                +$${moneyLooted.toLocaleString()} ${t('battleReport.looted')}
              </div>
              <div style="font-size:12px;color:var(--text-muted);">
                ${typeLabel(a.attack_type, a.scenario_type)}
              </div>
            </div>`
          : `<div style="font-size:12px;color:var(--text-muted);font-family:var(--font-mono);">
              ${typeLabel(a.attack_type, a.scenario_type)}
            </div>`
        }
      </div>

      <!-- Battle Log (The Story) -->
      <div style="padding:16px 24px;border-bottom:0.5px solid var(--border);">
        <div style="background:${outcomeBg};border:0.5px solid ${outcomeBorder};border-inline-start:3px solid ${outcomeColor};padding:12px 14px;border-radius:6px;">
          <div style="font-size:13px;line-height:1.7;color:var(--text);">
            ${generateSummary(a, isAttacker, opponent)}
          </div>
        </div>
      </div>

      <!-- Casualties Report -->
      <div style="padding:16px 24px;border-bottom:0.5px solid var(--border);">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <!-- Our Forces -->
          <div>
            <div style="font-size:12px;font-weight:500;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">
              ${isAttacker ? t('battleReport.ourForces') : t('battleReport.ourDefense')}
            </div>
            <div style="background:var(--surface2);border-radius:6px;padding:10px;">
              ${buildLossesTableClean(isAttacker ? a.attacker_equipment_lost : a.defender_equipment_lost, mySoldiers, LOSS_COLOR)}
            </div>
          </div>

          <!-- Enemy -->
          <div>
            <div style="font-size:12px;font-weight:500;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">
              ${t('battleReport.enemy')}
            </div>
            <div style="background:var(--surface2);border-radius:6px;padding:10px;">
              ${(() => {
                const showEnemyDetail = revealEnemyLosses;
                const enemyEquip = isAttacker ? a.defender_equipment_lost : a.attacker_equipment_lost;
                if (!showEnemyDetail) {
                  return `<div style="font-size:12px;color:var(--text-muted);font-style:italic;padding:8px 0;">
                    ${t('battleReport.intelClassified')}
                  </div>`;
                }
                return buildLossesTableClean(enemyEquip, oppSoldiers, WIN_COLOR);
              })()}
            </div>
          </div>
        </div>
      </div>

      <!-- Strategic Impact -->
      ${(secLoss > 0 && isAttacker && a.success) || (a.defender_facilities_destroyed && a.defender_facilities_destroyed > 0) ? `
        <div style="padding:16px 24px;">
          <div style="font-size:12px;font-weight:500;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">
            ${t('battleReport.strategicImpact')}
          </div>
          <div style="display:flex;flex-direction:column;gap:8px;">
            ${secLoss > 0 && isAttacker && a.success ? `
              <div style="display:flex;align-items:center;gap:10px;background:var(--surface2);padding:10px 12px;border-radius:6px;">
                <span style="font-size:18px;">📉</span>
                <span style="font-size:13px;color:var(--text);">${t('battleReport.enemySecurityDropped', { pct: secLoss })}</span>
              </div>
            ` : ''}
            ${a.defender_facilities_destroyed && a.defender_facilities_destroyed > 0 ? `
              <div style="display:flex;align-items:center;gap:10px;background:var(--surface2);padding:10px 12px;border-radius:6px;">
                <span style="font-size:18px;">🏭</span>
                <span style="font-size:13px;color:var(--text);">${t('battleReport.factoriesDestroyed', { count: a.defender_facilities_destroyed })}</span>
              </div>
            ` : ''}
          </div>
        </div>
      ` : ''}

    </div>
  `;

  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  document.getElementById('close-battle-report').addEventListener('click', close);
  document.getElementById('close-battle-report-btn').addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', function esc(e) {
    if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); }
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function outcomeStat(icon, label, value, color) {
  return `
    <div style="text-align:center;">
      <div style="font-size:18px;margin-bottom:3px;">${icon}</div>
      <div style="font-family:var(--font-title);font-size:16px;letter-spacing:1px;color:${color};line-height:1.1;">${value}</div>
      <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-top:3px;">${label}</div>
    </div>
  `;
}

function gainRow(icon, label, desc, color) {
  return `
    <div style="display:flex;align-items:center;gap:10px;padding:9px 12px;
      background:var(--surface2);border:1px solid var(--border);border-radius:6px;
      border-inline-start:3px solid ${color};">
      <span style="font-size:16px;flex-shrink:0;">${icon}</span>
      <div>
        <div style="font-size:12px;font-weight:700;color:var(--text);">${label}</div>
        <div style="font-family:var(--font-mono);font-size:11px;color:${color};margin-top:1px;">${desc}</div>
      </div>
    </div>
  `;
}

function buildLossesTableWithSoldiers(equipmentLost, soldiers, accentColor) {
  const rows = [];
  if (soldiers > 0) {
    rows.push(`
      <div style="display:flex;justify-content:space-between;align-items:center;
        padding:3px 0;border-bottom:1px solid var(--border-dim);">
        <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);">
          ${i18n.t('dashboard.soldiers')}
        </span>
        <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:${accentColor};">
          ×${soldiers.toLocaleString()}
        </span>
      </div>`);
  }
  if (equipmentLost && typeof equipmentLost === 'object') {
    const entries = Object.entries(equipmentLost).filter(([, v]) => v > 0);
    entries.forEach(([key, qty]) => {
      rows.push(`
        <div style="display:flex;justify-content:space-between;align-items:center;
          padding:3px 0;border-bottom:1px solid var(--border-dim);">
          <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);">
            ${i18n.t('equipment.' + key, { defaultValue: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) })}
          </span>
          <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:${accentColor};">
            ×${Number(qty).toLocaleString()}
          </span>
        </div>`);
    });
  }
  if (!rows.length) return '';
  return `<div style="margin-top:6px;">${rows.join('')}</div>`;
}

function buildLossesTableClean(equipmentLost, soldiers, accentColor) {
  const rows = [];
  if (soldiers > 0) {
    rows.push(`
      <div style="display:flex;justify-content:space-between;align-items:center;
        padding:6px 0;border-bottom:0.5px solid var(--border);">
        <span style="font-size:12px;color:var(--text-muted);">
          ${i18n.t('dashboard.soldiers')}
        </span>
        <span style="font-size:13px;font-weight:500;color:${accentColor};">
          ${soldiers.toLocaleString()}
        </span>
      </div>`);
  }
  if (equipmentLost && typeof equipmentLost === 'object') {
    const entries = Object.entries(equipmentLost).filter(([, v]) => v > 0);
    entries.forEach(([key, qty]) => {
      rows.push(`
        <div style="display:flex;justify-content:space-between;align-items:center;
          padding:6px 0;border-bottom:0.5px solid var(--border);">
          <span style="font-size:12px;color:var(--text-muted);">
            ${i18n.t('equipment.' + key, { defaultValue: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) })}
          </span>
          <span style="font-size:13px;font-weight:500;color:${accentColor};">
            ${Number(qty).toLocaleString()}
          </span>
        </div>`);
    });
  }
  if (!rows.length) {
    return `<div style="font-size:12px;color:var(--text-muted);padding:8px 0;">${i18n.t('battleReport.noLosses')}</div>`;
  }
  return `<div>${rows.join('')}</div>`;
}

function buildLossesTable(equipmentLost, accentColor) {
  if (!equipmentLost || typeof equipmentLost !== 'object') return '';
  const entries = Object.entries(equipmentLost).filter(([, v]) => v > 0);
  if (!entries.length) return '';
  const rows = entries.map(([key, qty]) => `
    <div style="display:flex;justify-content:space-between;align-items:center;
      padding:3px 0;border-bottom:1px solid var(--border-dim);">
      <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);">
        ${i18n.t('equipment.' + key, { defaultValue: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) })}
      </span>
      <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:${accentColor};">
        ×${Number(qty).toLocaleString()}
      </span>
    </div>
  `).join('');
  return `<div style="margin-top:6px;">${rows}</div>`;
}

function typeLabel(attackType, scenarioType) {
  if (!attackType) return t('battleReport.attack').toUpperCase();
  // Try to find translated scenario name
  const scenarioKey = scenarioType ? `attacks.scenario${scenarioType.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join('')}` : null;
  if (scenarioKey) {
    const translated = i18n.t(scenarioKey, { defaultValue: '' });
    if (translated) return translated;
  }
  return attackType.toUpperCase();
}

function generateSummary(a, isAttacker, opponent) {
  const attLost = a.attacker_soldiers_lost || a.att_soldiers_lost || 0;
  const defLost = a.defender_soldiers_lost || a.def_soldiers_lost || 0;
  const opponentName = opponent?.name || t('battleReport.enemy');

  // New battle log system based on attack type and scenario
  const battleLog = generateBattleLog(a, isAttacker);
  if (battleLog) return battleLog;

  if (a.attack_type === 'conquest') {
    if (a.success) return isAttacker
      ? t('battleReport.summaryConquestWin', { land: a.land_loss || 0, defLost: defLost.toLocaleString(), attLost: attLost.toLocaleString() })
      : t('battleReport.summaryConquestDefended', { attLost: attLost.toLocaleString(), defLost: defLost.toLocaleString() });
    return isAttacker
      ? t('battleReport.summaryConquestFail', { attLost: attLost.toLocaleString() })
      : t('battleReport.summaryConquestRepelled', { defLost: defLost.toLocaleString() });
  }
  if (a.attack_type === 'destruction') {
    if (a.success) return isAttacker
      ? t('battleReport.summaryDestructionWin', { sec: a.sec_loss || 0, attLost: attLost.toLocaleString() })
      : t('battleReport.summaryDestructionLost', { sec: a.sec_loss || 0, defLost: defLost.toLocaleString() });
    return isAttacker
      ? t('battleReport.summaryDestructionFail', { attLost: attLost.toLocaleString() })
      : t('battleReport.summaryDestructionRepelled');
  }
  // Generic / missile / air / naval — use result_summary from DB or generic fallback
  if (a.result_summary) return translateBattleResultSummary(a.result_summary, a, isAttacker, opponentName);
  return t('battleReport.battleConcluded');
}

function generateBattleLog(a, isAttacker) {
  const scenario = a.scenario_type || a.attack_type;
  const success = a.success;
  
  // Only generate battle logs for attacker
  if (!isAttacker) return null;

  // Missile Strike
  if (scenario === 'missile_strike' || a.attack_type === 'missile') {
    return success 
      ? t('battleReport.logMissileSuccess')
      : t('battleReport.logMissileIntercepted');
  }

  // SEAD (Suppression of Enemy Air Defenses)
  if (scenario === 'sead' || 
      scenario === 'suppress_air_defense' || 
      scenario === 'suppress_air_defenses' ||
      scenario === 'suppression_of_enemy_air_defenses' ||
      a.attack_type === 'sead') {
    return success
      ? t('battleReport.logSeadSuccess')
      : t('battleReport.logSeadFailure');
  }

  // Air Clash
  if (scenario === 'air_clash' || scenario === 'air_superiority') {
    return success
      ? t('battleReport.logAirSuccess')
      : t('battleReport.logAirFailure');
  }

  // Factory Bombing
  if (scenario === 'factory_bombing' || scenario === 'bomb_factories') {
    return success
      ? t('battleReport.logFactorySuccess')
      : t('battleReport.logFactoryFailure');
  }

  // Tank Hunt
  if (scenario === 'tank_hunt' || scenario === 'hunt_armor') {
    return success ? t('battleReport.logTankHuntSuccess') : null;
  }

  // Naval Raid
  if (scenario === 'naval_raid' || scenario === 'blockade') {
    return success
      ? t('battleReport.logNavalSuccess')
      : t('battleReport.logNavalFailure');
  }

  // Commando Raid
  if (scenario === 'commando_raid' || scenario === 'spec_ops') {
    return success ? t('battleReport.logCommandoSuccess') : null;
  }

  // Mine Clearing
  if (scenario === 'mine_clearing' || scenario === 'clear_mines') {
    const counterBattery = a.counter_battery_fire || false;
    return counterBattery
      ? t('battleReport.logMineClearingCounter')
      : t('battleReport.logMineClearingSuccess');
  }

  // Total Invasion / Full Assault
  if (scenario === 'total_invasion' || scenario === 'full_assault' || a.attack_type === 'conquest') {
    if (success) {
      const hitMines = a.hit_mines || a.mine_casualties || false;
      return hitMines
        ? t('battleReport.logInvasionMines')
        : t('battleReport.logInvasionSuccess');
    }
  }

  // Scorched Earth
  if (scenario === 'scorched_earth' || a.attack_type === 'destruction') {
    return success ? t('battleReport.logScorchedEarth') : null;
  }

  return null;
}

// Best-effort translation of stored English result_summary strings
export function translateBattleResultSummary(summary, a = {}, isAttacker = true, opponentName = '') {
  const clean = String(summary || '').trim();
  const mp = a.missiles_penetrated || 0;
  const fd = a.defender_facilities_destroyed || 0;

  if (!clean) return '';
  if (clean.includes('missiles got through') || clean.includes('facilities destroyed')) {
    // BUG FIX: If 0 missiles penetrated, facilities destroyed must also be 0
    const actualFacilities = mp > 0 ? fd : 0;
    return t('battleReport.summaryMissileHit', { penetrated: mp, facilities: actualFacilities });
  }
  if (clean.includes('intercepted') || clean.includes('Missiles lost')) {
    return t('battleReport.summaryMissileIntercepted');
  }
  if (clean.includes('Air superiority') || clean.includes('air superiority')) {
    return a.success
      ? t('battleReport.summaryAirWin')
      : t('battleReport.summaryAirFail');
  }
  if (clean.includes('SAM') || clean.includes('SEAD') || clean.includes('air defense') || 
      clean.includes('air defence') || clean.includes('suppress') || clean.includes('SAM battery')) {
    return a.success ? t('battleReport.summarySEADWin') : t('battleReport.summarySEADFail');
  }
  if (clean.includes('blockade')) {
    return a.success ? t('battleReport.summaryBlockadeWin') : t('battleReport.summaryBlockadeFail');
  }

  const seizedLand = clean.match(/Seized\s+(\d+)\s+land/i)?.[1] || '';
  const seizedFacility = clean.match(/\+\s*(\d+)\s+facilit/i)?.[1] || '';
  const eliminatedSoldiers = clean.match(/Eliminated\s+(\d+)\s+(?:enemy\s+)?soldiers/i)?.[1] || '';
  const destroyedTanks = clean.match(/destroyed\s+(\d+)\s+tanks/i)?.[1] || '';
  const destroyedApcs = clean.match(/,\s*(\d+)\s+APCs?/i)?.[1] || '';
  const securityShift = clean.match(/Security\s*([+-]?\d+)%/i)?.[1] || '';
  if (/full assault|ground assault|industrial occupation/i.test(clean) || seizedLand || eliminatedSoldiers) {
    const equipmentParts = [
      destroyedTanks && destroyedTanks !== '0' ? `${destroyedTanks} ${t('equipment.tank')}` : '',
      destroyedApcs && destroyedApcs !== '0' ? `${destroyedApcs} ${t('equipment.apc')}` : '',
    ].filter(Boolean);
    return t('battleReport.summaryFullAssaultWin', {
      land: seizedLand || 0,
      facility: seizedFacility ? t('battleReport.facilityAddon', { count: seizedFacility }) : '',
      soldiers: eliminatedSoldiers || 0,
      equipment: equipmentParts.length ? t('battleReport.equipmentAddon', { items: equipmentParts.join(', ') }) : '',
      security: securityShift ? t('battleReport.securityAddon', { pct: securityShift }) : '',
    });
  }

  const looted = clean.match(/Looted\s+\$?([\d,]+)/i)?.[1] || '';
  if (looted) {
    return t('battleReport.summaryBlitzRaid', { money: looted });
  }

  return clean;
}
