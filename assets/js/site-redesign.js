(function () {
  const socialLinks = [
    { href: 'https://x.com/aleimad7aden', label: 'X', icon: 'fa-brands fa-x-twitter' },
    { href: 'https://www.instagram.com/p/DQVHj_FiCQS/', label: 'Instagram', icon: 'fa-brands fa-instagram' },
    { href: 'https://www.facebook.com/aleimad7aden/', label: 'Facebook', icon: 'fa-brands fa-facebook-f' }
  ];
  const prefix = location.pathname.includes('/articles/') ? '../' : '';
  function localHref(href) { return href.startsWith('http') ? href : prefix + href; }
  const quickLinks = [
    ['الرئيسية', 'index.html'], ['موسوعة عدن', 'districts.html'], ['مركز الاستشارات', 'legal-consultant.html'],
    ['نظام الطلبات', 'request-reception.html'], ['التطور العمراني', 'urban-development.html'], ['حاسبة المساحة', 'land-area.html'],
    ['تثمين العقارات', 'property-value.html'], ['دليل الأحياء', 'neighborhoods.html']
  ];
  const encyclopediaLinks = [
    ['صحة البصيرة', 'basirah.html'], ['نقل الملكية', 'transfer.html'], ['حصر الورثة', 'heirs.html'],
    ['الشراء الآمن', 'buy-safely.html'], ['أنواع الملكية', 'ownership-types.html'], ['الأخطاء الشائعة', 'common-mistakes.html']
  ];
  function iconLink(item) {
    return `<a class="modern-social-link" href="${item.href}" target="_blank" rel="noopener" aria-label="${item.label}"><i class="${item.icon}"></i></a>`;
  }
  function enhanceHeader() {
    const header = document.querySelector('header');
    if (!header || header.dataset.modernEnhanced) return;
    header.dataset.modernEnhanced = 'true';
    const tools = document.createElement('div');
    tools.className = 'modern-site-tools no-print';
    tools.innerHTML = socialLinks.map(iconLink).join('') + '<button class="modern-mobile-toggle" type="button" aria-label="فتح القائمة"><i class="fa-solid fa-bars"></i></button>';
    header.appendChild(tools);
    const drawer = document.createElement('aside');
    drawer.className = 'modern-mobile-drawer no-print';
    drawer.setAttribute('aria-label', 'القائمة الجانبية للهاتف');
    drawer.innerHTML = '<button type="button" data-close-drawer><i class="fa-solid fa-xmark"></i>&nbsp; إغلاق</button>' + quickLinks.map(([label, href]) => `<a href="${localHref(href)}">${label}</a>`).join('') + '<div class="modern-site-tools" style="margin-top:14px">' + socialLinks.map(iconLink).join('') + '</div>';
    document.body.appendChild(drawer);
    tools.querySelector('.modern-mobile-toggle').addEventListener('click', () => drawer.classList.add('active'));
    drawer.querySelector('[data-close-drawer]').addEventListener('click', () => drawer.classList.remove('active'));
    drawer.addEventListener('click', (event) => { if (event.target.tagName === 'A') drawer.classList.remove('active'); });
  }
  function enhanceFooter() {
    const footer = document.querySelector('footer');
    if (!footer || footer.dataset.modernEnhanced) return;
    footer.dataset.modernEnhanced = 'true';
    const panel = document.createElement('div');
    panel.className = 'modern-footer-grid no-print';
    panel.innerHTML = `
      <section class="modern-footer-card"><h3>مكتب عماد عدن العقاري</h3><p>مرجع عقاري في عدن لخدمات البيع والشراء والتثمين وإدارة الأملاك والاستشارات القانونية مع الحفاظ على الأمان والوضوح.</p><div class="modern-site-tools">${socialLinks.map(iconLink).join('')}</div></section>
      <section class="modern-footer-card"><h3>روابط سريعة</h3>${quickLinks.slice(0, 5).map(([label, href]) => `<a href="${localHref(href)}">${label}</a>`).join('')}</section>
      <section class="modern-footer-card"><h3>روابط الخدمات</h3>${quickLinks.slice(2).map(([label, href]) => `<a href="${localHref(href)}">${label}</a>`).join('')}</section>
      <section class="modern-footer-card"><h3>موسوعة العقارات</h3>${encyclopediaLinks.map(([label, href]) => `<a href="${localHref(href)}">${label}</a>`).join('')}<a href="https://wa.me/967773571889" target="_blank" rel="noopener">واتساب: 967773571889+</a></section>`;
    footer.prepend(panel);
  }
  function enhanceCards() {
    document.querySelectorAll('.glass-panel, .glass-card, .card').forEach((el, index) => {
      el.style.animationDelay = `${Math.min(index * 35, 420)}ms`;
    });
    document.querySelectorAll('img:not([loading])').forEach((img) => img.setAttribute('loading', 'lazy'));
  }
  function enhanceSearch() {
    const input = document.getElementById('encyclopedia-search');
    if (!input || input.dataset.modernEnhanced) return;
    input.dataset.modernEnhanced = 'true';
    const result = document.createElement('p');
    result.className = 'text-xs text-[var(--gold)] mt-2';
    result.setAttribute('aria-live', 'polite');
    input.insertAdjacentElement('afterend', result);
    input.addEventListener('input', () => {
      const cards = Array.from(document.querySelectorAll('#realestate-encyclopedia a[data-title]'));
      const visible = cards.filter((card) => card.offsetParent !== null).length;
      result.textContent = input.value.trim() ? `نتائج ظاهرة: ${visible}` : '';
    });
  }
  function enhanceSpeedDial() {
    const menu = document.querySelector('.sd-menu');
    if (!menu || menu.dataset.modernEnhanced) return;
    menu.dataset.modernEnhanced = 'true';
    socialLinks.forEach((item) => menu.insertAdjacentHTML('beforeend', `<a class="sd-item" href="${item.href}" target="_blank" rel="noopener" aria-label="${item.label}"><i class="${item.icon}"></i></a>`));
  }
  document.addEventListener('DOMContentLoaded', () => {
    enhanceHeader();
    enhanceFooter();
    enhanceCards();
    enhanceSearch();
    enhanceSpeedDial();
  });
})();
