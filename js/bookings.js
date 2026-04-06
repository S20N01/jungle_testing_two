const Bookings = {
    async getAll() {
        const user = await Auth.getUser();
        if (!user) return [];
        const { data, error } = await supabase.from('bookings').select('*').eq('user_id', user.id).order('booked_at', { ascending: false });
        if (error) return [];
        return data || [];
    },
    async add(plan) {
        const user = await Auth.getUser();
        if (!user) return { success: false, error: 'Not authenticated' };
        const { error } = await supabase.from('bookings').insert({
            user_id: user.id, plan_name: plan.name, plan_price: plan.price, destination: plan.destination, duration: plan.duration, type: plan.type
        });
        return { success: !error, error: error?.message };
    },
    async cancel(id) {
        const user = await Auth.getUser();
        if (!user) return { success: false, error: 'Not authenticated' };
        const { error } = await supabase.from('bookings').delete().eq('id', id).eq('user_id', user.id);
        return { success: !error, error: error?.message };
    }
};

async function bookPlan(plan) {
    if (!await Auth.isLoggedIn()) {
        window.location.href = `auth.html?redirect=${encodeURIComponent(window.location.href)}`;
        return;
    }
    showToast('Processing booking...');
    const res = await Bookings.add(plan);
    showToast(res.success ? 'Journey booked — see you there.' : `Booking failed: ${res.error}`);
}

async function renderBookings() {
    const listEl = document.getElementById('bookings-list');
    const emptyEl = document.getElementById('empty-state');
    if (!listEl) return;

    listEl.innerHTML = '<div style="text-align:center;padding:40px;color:rgba(255,255,255,0.5);">Loading journeys...</div>';
    const bookings = await Bookings.getAll();
    listEl.innerHTML = '';

    if (!bookings.length) {
        if (emptyEl) emptyEl.style.display = 'block';
        return;
    }
    if (emptyEl) emptyEl.style.display = 'none';

    // Fixed: Removed space in arrow function
    bookings.forEach(b => {
        const item = document.createElement('div');
        item.className = 'booking-item';
        item.innerHTML = `
            <div class="booking-left">
                <div class="booking-name">${b.plan_name}</div>
                <div class="booking-meta">${b.destination} · ${b.duration} · ${new Date(b.booked_at).toLocaleDateString()}</div>
            </div>
            <div class="booking-right">
                <span class="booking-price">${b.plan_price}</span>
                <button class="cancel-btn" data-id="${b.id}">Cancel</button>
            </div>`;
        listEl.appendChild(item);
    });

    document.querySelectorAll('.cancel-btn').forEach(btn => {
        btn.addEventListener('click', async e => {
            if (!confirm('Cancel this journey?')) return;
            const res = await Bookings.cancel(e.target.dataset.id);
            showToast(res.success ? 'Journey cancelled. Refund processed.' : `Cancellation failed: ${res.error}`);
            if (res.success) renderBookings();
        });
    });
}

if (document.getElementById('bookings-list')) {
    document.addEventListener('DOMContentLoaded', renderBookings);
}