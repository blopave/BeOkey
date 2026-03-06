// ========== LOADER ==========
window.addEventListener('load', () => {
  setTimeout(() => {
    document.querySelector('.loader').classList.add('hidden');
  }, 2200);
});

// ========== HORIZONTAL SCROLL + PARALLAX ==========
const container = document.querySelector('.horizontal-container');
const panels = document.querySelectorAll('.panel');
const progressBar = document.querySelector('.nav-progress');
const bgLayer = document.getElementById('bg-layer');

let totalWidth = 0;
panels.forEach(p => totalWidth += p.offsetWidth);

let scrollPos = 0;
let targetScroll = 0;
let maxScroll = totalWidth - window.innerWidth;

function isMobile() {
  return window.innerWidth <= 768;
}

// Smooth interpolation for buttery scroll
function lerp(start, end, factor) {
  return start + (end - start) * factor;
}

function animate() {
  if (isMobile()) {
    requestAnimationFrame(animate);
    return;
  }

  // Smooth scroll interpolation
  scrollPos = lerp(scrollPos, targetScroll, 0.08);

  // Snap when very close
  if (Math.abs(scrollPos - targetScroll) < 0.5) {
    scrollPos = targetScroll;
  }

  // Move content
  container.style.transform = `translateX(-${scrollPos}px)`;

  // Parallax: background moves at 60% speed
  const parallaxOffset = scrollPos * 0.6;
  bgLayer.style.transform = `translateX(-${parallaxOffset}px)`;

  // Progress bar
  const progress = (scrollPos / maxScroll) * 100;
  progressBar.style.width = progress + '%';

  // Check reveals
  checkReveals();

  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);

// Wheel event
window.addEventListener('wheel', (e) => {
  if (isMobile()) return;
  e.preventDefault();
  targetScroll += e.deltaY * 1.2;
  targetScroll = Math.max(0, Math.min(targetScroll, maxScroll));
}, { passive: false });

// Touch events for trackpad/touch
let touchStartX = 0;
window.addEventListener('touchstart', (e) => {
  if (isMobile()) return;
  touchStartX = e.touches[0].clientX;
});

window.addEventListener('touchmove', (e) => {
  if (isMobile()) return;
  const diff = touchStartX - e.touches[0].clientX;
  targetScroll += diff;
  targetScroll = Math.max(0, Math.min(targetScroll, maxScroll));
  touchStartX = e.touches[0].clientX;
});

// Recalc on resize
window.addEventListener('resize', () => {
  totalWidth = 0;
  panels.forEach(p => totalWidth += p.offsetWidth);
  maxScroll = totalWidth - window.innerWidth;

  if (isMobile()) {
    container.style.transform = 'none';
    bgLayer.style.transform = 'none';
    scrollPos = 0;
    targetScroll = 0;
  } else {
    targetScroll = Math.min(targetScroll, maxScroll);
  }
});

// ========== NAVBAR LINKS: SCROLL TO PANEL ==========
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    e.preventDefault();
    const targetId = anchor.getAttribute('href').slice(1);
    const targetPanel = document.getElementById(targetId);
    if (!targetPanel) return;

    if (isMobile()) {
      targetPanel.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    // Calculate horizontal position
    let pos = 0;
    let panelWidth = 0;
    for (const panel of panels) {
      if (panel.id === targetId) {
        panelWidth = panel.offsetWidth;
        break;
      }
      pos += panel.offsetWidth;
    }

    // Center wider panels in viewport
    if (panelWidth > window.innerWidth) {
      pos += (panelWidth - window.innerWidth) / 2;
    }

    targetScroll = Math.min(pos, maxScroll);

    // Close mobile menu if open
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenu.classList.contains('active')) {
      mobileMenu.classList.remove('active');
    }
  });
});

// ========== SCROLL REVEAL ==========
const revealElements = document.querySelectorAll('.reveal, .reveal-left');

function checkReveals() {
  revealElements.forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.left < window.innerWidth * 0.82 && rect.right > 0) {
      el.classList.add('visible');
    }
  });
}

// Mobile: use IntersectionObserver
if (isMobile()) {
  const mobileObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  }, { threshold: 0.15 });

  revealElements.forEach(el => mobileObserver.observe(el));
}

// Initial check after loader
setTimeout(checkReveals, 2500);

// ========== MOBILE MENU ==========
const menuToggle = document.getElementById('menu-toggle');
const mobileMenu = document.getElementById('mobile-menu');

menuToggle.addEventListener('click', () => {
  const isOpen = mobileMenu.classList.toggle('active');
  menuToggle.setAttribute('aria-expanded', isOpen);
  menuToggle.innerHTML = isOpen
    ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 6l12 12M6 18L18 6"/></svg>'
    : '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
});

document.querySelectorAll('#mobile-menu a').forEach(link => {
  link.addEventListener('click', () => {
    mobileMenu.classList.remove('active');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
  });
});

// ========== KEYBOARD NAV ==========
window.addEventListener('keydown', (e) => {
  if (isMobile()) return;
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
    targetScroll = Math.min(targetScroll + window.innerWidth * 0.5, maxScroll);
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
    targetScroll = Math.max(targetScroll - window.innerWidth * 0.5, 0);
  }
});

// ========== 3D TILT + SPOTLIGHT ON GLASS CARDS ==========
const glassCards = document.querySelectorAll('.text-glass, .philosophy-content');

glassCards.forEach(card => {
  card.addEventListener('mousemove', (e) => {
    if (isMobile()) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Tilt: max 4 degrees
    const rotateX = ((y - centerY) / centerY) * -4;
    const rotateY = ((x - centerX) / centerX) * 4;

    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-2px)`;

    // Spotlight follows mouse
    const percX = (x / rect.width) * 100;
    const percY = (y / rect.height) * 100;
    card.style.setProperty('--mouse-x', percX + '%');
    card.style.setProperty('--mouse-y', percY + '%');
  });

  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
    card.style.setProperty('--mouse-x', '50%');
    card.style.setProperty('--mouse-y', '50%');
  });
});

// ========== MICRO-PARALLAX ON GLASS CARDS ==========
const hoveredCards = new Set();

function updateCardParallax() {
  if (isMobile()) return;

  glassCards.forEach((card, i) => {
    // Skip cards being hovered (tilt is active)
    if (hoveredCards.has(card)) return;

    const rect = card.getBoundingClientRect();
    const viewCenter = window.innerWidth / 2;
    const cardCenter = rect.left + rect.width / 2;
    const distance = (cardCenter - viewCenter) / window.innerWidth;

    const speed = (i % 2 === 0) ? 18 : -18;
    const yOffset = distance * speed;

    card.style.transform = `translateY(${yOffset}px)`;
  });
}

// Track hover state for parallax
glassCards.forEach(card => {
  card.addEventListener('mouseenter', () => hoveredCards.add(card));
  card.addEventListener('mouseleave', () => hoveredCards.delete(card));
});

// Patch checkReveals to run parallax in the existing animation loop
const _origCheckReveals = checkReveals;
checkReveals = function() {
  _origCheckReveals();
  updateCardParallax();
};
