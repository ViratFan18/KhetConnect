export const MESSAGES = {
  phone: {
    empty: { en: '📱 Type your phone number', te: '📱 మీ ఫోన్ నంబర్ టైప్ చేయండి' },
    invalid: { en: '📱 Phone number must be 10 numbers', te: '📱 ఫోన్ నంబర్ 10 అంకెలు ఉండాలి' },
  },
  password: {
    empty: { en: '🔒 Type your password', te: '🔒 మీ పాస్‌వర్డ్ టైప్ చేయండి' },
    short: { en: '🔒 Password needs 6 or more letters', te: '🔒 పాస్‌వర్డ్ 6 అక్షరాలు ఉండాలి' },
  },
  confirmPassword: {
    empty: { en: '🔒 Re-type your password', te: '🔒 మీ పాస్‌వర్డ్‌ను మళ్ళీ టైప్ చేయండి' },
    mismatch: { en: '🔒 Passwords do not match', te: '🔒 పాస్‌వర్డ్‌లు సరిపోలలేదు' },
  },
  name: {
    empty: { en: '🧑 Type your name', te: '🧑 మీ పేరు టైప్ చేయండి' },
  },
  village: {
    empty: { en: '📍 Type your village name', te: '📍 మీ గ్రామం పేరు టైప్ చేయండి' },
  },
  skills: {
    empty: { en: '🛠️ Pick at least one work type', te: '🛠️ కనీసం ఒక పని ఎంచుకోండి' },
  },
  wage: {
    empty: { en: '💰 Type daily wage amount', te: '💰 రోజువారీ కూలి మొత్తాన్ని టైప్ చేయండి' },
    low: { en: '💰 Wage must be ₹100 or more', te: '💰 కూలి ₹100 కంటే ఎక్కువ ఉండాలి' },
  },
  workersNeeded: {
    empty: { en: '👷 Type how many workers you need', te: '👷 ఎంతమంది కూలీలు కావాలో టైప్ చేయండి' },
    low: { en: '👷 Need at least one worker', te: '👷 కనీసం ఒక కూలీ అవసరం' },
  },
  title: {
    empty: { en: '📝 Type the job name', te: '📝 పని పేరు టైప్ చేయండి' },
  },
  workDate: {
    empty: { en: '📅 Pick the work date', te: '📅 పని తేదీ ఎంచుకోండి' },
    past: { en: '📅 Pick a date from today onward', te: '📅 ఈరోజు లేదా తర్వాత తేదీ ఎంచుకోండి' },
  },
  location: {
    empty: { en: "📍 Tap 'Get Location' to add your place", te: "📍 మీ స్థలం కోసం 'Get Location' నొక్కండి" },
    pending: { en: '📍 Wait a moment, finding your location...', te: '📍 మీ స్థానం కనుగొంటున్నాము...' },
    failed: { en: '📍 Location not found. Try again', te: '📍 స్థానం దొరకలేదు. మళ్ళీ ప్రయత్నించండి' },
  },
  description: {
    tooLong: { en: '📝 Description is too long', te: '📝 వివరణ చాలా పొడవుగా ఉంది' },
  },
  submitBlocked: {
    en: '⚠️ Please fill the marked boxes above',
    te: '⚠️ పైన గుర్తించిన ఖాళీలను నింపండి',
  },
  network: {
    en: '🌐 No internet. Check your connection',
    te: '🌐 ఇంటర్నెట్ లేదు. కనెక్షన్ చూడండి',
  },
  serverDown: {
    en: '🔧 Something went wrong. Try again',
    te: '🔧 ఏదో తప్పు జరిగింది. మళ్ళీ ప్రయత్నించండి',
  },
  loginFailed: {
    en: '❌ Phone number or password is wrong',
    te: '❌ ఫోన్ నంబర్ లేదా పాస్‌వర్డ్ తప్పు',
  },
  registerSuccess: {
    en: '✅ Account made! Please sign in',
    te: '✅ ఖాతా తయారైంది! సైన్ ఇన్ చేయండి',
  },
  alreadyRegistered: {
    en: '📱 This phone number is already used',
    te: '📱 ఈ ఫోన్ నంబర్ ఇప్పటికే ఉంది',
  },
  resetTokenMissing: {
    en: '🔑 Reset token is missing',
    te: '🔑 రీసెట్ టోకెన్ లేదు',
  },
  passwordUpdated: {
    en: '✅ Password updated successfully',
    te: '✅ పాస్‌వర్డ్ విజయవంతంగా అప్డేట్ అయింది',
  },
  forgotPasswordSent: {
    en: '✅ Reset link sent',
    te: '✅ రీసెట్ లింక్ పంపబడింది',
  },
  unknown: {
    en: '🔧 Something went wrong. Try again',
    te: '🔧 ఏదో తప్పు జరిగింది. మళ్ళీ ప్రయత్నించండి',
  },
}

export const getMessageText = (message, fallback = '') => {
  if (!message) return fallback
  if (typeof message === 'string') return message
  if (typeof message === 'object') return message.en || message.te || fallback
  return fallback
}
