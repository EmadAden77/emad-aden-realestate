const CONFIG_ENDPOINT = '/api/auth-config';
const ACCOUNT_PATH = '/customer-account.html';
const SIGN_IN_PATH = '/sign-in.html';

let clerkPromise;

function loadScript(src, attributes = {}) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === 'true') resolve();
      else {
        existing.addEventListener('load', resolve, { once: true });
        existing.addEventListener('error', reject, { once: true });
      }
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.crossOrigin = 'anonymous';
    Object.entries(attributes).forEach(([name, value]) => script.setAttribute(name, value));
    script.addEventListener('load', () => {
      script.dataset.loaded = 'true';
      resolve();
    }, { once: true });
    script.addEventListener('error', () => reject(new Error('تعذر تحميل خدمة تسجيل الدخول.')), { once: true });
    document.head.appendChild(script);
  });
}

function decodeFrontendDomain(publishableKey) {
  const encoded = publishableKey.split('_')[2];
  if (!encoded) throw new Error('مفتاح تسجيل الدخول غير صالح.');
  return atob(encoded).slice(0, -1);
}

function clerkAppearance() {
  return {
    variables: {
      colorPrimary: '#d8b56c',
      colorBackground: '#111315',
      colorInputBackground: '#181a1d',
      colorInputText: '#f7f3e9',
      colorText: '#f7f3e9',
      colorTextSecondary: '#aeb4bc',
      colorDanger: '#ef6b68',
      borderRadius: '14px',
      fontFamily: 'Tajawal, Arial, sans-serif'
    },
    elements: {
      cardBox: { boxShadow: 'none', width: '100%' },
      card: { boxShadow: 'none', border: '1px solid rgba(216,181,108,.2)' },
      footerActionLink: { color: '#efd99f' },
      formButtonPrimary: { color: '#111', fontWeight: '900' }
    }
  };
}

export function getClerk() {
  if (clerkPromise) return clerkPromise;

  clerkPromise = (async () => {
    const response = await fetch(CONFIG_ENDPOINT, {
      headers: { Accept: 'application/json' },
      cache: 'no-store'
    });
    if (!response.ok) throw new Error('لم يكتمل إعداد خدمة تسجيل الدخول بعد.');

    const config = await response.json();
    const frontendDomain = decodeFrontendDomain(config.publishableKey);

    await loadScript(`https://${frontendDomain}/npm/@clerk/ui@1/dist/ui.browser.js`);
    await loadScript(
      `https://${frontendDomain}/npm/@clerk/clerk-js@6/dist/clerk.browser.js`,
      { 'data-clerk-publishable-key': config.publishableKey }
    );

    if (!window.Clerk) throw new Error('تعذر بدء خدمة تسجيل الدخول.');
    await window.Clerk.load({
      ui: { ClerkUI: window.__internal_ClerkUICtor },
      localization: config.localization
    });
    return window.Clerk;
  })();

  return clerkPromise;
}

function safeRedirectPath(value, fallback = ACCOUNT_PATH) {
  if (!value) return fallback;
  try {
    const url = new URL(value, window.location.origin);
    if (url.origin !== window.location.origin || !url.pathname.endsWith('.html')) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

export async function mountCustomerSignIn(target) {
  const redirectPath = safeRedirectPath(new URLSearchParams(window.location.search).get('redirect_url'));
  const clerk = await getClerk();
  if (clerk.isSignedIn) {
    window.location.replace(redirectPath);
    return;
  }

  clerk.mountSignIn(target, {
    routing: 'hash',
    fallbackRedirectUrl: redirectPath,
    signUpFallbackRedirectUrl: redirectPath,
    appearance: clerkAppearance()
  });
}

export async function loadCustomerAccount(options = {}) {
  const accountPath = safeRedirectPath(options.accountPath, ACCOUNT_PATH);
  const clerk = await getClerk();
  if (!clerk.isSignedIn || !clerk.session) {
    window.location.replace(`${SIGN_IN_PATH}?redirect_url=${encodeURIComponent(accountPath)}`);
    return null;
  }

  const token = await clerk.session.getToken();
  const response = await fetch('/api/customer-session', {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`
    },
    cache: 'no-store'
  });

  if (!response.ok) {
    await clerk.signOut();
    window.location.replace(`${SIGN_IN_PATH}?redirect_url=${encodeURIComponent(accountPath)}`);
    return null;
  }

  const session = await response.json();
  return { clerk, session, appearance: clerkAppearance() };
}
