/**
 * battleReport.js
 * Renders a full battle report popup for any attack record.
 * Shows attacker's units used, losses on both sides, gains, and own security delta.
 * The viewer never sees the enemy's security change — only their own.
 */

import { sb } from './supabase.js';

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Open a battle report popup for a given attack record.
 * @param {object} attack  - Row from the `attacks` table (full * select + joined names)
 * @param {string} myNationId - The current player's nation ID
 */
export async function openBattleReport(attack, myNationId) {
  // Only fetch the viewer's own units — never expose enemy army composition
  const { data: myUnits } = await sb.from('military_units')
    .select('quantity, equipment_types(id, name, attack_power, defense_power, category)')
    .eq('nation_id', myNationId);

  showPopup(attack, myNationId, myUnits || []);
}

// ─── Popup renderer ───────────────────────────────────────────────────────────

function showPopup(a, myNationId, myUnits) {
  // Remove any existing popup
  document.getElementById('battle-report-overlay')?.remove();

  const isAttacker = a.attacker_nation_id === myNationId;
  const opponent   = isAttacker ? a.defender : a.attacker;
  const opponentId = isAttacker ? a.defender_nation_id : a.attacker_nation_id;

  const isWin = isAttacker ? a.success : !a.success;

  // ── Outcome colours
  const WIN_COLOR  = '#16a34a';
  const LOSS_COLOR = '#dc2626';
  const outcomeColor  = isWin ? WIN_COLOR : LOSS_COLOR;
  const outcomeBg     = isWin ? 'rgba(22,163,74,0.07)' : 'rgba(220,38,38,0.07)';
  const outcomeBorder = isWin ? 'rgba(22,163,74,0.35)' : 'rgba(220,38,38,0.35)';
  const outcomeLabel  = isWin
    ? (isAttacker ? '🏆 VICTORY' : '🛡️ DEFENDED')
    : (isAttacker ? '💀 DEFEAT'  : '⚔️ OVERRUN');

  // ── Casualty / gain values (all from the attack record)
  const attSoldiersLost = a.att_soldiers_lost || 0;
  const defSoldiersLost = a.def_soldiers_lost || 0;
  const landGained      = a.land_loss        || 0;   // land taken from defender
  const moneyLooted     = (a.money_loss && a.success && isAttacker) ? Math.floor(a.money_loss / 2) : 0;
  const secLoss         = a.sec_loss         || 0;   // defender's security loss (we show it to attacker only)

  // ── My own security change (only shown to this player, never the enemy's)
  // We show the attacker that they inflicted sec_loss on enemy.
  // We show the defender their own security drop (sec_loss was applied to them).
  const mySecChange = isAttacker
    ? null                          // attacker: don't show OWN sec change here
    : (a.success ? -secLoss : 0);  // defender: if attack succeeded we lost security

  // ── Units summary
  const mySoldiers  = isAttacker ? attSoldiersLost : defSoldiersLost;
  const oppSoldiers = isAttacker ? defSoldiersLost : attSoldiersLost;

  // ── Build units HTML  (only show viewer's own army composition)
  const myUnitsHTML  = buildUnitsTable(myUnits, 'My Forces', '#3b82f6', true);

  const date = new Date(a.attacked_at);
  const dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  const timeStr = date.toLocaleTimeString();

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
      " title="Close">✕</button>

      <!-- Header -->
      <div style="padding:20px 24px 16px;border-bottom:1px solid var(--border);">
        <div style="font-family:var(--font-title);font-size:22px;letter-spacing:3px;color:${outcomeColor};margin-bottom:6px;">
          ${outcomeLabel}
        </div>
        <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:2px;">
          ${isAttacker ? 'Attack on' : 'Attacked by'}
          <span style="color:var(--accent);">${opponent?.name || 'Unknown Nation'}</span>
          <span style="font-family:var(--font-mono);font-size:11px;color:var(--text-muted);margin-inline-start:8px;
            background:var(--surface2);border:1px solid var(--border);padding:2px 7px;border-radius:4px;">
            ${typeLabel(a.attack_type)}
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
        ${outcomeStat(isAttacker ? '⚔️' : '🛡️', isAttacker ? 'Your Losses' : 'Soldiers Lost',
            mySoldiers > 0 ? `${mySoldiers.toLocaleString()} soldiers` : 'No losses',
            mySoldiers > 0 ? LOSS_COLOR : WIN_COLOR)}

        ${outcomeStat('💀', 'Enemy Losses',
            oppSoldiers > 0 ? `${oppSoldiers.toLocaleString()} soldiers` : 'No losses',
            oppSoldiers > 0 ? WIN_COLOR : 'var(--text-muted)')}

        ${landGained > 0 && isAttacker && a.success
          ? outcomeStat('🗺️', 'Land Captured', `+${landGained} units`, WIN_COLOR)
          : landGained > 0 && !isAttacker && a.success
          ? outcomeStat('🗺️', 'Land Lost', `-${landGained} units`, LOSS_COLOR)
          : ''}

        ${moneyLooted > 0
          ? outcomeStat('💰', 'Looted', `+$${moneyLooted.toLocaleString()}`, WIN_COLOR)
          : ''}

        ${mySecChange !== null
          ? outcomeStat('🛡️', 'Your Security',
              mySecChange < 0 ? `${mySecChange}%` : 'Unchanged',
              mySecChange < 0 ? LOSS_COLOR : WIN_COLOR)
          : isAttacker && secLoss > 0 && a.success
          ? outcomeStat('🛡️', 'Enemy Security', `-${secLoss}%`, WIN_COLOR)
          : ''}
      </div>

      <!-- Battle summary text -->
      <div style="padding:14px 24px;border-bottom:1px solid var(--border);">
        <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-muted);
          line-height:1.7;background:var(--surface2);padding:10px 14px;border-radius:6px;
          border-inline-start:3px solid ${outcomeColor};">
          ${a.result_summary || generateSummary(a, isAttacker)}
        </div>
      </div>

      <!-- Casualty breakdown -->
      <div style="padding:16px 24px;border-bottom:1px solid var(--border);">
        <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;
          color:var(--text-muted);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:12px;">
          ⚔️ Casualty Report
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <!-- My side -->
          <div style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:12px 14px;">
            <div style="font-size:12px;font-weight:700;margin-bottom:8px;color:var(--text);">
              ${isAttacker ? '⚔️ Your Attack' : '🛡️ Your Defense'}
            </div>
            <div style="font-family:var(--font-mono);font-size:12px;color:${mySoldiers > 0 ? LOSS_COLOR : WIN_COLOR};margin-bottom:4px;">
              ${mySoldiers > 0 ? `💀 ${mySoldiers.toLocaleString()} soldiers killed` : '✅ No soldier losses'}
            </div>
            ${buildLossesTable(isAttacker ? a.attacker_equipment_lost : a.defender_equipment_lost, '#f59e0b')}
          </div>

          <!-- Enemy side — only reveal if attack succeeded (attacker view) or attack failed (defender view) -->
          <div style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:12px 14px;">
            <div style="font-size:12px;font-weight:700;margin-bottom:8px;color:var(--text);">
              ${isAttacker ? '🛡️ Enemy Defense' : '⚔️ Enemy Attack'}
            </div>
            ${(() => {
              // Attacker sees enemy losses only if they WON
              // Defender sees attacker losses only if they SUCCESSFULLY defended (attack failed)
              const showEnemyDetail = isAttacker ? a.success : !a.success;
              if (!showEnemyDetail) {
                return `<div style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);margin-top:4px;font-style:italic;">
                  Intel classified — no reconnaissance data available.
                </div>`;
              }
              return `
                <div style="font-family:var(--font-mono);font-size:12px;color:${oppSoldiers > 0 ? WIN_COLOR : LOSS_COLOR};margin-bottom:4px;">
                  ${oppSoldiers > 0 ? `💀 ${oppSoldiers.toLocaleString()} soldiers eliminated` : '⚠️ No enemy losses'}
                </div>
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
            📊 Battle Gains & Effects
          </div>
          <div style="display:flex;flex-direction:column;gap:8px;">
            ${landGained > 0 ? gainRow(
                isAttacker && a.success ? '🗺️' : '🗺️',
                isAttacker && a.success ? 'Territory Captured' : 'Territory Lost',
                isAttacker && a.success ? `+${landGained} land units annexed` : `-${landGained} land units seized`,
                isAttacker && a.success ? WIN_COLOR : LOSS_COLOR
              ) : ''}
            ${moneyLooted > 0 ? gainRow('💰', 'Treasury Raid',
                `+$${moneyLooted.toLocaleString()} looted from enemy treasury`, WIN_COLOR) : ''}
            ${isAttacker && secLoss > 0 && a.success ? gainRow('🛡️', 'Destabilization',
                `-${secLoss}% security index applied to ${opponent?.name || 'enemy'}`, WIN_COLOR) : ''}
            ${!isAttacker && a.success && secLoss > 0 ? gainRow('🛡️', 'Security Damage',
                `Your security index dropped by ${secLoss}%`, LOSS_COLOR) : ''}
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
        ">Close Report</button>
      </div>

    </div>
  `;

  document.body.appendChild(overlay);

  // Close handlers
  const close = () => overlay.remove();
  document.getElementById('close-battle-report').addEventListener('click', close);
  document.getElementById('close-battle-report-btn').addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', function esc(e) {
    if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); }
  });
}

// ─── Component helpers ────────────────────────────────────────────────────────

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
  // equipmentLost is a JSONB object like { "tank": 3, "artillery": 1 }
  if (!equipmentLost || typeof equipmentLost !== 'object') {
    return `<div style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);margin-top:4px;">No equipment lost.</div>`;
  }
  const entries = Object.entries(equipmentLost).filter(([, v]) => v > 0);
  if (!entries.length) {
    return `<div style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);margin-top:4px;">No equipment lost.</div>`;
  }
  const rows = entries.map(([key, qty]) => `
    <div style="display:flex;justify-content:space-between;align-items:center;
      padding:3px 0;border-bottom:1px solid var(--border-dim);">
      <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);">
        ${key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
      </span>
      <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:${accentColor};">
        ×${Number(qty).toLocaleString()}
      </span>
    </div>
  `).join('');
  return `<div style="margin-top:6px;">${rows}</div>`;
}

function buildUnitsTable(units, title, accentColor, isMe) {
  const active = (units || []).filter(u => u.quantity > 0 && u.equipment_types);
  if (!active.length) {
    return `<div style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);margin-top:4px;">
      ${isMe ? 'No equipment deployed.' : 'Force composition classified.'}
    </div>`;
  }

  // Group by category
  const catOrder = ['ground','air','naval','missile','defense'];
  const catLabel = { ground:'Ground', air:'Air', naval:'Naval', missile:'Missiles', defense:'Defense' };
  const grouped  = {};
  active.forEach(u => {
    const cat = u.equipment_types.category || 'ground';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(u);
  });

  const rows = catOrder.flatMap(cat => {
    if (!grouped[cat]) return [];
    return grouped[cat].map(u => `
      <div style="display:flex;justify-content:space-between;align-items:center;
        padding:3px 0;border-bottom:1px solid var(--border-dim);">
        <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);">
          ${u.equipment_types.name}
        </span>
        <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:${accentColor};">
          ×${u.quantity.toLocaleString()}
        </span>
      </div>
    `);
  });

  const totalAttack  = active.reduce((s, u) => s + u.quantity * (u.equipment_types.attack_power  || 0), 0);
  const totalDefense = active.reduce((s, u) => s + u.quantity * (u.equipment_types.defense_power || 0), 0);

  return `
    <div style="margin-top:6px;">
      ${rows.join('')}
      <div style="display:flex;gap:8px;margin-top:6px;">
        <div style="font-family:var(--font-mono);font-size:9px;color:#e05252;">⚔️ ATK ${totalAttack.toLocaleString()}</div>
        <div style="font-family:var(--font-mono);font-size:9px;color:#3b82f6;">🛡️ DEF ${totalDefense.toLocaleString()}</div>
      </div>
    </div>
  `;
}

function typeLabel(type) {
  if (!type) return 'ATTACK';
  return type.toUpperCase();
}

function generateSummary(a, isAttacker) {
  const attLost = a.att_soldiers_lost || 0;
  const defLost = a.def_soldiers_lost || 0;
  if (a.attack_type === 'conquest') {
    if (a.success) return isAttacker
      ? `Conquest succeeded. Your forces overwhelmed the enemy, capturing ${a.land_loss||0} land units. Enemy lost ${defLost.toLocaleString()} soldiers. You lost ${attLost.toLocaleString()}.`
      : `Enemy conquest failed. Your defenses held. Enemy lost ${attLost.toLocaleString()} soldiers pushing through. You lost ${defLost.toLocaleString()}.`;
    return isAttacker
      ? `Conquest failed. Enemy defense held. You lost ${attLost.toLocaleString()} soldiers.`
      : `Conquest repelled. Your defenses held firm. You lost ${defLost.toLocaleString()} soldiers.`;
  }
  if (a.attack_type === 'destruction') {
    if (a.success) return isAttacker
      ? `Destruction attack succeeded. Enemy lost ${a.sec_loss||0}% security${a.money_loss ? `, $${Math.floor(a.money_loss/2).toLocaleString()} looted` : ''}. You lost ${attLost.toLocaleString()} soldiers.`
      : `Destruction attack on your nation succeeded. Your security dropped by ${a.sec_loss||0}%. You lost ${defLost.toLocaleString()} soldiers.`;
    return isAttacker
      ? `Destruction attack failed. Enemy defenses held. You lost ${attLost.toLocaleString()} soldiers.`
      : `Destruction attack repelled. Your security index held.`;
  }
  return a.result_summary || 'Battle concluded.';
}
