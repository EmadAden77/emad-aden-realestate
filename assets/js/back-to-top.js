(() => {
  const button = document.createElement('button');
  button.id = 'backToTop';
  button.type = 'button';
  button.setAttribute('aria-label', 'العودة إلى أعلى الصفحة');
  button.innerHTML = '<i class="fa-solid fa-arrow-up" aria-hidden="true"></i>';

  const style = document.createElement('style');
  style.textContent = `
    #backToTop {
      position: fixed;
      left: 20px;
      bottom: 20px;
      width: 54px;
      height: 54px;
      border: 1px solid rgba(229, 192, 123, .45);
      border-radius: 50%;
      display: grid;
      place-items: center;
      background: linear-gradient(135deg, #E5C07B, #B8860B);
      color: #050505;
      font-size: 1.1rem;
      cursor: pointer;
      box-shadow: 0 12px 30px rgba(0, 0, 0, .35);
      opacity: 0;
      visibility: hidden;
      transform: translateY(14px) scale(.92);
      transition: opacity .25s ease, visibility .25s ease, transform .25s ease, box-shadow .25s ease;
      z-index: 9999;
    }
    #backToTop.show {
      opacity: 1;
      visibility: visible;
      transform: translateY(0) scale(1);
    }
    #backToTop:hover {
      transform: translateY(-3px) scale(1.04);
      box-shadow: 0 16px 34px rgba(229, 192, 123, .22);
    }
    #backToTop:focus-visible {
      outline: 3px solid rgba(229, 192, 123, .35);
      outline-offset: 4px;
    }
    @media (max-width: 680px) {
      #backToTop {
        left: 14px;
        bottom: 14px;
        width: 50px;
        height: 50px;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      #backToTop {
        transition: none;
      }
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(button);

  const updateVisibility = () => {
    button.classList.toggle('show', window.scrollY > 420);
  };

  window.addEventListener('scroll', updateVisibility, { passive: true });
  button.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    });
  });

  updateVisibility();
})();
