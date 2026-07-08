/**
 * i18n — Internationalization foundation.
 * Currently English-only, structured for easy Hindi/Tamil addition.
 * Usage: const { t } = useTranslation(); t('nav.dashboard')
 */

export type Locale = "en" | "hi" | "ta";

export const translations: Record<Locale, Record<string, string>> = {
  en: {
    "nav.dashboard": "Dashboard",
    "nav.portfolio": "Portfolio Analytics",
    "nav.cashflow": "Cashflow & Runway",
    "nav.liabilities": "Debt Management",
    "nav.goals": "Goal Simulations",
    "nav.retirement": "Retirement & FIRE",
    "nav.finance": "Financial Health",
    "nav.tax": "Tax Readiness",
    "nav.reports": "Reports & Audits",
    "nav.documents": "Document Vault",
    "nav.estate": "Estate Planning",
    "nav.assistant": "AI Assistant",
    "nav.settings": "Settings",
    "auth.welcome": "Welcome back",
    "auth.createAccount": "Create account",
    "auth.signIn": "Sign in to access your dashboard",
    "auth.signUp": "Start your financial journey today",
    "auth.authenticate": "Authenticate",
    "auth.initializeAccount": "Initialize Account",
    "auth.email": "Email Address",
    "auth.password": "Security Key",
    "auth.name": "Legal Name",
    "auth.demoCreds": "Demo Credentials",
    "auth.forgot": "Forgot?",
    "common.loading": "Loading...",
    "common.retry": "Try Again",
    "common.goDashboard": "Go to Dashboard",
    "common.somethingWrong": "Something went wrong",
    "tax.readiness": "Tax Readiness",
    "tax.score": "Tax Readiness Score",
    "tax.regimeComparison": "Regime Comparison",
    "tax.oldRegime": "Old Regime",
    "tax.newRegime": "New Regime",
    "tax.savings": "Estimated Savings",
    "tax.recommendation": "Recommendation",
    "tax.missingDocs": "Missing Documents",
    "finance.health": "Financial Health",
    "finance.savingsRate": "Savings Rate",
    "finance.diRatio": "D/I Ratio",
    "finance.emergency": "Emergency Fund",
    "finance.subscriptions": "Subscriptions",
    "finance.suggestions": "AI Suggestions",
  },
  hi: {
    "nav.dashboard": "डैशबोर्ड",
    "nav.portfolio": "पोर्टफोलियो एनालिटिक्स",
    "nav.cashflow": "कैशफ्लो और रनवे",
    "nav.liabilities": "कर्ज प्रबंधन",
    "nav.goals": "लक्ष्य सिमुलेशन",
    "nav.retirement": "सेवानिवृत्ति और FIRE",
    "nav.finance": "वित्तीय स्वास्थ्य",
    "nav.tax": "कर तैयारी",
    "nav.reports": "रिपोर्ट और ऑडिट",
    "nav.documents": "दस्तावेज़ वॉल्ट",
    "nav.estate": "एस्टेट प्लानिंग",
    "nav.assistant": "AI सहायक",
    "nav.settings": "सेटिंग्स",
    "auth.welcome": "वापसी पर स्वागत है",
    "auth.createAccount": "खाता बनाएं",
    "auth.signIn": "अपने डैशबोर्ड तक पहुंचने के लिए साइन इन करें",
    "auth.signUp": "आज ही अपनी वित्तीय यात्रा शुरू करें",
    "auth.authenticate": "प्रमाणित करें",
    "auth.initializeAccount": "खाता शुरू करें",
    "auth.email": "ईमेल पता",
    "auth.password": "सुरक्षा कुंजी",
    "auth.name": "कानूनी नाम",
    "auth.demoCreds": "डेमो क्रेडेंशियल",
    "auth.forgot": "भूल गए?",
    "common.loading": "लोड हो रहा है...",
    "common.retry": "पुनः प्रयास करें",
    "common.goDashboard": "डैशबोर्ड पर जाएं",
    "common.somethingWrong": "कुछ गलत हो गया",
    "tax.readiness": "कर तैयारी",
    "tax.score": "कर तैयारी स्कोर",
    "tax.regimeComparison": "राजव्यवस्था तुलना",
    "tax.oldRegime": "पुरानी राजव्यवस्था",
    "tax.newRegime": "नई राजव्यवस्था",
    "tax.savings": "अनुमानित बचत",
    "tax.recommendation": "सिफारिश",
    "tax.missingDocs": "गायब दस्तावेज़",
    "finance.health": "वित्तीय स्वास्थ्य",
    "finance.savingsRate": "बचत दर",
    "finance.diRatio": "D/I अनुपात",
    "finance.emergency": "आपातकालीन निधि",
    "finance.subscriptions": "सदस्यता",
    "finance.suggestions": "AI सुझाव",
  },
  ta: {
    "nav.dashboard": "டாஷ்போர்டு",
    "nav.portfolio": "போர்ட்ஃபோலியோ அனலிட்டிக்ஸ்",
    "nav.cashflow": "காசுஃப்ளோ & ரன்வே",
    "nav.liabilities": "கடன் மேலாண்மை",
    "nav.goals": "இலக்கு சிமுலேஷன்",
    "nav.retirement": "ஓய்வூதியம் & FIRE",
    "nav.finance": "நிதி ஆரோக்கியம்",
    "nav.tax": "வரி தயார்நிலை",
    "nav.reports": "அறிக்கைகள் & தணிக்கை",
    "nav.documents": "ஆவண பெட்டி",
    "nav.estate": "எஸ்டேட் திட்டமிடல்",
    "nav.assistant": "AI உதவியாளர்",
    "nav.settings": "அமைப்புகள்",
    "auth.welcome": "மீண்டும் வரவேற்கிறோம்",
    "auth.createAccount": "கணக்கை உருவாக்கு",
    "auth.signIn": "உங்கள் டாஷ்போர்டு அணுக உள்நுழையவும்",
    "auth.signUp": "இன்று உங்கள் நிதி பயணத்தை தொடங்குங்கள்",
    "auth.authenticate": "அங்கீகரி",
    "auth.initializeAccount": "கணக்கை தொடங்கு",
    "auth.email": "மின்னஞ்சல் முகவரி",
    "auth.password": "பாதுகாப்பு விசை",
    "auth.name": "சட்டபூர்வ பெயர்",
    "auth.demoCreds": "டெமோ நற்சான்றிதழ்கள்",
    "auth.forgot": "மறந்துவிட்டதா?",
    "common.loading": "ஏற்றுகிறது...",
    "common.retry": "மீண்டும் முயற்சிக்கவும்",
    "common.goDashboard": "டாஷ்போர்டுக்கு செல்",
    "common.somethingWrong": "ஏதோ தவறு நடந்தது",
    "tax.readiness": "வரி தயார்நிலை",
    "tax.score": "வரி தயார்நிலை மதிப்பெண்",
    "tax.regimeComparison": "ஆட்சி ஒப்பீடு",
    "tax.oldRegime": "பழைய ஆட்சி",
    "tax.newRegime": "புதிய ஆட்சி",
    "tax.savings": "மதிப்பிடப்பட்ட சேமிப்பு",
    "tax.recommendation": "பரிந்துரை",
    "tax.missingDocs": "விடுபட்ட ஆவணங்கள்",
    "finance.health": "நிதி ஆரோக்கியம்",
    "finance.savingsRate": "சேமிப்பு விகிதம்",
    "finance.diRatio": "D/I விகிதம்",
    "finance.emergency": "அவசர நிதி",
    "finance.subscriptions": "சந்தாக்கள்",
    "finance.suggestions": "AI பரிந்துரைகள்",
  },
};

let currentLocale: Locale = "en";

export function setLocale(locale: Locale) {
  currentLocale = locale;
  if (typeof window !== "undefined") localStorage.setItem("artha_locale", locale);
}

export function getLocale(): Locale {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("artha_locale") as Locale | null;
    if (stored && translations[stored]) currentLocale = stored;
  }
  return currentLocale;
}

export function t(key: string): string {
  return translations[currentLocale]?.[key] ?? translations.en[key] ?? key;
}
