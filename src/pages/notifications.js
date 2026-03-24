import { sb } from './supabase.js';
import i18n from './i18n.js';

// Translate stored notification keys into human-readable text
// DB stores compact keys like 'warning_fiscal_title' and 'warning_fiscal_msg:2916540:1'
function _translateNotif(notif) {
  let title = notif.title;
  let message = notif.message;

  const titleKey = 'notifications.notif_' + notif.title;
  const translatedTitle = i18n.t(titleKey);
  if (translatedTitle !== titleKey) title = translatedTitle;

  const parts = notif.message.split(':');
  const msgKey = 'notifications.notif_' + parts[0];
  const scenarioRaw = parts[2] || '';
  const scenarioWords = scenarioRaw.split('_').map(w => w[0]?.toUpperCase() + w.slice(1)).join('');
  const scenarioTranslated = scenarioRaw
    ? i18n.t('attacks.scenario' + scenarioWords, { defaultValue: scenarioRaw.replace(/_/g, ' ') })
    : '';
  const translatedMsg = i18n.t(msgKey, {
    defaultValue: msgKey,
    shortfall: Number(parts[1] || 0).toLocaleString(),
    sec: parts[2] || '',
    alliance: parts[1] || '',
    attacker: parts[1] || '',
    scenario: scenarioTranslated,
  });
  if (translatedMsg !== msgKey) {
    message = translatedMsg;
  }

  return { ...notif, title, message };
}

let _nation = null;
let _unreadCount = 0;
let _realtimeSub = null;

// ── Public API ────────────────────────────────────────────

export async function initNotifications(nation) {
  _nation = nation;
  if (!nation) return;

  await _refreshUnread();
  _subscribeRealtime();
}

export function destroyNotifications() {
  if (_realtimeSub) {
    sb.removeChannel(_realtimeSub);
    _realtimeSub = null;
  }
}

export async function openNotificationsPanel() {
  if (!_nation) return;

  const { data: notifs } = await sb
    .from('nation_notifications')
    .select('*')
    .eq('nation_id', _nation.id)
    .order('created_at', { ascending: false })
    .limit(50);

  _renderPanel(notifs || []);

  // Mark all as read
  await sb
    .from('nation_notifications')
    .update({ is_read: true })
    .eq('nation_id', _nation.id)
    .eq('is_read', false);

  _unreadCount = 0;
  _updateBadge(0);
}

// ── Internal ──────────────────────────────────────────────

async function _refreshUnread() {
  const { count } = await sb
    .from('nation_notifications')
    .select('*', { count: 'exact', head: true })
    .eq('nation_id', _nation.id)
    .eq('is_read', false);

  _unreadCount = count || 0;
  _updateBadge(_unreadCount);
}

function _subscribeRealtime() {
  if (_realtimeSub) sb.removeChannel(_realtimeSub);

  _realtimeSub = sb
    .channel(`notifs-${_nation.id}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'nation_notifications',
      filter: `nation_id=eq.${_nation.id}`,
    }, (payload) => {
      _unreadCount++;
      _updateBadge(_unreadCount);
      _showToast(payload.new);
    })
    .subscribe();
}

function _updateBadge(count) {
  const badge = document.getElementById('notif-badge');
  if (!badge) return;
  if (count > 0) {
    badge.textContent = count > 99 ? '99+' : count;
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }
}

function _typeStyle(type) {
  if (type === 'danger')  return { color: 'var(--danger)',  bg: 'var(--danger-bg)',  border: 'var(--danger-border)'  };
  if (type === 'warning') return { color: 'var(--warning)', bg: 'var(--warning-bg)', border: 'var(--warning-border)' };
  return                         { color: 'var(--accent)',  bg: 'var(--accent-bg)',  border: 'var(--accent-border)'  };
}

function _timeAgo(isoStr) {
  const diff = Date.now() - new Date(isoStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)   return i18n.t('notifications.justNow');
  if (m < 60)  return i18n.t('notifications.mAgo', { m });
  const h = Math.floor(m / 60);
  if (h < 24)  return i18n.t('notifications.hAgo', { h });
  return i18n.t('notifications.dAgo', { d: Math.floor(h / 24) });
}

function _renderPanel(notifs) {
  // Remove existing panel
  document.getElementById('notif-panel-overlay')?.remove();

  const overlay = document.createElement('div');
  overlay.id = 'notif-panel-overlay';
  overlay.style.cssText = `
    position:fixed;inset:0;z-index:1000;
    background:rgba(0,0,0,0.25);
    display:flex;align-items:flex-start;justify-content:flex-end;
    padding-top:52px;
  `;

  const panel = document.createElement('div');
  panel.style.cssText = `
    background:var(--surface);
    border:1px solid var(--border);
    border-radius:var(--radius-lg);
    box-shadow:var(--shadow-md);
    width:380px;
    max-height:calc(100vh - 70px);
    display:flex;flex-direction:column;
    margin-right:16px;
    overflow:hidden;
    animation:notif-slide-in 0.18s ease;
  `;

  const isEmpty = notifs.length === 0;

  panel.innerHTML = `
    <style>
      @keyframes notif-slide-in {
        from { opacity:0; transform:translateY(-8px); }
        to   { opacity:1; transform:translateY(0); }
      }
      @keyframes notif-toast-in {
        from { opacity:0; transform:translateX(100%); }
        to   { opacity:1; transform:translateX(0); }
      }
    </style>

    <!-- Header -->
    <div style="
      padding:14px 16px;
      border-bottom:1px solid var(--border);
      display:flex;align-items:center;justify-content:space-between;
      flex-shrink:0;
    ">
      <div style="font-size:14px;font-weight:700;color:var(--text);">${i18n.t('notifications.panelTitle')}</div>
      <button id="notif-panel-close" style="
        background:none;border:none;cursor:pointer;
        font-size:18px;color:var(--text-muted);padding:2px 6px;
        border-radius:var(--radius-sm);
      ">✕</button>
    </div>

    <!-- List -->
    <div style="overflow-y:auto;flex:1;padding:10px;">
      ${isEmpty ? `
        <div style="
          text-align:center;padding:40px 20px;
          color:var(--text-muted);font-size:13px;
        ">
          <div style="font-size:32px;margin-bottom:8px;">✅</div>
          ${i18n.t('notifications.allClear')}
        </div>
      ` : notifs.map(rawN => { const n = _translateNotif(rawN);
        const s = _typeStyle(n.type);
        return `
          <div style="
            background:${n.is_read ? 'transparent' : s.bg};
            border:1px solid ${n.is_read ? 'transparent' : s.border};
            border-radius:var(--radius-md);
            padding:12px 14px;
            margin-bottom:8px;
            transition:background 0.2s;
          ">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;">
              <div style="font-size:13px;font-weight:700;color:${s.color};line-height:1.3;">
                ${n.title}
              </div>
              <div style="font-size:11px;color:var(--text-dim);white-space:nowrap;flex-shrink:0;margin-top:1px;">
                ${_timeAgo(n.created_at)}
              </div>
            </div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:6px;line-height:1.5;">
              ${n.message}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  // Close on overlay click or X button
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
  panel.querySelector('#notif-panel-close').addEventListener('click', () => overlay.remove());
}

function _showToast(rawNotif) {
  const notif = _translateNotif(rawNotif);
  const s = _typeStyle(notif.type);

  const toast = document.createElement('div');
  toast.style.cssText = `
    position:fixed;
    bottom:24px;right:24px;
    z-index:2000;
    background:var(--surface);
    border:1.5px solid ${s.border};
    border-left:4px solid ${s.color};
    border-radius:var(--radius-md);
    box-shadow:var(--shadow-md);
    padding:14px 16px;
    max-width:340px;
    animation:notif-toast-in 0.25s ease;
    cursor:pointer;
  `;

  toast.innerHTML = `
    <div style="font-size:13px;font-weight:700;color:${s.color};margin-bottom:4px;">
      ${notif.title}
    </div>
    <div style="font-size:12px;color:var(--text-muted);line-height:1.5;">
      ${notif.message}
    </div>
    <div style="font-size:11px;color:var(--text-dim);margin-top:6px;">
      ${i18n.t('notifications.clickToView')}
    </div>
  `;

  toast.addEventListener('click', () => {
    toast.remove();
    openNotificationsPanel();
  });

  document.body.appendChild(toast);

  // Auto-dismiss after 8s
  setTimeout(() => {
    toast.style.transition = 'opacity 0.4s ease';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 400);
  }, 8000);
}
