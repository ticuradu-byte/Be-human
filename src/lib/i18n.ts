// src/lib/i18n.ts
// Sistem traduceri be-human — Română + Engleză + Germană
// Utilizare: const t = useTranslations(); t('dashboard.title')

export type Limba = 'ro' | 'en' | 'de'

export const TRADUCERI = {

  // ── GENERAL ──────────────────────────────────────────────────────────────
  'app.name': {
    ro: 'be-human',
    en: 'be-human',
    de: 'be-human',
  },
  'app.tagline': {
    ro: 'Agentul tău personal de wellness',
    en: 'Your personal wellness agent',
    de: 'Dein persönlicher Wellness-Agent',
  },

  // ── AUTH ──────────────────────────────────────────────────────────────────
  'auth.login': {
    ro: 'Intră în cont',
    en: 'Sign in',
    de: 'Anmelden',
  },
  'auth.register': {
    ro: 'Creează cont',
    en: 'Create account',
    de: 'Konto erstellen',
  },
  'auth.google': {
    ro: 'Continuă cu Google',
    en: 'Continue with Google',
    de: 'Mit Google fortfahren',
  },
  'auth.email': {
    ro: 'Email',
    en: 'Email',
    de: 'E-Mail',
  },
  'auth.password': {
    ro: 'Parolă',
    en: 'Password',
    de: 'Passwort',
  },
  'auth.no_account': {
    ro: 'Nu ai cont?',
    en: "Don't have an account?",
    de: 'Kein Konto?',
  },
  'auth.have_account': {
    ro: 'Ai deja cont?',
    en: 'Already have an account?',
    de: 'Haben Sie bereits ein Konto?',
  },

  // ── DASHBOARD ─────────────────────────────────────────────────────────────
  'dashboard.hello': {
    ro: 'Bună',
    en: 'Hello',
    de: 'Hallo',
  },
  'dashboard.new_analysis': {
    ro: '+ Analiză Nouă',
    en: '+ New Analysis',
    de: '+ Neue Analyse',
  },
  'dashboard.score_yesterday': {
    ro: 'SCORUL DE IERI',
    en: "YESTERDAY'S SCORE",
    de: 'GESTRIGER SCORE',
  },
  'dashboard.trend_14': {
    ro: 'TREND 14 ZILE',
    en: '14-DAY TREND',
    de: '14-TAGE-TREND',
  },
  'dashboard.complete_journal': {
    ro: 'Completează jurnalul pentru scor',
    en: 'Complete journal for score',
    de: 'Journal für Score ausfüllen',
  },
  'dashboard.no_analysis': {
    ro: 'Nicio analiză încă',
    en: 'No analysis yet',
    de: 'Noch keine Analyse',
  },
  'dashboard.first_analysis': {
    ro: 'Prima analiză →',
    en: 'First analysis →',
    de: 'Erste Analyse →',
  },
  'dashboard.recent_analyses': {
    ro: 'Analize recente',
    en: 'Recent analyses',
    de: 'Letzte Analysen',
  },
  'dashboard.see_all': {
    ro: 'Vezi tot →',
    en: 'See all →',
    de: 'Alle anzeigen →',
  },
  'dashboard.total_analyses': {
    ro: 'Analize total',
    en: 'Total analyses',
    de: 'Analysen gesamt',
  },
  'dashboard.journal_days': {
    ro: 'Zile jurnal',
    en: 'Journal days',
    de: 'Tagebuch-Tage',
  },
  'dashboard.analyses_month': {
    ro: 'Analize luna',
    en: 'Analyses this month',
    de: 'Analysen diesen Monat',
  },

  // ── SIDEBAR ───────────────────────────────────────────────────────────────
  'nav.dashboard': {
    ro: 'Dashboard',
    en: 'Dashboard',
    de: 'Dashboard',
  },
  'nav.analysis': {
    ro: 'Analiză Nouă',
    en: 'New Analysis',
    de: 'Neue Analyse',
  },
  'nav.journal': {
    ro: 'Jurnal Zilnic',
    en: 'Daily Journal',
    de: 'Tagesjournal',
  },
  'nav.wearables': {
    ro: 'Wearables',
    en: 'Wearables',
    de: 'Wearables',
  },
  'nav.history': {
    ro: 'Istoric & Trend',
    en: 'History & Trend',
    de: 'Verlauf & Trend',
  },
  'nav.prediction': {
    ro: 'Predicție Sănătate',
    en: 'Health Prediction',
    de: 'Gesundheitsvorhersage',
  },
  'nav.profile': {
    ro: 'Profilul meu',
    en: 'My Profile',
    de: 'Mein Profil',
  },
  'nav.account': {
    ro: 'Contul meu',
    en: 'My Account',
    de: 'Mein Konto',
  },
  'nav.analyses_left': {
    ro: 'analize rămase',
    en: 'analyses left',
    de: 'Analysen übrig',
  },
  'nav.upgrade': {
    ro: 'Upgrade →',
    en: 'Upgrade →',
    de: 'Upgrade →',
  },

  // ── ANALIZA ───────────────────────────────────────────────────────────────
  'analysis.title': {
    ro: 'Analiză Wellness',
    en: 'Wellness Analysis',
    de: 'Wellness-Analyse',
  },
  'analysis.subtitle': {
    ro: 'Medicină funcțională · Studii reale citate · Personalizat',
    en: 'Functional medicine · Real studies cited · Personalized',
    de: 'Funktionelle Medizin · Echte Studien zitiert · Personalisiert',
  },
  'analysis.profile': {
    ro: 'Profilul tău',
    en: 'Your profile',
    de: 'Dein Profil',
  },
  'analysis.profile_placeholder': {
    ro: 'Vârstă, sex, greutate, înălțime, activitate fizică, obiective, medicație...',
    en: 'Age, sex, weight, height, physical activity, goals, medication...',
    de: 'Alter, Geschlecht, Gewicht, Größe, körperliche Aktivität, Ziele, Medikamente...',
  },
  'analysis.example': {
    ro: '✨ Exemplu',
    en: '✨ Example',
    de: '✨ Beispiel',
  },
  'analysis.analyze_btn': {
    ro: '🌿 Analizează cu Medicina Funcțională',
    en: '🌿 Analyze with Functional Medicine',
    de: '🌿 Mit Funktioneller Medizin analysieren',
  },
  'analysis.loading': {
    ro: '⏳ Analizez...',
    en: '⏳ Analyzing...',
    de: '⏳ Analysiere...',
  },
  'analysis.disclaimer': {
    ro: 'be-human nu este un serviciu medical. Rapoartele sunt educaționale. Urgențe: 112',
    en: 'be-human is not a medical service. Reports are educational. Emergency: 112',
    de: 'be-human ist kein medizinischer Dienst. Berichte sind pädagogisch. Notruf: 112',
  },
  'analysis.sources_active': {
    ro: 'surse active',
    en: 'active sources',
    de: 'aktive Quellen',
  },

  // ── SURSE DATE ────────────────────────────────────────────────────────────
  'source.medical_analyses': {
    ro: 'Analize Medicale',
    en: 'Medical Analyses',
    de: 'Medizinische Analysen',
  },
  'source.wearable': {
    ro: 'Smartwatch/Wearable',
    en: 'Smartwatch/Wearable',
    de: 'Smartwatch/Wearable',
  },
  'source.nutrition': {
    ro: 'Nutriție',
    en: 'Nutrition',
    de: 'Ernährung',
  },
  'source.vitals': {
    ro: 'Vitale',
    en: 'Vitals',
    de: 'Vitalwerte',
  },
  'source.cycle': {
    ro: 'Ciclu Menstrual',
    en: 'Menstrual Cycle',
    de: 'Menstruationszyklus',
  },
  'source.glucose': {
    ro: 'Glicemie (CGM)',
    en: 'Glucose (CGM)',
    de: 'Glukose (CGM)',
  },
  'source.supplements': {
    ro: 'Suplimente',
    en: 'Supplements',
    de: 'Nahrungsergänzung',
  },
  'source.screen': {
    ro: 'Screen Time',
    en: 'Screen Time',
    de: 'Bildschirmzeit',
  },
  'source.meds': {
    ro: 'Medicație & Boli',
    en: 'Medication & Conditions',
    de: 'Medikamente & Erkrankungen',
  },
  'source.notes': {
    ro: 'Note & Simptome',
    en: 'Notes & Symptoms',
    de: 'Notizen & Symptome',
  },

  // ── TABS REZULTAT ─────────────────────────────────────────────────────────
  'tab.overview': {
    ro: '📊 Overview',
    en: '📊 Overview',
    de: '📊 Überblick',
  },
  'tab.insights': {
    ro: '💡 Insights',
    en: '💡 Insights',
    de: '💡 Erkenntnisse',
  },
  'tab.nutrition': {
    ro: '🥗 Nutriție',
    en: '🥗 Nutrition',
    de: '🥗 Ernährung',
  },
  'tab.hormones': {
    ro: '⚗️ Hormoni',
    en: '⚗️ Hormones',
    de: '⚗️ Hormone',
  },
  'tab.sport': {
    ro: '🏃 Sport',
    en: '🏃 Sport',
    de: '🏃 Sport',
  },
  'tab.sleep': {
    ro: '😴 Somn',
    en: '😴 Sleep',
    de: '😴 Schlaf',
  },
  'tab.mental': {
    ro: '🧠 Mental',
    en: '🧠 Mental',
    de: '🧠 Mental',
  },
  'tab.sexual': {
    ro: '🌹 Sexual',
    en: '🌹 Sexual Health',
    de: '🌹 Sexualgesundheit',
  },
  'tab.antiaging': {
    ro: '⏳ Anti-aging',
    en: '⏳ Anti-aging',
    de: '⏳ Anti-Aging',
  },
  'tab.myths': {
    ro: '🚫 Mituri',
    en: '🚫 Myths',
    de: '🚫 Mythen',
  },

  // ── RAPORT ────────────────────────────────────────────────────────────────
  'report.title': {
    ro: 'Raportul tău wellness',
    en: 'Your wellness report',
    de: 'Dein Wellness-Bericht',
  },
  'report.new': {
    ro: '← Analiză nouă',
    en: '← New analysis',
    de: '← Neue Analyse',
  },
  'report.most_important': {
    ro: '⚡ Cel mai important lucru AZI',
    en: '⚡ The most important thing TODAY',
    de: '⚡ Das Wichtigste HEUTE',
  },
  'report.all_insights': {
    ro: 'Toate insights-urile →',
    en: 'All insights →',
    de: 'Alle Erkenntnisse →',
  },
  'report.concrete_action': {
    ro: '✅ Acțiune concretă',
    en: '✅ Concrete action',
    de: '✅ Konkrete Maßnahme',
  },
  'report.urgent_consult': {
    ro: 'Consultă un medic urgent',
    en: 'Consult a doctor urgently',
    de: 'Arzt dringend aufsuchen',
  },
  'report.recommended_consult': {
    ro: 'Consult medical recomandat',
    en: 'Medical consultation recommended',
    de: 'Ärztliche Beratung empfohlen',
  },
  'report.negative_cycle': {
    ro: '⚠️ Ciclu Negativ',
    en: '⚠️ Negative Cycle',
    de: '⚠️ Negativer Kreislauf',
  },

  // ── JURNAL ────────────────────────────────────────────────────────────────
  'journal.title': {
    ro: 'Jurnal Zilnic',
    en: 'Daily Journal',
    de: 'Tagesjournal',
  },
  'journal.energy': {
    ro: 'NIVELUL DE ENERGIE AZI',
    en: "TODAY'S ENERGY LEVEL",
    de: 'ENERGIELEVEL HEUTE',
  },
  'journal.mood': {
    ro: 'DISPOZIȚIA GENERALĂ',
    en: 'GENERAL MOOD',
    de: 'ALLGEMEINE STIMMUNG',
  },
  'journal.hunger': {
    ro: 'NIVELUL DE FOAME',
    en: 'HUNGER LEVEL',
    de: 'HUNGER-NIVEAU',
  },
  'journal.exhausted': {
    ro: 'Epuizat',
    en: 'Exhausted',
    de: 'Erschöpft',
  },
  'journal.tired': {
    ro: 'Obosit',
    en: 'Tired',
    de: 'Müde',
  },
  'journal.normal': {
    ro: 'Normal',
    en: 'Normal',
    de: 'Normal',
  },
  'journal.good': {
    ro: 'Bine',
    en: 'Good',
    de: 'Gut',
  },
  'journal.excellent': {
    ro: 'Excelent',
    en: 'Excellent',
    de: 'Ausgezeichnet',
  },
  'journal.save': {
    ro: 'Salvează jurnalul',
    en: 'Save journal',
    de: 'Journal speichern',
  },
  'journal.saved': {
    ro: '✓ Salvat!',
    en: '✓ Saved!',
    de: '✓ Gespeichert!',
  },

  // ── PROFIL ────────────────────────────────────────────────────────────────
  'profile.title': {
    ro: 'Profilul meu',
    en: 'My Profile',
    de: 'Mein Profil',
  },
  'profile.subtitle': {
    ro: 'Date medicale, corp, wearables și obiective',
    en: 'Medical data, body, wearables and goals',
    de: 'Medizinische Daten, Körper, Wearables und Ziele',
  },
  'profile.save': {
    ro: '💾 Salvează tot',
    en: '💾 Save all',
    de: '💾 Alles speichern',
  },
  'profile.saved': {
    ro: '✓ Salvat!',
    en: '✓ Saved!',
    de: '✓ Gespeichert!',
  },
  'profile.personal': {
    ro: 'Personal',
    en: 'Personal',
    de: 'Persönlich',
  },
  'profile.body': {
    ro: 'Corp & BF%',
    en: 'Body & BF%',
    de: 'Körper & KFA',
  },
  'profile.medical': {
    ro: 'Medical',
    en: 'Medical',
    de: 'Medizinisch',
  },
  'profile.analyses': {
    ro: 'Analize',
    en: 'Lab Results',
    de: 'Laborergebnisse',
  },
  'profile.wearables': {
    ro: 'Wearables',
    en: 'Wearables',
    de: 'Wearables',
  },
  'profile.goals': {
    ro: 'Obiective',
    en: 'Goals',
    de: 'Ziele',
  },
  'profile.height': {
    ro: 'Înălțime (cm)',
    en: 'Height (cm)',
    de: 'Größe (cm)',
  },
  'profile.weight': {
    ro: 'Greutate actuală (kg)',
    en: 'Current weight (kg)',
    de: 'Aktuelles Gewicht (kg)',
  },
  'profile.target_weight': {
    ro: 'Greutate țintă (kg)',
    en: 'Target weight (kg)',
    de: 'Zielgewicht (kg)',
  },
  'profile.bmi': {
    ro: 'BMI calculat automat',
    en: 'Auto-calculated BMI',
    de: 'Automatisch berechneter BMI',
  },
  'profile.gdpr': {
    ro: '🔒 Date stocate în UE (Frankfurt) · GDPR compliant',
    en: '🔒 Data stored in EU (Frankfurt) · GDPR compliant',
    de: '🔒 Daten in der EU gespeichert (Frankfurt) · DSGVO-konform',
  },

  // ── CONT ──────────────────────────────────────────────────────────────────
  'account.title': {
    ro: 'Contul meu',
    en: 'My Account',
    de: 'Mein Konto',
  },
  'account.subtitle': {
    ro: 'Profil, abonament și facturare',
    en: 'Profile, subscription and billing',
    de: 'Profil, Abonnement und Abrechnung',
  },
  'account.subscription': {
    ro: 'ABONAMENT',
    en: 'SUBSCRIPTION',
    de: 'ABONNEMENT',
  },
  'account.upgrade_title': {
    ro: 'UPGRADE PENTRU MAI MULT',
    en: 'UPGRADE FOR MORE',
    de: 'UPGRADE FÜR MEHR',
  },
  'account.free_trial': {
    ro: '14 zile gratuit',
    en: '14 days free',
    de: '14 Tage kostenlos',
  },
  'account.per_month': {
    ro: '/lună',
    en: '/month',
    de: '/Monat',
  },
  'account.choose': {
    ro: 'Alege',
    en: 'Choose',
    de: 'Wählen',
  },
  'account.unlimited_analyses': {
    ro: 'Analize nelimitate',
    en: 'Unlimited analyses',
    de: 'Unbegrenzte Analysen',
  },
  'account.daily_email': {
    ro: 'Email zilnic',
    en: 'Daily email',
    de: 'Tägliche E-Mail',
  },

  // ── WEARABLES ────────────────────────────────────────────────────────────
  'wearables.title': {
    ro: 'Date automate din wearables',
    en: 'Automatic data from wearables',
    de: 'Automatische Daten von Wearables',
  },
  'wearables.subtitle': {
    ro: 'Conectează Oura Ring și Garmin pentru date automate zilnice',
    en: 'Connect Oura Ring and Garmin for automatic daily data',
    de: 'Verbinde Oura Ring und Garmin für automatische tägliche Daten',
  },
  'wearables.upgrade': {
    ro: 'Upgrade pentru acces →',
    en: 'Upgrade for access →',
    de: 'Upgrade für Zugang →',
  },
  'wearables.connected': {
    ro: '✓ Conectat',
    en: '✓ Connected',
    de: '✓ Verbunden',
  },
  'wearables.connect': {
    ro: 'Conectează →',
    en: 'Connect →',
    de: 'Verbinden →',
  },
  'wearables.coming_soon': {
    ro: 'În curând',
    en: 'Coming soon',
    de: 'Demnächst',
  },

  // ── PREDICȚIE ────────────────────────────────────────────────────────────
  'prediction.title': {
    ro: '🔮 Predicție Sănătate',
    en: '🔮 Health Prediction',
    de: '🔮 Gesundheitsvorhersage',
  },
  'prediction.subtitle': {
    ro: 'Analiză bazată pe ultimele 7 zile · HRV, temperatură, somn',
    en: 'Analysis based on last 7 days · HRV, temperature, sleep',
    de: 'Analyse der letzten 7 Tage · HRV, Temperatur, Schlaf',
  },
  'prediction.risk_low': {
    ro: 'scăzut',
    en: 'low',
    de: 'niedrig',
  },
  'prediction.risk_moderate': {
    ro: 'moderat',
    en: 'moderate',
    de: 'mäßig',
  },
  'prediction.risk_high': {
    ro: 'ridicat',
    en: 'high',
    de: 'hoch',
  },
  'prediction.risk_critical': {
    ro: 'critic',
    en: 'critical',
    de: 'kritisch',
  },
  'prediction.prob_24h': {
    ro: 'Probabilitate boală în 24h',
    en: 'Illness probability in 24h',
    de: 'Krankheitswahrscheinlichkeit in 24h',
  },
  'prediction.prob_48h': {
    ro: 'Probabilitate boală în 48h',
    en: 'Illness probability in 48h',
    de: 'Krankheitswahrscheinlichkeit in 48h',
  },

  // ── PLANURI ───────────────────────────────────────────────────────────────
  'plan.free': {
    ro: 'Free',
    en: 'Free',
    de: 'Kostenlos',
  },
  'plan.plus': {
    ro: 'Plus',
    en: 'Plus',
    de: 'Plus',
  },
  'plan.pro': {
    ro: 'Pro',
    en: 'Pro',
    de: 'Pro',
  },
  'plan.family': {
    ro: 'Familie',
    en: 'Family',
    de: 'Familie',
  },
  'plan.popular': {
    ro: 'Popular',
    en: 'Popular',
    de: 'Beliebt',
  },

} as const

type TranslationKey = keyof typeof TRADUCERI

// ── HOOK ──────────────────────────────────────────────────────────────────────
export function useTranslations(limba?: Limba) {
  // Detectează limba din localStorage sau browser
  const getLimba = (): Limba => {
    if (limba) return limba
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('be-human-limba') as Limba
      if (saved && ['ro', 'en', 'de'].includes(saved)) return saved
      const browser = navigator.language.slice(0, 2)
      if (browser === 'de') return 'de'
      if (browser === 'en') return 'en'
    }
    return 'ro'
  }

  const l = getLimba()

  const t = (key: TranslationKey, fallback?: string): string => {
    const entry = TRADUCERI[key]
    if (!entry) return fallback || key
    return entry[l] || entry['ro'] || fallback || key
  }

  return { t, limba: l }
}

// ── SCHIMBĂ LIMBA ─────────────────────────────────────────────────────────────
export function setLimba(limba: Limba) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('be-human-limba', limba)
    window.location.reload()
  }
}

// ── SELECTOR LIMBA — Componentă ───────────────────────────────────────────────
export const LIMBI_DISPONIBILE = [
  { cod: 'ro' as Limba, flag: '🇷🇴', label: 'Română' },
  { cod: 'en' as Limba, flag: '🇬🇧', label: 'English' },
  { cod: 'de' as Limba, flag: '🇩🇪', label: 'Deutsch' },
]
