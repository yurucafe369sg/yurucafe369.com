document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;

    const navMenu = document.querySelector('.nav-menu');
    const menuToggle = document.querySelector('.menu-toggle');
    const navbar = document.querySelector('.navbar');
    const heroSection = document.querySelector('.hero');
    const bodyElement = document.body;

    const focusableSelectors = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';
    let lastFocusedBeforeMenu = null;
    let lastTouchY = null;
    let lastKnownScrollY = window.scrollY;

    // ファーストビューが完全に表示されているときだけヘッダー開閉を許可
    const isFirstViewFullyVisible = () => {
        const tolerance = 2; // ちょっとしたスクロールやサブピクセル用の余裕
        if (!heroSection) {
            return window.scrollY <= tolerance;
        }
        const rect = heroSection.getBoundingClientRect();
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
        const topAtOrigin = rect.top >= -tolerance && rect.top <= tolerance;
        if (!topAtOrigin) return false;
        if (rect.height <= viewportHeight + tolerance) {
            return rect.bottom <= viewportHeight + tolerance;
        }
        return true;
    };

    const getFocusableElements = (container) => {
        if (!container) return [];
        return [...container.querySelectorAll(focusableSelectors)].filter(el => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true');
    };

    const trapFocusInMenu = (event) => {
        if (event.key !== 'Tab' || !navMenu?.classList.contains('active')) return;
        const focusables = getFocusableElements(navMenu);
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    };

    const setMenuState = (isOpen) => {
        if (!navMenu || !menuToggle) return;
        navMenu.classList.toggle('active', isOpen);
        navMenu.setAttribute('aria-hidden', String(!isOpen));
        menuToggle.setAttribute('aria-expanded', String(isOpen));
        menuToggle.setAttribute('aria-label', isOpen ? 'メニューを閉じる' : 'メニューを開く');
        bodyElement.classList.toggle('nav-menu-open', isOpen);
        if (isOpen) {
            bodyElement.classList.remove('header-hidden');
            lastFocusedBeforeMenu = document.activeElement;
            const firstFocusable = getFocusableElements(navMenu)[0] || menuToggle;
            firstFocusable?.focus();
            document.addEventListener('keydown', trapFocusInMenu);
            addScrollIntentListeners();
        } else {
            document.removeEventListener('keydown', trapFocusInMenu);
            navMenu.classList.remove('active');
            if (lastFocusedBeforeMenu instanceof HTMLElement) {
                lastFocusedBeforeMenu.focus();
            } else {
                menuToggle.focus();
            }
            removeScrollIntentListeners();
        }
    };

    const handleScrollIntent = (event) => {
        if (!navMenu?.classList.contains('active')) return;
        if (event.type === 'wheel') {
            if (event.deltaY <= 0) return;
        } else if (event.type === 'touchmove') {
            const touch = event.touches[0];
            if (!touch) return;
            if (lastTouchY === null) {
                lastTouchY = touch.clientY;
                return;
            }
            const deltaY = lastTouchY - touch.clientY;
            lastTouchY = touch.clientY;
            if (deltaY <= 0) return;
        }
        setMenuState(false);
    };

    const handleTouchStartIntent = (event) => {
        const touch = event.touches[0];
        lastTouchY = touch?.clientY ?? null;
    };

    const addScrollIntentListeners = () => {
        window.addEventListener('wheel', handleScrollIntent, { passive: true });
        window.addEventListener('touchmove', handleScrollIntent, { passive: true });
        window.addEventListener('touchstart', handleTouchStartIntent, { passive: true });
    };

    const removeScrollIntentListeners = () => {
        window.removeEventListener('wheel', handleScrollIntent);
        window.removeEventListener('touchmove', handleScrollIntent);
        window.removeEventListener('touchstart', handleTouchStartIntent);
        lastTouchY = null;
    };

    menuToggle?.addEventListener('click', () => {
        const isMenuActive = navMenu?.classList.contains('active');
        setMenuState(!isMenuActive);
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && navMenu?.classList.contains('active')) {
            setMenuState(false);
        }
    });

    const closeMenu = () => setMenuState(false);
    navMenu?.setAttribute('aria-hidden', 'true');
    menuToggle?.setAttribute('aria-expanded', 'false');
    menuToggle?.setAttribute('aria-label', 'メニューを開く');

    const updateNavbarState = () => {
        if (!navbar) return;
        navbar.classList.toggle('scrolled', window.scrollY > 24);
    };

    const updateHeaderVisibility = () => {
        const visible = isFirstViewFullyVisible();
        bodyElement.classList.toggle('first-view-visible', visible);
    };

    const handleDirectionalHeader = () => {
        if (navMenu?.classList.contains('active')) {
            lastKnownScrollY = window.scrollY;
            bodyElement.classList.remove('header-hidden');
            return;
        }
        const currentY = window.scrollY;
        const delta = currentY - lastKnownScrollY;
        const scrolledPastHero = !bodyElement.classList.contains('first-view-visible') && currentY > 80;

        if (!scrolledPastHero || currentY < 120) {
            bodyElement.classList.remove('header-hidden');
            lastKnownScrollY = currentY;
            return;
        }

        if (delta > 6) {
            bodyElement.classList.add('header-hidden');
        } else if (delta < -6) {
            bodyElement.classList.remove('header-hidden');
        }

        lastKnownScrollY = currentY;
    };

    const handleScrollEvents = () => {
        updateNavbarState();
        updateHeaderVisibility();
        handleDirectionalHeader();
    };

    updateNavbarState();
    updateHeaderVisibility();
    handleDirectionalHeader();
    window.addEventListener('scroll', handleScrollEvents);

    const smoothScroll = (target) => {
        const el = document.querySelector(target);
        if (!el) return;
        const top = el.getBoundingClientRect().top + window.pageYOffset - 70;
        window.scrollTo({ top, behavior: 'smooth' });
        closeMenu();
    };

    document.querySelectorAll('.nav-link, [data-scroll]').forEach(link => {
        link.addEventListener('click', (e) => {
            const target = link.getAttribute('href') || link.dataset.scroll;
            if (target?.startsWith('#')) {
                e.preventDefault();
                smoothScroll(target);
                closeMenu();
            }
        });
    });

    const burgerMenu = document.getElementById('burgers-menu');
    const sidesMenu = document.getElementById('sides-menu');
    const drinksMenu = document.getElementById('drinks-menu');

    const createCard = ({ image, title, desc, price }) => `
        <article class="menu-item">
            <div class="menu-item-image">
                <img src="${image}" alt="${title}">
            </div>
            <div class="menu-item-info">
                <div>
                    <h3>${title}</h3>
                    <p>${desc}</p>
                </div>
                <div class="menu-meta">
                    <span class="price">${price}</span>
                    <button class="btn-ghost" data-add-to-cart>予約する</button>
                </div>
            </div>
        </article>`;

    const sides = [
        {
            image: 'https://images.unsplash.com/photo-1639024471283-03518883cc9c?auto=format&fit=crop&w=600&q=80',
            title: '季節の有機野菜サラダ',
            desc: 'バルサミコと満月ハーブで仕上げたグロッサリーサラダ',
            price: '¥780'
        },
        {
            image: 'https://images.unsplash.com/photo-1577906096429-f73c2c312435?auto=format&fit=crop&w=600&q=80',
            title: '特製コールスロー',
            desc: '紫キャベツと林檎をムーンマスタードでラメ',
            price: '¥480'
        },
        {
            image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80',
            title: '星屑ポテト',
            desc: '月光ソルトとトリュフオイルのディッピング付き',
            price: '¥680'
        }
    ];

    const drinks = [
        {
            image: 'https://images.unsplash.com/photo-1521927336940-cae6e9f22a3f?auto=format&fit=crop&w=600&q=80',
            title: '地ビール各種',
            desc: 'IPA / ペールエール / スタウト',
            price: '¥880〜'
        },
        {
            image: 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?auto=format&fit=crop&w=600&q=80',
            title: '手作りシェイク',
            desc: 'ムーンミルクを使った夜限定フレーバー',
            price: '¥780'
        },
        {
            image: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=600&q=80',
            title: '自家製レモネード',
            desc: '有機レモン・はちみつ・ミント',
            price: '¥580'
        },
        {
            image: 'https://images.unsplash.com/photo-1622480916113-9000ac49b79d?auto=format&fit=crop&w=600&q=80',
            title: 'スペシャルティコーヒー',
            desc: 'エスプレッソ／カプチーノ／ラテ',
            price: '¥480〜'
        }
    ];

    if (sidesMenu && !sidesMenu.querySelector('.menu-item')) {
        sidesMenu.innerHTML = `<div class="menu-grid">${sides.map(createCard).join('')}</div>`;
    }

    if (drinksMenu && !drinksMenu.querySelector('.menu-item')) {
        drinksMenu.innerHTML = `<div class="menu-grid">${drinks.map(createCard).join('')}</div>`;
    }

    const menuTabs = document.querySelectorAll('.menu-tab');
    const menuContents = document.querySelectorAll('.menu-content');

    menuTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            menuTabs.forEach(t => {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            });
            menuContents.forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');
            document.getElementById(`${tab.dataset.tab}-menu`)?.classList.add('active');
        });
    });

    document.body.addEventListener('click', (e) => {
        const button = e.target.closest('[data-add-to-cart]');
        if (!button) return;
        button.disabled = true;
        const original = button.textContent;
        button.textContent = '予約済み';
        button.style.borderColor = 'var(--accent-2)';
        setTimeout(() => {
            button.disabled = false;
            button.textContent = original;
            button.style.borderColor = '';
        }, 2000);
    });

    const contactForm = document.querySelector('.contact-form');
    contactForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('name').value;
        alert(`${name} 様、メッセージを受け取りました。48時間以内に返信いたします。`);
        contactForm.reset();
    });

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReducedMotion) {
        const heroImage = document.querySelector('.hero-frame img');
        let ticking = false;
        const handleScroll = () => {
            const offset = window.pageYOffset * 0.05;
            heroImage && (heroImage.style.transform = `scale(1.05) translateY(${offset}px)`);
            ticking = false;
        };
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(handleScroll);
                ticking = true;
            }
        });
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('visible');
        });
    }, { threshold: 0.15 });

    document.querySelectorAll('.glass-panel, .signature-card, .lab-card, .menu-item, .timeline-card, .location-card').forEach(el => {
        el.classList.add('will-animate');
        observer.observe(el);
    });

    const revealObserver = prefersReducedMotion ? null : new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
            } else {
                // 要素が画面から出たらアニメーションクラスを削除
                entry.target.classList.remove('is-visible');
            }
        });
    }, { threshold: 0.2, rootMargin: '0px 0px -10% 0px' });

    const addRevealTargets = (elements) => {
        elements.forEach(el => {
            if (!el || el.dataset.revealInit === 'true') return;
            el.classList.add('reveal-on-scroll');
            el.dataset.revealInit = 'true';
            if (prefersReducedMotion) {
                el.classList.add('is-visible');
            } else {
                revealObserver?.observe(el);
            }
        });
    };

    const revealSelectors = [
        '.hero-content > *',
        '.story-text > *',
        '.timeline-card',
        '.signature-card',
        '.signature-card img',
        '.lab-card',
        '.menu-item',
        '.menu-item-image img',
        '.locations .location-card',
        '.location-card img'
    ];

    addRevealTargets(revealSelectors.flatMap(selector => [...document.querySelectorAll(selector)]));

    const textSelectors = [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', '.subtitle', '.eyebrow', '.hero-note',
        '.nav-link', '.menu-tab', '.btn-primary', '.btn-ghost',
        '.price', '.price-chip', '.section-lead',
        '.location-meta dt', '.location-meta dd',
        '.footer-grid *', '.hero-buttons a', '.hero-buttons button'
    ];

    addRevealTargets(textSelectors.flatMap(selector => [...document.querySelectorAll(selector)]));

    textSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => el.classList.add('text-hover'));
    });

    const tiltSelectors = [
        '.hero-content',
        '.story-text',
        '.timeline-card',
        '.signature-card',
        '.lab-card',
        '.location-card',
        '.menu-item',
        '.section-header',
        '.hero-buttons',
        '.locations .section-header'
    ];

    tiltSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => el.classList.add('tilt-hover'));
    });

    const floatingOrder = document.querySelector('.floating-order');
    if (floatingOrder) {
        floatingOrder.classList.add('hidden');
        window.addEventListener('scroll', () => {
            floatingOrder.classList.toggle('hidden', window.scrollY < 300);
        });
    }

    const dialog = document.createElement('dialog');
    dialog.className = 'image-modal';
    dialog.innerHTML = `
        <form method="dialog" class="dialog-form">
            <button type="submit" class="close-modal" aria-label="閉じる">×</button>
            <div class="dialog-content">
                <img alt="拡大画像" id="dialog-img">
            </div>
        </form>
    `;
    document.body.appendChild(dialog);

    const dialogImg = dialog.querySelector('#dialog-img');

    document.addEventListener('click', (e) => {
        const targetImg = e.target.closest('.signature-card img, .menu-item-image img');
        if (!targetImg || !dialogImg) return;
        dialogImg.src = targetImg.src;
        dialogImg.alt = targetImg.alt || '拡大画像';
        if (!dialog.open) {
            dialog.showModal();
            body.classList.add('is-modal-open');
        }
    });

    dialog.addEventListener('close', () => {
        body.classList.remove('is-modal-open');
    });

    dialog.addEventListener('click', (e) => {
        const rect = dialog.getBoundingClientRect();
        const isInDialog = (
            rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
            rect.left <= e.clientX && e.clientX <= rect.left + rect.width
        );
        if (!isInDialog) {
            dialog.close();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (dialog.open) dialog.close();
            if (navMenu?.classList.contains('active')) closeMenu();
        }
    });

});
