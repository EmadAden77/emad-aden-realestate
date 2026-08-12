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

function clerkAppearance(mode = 'office') {
  const monochrome = mode === 'monochrome';
  const palette = monochrome
    ? {
        primary: '#ffffff',
        primaryForeground: '#121416',
        foreground: '#ffffff',
        mutedForeground: '#c9ccd1',
        background: '#1b1d20',
        border: 'rgba(255,255,255,.24)',
        ring: '#ffffff',
        neutral: '#aeb2b8',
        danger: '#f4f4f4',
        success: '#f4f4f4',
        link: '#ffffff',
        input: '#ffffff',
        socialBackground: '#25272b',
        socialBorder: 'rgba(255,255,255,.2)',
        buttonBackground: '#ffffff',
        buttonShadow: '0 14px 34px rgba(0,0,0,.32)'
      }
    : {
        primary: '#d8b56c',
        primaryForeground: '#111315',
        foreground: '#f7f3e9',
        mutedForeground: '#c5c9cf',
        background: '#151719',
        border: 'rgba(216,181,108,.3)',
        ring: '#efd99f',
        neutral: '#aeb4bc',
        danger: '#ef6b68',
        success: '#4ac58a',
        link: '#efd99f',
        input: '#f7f3e9',
        socialBackground: 'rgba(255,255,255,.06)',
        socialBorder: 'rgba(255,255,255,.15)',
        buttonBackground: 'linear-gradient(135deg,#efd28b,#d4a94f)',
        buttonShadow: '0 12px 30px rgba(216,181,108,.2)'
      };

  return {
    variables: {
      colorPrimary: palette.primary,
      colorPrimaryForeground: palette.primaryForeground,
      colorForeground: palette.foreground,
      colorMutedForeground: palette.mutedForeground,
      colorBackground: palette.background,
      colorInput: palette.input,
      colorInputForeground: '#111315',
      colorBorder: palette.border,
      colorRing: palette.ring,
      colorNeutral: palette.neutral,
      colorDanger: palette.danger,
      colorSuccess: palette.success,
      borderRadius: '14px',
      spacing: '1rem',
      fontFamily: 'Tajawal, Arial, sans-serif',
      fontFamilyButtons: 'Tajawal, Arial, sans-serif'
    },
    elements: {
      rootBox: { width: '100%' },
      cardBox: { boxShadow: 'none', width: '100%', maxWidth: 'none' },
      card: {
        width: '100%',
        padding: '18px 0 0',
        border: '0',
        background: 'transparent',
        boxShadow: 'none'
      },
      header: { marginBottom: '20px', textAlign: 'right' },
      headerTitle: { color: palette.foreground, fontSize: '1.35rem', fontWeight: '900' },
      headerSubtitle: { color: palette.mutedForeground, fontSize: '.92rem', lineHeight: '1.75' },
      socialButtonsBlockButton: {
        minHeight: '52px',
        border: `1px solid ${palette.socialBorder}`,
        background: palette.socialBackground,
        color: palette.foreground,
        boxShadow: 'none'
      },
      socialButtonsBlockButtonText: { color: palette.foreground, fontWeight: '800' },
      dividerLine: { background: 'rgba(255,255,255,.12)' },
      dividerText: { color: palette.mutedForeground, fontWeight: '700' },
      formFieldLabel: { color: palette.foreground, fontWeight: '800' },
      formFieldInput: {
        minHeight: '54px',
        border: '2px solid transparent',
        background: '#f7f3e9',
        color: '#111315',
        fontSize: '16px',
        boxShadow: 'none'
      },
      formButtonPrimary: {
        minHeight: '54px',
        background: palette.buttonBackground,
        color: '#111315',
        fontSize: '1rem',
        fontWeight: '900',
        boxShadow: palette.buttonShadow
      },
      footerActionText: { color: palette.mutedForeground },
      footerActionLink: { color: palette.link, fontWeight: '900' },
      identityPreviewText: { color: palette.foreground },
      identityPreviewEditButton: { color: palette.link },
      formFieldErrorText: { color: palette.danger },
      alertText: { color: palette.foreground }
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
    appearance: clerkAppearance('monochrome')
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
