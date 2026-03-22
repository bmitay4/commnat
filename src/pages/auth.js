import i18n, { translateDOM } from '../i18n.js';
import { sb } from '../supabase.js';
import { formatTimeLeft } from '../utils.js';

const HERO_IMAGES = [
  '/images/bg-jet.png',
  '/images/bg-tanks.png',
  '/images/bg-satellite.png',
  '/images/bg-diplomacy.png',
];

let heroIndex = 0;
let carouselTimer = null;

export function renderAuth() {
  const app = document.getElementById('app');

  app.innerHTML = `
    <div class="auth-wrap">

      <div class="hero-bg" id="hero-bg"></div>
      <div class="hero-overlay" id="hero-overlay"></div>

      <!-- Left panel -->
      <div class="auth-left">
        <div class="auth-content">
          <div class="auth-badge" data-i18n="auth.badge"></div>
          <h1 class="auth-title">Nation<br><span>Commander</span></h1>
          <p class="auth-sub" data-i18n="auth.tagline"></p>
          <div class="auth-stats">
            <div class="auth-stat">
              <div class="auth-stat-val" id="ticker-nations">--</div>
              <div class="auth-stat-lbl" data-i18n="ticker.nationsActive"></div>
            </div>
          </div>
          <div class="img-nav" id="img-nav">
            ${HERO_IMAGES.map((_, i) => `<button class="img-dot ${i===0?'active':''}" data-idx="${i}"></button>`).join('')}
          </div>
        </div>
      </div>

      <!-- Right panel -->
      <div class="auth-right">
        <div class="auth-panel">
          <div class="auth-panel-top">
            <div class="auth-panel-brand">// Secure Login</div>
            <div class="lang-switcher-light">
              <button class="lang-btn-light ${i18n.language==='en'?'active':''}" data-lang="en">EN</button>
              <button class="lang-btn-light ${i18n.language==='he'?'active':''}" data-lang="he">עב</button>
            </div>
          </div>

          <div class="tabs">
            <button class="tab-btn active" id="tab-login" data-i18n="auth.loginTab"></button>
            <button class="tab-btn" id="tab-register" data-i18n="auth.registerTab"></button>
          </div>

          <div class="form-panel active" id="panel-login">
            <div class="field">
              <label data-i18n="auth.emailLabel"></label>
              <input type="email" id="login-email" data-i18n-placeholder="auth.emailPlaceholder" autocomplete="email" />
            </div>
            <div class="field">
              <label data-i18n="auth.passwordLabel"></label>
              <input type="password" id="login-password" data-i18n-placeholder="auth.passwordPlaceholder" autocomplete="current-password" />
            </div>
            <button class="btn-submit" id="btn-login" data-i18n="auth.loginBtn"></button>
            <div class="msg" id="login-msg"></div>
          </div>

          <div class="form-panel" id="panel-register">
            <div class="field">
              <label data-i18n="auth.usernameLabel"></label>
              <input type="text" id="reg-username" data-i18n-placeholder="auth.usernamePlaceholder" autocomplete="username" />
            </div>
            <div class="field">
              <label data-i18n="auth.emailLabel"></label>
              <input type="email" id="reg-email" data-i18n-placeholder="auth.emailPlaceholder" autocomplete="email" />
            </div>
            <div class="field-row">
              <div class="field">
                <label data-i18n="auth.passwordLabel"></label>
                <input type="password" id="reg-password" data-i18n-placeholder="auth.passwordPlaceholder" autocomplete="new-password" />
              </div>
              <div class="field">
                <label data-i18n="auth.confirmLabel"></label>
                <input type="password" id="reg-confirm" data-i18n-placeholder="auth.passwordPlaceholder" autocomplete="new-password" />
              </div>
            </div>
            <div class="field">
              <label>
                <span data-i18n="auth.phoneLabel"></span>
                <span class="optional-tag" data-i18n="auth.optional"></span>
              </label>
              <input type="tel" id="reg-phone" data-i18n-placeholder="auth.phonePlaceholder" autocomplete="tel" />
            </div>
            <button class="btn-submit" id="btn-register" data-i18n="auth.registerBtn"></button>
            <div class="msg" id="register-msg"></div>
          </div>

        </div>
      </div>
    </div>
  `;

  translateDOM();
  bindEvents();
  loadTicker();
  startCarousel();
}

function setHeroImage(idx) {
  heroIndex = idx;
  const bg = document.getElementById('hero-bg');
  if (!bg) return;
  bg.style.opacity = '0';
  setTimeout(() => {
    bg.style.backgroundImage = `url(${HERO_IMAGES[idx]})`;
    bg.style.backgroundSize = 'cover';
    bg.style.backgroundPosition = 'center center';
    bg.style.opacity = '1';
  }, 300);
  document.querySelectorAll('.img-dot').forEach((d, i) => d.classList.toggle('active', i === idx));
}

function startCarousel() {
  setHeroImage(0);
  if (carouselTimer) clearInterval(carouselTimer);
  carouselTimer = setInterval(() => {
    setHeroImage((heroIndex + 1) % HERO_IMAGES.length);
  }, 6000);
}

function bindEvents() {
  document.getElementById('tab-login').addEventListener('click', () => switchTab('login'));
  document.getElementById('tab-register').addEventListener('click', () => switchTab('register'));
  document.getElementById('btn-login').addEventListener('click', doLogin);
  document.getElementById('btn-register').addEventListener('click', doRegister);
  document.getElementById('login-password').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
  document.getElementById('reg-confirm').addEventListener('keydown', e => { if (e.key === 'Enter') doRegister(); });

  document.querySelectorAll('.lang-btn-light[data-lang]').forEach(btn => {
    btn.addEventListener('click', () => {
      i18n.changeLanguage(btn.getAttribute('data-lang'));
      document.querySelectorAll('.lang-btn-light[data-lang]').forEach(b => b.classList.toggle('active', b.getAttribute('data-lang') === btn.getAttribute('data-lang')));
      translateDOM();
    });
  });

  document.querySelectorAll('.img-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      if (carouselTimer) clearInterval(carouselTimer);
      setHeroImage(parseInt(dot.getAttribute('data-idx')));
      carouselTimer = setInterval(() => setHeroImage((heroIndex + 1) % HERO_IMAGES.length), 6000);
    });
  });
}

function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.form-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  document.getElementById('panel-' + tab).classList.add('active');
  clearMessages();
}

function showMsg(id, type, text) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.className = 'msg ' + type + ' show';
}

function clearMessages() {
  document.querySelectorAll('.msg').forEach(m => { m.className = 'msg'; m.textContent = ''; });
}

function setLoading(btnId, loading, labelKey) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled = loading;
  btn.textContent = loading ? i18n.t('loading') : i18n.t(labelKey);
}

// Pre-fetch IP as soon as auth page loads — ready before user even clicks Login
let _cachedIp = 'unknown';
fetch('https://api.ipify.org?format=json')
  .then(r => r.json())
  .then(d => { _cachedIp = d.ip || 'unknown'; })
  .catch(() => {});

async function logLogin(userId, username, email, success, failReason) {
  try {
    // Fire insert using cached IP — don't await a fresh fetch, or navigation will cancel it
    const insertPromise = sb.from('login_logs').insert({
      user_id: userId || null,
      username_attempted: username || null,
      email_attempted: email,
      ip_address: _cachedIp,
      user_agent: navigator.userAgent,
      success,
      fail_reason: failReason || null,
    });
    // Wait for insert to complete before auth state change navigates away
    await Promise.race([insertPromise, new Promise(r => setTimeout(r, 800))]);
  } catch (_) {}
}

async function doLogin() {
  clearMessages();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  if (!email || !password) { showMsg('login-msg', 'error', i18n.t('auth.errFillAll')); return; }
  setLoading('btn-login', true, 'auth.loginBtn');

  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) {
    await logLogin(null, null, email, false, error.message);
    showMsg('login-msg', 'error', error.message.toUpperCase());
    setLoading('btn-login', false, 'auth.loginBtn');
    return;
  }

  const { data: profile } = await sb.from('profiles').select('username, is_admin, is_banned').eq('id', data.user.id).single();
  if (profile?.is_banned) {
    await sb.auth.signOut();
    await logLogin(data.user.id, profile.username, email, false, 'BANNED');
    showMsg('login-msg', 'error', i18n.t('auth.errBanned'));
    setLoading('btn-login', false, 'auth.loginBtn');
    return;
  }

  await logLogin(data.user.id, profile?.username, email, true, null);
  showMsg('login-msg', 'success', i18n.t('auth.loginSuccess'));
}

async function doRegister() {
  clearMessages();
  const username = document.getElementById('reg-username').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const confirm = document.getElementById('reg-confirm').value;
  const phone = document.getElementById('reg-phone').value.trim();

  if (!username || !email || !password || !confirm) { showMsg('register-msg', 'error', i18n.t('auth.errFillAll')); return; }
  if (username.length < 3) { showMsg('register-msg', 'error', i18n.t('auth.errUsername')); return; }
  if (password.length < 8) { showMsg('register-msg', 'error', i18n.t('auth.errPassLen')); return; }
  if (password !== confirm) { showMsg('register-msg', 'error', i18n.t('auth.errPassMatch')); return; }

  setLoading('btn-register', true, 'auth.registerBtn');
  const { data, error } = await sb.auth.signUp({
    email, password,
    options: { data: { username, phone: phone || null } },
  });

  if (error) {
    showMsg('register-msg', 'error', error.message.toUpperCase());
    setLoading('btn-register', false, 'auth.registerBtn');
    return;
  }

  if (phone && data.user) {
    await sb.from('profiles').update({ phone }).eq('id', data.user.id);
  }

  showMsg('register-msg', 'success', i18n.t('auth.registerSuccess'));
  setLoading('btn-register', false, 'auth.registerBtn');
}

async function loadTicker() {
  // Count active human players (nations alive, not bots)
  const { count } = await sb
    .from('nations')
    .select('id', { count: 'exact', head: true })
    .eq('is_alive', true);
    // .eq('is_bot', false);

  const nationsEl = document.getElementById('ticker-nations');
  if (nationsEl && count !== null) nationsEl.textContent = count;


}

