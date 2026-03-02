/**
 * Superteam Ukraine — Main JavaScript
 * Version: 1.0 | March 2026
 *
 * Modules:
 * 1. Navbar scroll behavior
 * 2. Mobile navigation toggle
 * 3. Accordion (FAQ)
 * 4. Stat counter animation
 * 5. Reveal on scroll (Intersection Observer)
 * 6. Smooth scroll for anchor links
 * 7. Accordion panel animation
 */

'use strict';

/* ============================================================
   UTILITY: requestAnimationFrame-safe easing
============================================================ */
function easeOutQuart(t) {
  return 1 - Math.pow(1 - t, 4);
}


/* ============================================================
   1. NAVBAR SCROLL BEHAVIOR
   — Adds `is-scrolled` class after 60px scroll
   — Triggers backdrop-filter + bg-elevated transition
============================================================ */
(function initNavbarScroll() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  const SCROLL_THRESHOLD = 60;
  let ticking = false;

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        if (window.scrollY > SCROLL_THRESHOLD) {
          navbar.classList.add('is-scrolled');
        } else {
          navbar.classList.remove('is-scrolled');
        }
        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  // Run once on init
  onScroll();
})();


/* ============================================================
   2. MOBILE NAVIGATION TOGGLE
   — Hamburger ↔ close
   — Locks body scroll when nav open
   — Closes on anchor link click
============================================================ */
(function initMobileNav() {
  const hamburger = document.getElementById('hamburger-btn');
  const mobileNav = document.getElementById('mobile-nav');
  const mobileLinks = document.querySelectorAll('.mobile-nav__link, .mobile-nav__cta');

  if (!hamburger || !mobileNav) return;

  let isOpen = false;

  function openNav() {
    isOpen = true;
    hamburger.classList.add('is-open');
    hamburger.setAttribute('aria-expanded', 'true');
    mobileNav.classList.add('is-open');
    mobileNav.removeAttribute('aria-hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeNav() {
    isOpen = false;
    hamburger.classList.remove('is-open');
    hamburger.setAttribute('aria-expanded', 'false');
    mobileNav.classList.remove('is-open');
    mobileNav.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', () => {
    if (isOpen) closeNav();
    else openNav();
  });

  // Close on any mobile nav link click
  mobileLinks.forEach(link => {
    link.addEventListener('click', closeNav);
  });

  // Close on window resize back to desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768 && isOpen) {
      closeNav();
    }
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) closeNav();
  });
})();


/* ============================================================
   3. ACCORDION (FAQ)
   — ARIA-compliant expand/collapse
   — Smooth height animation via max-height
   — Only one item open at a time (optional: change to multiple)
============================================================ */
(function initAccordion() {
  const accordionContainer = document.getElementById('faq-accordion');
  if (!accordionContainer) return;

  const triggers = accordionContainer.querySelectorAll('.accordion-trigger');

  triggers.forEach(trigger => {
    const panelId = trigger.getAttribute('aria-controls');
    const panel = document.getElementById(panelId);
    if (!panel) return;

    trigger.addEventListener('click', () => {
      const isExpanded = trigger.getAttribute('aria-expanded') === 'true';

      // Close all other open panels first
      triggers.forEach(otherTrigger => {
        if (otherTrigger !== trigger) {
          const otherPanelId = otherTrigger.getAttribute('aria-controls');
          const otherPanel = document.getElementById(otherPanelId);
          otherTrigger.setAttribute('aria-expanded', 'false');
          if (otherPanel) {
            otherPanel.setAttribute('hidden', '');
          }
        }
      });

      // Toggle current panel
      if (isExpanded) {
        trigger.setAttribute('aria-expanded', 'false');
        panel.setAttribute('hidden', '');
      } else {
        trigger.setAttribute('aria-expanded', 'true');
        panel.removeAttribute('hidden');
        // Scroll into view if panel is below fold
        requestAnimationFrame(() => {
          const rect = trigger.getBoundingClientRect();
          if (rect.top < 80) {
            window.scrollBy({ top: rect.top - 80, behavior: 'smooth' });
          }
        });
      }
    });
  });
})();


/* ============================================================
   4. STAT COUNTER ANIMATION
   — Triggers when element enters viewport
   — Counts up from 0 to target value
   — Respects prefers-reduced-motion
============================================================ */
(function initCounters() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Select all counter elements (hero stats + stats section)
  const counters = document.querySelectorAll('[data-target]');
  if (!counters.length) return;

  function animateCounter(el) {
    const target = parseInt(el.getAttribute('data-target'), 10);
    const prefix = el.getAttribute('data-prefix') || '';
    const suffix = el.getAttribute('data-suffix') || '';
    const duration = 900; // ms
    const startTime = performance.now();

    if (prefersReducedMotion) {
      el.textContent = prefix + target + suffix;
      return;
    }

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutQuart(progress);
      const current = Math.floor(eased * target);

      el.textContent = prefix + current + suffix;

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        el.textContent = prefix + target + suffix;
      }
    }

    requestAnimationFrame(update);
  }

  // Use IntersectionObserver so counters trigger on scroll into view
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !entry.target.dataset.counted) {
        entry.target.dataset.counted = 'true';
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.5
  });

  counters.forEach(counter => counterObserver.observe(counter));
})();


/* ============================================================
   5. REVEAL ON SCROLL (Intersection Observer)
   — Fade + translate-up entrance for `.reveal-item` elements
   — Staggered via CSS nth-child delay
   — Gracefully degrades with prefers-reduced-motion
============================================================ */
(function initRevealOnScroll() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealItems = document.querySelectorAll('.reveal-item');

  if (!revealItems.length) return;

  // If reduced motion — just show everything immediately
  if (prefersReducedMotion) {
    revealItems.forEach(item => item.classList.add('is-visible'));
    return;
  }

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
  });

  revealItems.forEach(item => revealObserver.observe(item));
})();


/* ============================================================
   6. SMOOTH SCROLL FOR ANCHOR LINKS
   — Accounts for sticky navbar height (64px)
   — Works for all # links including CTA buttons
============================================================ */
(function initSmoothScroll() {
  const NAVBAR_HEIGHT = 64;

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      const targetEl = document.querySelector(targetId);
      if (!targetEl) return;

      e.preventDefault();

      const targetTop = targetEl.getBoundingClientRect().top + window.scrollY - NAVBAR_HEIGHT - 16;
      window.scrollTo({ top: targetTop, behavior: 'smooth' });
    });
  });
})();


/* ============================================================
   7. TRUST BAR: Pause on hover (if you later add auto-scroll)
   — Currently static; this is the hook for future animation
============================================================ */
(function initTrustBar() {
  const trustBar = document.querySelector('.trust-bar__logos');
  if (!trustBar) return;
  // Hook point: if trust bar becomes a marquee/scroll, pause on hover:
  // trustBar.addEventListener('mouseenter', () => { ... });
})();


/* ============================================================
   8. ACTIVE NAV LINK HIGHLIGHT
   — Highlight nav link based on current scroll section
============================================================ */
(function initActiveNavHighlight() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');
  if (!sections.length || !navLinks.length) return;

  const OFFSET = 100;
  let ticking = false;

  function updateActiveLink() {
    const scrollPos = window.scrollY + OFFSET;

    let currentSection = '';
    sections.forEach(section => {
      if (section.offsetTop <= scrollPos) {
        currentSection = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('nav-link--active');
      const href = link.getAttribute('href');
      if (href === `#${currentSection}`) {
        link.classList.add('nav-link--active');
      }
    });
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        updateActiveLink();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  // Initial call
  updateActiveLink();
})();


/* ============================================================
   9. SKILL FILTER (Community member grid)
   — Clicking filter buttons shows/hides member cards
============================================================ */
(function initSkillFilter() {
  const filterBtns = document.querySelectorAll('.skill-filter-btn');
  const memberCards = document.querySelectorAll('.member-card');
  if (!filterBtns.length || !memberCards.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const skill = btn.getAttribute('data-skill');

      // Update active state
      filterBtns.forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');

      // Show/hide cards
      memberCards.forEach(card => {
        const cardSkill = card.getAttribute('data-skill');
        if (skill === 'all' || cardSkill === skill) {
          card.style.display = '';
          // Re-trigger reveal animation
          requestAnimationFrame(() => card.classList.add('is-visible'));
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
})();


/* ============================================================
   10. NEWSLETTER FORM
   — Prevent default + show confirmation
============================================================ */
(function initNewsletterForm() {
  const form = document.querySelector('.newsletter-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = form.querySelector('.newsletter-form__input');
    const btn = form.querySelector('button[type="submit"]');
    if (!input || !input.value) return;

    btn.textContent = '✓ Subscribed!';
    btn.disabled = true;
    input.value = '';

    setTimeout(() => {
      btn.textContent = 'Subscribe';
      btn.disabled = false;
    }, 4000);
  });
})();

