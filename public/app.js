document.addEventListener('DOMContentLoaded', () => {
    // 1. Navigation & Mobile Drawer
    const navbar = document.getElementById('navbar');
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 30) navbar.classList.add('scrolled');
        else navbar.classList.remove('scrolled');
    });

    menuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        navLinks.classList.toggle('active');
        menuToggle.classList.toggle('open');
    });

    // Close menu when clicking outside or on links
    document.addEventListener('click', (e) => {
        if (!navLinks.contains(e.target) && !menuToggle.contains(e.target)) {
            navLinks.classList.remove('active');
            menuToggle.classList.remove('open');
        }
    });

    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            menuToggle.classList.remove('open');
        });
    });

    // 2. Futuristic Particles System
    const particleContainer = document.getElementById('particles');
    if (particleContainer) {
        const createParticle = () => {
            const dot = document.createElement('div');
            dot.className = 'node-particle';
            const size = Math.random() * 3 + 1;
            dot.style.width = `${size}px`;
            dot.style.height = `${size}px`;
            dot.style.left = `${Math.random() * 100}%`;
            dot.style.top = `${Math.random() * 100}%`;
            dot.style.opacity = Math.random() * 0.5 + 0.1;
            
            // Random movement duration
            const duration = Math.random() * 20 + 10;
            dot.style.animation = `floatParticle ${duration}s infinite linear`;
            
            particleContainer.appendChild(dot);
            
            // Cleanup after long duration
            setTimeout(() => dot.remove(), duration * 1000);
        };

        // Initial burst
        for (let i = 0; i < 30; i++) createParticle();
        
        // Continuous generation
        setInterval(createParticle, 2000);
    }

    // 3. Scroll Reveal Engine
    const revealElements = document.querySelectorAll('.reveal');
    const revealOptions = { threshold: 0.15, rootMargin: "0px 0px -50px 0px" };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('reveal-active');
            }
        });
    }, revealOptions);

    revealElements.forEach(el => observer.observe(el));

    // 4. Advanced Gallery Categorization
    const tabBtns = document.querySelectorAll('.nav-pill');
    const galleryItems = document.querySelectorAll('.gal-card');

    if (tabBtns.length > 0) {
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const category = btn.getAttribute('data-category');
                galleryItems.forEach(item => {
                    item.style.transition = '0.4s cubic-bezier(0.4, 0, 0.2, 1)';
                    if (category === 'all' || item.getAttribute('data-category') === category) {
                        item.style.display = 'block';
                        setTimeout(() => {
                            item.style.opacity = '1';
                            item.style.transform = 'scale(1)';
                        }, 10);
                    } else {
                        item.style.opacity = '0';
                        item.style.transform = 'scale(0.95)';
                        setTimeout(() => { item.style.display = 'none'; }, 400);
                    }
                });
            });
        });
    }

    // 5. High-End Lightbox
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const closeBtn = document.querySelector('.close-lightbox');

    if (lightbox && closeBtn && lightboxImg) {
        galleryItems.forEach(item => {
            item.addEventListener('click', () => {
                const img = item.querySelector('img');
                if (!img) return;
                lightboxImg.style.transform = 'scale(0.8)';
                lightboxImg.src = img.src;
                lightbox.style.display = 'flex';
                document.body.style.overflow = 'hidden';
                setTimeout(() => {
                    lightboxImg.style.transition = '0.5s cubic-bezier(0.16, 1, 0.3, 1)';
                    lightboxImg.style.transform = 'scale(1)';
                }, 50);
            });
        });

        const closeLightbox = () => {
            lightboxImg.style.transform = 'scale(0.8)';
            setTimeout(() => {
                lightbox.style.display = 'none';
                document.body.style.overflow = 'auto';
            }, 300);
        };

        closeBtn.addEventListener('click', closeLightbox);
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) closeLightbox();
        });
    }

    // 6. Real-time Leaderboard Logic
    const leaderboardBody = document.getElementById('leaderboardBody');
    const fetchLeaderboard = async () => {
        if (!leaderboardBody) return;
        try {
            const res = await fetch('/api/leaderboard');
            const data = await res.json();
            if (data.success) {
                leaderboardBody.innerHTML = data.data.slice(0, 5).map((m, idx) => `
                    <tr class="reveal" style="transition-delay: ${idx * 0.1}s">
                        <td class="rank-cell">0${idx + 1}</td>
                        <td class="name-cell">${m.Member_Name}</td>
                        <td class="rating-cell"><span>DRATH_${m.CP_Rating}</span></td>
                    </tr>
                `).join('');
                // Observe new elements
                document.querySelectorAll('#leaderboardBody .reveal').forEach(el => observer.observe(el));
            }
        } catch (e) { console.error("Leaderboard Sync Failure", e); }
    };
    fetchLeaderboard();

    // 7. Membership ID Checker — Matches deployed site
    const searchForm = document.getElementById('searchForm');
    const emailInput = document.getElementById('emailInput');
    const searchBtn = document.getElementById('searchBtn');
    const btnText = document.getElementById('btnText');
    const btnSpinner = document.getElementById('btnSpinner');
    const errorMsg = document.getElementById('errorMsg');
    const checkerSearch = document.getElementById('checkerSearch');
    const resultCard = document.getElementById('resultCard');
    const resetBtn = document.getElementById('resetBtn');

    // Result DOM Elements
    const resName = document.getElementById('resName');
    const resMemberId = document.getElementById('resMemberId');
    const resBatch = document.getElementById('resBatch');
    const resRoll = document.getElementById('resRoll');
    const resRegistration = document.getElementById('resRegistration');
    const resDept = document.getElementById('resDept');
    const resPhone = document.getElementById('resPhone');
    const resJoined = document.getElementById('resJoined');

    const setLoading = (isLoading) => {
        if (!searchBtn || !btnText || !btnSpinner) return;
        if (isLoading) {
            searchBtn.disabled = true;
            btnText.style.display = 'none';
            btnSpinner.style.display = 'block';
            if (errorMsg) errorMsg.classList.remove('visible');
        } else {
            searchBtn.disabled = false;
            btnText.style.display = 'block';
            btnSpinner.style.display = 'none';
        }
    };

    const showError = (msg) => {
        if (!errorMsg) return;
        errorMsg.textContent = msg;
        errorMsg.classList.add('visible');
    };

    const displayResult = (data) => {
        if (resName) resName.textContent = data.Member_Name || 'N/A';
        if (resMemberId) resMemberId.textContent = data.Member_ID || 'Pending/Not Found';
        if (resBatch) resBatch.textContent = data.Batch || 'N/A';
        if (resRoll) resRoll.textContent = data.Roll_No || 'N/A';
        if (resRegistration) resRegistration.textContent = data.Registration || 'N/A';
        if (resDept) resDept.textContent = data.Department || 'N/A';
        if (resPhone) resPhone.textContent = data.Mobile_No || 'N/A';
        if (resJoined) resJoined.textContent = data.Joined || 'N/A';

        // Animate: hide search, show result
        if (checkerSearch) checkerSearch.classList.add('hidden');
        if (resultCard) {
            resultCard.classList.remove('hidden');
            resultCard.style.animation = 'none';
            resultCard.offsetHeight; /* trigger reflow */
            resultCard.style.animation = null;
        }
    };

    if (searchForm) {
        searchForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = emailInput?.value.trim();
            if (!email) return;

            setLoading(true);

            try {
                const res = await fetch(`/api/member?email=${encodeURIComponent(email)}`);
                const json = await res.json();

                if (json.success && json.data) {
                    displayResult(json.data);
                } else {
                    showError(json.error || "No member found with that email.");
                }
            } catch (err) {
                showError("Network error. Please try again.");
                console.error("API Error", err);
            } finally {
                setLoading(false);
            }
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (emailInput) emailInput.value = '';
            if (resultCard) resultCard.classList.add('hidden');
            if (checkerSearch) checkerSearch.classList.remove('hidden');
            if (emailInput) emailInput.focus();
        });
    }
});
