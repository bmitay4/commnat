import i18n, { applyDir, translateDOM } from './i18n.js';
import { sb } from './supabase.js';
import { renderAuth } from './pages/auth.js';

// Fetch profile with retries — RLS needs a moment after login
async function fetchProfile(userId) {
  const delays = [200, 500, 1000, 2000];
  for (let i = 0; i <= delays.length; i++) {
    const { data } = await sb
      .from('profiles')
      .select('username, is_admin, is_banned')
      .eq('id', userId)
      .maybeSingle(); // maybeSingle returns null instead of error when no row

    if (data) return data;
    if (i < delays.length) await new Promise(r => setTimeout(r, delays[i]));
  }
  // Fallback: return safe defaults so the app never crashes
  return { username: 'Commander', is_admin: false, is_banned: false };
}

async function goToDashboard(user, profile) {
  if (profile.is_banned) {
    await sb.auth.signOut();
    renderAuth();
    return;
  }
  const { renderDashboard } = await import('./pages/dashboard.js');
  renderDashboard(user, profile);
}

async function boot() {
  applyDir(i18n.language);

  i18n.on('languageChanged', (lang) => {
    applyDir(lang);
    translateDOM();
  });

  // Check existing session on page load
  const { data: { session } } = await sb.auth.getSession();

  if (session) {
    const profile = await fetchProfile(session.user.id);
    await goToDashboard(session.user, profile);
  } else {
    renderAuth();
  }

  // Listen for auth state changes (login / logout)
  // Use a flag to prevent double-firing (Supabase fires SIGNED_IN on page load too)
  let booted = !!session;
  sb.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session) {
      if (booted) return; // already handled above
      booted = true;
      const profile = await fetchProfile(session.user.id);
      await goToDashboard(session.user, profile);
    }
    if (event === 'SIGNED_OUT') {
      booted = false;
      renderAuth();
    }
  });
}

boot();
