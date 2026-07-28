(() => {
  'use strict';

  if (document.getElementById('globalScrollTop')) return;

  const style = document.createElement('style');
  style.textContent = `
    #globalScrollTop {
      position: fixed;
      left: 22px;
      bottom: 24px;
      z-index: 9999;
      width: 54px;
      height: 54px;
      border: 1px solid rgba(226, 188, 112, .42);
      border-radius: 50%;
      display: grid;
      place-items: center;
      padding: 0;
      color: #fff;
      background: linear-gradient(145deg, rgba(255,255,255,.17), rgba(15,24,30,.48));
      box-shadow: 0 14px 38px rgba(0,0,0,.34), inset 0 1px 0 rgba(255,255,255,.22);
      -webkit-backdrop-filter: blur(16px) saturate(145%);
      backdrop-filter: blur(16px) saturate(145%);
      font: 800 25px/1 system-ui, -apple-system, "Segoe UI Emoji", sans-serif;
      cursor: pointer;
      opacity: 0;
      visibility: hidden;
      transform: translateY(14px) scale(.92);
      transition: opacity .25s ease, visibility .25s ease, transform .25s ease, border-color .25s ease, box-shadow .25s ease;
    }
    #globalScrollTop.is-visible {
      opacity: 1;
      visibility: visible;
      transform: translateY(0) scale(1);
    }
    #globalScrollTop:hover {
      transform: translateY(-4px) scale(1.04);
      border-color: rgba(226, 188, 112, .8);
      box-shadow: 0 18px 44px rgba(0,0,0,.42), 0 0 24px rgba(226,188,112,.16), inset 0 1px 0 rgba(255,255,255,.3);
    }
    #globalScrollTop:focus-visible {
      outline: 3px solid rgba(226, 188, 112, .38);
      outline-offset: 4px;
    }
    @media (max-width: 620px) {
      #globalScrollTop {
        width: 50px;
        height: 50px;
        left: 15px;
        bottom: 86px;
        font-size: 23px;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      #globalScrollTop { transition: none; }
    }
  `;
  document.head.appendChild(style);

  const button = document.createElement('button');
  button.id = 'globalScrollTop';
  button.type = 'button';
  button.setAttribute('aria-label', 'العودة إلى بداية الصفحة');
  button.setAttribute('title', 'العودة إلى بداية الصفحة');
  button.textContent = '⬆️';
  document.body.appendChild(button);

  const toggleButton = () => {
    button.classList.toggle('is-visible', window.scrollY > 320);
  };

  button.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    });
  });

  window.addEventListener('scroll', toggleButton, { passive: true });
  toggleButton();
})();
