// =====================================================================
// MEMBER ACCOUNTS — Supabase Auth
// • Register → Supabase emails a confirmation link; the account only
//   becomes active once the member clicks it (verifies the email).
// • Forgot password → Supabase emails a secure reset link; the new
//   password can only be set from that link.
// • Settings → change password (re-checks the current one) and change
//   email (confirmed by link sent to the new address).
// The rest of the community UI (chat, tickets) still reads the local
// session that main.js expects; we mirror the Supabase user into it.
// =====================================================================
(function () {
  const $ = id => document.getElementById(id);
  const cfg = window.HYU_SUPABASE || {};
  const configured = !!(cfg.url && cfg.anonKey && window.supabase && window.supabase.createClient);
  const redirectTo = location.origin + location.pathname;

  const showMsg = (el, msg) => { if (el) { el.textContent = msg; el.style.display = 'block'; } };
  const hideMsg = (...els) => els.forEach(el => el && (el.style.display = 'none'));

  function openAuthPanel(id) {
    document.querySelectorAll('.community-auth-tab').forEach(t => t.classList.toggle('active', 'auth-' + t.dataset.auth === id));
    document.querySelectorAll('.community-auth-panel').forEach(p => p.classList.toggle('active', p.id === id));
  }

  function showAuthScreen() {
    if (!$('community')?.classList.contains('active')) showPage('community');
    $('community-hero') && ($('community-hero').style.display = '');
    $('community-auth') && ($('community-auth').style.display = '');
    $('community-chat') && ($('community-chat').style.display = 'none');
    setTimeout(() => document.querySelector('.community-auth-box')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 450);
  }

  function toast(msg) {
    const t = document.createElement('div');
    t.className = 'auth-toast';
    t.setAttribute('role', 'status');
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, 5000);
  }

  async function withBusy(btn, label, fn) {
    const original = btn.textContent;
    btn.disabled = true;
    btn.textContent = label;
    try { return await fn(); } finally { btn.disabled = false; btn.textContent = original; }
  }

  // ---------------------------------------------------------------
  // Not configured yet: keep the forms visible but disabled
  // ---------------------------------------------------------------
  if (!configured) {
    const notice = $('auth-notice');
    if (notice) {
      notice.hidden = false;
      notice.textContent = 'Member accounts are being connected. Sign in and registration will open very soon.';
    }
    ['signin-btn', 'register-btn', 'fp-submit-btn'].forEach(id => { const b = $(id); if (b) b.disabled = true; });
    localStorage.removeItem('hyu_session');
    return;
  }

  // Read what the email link brought back BEFORE Supabase tidies the URL
  const params = new URLSearchParams(location.hash.replace(/^#/, '') + '&' + location.search.replace(/^\?/, ''));
  const linkType = params.get('type');                    // signup | recovery | email_change | magiclink
  const linkError = params.get('error_description');

  const sb = window.supabase.createClient(cfg.url, cfg.anonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'implicit' },
  });
  window.hyuSupabase = sb;

  // Mirror the Supabase user into the local session main.js uses
  function mirrorUser(user) {
    const m = user.user_metadata || {};
    const username = (m.username || user.email.split('@')[0]).toLowerCase();
    const isAdmin = (user.app_metadata || {}).role === 'admin';
    const users = getUsers();
    let u = users.find(x => x.supabaseId === user.id) || users.find(x => x.username === username);
    if (!u) { u = { username, joinedAt: Date.parse(user.created_at) || Date.now() }; users.push(u); }
    Object.assign(u, {
      username,
      supabaseId: user.id,
      email: user.email,
      firstName: m.first_name || u.firstName || username,
      lastName: m.last_name || u.lastName || '',
      phone: u.phone || m.phone || '',
      isAdmin,
      mailingList: !!m.mailing_list,
    });
    communityStore('users', users);
    communityStore('session', { username, isAdmin, firstName: u.firstName });
  }

  function enterCommunity() {
    if (!$('community')?.classList.contains('active')) showPage('community');
    communityShowChat();
  }

  function clearLocalSession() {
    localStorage.removeItem('hyu_session');
  }

  // ---------------------------------------------------------------
  // "Check your email" screen (after register / reset request)
  // ---------------------------------------------------------------
  let pending = { kind: '', email: '' };
  function showCheckEmail(kind, email) {
    pending = { kind, email };
    $('check-email-title').textContent = kind === 'signup' ? 'Confirm Your Email' : 'Check Your Email';
    $('check-email-text').textContent = kind === 'signup'
      ? `We've sent a confirmation link to ${email}. Click it to verify your email and activate your account — you'll be signed straight in. Can't see it? Check your spam folder.`
      : `If an account exists for ${email}, we've sent a secure link to reset your password. It expires in 1 hour.`;
    hideMsg($('check-email-status'));
    openAuthPanel('auth-check-email');
  }

  async function resend(kind, email, btn) {
    const { error } = kind === 'signup'
      ? await sb.auth.resend({ type: 'signup', email, options: { emailRedirectTo: redirectTo } })
      : await sb.auth.resetPasswordForEmail(email, { redirectTo });
    if (btn) { btn.disabled = true; setTimeout(() => (btn.disabled = false), 60000); }
    return error;
  }

  $('check-email-resend')?.addEventListener('click', async e => {
    const btn = e.currentTarget;
    const error = await withBusy(btn, 'Sending…', () => resend(pending.kind, pending.email));
    btn.disabled = true; setTimeout(() => (btn.disabled = false), 60000);
    showMsg($('check-email-status'), error ? `Couldn't resend: ${error.message}` : 'Sent again — it can take a minute to arrive.');
  });
  $('check-email-back')?.addEventListener('click', () => openAuthPanel('auth-signin'));

  // ---------------------------------------------------------------
  // Register → confirmation email
  // ---------------------------------------------------------------
  $('register-btn')?.addEventListener('click', async e => {
    const btn = e.currentTarget;
    const first = $('reg-first').value.trim();
    const last = $('reg-last').value.trim();
    const username = $('reg-username').value.trim().toLowerCase().replace(/\s+/g, '_');
    const email = $('reg-email').value.trim().toLowerCase();
    const phone = $('reg-phone').value.trim();
    const password = $('reg-password').value;
    const mailingList = !!$('reg-mailing')?.checked;
    const errEl = $('register-error');
    hideMsg(errEl);

    if (!first || !username || !email || !password) return showMsg(errEl, 'Please fill in all required fields.');
    if (!/^[a-z0-9_]{3,20}$/.test(username)) return showMsg(errEl, 'Usernames are 3–20 characters: letters, numbers and underscores.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showMsg(errEl, 'Please enter a valid email address.');
    if (password.length < 8) return showMsg(errEl, 'Password must be at least 8 characters.');

    const { data, error } = await withBusy(btn, 'Creating account…', () => sb.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: { username, first_name: first, last_name: last, phone, mailing_list: mailingList },
      },
    }));

    if (error) {
      if (/registered|exists/i.test(error.message)) return showMsg(errEl, 'An account with that email already exists. Try signing in, or reset your password.');
      if (/database error/i.test(error.message)) return showMsg(errEl, 'That username is already taken — please choose another.');
      return showMsg(errEl, error.message);
    }

    ['reg-first', 'reg-last', 'reg-username', 'reg-email', 'reg-phone', 'reg-password'].forEach(id => ($(id).value = ''));
    if ($('reg-mailing')) $('reg-mailing').checked = false;

    if (data.session) { mirrorUser(data.user); enterCommunity(); return; } // only if email confirmation is switched off
    showCheckEmail('signup', email);
  });

  // ---------------------------------------------------------------
  // Sign in (email + password; must have confirmed email)
  // ---------------------------------------------------------------
  $('signin-btn')?.addEventListener('click', async e => {
    const btn = e.currentTarget;
    const email = $('si-email').value.trim().toLowerCase();
    const password = $('si-password').value;
    const errEl = $('signin-error');
    const resendLink = $('resend-confirm-link');
    hideMsg(errEl);
    resendLink.hidden = true;
    if (!email || !password) return showMsg(errEl, 'Please enter your email and password.');

    const { data, error } = await withBusy(btn, 'Signing in…', () => sb.auth.signInWithPassword({ email, password }));
    if (error) {
      if (/not confirmed/i.test(error.message)) {
        showMsg(errEl, 'Please confirm your email first — click the link we sent when you registered.');
        resendLink.hidden = false;
        resendLink.dataset.email = email;
        return;
      }
      return showMsg(errEl, /invalid/i.test(error.message) ? 'Incorrect email or password.' : error.message);
    }
    $('si-password').value = '';
    mirrorUser(data.user);
    enterCommunity();
  });

  $('si-password')?.addEventListener('keydown', e => { if (e.key === 'Enter') $('signin-btn').click(); });

  $('resend-confirm-link')?.addEventListener('click', async e => {
    const email = e.currentTarget.dataset.email;
    if (!email) return;
    const error = await resend('signup', email);
    if (!error) showCheckEmail('signup', email);
    else showMsg($('signin-error'), `Couldn't resend: ${error.message}`);
  });

  // ---------------------------------------------------------------
  // Forgot password → reset link by email → set new password
  // ---------------------------------------------------------------
  $('fp-submit-btn')?.addEventListener('click', async e => {
    const btn = e.currentTarget;
    const email = $('fp-email').value.trim().toLowerCase();
    const errEl = $('forgot-error');
    hideMsg(errEl, $('forgot-success'));
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showMsg(errEl, 'Please enter the email you registered with.');
    const { error } = await withBusy(btn, 'Sending…', () => sb.auth.resetPasswordForEmail(email, { redirectTo }));
    if (error) return showMsg(errEl, error.message);
    showCheckEmail('reset', email);
  });

  let recovering = false;
  $('np-save-btn')?.addEventListener('click', async e => {
    const btn = e.currentTarget;
    const pw = $('np-password').value;
    const confirm = $('np-confirm').value;
    const errEl = $('newpw-error');
    hideMsg(errEl);
    if (pw.length < 8) return showMsg(errEl, 'Password must be at least 8 characters.');
    if (pw !== confirm) return showMsg(errEl, 'Passwords do not match.');
    const { data, error } = await withBusy(btn, 'Saving…', () => sb.auth.updateUser({ password: pw }));
    if (error) return showMsg(errEl, /session/i.test(error.message)
      ? 'This reset link has expired. Please request a new one.'
      : error.message);
    recovering = false;
    $('np-password').value = ''; $('np-confirm').value = '';
    mirrorUser(data.user);
    enterCommunity();
    toast('Password changed. You’re signed in.');
  });

  // ---------------------------------------------------------------
  // Settings: change password / change email
  // ---------------------------------------------------------------
  $('set-pw-save')?.addEventListener('click', async e => {
    const btn = e.currentTarget;
    const cur = $('set-cur-pw').value;
    const pw = $('set-new-pw').value;
    const confirm = $('set-confirm-pw').value;
    const errEl = $('set-pw-error');
    const okEl = $('set-pw-success');
    hideMsg(errEl, okEl);
    if (!cur || !pw || !confirm) return showMsg(errEl, 'Please fill in all password fields.');
    if (pw.length < 8) return showMsg(errEl, 'New password must be at least 8 characters.');
    if (pw !== confirm) return showMsg(errEl, 'New passwords do not match.');

    await withBusy(btn, 'Updating…', async () => {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return showMsg(errEl, 'Your session has expired. Please sign in again.');
      const check = await sb.auth.signInWithPassword({ email: user.email, password: cur });
      if (check.error) return showMsg(errEl, 'Current password is incorrect.');
      const { error } = await sb.auth.updateUser({ password: pw });
      if (error) return showMsg(errEl, error.message);
      ['set-cur-pw', 'set-new-pw', 'set-confirm-pw'].forEach(id => ($(id).value = ''));
      showMsg(okEl, '✓ Password updated.');
      setTimeout(() => hideMsg(okEl), 4000);
    });
  });

  // Runs after main.js has saved the local profile
  $('set-profile-save')?.addEventListener('click', async () => {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return;
    const email = $('set-email')?.value.trim().toLowerCase();
    const data = {
      first_name: $('set-first')?.value.trim(),
      last_name: $('set-last')?.value.trim(),
      phone: $('set-phone')?.value.trim(),
    };
    const changes = { data };
    const emailChanged = email && email !== user.email;
    if (emailChanged) changes.email = email;
    const { error } = await sb.auth.updateUser(changes, { emailRedirectTo: redirectTo });
    const okEl = $('set-profile-success');
    const errEl = $('set-profile-error');
    if (error) { hideMsg(okEl); return showMsg(errEl, error.message); }
    if (emailChanged) {
      // Keep the confirmed address locally until the change is confirmed
      const users = getUsers();
      const u = users.find(x => x.supabaseId === user.id);
      if (u) { u.email = user.email; communityStore('users', users); }
      $('set-email').value = user.email;
      showMsg(okEl, `✓ Profile saved. To change your email, click the confirmation link we've sent to ${email}.`);
    }
  });

  // ---------------------------------------------------------------
  // Sign out
  // ---------------------------------------------------------------
  $('signout-btn')?.addEventListener('click', () => { sb.auth.signOut(); });

  // ---------------------------------------------------------------
  // Auth events: email links land back here
  // ---------------------------------------------------------------
  sb.auth.onAuthStateChange((event, session) => {
    if (event === 'PASSWORD_RECOVERY') {
      recovering = true;
      clearLocalSession();
      showAuthScreen();
      openAuthPanel('auth-newpw');
      return;
    }
    if (event === 'SIGNED_IN' && session && !recovering && linkType && linkType !== 'recovery') {
      mirrorUser(session.user);
      setTimeout(() => {
        enterCommunity();
        toast(linkType === 'email_change' ? 'Email address updated and confirmed.' : 'Email confirmed — welcome to the Hyke It Up community!');
      }, 0);
    }
    if (event === 'USER_UPDATED' && session && !recovering) mirrorUser(session.user);
    if (event === 'SIGNED_OUT') clearLocalSession();
  });

  // Expired / invalid email links
  if (linkError) {
    history.replaceState(null, '', location.pathname);
    showAuthScreen();
    openAuthPanel(/recovery|reset/i.test(linkType || '') ? 'auth-forgot' : 'auth-signin');
    const notice = $('auth-notice');
    if (notice) {
      notice.hidden = false;
      notice.textContent = /expired/i.test(linkError)
        ? 'That email link has expired. Request a new one below.'
        : `That email link didn't work: ${linkError}`;
    }
  }

  // On load: only trust a local session if Supabase agrees
  sb.auth.getSession().then(({ data: { session } }) => {
    if (recovering) return;
    if (session) mirrorUser(session.user);
    else clearLocalSession();
  });
})();
