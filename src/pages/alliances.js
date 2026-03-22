import i18n from '../i18n.js';
const t = (k, p) => i18n.t(k, p);
import { sb } from '../supabase.js';
import { renderPageTopbar, bindPageNav } from '../nav.js';

export async function renderAlliances(user, profile, nation) {
  const app = document.getElementById('app');
  app.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:60vh;font-size:13px;color:var(--text-muted);font-family:var(--font-body);">Loading Alliances...</div>`;

  // Fetch nation's current alliance membership
  const { data: membership } = await sb
    .from('alliance_members')
    .select('*, alliances(*)')
    .eq('nation_id', nation.id)
    .maybeSingle();

  if (membership) {
    await renderAllianceHub(app, user, profile, nation, membership);
  } else {
    await renderAllianceLobby(app, user, profile, nation);
  }
}

// ─── LOBBY (no alliance) ──────────────────────────────────────────────────────

async function renderAllianceLobby(app, user, profile, nation) {
  const [
    { data: alliances },
    { data: pendingInvites },
  ] = await Promise.all([
    sb.from('alliances').select('*, alliance_members(count)').eq('round', 1).order('created_at', { ascending: false }),
    sb.from('alliance_invites').select('*, alliances(id, name, tag, description)').eq('nation_id', nation.id).eq('status', 'pending'),
  ]);

  app.innerHTML = `
    ${renderPageTopbar(user, profile, nation, 'alliances')}
    <div class="inner-page" style="max-width:880px;">

      <div class="inner-topbar">
        <div class="inner-title-wrap">
          <span style="font-size:24px;">🤝</span>
          <div>
            <div class="inner-title">${t('alliances.title')}</div>
            <div class="inner-sub">${nation.name} · ${t('alliances.noAllianceStatus')}</div>
          </div>
        </div>
        <button class="btn btn-primary" id="btn-show-create">${t('alliances.createBtn')}</button>
      </div>

      <!-- Create form (hidden by default) -->
      <div id="create-form" style="display:none;background:var(--surface);border:1px solid var(--border);
        border-radius:var(--radius-lg);padding:20px;margin-bottom:16px;box-shadow:var(--shadow-sm);">
        <div style="font-size:14px;font-weight:700;margin-bottom:14px;">${t('alliances.foundTitle')}</div>
        <div style="display:grid;grid-template-columns:1fr 120px;gap:10px;">
          <div class="field" style="margin:0;">
            <label>${t('alliances.nameLabel')}</label>
            <input type="text" id="al-name" placeholder="e.g. Northern Pact" maxlength="40"/>
          </div>
          <div class="field" style="margin:0;">
            <label>${t('alliances.tagLabel')}</label>
            <input type="text" id="al-tag" placeholder="NATO" maxlength="5"/>
          </div>
        </div>
        <div class="field" style="margin-top:10px;">
          <label>${t('alliances.descLabel')} <span class="optional-label">${t('alliances.optional')}</span></label>
          <input type="text" id="al-desc" placeholder="What does your alliance stand for?" maxlength="120"/>
        </div>
        <div style="display:flex;align-items:center;gap:10px;margin-top:10px;">
          <label style="display:flex;align-items:center;gap:6px;font-size:13px;font-weight:500;cursor:pointer;">
            <input type="checkbox" id="al-open" checked style="width:14px;height:14px;accent-color:var(--accent);"/>
            ${t('alliances.openLabel')}
          </label>
          <div style="flex:1;"></div>
          <button class="btn btn-ghost" id="btn-cancel-create">${t('alliances.cancelBtn')}</button>
          <button class="btn btn-primary" id="btn-create-al">${t('alliances.createAllianceBtn')}</button>
        </div>
        <div class="msg" id="create-msg"></div>
      </div>

      <!-- Pending invites -->
      ${(pendingInvites||[]).length > 0 ? `
        <div style="background:var(--accent-bg);border:1.5px solid var(--accent-border);
          border-radius:var(--radius-lg);padding:14px 18px;margin-bottom:14px;">
          <div style="font-size:13px;font-weight:700;color:var(--accent);margin-bottom:10px;">
            ✉️ ${t('alliances.invitePending')}
          </div>
          ${(pendingInvites||[]).map(inv => `
            <div style="display:flex;align-items:center;gap:10px;padding:8px 0;
              border-bottom:1px solid var(--accent-border);">
              <div style="flex:1;font-size:13px;">
                ${t('alliances.inviteReceived')}
                <strong>${inv.alliances?.name}</strong>
                <span style="font-size:11px;color:var(--text-muted);margin-inline-start:6px;">[${inv.alliances?.tag}]</span>
              </div>
              <button class="btn btn-primary btn-accept-invite" data-invite-id="${inv.id}"
                data-alliance-id="${inv.alliances?.id}" style="font-size:12px;padding:5px 12px;">
                ${t('alliances.inviteAccept')}
              </button>
              <button class="btn btn-ghost btn-decline-invite" data-invite-id="${inv.id}"
                style="font-size:12px;padding:5px 10px;color:var(--danger);border-color:var(--danger-border);">
                ${t('alliances.inviteDecline')}
              </button>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <!-- Search -->
      <div style="margin-bottom:10px;">
        <input type="text" id="alliance-search" placeholder="Search by name or tag..."
          style="width:100%;background:var(--surface);border:1.5px solid var(--border);
          border-radius:var(--radius-md);color:var(--text);font-family:var(--font-body);
          font-size:13px;font-weight:500;padding:9px 12px;outline:none;
          transition:border-color 0.15s,box-shadow 0.15s;"
          onfocus="this.style.borderColor='var(--accent)';this.style.boxShadow='0 0 0 3px rgba(79,70,229,0.1)'"
          onblur="this.style.borderColor='var(--border)';this.style.boxShadow='none'"
        />
      </div>

      <!-- Alliance list -->
      <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">
        ${(alliances||[]).length !== 1 ? t('alliances.thisRoundPlural',{count:(alliances||[]).length}) : t('alliances.thisRound',{count:(alliances||[]).length})}
      </div>

      ${(alliances||[]).length === 0 ? `
        <div class="card" style="padding:2.5rem;text-align:center;">
          <div style="font-size:40px;margin-bottom:10px;">🤝</div>
          <div style="font-size:16px;font-weight:700;margin-bottom:6px;">${t('alliances.noAlliances')}</div>
          <div style="font-size:13px;color:var(--text-muted);">${t('alliances.beFirst')}</div>
        </div>
      ` : `
        <div style="display:flex;flex-direction:column;gap:8px;">
          ${(alliances||[]).map(al => allianceCard(al, nation)).join('')}
        </div>
      `}

      <div class="msg" id="join-msg" style="margin-top:12px;"></div>
    </div>
  `;

  bindPageNav(user, profile, nation);
  bindLobbyEvents(user, profile, nation, alliances || []);
}

function allianceCard(al, nation) {
  const memberCount = al.alliance_members?.[0]?.count || 0;
  const isFull = memberCount >= al.max_members;
  return `
    <div class="al-card" data-name="${al.name.toLowerCase()}" data-tag="${al.tag.toLowerCase()}"
      style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);
      padding:14px 18px;display:flex;align-items:center;gap:14px;box-shadow:var(--shadow-sm);">
      <div style="width:44px;height:44px;background:var(--accent-bg);border:1px solid var(--accent-border);
        border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;
        font-family:var(--font-mono);font-size:12px;font-weight:700;color:var(--accent);flex-shrink:0;">
        ${al.tag.toUpperCase()}
      </div>
      <div style="flex:1;min-width:0;">
        <div style="font-size:15px;font-weight:700;">${al.name}</div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">
          ${al.description ? al.description : t('alliances.noDescription')} · ${memberCount} / ${al.max_members} ${t('alliances.membersTitle').replace('👥 ','')}
          · ${al.is_open ? `<span style="color:var(--success);">${t('alliances.open')}</span>` : `<span style="color:var(--warning);">${t('alliances.closed')}</span>`}
        </div>
      </div>
      ${al.is_open && !isFull ? `
        <button class="btn btn-primary btn-join" data-id="${al.id}" data-name="${al.name}"
          style="flex-shrink:0;">${t('alliances.joinBtn')}</button>
      ` : isFull ? `
        <span class="badge badge-gray">${t('alliances.full')}</span>
      ` : `
        <span class="badge badge-yellow">${t('alliances.closed')}</span>
      `}
    </div>
  `;
}

function bindLobbyEvents(user, profile, nation, alliances) {
  // Search
  document.getElementById('alliance-search')?.addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll('.al-card').forEach(card => {
      const name = card.getAttribute('data-name').toLowerCase();
      const tag  = card.getAttribute('data-tag').toLowerCase();
      card.style.display = (!q || name.includes(q) || tag.includes(q)) ? '' : 'none';
    });
  });

  // Toggle create form
  document.getElementById('btn-show-create').addEventListener('click', () => {
    document.getElementById('create-form').style.display = 'block';
    document.getElementById('btn-show-create').style.display = 'none';
  });
  document.getElementById('btn-cancel-create').addEventListener('click', () => {
    document.getElementById('create-form').style.display = 'none';
    document.getElementById('btn-show-create').style.display = '';
  });

  // Create
  document.getElementById('btn-create-al').addEventListener('click', async () => {
    const name = document.getElementById('al-name').value.trim();
    const tag  = document.getElementById('al-tag').value.trim().toUpperCase();
    const desc = document.getElementById('al-desc').value.trim();
    const open = document.getElementById('al-open').checked;

    if (!name || name.length < 3) { showMsg('create-msg','error',t('alliances.errNameLength')); return; }
    if (!tag || tag.length < 2)   { showMsg('create-msg','error',t('alliances.errTagLength')); return; }

    const btn = document.getElementById('btn-create-al');
    btn.disabled = true; btn.textContent = t('alliances.creating');

    const { data: al, error: alErr } = await sb.from('alliances').insert({
      name, tag, description: desc || null, leader_nation_id: nation.id,
      is_open: open, round: 1
    }).select().single();

    if (alErr) {
      showMsg('create-msg','error', alErr.message.includes('unique') ? t('alliances.errNameTaken') : alErr.message);
      btn.disabled = false; btn.textContent = t('alliances.createAllianceBtn'); return;
    }

    // Join as leader
    await sb.from('alliance_members').insert({ alliance_id: al.id, nation_id: nation.id, role: 'leader' });
    await sb.from('nations').update({ alliance_id: al.id }).eq('id', nation.id);

    renderAlliances(user, profile, { ...nation, alliance_id: al.id });
  });

  // Accept invite
  document.querySelectorAll('.btn-accept-invite').forEach(btn => {
    btn.addEventListener('click', async () => {
      const inviteId    = btn.getAttribute('data-invite-id');
      const allianceId  = btn.getAttribute('data-alliance-id');
      await sb.from('alliance_invites').update({ status: 'accepted' }).eq('id', inviteId);
      await sb.from('alliance_members').insert({ alliance_id: allianceId, nation_id: nation.id, role: 'member' });
      await sb.from('nations').update({ alliance_id: allianceId }).eq('id', nation.id);
      await sb.from('alliance_alerts').insert({
        alliance_id: allianceId, alert_type: 'member_joined',
        nation_id: nation.id, nation_name: nation.name,
        details: nation.name + ' joined the alliance'
      });
      renderAlliances(user, profile, { ...nation, alliance_id: allianceId });
    });
  });

  // Decline invite
  document.querySelectorAll('.btn-decline-invite').forEach(btn => {
    btn.addEventListener('click', async () => {
      const inviteId = btn.getAttribute('data-invite-id');
      await sb.from('alliance_invites').update({ status: 'declined' }).eq('id', inviteId);
      renderAlliances(user, profile, nation);
    });
  });

  // Join
  document.querySelectorAll('.btn-join').forEach(btn => {
    btn.addEventListener('click', async () => {
      const alId   = btn.getAttribute('data-id');
      const alName = btn.getAttribute('data-name');
      btn.disabled = true; btn.textContent = t('alliances.joining');

      const { error } = await sb.from('alliance_members').insert({ alliance_id: alId, nation_id: nation.id, role: 'member' });
      if (error) { showMsg('join-msg','error', error.message); btn.disabled = false; btn.textContent = t('alliances.joinBtn'); return; }
      await sb.from('nations').update({ alliance_id: alId }).eq('id', nation.id);

      // Post join alert
      const al = alliances.find(a => a.id === alId);
      await sb.from('alliance_alerts').insert({
        alliance_id: alId, alert_type: 'member_joined',
        nation_id: nation.id, nation_name: nation.name,
        details: nation.name + ' joined the alliance'
      });

      renderAlliances(user, profile, { ...nation, alliance_id: alId });
    });
  });
}

// ─── HUB (in an alliance) ─────────────────────────────────────────────────────

async function renderAllianceHub(app, user, profile, nation, membership) {
  const al = membership.alliances;
  const isLeader = membership.role === 'leader';
  const isOfficer = membership.role === 'officer';

  const [
    { data: members },
    { data: chatMessages },
    { data: alerts },
  ] = await Promise.all([
    sb.from('alliance_members')
      .select('*, nations(id, name, soldiers, land, money, security_index, is_alive)')
      .eq('alliance_id', al.id)
      .order('role'),
    sb.from('alliance_chat')
      .select('*')
      .eq('alliance_id', al.id)
      .order('posted_at', { ascending: false })
      .limit(50),
    sb.from('alliance_alerts')
      .select('*')
      .eq('alliance_id', al.id)
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  const aliveMembers = (members||[]).filter(m => m.nations?.is_alive);

  app.innerHTML = `
    ${renderPageTopbar(user, profile, nation, 'alliances')}
    <div class="inner-page" style="max-width:960px;">

      <!-- Alliance header -->
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);
        padding:16px 20px;margin-bottom:16px;display:flex;align-items:center;gap:16px;box-shadow:var(--shadow-sm);">
        <div style="width:52px;height:52px;background:var(--accent-bg);border:1.5px solid var(--accent-border);
          border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;
          font-family:var(--font-mono);font-size:14px;font-weight:700;color:var(--accent);flex-shrink:0;">
          ${al.tag.toUpperCase()}
        </div>
        <div style="flex:1;">
          <div style="font-size:18px;font-weight:800;">${al.name}</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">
            ${al.description ? al.description : t('alliances.noDescription')} · ${aliveMembers.length} / ${al.max_members} ${t('alliances.membersTitle').replace('👥 ','')}
            · ${al.is_open ? `<span style="color:var(--success);">${t('alliances.open')}</span>` : `<span style="color:var(--warning);">${t('alliances.closed')}</span>`}
            · ${t('alliances.yourRole')} <strong style="text-transform:capitalize;">${membership.role}</strong>
          </div>
        </div>
        ${isLeader || isOfficer ? `
          <button class="btn btn-ghost" id="btn-al-settings" style="font-size:12px;">${t('alliances.settingsBtn')}</button>
        ` : ''}
        <button class="btn btn-ghost" id="btn-leave" style="font-size:12px;color:var(--danger);border-color:var(--danger-border);">
          ${t('alliances.leaveBtn')}
        </button>
      </div>

      <div style="display:grid;grid-template-columns:1fr 320px;gap:12px;">

        <!-- LEFT: Chat + Alerts -->
        <div style="display:flex;flex-direction:column;gap:12px;">

          <!-- Alerts -->
          ${(alerts||[]).length > 0 ? `
            <div class="card">
              <div class="card-header">
                <div class="card-title">${t('alliances.alertsTitle')}</div>
                <span style="font-size:11px;color:var(--text-dim);">Last ${Math.min(alerts.length,5)}</span>
              </div>
              ${(alerts||[]).slice(0,5).map(a => alertRow(a)).join('')}
            </div>
          ` : ''}

          <!-- Chat -->
          <div class="card" style="display:flex;flex-direction:column;">
            <div class="card-header">
              <div class="card-title">${t('alliances.chatTitle')}</div>
              <span style="font-size:11px;color:var(--text-dim);">${t('alliances.membersOnline',{count:aliveMembers.length})}</span>
            </div>

            <!-- Messages -->
            <div id="chat-messages" style="padding:8px 0;max-height:380px;overflow-y:auto;display:flex;flex-direction:column-reverse;">
              ${(chatMessages||[]).length === 0
                ? `<div style="padding:20px;text-align:center;font-size:13px;color:var(--text-dim);">${t('alliances.noMessages')}</div>`
                : (chatMessages||[]).map(m => chatMsg(m, nation.id)).join('')
              }
            </div>

            <!-- Input -->
            <div style="padding:12px;border-top:1px solid var(--border);display:flex;gap:8px;">
              <input type="text" id="chat-input" placeholder="${t('alliances.messagePlaceholder')}"
                maxlength="500"
                style="flex:1;background:var(--surface2);border:1.5px solid var(--border);border-radius:var(--radius-md);
                  color:var(--text);font-family:var(--font-body);font-size:13px;font-weight:500;
                  padding:8px 12px;outline:none;transition:border-color 0.15s;"
                onfocus="this.style.borderColor='var(--accent)'"
                onblur="this.style.borderColor='var(--border)'"
              />
              <button class="btn btn-primary" id="btn-send" style="padding:8px 16px;">${t('alliances.sendBtn')}</button>
            </div>
          </div>
        </div>

        <!-- RIGHT: Members -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">${t('alliances.membersTitle')}</div>
            <span style="font-size:12px;color:var(--text-muted);">${aliveMembers.length} / ${al.max_members}</span>
          </div>
          ${aliveMembers.map(m => memberRow(m, nation.id, isLeader || isOfficer)).join('')}
        </div>

      </div>

      <!-- Settings panel (hidden) -->
      <div id="settings-panel" style="display:none;margin-top:12px;background:var(--surface);
        border:1px solid var(--border);border-radius:var(--radius-lg);padding:18px 20px;">
        <div style="font-size:14px;font-weight:700;margin-bottom:14px;">${t('alliances.settingsTitle')}</div>

        <!-- Name + Tag rename -->
        <div style="display:grid;grid-template-columns:1fr 120px;gap:10px;margin-bottom:10px;">
          <div>
            <div style="font-size:11px;font-weight:600;color:var(--text-muted);margin-bottom:4px;">${t('alliances.renameLabel')}</div>
            <input type="text" id="settings-name" value="${al.name}" maxlength="40"
              style="width:100%;background:var(--surface2);border:1.5px solid var(--border);
              border-radius:var(--radius-md);color:var(--text);font-family:var(--font-body);font-size:13px;
              padding:7px 10px;outline:none;"/>
          </div>
          <div>
            <div style="font-size:11px;font-weight:600;color:var(--text-muted);margin-bottom:4px;">${t('alliances.tagLabel')}</div>
            <input type="text" id="settings-tag" value="${al.tag}" maxlength="5"
              style="width:100%;background:var(--surface2);border:1.5px solid var(--border);
              border-radius:var(--radius-md);color:var(--text);font-family:var(--font-body);font-size:13px;
              padding:7px 10px;outline:none;"/>
          </div>
        </div>

        <!-- Description + open toggle -->
        <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:12px;">
          <label style="display:flex;align-items:center;gap:6px;font-size:13px;font-weight:500;cursor:pointer;">
            <input type="checkbox" id="settings-open" ${al.is_open ? 'checked' : ''}
              style="width:14px;height:14px;accent-color:var(--accent);"/>
            ${t('alliances.openToAll')}
          </label>
          <input type="text" id="settings-desc" value="${al.description||''}" placeholder="${t('alliances.descLabel')}"
            maxlength="120" style="flex:1;min-width:180px;background:var(--surface2);border:1.5px solid var(--border);
            border-radius:var(--radius-md);color:var(--text);font-family:var(--font-body);font-size:13px;
            padding:7px 10px;outline:none;"/>
        </div>

        <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;">
          <button class="btn btn-primary" id="btn-save-settings" style="font-size:12px;">${t('alliances.saveBtn')}</button>
          ${isLeader ? `<button class="btn btn-ghost" id="btn-disband"
            style="font-size:12px;color:var(--danger);border-color:var(--danger-border);">${t('alliances.disbandBtn')}</button>` : ''}
        </div>
        <div class="msg" id="settings-msg" style="margin-top:4px;"></div>

        <!-- Invite section (only shown when alliance is closed) -->
        ${!al.is_open ? `
          <div style="margin-top:16px;border-top:1px solid var(--border);padding-top:14px;">
            <div style="font-size:13px;font-weight:700;margin-bottom:10px;">${t('alliances.inviteTitle')}</div>
            <div style="display:flex;gap:8px;position:relative;">
              <div style="flex:1;position:relative;">
                <input type="text" id="invite-search" placeholder="${t('alliances.inviteSearch')}"
                  autocomplete="off"
                  style="width:100%;background:var(--surface2);border:1.5px solid var(--border);
                  border-radius:var(--radius-md);color:var(--text);font-family:var(--font-body);font-size:13px;
                  padding:7px 10px;outline:none;transition:border-color 0.15s;"
                  onfocus="this.style.borderColor='var(--accent)'"
                  onblur="this.style.borderColor='var(--border)'"/>
                <div id="invite-dropdown" style="
                  display:none;position:absolute;top:100%;inset-inline-start:0;inset-inline-end:0;
                  background:var(--surface);border:1.5px solid var(--accent);border-top:none;
                  border-radius:0 0 var(--radius-md) var(--radius-md);
                  box-shadow:var(--shadow-md);z-index:100;max-height:180px;overflow-y:auto;
                "></div>
              </div>
              <button class="btn btn-primary" id="btn-send-invite" style="font-size:12px;white-space:nowrap;">
                ${t('alliances.inviteBtn')}
              </button>
            </div>
            <div class="msg" id="invite-msg" style="margin-top:6px;"></div>
          </div>
        ` : ''}
      </div>

      <!-- Pending invites for this nation (shown to non-members) -->
      <div id="pending-invites-panel"></div>

    </div>
  `;

  bindPageNav(user, profile, nation);
  bindHubEvents(user, profile, nation, membership, al, aliveMembers);
}

function alertRow(a) {
  const colors = {
    under_attack:    { dot: 'var(--danger)', icon: '🔴' },
    attack_repelled: { dot: 'var(--success)', icon: '🛡️' },
    member_joined:   { dot: 'var(--accent)', icon: '✅' },
    member_left:     { dot: 'var(--text-dim)', icon: '👋' },
  };
  const c = colors[a.alert_type] || { dot: 'var(--text-dim)', icon: '📢' };
  return `
    <div style="display:flex;align-items:flex-start;gap:10px;padding:10px 18px;
      border-bottom:1px solid var(--border-dim);">
      <div style="width:8px;height:8px;border-radius:50%;background:${c.dot};flex-shrink:0;margin-top:4px;"></div>
      <div style="flex:1;font-size:12px;">
        <span style="font-weight:600;">${c.icon} ${a.details || a.alert_type}</span>
        <span style="color:var(--text-dim);margin-inline-start:8px;">${timeAgo(a.created_at)}</span>
      </div>
    </div>
  `;
}

function chatMsg(m, myNationId) {
  const isMe = m.nation_id === myNationId;
  return `
    <div style="padding:6px 14px;display:flex;gap:8px;align-items:flex-start;
      ${isMe ? 'flex-direction:row-reverse;' : ''}">
      <div style="width:28px;height:28px;border-radius:50%;background:var(--accent-bg);border:1px solid var(--accent-border);
        display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;
        color:var(--accent);flex-shrink:0;">${m.nation_name.charAt(0).toUpperCase()}</div>
      <div style="max-width:75%;${isMe ? 'align-items:flex-end;' : ''}display:flex;flex-direction:column;gap:2px;">
        <div style="font-size:10px;color:var(--text-dim);font-weight:600;
          ${isMe ? 'text-align:end;' : ''}">${isMe ? t('alliances.you') : m.nation_name}</div>
        <div style="background:${isMe ? 'var(--accent)' : 'var(--surface2)'};
          color:${isMe ? '#fff' : 'var(--text)'};
          border:1px solid ${isMe ? 'transparent' : 'var(--border)'};
          border-radius:${isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px'};
          padding:7px 11px;font-size:13px;font-weight:500;line-height:1.4;
          word-break:break-word;">${m.message}</div>
        <div style="font-size:10px;color:var(--text-dim);">${new Date(m.posted_at).toLocaleTimeString()}</div>
      </div>
    </div>
  `;
}

function memberRow(m, myNationId, canKick) {
  const n = m.nations;
  if (!n) return '';
  const isMe = n.id === myNationId;
  const roleBadge = {
    leader:  `<span class="badge badge-blue" style="font-size:9px;">${t('alliances.leaderBadge')}</span>`,
    officer: `<span class="badge badge-yellow" style="font-size:9px;">${t('alliances.officerBadge')}</span>`,
    member:  '',
  }[m.role] || '';
  return `
    <div style="display:flex;align-items:center;gap:10px;padding:10px 18px;
      border-bottom:1px solid var(--border-dim);${isMe ? 'background:var(--accent-bg);' : ''}">
      <div style="width:32px;height:32px;border-radius:50%;background:var(--accent-bg);
        border:1px solid var(--accent-border);display:flex;align-items:center;justify-content:center;
        font-size:13px;font-weight:700;color:var(--accent);flex-shrink:0;">
        ${n.name.charAt(0).toUpperCase()}
      </div>
      <div style="flex:1;min-width:0;">
        <div style="font-size:13px;font-weight:600;display:flex;align-items:center;gap:6px;">
          ${n.name}
          ${isMe ? `<span style="font-size:9px;color:var(--accent);font-weight:700;">${t('alliances.youBadge')}</span>` : ''}
          ${roleBadge}
        </div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:1px;">
          ⚔️ ${n.soldiers.toLocaleString()} · 🗺️ ${n.land} · 🛡️ ${n.security_index}%
        </div>
      </div>
      ${canKick && !isMe && m.role !== 'leader' ? `
        <button class="btn btn-ghost btn-kick" data-nation-id="${n.id}" data-nation-name="${n.name}"
          style="font-size:11px;padding:4px 8px;color:var(--danger);border-color:var(--danger-border);">
          ${t('alliances.kickBtn')}
        </button>
      ` : ''}
    </div>
  `;
}

function bindHubEvents(user, profile, nation, membership, al, members) {
  const alId = al.id;

  // Leave
  document.getElementById('btn-leave').addEventListener('click', async () => {
    if (!confirm(t('alliances.leaveConfirm',{name:al.name}))) return;
    await sb.from('alliance_members').delete().eq('nation_id', nation.id).eq('alliance_id', alId);
    await sb.from('nations').update({ alliance_id: null }).eq('id', nation.id);
    await sb.from('alliance_alerts').insert({
      alliance_id: alId, alert_type: 'member_left',
      nation_id: nation.id, nation_name: nation.name,
      details: nation.name + ' left the alliance'
    });
    renderAlliances(user, profile, { ...nation, alliance_id: null });
  });

  // Settings toggle
  document.getElementById('btn-al-settings')?.addEventListener('click', () => {
    const p = document.getElementById('settings-panel');
    p.style.display = p.style.display === 'none' ? 'block' : 'none';
  });

  // Save settings (name, tag, desc, open)
  document.getElementById('btn-save-settings')?.addEventListener('click', async () => {
    const name = document.getElementById('settings-name')?.value.trim();
    const tag  = document.getElementById('settings-tag')?.value.trim().toUpperCase();
    const desc = document.getElementById('settings-desc').value.trim();
    const open = document.getElementById('settings-open').checked;
    if (name && name.length < 3) { showMsg('settings-msg','error',t('alliances.errNameLength')); return; }
    if (tag && tag.length < 2)   { showMsg('settings-msg','error',t('alliances.errTagLength')); return; }
    const updates = { description: desc, is_open: open };
    if (name) updates.name = name;
    if (tag)  updates.tag  = tag;
    const { error } = await sb.from('alliances').update(updates).eq('id', alId);
    if (error) showMsg('settings-msg','error', error.message.includes('unique') ? t('alliances.errNameTaken') : error.message);
    else { showMsg('settings-msg','success',t('alliances.settingsSaved')); renderAlliances(user, profile, nation); }
  });

  // Invite autocomplete
  let _selectedNation = null;
  let _searchTimer = null;

  document.getElementById('invite-search')?.addEventListener('input', () => {
    _selectedNation = null;
    clearTimeout(_searchTimer);
    const q = document.getElementById('invite-search').value.trim();
    const dd = document.getElementById('invite-dropdown');
    if (!q || q.length < 2) { dd.style.display = 'none'; return; }

    _searchTimer = setTimeout(async () => {
      const { data: nations } = await sb.from('nations')
        .select('id, name, alliance_id')
        .ilike('name', `%${q}%`)
        .eq('round', 1).eq('is_alive', true)
        .limit(6);

      if (!nations?.length) {
        dd.innerHTML = `<div style="padding:10px 12px;font-size:13px;color:var(--text-muted);">${t('alliances.inviteNoneFound')}</div>`;
        dd.style.display = 'block'; return;
      }

      dd.innerHTML = nations.map(n => `
        <div class="invite-option" data-id="${n.id}" data-name="${n.name}" data-alliance="${n.alliance_id || ''}"
          style="padding:9px 12px;font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;
          border-bottom:1px solid var(--border-dim);"
          onmouseenter="this.style.background='var(--surface2)'"
          onmouseleave="this.style.background=''">
          <span style="font-weight:600;">${n.name}</span>
          ${n.alliance_id
            ? `<span style="font-size:11px;color:var(--warning);">${t('alliances.inviteAlreadyMember')}</span>`
            : `<span style="font-size:11px;color:var(--success);">✓ ${t('alliances.open')}</span>`}
        </div>
      `).join('');
      dd.style.display = 'block';

      dd.querySelectorAll('.invite-option').forEach(opt => {
        opt.addEventListener('click', () => {
          _selectedNation = { id: opt.dataset.id, name: opt.dataset.name, alliance_id: opt.dataset.alliance };
          document.getElementById('invite-search').value = opt.dataset.name;
          dd.style.display = 'none';
        });
      });
    }, 280);
  });

  // Close dropdown on outside click
  document.addEventListener('click', e => {
    if (!e.target.closest('#invite-search') && !e.target.closest('#invite-dropdown')) {
      const dd = document.getElementById('invite-dropdown');
      if (dd) dd.style.display = 'none';
    }
  });

  // Send invite
  document.getElementById('btn-send-invite')?.addEventListener('click', async () => {
    const targetNation = _selectedNation;
    if (!targetNation) {
      // Try exact match if nothing selected from dropdown
      const q = document.getElementById('invite-search')?.value.trim();
      if (!q) return;
      const { data: found } = await sb.from('nations').select('id, name, alliance_id')
        .ilike('name', q).eq('round', 1).eq('is_alive', true).maybeSingle();
      if (!found) { showMsg('invite-msg','error', t('alliances.inviteNoneFound')); return; }
      _selectedNation = found;
    }
    const tn = _selectedNation;
    if (tn.alliance_id) { showMsg('invite-msg','error', t('alliances.inviteAlreadyMember')); return; }
    const { data: existing } = await sb.from('alliance_invites')
      .select('id').eq('alliance_id', alId).eq('nation_id', tn.id).eq('status', 'pending').maybeSingle();
    if (existing) { showMsg('invite-msg','error', t('alliances.inviteAlreadySent')); return; }
    const { error } = await sb.from('alliance_invites').insert({
      alliance_id: alId, nation_id: tn.id,
      invited_by_nation_id: nation.id, status: 'pending'
    });
    if (error) showMsg('invite-msg','error', error.message);
    else {
      // Insert a notification for the invited nation
      const { data: invitedNation } = await sb.from('nations').select('id').eq('id', tn.id).maybeSingle();
      if (invitedNation) {
        await sb.from('nation_notifications').insert({
          nation_id: tn.id,
          type: 'info',
          title: 'info_alliance_invite_title',
          message: `info_alliance_invite_msg:${al.name}`,
          is_read: false,
        });
      }
      showMsg('invite-msg','success', t('alliances.inviteSent', { name: tn.name }));
      document.getElementById('invite-search').value = '';
      _selectedNation = null;
    }
  });

  // Disband
  document.getElementById('btn-disband')?.addEventListener('click', async () => {
    if (!confirm(t('alliances.disbandConfirm',{name:al.name}))) return;
    await sb.from('alliances').delete().eq('id', alId);
    await sb.from('nations').update({ alliance_id: null }).eq('alliance_id', alId);
    renderAlliances(user, profile, { ...nation, alliance_id: null });
  });

  // Send chat
  const sendMsg = async () => {
    const input = document.getElementById('chat-input');
    const msg = input.value.trim();
    if (!msg) return;
    input.value = '';
    const btn = document.getElementById('btn-send');
    btn.disabled = true;
    const { error } = await sb.from('alliance_chat').insert({
      alliance_id: alId, nation_id: nation.id,
      nation_name: nation.name, message: msg,
    });
    btn.disabled = false;
    if (!error) {
      // Re-render chat only
      const { data: newMessages } = await sb.from('alliance_chat').select('*')
        .eq('alliance_id', alId).order('posted_at', { ascending: false }).limit(50);
      const chatEl = document.getElementById('chat-messages');
      if (chatEl) chatEl.innerHTML = (newMessages||[]).map(m => chatMsg(m, nation.id)).join('');
    }
  };

  document.getElementById('btn-send').addEventListener('click', sendMsg);
  document.getElementById('chat-input').addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); }
  });

  // Kick members
  document.querySelectorAll('.btn-kick').forEach(btn => {
    btn.addEventListener('click', async () => {
      const nId   = btn.getAttribute('data-nation-id');
      const nName = btn.getAttribute('data-nation-name');
      if (!confirm(t('alliances.kickConfirm',{name:nName}))) return;
      await sb.from('alliance_members').delete().eq('nation_id', nId).eq('alliance_id', alId);
      await sb.from('nations').update({ alliance_id: null }).eq('id', nId);
      await sb.from('alliance_alerts').insert({
        alliance_id: alId, alert_type: 'member_left',
        nation_name: nName, details: nName + ' was kicked from the alliance'
      });
      renderAlliances(user, profile, nation);
    });
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function showMsg(id, type, text) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.className = 'msg ' + type + ' show';
  if (type === 'success') setTimeout(() => el.classList.remove('show'), 3000);
}

function timeAgo(ts) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return t('alliances.justNow');
  if (m < 60) return t('alliances.mAgo',{m});
  const h = Math.floor(m / 60);
  if (h < 24) return t('alliances.hAgo',{h});
  return t('alliances.dAgo',{d:Math.floor(h/24)});
}
