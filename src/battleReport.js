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

  const attSoldiersLost = a.att_soldiers_lost || 0;
  const defSoldiersLost = a.def_soldiers_lost || 0;
  const landGained      = a.land_loss        || 0;
  const moneyLooted     = (a.money_loss && a.success && isAttacker) ? Math.floor(a.money_loss / 2) : 0;
  const secLoss         = a.sec_loss         || 0;

  const mySecChange = isAttacker
    ? null
    : (a.success ? -secLoss : 0);

  const mySoldiers  = isAttacker ? attSoldiersLost : defSoldiersLost;
  const oppSoldiers = isAttacker ? defSoldiersLost : attSoldiersLost;

  // Count total equipment lost (for summary bar)
  const myEquipLost  = isAttacker ? a.attacker_equipment_lost : a.defender_equipment_lost;
  const oppEquipLost = isAttacker ? a.defender_equipment_lost : a.attacker_equipment_lost;
  const countEquip   = obj => obj && typeof obj === 'object' ? Object.values(obj).reduce((s, v) => s + (v || 0), 0) : 0;
  const myEquipTotal  = countEquip(myEquipLost);
  const oppEquipTotal = countEquip(oppEquipLost);
  const myTotalLosses  = mySoldiers + myEquipTotal;
  const oppTotalLosses = oppSoldiers + oppEquipTotal;

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
      border:1.5px solid ${outcomeBorder};
      border-top:4px solid ${outcomeColor};
      border-radius:12px;
      width:100%;max-width:680px;
      max-height:90vh;overflow-y:auto;
      box-shadow:0 24px 60px rgba(0,0,0,0.35);
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
      <div style="padding:20px 24px 16px;border-bottom:1px solid var(--border);">
        <div style="font-family:var(--font-title);font-size:22px;letter-spacing:3px;color:${outcomeColor};margin-bottom:6px;">
          ${outcomeLabel}
        </div>
        <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:2px;">
          ${isAttacker ? t('attacks.attackOn') : t('attacks.attackedBy')}
          <span style="color:var(--accent);">${opponent?.name || t('battleReport.unknownNation')}</span>
          <span style="font-family:var(--font-mono);font-size:11px;color:var(--text-muted);margin-inline-start:8px;
            background:var(--surface2);border:1px solid var(--border);padding:2px 7px;border-radius:4px;">
            ${typeLabel(a.attack_type, a.scenario_type)}
          </span>
        </div>
        <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">
          ${dateStr} · ${timeStr}
        </div>
      </div>

      <!-- Outcome summary bar -->
      <div style="
        background:${outcomeBg};
        border-bottom:1px solid ${outcomeBorder};
        padding:14px 24px;
        display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:12px;
      ">
        ${outcomeStat(isAttacker ? '⚔️' : '🛡️',
            isAttacker ? t('battleReport.yourLosses') : t('battleReport.soldiersLost'),
            myTotalLosses > 0
              ? (mySoldiers > 0 && myEquipTotal > 0
                  ? t('battleReport.soldiersCount', { count: mySoldiers.toLocaleString() }) + ' + ' + myEquipTotal + ' ' + t('battleReport.equipUnit')
                  : mySoldiers > 0
                    ? t('battleReport.soldiersCount', { count: mySoldiers.toLocaleString() })
                    : myEquipTotal + ' ' + t('battleReport.equipUnit'))
              : t('battleReport.noLosses'),
            myTotalLosses > 0 ? LOSS_COLOR : WIN_COLOR)}

        ${outcomeStat('💀', t('battleReport.enemyLosses'),
            oppTotalLosses > 0
              ? (oppSoldiers > 0 && oppEquipTotal > 0
                  ? t('battleReport.soldiersCount', { count: oppSoldiers.toLocaleString() }) + ' + ' + oppEquipTotal + ' ' + t('battleReport.equipUnit')
                  : oppSoldiers > 0
                    ? t('battleReport.soldiersCount', { count: oppSoldiers.toLocaleString() })
                    : oppEquipTotal + ' ' + t('battleReport.equipUnit'))
              : t('battleReport.noLosses'),
            oppTotalLosses > 0 ? WIN_COLOR : 'var(--text-muted)')}

        ${landGained > 0 && isAttacker && a.success
          ? outcomeStat('🗺️', t('battleReport.landCaptured'), `+${landGained} ${t('battleReport.units')}`, WIN_COLOR)
          : landGained > 0 && !isAttacker && a.success
          ? outcomeStat('🗺️', t('battleReport.landLost'), `-${landGained} ${t('battleReport.units')}`, LOSS_COLOR)
          : ''}

        ${moneyLooted > 0
          ? outcomeStat('💰', t('battleReport.looted'), `+$${moneyLooted.toLocaleString()}`, WIN_COLOR)
          : ''}

        ${mySecChange !== null
          ? outcomeStat('🛡️', t('battleReport.yourSecurity'),
              mySecChange < 0 ? `${mySecChange}%` : t('battleReport.unchanged'),
              mySecChange < 0 ? LOSS_COLOR : WIN_COLOR)
          : isAttacker && secLoss > 0 && a.success
          ? outcomeStat('🛡️', t('battleReport.enemySecurity'), `-${secLoss}%`, WIN_COLOR)
          : ''}
      </div>

      <!-- Battle summary text -->
      <div style="padding:14px 24px;border-bottom:1px solid var(--border);">
        <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-muted);
          line-height:1.7;background:var(--surface2);padding:10px 14px;border-radius:6px;
          border-inline-start:3px solid ${outcomeColor};">
          ${generateSummary(a, isAttacker, opponent)}
        </div>
      </div>

      <!-- Casualty breakdown -->
      <div style="padding:16px 24px;border-bottom:1px solid var(--border);">
        <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;
          color:var(--text-muted);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:12px;">
          ⚔️ ${t('battleReport.casualtyReport')}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <!-- My side -->
          <div style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:12px 14px;">
            <div style="font-size:12px;font-weight:700;margin-bottom:8px;color:var(--text);">
              ${isAttacker ? `⚔️ ${t('battleReport.yourAttack')}` : `🛡️ ${t('battleReport.yourDefense')}`}
            </div>
            ${mySoldiers > 0 ? `<div style="font-family:var(--font-mono);font-size:12px;color:${LOSS_COLOR};margin-bottom:4px;">
              💀 ${t('battleReport.soldiersKilled', { count: mySoldiers.toLocaleString() })}
            </div>` : ''}
            ${buildLossesTable(isAttacker ? a.attacker_equipment_lost : a.defender_equipment_lost, '#f59e0b')}
          </div>

          <!-- Enemy side -->
          <div style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:12px 14px;">
            <div style="font-size:12px;font-weight:700;margin-bottom:8px;color:var(--text);">
              ${isAttacker ? `🛡️ ${t('battleReport.enemyDefense')}` : `⚔️ ${t('battleReport.enemyAttack')}`}
            </div>
            ${(() => {
              const showEnemyDetail = isAttacker ? a.success : !a.success;
              if (!showEnemyDetail) {
                return `<div style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);margin-top:4px;font-style:italic;">
                  ${t('battleReport.intelClassified')}
                </div>`;
              }
              return `
                ${oppSoldiers > 0 ? `<div style="font-family:var(--font-mono);font-size:12px;color:${WIN_COLOR};margin-bottom:4px;">
                  💀 ${t('battleReport.soldiersEliminated', { count: oppSoldiers.toLocaleString() })}
                </div>` : ''}
                ${buildLossesTable(isAttacker ? a.defender_equipment_lost : a.attacker_equipment_lost, '#e05252')}
              `;
            })()}
          </div>
        </div>
      </div>

      <!-- Gains / losses detailed breakdown -->
      ${(landGained > 0 || moneyLooted > 0 || secLoss > 0) ? `
        <div style="padding:14px 24px;border-bottom:1px solid var(--border);">
          <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;
            color:var(--text-muted);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:12px;">
            📊 ${t('battleReport.gainsEffects')}
          </div>
          <div style="display:flex;flex-direction:column;gap:8px;">
            ${landGained > 0 ? gainRow(
                '🗺️',
                isAttacker && a.success ? t('battleReport.territoryCaptured') : t('battleReport.territoryLost'),
                isAttacker && a.success
                  ? t('battleReport.landAnnexed', { count: landGained })
                  : t('battleReport.landSeized', { count: landGained }),
                isAttacker && a.success ? WIN_COLOR : LOSS_COLOR
              ) : ''}
            ${moneyLooted > 0 ? gainRow('💰', t('battleReport.treasuryRaid'),
                t('battleReport.looted') + ` $${moneyLooted.toLocaleString()}`, WIN_COLOR) : ''}
            ${isAttacker && secLoss > 0 && a.success ? gainRow('🛡️', t('battleReport.destabilization'),
                t('battleReport.secApplied', { pct: secLoss, name: opponent?.name || t('battleReport.enemy') }), WIN_COLOR) : ''}
            ${!isAttacker && a.success && secLoss > 0 ? gainRow('🛡️', t('battleReport.securityDamage'),
                t('battleReport.secDropped', { pct: secLoss }), LOSS_COLOR) : ''}
          </div>
        </div>
      ` : ''}

      <!-- Footer -->
      <div style="padding:12px 24px;display:flex;justify-content:flex-end;">
        <button id="close-battle-report-btn" style="
          background:var(--surface2);border:1.5px solid var(--border);
          border-radius:6px;color:var(--text-muted);
          font-family:var(--font-body);font-size:13px;font-weight:600;
          padding:8px 20px;cursor:pointer;transition:all 0.15s;
        ">${t('battleReport.closeReport')}</button>
      </div>

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
  const attLost = a.att_soldiers_lost || 0;
  const defLost = a.def_soldiers_lost || 0;
  const opponentName = opponent?.name || t('battleReport.enemy');

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
  if (a.result_summary) return translateResultSummary(a.result_summary, a, isAttacker, opponentName);
  return t('battleReport.battleConcluded');
}

// Best-effort translation of stored English result_summary strings
function translateResultSummary(summary, a, isAttacker, opponentName) {
  const mf = a.missiles_fired || 0;
  const mp = a.missiles_penetrated || 0;
  const fd = a.defender_facilities_destroyed || 0;
  const attLost = a.att_soldiers_lost || 0;

  if (summary.includes('missiles got through') || summary.includes('facilities destroyed')) {
    return t('battleReport.summaryMissileHit', { penetrated: mp, facilities: fd });
  }
  if (summary.includes('intercepted') || summary.includes('Missiles lost')) {
    return t('battleReport.summaryMissileIntercepted');
  }
  if (summary.includes('Air superiority') || summary.includes('air superiority')) {
    return a.success
      ? t('battleReport.summaryAirWin')
      : t('battleReport.summaryAirFail');
  }
  if (summary.includes('SAM') || summary.includes('SEAD') || summary.includes('air defense')) {
    return a.success ? t('battleReport.summarySEADWin') : t('battleReport.summarySEADFail');
  }
  if (summary.includes('blockade')) {
    return a.success ? t('battleReport.summaryBlockadeWin') : t('battleReport.summaryBlockadeFail');
  }
  // Fallback — return as-is (old English records from DB)
  return summary;
}
