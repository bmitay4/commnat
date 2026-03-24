import i18n from '../i18n.js';
const t = (k, p) => i18n.t(k, p);
import { renderPageTopbar, bindPageNav } from '../nav.js';
import { sb } from '../supabase.js';
import { openBattleReport, translateBattleResultSummary } from '../battleReport.js';

// ─── Scenario definitions ─────────────────────────────────────────────────────
// 10 canonical scenarios matching the design doc

function getScenarios() {
  return {
    missile: [
      {
        id: 'missile_strike',
        name: t('attacks.scenarioMissileStrike'),
        icon: '💥',
        unit: 'ballistic',
        unitLabel: t('attacks.unitBallisticMissiles'),
        desc: t('attacks.descMissileStrike'),
        turns: 10,
        requiresMissileQty: true,
        color: '#e05252',
        risk: 'HIGH',
      },
      {
        id: 'sead',
        name: t('attacks.scenarioSead'),
        icon: '🎯',
        unit: 'cruise',
        unitLabel: t('attacks.unitCruiseJets'),
        desc: t('attacks.descSead'),
        turns: 10,
        requiresMissileQty: true,
        color: '#f59e0b',
        risk: 'MEDIUM',
      },
    ],
    air: [
      {
        id: 'air_clash',
        name: t('attacks.scenarioAirClash'),
        icon: '✈️',
        unit: 'fighter_jet',
        unitLabel: t('attacks.unitFighterJets'),
        desc: t('attacks.descAirClash'),
        turns: 12,
        color: '#3b82f6',
        risk: 'HIGH',
      },
      {
        id: 'factory_bombing',
        name: t('attacks.scenarioFactoryBombing'),
        icon: '💣',
        unit: 'bomber',
        unitLabel: t('attacks.unitBombers'),
        desc: t('attacks.descFactoryBombing'),
        turns: 15,
        color: '#e05252',
        risk: 'VERY HIGH',
      },
      {
        id: 'tank_hunt',
        name: t('attacks.scenarioTankHunt'),
        icon: '🚁',
        unit: 'bomber',
        unitLabel: t('attacks.unitBombers'),
        desc: t('attacks.descTankHunt'),
        turns: 15,
        color: '#16a34a',
        risk: 'HIGH',
      },
    ],
    naval: [
      {
        id: 'naval_raid',
        name: t('attacks.scenarioNavalRaid'),
        icon: '⚓',
        unit: 'destroyer',
        unitLabel: t('attacks.unitDestroyersSubs'),
        desc: t('attacks.descNavalRaid'),
        turns: 25,
        color: '#3b82f6',
        risk: 'MEDIUM',
      },
    ],
    ground: [
      {
        id: 'commando_raid',
        name: t('attacks.scenarioCommandoRaid'),
        icon: '🎖️',
        unit: 'helicopter',
        unitLabel: t('attacks.unitHeliInfantry'),
        desc: t('attacks.descCommandoRaid'),
        turns: 20,
        color: '#f59e0b',
        risk: 'HIGH',
      },
      {
        id: 'mine_clearing',
        name: t('attacks.scenarioMineClearing'),
        icon: '💨',
        unit: 'artillery',
        unitLabel: t('attacks.unitArtillery'),
        desc: t('attacks.descMineClearing'),
        turns: 8,
        color: '#16a34a',
        risk: 'LOW',
      },
      {
        id: 'total_invasion',
        name: t('attacks.scenarioTotalInvasion'),
        icon: '⚔️',
        unit: 'tank',
        unitLabel: t('attacks.unitAllArmy'),
        desc: t('attacks.descTotalInvasion'),
        turns: 30,
        color: '#dc2626',
        risk: 'VERY HIGH',
      },
      {
        id: 'scorched_earth',
        name: t('attacks.scenarioScorchedEarth'),
        icon: '🔥',
        unit: 'cruise',
        unitLabel: t('attacks.unitCruiseBombers'),
        desc: t('attacks.descScorchedEarth'),
        turns: 20,
        requiresMissileQty: true,
        color: '#8b5cf6',
        risk: 'HIGH',
      },
    ],
  };
}

function categoryLabels() {
  return {
    missile: t('attacks.missile'),
    air:     t('attacks.air'),
    naval:   t('attacks.naval'),
    ground:  t('attacks.ground'),
  };
}

const RISK_COLORS = {
  'LOW': '#16a34a', 'MEDIUM': '#f59e0b', 'HIGH': '#e05252', 'VERY HIGH': '#dc2626',
};

// ─── Main render ──────────────────────────────────────────────────────────────

export async function renderAttacks(user, profile, nation) {
  const app = document.getElementById('app');
  app.innerHTML = loadingHTML(loadingHTML(t('attacks.loading')));

  const [
    { data: targets },
    { data: recentAttacks },
    { data: myUnits },
    { data: activeDebuffs },
    { data: activeBlockade },
    { data: incomingBlockade },
  ] = await Promise.all([
    sb.from('rankings')
      .select('nation_id, nation_name, alliance_tag, alliance_name, overall_rank, is_bot')
      .eq('round', nation.round).neq('nation_id', nation.id)
      .order('overall_rank', { ascending: true }),
    sb.from('attacks')
      .select('*, attacker:attacker_nation_id(name,flag_emoji), defender:defender_nation_id(name,flag_emoji)')
      .or(`attacker_nation_id.eq.${nation.id},defender_nation_id.eq.${nation.id}`)
      .order('attacked_at', { ascending: false }).limit(12),
    sb.from('military_units')
      .select('equipment_id, quantity, level, equipment_types(attack_power, defense_power)')
      .eq('nation_id', nation.id),
    sb.from('nation_debuffs').select('*').eq('nation_id', nation.id).gt('expires_at', new Date().toISOString()),
    sb.from('active_blockades').select('*').eq('attacker_id', nation.id).eq('active', true).maybeSingle(),
    sb.from('active_blockades').select('*').eq('defender_id', nation.id).eq('active', true).maybeSingle(),
  ]);

  // Build unit inventory map
  const unitMap = {};
  (myUnits || []).forEach(u => { unitMap[u.equipment_id] = { qty: u.quantity, level: u.level || 1 }; });

  // Compute my effective attack/defense
  let myAttack = 0, myDefense = 0;
  (myUnits || []).forEach(u => {
    const mult = 1 + (u.level - 1) * 0.06;
    myAttack  += u.quantity * (u.equipment_types?.attack_power  || 0) * mult;
    myDefense += u.quantity * (u.equipment_types?.defense_power || 0) * mult;
  });
  myAttack  += Math.floor(nation.soldiers / 1000) * 50;
  myDefense += Math.floor(nation.soldiers / 1000) * 50;

  const isBlockaded = !!incomingBlockade;

  app.innerHTML = `
    ${renderPageTopbar(user, profile, nation, 'attacks')}
    <div class="inner-page-wide">

      <div class="inner-topbar">
        <div class="inner-title-wrap">
          <span style="font-size:24px;">💥</span>
          <div>
            <div class="inner-title">${t('attacks.title')}</div>
            <div class="inner-sub">${nation.name} · ${nation.turns} ${t('attacks.turns')}</div>
          </div>
        </div>
      </div>

      <!-- My power stats -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:1.2rem;">
        ${aStat('⚔️', t('attacks.yourAttack'),  Math.round(myAttack).toLocaleString(),  '#e05252')}
        ${aStat('🛡️', t('attacks.yourDefense'), Math.round(myDefense).toLocaleString(), '#3b82f6')}
        ${aStat('👥', t('attacks.soldiers'),     nation.soldiers.toLocaleString(),        'var(--accent)')}
        ${aStat('⏱️', t('attacks.turns'),        nation.turns + ' / 200',                nation.turns > 0 ? 'var(--accent)' : '#e05252')}
      </div>

      <!-- Active debuffs / blockade warnings -->
      ${activeDebuffs?.length || isBlockaded ? `
        <div style="margin-bottom:1rem;display:flex;flex-direction:column;gap:6px;">
          ${isBlockaded ? `
            <div style="background:rgba(220,38,38,0.08);border:1.5px solid #dc2626;border-radius:8px;padding:10px 16px;
              display:flex;align-items:center;justify-content:space-between;gap:12px;">
              <div style="font-family:var(--font-mono);font-size:12px;color:#dc2626;font-weight:700;">
                ${t('attacks.blockadeWarning')}
              </div>
            </div>
          ` : ''}
          ${(() => {
            // Deduplicate — one banner per debuff type, latest expiry wins
            const seen = {};
            (activeDebuffs||[]).forEach(d => {
              if (!seen[d.debuff_type] || new Date(d.expires_at) > new Date(seen[d.debuff_type].expires_at)) {
                seen[d.debuff_type] = d;
              }
            });
            return Object.values(seen).map(d => `
              <div style="background:rgba(245,158,11,0.08);border:1.5px solid #f59e0b;border-radius:8px;padding:8px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px;">
                <span style="font-family:var(--font-mono);font-size:11px;color:#f59e0b;font-weight:700;">
                  ⚠️ ${debuffLabel(d.debuff_type)}
                </span>
                <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);">
                  ${t('attacks.expiresIn')} ${timeUntil(d.expires_at)}
                </span>
              </div>
            `).join('');
          })()}
        </div>
      ` : ''}

      <!-- Active outgoing blockade -->
      ${activeBlockade ? `
        <div style="background:rgba(59,130,246,0.08);border:1.5px solid #3b82f6;border-radius:8px;padding:10px 16px;margin-bottom:1rem;">
          <span style="font-family:var(--font-mono);font-size:12px;color:#3b82f6;font-weight:700;">
            ${t('attacks.activeBlockadeMsg')}
          </span>
        </div>
      ` : ''}

      <!-- Target selector -->
      <div style="background:var(--surface);border:1.5px solid var(--border);border-radius:8px;padding:1rem 1.5rem;margin-bottom:1.2rem;">
        <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);letter-spacing:2px;margin-bottom:10px;">
          ${t('attacks.selectTarget')}
        </div>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
          <select id="target-select"
            style="flex:1;min-width:220px;background:var(--surface2);border:1.5px solid var(--border);border-radius:6px;
            color:var(--text);font-family:var(--font-body);font-size:13px;padding:9px 12px;outline:none;">
            <option value="">${t('attacks.chooseNation')}</option>
            ${(targets||[]).map(nation => `
              <option value="${nation.nation_id}">
                #${nation.overall_rank} · ${nation.nation_name}${nation.alliance_tag ? ' [' + nation.alliance_tag + ']' : ''}
              </option>
            `).join('')}
          </select>
          <input type="text" id="target-search" placeholder="${t('attacks.searchNations')}"
            style="width:180px;background:var(--surface2);border:1.5px solid var(--border);border-radius:6px;
            color:var(--text);font-family:var(--font-body);font-size:13px;padding:9px 12px;outline:none;"/>
        </div>
        <div id="target-info" style="margin-top:10px;display:none;"></div>
      </div>

      <!-- Scenario categories -->
      <div id="scenario-area">
        ${Object.entries(getScenarios()).map(([cat, scenarios]) => `
          <div style="margin-bottom:1.5rem;">
            <div style="font-family:var(--font-title);font-size:16px;letter-spacing:2px;color:var(--text-muted);
              margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid var(--border);">
              ${categoryLabels()[cat]}
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px;">
              ${scenarios.map(s => scenarioCard(s, unitMap, isBlockaded)).join('')}
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Attack result -->
      <div id="attack-result" style="margin-bottom:1rem;display:none;"></div>

      <!-- Battle log -->
      ${(recentAttacks||[]).length ? `
        <div style="background:var(--surface);border:1.5px solid var(--border);border-radius:8px;overflow:hidden;">
          <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted);letter-spacing:2px;
            padding:8px 1rem;background:var(--surface2);border-bottom:1px solid var(--border);">
            ${t('attacks.recentLog')}
          </div>
          <div style="padding:0.5rem 0;">
            ${(recentAttacks||[]).map(a => battleLogRow(a, nation.id)).join('')}
          </div>
        </div>
      ` : ''}

    </div>
  `;

  bindAttackEvents(user, profile, nation, recentAttacks || [], unitMap, targets || []);
}

// ─── Scenario card ────────────────────────────────────────────────────────────

function scenarioCard(s, unitMap, isBlockaded) {
  const inv = unitMap[s.unit] || { qty: 0, level: 1 };
  const hasUnits = inv.qty > 0;
  const riskColor = RISK_COLORS[s.risk] || 'var(--text-muted)';

  const dimmed = !hasUnits;

  return `
    <div class="scenario-card" data-scenario="${s.id}"
      style="background:var(--surface);border:1.5px solid ${hasUnits && !dimmed ? s.color+'55' : 'var(--border)'};
      border-top:3px solid ${hasUnits && !dimmed ? s.color : 'var(--border)'};
      border-radius:8px;padding:14px 16px;
      opacity:${dimmed ? '0.45' : '1'};
      transition:all 0.15s;position:relative;">

      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:8px;">
        <div>
          <span style="font-size:20px;">${s.icon}</span>
          <div style="font-family:var(--font-title);font-size:14px;letter-spacing:1px;color:var(--text);margin-top:3px;">${s.name}</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0;">
          <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${riskColor};
            background:${riskColor}18;border:1px solid ${riskColor}44;padding:2px 6px;border-radius:4px;
            white-space:nowrap;">${i18n.t('attacks.' + {'LOW':'low','MEDIUM':'medium','HIGH':'high','VERY HIGH':'veryHigh'}[s.risk] || s.risk)}</span>
          <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--accent);
            background:var(--accent)18;border:1px solid var(--accent)44;padding:2px 6px;border-radius:4px;
            white-space:nowrap;">⏱️ ${s.turns} ${t('attacks.turns')}</span>
        </div>
      </div>

      <div style="font-size:12px;color:var(--text-muted);font-weight:500;margin-bottom:10px;line-height:1.5;">
        ${s.desc}
      </div>

      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px;">
        <div style="font-family:var(--font-mono);font-size:10px;color:${hasUnits ? s.color : '#e05252'};">
          ${s.unitLabel}: <strong>${inv.qty.toLocaleString()}</strong>
          ${inv.qty === 0 ? `⚠️ ${t('attacks.noneWarning')}` : ''}
        </div>
        ${s.requiresMissileQty ? `
          <div style="display:flex;align-items:center;gap:6px;">
            <input type="number" class="missile-qty" data-scenario="${s.id}"
              placeholder="qty" min="1" max="${inv.qty}"
              style="width:60px;background:var(--surface2);border:1.5px solid var(--border);border-radius:5px;
              color:var(--text);font-family:var(--font-mono);font-size:12px;padding:4px 6px;outline:none;text-align:center;"
              ${!hasUnits ? 'disabled' : ''} />
            <button class="btn-launch-scenario" data-scenario="${s.id}"
              ${!hasUnits ? 'disabled' : ''}
              style="font-family:var(--font-mono);font-size:11px;font-weight:700;padding:5px 12px;
              border-radius:5px;cursor:pointer;border:1.5px solid ${s.color};
              background:${s.color}18;color:${s.color};white-space:nowrap;
              ${!hasUnits ? 'opacity:0.4;cursor:not-allowed;' : ''}">
              ${t('attacks.launch')}
            </button>
          </div>
        ` : `
          <button class="btn-launch-scenario" data-scenario="${s.id}"
            ${dimmed ? 'disabled' : ''}
            style="font-family:var(--font-mono);font-size:11px;font-weight:700;padding:5px 14px;
            border-radius:5px;cursor:pointer;border:1.5px solid ${s.color};
            background:${s.color}18;color:${s.color};white-space:nowrap;
            ${dimmed ? 'opacity:0.4;cursor:not-allowed;' : ''}">
            ${t('attacks.execute')}
          </button>
        `}
      </div>
    </div>
  `;
}

// ─── Battle log row ───────────────────────────────────────────────────────────

function battleLogRow(a, myNationId) {
  const isAttacker  = a.attacker_nation_id === myNationId;
  const opponent    = isAttacker ? a.defender : a.attacker;
  const isWin       = a.success ? isAttacker : !isAttacker;
  const resultColor = isWin ? '#16a34a' : '#e05252';
  const resultLabel = isWin ? (isAttacker ? t('attacks.win') : t('attacks.defended')) : (isAttacker ? t('attacks.lost') : t('attacks.defeat'));

  const attLost = a.att_soldiers_lost || 0;
  const defLost = a.def_soldiers_lost || 0;
  const mySol   = isAttacker ? attLost : defLost;
  const oppSol  = isAttacker ? defLost : attLost;
  const land    = a.land_loss    || 0;
  const money   = a.money_loss ? Math.floor(a.money_loss / 2) : 0;

  const chips = [];
  if (mySol > 0)                        chips.push(`<span style="color:#f59e0b;">💀 ${mySol.toLocaleString()} ${t('attacks.yours')}</span>`);
  if (oppSol > 0)                       chips.push(`<span style="color:#e05252;">⚔️ ${oppSol.toLocaleString()} ${t('attacks.enemy')}</span>`);
  if (land > 0 && isAttacker && a.success)  chips.push(`<span style="color:var(--accent);">🗺️ +${land} ${t('attacks.land')}</span>`);
  if (land > 0 && !isAttacker && a.success) chips.push(`<span style="color:#e05252;">🗺️ -${land} ${t('attacks.land')}</span>`);
  if (money > 0 && isAttacker && a.success) chips.push(`<span style="color:#16a34a;">💰 +$${money.toLocaleString()}</span>`);
  if (a.defender_facilities_destroyed > 0 && isAttacker)
    chips.push(`<span style="color:#8b5cf6;">🏭 ${a.defender_facilities_destroyed} ${t('attacks.facDestroyed')}</span>`);
  if (a.special_effect) chips.push(`<span style="color:var(--accent);">✨ ${translateSpecialEffect(a.special_effect)}</span>`);

  // Try translated scenario name first, fall back to translated attack_type
  const scenarioDisplay = (() => {
    if (a.scenario_type) {
      const found = getScenarios()[a.attack_type]?.find(s => s.id === a.scenario_type);
      if (found) return found.name;
      // Try i18n key directly
      const words = a.scenario_type.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join('');
      const tr = i18n.t(`attacks.scenario${words}`, { defaultValue: '' });
      if (tr) return tr;
      return a.scenario_type;
    }
    if (a.attack_type) {
      const tr = i18n.t(`attacks.scenario${a.attack_type[0].toUpperCase() + a.attack_type.slice(1)}`, { defaultValue: '' });
      if (tr) return tr;
    }
    return a.attack_type || '—';
  })();

  return `
    <div class="battle-log-row" data-attack-id="${a.id}"
      style="display:flex;align-items:center;gap:12px;padding:10px 1rem;
      border-bottom:1px solid var(--border-dim);font-family:var(--font-mono);font-size:11px;
      cursor:pointer;transition:background 0.15s;"
      onmouseenter="this.style.background='var(--surface2)'"
      onmouseleave="this.style.background=''">
      <span style="font-size:16px;">${isAttacker ? '⚔️' : '🛡️'}</span>
      <div style="flex:1;min-width:0;">
        <div style="color:var(--text);display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
          <span>${isAttacker ? t('attacks.attackOn') : t('attacks.attackedBy')} <strong>${opponent?.name || 'Unknown'}</strong></span>
          <span style="color:var(--text-muted);font-size:9px;background:var(--surface2);border:1px solid var(--border);
            padding:1px 5px;border-radius:4px;">${scenarioDisplay}</span>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:4px;">
          ${chips.length ? chips.join('') : `<span style="color:var(--text-dim);">${translateBattleResultSummary(a.result_summary, a, isAttacker, opponent?.name) || '?'}</span>`}
        </div>
      </div>
      <div style="text-align:end;flex-shrink:0;">
        <div style="font-weight:700;color:${resultColor};">${resultLabel}</div>
        <div style="color:var(--text-muted);font-size:10px;">${new Date(a.attacked_at).toLocaleTimeString()}</div>
        <div style="font-size:9px;color:var(--accent);margin-top:2px;text-decoration:underline;">${t('attacks.viewReport')}</div>
      </div>
    </div>
  `;
}


// ─── Translation helpers for DB-stored English strings ────────────────────────

function translateSpecialEffect(effect) {
  if (!effect) return effect;
  // "3 industrial facilities destroyed" / "industrial facilities destroyed 3"
  const facMatch = effect.match(/(\d+)\s*(?:industrial\s*)?facilit/i) || effect.match(/facilit.*?(\d+)/i);
  if (facMatch) {
    const n = facMatch[1];
    return `${n} ${t('attacks.facDestroyed')}`;
  }
  if (/air.*superior|superior.*air/i.test(effect)) return t('attacks.scenarioAirSuperiority');
  if (/sead|air.*defens|defens.*suppress/i.test(effect)) return t('attacks.scenarioSead');
  if (/blockade/i.test(effect)) return t('attacks.scenarioNavalBlockade');
  if (/trojan/i.test(effect)) return t('attacks.missionTrojanHorse') || effect;
  if (/smokescreen/i.test(effect)) return t('attacks.missionCounterIntel') || effect;
  return effect;
}

function translateResultSummary(summary) {
  if (!summary) return summary;
  if (/missiles? got through|missiles? penetrat/i.test(summary)) {
    const mp = summary.match(/(\d+)/)?.[1] || '';
    const fd = summary.match(/(\d+)\s*facilit/i)?.[1] || '';
    if (mp && fd) return `${mp} ${t('attacks.missilesPenetrated')}. ${fd} ${t('attacks.facDestroyed')}`;
    return t('battleReport.summaryMissileHit', { penetrated: mp, facilities: fd });
  }
  if (/intercepted|missiles? lost/i.test(summary)) return t('battleReport.summaryMissileIntercepted');
  if (/air superior/i.test(summary)) return t('battleReport.summaryAirWin');
  if (/sead|air defens.*suppress/i.test(summary)) return t('battleReport.summarySEADWin');
  if (/blockade.*establish/i.test(summary)) return t('battleReport.summaryBlockadeWin');
  if (/blockade.*fail|fleet repel/i.test(summary)) return t('battleReport.summaryBlockadeFail');
  return summary;
}

// ─── Events ───────────────────────────────────────────────────────────────────

function bindAttackEvents(user, profile, nation, recentAttacks, unitMap, targets) {
  bindPageNav(user, profile, nation);

  // Target search filter
  document.getElementById('target-search').addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    const sel = document.getElementById('target-select');
    Array.from(sel.options).forEach(opt => {
      if (!opt.value) return;
      opt.hidden = !opt.text.toLowerCase().includes(q);
    });
  });

  // Target info panel
  document.getElementById('target-select').addEventListener('change', e => {
    const opt = e.target.selectedOptions[0];
    const info = document.getElementById('target-info');
    if (!opt?.value) { info.style.display = 'none'; return; }
    const t = targets.find(t => t.nation_id === opt.value);
    if (!t) return;
    info.style.display = 'block';
    info.innerHTML = `
      <div style="display:flex;gap:12px;flex-wrap:wrap;font-family:var(--font-mono);font-size:11px;color:var(--text-muted);">
        <span>🏆 ${i18n.t('attacks.targetRank')} #${t.overall_rank}</span>
        ${t.alliance_name ? `<span>🤝 ${t.alliance_name}</span>` : ''}
      </div>
    `;
  });

  // Battle log row click → report popup
  document.querySelectorAll('.battle-log-row').forEach(row => {
    row.addEventListener('click', () => {
      const attackId = row.getAttribute('data-attack-id');
      const attack = recentAttacks.find(a => a.id === attackId);
      if (attack) openBattleReport(attack, nation.id);
    });
  });

  // Scenario launch buttons
  document.querySelectorAll('.btn-launch-scenario').forEach(btn => {
    btn.addEventListener('click', async () => {
      const scenario  = btn.getAttribute('data-scenario');
      const targetId  = document.getElementById('target-select').value;
      if (!targetId) { showResult('error', t('attacks.errSelectTarget'), null, null, null); return; }
      if (nation.turns < 1) { showResult('error', t('attacks.errNotEnoughTurns'), null, null, null); return; }

      // Missile qty
      let missileQty = 0;
      const mqInput = document.querySelector(`.missile-qty[data-scenario="${scenario}"]`);
      if (mqInput) {
        missileQty = parseInt(mqInput.value) || 0;
        if (missileQty < 1) { showResult('error', t('attacks.errEnterMissiles'), null, null, null); return; }
        // Find the scenario to know which unit type to check
        const allScenarios = Object.values(getScenarios()).flat();
        const sc = allScenarios.find(s => s.id === scenario);
        const unitKey = sc?.unit || 'ballistic';
        const inv = unitMap[unitKey];
        if (inv && missileQty > inv.qty) {
          showResult('error', t('attacks.onlyHaveMissiles', {count: inv.qty}), null, null, null); return;
        }
      }

      const targetName = document.getElementById('target-select').selectedOptions[0]?.text?.split('·')[1]?.trim()?.split('[')[0]?.trim() || 'enemy';

      document.querySelectorAll('.btn-launch-scenario').forEach(b => b.disabled = true);
      showResult('loading', `${t('attacks.resultExecuting')} ${targetName}...`);

      const { data, error } = await sb.rpc('resolve_scenario_attack', {
        p_attacker_id: nation.id,
        p_defender_id: targetId,
        p_scenario:    scenario,
        p_missile_qty: missileQty,
      });

      document.querySelectorAll('.btn-launch-scenario').forEach(b => b.disabled = false);

      if (error || data?.error) {
        const msg = errorMessage(data?.error || error?.message);
        showResult('error', msg, null, null, null);
        return;
      }

      // Fetch the freshly-created attack record so we can show the full report popup immediately
      const { data: freshAttack } = await sb
        .from('attacks')
        .select('*, attacker:attacker_nation_id(name,flag_emoji), defender:defender_nation_id(name,flag_emoji)')
        .eq('attacker_nation_id', nation.id)
        .order('attacked_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Re-render the page first (updates turns, etc.), then open the report popup on top
      await renderAttacks(user, profile, { ...nation, turns: nation.turns - 1 });
      if (freshAttack) {
        openBattleReport(freshAttack, nation.id);
      } else {
        // Fallback: show the old result panel if we can't fetch the record
        showResult(data.success ? 'success' : 'defeat', data.summary, data, scenario, nation, () => {
          renderAttacks(user, profile, { ...nation, turns: nation.turns - 1 });
        });
      }
    });
  });
}

// ─── Result panel ─────────────────────────────────────────────────────────────

function showResult(type, message, data, scenario, nation, onDismiss) {
  const el = document.getElementById('attack-result');
  if (!el) return;
  el.style.display = 'block';
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  // Loading state has no dismiss button
  if (type === 'loading') {
    el.innerHTML = `
      <div style="background:rgba(40,88,208,0.06);border:1.5px solid var(--accent);border-radius:8px;padding:1rem 1.5rem;">
        <div style="font-family:var(--font-title);font-size:18px;letter-spacing:2px;color:var(--accent);">⚔️ ${t('attacks.resultExecuting')}</div>
        <div style="font-family:var(--font-mono);font-size:12px;color:var(--text-muted);margin-top:6px;">${message}</div>
      </div>
    `;
    return;
  }

  const colors = {
    success: { bg: 'rgba(22,163,74,0.08)',  border: '#16a34a', text: '#15803d' },
    defeat:  { bg: 'rgba(220,38,38,0.08)',  border: '#dc2626', text: '#dc2626' },
    error:   { bg: 'rgba(220,38,38,0.08)',  border: '#dc2626', text: '#dc2626' },
  };
  const c = colors[type] || colors.defeat;
  const scenInfo = scenario ? Object.values(getScenarios()).flat().find(s => s.id === scenario) : null;

  // Build equipment lost chips — sec_drop intentionally hidden (use intelligence to see enemy security)
  const chips = [];
  if (data) {
    if (data.att_eq_lost) {
      Object.entries(data.att_eq_lost).forEach(([k,v]) => {
        if (v > 0) chips.push(`<span style="color:#f59e0b;">💀 ${t('attacks.lostEquip', {count: v, unit: i18n.t('equipment.'+k, {defaultValue: k.replace(/_/g,' ')})})}</span>`);
      });
    }
    if (data.def_eq_lost) {
      Object.entries(data.def_eq_lost).forEach(([k,v]) => {
        if (v > 0) chips.push(`<span style="color:#16a34a;">🎯 ${t('attacks.destroyedEquip', {count: v, unit: i18n.t('equipment.'+k, {defaultValue: k.replace(/_/g,' ')})})}</span>`);
      });
    }
    if (data.missiles_through > 0) chips.push(`<span style="color:#8b5cf6;">🚀 ${data.missiles_through} ${t('attacks.missilesPenetrated')}</span>`);
    if (data.facilities_hit    > 0) chips.push(`<span style="color:#8b5cf6;">🏭 ${data.facilities_hit} ${t('attacks.facDestroyed')}</span>`);
    if (data.money_stolen      > 0) chips.push(`<span style="color:#16a34a;">💰 ${t('attacks.moneyLooted')} +$${data.money_stolen.toLocaleString()}</span>`);
    if (data.special_effect)        chips.push(`<span style="color:var(--accent);">✨ ${translateSpecialEffect(data.special_effect)}</span>`);
  }

  const headline = type === 'success'
    ? `🏆 ${scenInfo?.icon||''} ${t('attacks.resultSuccess')}`
    : type === 'error' ? `⚠️ ${t('attacks.resultError')}` : `💀 ${t('attacks.resultFailed')}`;

  el.innerHTML = `
    <div style="background:${c.bg};border:1.5px solid ${c.border};border-radius:8px;padding:1rem 1.5rem;position:relative;">
      <!-- Dismiss button -->
      <button id="btn-dismiss-result"
        style="position:absolute;top:10px;inset-inline-end:12px;background:none;border:none;
        font-size:18px;cursor:pointer;color:var(--text-muted);line-height:1;padding:2px 6px;
        transition:color 0.15s;" title="Dismiss">✕</button>

      <div style="font-family:var(--font-title);font-size:18px;letter-spacing:2px;color:${c.text};
        margin-bottom:8px;padding-inline-end:30px;">
        ${headline}
      </div>
      <div style="font-family:var(--font-mono);font-size:12px;color:var(--text-muted);
        margin-bottom:${chips.length ? '10px' : '0'};">${message}</div>
      ${chips.length ? `<div style="display:flex;gap:12px;flex-wrap:wrap;">${chips.join('')}</div>` : ''}

      ${onDismiss ? `
        <div style="margin-top:14px;padding-top:10px;border-top:1px solid ${c.border}30;display:flex;justify-content:flex-end;">
          <button id="btn-continue-result"
            style="font-family:var(--font-mono);font-size:12px;font-weight:700;
            padding:7px 18px;border-radius:6px;cursor:pointer;
            border:1.5px solid ${c.border};background:${c.bg};color:${c.text};">
            Continue →
          </button>
        </div>
      ` : ''}
    </div>
  `;

  // Dismiss — just hides the box, stays on page
  document.getElementById('btn-dismiss-result')?.addEventListener('click', () => {
    el.style.display = 'none';
    if (onDismiss) onDismiss();
  });

  // Continue — same as dismiss but labeled for clarity after a real attack result
  document.getElementById('btn-continue-result')?.addEventListener('click', () => {
    el.style.display = 'none';
    if (onDismiss) onDismiss();
  });
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

function debuffLabel(type) {
  const labels = {
    pop_growth_halted: t('attacks.debuffPopGrowth'),
    income_penalty_5pct: t('attacks.debuffIncomePenalty'),
    sam_disabled: t('attacks.debuffSamDisabled'),
    air_superiority_lost: t('attacks.debuffAirSup'),
  };
  return labels[type] || type;
}

function timeUntil(ts) {
  const diff = new Date(ts).getTime() - Date.now();
  if (diff <= 0) return 'expiring';
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m/60)}h ${m%60}m`;
}

function errorMessage(code) {
  const msgs = {
    not_enough_missiles:          t('attacks.errNotEnoughMissiles'),
    no_missiles_selected:         t('attacks.errEnterMissiles'),
    no_fighter_jets:              t('attacks.errNoFighters'),
    no_bombers:                   t('attacks.errNoBombers'),
    no_helicopters:               t('attacks.errNoHelis'),
    no_tanks:                     t('attacks.errNoTanks'),
    no_artillery:                 t('attacks.errNoArtillery'),
    no_naval_units:               t('attacks.errNoNaval'),
    no_destroyers:                t('attacks.errNoDestroyers'),
    no_enemy_submarines:          t('attacks.noEnemySubs'),
    requires_tanks_and_artillery: t('attacks.errRequiresTanksArtillery'),
    requires_ground_units:        t('attacks.errRequiresGroundUnits'),
    blockade_already_active:      t('attacks.errBlockadeActive'),
    not_under_blockade:           t('attacks.errNotBlockaded'),
    need_bombers_or_destroyers:   t('attacks.errNeedBombersDestroyers'),
    not_enough_turns:             t('attacks.errNotEnoughTurnsCode'),
    cannot_attack_self:           t('attacks.errCannotAttackSelf'),
    attacker_not_found:           t('attacks.errAttackerNotFound'),
    defender_not_found:           t('attacks.errDefenderNotFound'),
  };
  return msgs[code] || code || 'Attack failed.';
}
