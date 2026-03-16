import i18n from '../i18n.js';
import { renderPageTopbar, bindPageNav } from '../nav.js';
import { sb } from '../supabase.js';

export async function renderHallOfFame(user, profile) {
  const app = document.getElementById('app');
  app.innerHTML = `<div class="page"><div style="font-family:var(--font-mono);font-size:13px;color:var(--text-muted);letter-spacing:2px;">LOADING...</div></div>`;

  const { data: entries } = await sb
    .from('hall_of_fame')
    .select('*')
    .order('round', { ascending: false })
    .order('rank', { ascending: true });

  // Group by round
  const rounds = {};
  (entries || []).forEach(e => {
    if (!rounds[e.round]) rounds[e.round] = [];
    rounds[e.round].push(e);
  });

  const roundNums = Object.keys(rounds).sort((a, b) => b - a);
  const isEmpty = roundNums.length === 0;

  app.innerHTML = `
    ${renderPageTopbar(user, profile, null, 'hof')}
    <div class="inner-page" style="align-items:center;">

      <!-- Page title -->
      <div style="width:100%;max-width:800px;margin-bottom:1.5rem;">
        <div style="font-size:22px;font-weight:800;color:var(--text);">🏆 ${t('hof.title')}</div>
        <div style="font-size:12px;color:var(--text-muted);font-weight:500;margin-top:2px;">${t('hof.subtitle')}</div>
      </div>

      ${isEmpty ? `
        <div style="width:100%;max-width:800px;background:var(--surface);border:1px solid var(--border);
          border-radius:var(--radius-lg);padding:3rem;text-align:center;">
          <div style="font-size:48px;margin-bottom:1rem;">🏛️</div>
          <div style="font-size:18px;font-weight:800;color:var(--text-muted);">${t('hof.empty')}</div>
          <div style="font-size:13px;color:var(--text-dim);margin-top:8px;font-weight:500;">
            ${t('hof.emptyDesc')}
          </div>
        </div>
      ` : roundNums.map(round => `
        <div style="width:100%;max-width:800px;margin-bottom:1.5rem;">
          <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;
            letter-spacing:1px;margin-bottom:10px;">Round ${round}</div>
          <div style="display:flex;flex-direction:column;gap:8px;">
            ${rounds[round].map(e => hofCard(e)).join('')}
          </div>
        </div>
      `).join('')}

    </div>
  `;

  bindPageNav(user, profile, null);
}

function hofCard(e) {
  const medals = { 1: { emoji: '🥇', color: '#FFD700', bg: 'rgba(255,215,0,0.08)', border: 'rgba(255,215,0,0.4)' },
                   2: { emoji: '🥈', color: '#C0C0C0', bg: 'rgba(192,192,192,0.08)', border: 'rgba(192,192,192,0.4)' },
                   3: { emoji: '🥉', color: '#CD7F32', bg: 'rgba(205,127,50,0.08)',  border: 'rgba(205,127,50,0.4)'  } };
  const m = medals[e.rank] || { emoji: `#${e.rank}`, color: 'var(--text-muted)', bg: 'var(--surface)', border: 'var(--border)' };
  const date = new Date(e.achieved_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });

  return `
    <div style="background:${m.bg};border:1.5px solid ${m.border};border-radius:10px;
      padding:1.2rem 1.5rem;display:grid;grid-template-columns:60px 1fr auto;align-items:center;gap:16px;">

      <!-- Medal -->
      <div style="text-align:center;font-size:${e.rank <= 3 ? '32' : '22'}px;font-family:var(--font-title);
        letter-spacing:1px;color:${m.color};">
        ${m.emoji}
      </div>

      <!-- Nation info -->
      <div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px;">
          <div>
            <div style="font-family:var(--font-title);font-size:20px;letter-spacing:2px;color:${m.color};">
              ${e.nation_name.toUpperCase()}
            </div>
            <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-muted);">
              Commander: ${e.username} · ${date}
            </div>
          </div>
        </div>
        <div style="display:flex;gap:16px;flex-wrap:wrap;margin-top:6px;">
          ${hofStat('⚔️', e.soldiers.toLocaleString())}
          ${hofStat('💰', '$' + e.money.toLocaleString())}
          ${hofStat('🗺️', e.land + ' land')}
          ${hofStat('👥', e.population.toLocaleString())}
        </div>
      </div>

      <!-- Score -->
      <div style="text-align:end;">
        <div style="font-family:var(--font-title);font-size:26px;letter-spacing:2px;color:${m.color};">
          ${e.score.toLocaleString()}
        </div>
        <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);letter-spacing:1px;">${t('hof.score')}</div>
      </div>
    </div>
  `;
}

function hofStat(icon, value) {
  return `<span style="font-family:var(--font-mono);font-size:11px;color:var(--text-muted);">${icon} ${value}</span>`;
}
