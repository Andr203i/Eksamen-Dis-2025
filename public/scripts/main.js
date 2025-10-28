document.addEventListener('DOMContentLoaded', () => {
  const navToggle = document.querySelector('.nav-toggle');
  const navList = document.querySelector('.nav-list');

  if (navToggle && navList) {
    navToggle.addEventListener('click', () => {
      const isOpen = navList.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  const links = document.querySelectorAll('a[href^="#"]');

  links.forEach((link) => {
    link.addEventListener('click', (event) => {
      const targetId = link.getAttribute('href');

      if (targetId && targetId.length > 1) {
        const targetElement = document.querySelector(targetId);

        if (targetElement) {
          event.preventDefault();
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });

          if (navToggle && navList && navList.classList.contains('is-open')) {
            navList.classList.remove('is-open');
            navToggle.setAttribute('aria-expanded', 'false');
          }
        }
      }
    });
  });
});
