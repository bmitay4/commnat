import i18n from '../i18n.js';
import { THEMES, saveTheme } from '../theme.js';
import { sb } from '../supabase.js';
import { renderPageTopbar, bindPageNav } from '../nav.js';

const t = (key, p) => i18n.t(key, p);

export async function renderProfile(user, profile, nation) {
  const app = document.getElementById('app');
  app.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-size:13px;color:var(--text-muted);font-family:var(--font-body);font-weight:500;">${t('loading')}</div>`;

  // Fetch extended profile data
  const [
    { data: profileData },
    { data: loginHistory, error: loginErr },
    { data: nationData },
  ] = await Promise.all([
    sb.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    sb.from('login_logs').select('ip_address, logged_at').eq('user_id', user.id).eq('success', true).order('logged_at', { ascending: false }).limit(5),
    sb.from('nations').select('name, round').eq('owner_id', user.id).eq('is_alive', true).maybeSingle(),
  ]);

  if (loginErr) console.error('[Profile] login_logs error:', loginErr);

  const memberSince = new Date(user.created_at).toLocaleDateString(i18n.language === 'he' ? 'he-IL' : 'en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  function maskIp(ip) {
    if (!ip) return '—';
    const parts = ip.split('.');
    if (parts.length === 4) return `${parts[0]}.${parts[1]}.X.X`;
    // IPv6 fallback — show first 8 chars
    return ip.substring(0, 8) + '...';
  }

  function formatLoginTime(ts) {
    if (!ts) return '—';
    return new Date(ts).toLocaleString(i18n.language === 'he' ? 'he-IL' : 'en-US', {      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  const logins = loginHistory || [];

  app.innerHTML = `
    ${renderPageTopbar(user, profile, nation, 'profile')}
    <div class="shell" style="max-width:720px;">

      <!-- Header -->
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:28px;">
        <div style="
          width:52px;height:52px;
          background:linear-gradient(135deg,var(--accent),var(--accent-2));
          border-radius:14px;
          display:flex;align-items:center;justify-content:center;
          font-size:24px;flex-shrink:0;
          box-shadow:var(--shadow-accent);
        ">🛡️</div>
        <div>
          <h1 style="font-size:20px;font-weight:800;color:var(--text);margin-bottom:2px;">${t('profile.title')}</h1>
          <div style="font-size:13px;color:var(--text-muted);">${t('profile.memberSince')} ${memberSince}</div>
        </div>
      </div>

      <!-- Identity Card -->
      <div style="
        background:var(--surface);border:1px solid var(--border);
        border-radius:var(--radius-lg);padding:24px;margin-bottom:16px;
        box-shadow:var(--shadow-sm);
      ">
        <div style="font-size:11px;font-weight:700;color:var(--accent);letter-spacing:0.08em;text-transform:uppercase;margin-bottom:16px;">${t('profile.identity')}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          ${identityRow('👤', t('profile.username'), profileData?.username || profile?.username || '—')}
          ${identityRow('✉️', t('profile.email'), user.email || '—')}
          ${identityRow('📱', t('profile.phone'), profileData?.phone || user.phone || t('profile.notSet'))}
          ${identityRow('🌍', t('profile.nation'), nationData?.name || t('profile.noNation'))}
        </div>
      </div>

      <!-- Language -->
      <div style="
        background:var(--surface);border:1px solid var(--border);
        border-radius:var(--radius-lg);padding:24px;margin-bottom:16px;
        box-shadow:var(--shadow-sm);
      ">
        <div style="font-size:11px;font-weight:700;color:var(--accent);letter-spacing:0.08em;text-transform:uppercase;margin-bottom:16px;">${t('profile.language')}</div>
        <div style="display:flex;gap:8px;">
          <button id="lang-en" style="
            padding:8px 20px;border-radius:var(--radius-sm);
            font-size:13px;font-weight:600;cursor:pointer;
            border:1.5px solid ${i18n.language === 'en' ? 'var(--accent)' : 'var(--border)'};
            background:${i18n.language === 'en' ? 'var(--accent-bg)' : 'var(--surface2)'};
            color:${i18n.language === 'en' ? 'var(--accent)' : 'var(--text-muted)'};
            transition:all 0.15s;
          ">🇺🇸 English</button>
          <button id="lang-he" style="
            padding:8px 20px;border-radius:var(--radius-sm);
            font-size:13px;font-weight:600;cursor:pointer;
            border:1.5px solid ${i18n.language === 'he' ? 'var(--accent)' : 'var(--border)'};
            background:${i18n.language === 'he' ? 'var(--accent-bg)' : 'var(--surface2)'};
            color:${i18n.language === 'he' ? 'var(--accent)' : 'var(--text-muted)'};
            transition:all 0.15s;
          ">🇮🇱 עברית</button>
        </div>
      </div>

      <!-- Notification Preferences -->
      <div style="
        background:var(--surface);border:1px solid var(--border);
        border-radius:var(--radius-lg);padding:24px;margin-bottom:16px;
        box-shadow:var(--shadow-sm);
      ">
        <div style="font-size:11px;font-weight:700;color:var(--accent);letter-spacing:0.08em;text-transform:uppercase;margin-bottom:16px;">${t('profile.notifications')}</div>
        <div style="display:flex;flex-direction:column;gap:12px;">
          ${notifToggle('notif-attacks', t('profile.notifAttacks'), profileData?.notif_attacks !== false)}
          ${notifToggle('notif-alliance', t('profile.notifAlliance'), profileData?.notif_alliance !== false)}
          ${notifToggle('notif-fiscal', t('profile.notifFiscal'), profileData?.notif_fiscal !== false)}
        </div>
        <button id="btn-save-notif" style="
          margin-top:16px;
          background:var(--accent);color:#fff;
          border:none;border-radius:var(--radius-sm);
          padding:8px 18px;font-size:13px;font-weight:600;
          cursor:pointer;transition:opacity 0.15s;
        ">${t('save')}</button>
        <span id="notif-saved" style="margin-inline-start:10px;font-size:12px;color:var(--success);display:none;">${t('profile.saved')}</span>
      </div>

      <!-- Theme -->
      <div style="
        background:var(--surface);border:1px solid var(--border);
        border-radius:var(--radius-lg);padding:24px;margin-bottom:16px;
        box-shadow:var(--shadow-sm);
      ">
        <div style="font-size:11px;font-weight:700;color:var(--accent);letter-spacing:0.08em;text-transform:uppercase;margin-bottom:16px;">${t('profile.themeTitle')}</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;" id="theme-grid">
          ${THEMES.map(th => `
            <div class="theme-card" data-theme-id="${th.id}" style="
              border-radius:var(--radius-md);
              border:2px solid ${(profileData?.theme || 'light') === th.id ? 'var(--accent)' : 'var(--border)'};
              overflow:hidden;cursor:pointer;transition:border-color 0.15s,transform 0.15s;
              transform:${(profileData?.theme || 'light') === th.id ? 'scale(1.02)' : 'scale(1)'};
            ">
              <!-- Mini preview -->
              <div style="height:64px;background:${th.preview.bg};padding:8px;display:flex;flex-direction:column;gap:4px;">
                <div style="height:10px;background:${th.preview.surface};border-radius:3px;width:100%;"></div>
                <div style="display:flex;gap:4px;flex:1;">
                  <div style="width:30%;background:${th.preview.surface};border-radius:3px;"></div>
                  <div style="flex:1;background:${th.preview.accent};border-radius:3px;opacity:0.8;"></div>
                </div>
              </div>
              <!-- Label -->
              <div style="padding:8px 10px;background:var(--surface2);border-top:1px solid var(--border);">
                <div style="font-size:12px;font-weight:700;color:var(--text);">${i18n.t(th.nameKey)}</div>
                <div style="font-size:10px;color:var(--text-muted);margin-top:1px;">${i18n.t(th.descKey)}</div>
              </div>
            </div>
          `).join('')}
        </div>
        <div id="theme-saved" style="font-size:12px;color:var(--success);margin-top:10px;display:none;">${t('profile.saved')}</div>
      </div>

      <!-- Change Password -->
      <div style="
        background:var(--surface);border:1px solid var(--border);
        border-radius:var(--radius-lg);padding:24px;margin-bottom:16px;
        box-shadow:var(--shadow-sm);
      ">
        <div style="font-size:11px;font-weight:700;color:var(--accent);letter-spacing:0.08em;text-transform:uppercase;margin-bottom:16px;">${t('profile.changePassword')}</div>
        <div style="display:flex;flex-direction:column;gap:10px;max-width:340px;">
          <input id="pw-new" type="password" placeholder="${t('profile.newPassword')}" style="${inputStyle()}">
          <input id="pw-confirm" type="password" placeholder="${t('profile.confirmPassword')}" style="${inputStyle()}">
          <button id="btn-change-pw" style="
            background:var(--accent);color:#fff;border:none;
            border-radius:var(--radius-sm);padding:8px 18px;
            font-size:13px;font-weight:600;cursor:pointer;
            transition:opacity 0.15s;align-self:flex-start;
          ">${t('profile.updatePassword')}</button>
          <div id="pw-msg" style="font-size:12px;display:none;"></div>
        </div>
      </div>

      <!-- Login History -->
      <div style="
        background:var(--surface);border:1px solid var(--border);
        border-radius:var(--radius-lg);padding:24px;margin-bottom:16px;
        box-shadow:var(--shadow-sm);
      ">
        <div style="font-size:11px;font-weight:700;color:var(--accent);letter-spacing:0.08em;text-transform:uppercase;margin-bottom:16px;">${t('profile.loginHistory')}</div>
        ${logins.length === 0
          ? `<div style="font-size:13px;color:var(--text-muted);">${t('profile.noLogins')}</div>`
          : `<div style="display:flex;flex-direction:column;gap:8px;">
              ${logins.map((l, i) => `
                <div style="
                  display:flex;align-items:center;justify-content:space-between;
                  padding:10px 14px;
                  background:${i === 0 ? 'var(--accent-bg)' : 'var(--surface2)'};
                  border:1px solid ${i === 0 ? 'var(--accent-border)' : 'var(--border-dim)'};
                  border-radius:var(--radius-sm);
                ">
                  <div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-size:13px;">${i === 0 ? '🟢' : '⬤'}</span>
                    <span style="font-family:var(--font-mono);font-size:13px;color:var(--text);font-weight:${i === 0 ? '700' : '500'};">${maskIp(l.ip_address)}</span>
                    ${i === 0 ? `<span style="font-size:10px;font-weight:700;color:var(--accent);background:var(--accent-bg);border:1px solid var(--accent-border);padding:1px 6px;border-radius:99px;">${t('profile.current')}</span>` : ''}
                  </div>
                  <span style="font-size:12px;color:var(--text-muted);">${formatLoginTime(l.logged_at)}</span>
                </div>
              `).join('')}
            </div>`
        }
      </div>

      <!-- Danger Zone -->
      <div style="
        background:var(--danger-bg);border:1px solid var(--danger-border);
        border-radius:var(--radius-lg);padding:24px;
        box-shadow:var(--shadow-sm);
      ">
        <div style="font-size:11px;font-weight:700;color:var(--danger);letter-spacing:0.08em;text-transform:uppercase;margin-bottom:8px;">⚠️ ${t('profile.dangerZone')}</div>
        <div style="font-size:13px;color:var(--text-muted);margin-bottom:14px;">${t('profile.deleteWarning')}</div>
        <button id="btn-delete-account" style="
          background:var(--danger);color:#fff;border:none;
          border-radius:var(--radius-sm);padding:8px 18px;
          font-size:13px;font-weight:600;cursor:pointer;
          transition:opacity 0.15s;
        ">${t('profile.deleteAccount')}</button>
      </div>

    </div>

    <!-- Delete confirmation modal -->
    <div id="delete-modal" style="
      display:none;position:fixed;inset:0;z-index:999;
      background:rgba(0,0,0,0.45);
      align-items:center;justify-content:center;
    ">
      <div style="
        background:var(--surface);border-radius:var(--radius-lg);
        padding:28px;max-width:380px;width:90%;
        box-shadow:0 20px 60px rgba(0,0,0,0.2);
      ">
        <div style="font-size:32px;margin-bottom:12px;">⚠️</div>
        <div style="font-size:16px;font-weight:700;color:var(--text);margin-bottom:8px;">${t('profile.deleteConfirmTitle')}</div>
        <div style="font-size:13px;color:var(--text-muted);margin-bottom:20px;line-height:1.6;">${t('profile.deleteConfirmMsg')}</div>
        <div style="display:flex;gap:10px;">
          <button id="btn-cancel-delete" style="
            flex:1;background:var(--surface2);color:var(--text);
            border:1.5px solid var(--border);border-radius:var(--radius-sm);
            padding:9px;font-size:13px;font-weight:600;cursor:pointer;
          ">${t('cancel')}</button>
          <button id="btn-confirm-delete" style="
            flex:1;background:var(--danger);color:#fff;
            border:none;border-radius:var(--radius-sm);
            padding:9px;font-size:13px;font-weight:600;cursor:pointer;
          ">${t('profile.deleteAccount')}</button>
        </div>
      </div>
    </div>
  `;

  bindPageNav(user, profile, nation);

  // Language switcher
  document.getElementById('lang-en')?.addEventListener('click', () => i18n.changeLanguage('en'));
  document.getElementById('lang-he')?.addEventListener('click', () => i18n.changeLanguage('he'));

  // Theme selector
  document.querySelectorAll('.theme-card').forEach(card => {
    card.addEventListener('click', async () => {
      const themeId = card.getAttribute('data-theme-id');
      // Update UI
      document.querySelectorAll('.theme-card').forEach(c => {
        const active = c.getAttribute('data-theme-id') === themeId;
        c.style.borderColor = active ? 'var(--accent)' : 'var(--border)';
        c.style.transform   = active ? 'scale(1.02)' : 'scale(1)';
      });
      // Apply + save
      await saveTheme(user.id, themeId);
      const saved = document.getElementById('theme-saved');
      saved.style.display = 'block';
      setTimeout(() => { saved.style.display = 'none'; }, 2000);
    });
  });

  // Save notification prefs
  document.getElementById('btn-save-notif')?.addEventListener('click', async () => {
    const prefs = {
      notif_attacks: document.getElementById('notif-attacks').checked,
      notif_alliance: document.getElementById('notif-alliance').checked,
      notif_fiscal: document.getElementById('notif-fiscal').checked,
    };
    await sb.from('profiles').update(prefs).eq('id', user.id);
    const msg = document.getElementById('notif-saved');
    msg.style.display = 'inline';
    setTimeout(() => { msg.style.display = 'none'; }, 2000);
  });

  // Change password
  document.getElementById('btn-change-pw')?.addEventListener('click', async () => {
    const newPw = document.getElementById('pw-new').value;
    const confirmPw = document.getElementById('pw-confirm').value;
    const msgEl = document.getElementById('pw-msg');

    if (!newPw || newPw.length < 8) {
      showMsg(msgEl, t('auth.errPassLen'), 'danger'); return;
    }
    if (newPw !== confirmPw) {
      showMsg(msgEl, t('auth.errPassMatch'), 'danger'); return;
    }

    const btn = document.getElementById('btn-change-pw');
    btn.disabled = true; btn.textContent = '...';

    const { error } = await sb.auth.updateUser({ password: newPw });
    btn.disabled = false; btn.textContent = t('profile.updatePassword');

    if (error) { showMsg(msgEl, error.message, 'danger'); }
    else {
      showMsg(msgEl, t('profile.passwordUpdated'), 'success');
      document.getElementById('pw-new').value = '';
      document.getElementById('pw-confirm').value = '';
    }
  });

  // Delete account
  document.getElementById('btn-delete-account')?.addEventListener('click', () => {
    document.getElementById('delete-modal').style.display = 'flex';
  });
  document.getElementById('btn-cancel-delete')?.addEventListener('click', () => {
    document.getElementById('delete-modal').style.display = 'none';
  });
  document.getElementById('btn-confirm-delete')?.addEventListener('click', async () => {
    // Soft-delete: ban the user and sign out
    await sb.from('profiles').update({ is_banned: true }).eq('id', user.id);
    await sb.auth.signOut();
  });
}

function identityRow(icon, label, value) {
  return `
    <div style="
      background:var(--surface2);border:1px solid var(--border-dim);
      border-radius:var(--radius-sm);padding:12px 14px;
    ">
      <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">${icon} ${label}</div>
      <div style="font-size:13px;font-weight:600;color:var(--text);">${value}</div>
    </div>
  `;
}

function notifToggle(id, label, checked) {
  return `
    <label style="display:flex;align-items:center;justify-content:space-between;cursor:pointer;gap:12px;">
      <span style="font-size:13px;color:var(--text);">${label}</span>
      <input type="checkbox" id="${id}" ${checked ? 'checked' : ''} style="
        width:16px;height:16px;accent-color:var(--accent);cursor:pointer;
      ">
    </label>
  `;
}

function inputStyle() {
  return `
    padding:9px 12px;
    border:1.5px solid var(--border);
    border-radius:var(--radius-sm);
    font-size:13px;color:var(--text);
    background:var(--surface2);
    outline:none;
    transition:border-color 0.15s;
    width:100%;
  `;
}

function showMsg(el, text, type) {
  el.style.display = 'block';
  el.style.color = type === 'danger' ? 'var(--danger)' : 'var(--success)';
  el.textContent = text;
}
