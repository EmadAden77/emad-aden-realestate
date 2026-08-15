(() => {
  'use strict';
  if (window.__emadSiteAnalyticsLoaded) return;
  window.__emadSiteAnalyticsLoaded = true;

  const measurementId = 'G-17ZZZFR8HT';
  const doNotTrack = navigator.doNotTrack === '1' || window.doNotTrack === '1';
  const clean = value => String(value || '').replace(/\s+/g, ' ').trim().slice(0, 100);
  const pagePath = () => `${location.pathname}${location.hash || ''}`.slice(0, 200);

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments); };
  window.emadTrackEvent = (name, parameters = {}) => {
    if (doNotTrack || !/^[a-z][a-z0-9_]{1,39}$/.test(name)) return;
    const safeParameters = { page_path: pagePath() };
    Object.entries(parameters).slice(0, 12).forEach(([key, value]) => {
      if (/^[a-z][a-z0-9_]{1,39}$/.test(key) && ['string', 'number', 'boolean'].includes(typeof value)) {
        safeParameters[key] = typeof value === 'string' ? clean(value) : value;
      }
    });
    window.gtag('event', name, safeParameters);
  };

  if (!doNotTrack) {
    window.gtag('consent', 'default', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      wait_for_update: 500
    });
    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      send_page_view: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      anonymize_ip: true
    });
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.append(script);
  }

  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link) return;
    let url;
    try { url = new URL(link.href, location.href); } catch { return; }
    const context = clean(link.dataset.analyticsLabel || link.getAttribute('aria-label') || link.textContent);
    const pathname = url.pathname.toLowerCase();
    const hostname = url.hostname.toLowerCase();

    if (hostname === 'wa.me' || hostname.endsWith('whatsapp.com')) {
      window.emadTrackEvent('contact_whatsapp', { link_context: context });
    } else if (url.protocol === 'tel:') {
      window.emadTrackEvent('contact_call', { link_context: context });
    } else if (pathname.endsWith('/sign-in.html') || pathname.endsWith('sign-in.html')) {
      window.emadTrackEvent('portal_sign_in_click', { link_context: context });
    } else if (pathname.endsWith('/customer-account.html') || pathname.endsWith('customer-account.html')) {
      window.emadTrackEvent('portal_open', { link_context: context });
    } else if (link.closest('.service-card')) {
      window.emadTrackEvent('service_select', { link_context: context });
    } else if (link.closest('.tool-card')) {
      window.emadTrackEvent('tool_select', { link_context: context });
    } else if (['facebook.com', 'instagram.com', 'x.com'].some(domain => hostname === domain || hostname.endsWith(`.${domain}`))) {
      window.emadTrackEvent('social_click', { social_network: hostname.replace(/^www\./, ''), link_context: context });
    } else if (url.origin !== location.origin && ['http:', 'https:'].includes(url.protocol)) {
      window.emadTrackEvent('outbound_click', { destination_host: hostname, link_context: context });
    }
  });

  document.addEventListener('submit', event => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    window.emadTrackEvent('form_submit', {
      form_id: clean(form.id || form.getAttribute('name') || 'unnamed_form')
    });
  });
})();
