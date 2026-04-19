/* =========================================
   VIVA.JS — EC Viva Page Interactivity
   DIU CPC // 2026
   ========================================= */

/* ── 1. NAVBAR SCROLL EFFECT ─────────────── */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
});

/* ── 2. MOBILE MENU TOGGLE ───────────────── */
const menuToggle = document.getElementById('menuToggle');
const navLinks   = document.getElementById('navLinks');
menuToggle?.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    menuToggle.classList.toggle('open');
});
navLinks?.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        menuToggle.classList.remove('open');
    });
});

/* ── 3. COUNTDOWN TIMER ──────────────────── */
(function initCountdown() {
    // Viva starts: April 18, 2026 09:00 AM Bangladesh time (UTC+6)
    const targetDate = new Date('2026-04-18T09:00:00+06:00').getTime();

    const daysEl    = document.getElementById('days');
    const hoursEl   = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');

    function pad(n) { return String(n).padStart(2, '0'); }

    function updateCountdown() {
        const now  = Date.now();
        const diff = targetDate - now;

        if (diff <= 0) {
            daysEl.textContent    = '00';
            hoursEl.textContent   = '00';
            minutesEl.textContent = '00';
            secondsEl.textContent = '00';
            return;
        }

        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);

        daysEl.textContent    = pad(d);
        hoursEl.textContent   = pad(h);
        minutesEl.textContent = pad(m);
        secondsEl.textContent = pad(s);
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);
})();

/* ── 4. SCROLL REVEAL ANIMATION ─────────── */
(function initReveal() {
    const revealEls = document.querySelectorAll('.reveal');
    const observer  = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('reveal-active');
                // Animate criteria bars when visible
                const fill = entry.target.querySelector('.crit-fill');
                if (fill) {
                    const target = fill.style.width;
                    fill.style.width = '0%';
                    requestAnimationFrame(() => {
                        setTimeout(() => { fill.style.width = target; }, 100);
                    });
                }
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    revealEls.forEach(el => observer.observe(el));
})();

/* ── 5. FAQ ACCORDION ────────────────────── */
function toggleFAQ(id) {
    const item    = document.getElementById(id);
    const isOpen  = item.classList.contains('open');

    // Close all open FAQs
    document.querySelectorAll('.faq-item.open').forEach(el => {
        el.classList.remove('open');
    });

    // Open the clicked one if it was closed
    if (!isOpen) {
        item.classList.add('open');
    }
}

/* ── 6. PARTICLE SYSTEM ──────────────────── */
(function initParticles() {
    const container = document.getElementById('particles');
    if (!container) return;

    const COUNT = 55;
    const particles = [];

    for (let i = 0; i < COUNT; i++) {
        const dot = document.createElement('div');
        dot.style.cssText = `
            position: absolute;
            border-radius: 50%;
            pointer-events: none;
            opacity: 0;
            animation: particleFade ${4 + Math.random() * 6}s ease-in-out infinite;
            animation-delay: ${Math.random() * 8}s;
        `;

        // Varied sizes and colors
        const size   = Math.random() < 0.7 ? Math.random() * 2 + 1 : Math.random() * 4 + 2;
        const colors = ['rgba(0,242,255,', 'rgba(168,85,247,', 'rgba(245,158,11,'];
        const color  = colors[Math.floor(Math.random() * colors.length)];
        const opacity = 0.3 + Math.random() * 0.5;

        dot.style.width           = `${size}px`;
        dot.style.height          = `${size}px`;
        dot.style.background      = `${color}${opacity})`;
        dot.style.boxShadow       = `0 0 ${size * 3}px ${color}0.6)`;
        dot.style.left            = `${Math.random() * 100}%`;
        dot.style.top             = `${Math.random() * 100}%`;

        container.appendChild(dot);
        particles.push({
            el: dot,
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
        });
    }

    // Inject keyframe for fade
    const style = document.createElement('style');
    style.textContent = `
        @keyframes particleFade {
            0%, 100% { opacity: 0; transform: scale(0.5); }
            50%       { opacity: 1; transform: scale(1); }
        }
    `;
    document.head.appendChild(style);

    function animateParticles() {
        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0 || p.x > window.innerWidth)  p.vx *= -1;
            if (p.y < 0 || p.y > window.innerHeight)  p.vy *= -1;
            p.el.style.left = `${p.x}px`;
            p.el.style.top  = `${p.y}px`;
        });
        requestAnimationFrame(animateParticles);
    }
    animateParticles();
})();

/* ── 7. SMOOTH SECTION TRANSITIONS ──────── */
(function addActiveNavHighlight() {
    const sections = document.querySelectorAll('section[id]');
    const navAnchors = document.querySelectorAll('.nav-links a');

    const obs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                navAnchors.forEach(a => a.classList.remove('active-link'));
                const active = document.querySelector(`.nav-links a[href="#${entry.target.id}"]`);
                if (active) active.classList.add('active-link');
            }
        });
    }, { threshold: 0.4 });

    sections.forEach(sec => obs.observe(sec));
})();

/* ── 8. ROLE CARD MAGNETIC HOVER ─────────── */
document.querySelectorAll('.role-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect  = card.getBoundingClientRect();
        const x     = e.clientX - rect.left - rect.width  / 2;
        const y     = e.clientY - rect.top  - rect.height / 2;
        const rotX  = (-y / rect.height * 10).toFixed(2);
        const rotY  = ( x / rect.width  * 10).toFixed(2);
        card.style.transform = `translateY(-10px) perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.02)`;
    });
    card.addEventListener('mouseleave', () => {
        card.style.transform = '';
    });
});

/* ── 9. SCHEDULE SLOT CLICK RIPPLE ──────── */
document.querySelectorAll('.sched-slot').forEach(slot => {
    slot.addEventListener('click', (e) => {
        const ripple = document.createElement('span');
        const rect   = slot.getBoundingClientRect();
        ripple.style.cssText = `
            position: absolute; border-radius: 50%;
            width: 4px; height: 4px;
            background: rgba(0,242,255,0.35);
            transform: scale(0);
            animation: rippleEffect 0.6s linear;
            left: ${e.clientX - rect.left}px;
            top:  ${e.clientY - rect.top}px;
            pointer-events: none;
        `;
        slot.style.position = 'relative';
        slot.style.overflow = 'hidden';
        slot.appendChild(ripple);
        setTimeout(() => ripple.remove(), 700);
    });
});

// Inject ripple keyframe
const rippleStyle = document.createElement('style');
rippleStyle.textContent = `
    @keyframes rippleEffect {
        to { transform: scale(80); opacity: 0; }
    }
`;
document.head.appendChild(rippleStyle);

/* ── 10. ANIMATED NUMBER COUNTER (Stats) ── */
(function animateCounters() {
    // If any count-val elements need numeric animation in future
    document.querySelectorAll('[data-count]').forEach(el => {
        const target = parseInt(el.dataset.count, 10);
        let current = 0;
        const step  = Math.ceil(target / 60);
        const timer = setInterval(() => {
            current = Math.min(current + step, target);
            el.textContent = current;
            if (current >= target) clearInterval(timer);
        }, 25);
    });
})();

/* ── 11. PROCESS STEP HOVER GLOW ─────────── */
document.querySelectorAll('.process-step').forEach((step, i) => {
    step.addEventListener('mouseenter', () => {
        step.querySelector('.step-icon').style.boxShadow = '0 0 30px rgba(0,242,255,0.5)';
    });
    step.addEventListener('mouseleave', () => {
        step.querySelector('.step-icon').style.boxShadow = '';
    });
});

console.log('%c DIU CPC // EC VIVA 2026 ', 'background:#00f2ff; color:#000; font-weight:bold; font-family:monospace; padding:4px 12px; border-radius:4px;');
console.log('%c System Initialized Successfully ', 'color:#a855f7; font-family:monospace;');
