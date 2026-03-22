import i18n from '../i18n.js';
import { sb } from '../supabase.js';

const t = (key, params) => i18n.t(key, params);
const a = (key, params) => i18n.t('admin.' + key, params);

let currentTab = 'users';

export function renderAdmin(user, profile) {
  const app = document.getElementById('app');

  app.innerHTML = `
    <div class="admin-wrap">

      <!-- Sidebar -->
      <div class="admin-sidebar">
        <div class="admin-logo">
          <div style="font-family:var(--font-title);font-size:22px;letter-spacing:3px;color:var(--accent);">${a('brand')}</div>
          <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);letter-spacing:2px;margin-top:2px;">${a('commandPanel')}</div>
        </div>

        <nav class="admin-nav">
          ${navItem('users',      '👥', a('tabs.users.label'))}
          ${navItem('nations',    '🌍', a('tabs.nations.label'))}
          ${navItem('login_logs', '🔐', a('tabs.login_logs.label'))}
          ${navItem('activity',   '📋', a('tabs.activity.label'))}
          ${navItem('pricing',    '💲', a('tabs.pricing.label'))}
          ${navItem('config',     '⚙️', a('tabs.config.label'))}
        </nav>

        <div class="admin-sidebar-footer">
          <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);margin-bottom:8px;">
            ${profile.username.toUpperCase()}
          </div>
          <button class="btn-logout" id="btn-back" style="width:100%;text-align:center;">
            ${a('backDashboard')}
          </button>
        </div>
      </div>

      <!-- Main content -->
      <div class="admin-main">
        <div class="admin-header">
          <div id="admin-tab-title" style="font-family:var(--font-title);font-size:28px;letter-spacing:3px;color:var(--text);">${a('tabs.users.label')}</div>
          <div id="admin-tab-sub" style="font-family:var(--font-mono);font-size:11px;color:var(--text-muted);letter-spacing:1px;margin-top:2px;"></div>
        </div>
        <div id="admin-content"></div>
      </div>

    </div>
  `;

  // Bind sidebar nav
  document.querySelectorAll('.admin-nav-item').forEach(item => {
    item.addEventListener('click', () => {
      currentTab = item.getAttribute('data-tab');
      document.querySelectorAll('.admin-nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      loadTab(currentTab);
    });
  });

  document.getElementById('btn-back').addEventListener('click', async () => {
    const { renderDashboard } = await import('./dashboard.js');
    renderDashboard(user, profile);
  });

  loadTab('users');
}

function navItem(tab, icon, label) {
  return `
    <div class="admin-nav-item ${tab === 'users' ? 'active' : ''}" data-tab="${tab}">
      <span style="font-size:16px;">${icon}</span>
      <span>${label}</span>
    </div>
  `;
}

// ─── TAB ROUTER ─────────────────────────────────────────────────────────────

async function loadTab(tab) {
  const content = document.getElementById('admin-content');
  const title = document.getElementById('admin-tab-title');
  const sub = document.getElementById('admin-tab-sub');

  content.innerHTML = `<div class="admin-loading">${a('loading')}</div>`;

  title.textContent = a(`tabs.${tab}.label`, { defaultValue: tab.toUpperCase() });
  sub.textContent = a(`tabs.${tab}.subLabel`, { defaultValue: '' });

  switch (tab) {
    case 'users':      await loadUsers(content); break;
    case 'nations':    await loadNations(content); break;
    case 'login_logs': await loadLoginLogs(content); break;
    case 'activity':   await loadActivity(content); break;
    case 'pricing':    await loadPricing(content); break;
    case 'config':     await loadConfig(content); break;
  }
}

// ─── USERS TAB ───────────────────────────────────────────────────────────────

async function loadUsers(content) {
  const { data: users, error } = await sb
    .from('profiles')
    .select('id, username, email, phone, is_admin, is_banned, ban_reason, created_at')
    .order('created_at', { ascending: false });

  if (error) { content.innerHTML = errorBox(error.message); return; }

  content.innerHTML = `
    <div class="admin-toolbar">
      <input class="admin-search" type="text" id="user-search" placeholder="${a('searchUsers')}" />
      <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-muted);">${a('usersCount', { count: users.length })}</div>
    </div>
    <div class="admin-table-wrap">
      <table class="admin-table" id="users-table">
        <thead>
          <tr>
            <th>${a('columns.username')}</th>
            <th>${a('columns.email')}</th>
            <th>${a('columns.phone')}</th>
            <th>${a('columns.joined')}</th>
            <th>${a('columns.status')}</th>
            <th>${a('columns.role')}</th>
            <th>${a('columns.actions')}</th>
          </tr>
        </thead>
        <tbody>
          ${users.map(u => userRow(u)).join('')}
        </tbody>
      </table>
    </div>
  `;

  // Search filter
  document.getElementById('user-search').addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll('#users-table tbody tr').forEach(row => {
      row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  });

  // Bind action buttons
  bindUserActions(content, users);
}

function userRow(u) {
  const joined = new Date(u.created_at).toLocaleDateString();
  const statusBadge = u.is_banned
    ? `<span class="badge badge-danger">${a('badges.banned')}</span>`
    : `<span class="badge badge-success">${a('badges.active')}</span>`;
  const roleBadge = u.is_admin
    ? `<span class="badge badge-gold">${a('badges.admin')}</span>`
    : `<span class="badge badge-muted">${a('badges.player')}</span>`;

  return `
    <tr data-id="${u.id}">
      <td style="font-weight:600;color:var(--text);">${u.username}</td>
      <td style="font-family:var(--font-mono);font-size:12px;">${u.email}</td>
      <td style="font-family:var(--font-mono);font-size:12px;">${u.phone || '—'}</td>
      <td style="font-family:var(--font-mono);font-size:12px;">${joined}</td>
      <td>${statusBadge}</td>
      <td>${roleBadge}</td>
      <td>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          <button class="admin-btn" data-action="${u.is_banned ? 'unban' : 'ban'}" data-id="${u.id}" data-name="${u.username}">
            ${u.is_banned ? a('buttons.unban') : a('buttons.ban')}
          </button>
          <button class="admin-btn" data-action="edit-turns" data-id="${u.id}" data-name="${u.username}">
            ${a('buttons.turns')}
          </button>
          <button class="admin-btn" data-action="edit-money" data-id="${u.id}" data-name="${u.username}">
            ${a('buttons.money')}
          </button>
          <button class="admin-btn ${u.is_admin ? 'admin-btn-active' : ''}" data-action="toggle-admin" data-id="${u.id}" data-name="${u.username}" data-is-admin="${u.is_admin}">
            ${u.is_admin ? a('buttons.revokeAdmin') : a('buttons.makeAdmin')}
          </button>
        </div>
      </td>
    </tr>
  `;
}

function bindUserActions(content, users) {
  content.querySelectorAll('.admin-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const action = btn.getAttribute('data-action');
      const id = btn.getAttribute('data-id');
      const name = btn.getAttribute('data-name');

      if (action === 'ban') {
        const reason = prompt(a('prompts.banReason', { name }));
        if (reason === null) return;
        await sb.from('profiles').update({ is_banned: true, ban_reason: reason }).eq('id', id);
        loadTab('users');
      }

      if (action === 'unban') {
        if (!confirm(a('prompts.unbanConfirm', { name }))) return;
        await sb.from('profiles').update({ is_banned: false, ban_reason: null }).eq('id', id);
        loadTab('users');
      }

      if (action === 'toggle-admin') {
        const isAdmin = btn.getAttribute('data-is-admin') === 'true';
        if (!confirm(a(isAdmin ? 'prompts.revokeAdminConfirm' : 'prompts.makeAdminConfirm', { name }))) return;
        await sb.from('profiles').update({ is_admin: !isAdmin }).eq('id', id);
        loadTab('users');
      }

      if (action === 'edit-turns') {
        const { data: nation } = await sb
          .from('nations')
          .select('id, name, turns')
          .eq('owner_id', id)
          .eq('is_alive', true)
          .maybeSingle();

        if (!nation) { alert(a('prompts.noActiveNation', { name })); return; }

        const input = prompt(a('prompts.editTurns', { nation: nation.name, turns: nation.turns }));
        if (input === null) return;
        const newTurns = parseInt(input);
        if (isNaN(newTurns) || newTurns < 0 || newTurns > 200) {
          alert(a('prompts.invalidTurns')); return;
        }
        const { error } = await sb
          .from('nations')
          .update({ turns: newTurns })
          .eq('id', nation.id);
        if (!error) alert(a('prompts.turnsUpdated', { turns: newTurns, name }));
        else alert(a('errorPrefix') + error.message);
      }

      if (action === 'edit-money') {
        // Find this user's active nation
        const { data: nation } = await sb
          .from('nations')
          .select('id, name, money')
          .eq('owner_id', id)
          .eq('is_alive', true)
          .maybeSingle();

        if (!nation) { alert(a('prompts.noActiveNation', { name })); return; }

        const newMoney = prompt(a('prompts.editMoney', { name, nation: nation.name, money: nation.money.toLocaleString() }));
        if (newMoney === null || isNaN(parseInt(newMoney))) return;
        await sb.from('nations').update({ money: parseInt(newMoney) }).eq('id', nation.id);
        alert(a('prompts.moneyUpdated'));
      }
    });
  });
}

// ─── NATIONS TAB ─────────────────────────────────────────────────────────────

async function loadNations(content) {
  const { data: nations, error } = await sb
    .from('nations')
    .select('id, name, flag_emoji, owner_id, is_alive, round, population, land, money, soldiers, security_index, created_at, profiles(username)')
    .order('created_at', { ascending: false });

  if (error) { content.innerHTML = errorBox(error.message); return; }

  content.innerHTML = `
    <div class="admin-toolbar">
      <input class="admin-search" type="text" id="nation-search" placeholder="${a('searchNations')}" />
      <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-muted);">${a('nationsCount', { count: nations.length })}</div>
    </div>
    <div class="admin-table-wrap">
      <table class="admin-table" id="nations-table">
        <thead>
          <tr>
            <th>${a('columns.nation')}</th>
            <th>${a('columns.commander')}</th>
            <th>${a('columns.round')}</th>
            <th>${a('columns.status')}</th>
            <th>${a('columns.population')}</th>
            <th>${a('columns.land')}</th>
            <th>${a('columns.money')}</th>
            <th>${a('columns.security')}</th>
            <th>${a('columns.actions')}</th>
          </tr>
        </thead>
        <tbody>
          ${nations.map(n => `
            <tr data-id="${n.id}">
              <td><strong>${n.name}</strong></td>
              <td style="font-family:var(--font-mono);font-size:12px;">${n.profiles?.username || '—'}</td>
              <td style="font-family:var(--font-mono);font-size:12px;">R${n.round}</td>
              <td>${n.is_alive ? `<span class="badge badge-success">${a('badges.alive')}</span>` : `<span class="badge badge-danger">${a('badges.destroyed')}</span>`}</td>
              <td style="font-family:var(--font-mono);font-size:12px;">${n.population.toLocaleString()}</td>
              <td style="font-family:var(--font-mono);font-size:12px;">${n.land}</td>
              <td style="font-family:var(--font-mono);font-size:12px;">$${n.money.toLocaleString()}</td>
              <td style="font-family:var(--font-mono);font-size:12px;">${n.security_index}%</td>
              <td>
                <div style="display:flex;gap:6px;">
                  ${n.is_alive ? `<button class="admin-btn" data-action="destroy-nation" data-id="${n.id}" data-name="${n.name}">${a('buttons.destroy')}</button>` : ''}
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  document.getElementById('nation-search').addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll('#nations-table tbody tr').forEach(row => {
      row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  });

  content.querySelectorAll('.admin-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const action = btn.getAttribute('data-action');
      const id = btn.getAttribute('data-id');
      const name = btn.getAttribute('data-name');

      if (action === 'destroy-nation') {
        const reason = prompt(a('prompts.destroyReason', { name }));
        if (reason === null) return;
        await sb.from('nations').update({
          is_alive: false,
          destroyed_at: new Date().toISOString(),
          destroy_reason: reason,
        }).eq('id', id);
        loadTab('nations');
      }
    });
  });
}

// ─── LOGIN LOGS TAB ──────────────────────────────────────────────────────────

async function loadLoginLogs(content) {
  const { data: logs, error } = await sb
    .from('login_logs')
    .select('id, email_attempted, username_attempted, ip_address, user_agent, success, fail_reason, logged_at')
    .order('logged_at', { ascending: false })
    .limit(200);

  if (error) { content.innerHTML = errorBox(error.message); return; }

  content.innerHTML = `
    <div class="admin-toolbar">
      <input class="admin-search" type="text" id="log-search" placeholder="${a('searchLogs')}" />
      <div style="display:flex;gap:8px;">
        <button class="admin-btn" id="filter-all" style="border-color:var(--accent);">${a('filters.all')}</button>
        <button class="admin-btn" id="filter-fail">${a('filters.failedOnly')}</button>
      </div>
      <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-muted);">${a('entriesCount', { count: logs.length })}</div>
    </div>
    <div class="admin-table-wrap">
      <table class="admin-table" id="logs-table">
        <thead>
          <tr>
            <th>${a('columns.time')}</th>
            <th>${a('columns.email')}</th>
            <th>${a('columns.ip')}</th>
            <th>${a('columns.result')}</th>
            <th>${a('columns.reason')}</th>
            <th>${a('columns.browser')}</th>
          </tr>
        </thead>
        <tbody>
          ${logs.map(l => `
            <tr class="${l.success ? '' : 'row-danger'}" data-success="${l.success}">
              <td style="font-family:var(--font-mono);font-size:11px;white-space:nowrap;">${new Date(l.logged_at).toLocaleString()}</td>
              <td style="font-family:var(--font-mono);font-size:12px;">${l.email_attempted || '—'}</td>
              <td style="font-family:var(--font-mono);font-size:12px;">${l.ip_address || '—'}</td>
              <td>${l.success ? `<span class="badge badge-success">${a('badges.ok')}</span>` : `<span class="badge badge-danger">${a('badges.fail')}</span>`}</td>
              <td style="font-family:var(--font-mono);font-size:11px;color:var(--text-muted);">${l.fail_reason || '—'}</td>
              <td style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${l.user_agent || ''}">${l.user_agent ? l.user_agent.substring(0, 40) + '…' : '—'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  document.getElementById('log-search').addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll('#logs-table tbody tr').forEach(row => {
      row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  });

  document.getElementById('filter-all').addEventListener('click', () => {
    document.querySelectorAll('#logs-table tbody tr').forEach(r => r.style.display = '');
  });

  document.getElementById('filter-fail').addEventListener('click', () => {
    document.querySelectorAll('#logs-table tbody tr').forEach(r => {
      r.style.display = r.getAttribute('data-success') === 'false' ? '' : 'none';
    });
  });
}

// ─── ACTIVITY LOGS TAB ───────────────────────────────────────────────────────

async function loadActivity(content) {
  const { data: logs, error } = await sb
    .from('activity_logs')
    .select('id, action, details, ip_address, logged_at, profiles(username), nations(name, flag_emoji)')
    .order('logged_at', { ascending: false })
    .limit(200);

  if (error) { content.innerHTML = errorBox(error.message); return; }

  content.innerHTML = `
    <div class="admin-toolbar">
      <input class="admin-search" type="text" id="act-search" placeholder="${a('searchActivity')}" />
      <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-muted);">${a('entriesCount', { count: logs.length })}</div>
    </div>
    <div class="admin-table-wrap">
      <table class="admin-table" id="act-table">
        <thead>
          <tr>
            <th>${a('columns.time')}</th>
            <th>${a('columns.player')}</th>
            <th>${a('columns.nation')}</th>
            <th>${a('columns.action')}</th>
            <th>${a('columns.details')}</th>
          </tr>
        </thead>
        <tbody>
          ${logs.length === 0
            ? `<tr><td colspan="5" style="text-align:center;color:var(--text-muted);font-family:var(--font-mono);padding:2rem;">${a('noActivity')}</td></tr>`
            : logs.map(l => `
              <tr>
                <td style="font-family:var(--font-mono);font-size:11px;white-space:nowrap;">${new Date(l.logged_at).toLocaleString()}</td>
                <td style="font-family:var(--font-mono);font-size:12px;">${l.profiles?.username || '—'}</td>
                <td style="font-family:var(--font-mono);font-size:12px;">${l.nations ? l.nations.name : '—'}</td>
                <td><span class="badge badge-gold">${l.action}</span></td>
                <td style="font-family:var(--font-mono);font-size:11px;color:var(--text-muted);">${l.details ? JSON.stringify(l.details) : '—'}</td>
              </tr>
            `).join('')
          }
        </tbody>
      </table>
    </div>
  `;

  document.getElementById('act-search').addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll('#act-table tbody tr').forEach(row => {
      row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  });
}

// ─── GAME CONFIG TAB ─────────────────────────────────────────────────────────

async function loadConfig(content) {
  const { data: configs, error } = await sb
    .from('game_config')
    .select('key, value, description, updated_at')
    .order('key');

  if (error) { content.innerHTML = errorBox(error.message); return; }

  content.innerHTML = `
    <div style="max-width:680px;">
      <p style="font-family:var(--font-mono);font-size:11px;color:var(--text-muted);letter-spacing:1px;margin-bottom:1.5rem;">
        ${a('configHelp')}
      </p>
      <div id="config-list">
        ${configs.map(c => configRow(c)).join('')}
      </div>
      <div class="msg" id="config-msg" style="margin-top:1rem;"></div>
    </div>
  `;

  content.querySelectorAll('.config-save-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const key = btn.getAttribute('data-key');
      const input = document.getElementById(`config-${key}`);
      const value = input.value.trim();

      if (!value) return;

      btn.textContent = a('buttons.saving');
      btn.disabled = true;

      const { error } = await sb
        .from('game_config')
        .update({ value, updated_at: new Date().toISOString() })
        .eq('key', key);

      if (error) {
        showAdminMsg('config-msg', 'error', error.message);
      } else {
        btn.textContent = '✓ Saved';
        setTimeout(() => { btn.textContent = a('buttons.save'); btn.disabled = false; }, 1500);
        showAdminMsg('config-msg', 'success', a('configUpdated', { key }));
      }
    });
  });
}

function configRow(c) {
  const updatedAt = c.updated_at ? new Date(c.updated_at).toLocaleDateString() : '—';
  return `
    <div style="background:var(--surface);border:1px solid var(--border);padding:1rem 1.2rem;margin-bottom:10px;display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;">
      <div>
        <div style="font-family:var(--font-mono);font-size:12px;color:var(--accent);letter-spacing:1px;margin-bottom:4px;">${c.key}</div>
        <div style="font-family:var(--font-body);font-size:13px;color:var(--text-muted);margin-bottom:8px;">${c.description || ''}</div>
        <input
          id="config-${c.key}"
          type="text"
          value="${c.value}"
          style="width:100%;background:var(--surface2);border:1px solid var(--border);color:var(--text);font-family:var(--font-mono);font-size:13px;padding:7px 10px;outline:none;"
        />
        <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);margin-top:4px;">${a('lastUpdated', { date: updatedAt })}</div>
      </div>
      <button class="admin-btn config-save-btn" data-key="${c.key}" style="align-self:flex-end;white-space:nowrap;">${a('buttons.save')}</button>
    </div>
  `;
}

// ─── PRICING TAB ─────────────────────────────────────────────────────────────

async function loadPricing(content) {
  const [
    { data: equipment },
    { data: facilities },
    { data: config },
  ] = await Promise.all([
    sb.from('equipment_types').select('*').order('sort_order'),
    sb.from('facility_types').select('*').order('sort_order'),
    sb.from('game_config').select('*').order('key'),
  ]);

  const cfg = Object.fromEntries((config||[]).map(c => [c.key, c.value]));

  content.innerHTML = `
    <div class="msg" id="pricing-msg" style="margin-bottom:12px;"></div>

    <!-- MILITARY UNITS -->
    <div style="margin-bottom:24px;">
      <div style="font-size:14px;font-weight:700;margin-bottom:12px;display:flex;align-items:center;gap:8px;">
        ⚔️ 
        <span style="font-size:11px;color:var(--text-muted);font-weight:500;">${a('sections.militaryEquipment')} · ${a('sections.militaryEquipmentHelp')}</span>
      </div>
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead><tr>
            <th>${a('columns.unit')}</th>
            <th>${a('columns.costEach')}</th>
            <th>${a('columns.maint2h')}</th>
            <th>${a('columns.attackPwr')}</th>
            <th>${a('columns.defensePwr')}</th>
            <th></th>
          </tr></thead>
          <tbody>
            ${(equipment||[]).map(eq => `
              <tr data-type="equipment" data-id="${eq.id}">
                <td style="font-weight:600;">${eq.name}</td>
                <td><input class="price-input" data-field="cost_each"       value="${eq.cost_each}"         type="number" min="0" style="${inputStyle()}"/></td>
                <td><input class="price-input" data-field="maintenance_per_2h" value="${eq.maintenance_per_2h}" type="number" min="0" style="${inputStyle()}"/></td>
                <td><input class="price-input" data-field="attack_power"    value="${eq.attack_power}"      type="number" min="0" style="${inputStyle()}"/></td>
                <td><input class="price-input" data-field="defense_power"   value="${eq.defense_power}"     type="number" min="0" style="${inputStyle()}"/></td>
                <td><button class="admin-btn save-row-btn">${a('buttons.save')}</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- FACILITIES -->
    <div style="margin-bottom:24px;">
      <div style="font-size:14px;font-weight:700;margin-bottom:12px;display:flex;align-items:center;gap:8px;">
        🏭 
        <span style="font-size:11px;color:var(--text-muted);font-weight:500;">${a('sections.economyFacilities')} · ${a('sections.economyFacilitiesHelp')}</span>
      </div>
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead><tr>
            <th>${a('columns.facility')}</th>
            <th>${a('columns.buildCost')}</th>
            <th>${a('columns.incomeHr')}</th>
            <th>${a('columns.upkeepHr')}</th>
            <th>${a('columns.land')}</th>
            <th></th>
          </tr></thead>
          <tbody>
            ${(facilities||[]).map(f => `
              <tr data-type="facility" data-id="${f.id}">
                <td style="font-weight:600;">${f.name}</td>
                <td><input class="price-input" data-field="build_cost"         value="${f.build_cost}"          type="number" min="0" style="${inputStyle()}"/></td>
                <td><input class="price-input" data-field="income_per_hour"    value="${f.income_per_hour}"     type="number" min="0" style="${inputStyle()}"/></td>
                <td><input class="price-input" data-field="maintenance_per_hour" value="${f.maintenance_per_hour}" type="number" min="0" style="${inputStyle()}"/></td>
                <td><input class="price-input" data-field="land_required"      value="${f.land_required}"       type="number" min="1" style="${inputStyle(60)}"/></td>
                <td><button class="admin-btn save-row-btn">Save</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- INTELLIGENCE -->
    <div style="margin-bottom:24px;">
      <div style="font-size:14px;font-weight:700;margin-bottom:4px;">🔍 </div>
      <div style="font-size:12px;color:var(--text-muted);font-weight:500;margin-bottom:10px;">
        Levels 1–(cap-1) cost = base × level. At cap level and above, the fixed cap price applies.
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;">
        ${intelConfigRow('',  'intel_cap_level',            cfg)}
        ${intelConfigRow('',                 'intel_spy_base_cost',        cfg)}
        ${intelConfigRow('Spy upgrade cost (×level)',     'intel_spy_level_cost',       cfg)}
        ${intelConfigRow('',     'intel_spy_cap_price',        cfg)}
        ${intelConfigRow('',           'intel_spy_maint_2h',         cfg)}
        ${intelConfigRow('',           'intel_sat_base_cost',        cfg)}
        ${intelConfigRow('Satellite upgrade (×level)',    'intel_sat_level_cost',       cfg)}
        ${intelConfigRow('',  'intel_sat_cap_price',        cfg)}
        ${intelConfigRow('',           'intel_sat_maint_2h',         cfg)}
        ${intelConfigRow('Anti-spy cost (×level)',        'intel_anti_spy_cost',        cfg)}
        ${intelConfigRow('',   'intel_anti_spy_cap_price',   cfg)}
        ${intelConfigRow('Anti-sat cost (×level)',        'intel_anti_sat_cost',        cfg)}
        ${intelConfigRow('',   'intel_anti_sat_cap_price',   cfg)}
        ${intelConfigRow('Tech level cost (×level)',      'intel_tech_level_cost',      cfg)}
        ${intelConfigRow('',    'intel_tech_cap_price',       cfg)}
      </div>
    </div>

    <!--  -->
    <div style="margin-bottom:24px;">
      <div style="font-size:14px;font-weight:700;margin-bottom:12px;">⚙️ </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;">
        ${intelConfigRow('',   'attack_destruction_turns',       cfg)}
        ${intelConfigRow('',      'attack_conquest_turns',          cfg)}
        ${intelConfigRow('',        'intel_mission_turns',            cfg)}
        ${intelConfigRow('', 'draft_cost_per_soldier',         cfg)}
        ${intelConfigRow('',             'demob_refund_percent',           cfg)}
        ${intelConfigRow('',    'sell_equipment_refund_pct',      cfg)}
        ${intelConfigRow('', 'demolish_facility_refund_pct',   cfg)}
        ${intelConfigRow('',    'turn_interval_minutes',          cfg)}
        ${intelConfigRow('',                  'max_turns',                      cfg)}
        ${intelConfigRow('',         'starting_money',                 cfg)}
        ${intelConfigRow('',              'starting_land',                  cfg)}
        ${intelConfigRow('',        'starting_population',            cfg)}
      </div>
      <button class="btn btn-primary" id="btn-save-config" style="margin-top:12px;"></button>
    </div>
  `;

  // Save equipment row
  content.querySelectorAll('.save-row-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const row = btn.closest('tr');
      const type = row.getAttribute('data-type');
      const id   = row.getAttribute('data-id');
      const updates = {};
      row.querySelectorAll('.price-input').forEach(input => {
        updates[input.getAttribute('data-field')] = parseFloat(input.value) || 0;
      });
      btn.textContent = a('buttons.saving'); btn.disabled = true;
      const table = type === 'equipment' ? 'equipment_types' : 'facility_types';
      const { error } = await sb.from(table).update(updates).eq('id', id);
      if (error) { showAdminMsg('pricing-msg', 'error', error.message); }
      else { btn.textContent = '✓'; setTimeout(() => { btn.textContent = a('buttons.save'); btn.disabled = false; }, 1500); }
      showAdminMsg('pricing-msg', error ? 'error' : 'success', error ? error.message : `${type} updated.`);
    });
  });

  //  keys
  document.getElementById('btn-save-config').addEventListener('click', async () => {
    const btn = document.getElementById('btn-save-config');
    btn.textContent = a('buttons.saving'); btn.disabled = true;
    let errors = 0;
    const inputs = content.querySelectorAll('.config-price-input');
    for (const input of inputs) {
      const key = input.getAttribute('data-key');
      const { error } = await sb.from('game_config').update({ value: input.value.trim() }).eq('key', key);
      if (error) errors++;
    }
    btn.textContent = ''; btn.disabled = false;
    showAdminMsg('pricing-msg', errors ? 'error' : 'success', errors ? `${errors} errors saving config.` : 'All config saved successfully.');
  });
}

function intelConfigRow(label, key, cfg) {
  return `
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-md);padding:12px 14px;">
      <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.3px;margin-bottom:6px;">${label}</div>
      <input class="config-price-input" data-key="${key}" type="number" min="0" value="${cfg[key]||0}"
        style="width:100%;background:var(--surface2);border:1.5px solid var(--border);border-radius:var(--radius-sm);
        color:var(--text);font-family:var(--font-mono);font-size:13px;font-weight:600;
        padding:7px 10px;outline:none;"
        onfocus="this.style.borderColor='var(--accent)'"
        onblur="this.style.borderColor='var(--border)'"
      />
    </div>
  `;
}

function inputStyle(width = 100) {
  return `width:${width}px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-family:var(--font-mono);font-size:12px;padding:5px 8px;outline:none;`;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function errorBox(msg) {
  return `<div style="font-family:var(--font-mono);font-size:12px;color:#f87171;padding:1rem;border-left:3px solid #e05252;background:rgba(224,82,82,0.1);">${msg}</div>`;
}

function showAdminMsg(id, type, text) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.className = 'msg ' + type + ' show';
  setTimeout(() => el.className = 'msg', 3000);
}
