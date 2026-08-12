import { arSA } from '@clerk/localizations/ar-SA';

const customerLocalization = {
  ...arSA,
  formFieldLabel__emailAddress: 'البريد الإلكتروني',
  formFieldInputPlaceholder__emailAddress: 'أدخل بريدك الإلكتروني',
  formFieldInputPlaceholder__emailAddress_username: 'أدخل بريدك الإلكتروني',
  socialButtonsBlockButton: 'المتابعة باستخدام {{provider|titleize}}',
  signIn: {
    ...arSA.signIn,
    emailCode: {
      ...arSA.signIn.emailCode,
      formTitle: 'رمز التحقق',
      subtitle: 'أدخل الرمز المرسل إلى بريدك الإلكتروني',
      title: 'تحقق من بريدك الإلكتروني'
    },
    start: {
      ...arSA.signIn.start,
      subtitle: 'أدخل بريدك الإلكتروني للمتابعة بأمان',
      subtitleCombined: 'أدخل بريدك الإلكتروني للمتابعة بأمان',
      title: 'تسجيل الدخول'
    }
  }
};

export default function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    || process.env.CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    return response.status(503).json({ error: 'Authentication is not configured' });
  }

  response.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300, stale-while-revalidate=600');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  return response.status(200).json({ publishableKey, localization: customerLocalization });
}
