// ===== GUARD: Ensure Supabase is loaded =====
if (typeof supabase === 'undefined') {
    console.error('Supabase SDK not loaded. Check js/config.js and script order.');
}

// ===== TOAST UTILITY =====
function showToast(message) {
    const existing = document.querySelector('.wander-toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = 'wander-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    requestAnimationFrame(() => {
        requestAnimationFrame(() => toast.classList.add('show'));
    });
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => { if (toast.parentNode) toast.remove(); }, 450);
    }, 3400);
}

// ===== SUPABASE AUTH LAYER =====
const Auth = {
  async signup(email, password) {
    // Fixed regex: escaped literal dot
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) return { success: false, error: 'Enter a valid email.' };
    // Supabase requires minimum 6 characters. Client must match backend.
    if (!password || password.length < 6) return { success: false, error: 'Password must be at least 6 characters.' };
    
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) return { success: false, error: error.message };
    return { success: true };
  },
  async signin(email, password) {
    if (!email || !password) return { success: false, error: 'Please enter email and password.' };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: 'Invalid email or password.' };
    return { success: true };
  },
  async signout() { await supabase.auth.signOut(); },
  async getUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },
  async isLoggedIn() { return !!(await this.getUser()); }
};

// ===== NAV STATE SYNC =====
async function updateNav() {
    const authBtn = document.getElementById('auth-btn');
    const bookingsLink = document.getElementById('bookings-link');
    const userLabel = document.getElementById('user-label');
    if (!authBtn) return;
    const user = await Auth.getUser();
    if (user) {
        if (userLabel) { userLabel.textContent = user.email; userLabel.style.display = 'inline-block'; }
        authBtn.textContent = 'Sign Out';
        authBtn.removeAttribute('href');
        authBtn.onclick = async (e) => { e.preventDefault(); await Auth.signout(); window.location.reload(); };
        if (bookingsLink) bookingsLink.style.display = 'inline-block';
    } else {
        if (userLabel) userLabel.style.display = 'none';
        authBtn.textContent = 'Sign In';
        authBtn.href = 'auth.html';
        authBtn.onclick = null;
        if (bookingsLink) bookingsLink.style.display = 'none';
    }
}

// ===== DOM READY =====
document.addEventListener('DOMContentLoaded', async () => {
    await updateNav();

    // Toggle to Sign Up
    document.getElementById('toggle-to-signup')?.addEventListener('click', e => {
        e.preventDefault();
        document.getElementById('signin-form').style.display = 'none';
        document.getElementById('signup-form').style.display = 'block';
        document.getElementById('toggle-signin-wrapper').style.display = 'none';
        document.getElementById('toggle-signup-wrapper').style.display = 'block';
    });

    // Toggle to Sign In
    document.getElementById('toggle-to-signin')?.addEventListener('click', e => {
        e.preventDefault();
        document.getElementById('signup-form').style.display = 'none';
        document.getElementById('signin-form').style.display = 'block';
        document.getElementById('toggle-signup-wrapper').style.display = 'none';
        document.getElementById('toggle-signin-wrapper').style.display = 'block';
    });

    // Sign In Form
    const signinForm = document.getElementById('signin-form');
    if (signinForm) signinForm.addEventListener('submit', async e => {
        e.preventDefault();
        const email = document.getElementById('signin-username').value.trim();
        const pass = document.getElementById('signin-password').value;
        const err = document.getElementById('signin-error');
        if (err) err.textContent = '';
        const res = await Auth.signin(email, pass);
        if (res.success) {
            const redir = new URLSearchParams(window.location.search).get('redirect');
            window.location.href = redir || 'index.html';
        } else if (err) err.textContent = res.error;
    });

    // Sign Up Form
    const signupForm = document.getElementById('signup-form');
    if (signupForm) signupForm.addEventListener('submit', async e => {
        e.preventDefault();
        const email = document.getElementById('signup-username').value.trim();
        const pass = document.getElementById('signup-password').value;
        const err = document.getElementById('signup-error');
        if (err) err.textContent = '';
        const res = await Auth.signup(email, pass);
        if (res.success) {
            showToast('Account created. Check email for verification.');
            setTimeout(() => {
                signupForm.style.display = 'none';
                signinForm.style.display = 'block';
                document.getElementById('toggle-signup-wrapper').style.display = 'none';
                document.getElementById('toggle-signin-wrapper').style.display = 'block';
            }, 2000);
        } else if (err) err.textContent = res.error;
    });
});