const yoph = {
  linkify() {
    document.querySelectorAll('[data-random-link]').forEach((el) => {
      const links = [...document.querySelectorAll('a[href]')].filter(a => a !== el && a.getAttribute('href') !== '#');
      if (links.length) el.href = links[Math.floor(Math.random() * links.length)].href;
    });
  },
  reveal() {
    const items = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) return items.forEach(item => item.classList.add('visible'));
    const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); } }), { threshold: .12 });
    items.forEach(item => observer.observe(item));
  },
  tilt() {
    document.querySelectorAll('[data-tilt]').forEach(card => card.addEventListener('pointermove', (event) => {
      const box = card.getBoundingClientRect(); const x = (event.clientX - box.left) / box.width - .5; const y = (event.clientY - box.top) / box.height - .5;
      card.style.transform = `perspective(700px) rotateX(${y * -5}deg) rotateY(${x * 5}deg)`;
    }));
    document.querySelectorAll('[data-tilt]').forEach(card => card.addEventListener('pointerleave', () => { card.style.transform = ''; }));
  },
  init() { this.reveal(); this.tilt(); this.linkify(); document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear()); }
};
document.addEventListener('DOMContentLoaded', () => yoph.init());
