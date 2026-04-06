// js/config.js — Safe Initialization Pattern
(function initClient() {
    // 1. Verify SDK is loaded
    if (!window.supabase) {
        console.error('❌ Supabase SDK failed to load. Check your internet or ad blocker.');
        return;
    }

    // 2. Verify createClient exists
    if (typeof window.supabase.createClient !== 'function') {
        console.error('❌ Supabase SDK is corrupted or version mismatch.');
        return;
    }

    // 3. Define Credentials
    const SUPABASE_URL = 'https://zxorxhobomqpopgvpkqe.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4b3J4aG9ib21xcG9wZ3Zwa3FlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0NzI2NTYsImV4cCI6MjA5MTA0ODY1Nn0.rtlaZVh14A0l8zED6dXoxCy0EbiInyuop28LWYw_CbY';

    // 4. Create and Expose Client Globally
    // We attach to window explicitly to ensure auth.js can see it
    window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // 5. Final Verification
    if (!window.supabase.auth) {
        console.error('❌ Client created but .auth is missing. Check CDN link.');
    } else {
        console.log('✅ Supabase client initialized successfully.');
    }
})();