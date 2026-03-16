import i18n, { applyDir, translateDOM } from './i18n.js';
import { sb } from './supabase.js';
import { renderAuth } from './pages/auth.js';

// Track what page is currently active so lang change can re-render it
let currentPage = { name: 'auth', user: null, profile: null, nation: null };

async function fetchProfile(userId) {
  const delays = [200, 500, 1000, 2000];
  for (let i = 0; i <= delays.length; i++) {
    const { data } = await sb
      .from('profiles')
      .select('username, is_admin, is_banned')
      .eq('id', userId)
      .maybeSingle();
    if (data) return data;
    if (i < delays.length) await new Promise(r => setTimeout(r, delays[i]));
  }
  return { username: 'Commander', is_admin: false, is_banned: false };
}

async function goToDashboard(user, profile) {
  if (profile.is_banned) { await sb.auth.signOut(); renderAuth(); return; }
  currentPage = { name: 'dashboard', user, profile, nation: null };
  const { renderDashboard } = await import('./pages/dashboard.js');
  renderDashboard(user, profile);
}

// Re-render current page in new language
async function reRenderCurrentPage() {
  const { name, user, profile, nation } = currentPage;
  if (name === 'auth') { renderAuth(); return; }
  if (name === 'dashboard') { const { renderDashboard } = await import('./pages/dashboard.js'); renderDashboard(user, profile); return; }
  if (name === 'military')  { const { renderMilitary }  = await import('./pages/military.js');  renderMilitary(user, profile, nation); return; }
  if (name === 'economy')   { const { renderEconomy }   = await import('./pages/economy.js');   renderEconomy(user, profile, nation); return; }
  if (name === 'attacks')   { const { renderAttacks }   = await import('./pages/attacks.js');   renderAttacks(user, profile, nation); return; }
  if (name === 'alliances') { const { renderAlliances } = await import('./pages/alliances.js'); renderAlliances(user, profile, nation); return; }
  if (name === 'intelligence') { const { renderIntelligence } = await import('./pages/intelligence.js'); renderIntelligence(user, profile, nation); return; }
  if (name === 'rankings')  { const { renderRankings }  = await import('./pages/rankings.js');  renderRankings(user, profile, nation); return; }
  if (name === 'hof')       { const { renderHallOfFame } = await import('./pages/hall-of-fame.js'); renderHallOfFame(user, profile); return; }
}

async function boot() {
  applyDir(i18n.language);

  // On language change: apply dir + re-render the whole current page
  i18n.on('languageChanged', (lang) => {
    applyDir(lang);
    reRenderCurrentPage();
  });

  // Track navigation so we know what to re-render on lang change
  window.addEventListener('langchange', () => {
    // i18n.on('languageChanged') already handles re-render
  });

  const { data: { session } } = await sb.auth.getSession();
  if (session) {
    const profile = await fetchProfile(session.user.id);
    await goToDashboard(session.user, profile);
  } else {
    renderAuth();
  }

  let booted = !!session;
  sb.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session) {
      if (booted) return;
      booted = true;
      const profile = await fetchProfile(session.user.id);
      await goToDashboard(session.user, profile);
    }
    if (event === 'SIGNED_OUT') {
      booted = false;
      currentPage = { name: 'auth', user: null, profile: null, nation: null };
      renderAuth();
    }
  });
}

// Export so nav.js can update current page tracking
// Expose for nav.js to call without circular import
window.__setCurrentPage = function(name, user, profile, nation) {
  currentPage = { name, user, profile, nation };
};

boot();
