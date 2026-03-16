import { renderPageTopbar, bindPageNav } from '../nav.js';
import i18n from '../i18n.js';
import { sb } from '../supabase.js';

const t = (key, params) => i18n.t(key, params);

let currentCategory = 'overall';

export async function renderRankings(user, profile, nation) {
  const app = document.getElementById('app');

  app.innerHTML = `
    ${renderPageTopbar(user, profile, nation, 'rankings')}
    <div class="inner-page" style="align-items:center;">

      <!-- Page title -->
      <div style="width:100%;max-width:900px;margin-bottom:1.5rem;">
        <div style="font-size:22px;font-weight:800;color:var(--text);">${t('rankings.title')}</div>
        <div style="font-size:12px;color:var(--text-muted);font-weight:500;margin-top:2px;" data-i18n="rankings.sub">${t('rankings.sub')}</div>
      </div>

      <!-- Category tabs -->
      <div style="width:100%;max-width:900px;display:flex;gap:6px;margin-bottom:1.2rem;flex-wrap:wrap;">
        ${categoryTab('overall',    '🏆', i18n.t('rankings.overall'))}
        ${categoryTab('military',   '⚔️', i18n.t('rankings.military'))}
        ${categoryTab('economy',    '💰', i18n.t('rankings.economy'))}
        ${categoryTab('land',       '🗺️', i18n.t('rankings.land'))}
        ${categoryTab('population', '👥', i18n.t('rankings.population'))}
        ${categoryTab('alliances',  '🤝', i18n.t('rankings.alliances'))}
      </div>

      <!-- My rank banner -->
      <div id="my-rank-banner" style="width:100%;max-width:900px;margin-bottom:1rem;"></div>

      <!-- Leaderboard -->
      <div style="width:100%;max-width:900px;">
        <div id="rankings-content">
          <div style="font-size:13px;color:var(--text-muted);padding:2rem 0;font-weight:500;">${t('rankings.loading')}</div>
        </div>
      </div>

    </div>
  `;

  bindPageNav(user, profile, nation);

  document.querySelectorAll('.rank-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      currentCategory = tab.getAttribute('data-cat');
      document.querySelectorAll('.rank-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      loadRankings(nation);
    });
  });

  loadRankings(nation);
}

function categoryTab(cat, icon, label) {
  return `
    <button class="rank-tab ${cat === 'overall' ? 'active' : ''}" data-cat="${cat}"
      style="display:flex;align-items:center;gap:6px;background:var(--surface);border:1px solid var(--border);
      color:var(--text-muted);font-family:var(--font-mono);font-size:11px;letter-spacing:1px;
      padding:7px 14px;cursor:pointer;transition:all 0.2s;">
      <span>${icon}</span><span>${label}</span>
    </button>
  `;
}

async function loadRankings(myNation) {
  const content = document.getElementById('rankings-content');
  content.innerHTML = `<div style="font-size:13px;color:var(--text-muted);padding:2rem 0;font-weight:500;">Loading...</div>`;

  if (currentCategory === 'alliances') {
    await loadAllianceRankings(content, myNation);
    return;
  }

  const { data: nations, error } = await sb
    .from('rankings')
    .select('*')
    .eq('round', 1)
    .order(rankColumn(), { ascending: true })
    .limit(100);

  if (error) {
    content.innerHTML = `<div style="font-family:var(--font-mono);font-size:12px;color:#f87171;padding:1rem;">${error.message}</div>`;
    return;
  }

  // Show my rank banner
  if (myNation) {
    const mine = nations.find(n => n.nation_id === myNation.id);
    if (mine) renderMyBanner(mine);
  }

  if (!nations.length) {
    content.innerHTML = `<div style="font-family:var(--font-mono);font-size:13px;color:var(--text-muted);padding:2rem 0;text-align:center;">${t('rankings.noNations')}</div>`;
    return;
  }

  content.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:6px;">
      ${nations.map((n, i) => rankRow(n, i, myNation)).join('')}
    </div>
  `;

  // Re-bind tab styles
  document.querySelectorAll('.rank-tab').forEach(tab => {
    const isActive = tab.getAttribute('data-cat') === currentCategory;
    tab.style.borderColor = isActive ? 'var(--accent)' : 'var(--border)';
    tab.style.color = isActive ? 'var(--accent)' : 'var(--text-muted)';
    tab.style.background = isActive ? 'rgba(201,168,76,0.06)' : 'var(--surface)';
  });
}

function rankColumn() {
  const cols = {
    overall: 'overall_rank',
    military: 'military_rank',
    economy: 'economy_rank',
    land: 'land_rank',
    population: 'population_rank',
  };
  return cols[currentCategory] || 'overall_rank';
}

function rankRow(n, i, myNation) {
  const rank = n[rankColumn()];
  const isMe = myNation && n.nation_id === myNation.id;

  const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;

  const mainValue = {
    overall:    { label: i18n.t('rankings.score'),      value: n.score.toLocaleString() },
    military:   { label: i18n.t('rankings.soldiers'),   value: n.soldiers.toLocaleString() },
    economy:    { label: i18n.t('rankings.treasury'),   value: '$' + n.money.toLocaleString() },
    land:       { label: i18n.t('rankings.land'),       value: n.land + ' ' + t('rankings.landSuffix') },
    population: { label: i18n.t('rankings.population'), value: n.population.toLocaleString() },
  }[currentCategory];

  return `
    <div style="
      display:grid;
      grid-template-columns:56px 1fr auto;
      align-items:center;
      gap:12px;
      padding:12px 16px;
      background:${isMe ? 'var(--accent-bg)' : 'var(--surface)'};
      border:1px solid ${isMe ? 'var(--accent-border)' : 'var(--border)'};
      border-radius:var(--radius-md);
      margin-bottom:6px;
      ${rank <= 3 ? 'border-inline-start: 3px solid ' + medalColor(rank) + ';' : ''}
      transition:background 0.15s;
    ">
      <!-- Rank -->
      <div style="font-size:${rank <= 3 ? '22' : '16'}px;font-weight:800;
        color:${rank <= 3 ? medalColor(rank) : 'var(--text-muted)'};text-align:center;">
        ${medal}
      </div>

      <!-- Nation info -->
      <div style="min-width:0;">
        <div style="font-size:15px;font-weight:700;
          color:${isMe ? 'var(--accent)' : 'var(--text)'};
          white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:flex;align-items:center;gap:6px;">
          ${n.nation_name}
          ${isMe ? `<span style="font-size:10px;color:var(--accent);font-weight:700;background:var(--accent-bg);padding:1px 6px;border-radius:4px;">${t('dashboard.youBadge')}</span>` : ''}
          ${n.is_bot ? '<span style="font-size:10px;color:var(--text-dim);background:var(--surface3);padding:1px 6px;border-radius:4px;border:1px solid var(--border);">BOT</span>' : ''}
          ${n.alliance_tag ? `<span style="font-size:10px;color:var(--accent-2);background:rgba(99,102,241,0.08);padding:1px 7px;border-radius:4px;border:1px solid rgba(99,102,241,0.2);font-family:var(--font-mono);font-weight:700;">[${n.alliance_tag}]</span>` : ''}
        </div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:2px;font-weight:500;">
          ${n.username}${n.alliance_name ? ' · ' + n.alliance_name : ''}
        </div>
      </div>

      <!-- Main value -->
      <div style="text-align:end;flex-shrink:0;">
        <div style="font-size:17px;font-weight:800;color:var(--accent);">
          ${mainValue.value}
        </div>
        <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;font-weight:600;margin-top:1px;">
          ${mainValue.label}
        </div>
      </div>
    </div>
  `;
}

function renderMyBanner(mine) {
  const banner = document.getElementById('my-rank-banner');
  if (!banner) return;

  banner.innerHTML = `
    <div style="
      display:grid;
      grid-template-columns:repeat(auto-fit,minmax(120px,1fr));
      gap:8px;
      padding:1rem 1.2rem;
      background:rgba(201,168,76,0.06);
      border:1px solid var(--accent-dim);
      border-inline-start:3px solid var(--accent);
    ">
      <div style="font-family:var(--font-mono);font-size:10px;color:var(--accent);letter-spacing:2px;
        grid-column:1/-1;margin-bottom:4px;">${t('rankings.yourStandings')}</div>
      ${miniRank('🏆', i18n.t('rankings.overall'),    '#' + mine.overall_rank)}
      ${miniRank('⚔️', i18n.t('rankings.military'),   '#' + mine.military_rank)}
      ${miniRank('💰', i18n.t('rankings.economy'),    '#' + mine.economy_rank)}
      ${miniRank('🗺️', i18n.t('rankings.land'),       '#' + mine.land_rank)}
      ${miniRank('👥', i18n.t('rankings.population'), '#' + mine.population_rank)}
    </div>
  `;
}

function miniRank(icon, label, value) {
  return `
    <div style="text-align:center;">
      <div style="font-size:16px;">${icon}</div>
      <div style="font-family:var(--font-title);font-size:18px;letter-spacing:2px;color:var(--accent);">${value}</div>
      <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);letter-spacing:1px;">${label}</div>
    </div>
  `;
}

function medalColor(rank) {
  return rank === 1 ? '#FFD700' : rank === 2 ? '#C0C0C0' : '#CD7F32';
}

async function loadAllianceRankings(content, myNation) {
  // Aggregate alliance stats from rankings view
  const { data } = await sb
    .from('rankings')
    .select('alliance_id, alliance_name, alliance_tag, score, soldiers, money, land, population')
    .eq('round', 1)
    .not('alliance_id', 'is', null);

  if (!data || data.length === 0) {
    content.innerHTML = `<div style="padding:2rem;text-align:center;font-size:13px;color:var(--text-muted);">${t('rankings.noAlliances')}</div>`;
    return;
  }

  // Group and aggregate by alliance
  const alMap = {};
  data.forEach(n => {
    if (!alMap[n.alliance_id]) {
      alMap[n.alliance_id] = { id: n.alliance_id, name: n.alliance_name, tag: n.alliance_tag, members: 0, score: 0, soldiers: 0, money: 0, land: 0, population: 0 };
    }
    alMap[n.alliance_id].members++;
    alMap[n.alliance_id].score      += Number(n.score) || 0;
    alMap[n.alliance_id].soldiers   += Number(n.soldiers) || 0;
    alMap[n.alliance_id].money      += Number(n.money) || 0;
    alMap[n.alliance_id].land       += Number(n.land) || 0;
    alMap[n.alliance_id].population += Number(n.population) || 0;
  });

  const alliances = Object.values(alMap).sort((a, b) => b.score - a.score);
  const myAllianceId = myNation?.alliance_id;

  content.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:6px;">
      ${alliances.map((al, i) => {
        const rank = i + 1;
        const isMe = al.id === myAllianceId;
        const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
        return `
          <div style="
            display:grid;grid-template-columns:56px 1fr auto;
            align-items:center;gap:12px;padding:14px 16px;
            background:${isMe ? 'var(--accent-bg)' : 'var(--surface)'};
            border:1px solid ${isMe ? 'var(--accent-border)' : 'var(--border)'};
            border-radius:var(--radius-md);
            ${rank <= 3 ? 'border-inline-start:3px solid '+medalColor(rank)+';' : ''}
          ">
            <div style="font-size:${rank<=3?'22':'16'}px;font-weight:800;text-align:center;
              color:${rank<=3?medalColor(rank):'var(--text-muted)'};">${medal}</div>
            <div>
              <div style="font-size:15px;font-weight:700;display:flex;align-items:center;gap:8px;">
                ${al.name}
                <span style="font-size:10px;color:var(--accent-2);background:rgba(99,102,241,0.08);
                  padding:1px 7px;border-radius:4px;border:1px solid rgba(99,102,241,0.2);
                  font-family:var(--font-mono);font-weight:700;">[${al.tag}]</span>
                ${isMe ? '<span style="font-size:10px;color:var(--accent);font-weight:700;background:var(--accent-bg);padding:1px 6px;border-radius:4px;">YOUR ALLIANCE</span>' : ''}
              </div>
              <div style="font-size:11px;color:var(--text-muted);font-weight:500;margin-top:3px;display:flex;gap:12px;">
                <span>👥 ${al.members} ${t('rankings.membersLabel')}</span>
                <span>⚔️ ${al.soldiers.toLocaleString()} ${t('rankings.soldiersLabel')}</span>
                <span>💰 $${(al.money/1000).toFixed(0)}k ${t('rankings.treasuryLabel')}</span>
                <span>🗺️ ${al.land} ${t('rankings.landLabel')}</span>
              </div>
            </div>
            <div style="text-align:end;flex-shrink:0;">
              <div style="font-size:17px;font-weight:800;color:var(--accent);">${fmtScore(al.score)}</div>
              <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">${t('rankings.combinedScore')}</div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function fmtScore(n) {
  if (!n) return '0';
  if (n >= 1e9) return (n/1e9).toFixed(1)+'B';
  if (n >= 1e6) return (n/1e6).toFixed(1)+'M';
  if (n >= 1e3) return (n/1e3).toFixed(0)+'k';
  return n.toString();
}
