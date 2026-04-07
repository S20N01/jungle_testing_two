document.addEventListener('DOMContentLoaded', () => {

  // ===== LOADER CONTROL =====
 const loader = document.getElementById('wander-loader');
 if (loader) {
   const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
   const displayTime = reducedMotion ? 50 : 2000; // 50ms bypass for accessibility
  
   setTimeout(() => {
     loader.classList.add('hide');
     // Remove from DOM after transition completes to free memory
     setTimeout(() => { if (loader.parentNode) loader.remove(); }, 650);
   }, displayTime);
 }

  // ===== TOAST UTILITY =====
  window.showToast = (msg) => {
    const existing = document.querySelector('.wander-toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = 'wander-toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('show')));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 450);
    }, 3400);
  };

  // ===== CUSTOM CURSOR & PARALLAX =====
  const cursor = document.getElementById('leaf-cursor');
  let mx = 0, my = 0, raf = null;
  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    if (!raf) raf = requestAnimationFrame(updateFrame);
  });

  function updateFrame() {
    if (cursor) { cursor.style.left = mx + 'px'; cursor.style.top = my + 'px'; }
    const bg = document.querySelector('.hero-bg');
    if (bg) {
      bg.style.transform = `translate(${(mx / window.innerWidth - 0.5) * 20}px, ${(my / window.innerHeight - 0.5) * 20}px) scale(1.07)`;
    }
    raf = null;
  }

  document.addEventListener('mousedown', () => cursor?.classList.add('clicking'));
  document.addEventListener('mouseup', () => cursor?.classList.remove('clicking'));
  document.addEventListener('mouseleave', () => cursor && (cursor.style.opacity = '0'));
  document.addEventListener('mouseenter', () => cursor && (cursor.style.opacity = '1'));

  // ===== SCROLL & NAV =====
  const nav = document.querySelector('.nav-container');
  let scrollRaf = null;
  window.addEventListener('scroll', () => {
    if (!scrollRaf) scrollRaf = requestAnimationFrame(handleScroll);
  }, { passive: true });

  function handleScroll() {
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 60);
    document.querySelectorAll('.section-title-shift').forEach(el => {
      const r = el.getBoundingClientRect();
      const p = (window.innerHeight - r.top) / (window.innerHeight + r.height);
      if (p > 0 && p < 1) el.style.transform = `translateX(${(p - 0.5) * -55}px)`;
    });
    scrollRaf = null;
  }

  // ===== SCROLL REVEAL =====
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('revealed'); observer.unobserve(e.target); }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.scroll-reveal, .timeline-item').forEach(el => {
    if (el.getBoundingClientRect().top < window.innerHeight * 0.95) {
      el.classList.add('revealed');
    } else {
      observer.observe(el);
    }
  });

  // ===== FAQ ACCORDION =====
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const active = item.classList.contains('active');
      
      document.querySelectorAll('.faq-item').forEach(i => {
        i.classList.remove('active');
        i.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
      });

      if (!active) {
        item.classList.add('active');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // ===== LIGHTBOX =====
  document.addEventListener('click', e => {
    const wrap = e.target.closest('.plan-img-wrap');
    if (wrap) {
      const img = wrap.querySelector('.plan-img');
      if (img) openLightbox(img.src);
    }
  });

  function openLightbox(src) {
    let lb = document.getElementById('wander-lightbox');
    if (!lb) {
      lb = document.createElement('div');
      lb.id = 'wander-lightbox';
      lb.className = 'lightbox';
      lb.innerHTML = `<button class="lightbox-close" aria-label="Close">✕</button><img class="lightbox-img" src="${src}">`;
      document.body.appendChild(lb);
    } else {
      lb.querySelector('.lightbox-img').src = src;
    }
    requestAnimationFrame(() => lb.classList.add('active'));
  }

  document.addEventListener('click', e => {
    const lb = document.getElementById('wander-lightbox');
    if (lb && (e.target.closest('.lightbox-close') || e.target === lb)) {
      lb.classList.remove('active');
    }
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      const lb = document.getElementById('wander-lightbox');
      if (lb) lb.classList.remove('active');
    }
  });

  // ===== INQUIRY FORM =====
  const inquiryForm = document.getElementById('journey-inquiry-form');
  if (inquiryForm) {
    inquiryForm.addEventListener('submit', async e => {
      e.preventDefault();
      const btn = inquiryForm.querySelector('.inquiry-submit');
      const name = document.getElementById('inq-name').value.trim();
      const email = document.getElementById('inq-email').value.trim();
      const plan = document.getElementById('inq-plan').value;
      const date = document.getElementById('inq-date').value;

      if (!name || !email || !plan || !date) {
        showToast('Please complete all fields.'); return;
      }

      btn.classList.add('loading'); btn.textContent = 'Submitting...';
      const { error } = await supabase.from('inquiries').insert({
        name, email, plan_name: plan, preferred_date: date
      });

      btn.classList.remove('loading'); btn.textContent = 'Submit Request';
      showToast(error ? `Submission failed: ${error.message}` : 'Request received. We will contact you within 24 hours.');
      if (!error) inquiryForm.reset();
    });
  }

    // ===== PLAN BOOKING DELEGATION (For 4-Card Grid) =====
  // Binds .book-btn clicks to the global bookPlan() function from bookings.js
  document.addEventListener('click', e => {
    const btn = e.target.closest('.book-btn');
    if (!btn) return;
    
    try {
      const plan = JSON.parse(btn.dataset.plan);
      // Verify bookPlan exists globally (exported from bookings.js)
      if (typeof window.bookPlan === 'function') {
        window.bookPlan(plan);
      } else {
        console.error('bookPlan function not found. Ensure bookings.js loads before main.js.');
      }
    } catch (err) {
      console.error('Invalid plan data on button:', btn.dataset.plan, err);
      if (typeof window.showToast === 'function') {
        window.showToast('Unable to process this journey. Please try again.');
      }
    }
  });
});