(() => {
  'use strict';

  if (window.__pageSectionCardsLoaded) return;
  window.__pageSectionCardsLoaded = true;

  const MAX_ITEMS = 8;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const ignoredTitles = /^(جدول المحتويات|مقالات ذات صلة|مقالات مقترحة|قد يهمك أيضاً|قد يهمك أيضًا)$/;
  const structuralIds = new Set(['pmContent', 'accountContent', 'portalPreview', 'result', 'resultSection', 'indexGrid']);

  const style = document.createElement('style');
  style.id = 'pageSectionCardsStyles';
  style.textContent = `
    .page-section-directory {
      --psc-accent: var(--gold-light, var(--gold2, var(--gold, var(--cyan-soft, var(--cyan, #e5c07b)))));
      --psc-text: var(--text, var(--ink, #f7f3e9));
      --psc-muted: var(--muted, #aeb4bc);
      position: relative;
      isolation: isolate;
      width: min(1180px, calc(100% - 32px));
      margin: clamp(22px, 4vw, 42px) auto;
      padding: clamp(18px, 2.5vw, 26px);
      border: 1px solid color-mix(in srgb, var(--psc-accent) 26%, transparent);
      border-radius: 26px 10px 26px 10px;
      color: var(--psc-text);
      background:
        radial-gradient(circle at 100% 0, color-mix(in srgb, var(--psc-accent) 12%, transparent), transparent 34%),
        linear-gradient(145deg, rgba(25, 25, 24, .94), rgba(10, 11, 12, .94));
      box-shadow: 0 22px 58px rgba(0, 0, 0, .24), inset 0 1px 0 rgba(255, 255, 255, .045);
      overflow: hidden;
      direction: rtl;
    }
    .page-section-directory::before {
      content: "";
      position: absolute;
      inset: 0 24px auto auto;
      width: 92px;
      height: 3px;
      border-radius: 0 0 999px 999px;
      background: linear-gradient(90deg, transparent, var(--psc-accent), transparent);
      box-shadow: 0 0 18px color-mix(in srgb, var(--psc-accent) 36%, transparent);
    }
    .wrap > .page-section-directory,
    .shell > .page-section-directory,
    .page-section-directory.page-section-directory--toc {
      width: 100%;
    }
    .page-section-directory__head {
      display: flex;
      align-items: end;
      justify-content: space-between;
      gap: 18px;
      margin-bottom: 16px;
    }
    .page-section-directory__kicker {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      margin-bottom: 4px;
      color: var(--psc-accent);
      font-size: .73rem;
      font-weight: 900;
      letter-spacing: .08em;
    }
    .page-section-directory__kicker::before {
      content: "";
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--psc-accent);
      box-shadow: 0 0 0 5px color-mix(in srgb, var(--psc-accent) 10%, transparent);
    }
    .page-section-directory__title {
      margin: 0;
      color: var(--psc-text);
      font-size: clamp(1.15rem, 2vw, 1.5rem);
      line-height: 1.35;
    }
    .page-section-directory__count {
      flex: 0 0 auto;
      padding: 5px 10px;
      border: 1px solid rgba(255, 255, 255, .09);
      border-radius: 999px;
      color: var(--psc-muted);
      background: rgba(255, 255, 255, .035);
      font-size: .7rem;
      font-weight: 800;
    }
    .page-section-directory__list {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 10px;
    }
    .page-section-card {
      position: relative;
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      align-items: center;
      gap: 10px;
      min-width: 0;
      min-height: 82px;
      padding: 12px;
      border: 1px solid rgba(255, 255, 255, .09);
      border-radius: 17px 7px 17px 7px;
      color: var(--psc-text);
      background: linear-gradient(145deg, rgba(255, 255, 255, .065), rgba(255, 255, 255, .022));
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, .035);
      font: inherit;
      text-align: right;
      text-decoration: none;
      cursor: pointer;
      scroll-snap-align: start;
      transition: transform .22s ease, border-color .22s ease, background .22s ease, box-shadow .22s ease;
    }
    .page-section-card:nth-child(even) { border-radius: 7px 17px 7px 17px; }
    .page-section-card:hover,
    .page-section-card:focus-visible,
    .page-section-card.is-active {
      border-color: color-mix(in srgb, var(--psc-accent) 52%, transparent);
      background: linear-gradient(145deg, color-mix(in srgb, var(--psc-accent) 12%, rgba(255, 255, 255, .055)), rgba(255, 255, 255, .028));
      box-shadow: 0 12px 28px rgba(0, 0, 0, .18), inset 0 1px 0 color-mix(in srgb, var(--psc-accent) 14%, transparent);
      outline: none;
      transform: translateY(-3px);
    }
    .page-section-card:focus-visible {
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--psc-accent) 22%, transparent), 0 12px 28px rgba(0, 0, 0, .18);
    }
    .page-section-card__number {
      display: grid;
      place-items: center;
      width: 34px;
      height: 34px;
      border: 1px solid color-mix(in srgb, var(--psc-accent) 28%, transparent);
      border-radius: 11px;
      color: var(--psc-accent);
      background: color-mix(in srgb, var(--psc-accent) 8%, transparent);
      font-size: .68rem;
      font-weight: 900;
      direction: ltr;
    }
    .page-section-card__copy { min-width: 0; }
    .page-section-card__copy strong {
      display: block;
      overflow: hidden;
      color: var(--psc-text);
      font-size: .88rem;
      line-height: 1.45;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .page-section-card__copy small {
      display: block;
      margin-top: 2px;
      color: var(--psc-muted);
      font-size: .66rem;
      font-weight: 700;
    }
    .page-section-card__arrow {
      color: var(--psc-accent);
      font-size: 1rem;
      transition: transform .22s ease;
    }
    .page-section-card:hover .page-section-card__arrow,
    .page-section-card:focus-visible .page-section-card__arrow { transform: translateX(-3px); }
    .page-section-directory--toc { margin: 24px 0 28px; }
    .page-section-directory--tabs { margin-top: 20px; }
    [id].page-section-card-target { scroll-margin-top: 118px; }
    @media (max-width: 720px) {
      .page-section-directory {
        width: min(100% - 22px, 1180px);
        margin-block: 18px 24px;
        padding: 16px 14px 15px;
        border-radius: 22px 8px 22px 8px;
      }
      .page-section-directory__head { align-items: center; margin-bottom: 12px; }
      .page-section-directory__count { display: none; }
      .page-section-directory__list {
        display: flex;
        gap: 9px;
        overflow-x: auto;
        overscroll-behavior-inline: contain;
        scroll-snap-type: inline mandatory;
        scrollbar-width: thin;
        scrollbar-color: color-mix(in srgb, var(--psc-accent) 35%, transparent) transparent;
        padding: 1px 1px 7px;
      }
      .page-section-card {
        flex: 0 0 min(74vw, 245px);
        min-height: 76px;
      }
      .page-section-directory--toc { width: 100%; margin-inline: 0; }
    }
    @media (prefers-reduced-motion: reduce) {
      .page-section-card, .page-section-card__arrow { transition: none; }
      .page-section-card:hover, .page-section-card:focus-visible { transform: none; }
    }
    @media print { .page-section-directory { display: none !important; } }
  `;
  document.head.appendChild(style);

  const cleanText = value => (value || '').replace(/\s+/g, ' ').trim();
  const toArabicNumber = value => String(value).replace(/\d/g, digit => '٠١٢٣٤٥٦٧٨٩'[digit]);
  const shouldIgnoreHeading = heading => {
    const title = cleanText(heading?.textContent);
    if (!title || title.length > 72 || ignoredTitles.test(title)) return true;
    return Boolean(heading.closest('footer, dialog, [role="dialog"], .modal, .drawer, .page-section-directory'));
  };

  const uniqueItems = items => {
    const titles = new Set();
    return items.filter(item => {
      const title = cleanText(item.title);
      if (!title || titles.has(title)) return false;
      titles.add(title);
      item.title = title;
      return true;
    }).slice(0, MAX_ITEMS);
  };

  const tabTarget = tab => {
    const controls = tab.getAttribute('aria-controls');
    if (controls) return document.getElementById(controls);
    const pairs = [
      ['pmTab', 'pmView'],
      ['portalTab', 'portalView']
    ];
    for (const [tabKey, viewKey] of pairs) {
      if (tab.dataset[tabKey]) return document.querySelector(`[data-${viewKey.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`)}="${tab.dataset[tabKey]}"]`);
    }
    return null;
  };

  const collectTabs = main => {
    const tablists = [...main.querySelectorAll('[role="tablist"]')];
    for (const tablist of tablists) {
      const tabs = [...tablist.querySelectorAll('[role="tab"]')].filter(tab => cleanText(tab.textContent));
      if (tabs.length < 2) continue;
      return {
        kind: 'tabs',
        source: tablist,
        items: uniqueItems(tabs.map(tab => ({ title: tab.textContent, action: tab, target: tabTarget(tab) })))
      };
    }
    return null;
  };

  const collectToc = main => {
    const toc = main.querySelector('.toc');
    if (!toc) return null;
    const links = [...toc.querySelectorAll(':scope > a[href^="#"]')].filter(link => cleanText(link.textContent));
    if (links.length < 2) return null;
    return {
      kind: 'toc',
      source: toc,
      items: uniqueItems(links.map(link => ({
        title: link.textContent,
        action: link,
        target: document.getElementById(decodeURIComponent((link.getAttribute('href') || '').slice(1)))
      })))
    };
  };

  const ensureTarget = (element, index) => {
    const section = element.closest('section, [data-page-section]');
    const target = section && section.querySelectorAll('h2').length <= 1 ? section : element;
    if (!target.id) target.id = `page-section-${index + 1}`;
    target.classList.add('page-section-card-target');
    return target;
  };

  const collectSections = main => {
    const items = [];
    const usedTargets = new Set();
    const sections = [...main.querySelectorAll('section[id]')];
    for (const section of sections) {
      if (structuralIds.has(section.id)) continue;
      const heading = section.querySelector('h2, h1, h3');
      const title = cleanText(heading?.textContent);
      if (!title || title.length > 72 || ignoredTitles.test(title)) continue;
      const nestedParent = section.parentElement?.closest('section[id]');
      if (nestedParent && !structuralIds.has(nestedParent.id)) continue;
      section.classList.add('page-section-card-target');
      usedTargets.add(section);
      items.push({ title: heading.textContent, target: section });
    }

    if (items.length < 3) {
      const headings = [...main.querySelectorAll('h2')];
      for (const heading of headings) {
        if (shouldIgnoreHeading(heading) || heading.closest('details')) continue;
        const target = ensureTarget(heading, items.length);
        if (usedTargets.has(target)) continue;
        usedTargets.add(target);
        items.push({ title: heading.textContent, target });
        if (items.length >= MAX_ITEMS) break;
      }
    }

    if (items.length < 2) {
      const summaries = [...main.querySelectorAll('details > summary')];
      for (const summary of summaries) {
        const target = summary.closest('details');
        if (!target || usedTargets.has(target)) continue;
        if (!target.id) target.id = `page-question-${items.length + 1}`;
        target.classList.add('page-section-card-target');
        usedTargets.add(target);
        items.push({ title: summary.textContent, target });
        if (items.length >= MAX_ITEMS) break;
      }
    }

    if (items.length < 2) {
      const subheadings = [...main.querySelectorAll('h3')];
      for (const heading of subheadings) {
        if (shouldIgnoreHeading(heading)) continue;
        const target = ensureTarget(heading, items.length);
        if (usedTargets.has(target)) continue;
        usedTargets.add(target);
        items.push({ title: heading.textContent, target });
        if (items.length >= MAX_ITEMS) break;
      }
    }

    items.sort((first, second) => {
      if (first.target === second.target) return 0;
      return first.target.compareDocumentPosition(second.target) & 4 ? -1 : 1;
    });

    return uniqueItems(items);
  };

  const buildHead = count => {
    const head = document.createElement('div');
    head.className = 'page-section-directory__head';
    const copy = document.createElement('div');
    const kicker = document.createElement('span');
    kicker.className = 'page-section-directory__kicker';
    kicker.textContent = 'دليل الصفحة';
    const title = document.createElement('h2');
    title.className = 'page-section-directory__title';
    title.textContent = 'محتويات هذه الصفحة';
    copy.append(kicker, title);
    const total = document.createElement('span');
    total.className = 'page-section-directory__count';
    total.textContent = `${toArabicNumber(count)} أقسام`;
    head.append(copy, total);
    return head;
  };

  const decorateCard = (control, item, index) => {
    control.classList.add('page-section-card');
    if (control.tagName === 'BUTTON') control.type = 'button';
    control.replaceChildren();

    const number = document.createElement('span');
    number.className = 'page-section-card__number';
    number.textContent = toArabicNumber(String(index + 1).padStart(2, '0'));
    number.setAttribute('aria-hidden', 'true');

    const copy = document.createElement('span');
    copy.className = 'page-section-card__copy';
    const strong = document.createElement('strong');
    strong.textContent = item.title;
    const small = document.createElement('small');
    small.textContent = item.action?.getAttribute('role') === 'tab' ? 'فتح التبويب' : 'انتقل للقسم';
    copy.append(strong, small);

    const arrow = document.createElement('span');
    arrow.className = 'page-section-card__arrow';
    arrow.textContent = '←';
    arrow.setAttribute('aria-hidden', 'true');
    control.append(number, copy, arrow);
    return control;
  };

  const bindAnchor = (control, target) => {
    if (!target) return;
    target.classList.add('page-section-card-target');
    control.setAttribute('href', `#${encodeURIComponent(target.id)}`);
    control.addEventListener('click', event => {
      event.preventDefault();
      target.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'start' });
      history.replaceState(null, '', `#${encodeURIComponent(target.id)}`);
    });
  };

  const observeTargets = cards => {
    if (!('IntersectionObserver' in window)) return;
    const byTarget = new Map(cards.filter(entry => entry.target).map(entry => [entry.target, entry.control]));
    if (!byTarget.size) return;
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        for (const card of byTarget.values()) card.classList.remove('is-active');
        const active = byTarget.get(entry.target);
        active?.classList.add('is-active');
      }
    }, { rootMargin: '-22% 0px -64% 0px', threshold: 0 });
    for (const target of byTarget.keys()) observer.observe(target);
  };

  const upgradeToc = source => {
    const result = collectToc(document.querySelector('main'));
    if (!result) return;
    const { items } = result;
    const grid = document.createElement('div');
    grid.className = 'page-section-directory__list';
    const cards = [];
    items.forEach((item, index) => {
      const link = decorateCard(item.action, item, index);
      bindAnchor(link, item.target);
      grid.appendChild(link);
      cards.push({ control: link, target: item.target });
    });
    source.replaceChildren(buildHead(items.length), grid);
    source.classList.add('page-section-directory', 'page-section-directory--toc');
    source.setAttribute('aria-label', 'محتويات الصفحة');
    observeTargets(cards);
  };

  const insertDirectory = (main, result) => {
    const directory = document.createElement('nav');
    directory.className = `page-section-directory page-section-directory--${result.kind}`;
    directory.setAttribute('aria-label', 'محتويات الصفحة');
    const grid = document.createElement('div');
    grid.className = 'page-section-directory__list';
    const cards = [];

    result.items.forEach((item, index) => {
      const control = document.createElement(item.action ? 'button' : 'a');
      decorateCard(control, item, index);
      if (item.action) {
        control.addEventListener('click', () => {
          item.action.click();
          window.setTimeout(() => {
            (item.target || result.source).scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'start' });
          }, 40);
        });
      } else {
        bindAnchor(control, item.target);
      }
      grid.appendChild(control);
      cards.push({ control, target: item.target });
    });
    directory.append(buildHead(result.items.length), grid);

    if (result.kind === 'tabs') {
      result.source.insertAdjacentElement('beforebegin', directory);
    } else {
      const hero = main.querySelector(':scope > .hero, :scope > section.hero, :scope > .wrap > .hero, :scope > .shell > .hero');
      const heroStartsContainer = hero && hero === hero.parentElement?.firstElementChild;
      const pageTitle = main.querySelector('h1');
      if (heroStartsContainer) hero.insertAdjacentElement('afterend', directory);
      else if (pageTitle && !pageTitle.closest('section')) pageTitle.insertAdjacentElement('afterend', directory);
      else main.insertAdjacentElement('afterbegin', directory);
    }
    observeTargets(cards);
  };

  const init = () => {
    const legacyContainer = [...document.querySelectorAll('body > .container')].find(container => container.querySelector('h2, h3'));
    const main = document.querySelector('main') || legacyContainer;
    if (!main || document.querySelector('.page-section-directory')) return;

    const tocResult = collectToc(main);
    if (tocResult) {
      upgradeToc(tocResult.source);
      return;
    }

    const tabResult = collectTabs(main);
    if (tabResult) {
      insertDirectory(main, tabResult);
      return;
    }

    const items = collectSections(main);
    if (items.length < 2) return;
    insertDirectory(main, { kind: 'sections', source: main, items });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
