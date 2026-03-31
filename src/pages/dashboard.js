import i18n, { translateDOM } from '../i18n.js';
import { sb } from '../supabase.js';
import { formatTimeLeft } from '../utils.js';
import { renderPageTopbar, bindPageNav } from '../nav.js';
import { openBattleReport, translateBattleResultSummary } from '../battleReport.js';

const t = (key, p) => i18n.t(key, p);

function generateDashboardBattleLog(attack, isAttacker) {
  const scenario = attack.scenario_type || attack.attack_type;
  const success = attack.success;
  
  // For attacker
  if (isAttacker) {
    // Missile Strike
    if (scenario === 'missile_strike' || attack.attack_type === 'missile') {
      return success ? t('battleReport.logMissileSuccess') : t('battleReport.logMissileIntercepted');
    }
    
    // SEAD
    if (scenario === 'sead' || scenario === 'suppress_air_defense') {
      return success ? t('battleReport.logSeadSuccess') : t('battleReport.logSeadFailure');
    }
    
    // Air Clash
    if (scenario === 'air_clash' || scenario === 'air_superiority') {
      return success ? t('battleReport.logAirSuccess') : t('battleReport.logAirFailure');
    }
    
    // Factory Bombing
    if (scenario === 'factory_bombing' || scenario === 'bomb_factories') {
      return success ? t('battleReport.logFactorySuccess') : t('battleReport.logFactoryFailure');
    }
    
    // Tank Hunt
    if (scenario === 'tank_hunt' || scenario === 'hunt_armor') {
      return success ? t('battleReport.logTankHuntSuccess') : t('battleReport.logGenericHit');
    }
    
    // Naval Raid
    if (scenario === 'naval_raid' || scenario === 'blockade') {
      return success ? t('battleReport.logNavalSuccess') : t('battleReport.logNavalFailure');
    }
    
    // Commando Raid
    if (scenario === 'commando_raid' || scenario === 'spec_ops') {
      return success ? t('battleReport.logCommandoSuccess') : t('battleReport.logGenericHit');
    }
    
    // Mine Clearing
    if (scenario === 'mine_clearing' || scenario === 'clear_mines') {
      const counterBattery = attack.counter_battery_fire || false;
      return counterBattery ? t('battleReport.logMineClearingCounter') : t('battleReport.logMineClearingSuccess');
    }
    
    // Total Invasion
    if (scenario === 'total_invasion' || scenario === 'full_assault' || attack.attack_type === 'conquest') {
      if (success) {
        const hitMines = attack.hit_mines || attack.mine_casualties || false;
        return hitMines ? t('battleReport.logInvasionMines') : t('battleReport.logInvasionSuccess');
      }
      return t('battleReport.logGenericHit');
    }
    
    // Scorched Earth
    if (scenario === 'scorched_earth' || attack.attack_type === 'destruction') {
      return success ? t('battleReport.logScorchedEarth') : t('battleReport.logGenericHit');
    }
    
    // Generic fallback
    return success ? t('battleReport.summaryConquestWin', { land: attack.land_loss || 0, defLost: (attack.def_soldiers_lost || 0).toLocaleString(), attLost: (attack.att_soldiers_lost || 0).toLocaleString() }) : t('battleReport.summaryConquestFail', { attLost: (attack.att_soldiers_lost || 0).toLocaleString() });
  }
  
  // For defender
  const wasRepelled = !success;
  
  if (wasRepelled) {
    if (scenario === 'missile_strike') return t('battleLog.defMissileRepelled');
    if (scenario === 'sead' || scenario === 'suppress_air_defense') return t('battleLog.defSeadRepelled');
    if (scenario === 'air_clash' || scenario === 'air_superiority') return t('battleLog.defAirRepelled');
    if (scenario === 'factory_bombing' || scenario === 'bomb_factories') return t('battleLog.defFactoryRepelled');
    if (scenario === 'naval_raid' || scenario === 'blockade') return t('battleLog.defNavalRepelled');
    if (scenario === 'total_invasion' || scenario === 'full_assault') return t('battleLog.defInvasionRepelled');
    return t('battleLog.defGenericRepelled');
  }
  
  // Defender was successfully attacked
  if (scenario === 'missile_strike') return t('battleLog.defMissileHit');
  if (scenario === 'sead' || scenario === 'suppress_air_defense') return t('battleLog.defSeadHit');
  if (scenario === 'air_clash' || scenario === 'air_superiority') return t('battleLog.defAirHit');
  if (scenario === 'factory_bombing' || scenario === 'bomb_factories') return t('battleLog.defFactoryHit');
  if (scenario === 'tank_hunt' || scenario === 'hunt_armor') return t('battleLog.defTankHuntHit');
  if (scenario === 'naval_raid' || scenario === 'blockade') return t('battleLog.defNavalHit');
  if (scenario === 'commando_raid' || scenario === 'spec_ops') return t('battleLog.defCommandoHit');
  if (scenario === 'mine_clearing' || scenario === 'clear_mines') return t('battleLog.defMineCleared');
  if (scenario === 'total_invasion' || scenario === 'full_assault') return t('battleLog.defInvasionHit');
  if (scenario === 'scorched_earth') return t('battleLog.defScorchedEarth');
  
  return t('battleLog.defGenericHit');
}

export async function renderDashboard(user, profile) {
  const app = document.getElementById('app');
  app.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-size:13px;color:var(--text-muted);font-family:var(--font-body);font-weight:500;">${t('dashboard.loading')}</div>`;

  const currentRound = 1;

  const { data: nation } = await sb
    .from('nations')
    .select('*')
    .eq('owner_id', user.id)
    .eq('round', currentRound)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!nation) { renderCreateNation(app, user, profile, currentRound); return; }
  if (!nation.is_alive) { renderDestroyedNation(app, user, profile, nation, currentRound); return; }

  const [
    { data: facilities },
    { data: facilityTypes },
    { data: myUnits },
    { data: topNations },
    { data: roundConfig },
    { data: recentAttacks },
    { data: alMemberCount },
    { data: alInfo },
    { data: myMembership },
    { data: intelData },
  ] = await Promise.all([
    sb.from('facilities').select('quantity, facility_type_id').eq('nation_id', nation.id),
    sb.from('facility_types').select('id, income_per_hour, maintenance_per_hour'),
    sb.from('military_units').select('quantity, equipment_types(attack_power, defense_power, maintenance_per_2h)').eq('nation_id', nation.id),
    sb.from('rankings').select('nation_id, nation_name, username, score, overall_rank, is_bot, alliance_tag, alliance_name').eq('round', 1).order('overall_rank').limit(5),
    sb.from('game_config').select('value').eq('key', 'round_restart_date').single(),
    sb.from('attacks')
      .select('*, attacker:attacker_nation_id(name), defender:defender_nation_id(name)')
      .or(`attacker_nation_id.eq.${nation.id},defender_nation_id.eq.${nation.id}`)
      .order('attacked_at', { ascending: false })
      .limit(4),
    nation.alliance_id
      ? sb.from('alliance_members').select('count').eq('alliance_id', nation.alliance_id).single()
      : Promise.resolve({ data: null }),
    nation.alliance_id
      ? sb.from('alliances').select('name, tag').eq('id', nation.alliance_id).single()
      : Promise.resolve({ data: null }),
    nation.alliance_id
      ? sb.from('alliance_members').select('role').eq('nation_id', nation.id).maybeSingle()
      : Promise.resolve({ data: null }),
    sb.from('intelligence').select('spies, satellites, spy_level, sat_level, anti_spy_level, anti_sat_level').eq('nation_id', nation.id).maybeSingle(),
  ]);

  const facMap = Object.fromEntries((facilities || []).map(f => [f.facility_type_id, f.quantity]));
  const ftMap  = Object.fromEntries((facilityTypes || []).map(f => [f.id, f]));
  let incomeHr = 0, upkeepHr = 0, totalFacilities = 0;
  Object.entries(facMap).forEach(([id, qty]) => {
    totalFacilities += qty;
    if (ftMap[id]) { incomeHr += qty * ftMap[id].income_per_hour; upkeepHr += qty * ftMap[id].maintenance_per_hour; }
  });
  
  // Apply security penalty to income
  // Income is reduced based on security, but cannot drop below 40%
  // Formula: income * (0.4 + (security / 100) * 0.6)
  // At 100% security: income * (0.4 + 1.0 * 0.6) = income * 1.0 = 100% income
  // At 0% security: income * (0.4 + 0 * 0.6) = income * 0.4 = 40% income
  const securityMultiplier = 0.4 + (nation.security_index / 100) * 0.6;
  const baseIncomeHr = incomeHr;
  incomeHr = Math.floor(incomeHr * securityMultiplier);
  
  const netHr = incomeHr - upkeepHr;

  let myAtk = 0, myDef = 0, myMaint2h = 0;
  (myUnits || []).forEach(u => {
    myAtk     += u.quantity * (u.equipment_types?.attack_power      || 0);
    myDef     += u.quantity * (u.equipment_types?.defense_power     || 0);
    myMaint2h += u.quantity * (u.equipment_types?.maintenance_per_2h || 0);
  });
  myAtk += Math.floor(nation.soldiers / 1000) * 50;
  myDef += Math.floor(nation.soldiers / 1000) * 50;

  const roundEndMs = roundConfig?.value ? new Date(roundConfig.value).getTime() - Date.now() : 0;
  const turnPct    = Math.round((nation.turns / 200) * 100);

  app.innerHTML = `
    ${renderPageTopbar(user, profile, nation, 'dashboard')}
    <div class="shell">

      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:10px;">
        <div class="nation-pill">
          <div class="nation-icon" style="background:linear-gradient(135deg,var(--navy),var(--accent));font-size:16px;font-weight:800;color:#fff;letter-spacing:-1px;">
            ${nation.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div class="nation-pill-name">${nation.name}</div>
            <div class="nation-pill-sub">${profile.username}${profile.is_admin ? ' · ' + t('dashboard.admin') : ''} · ${t('dashboard.secLabel')} ${nation.security_index}%</div>
          </div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;align-items:stretch;">
        <div class="turns-strip" style="margin-bottom:0;">
          <div class="turns-count-wrap">
            <div class="turns-big">${nation.turns}</div>
            <div class="turns-max">/ 200</div>
          </div>
          <div class="turns-bar-wrap">
            <div class="turns-track">
              <div class="turns-fill" style="width:${turnPct}%"></div>
            </div>
            <div class="turns-info">
              <span>${turnPct}% ${t('dashboard.capacity')}</span>
            </div>
          </div>
          <div class="turns-timer">
            <div class="turns-timer-val" id="turn-countdown-clock">--:--</div>
            <div class="turns-timer-lbl">${t('dashboard.nextTurn')}</div>
          </div>
        </div>
        ${securityGauge(nation.security_index)}
      </div>

      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px;">
        ${statCard('💰', '$'+fmt(nation.money),         t('dashboard.money'),       netHr>=0?`+$${fmt(netHr)}${t('dashboard.perHourUnit')}`:`-$${fmt(Math.abs(netHr))}${t('dashboard.perHourUnit')}`, netHr>=0?'up':'down')}
        ${statCard('👥', fmt(nation.population),         t('dashboard.population'),  `+10,000/${t('dashboard.per20Min')}`,  'up')}
        ${statCard('🗺️', nation.land+' '+t('dashboard.landUnits'),           t('dashboard.land'),        `${totalFacilities} ${t('dashboard.facilities')}`, 'neutral')}
        ${statCard('⚔️', myAtk.toLocaleString(),         t('dashboard.attackPower'), '🛡️ '+myDef.toLocaleString()+' '+t('dashboard.defenseAbbr'), 'neutral')}
      </div>

      <div class="section-grid">
        ${sectionCard('⚔️', t('nav.military'),
          nation.soldiers.toLocaleString(), t('dashboard.soldiers'),
          myAtk.toLocaleString()+' '+t('dashboard.pts'), t('dashboard.attackPower'),
          myDef.toLocaleString()+' '+t('dashboard.pts'), t('dashboard.defensePower'),
          myMaint2h > 0 ? '-$'+fmt(myMaint2h)+t('dashboard.per2HoursUnit') : '$0'+t('dashboard.per2HoursUnit'), t('dashboard.maintenance'),
          '#e05252', Math.min(Math.round((myAtk / 5000) * 100), 100), 'military')}

        ${sectionCard('🏭', t('nav.economy'),
          '+$'+fmt(incomeHr)+t('dashboard.perHourUnit'), t('dashboard.income'),
          '-$'+fmt(upkeepHr)+t('dashboard.perHourUnit'), t('dashboard.upkeep'),
          '+$'+fmt(netHr)+t('dashboard.perHourUnit'),   t('dashboard.net'),
          totalFacilities+' '+t('dashboard.built'), t('dashboard.facilities'),
          '#16a34a', Math.min(Math.round((incomeHr / 10000) * 100), 100), 'economy')}

        ${sectionCard('🤝', t('nav.alliances'),
          alInfo ? alInfo.name : t('dashboard.noAlliance'), alInfo ? '['+alInfo.tag+']' : t('dashboard.statusLabel'),
          alInfo ? (alMemberCount?.count || 1)+' '+t('dashboard.membersLabel') : '—', t('dashboard.members'),
          alInfo ? t('alliances.'+(myMembership?.role||'member')+'Badge') || myMembership?.role || '—' : '—', t('dashboard.yourRole'),
          alInfo ? t('dashboard.active') : t('dashboard.joinOrCreate'), t('dashboard.alliance'),
          '#6366f1', alInfo ? 60 : 0, 'alliances')}

        ${sectionCard('🔍', t('nav.intelligence'),
          (intelData?.spies||0)+' '+t('dashboard.spiesLabel'), t('dashboard.spies'),
          (intelData?.satellites||0)+' '+t('dashboard.satsLabel'), t('dashboard.satellites'),
          (intelData?.spy_level||0)+' / '+(intelData?.sat_level||0), t('dashboard.spySatLevel'),
          t('dashboard.antiLabel')+': '+(intelData?.anti_spy_level||0)+' / '+(intelData?.anti_sat_level||0), t('dashboard.antiSpySat'),
          '#f59e0b', Math.min((((intelData?.spy_level||0) + (intelData?.sat_level||0)) / 2 / 10)*100, 100), 'intelligence')}
      </div>

      <div class="bottom-row">
        <div class="card">
          <div class="card-header">
            <div class="card-title">${t('dashboard.recentEvents')}</div>
            <button class="card-link" data-page="attacks">${t('dashboard.viewAttacks')}</button>
          </div>
          ${(recentAttacks||[]).length === 0
            ? `<div style="padding:20px 18px;font-size:13px;color:var(--text-muted);font-weight:500;">${t('dashboard.noActivity')}</div>`
            : (recentAttacks||[]).map(a => {
                const isAtt = a.attacker_nation_id === nation.id;
                const opp   = isAtt ? a.defender : a.attacker;
                const win   = a.success ? isAtt : !isAtt;
                
                // Generate battle log summary
                const battleLog = generateDashboardBattleLog(a, isAtt);
                
                return `
                  <div class="event-item dash-battle-row" data-attack-id="${a.id}"
                    style="cursor:pointer;transition:background 0.15s;"
                    onmouseenter="this.style.background='var(--surface2)'"
                    onmouseleave="this.style.background=''">
                    <div class="event-dot" style="background:${win?'var(--success)':'var(--danger)'};"></div>
                    <div class="event-body">
                      <div class="event-title">${isAtt?t('dashboard.attackOn'):t('dashboard.attackedBy')} <strong>${opp?.name||t('battleReport.unknownNation')}</strong>
                        <span style="font-size:9px;color:var(--text-muted);background:var(--surface2);border:1px solid var(--border);
                          padding:1px 5px;border-radius:4px;margin-inline-start:4px;text-transform:uppercase;">${translateAttackType(a.attack_type, a.scenario_type)}</span>
                      </div>
                      <div style="font-size:11px;color:var(--text-muted);margin-top:4px;line-height:1.5;">
                        ${battleLog}
                      </div>
                    </div>
                    <div style="text-align:end;flex-shrink:0;">
                      <div class="event-time">${new Date(a.attacked_at).toLocaleTimeString()}</div>
                      <div style="font-size:9px;color:var(--accent);margin-top:2px;text-decoration:underline;">${t('dashboard.details')}</div>
                    </div>
                  </div>
                `;
              }).join('')
          }
        </div>

        <div style="display:flex;flex-direction:column;gap:10px;">
          <div class="card">
            <div class="card-header">
              <div class="card-title">${t('dashboard.topNations')}</div>
              <button class="card-link" data-page="rankings">${t('dashboard.viewAll')}</button>
            </div>
            ${(topNations||[]).map((n, i) => `
              <div class="rank-row ${n.nation_id===nation.id?'me':''}">
                <div class="rank-pos">${n.overall_rank}</div>
                <div class="rank-name">
                  ${n.nation_name}
                  ${n.nation_id===nation.id?`<span class="rank-you">${t('dashboard.youBadge')}</span>`:''}
                  ${n.is_bot?`<span class="rank-bot">${t('dashboard.botBadge')}</span>`:''}
                  ${n.alliance_tag?`<span style="font-size:9px;color:var(--accent-2);background:rgba(99,102,241,0.08);padding:1px 5px;border-radius:4px;border:1px solid rgba(99,102,241,0.2);font-family:var(--font-mono);font-weight:700;">[${n.alliance_tag}]</span>`:''}
                </div>
                <div class="rank-score">${fmtScore(n.score)}</div>
              </div>
            `).join('')}
          </div>

          <div class="card" style="padding:16px 18px;">
            <div style="font-size:10px;font-weight:700;color:var(--text-muted);text-transform:uppercase;
              letter-spacing:0.5px;margin-bottom:12px;">${t('dashboard.roundEnds')}</div>
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;" id="round-clock">
              ${roundEndMs > 0 ? clockBlocks(roundEndMs) : `<div style="font-size:13px;color:var(--danger);font-weight:700;grid-column:span 4;">${t('dashboard.roundEndingSoon')}</div>`}
            </div>
            <div style="margin-top:12px;height:3px;background:var(--border);border-radius:2px;overflow:hidden;">
              <div style="height:100%;background:linear-gradient(90deg,var(--accent),var(--accent-2));border-radius:2px;
                width:${roundEndMs>0?Math.max(2,Math.round((1-roundEndMs/(4*30*24*3600*1000))*100)):100}%;"></div>
            </div>
          </div>
        </div>
      </div>

    </div>
  `;

  startCountdown(nation.turns, user, profile);
  startRoundClock(roundConfig?.value);
  bindPageNav(user, profile, nation);

  document.querySelectorAll('.dash-battle-row').forEach(row => {
    row.addEventListener('click', () => {
      const attackId = row.getAttribute('data-attack-id');
      const attack = (recentAttacks || []).find(a => a.id === attackId);
      if (attack) openBattleReport(attack, nation.id);
    });
  });
}

function renderCreateNation(app, user, profile, round) {
  app.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;">
      <div style="width:100%;max-width:500px;">
        <div class="card" style="padding:28px;">
          <div style="text-align:center;margin-bottom:22px;">
            <div style="font-size:44px;margin-bottom:10px;">🌍</div>
            <div style="font-size:20px;font-weight:800;margin-bottom:6px;" data-i18n="nation.foundTitle"></div>
            <div style="font-size:13px;color:var(--text-muted);font-weight:500;" data-i18n="nation.foundSubtitle" data-i18n-params='{"round":${round}}'></div>
          </div>
          <div class="field">
            <label data-i18n="nation.nameLabel"></label>
            <input type="text" id="nation-name" data-i18n-placeholder="nation.namePlaceholder" maxlength="40"/>
          </div>
          <div style="background:var(--surface2);border-radius:var(--radius-md);padding:12px 14px;margin-bottom:16px;font-size:12px;color:var(--text-muted);font-weight:500;line-height:1.9;">
            <strong style="color:var(--text);">${t('nation.startingStats')}</strong><br>
            1,000,000 ${t('dashboard.population')} &nbsp;·&nbsp; 100 ${t('dashboard.land')} ${t('dashboard.landUnits')}<br>
            $50,000 ${t('dashboard.treasury')} &nbsp;·&nbsp; 100% ${t('dashboard.security')} &nbsp;·&nbsp; 100 ${t('dashboard.turns')}
          </div>
          <button class="btn-submit" id="btn-found" data-i18n="nation.deployBtn"></button>
          <div class="msg" id="found-msg"></div>
        </div>
        <div style="text-align:center;margin-top:14px;">
          <button class="btn btn-ghost" id="btn-signout" style="font-size:12px;">${t('nav.signOut')}</button>
        </div>
      </div>
    </div>
  `;
  translateDOM();
  document.getElementById('btn-signout').addEventListener('click', () => sb.auth.signOut());
  document.getElementById('btn-found').addEventListener('click', async () => {
    const name = document.getElementById('nation-name').value.trim();
    if (!name || name.length < 2) { showMsg('found-msg','error',t('nation.errNameShort')); return; }
    const emojiRegex = /[\u{1F000}-\u{1FFFF}\u{2600}-\u{27FF}\u{2702}-\u{27B0}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}]/u;
    if (emojiRegex.test(name)) { showMsg('found-msg','error',t('nation.errNameEmoji')); return; }
    const btn = document.getElementById('btn-found');
    btn.disabled = true; btn.textContent = t('nation.deploying');
    const { data: cfg } = await sb.from('game_config').select('key,value').in('key',['starting_population','starting_land','starting_money']);
    const c = Object.fromEntries((cfg||[]).map(r=>[r.key,parseInt(r.value)]));
    const flags = ['🔴','🔵','🟢','🟡','🟠','🟣','⚫','🏴'];
    const flag = flags[Math.floor(Math.random() * flags.length)];
    const { error } = await sb.from('nations').insert({
      owner_id: user.id, name, flag_emoji: flag, round,
      population: c.starting_population||1000000,
      land: c.starting_land||100,
      money: c.starting_money||50000,
    });
    if (error) {
      showMsg('found-msg','error', error.message.includes('unique') ? t('nation.errNameTaken') : error.message);
      btn.disabled = false; btn.textContent = t('nation.deployBtn');
    } else {
      renderDashboard(user, profile);
    }
  });
}

function renderDestroyedNation(app, user, profile, nation, round) {
  app.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;">
      <div style="width:100%;max-width:460px;">
        <div class="card" style="padding:28px;text-align:center;border-top:3px solid var(--danger);">
          <div style="font-size:44px;margin-bottom:10px;">💀</div>
          <div style="font-size:20px;font-weight:800;color:var(--danger);margin-bottom:6px;" data-i18n="nation.fallenTitle"></div>
          <div style="font-size:13px;color:var(--text-muted);font-weight:500;margin-bottom:16px;">
            <strong>${nation.name}</strong> — <span data-i18n="nation.fallenSub"></span>
          </div>
          ${nation.destroy_reason ? `<div class="badge badge-red" style="margin-bottom:16px;">${nation.destroy_reason}</div>` : ''}
          <div style="font-size:13px;color:var(--text-muted);font-weight:500;margin-bottom:20px;line-height:1.7;"
            data-i18n="nation.stillActive" data-i18n-params='{"username":"${profile.username}","round":${round}}'></div>
          <button class="btn-submit" id="btn-rise" data-i18n="nation.riseBtn"></button>
        </div>
        <div style="text-align:center;margin-top:14px;">
          <button class="btn btn-ghost" id="btn-signout" style="font-size:12px;">${t('nav.signOut')}</button>
        </div>
      </div>
    </div>
  `;
  translateDOM();
  document.getElementById('btn-rise').addEventListener('click', () => renderCreateNation(app, user, profile, round));
  document.getElementById('btn-signout').addEventListener('click', () => sb.auth.signOut());
}


// ─── Translation helpers for DB-stored strings ────────────────────────────────
function translateAttackType(attackType, scenarioType) {
  if (!attackType) return '—';
  if (scenarioType) {
    const words = scenarioType.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join('');
    const tr = i18n.t('attacks.scenario' + words, { defaultValue: '' });
    if (tr) return tr;
  }
  const words = attackType.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join('');
  const tr = i18n.t('attacks.scenario' + words, { defaultValue: '' });
  return tr || attackType.toUpperCase();
}


function startCountdown(currentTurns, user, profile) {
  const clock = document.getElementById('turn-countdown-clock');
  if (!clock) return;
  let pollTimer = null;
  function nextCronMs() {
    const now = new Date();
    const m = now.getMinutes();
    const nextQ = Math.ceil((m + 1) / 15) * 15;
    const next = new Date(now);
    next.setSeconds(0); next.setMilliseconds(0);
    if (nextQ >= 60) { next.setMinutes(0); next.setHours(now.getHours() + 1); }
    else { next.setMinutes(nextQ); }
    return next.getTime();
  }
  function tick() {
    if (!document.getElementById('turn-countdown-clock')) { clearTimeout(pollTimer); return; }
    const diff = nextCronMs() - Date.now();
    if (diff <= 0) {
      clock.textContent = t('dashboard.ready');
      clock.style.fontSize = '13px';
      pollTimer = setTimeout(() => poll(currentTurns, user, profile), 30000);
      return;
    }
    const str = `${String(Math.floor(diff/60000)).padStart(2,'0')}:${String(Math.floor((diff%60000)/1000)).padStart(2,'0')}`;
    clock.textContent = str;
    clock.style.fontSize = '';
    setTimeout(tick, 1000);
  }
  tick();
}

async function poll(prev, user, profile) {
  if (!document.getElementById('turn-countdown-clock')) return;
  const { data } = await sb.from('nations').select('turns').eq('owner_id', user.id).eq('is_alive', true).maybeSingle();
  if (data && data.turns > prev) renderDashboard(user, profile);
  else setTimeout(() => poll(prev, user, profile), 30000);
}

function statCard(icon, val, lbl, delta, deltaType) {
  return `
    <div class="stat-card">
      <span class="stat-icon">${icon}</span>
      <div class="stat-val">${val}</div>
      <div class="stat-lbl">${lbl}</div>
      <div class="stat-delta ${deltaType}">${delta}</div>
    </div>
  `;
}

function sectionCard(icon, title, v1, l1, v2, l2, v3, l3, v4, l4, color, barPct, page) {
  return `
    <div class="section-card" ${page ? `data-page="${page}"` : ''}>
      <div class="section-head">
        <div class="section-title"><span>${icon}</span>${title}</div>
        ${page ? `<span class="section-arrow">→</span>` : `<span class="badge badge-gray" style="font-size:10px;">${t('comingSoon')}</span>`}
      </div>
      <div class="section-bar"><div class="section-bar-fill" style="width:${barPct}%;background:${color};"></div></div>
      <div class="section-data">
        <div class="section-datum"><div class="section-datum-val">${v1}</div><div class="section-datum-lbl">${l1}</div></div>
        <div class="section-datum"><div class="section-datum-val">${v2}</div><div class="section-datum-lbl">${l2}</div></div>
        <div class="section-datum"><div class="section-datum-val">${v3}</div><div class="section-datum-lbl">${l3}</div></div>
        <div class="section-datum"><div class="section-datum-val">${v4}</div><div class="section-datum-lbl">${l4}</div></div>
      </div>
    </div>
  `;
}

function securityGauge(idx) {
  const getColor = pct => {
    if (pct <= 30) return { fill: '#ef4444', track: 'rgba(239,68,68,0.08)',  label: t('dashboard.secCritical'), textColor: '#ef4444' };
    if (pct <= 50) return { fill: '#f97316', track: 'rgba(249,115,22,0.08)', label: t('dashboard.secLow'),      textColor: '#f97316' };
    if (pct <= 70) return { fill: '#eab308', track: 'rgba(234,179,8,0.08)',  label: t('dashboard.secModerate'), textColor: '#ca8a04' };
    if (pct <= 85) return { fill: '#14b8a6', track: 'rgba(20,184,166,0.08)', label: t('dashboard.secGood'),     textColor: '#0d9488' };
    return               { fill: '#22c55e', track: 'rgba(34,197,94,0.08)',   label: t('dashboard.secSecure'),   textColor: '#16a34a' };
  };
  const c = getColor(idx);
  const ticks = Array.from({length: 10}, (_, i) => {
    const filled = idx >= (i + 1) * 10;
    return `<div style="flex:1;height:100%;border-radius:2px;margin:0 1px;background:${filled ? c.fill : 'var(--border)'};opacity:${filled ? 1 : 0.35};"></div>`;
  }).join('');
  const effects = (() => {
    // Calculate actual income percentage: 40% floor + (security * 60% variable)
    const incomePct = Math.floor(40 + (idx * 0.6));
    if (idx <= 30) return t('dashboard.incomeLocked'); // "Income locked at 40%"
    if (idx >= 100) return t('dashboard.fullIncome'); // "Full income"
    return t('dashboard.incomeAt', { pct: incomePct }); // "Income at X%"
  })();

  return `
    <div style="background:var(--surface);border:1px solid ${c.fill}35;border-radius:var(--radius-lg);
      padding:10px 14px;box-shadow:var(--shadow-sm);height:100%;
      background:linear-gradient(135deg,var(--surface) 0%,${c.track} 100%);
      display:flex;flex-direction:column;justify-content:space-between;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
        <span style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;">🛡️ ${t('dashboard.secLabel')}</span>
        <span style="font-size:10px;background:${c.fill}18;border:1px solid ${c.fill}45;border-radius:20px;
          padding:2px 8px;font-weight:800;color:${c.textColor};">${c.label}</span>
      </div>
      <div style="font-size:22px;font-weight:800;color:${c.textColor};font-family:var(--font-mono);line-height:1;margin-bottom:6px;">
        ${idx}<span style="font-size:14px;font-weight:600;">%</span>
      </div>
      <div style="display:flex;height:4px;align-items:stretch;margin-bottom:4px;">${ticks}</div>
      <div style="font-size:11px;color:var(--text-muted);font-weight:500;">${effects}</div>
    </div>
  `;
}

function clockBlocks(ms) {
  const totalSecs = Math.floor(ms / 1000);
  const d = Math.floor(totalSecs / 86400);
  const h = Math.floor((totalSecs % 86400) / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  return [
    { val: d, lbl: t('dashboard.days') },
    { val: h, lbl: t('dashboard.hrs') },
    { val: m, lbl: t('dashboard.min') },
    { val: s, lbl: t('dashboard.sec') },
  ].map(({ val, lbl }) => `
    <div style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-md);padding:10px 6px;text-align:center;">
      <div style="font-size:22px;font-weight:800;font-family:var(--font-mono);color:var(--accent);line-height:1;">${String(val).padStart(2,'0')}</div>
      <div style="font-size:9px;font-weight:700;color:var(--text-dim);letter-spacing:0.5px;margin-top:4px;">${lbl}</div>
    </div>
  `).join('');
}

function startRoundClock(endDateStr) {
  if (!endDateStr) return;
  function tick() {
    const el = document.getElementById('round-clock');
    if (!el) return;
    const diff = new Date(endDateStr).getTime() - Date.now();
    if (diff <= 0) {
      el.innerHTML = `<div style="font-size:13px;color:var(--danger);font-weight:700;grid-column:span 4;">${t('dashboard.roundEndingSoon')}</div>`;
      return;
    }
    el.innerHTML = clockBlocks(diff);
    setTimeout(tick, 1000);
  }
  tick();
}

function showMsg(id, type, text) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.className = 'msg ' + type + ' show';
}

function fmt(n) {
  if (Math.abs(n) >= 1000000) return (n/1000000).toFixed(1)+'M';
  if (Math.abs(n) >= 1000)    return (n/1000).toFixed(1)+'k';
  return Math.round(n).toString();
}

function fmtScore(n) {
  if (!n) return '0';
  if (n >= 1000000) return (n/1000000).toFixed(1)+'M';
  if (n >= 1000)    return (n/1000).toFixed(0)+'k';
  return n.toString();
}
