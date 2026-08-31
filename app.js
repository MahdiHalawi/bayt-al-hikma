// ============================================================
// Bayt Al-Hikma — app logic
// ============================================================

// ---------- real mobile viewport height fix ----------
// Plain CSS `vh` units on mobile browsers include space that gets
// visually covered by the browser's own address bar — this is why
// content (like the verse overlay's close button) could end up hidden
// behind the phone's own browser chrome. style.css already expected a
// `--vh` custom property to fix this (see .app-shell, .screen, and
// .verse-card), but the JS to actually calculate and set it never
// existed — every mobile screen was silently falling back to plain
// `1vh`, exactly reproducing the bug it was meant to prevent.
function setRealViewportHeight() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty("--vh", `${vh}px`);
}
setRealViewportHeight();
window.addEventListener("resize", setRealViewportHeight);
window.addEventListener("orientationchange", setRealViewportHeight);

// ---------- book catalog (demo data — see README for growing this for real) ----------
const CATALOG = {
  philosophy: {
    keywords: ["philosophy", "فلسفة", "philosophie", "meaning", "existence", "ethics"],
    books: [
      { id: "sophies-world", type: "book", lang: "en", title: "Sophie's World", author: "Jostein Gaarder", reason: "An inviting map of the questions philosophy has asked." },
      { id: "problems-of-philosophy", type: "book", lang: "en", title: "The Problems of Philosophy", author: "Bertrand Russell", reason: "A concise guide to the questions beneath everyday certainty." },
      { id: "republic", type: "book", lang: "en", title: "The Republic", author: "Plato", reason: "A foundational conversation about justice, knowledge, and the good life." },
      { id: "incoherence", type: "book", lang: "en", title: "The Incoherence of the Philosophers", author: "Al-Ghazali", reason: "A rigorous encounter with reason, metaphysics, and tradition." },
      { id: "incoherence-ar", type: "book", lang: "ar", title: "تهافت الفلاسفة", author: "الغزالي", reason: "النص الأصلي بالعربية، كما كتبه الغزالي نفسه." },
      { id: "phil-article-1", type: "article", lang: "en", title: "What Philosophy Actually Asks", author: "Aeon", url: "https://aeon.co", reason: "A short, clear framing of philosophy's core questions before diving deeper." },
      { id: "phil-article-ar-1", type: "article", lang: "ar", title: "ما الذي تسأله الفلسفة حقاً؟", author: "منصة عربية", url: "https://aeon.co", reason: "مقالة قصيرة تؤطر أسئلة الفلسفة الأساسية بلغة عربية واضحة." },
      { id: "phil-video-1", type: "video", lang: "en", title: "The History of Philosophy in 20 Minutes", author: "CrashCourse Philosophy", url: "https://www.youtube.com/", reason: "A fast, visual overview to orient yourself before reading further." },
      { id: "phil-course-1", type: "course", lang: "en", title: "Introduction to Philosophy", author: "University of Edinburgh (via edX)", url: "https://www.edx.org", reason: "A structured, multi-week path for a proper immersive foundation." },
    ],
  },
  default: {
    keywords: [],
    books: [
      { id: "sophies-world", type: "book", lang: "en", title: "Sophie's World", author: "Jostein Gaarder", reason: "A gentle place to start while you tell us more." },
      { id: "problems-of-philosophy", type: "book", lang: "en", title: "The Problems of Philosophy", author: "Bertrand Russell", reason: "A concise guide to the questions beneath everyday certainty." },
      { id: "republic", type: "book", lang: "en", title: "The Republic", author: "Plato", reason: "A foundational conversation about justice, knowledge, and the good life." },
      { id: "incoherence", type: "book", lang: "en", title: "The Incoherence of the Philosophers", author: "Al-Ghazali", reason: "A rigorous encounter with reason, metaphysics, and tradition." },
    ],
  },
};

// ---------- translations (covers every data-i18n / data-i18n-placeholder in index.html) ----------
const translations = {
  en: {
    landing_eyebrow: "The House of Wisdom",
    landing_title: "Enter the house. Find the path made for your mind.",
    landing_lede: "Across languages and centuries, knowledge waits in the rooms ahead. Tell the hoopoe what you seek, and let it guide you toward a considered path forward.",
    goalPlaceholder: "I want to understand philosophy",
    goalError: "Tell the hoopoe what you would like to understand first.",
    enter_house: "Enter the house",
    returningLink: "Log in",
    logOutLink: "Log out",
    returningPrompt: "Did you enter before? Come with me.",
    emailPlaceholder: "you@example.com",
    passwordPlaceholder: "••••••••",
    return_login: "Take me to my track",
    questions_eyebrow: "A few steps deeper",
    questions_title: "Let the hoopoe know where to begin.",
    questions_intro: "A little context helps shape a path with the right pace, depth, and form.",
    level_label: "Where are you beginning?",
    level_new: "New to this",
    level_basics: "I know some basics",
    level_wellread: "Already well-read",
    level_other: "Something else",
    level_other_label: "Describe your starting point",
    level_other_placeholder: "e.g. I know statistics well but I'm new to this specific topic",
    format_label: "How do you prefer to read?",
    format_physical: "Physical books",
    format_digital: "Digital reading",
    format_either: "Either way",
    content_type_label: "What kind of path fits you?",
    content_books: "Books",
    content_articles: "Articles",
    content_videos: "Videos",
    content_courses: "Courses",
    content_mix: "A mix of everything",
    content_language_label: "Which language do you want this in?",
    lang_no_preference: "No preference",
    lang_english: "English",
    lang_arabic: "Arabic",
    lang_french: "French",
    arabic_language_note: "Arabic content is still growing here — if we can't find enough strong Arabic sources for your topic, we may include a few in other languages so your path stays complete.",
    time_label: "How much time can you give it?",
    time_quick: "Quick pieces",
    time_moderate: "A steady pace",
    time_deep: "Deep, immersive study",
    open_link: "Open",
    read_free_link: "Read free",
    buy_locally_prefix: "Buy locally via",
    cookie_banner_text: "We use local browser storage to keep you logged in, and may use basic analytics to understand how the site is used.",
    cookie_learn_more: "Learn more",
    cookie_accept: "Got it",
    premium_celebration_text: "Welcome to Premium",
    how_it_works_label: "How it works",
    how_it_works_1_title: "Tell the hoopoe what you want to learn",
    how_it_works_1_desc: "Type any real goal. The more specific, the better.",
    how_it_works_2_title: "Get a real path, not a random list",
    how_it_works_2_desc: "Actual books, videos, articles, and courses, in the right order.",
    how_it_works_3_title: "Track your progress, step by step",
    how_it_works_3_desc: "Mark each step complete as you actually go through it.",
    continue_deeper: "Continue deeper",
    seeking_eyebrow: "The gathering of knowledge",
    seeking_title: "The hoopoe has gone to gather what you seek.",
    seeking_lede: "It travels between sources, tracing one step to the next, until a path begins to appear.",
    choosePasswordPlaceholder: "choose a password",
    send_button: "Send to me",
    agree_prefix: "I agree to the",
    terms_link_text: "Terms of Service",
    refund_link_text: "14-day refund policy",
    pricing_link_text: "See pricing",
    agree_and: "and",
    privacy_link_text: "Privacy Policy",
    agree_terms_required: "Please agree to the Terms of Service and Privacy Policy to continue.",
    logout_button: "Log out",
    expand_scroll: "Expand my scroll",
    seekingStatus1: "Following the traces between shelves...",
    seekingStatus2: "The hoopoe has prepared something. Check your message.",
    secretText: "✦ A hidden message awaits. Tap to reveal your path ✦",
    reveal_eyebrow: "A manuscript prepared for you",
    reveal_title: "Your path of understanding",
    reveal_subtitle: "A patient sequence: begin with the door, learn the language of the room, and continue into the deeper chambers.",
    tap_note: "Tap the hoopoe to hear its story",
    freePlan: "Free plan · step 1 of",
    freePlanTwo: "Free plan · steps 1-2 of",
    premiumPlan: "Premium · full path unlocked",
    lockedLabel: "Locked",
    unlockPrompt: "Unlock with Premium",
    unrollTracker: "Unroll my tracker",
    unlockTracker: "Unlock my tracker with Premium",
    tracker_eyebrow: "Keep the path",
    tracker_title: "Your scroll of wisdom",
    tracker_lede: "Mark each threshold crossed. A path becomes wisdom only when it is walked.",
    tracker_heading: "The path before you",
    progressLabel: "complete",
    progressLabelSingle: "complete",
    newPathFree: "Upgrade to add more paths",
    newPathPremium: "Begin another path",
    verse_eyebrow: "The hoopoe's message",
    verse_heading: "A seeker brings certain news",
    close_verse: "Return to the manuscript",
    upgrade_eyebrow: "Unlock the rest of the house",
    upgrade_limit_message: "You've used your free path. Upgrade to Premium for unlimited paths, or go back to the one you already have.",
    generic_fallback_note: "The hoopoe didn't quite recognize this topic, so what follows is a more general starting point rather than something built specifically for it. Try rephrasing your goal for a more tailored path.",
    go_to_paths_button: "Go to my path",
    seeking_go_to_path: "✦ Go to your path ✦",
    pricing_period: "/month",
    pricing_feature_1: "Every step of every path, not just the first",
    pricing_feature_2: "Unlimited new paths, any time",
    pricing_feature_3: "Full progress tracking across all your paths",
    checkout_button: "Upgrade to Premium",
    not_now: "Not now",
    paths_eyebrow: "Your saved paths",
    paths_title: "Which path calls you today?",
    noPathsYet: "No paths yet. Start your first one below.",
    view_paths: "View my paths",
    back_to_results: "See covers and links again",
    forgot_password: "Forgot password?",
    reset_prompt: "Enter your email and we'll send a reset link.",
    send_reset_link: "Send reset link",
    reset_link_sent: "Check your email for a link to reset your password.",
    new_password_eyebrow: "Set a new password",
    new_password_title: "Choose a new password",
    update_password_button: "Update password",
    password_updated: "Your password has been updated. You're all set.",
    goto_login: "Log in instead",
  },
  ar: {
    landing_eyebrow: "بيت الحكمة",
    landing_title: "ادخل البيت. اعثر على الطريق المصنوع لعقلك.",
    landing_lede: "عبر اللغات والقرون، تنتظر المعرفة في الغرف أمامك. أخبر الهدهد بما تسعى إليه، ودعه يرشدك إلى طريق مدروس إلى الأمام.",
    goalPlaceholder: "أريد أن أفهم الفلسفة",
    goalError: "أخبر الهدهد بما تريد أن تفهمه أولاً.",
    enter_house: "ادخل البيت",
    returningLink: "تسجيل الدخول",
    logOutLink: "تسجيل الخروج",
    returningPrompt: "هل دخلت من قبل؟ تعال معي.",
    emailPlaceholder: "you@example.com",
    passwordPlaceholder: "••••••••",
    return_login: "خذني إلى مسيرتي",
    questions_eyebrow: "خطوات قليلة أعمق",
    questions_title: "دع الهدهد يعرف من أين تبدأ.",
    questions_intro: "القليل من السياق يساعد في تشكيل طريق بالوتيرة والعمق والصيغة المناسبة.",
    level_label: "من أين تبدأ؟",
    level_new: "جديد على هذا",
    level_basics: "أعرف بعض الأساسيات",
    level_wellread: "قارئ متمرس بالفعل",
    level_other: "شيء آخر",
    level_other_label: "صف نقطة انطلاقك",
    level_other_placeholder: "مثال: أعرف الإحصاء جيدًا لكنني جديد على هذا الموضوع تحديدًا",
    format_label: "كيف تفضل القراءة؟",
    format_physical: "كتب ورقية",
    format_digital: "قراءة رقمية",
    format_either: "لا يهم",
    content_type_label: "أي نوع من الطريق يناسبك؟",
    content_books: "كتب",
    content_articles: "مقالات",
    content_videos: "فيديوهات",
    content_courses: "دورات",
    content_mix: "مزيج من كل شيء",
    content_language_label: "بأي لغة تريد هذا المحتوى؟",
    lang_no_preference: "لا تفضيل",
    lang_english: "الإنجليزية",
    lang_arabic: "العربية",
    lang_french: "الفرنسية",
    arabic_language_note: "المحتوى العربي لا يزال ينمو هنا — إذا لم نجد ما يكفي من مصادر عربية قوية لموضوعك، فقد نضيف بعض المصادر بلغات أخرى للحفاظ على اكتمال مسارك.",
    time_label: "كم من الوقت يمكنك تخصيصه؟",
    time_quick: "قطع سريعة",
    time_moderate: "وتيرة ثابتة",
    time_deep: "دراسة عميقة ومكثفة",
    open_link: "افتح",
    read_free_link: "اقرأ مجاناً",
    buy_locally_prefix: "اشترِ محلياً عبر",
    cookie_banner_text: "نستخدم التخزين المحلي في متصفحك لإبقائك مسجلاً للدخول، وقد نستخدم تحليلات أساسية لفهم كيفية استخدام الموقع.",
    cookie_learn_more: "اعرف المزيد",
    cookie_accept: "حسناً",
    premium_celebration_text: "أهلاً بك في بريميوم",
    how_it_works_label: "كيف يعمل",
    how_it_works_1_title: "أخبر الهدهد بما تريد أن تتعلمه",
    how_it_works_1_desc: "اكتب أي هدف حقيقي. كلما كان أكثر تحديدًا، كان أفضل.",
    how_it_works_2_title: "احصل على طريق حقيقي، لا قائمة عشوائية",
    how_it_works_2_desc: "كتب ومقاطع فيديو ومقالات ودورات حقيقية، بالترتيب الصحيح.",
    how_it_works_3_title: "تابع تقدمك خطوة بخطوة",
    how_it_works_3_desc: "علّم كل خطوة كمكتملة عند إنجازها فعليًا.",
    continue_deeper: "تابع أعمق",
    seeking_eyebrow: "جمع المعرفة",
    seeking_title: "ذهب الهدهد ليجمع ما تسعى إليه.",
    seeking_lede: "يتنقل بين المصادر، متتبعًا خطوة بعد أخرى، حتى يبدأ الطريق بالظهور.",
    choosePasswordPlaceholder: "اختر كلمة مرور",
    send_button: "أرسلها لي",
    agree_prefix: "أوافق على",
    terms_link_text: "شروط الخدمة",
    refund_link_text: "سياسة استرداد الأموال خلال 14 يومًا",
    pricing_link_text: "عرض الأسعار",
    agree_and: "و",
    privacy_link_text: "سياسة الخصوصية",
    agree_terms_required: "يرجى الموافقة على شروط الخدمة وسياسة الخصوصية للمتابعة.",
    logout_button: "تسجيل الخروج",
    expand_scroll: "وسّع مخطوطتي",
    seekingStatus1: "يتبع الأثر بين الرفوف...",
    seekingStatus2: "الهدهد أعدّ شيئاً. تفقّد رسالتك.",
    secretText: "✦ رسالة خفية بانتظارك. انقر لكشف طريقك ✦",
    reveal_eyebrow: "مخطوطة أُعدّت من أجلك",
    reveal_title: "طريق فهمك",
    reveal_subtitle: "تسلسل صبور: ابدأ بالباب، تعلّم لغة الغرفة، ثم تابع إلى الغرف الأعمق.",
    tap_note: "انقر على الهدهد لتسمع قصته",
    freePlan: "الخطة المجانية · الخطوة 1 من",
    freePlanTwo: "الخطة المجانية · الخطوتان 1-2 من",
    premiumPlan: "بريميوم · الطريق كاملاً مفتوح",
    lockedLabel: "مقفل",
    unlockPrompt: "افتحه مع بريميوم",
    unrollTracker: "افتح متتبعي",
    unlockTracker: "افتح متتبعي مع بريميوم",
    tracker_eyebrow: "احتفظ بالطريق",
    tracker_title: "مخطوطة حكمتك",
    tracker_lede: "ضع علامة على كل عتبة عبرتها. الطريق يصبح حكمة فقط حين يُمشى.",
    tracker_heading: "الطريق أمامك",
    progressLabel: "مكتمل",
    progressLabelSingle: "مكتمل",
    newPathFree: "اشترك لإضافة مسارات أخرى",
    newPathPremium: "ابدأ مسارًا جديدًا",
    verse_eyebrow: "رسالة الهدهد",
    verse_heading: "طائر يجلب خبرًا يقينًا",
    close_verse: "العودة إلى المخطوطة",
    upgrade_eyebrow: "افتح بقية البيت",
    upgrade_limit_message: "لقد استخدمت مسارك المجاني. قم بالترقية إلى Premium للحصول على مسارات غير محدودة، أو عد إلى المسار الذي لديك بالفعل.",
    generic_fallback_note: "لم يتعرف الهدهد تمامًا على هذا الموضوع، لذا ما يلي هو نقطة انطلاق عامة أكثر بدلاً من مسار مبني خصيصًا له. حاول إعادة صياغة هدفك للحصول على مسار أكثر ملاءمة.",
    go_to_paths_button: "الذهاب إلى مساري",
    seeking_go_to_path: "✦ اذهب إلى مسارك ✦",
    pricing_period: "/شهريًا",
    pricing_feature_1: "كل خطوة من كل طريق، وليس الأولى فقط",
    pricing_feature_2: "مسارات جديدة غير محدودة، في أي وقت",
    pricing_feature_3: "تتبع كامل لتقدمك عبر كل مساراتك",
    checkout_button: "الترقية إلى بريميوم",
    not_now: "ليس الآن",
    paths_eyebrow: "مساراتك المحفوظة",
    paths_title: "أي طريق ينادي اليوم؟",
    noPathsYet: "لا توجد مسارات بعد. ابدأ أولها أدناه.",
    view_paths: "شاهد مساراتي",
    back_to_results: "شاهد الأغلفة والروابط مجدداً",
    forgot_password: "نسيت كلمة المرور؟",
    reset_prompt: "أدخل بريدك الإلكتروني وسنرسل رابط إعادة التعيين.",
    send_reset_link: "أرسل رابط إعادة التعيين",
    reset_link_sent: "تفقّد بريدك الإلكتروني لرابط إعادة تعيين كلمة المرور.",
    new_password_eyebrow: "عيّن كلمة مرور جديدة",
    new_password_title: "اختر كلمة مرور جديدة",
    update_password_button: "تحديث كلمة المرور",
    password_updated: "تم تحديث كلمة المرور. كل شيء جاهز.",
    goto_login: "سجّل الدخول بدلاً من ذلك",
  },
  fr: {
    landing_eyebrow: "La Maison de la Sagesse",
    landing_title: "Entrez dans la maison. Trouvez le chemin fait pour votre esprit.",
    landing_lede: "À travers les langues et les siècles, le savoir attend dans les salles à venir. Dites à la huppe ce que vous cherchez, et laissez-la vous guider vers un chemin réfléchi.",
    goalPlaceholder: "Je veux comprendre la philosophie",
    goalError: "Dites à la huppe ce que vous aimeriez comprendre.",
    enter_house: "Entrer dans la maison",
    returningLink: "Connexion",
    logOutLink: "Déconnexion",
    returningPrompt: "Êtes-vous déjà venu ? Venez avec moi.",
    emailPlaceholder: "vous@exemple.com",
    passwordPlaceholder: "••••••••",
    return_login: "Emmenez-moi à mon parcours",
    questions_eyebrow: "Quelques pas de plus",
    questions_title: "Dites à la huppe par où commencer.",
    questions_intro: "Un peu de contexte aide à façonner un chemin au bon rythme et à la bonne profondeur.",
    level_label: "D'où partez-vous ?",
    level_new: "Nouveau dans ce domaine",
    level_basics: "Je connais les bases",
    level_wellread: "Déjà bien lu",
    level_other: "Autre chose",
    level_other_label: "Décrivez votre point de départ",
    level_other_placeholder: "ex. Je connais bien les statistiques mais je découvre ce sujet précis",
    format_label: "Comment préférez-vous lire ?",
    format_physical: "Livres papier",
    format_digital: "Lecture numérique",
    format_either: "Peu importe",
    content_type_label: "Quel type de chemin vous convient ?",
    content_books: "Livres",
    content_articles: "Articles",
    content_videos: "Vidéos",
    content_courses: "Cours",
    content_mix: "Un mélange de tout",
    content_language_label: "Dans quelle langue voulez-vous ce contenu ?",
    lang_no_preference: "Peu importe",
    lang_english: "Anglais",
    lang_arabic: "Arabe",
    lang_french: "Français",
    arabic_language_note: "Le contenu en arabe est encore en développement — si nous ne trouvons pas assez de sources arabes solides pour votre sujet, nous pourrions inclure quelques sources dans d'autres langues pour que votre parcours reste complet.",
    time_label: "Combien de temps pouvez-vous y consacrer ?",
    time_quick: "Des pièces rapides",
    time_moderate: "Un rythme régulier",
    time_deep: "Une étude approfondie",
    open_link: "Ouvrir",
    read_free_link: "Lire gratuitement",
    buy_locally_prefix: "Acheter localement via",
    cookie_banner_text: "Nous utilisons le stockage local de votre navigateur pour vous garder connecté, et pourrions utiliser des analyses de base pour comprendre l'utilisation du site.",
    cookie_learn_more: "En savoir plus",
    cookie_accept: "Compris",
    premium_celebration_text: "Bienvenue dans Premium",
    how_it_works_label: "Comment ça marche",
    how_it_works_1_title: "Dites à la huppe ce que vous voulez apprendre",
    how_it_works_1_desc: "Entrez un objectif réel. Plus il est précis, mieux c'est.",
    how_it_works_2_title: "Obtenez un vrai parcours, pas une liste aléatoire",
    how_it_works_2_desc: "De vrais livres, vidéos, articles et cours, dans le bon ordre.",
    how_it_works_3_title: "Suivez votre progression, étape par étape",
    how_it_works_3_desc: "Marquez chaque étape comme terminée au fur et à mesure.",
    continue_deeper: "Continuer",
    seeking_eyebrow: "La collecte du savoir",
    seeking_title: "La huppe est partie chercher ce que vous cherchez.",
    seeking_lede: "Elle voyage entre les sources, traçant une étape après l'autre, jusqu'à ce qu'un chemin apparaisse.",
    choosePasswordPlaceholder: "choisissez un mot de passe",
    send_button: "Envoyez-le-moi",
    agree_prefix: "J'accepte les",
    terms_link_text: "Conditions d'utilisation",
    refund_link_text: "Remboursement sous 14 jours",
    pricing_link_text: "Voir les tarifs",
    agree_and: "et la",
    privacy_link_text: "Politique de confidentialité",
    agree_terms_required: "Veuillez accepter les Conditions d'utilisation et la Politique de confidentialité pour continuer.",
    logout_button: "Se déconnecter",
    expand_scroll: "Élargir mon parchemin",
    seekingStatus1: "Elle suit les traces entre les étagères...",
    seekingStatus2: "La huppe a préparé quelque chose. Consultez votre message.",
    secretText: "✦ Un message secret vous attend. Cliquez pour révéler votre chemin ✦",
    reveal_eyebrow: "Un manuscrit préparé pour vous",
    reveal_title: "Votre chemin de compréhension",
    reveal_subtitle: "Une séquence patiente : commencez par la porte, apprenez le langage de la salle, puis continuez vers les chambres plus profondes.",
    tap_note: "Touchez la huppe pour entendre son histoire",
    freePlan: "Plan gratuit · étape 1 sur",
    freePlanTwo: "Plan gratuit · étapes 1-2 sur",
    premiumPlan: "Premium · chemin complet débloqué",
    lockedLabel: "Verrouillé",
    unlockPrompt: "Débloquer avec Premium",
    unrollTracker: "Déployer mon suivi",
    unlockTracker: "Débloquer mon suivi avec Premium",
    tracker_eyebrow: "Gardez le chemin",
    tracker_title: "Votre parchemin de sagesse",
    tracker_lede: "Marquez chaque seuil franchi. Un chemin ne devient sagesse que lorsqu'il est parcouru.",
    tracker_heading: "Le chemin devant vous",
    progressLabel: "terminé",
    progressLabelSingle: "terminé",
    newPathFree: "Passez à Premium pour plus de chemins",
    newPathPremium: "Commencer un nouveau chemin",
    verse_eyebrow: "Le message de la huppe",
    verse_heading: "Une messagère apporte une nouvelle certaine",
    close_verse: "Retour au manuscrit",
    upgrade_eyebrow: "Débloquez le reste de la maison",
    upgrade_limit_message: "Vous avez utilisé votre parcours gratuit. Passez à Premium pour des parcours illimités, ou revenez à celui que vous avez déjà.",
    generic_fallback_note: "Le hoopoe n'a pas tout à fait reconnu ce sujet, donc ce qui suit est un point de départ plus général plutôt qu'un parcours conçu spécifiquement pour cela. Essayez de reformuler votre objectif pour un parcours plus adapté.",
    go_to_paths_button: "Aller à mon parcours",
    seeking_go_to_path: "✦ Accédez à votre parcours ✦",
    pricing_period: "/mois",
    pricing_feature_1: "Chaque étape de chaque chemin, pas seulement la première",
    pricing_feature_2: "Chemins illimités, à tout moment",
    pricing_feature_3: "Suivi complet de votre progression sur tous vos chemins",
    checkout_button: "Passer à Premium",
    not_now: "Pas maintenant",
    paths_eyebrow: "Vos chemins enregistrés",
    paths_title: "Quel chemin vous appelle aujourd'hui ?",
    noPathsYet: "Aucun chemin encore. Commencez le premier ci-dessous.",
    view_paths: "Voir mes chemins",
    back_to_results: "Revoir les couvertures et les liens",
    forgot_password: "Mot de passe oublié ?",
    reset_prompt: "Entrez votre email et nous enverrons un lien de réinitialisation.",
    send_reset_link: "Envoyer le lien",
    reset_link_sent: "Consultez votre email pour un lien de réinitialisation.",
    new_password_eyebrow: "Définir un nouveau mot de passe",
    new_password_title: "Choisissez un nouveau mot de passe",
    update_password_button: "Mettre à jour le mot de passe",
    password_updated: "Votre mot de passe a été mis à jour.",
    goto_login: "Se connecter à la place",
  },
};

let currentLang = "en";
// Tracks the currently-active email-confirmation poller (see the
// signup form's submit handler) so a repeat signup attempt can clear
// any previous one first, guaranteeing only one is ever running —
// see the real bug this fixes in that handler's own comment.
let activeConfirmationPoll = null;
function t(key) { return translations[currentLang][key] || translations.en[key]; }

// Walks every element carrying a translation hook and updates its text
// (or placeholder) to match the active language. This is what was
// actually missing before — the language buttons updated `currentLang`
// but nothing re-rendered the static copy on the page.
function applyLang(lang) {
  currentLang = lang;
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (translations.en[key]) el.textContent = t(key);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (translations.en[key]) el.placeholder = t(key);
  });

  const currentBtn = document.getElementById("language-current");
  if (currentBtn) currentBtn.textContent = LANG_SHORT_LABEL[lang] || lang.toUpperCase();

  renderPathGrid();
  renderTracker();
}

// ---------- app state ----------
const state = {
  goal: "",
  level: "basics",
  levelOther: "",
  premiumFirstFlow: false,
  format: "physical",
  contentType: "books",
  contentLanguage: "any",
  timeCommitment: "moderate",
  country: "Lebanon",
  isPremium: false,
  userId: null,
  currentPath: [],
  currentPathId: null,
  // Real, deliberate business decision: once a path has genuinely been
  // viewed in full while Premium, its CONTENT stays fully unlocked
  // forever, even if the subscription later lapses — matching how a
  // one-time purchase works ("you paid for it, it's yours"). Explicitly
  // does NOT extend to tracker access, though — that's a separate,
  // deliberate distinction: an ongoing tool genuinely requires an
  // active subscription, unlike content already paid for and received.
  // Checked ALONGSIDE current premium status in renderPathGrid, not
  // instead of it.
  currentPathUnlockedForever: false,
  completed: new Set(),
};

// The complete, real ISO 3166-1 country list (249 entries) — generated
// from actual ISO data, not hand-typed, with a few common-name cleanups
// applied (e.g. "Palestine" instead of the formal "Palestine, State of",
// "Russia" instead of "Russian Federation") since most real-world
// country pickers do the same simplification for recognizability.
const ALL_COUNTRIES = [
  { name: 'Afghanistan', code: 'af' },
  { name: 'Albania', code: 'al' },
  { name: 'Algeria', code: 'dz' },
  { name: 'American Samoa', code: 'as' },
  { name: 'Andorra', code: 'ad' },
  { name: 'Angola', code: 'ao' },
  { name: 'Anguilla', code: 'ai' },
  { name: 'Antarctica', code: 'aq' },
  { name: 'Antigua and Barbuda', code: 'ag' },
  { name: 'Argentina', code: 'ar' },
  { name: 'Armenia', code: 'am' },
  { name: 'Aruba', code: 'aw' },
  { name: 'Australia', code: 'au' },
  { name: 'Austria', code: 'at' },
  { name: 'Azerbaijan', code: 'az' },
  { name: 'Bahamas', code: 'bs' },
  { name: 'Bahrain', code: 'bh' },
  { name: 'Bangladesh', code: 'bd' },
  { name: 'Barbados', code: 'bb' },
  { name: 'Belarus', code: 'by' },
  { name: 'Belgium', code: 'be' },
  { name: 'Belize', code: 'bz' },
  { name: 'Benin', code: 'bj' },
  { name: 'Bermuda', code: 'bm' },
  { name: 'Bhutan', code: 'bt' },
  { name: 'Bolivia', code: 'bo' },
  { name: 'Bonaire, Sint Eustatius and Saba', code: 'bq' },
  { name: 'Bosnia and Herzegovina', code: 'ba' },
  { name: 'Botswana', code: 'bw' },
  { name: 'Bouvet Island', code: 'bv' },
  { name: 'Brazil', code: 'br' },
  { name: 'British Indian Ocean Territory', code: 'io' },
  { name: 'British Virgin Islands', code: 'vg' },
  { name: 'Brunei', code: 'bn' },
  { name: 'Bulgaria', code: 'bg' },
  { name: 'Burkina Faso', code: 'bf' },
  { name: 'Burundi', code: 'bi' },
  { name: 'Cabo Verde', code: 'cv' },
  { name: 'Cambodia', code: 'kh' },
  { name: 'Cameroon', code: 'cm' },
  { name: 'Canada', code: 'ca' },
  { name: 'Cayman Islands', code: 'ky' },
  { name: 'Central African Republic', code: 'cf' },
  { name: 'Chad', code: 'td' },
  { name: 'Chile', code: 'cl' },
  { name: 'China', code: 'cn' },
  { name: 'Christmas Island', code: 'cx' },
  { name: 'Cocos (Keeling) Islands', code: 'cc' },
  { name: 'Colombia', code: 'co' },
  { name: 'Comoros', code: 'km' },
  { name: 'Cook Islands', code: 'ck' },
  { name: 'Costa Rica', code: 'cr' },
  { name: 'Croatia', code: 'hr' },
  { name: 'Cuba', code: 'cu' },
  { name: 'Curaçao', code: 'cw' },
  { name: 'Cyprus', code: 'cy' },
  { name: 'Czechia', code: 'cz' },
  { name: 'Côte d\'Ivoire', code: 'ci' },
  { name: 'Denmark', code: 'dk' },
  { name: 'Djibouti', code: 'dj' },
  { name: 'Dominica', code: 'dm' },
  { name: 'Dominican Republic', code: 'do' },
  { name: 'DR Congo', code: 'cd' },
  { name: 'Ecuador', code: 'ec' },
  { name: 'Egypt', code: 'eg' },
  { name: 'El Salvador', code: 'sv' },
  { name: 'Equatorial Guinea', code: 'gq' },
  { name: 'Eritrea', code: 'er' },
  { name: 'Estonia', code: 'ee' },
  { name: 'Eswatini', code: 'sz' },
  { name: 'Ethiopia', code: 'et' },
  { name: 'Falkland Islands (Malvinas)', code: 'fk' },
  { name: 'Faroe Islands', code: 'fo' },
  { name: 'Fiji', code: 'fj' },
  { name: 'Finland', code: 'fi' },
  { name: 'France', code: 'fr' },
  { name: 'French Guiana', code: 'gf' },
  { name: 'French Polynesia', code: 'pf' },
  { name: 'French Southern Territories', code: 'tf' },
  { name: 'Gabon', code: 'ga' },
  { name: 'Gambia', code: 'gm' },
  { name: 'Georgia', code: 'ge' },
  { name: 'Germany', code: 'de' },
  { name: 'Ghana', code: 'gh' },
  { name: 'Gibraltar', code: 'gi' },
  { name: 'Greece', code: 'gr' },
  { name: 'Greenland', code: 'gl' },
  { name: 'Grenada', code: 'gd' },
  { name: 'Guadeloupe', code: 'gp' },
  { name: 'Guam', code: 'gu' },
  { name: 'Guatemala', code: 'gt' },
  { name: 'Guernsey', code: 'gg' },
  { name: 'Guinea', code: 'gn' },
  { name: 'Guinea-Bissau', code: 'gw' },
  { name: 'Guyana', code: 'gy' },
  { name: 'Haiti', code: 'ht' },
  { name: 'Heard Island and McDonald Islands', code: 'hm' },
  { name: 'Holy See (Vatican City State)', code: 'va' },
  { name: 'Honduras', code: 'hn' },
  { name: 'Hong Kong', code: 'hk' },
  { name: 'Hungary', code: 'hu' },
  { name: 'Iceland', code: 'is' },
  { name: 'India', code: 'in' },
  { name: 'Indonesia', code: 'id' },
  { name: 'Iran', code: 'ir' },
  { name: 'Iraq', code: 'iq' },
  { name: 'Ireland', code: 'ie' },
  { name: 'Isle of Man', code: 'im' },
  { name: 'Italy', code: 'it' },
  { name: 'Jamaica', code: 'jm' },
  { name: 'Japan', code: 'jp' },
  { name: 'Jersey', code: 'je' },
  { name: 'Jordan', code: 'jo' },
  { name: 'Kazakhstan', code: 'kz' },
  { name: 'Kenya', code: 'ke' },
  { name: 'Kiribati', code: 'ki' },
  { name: 'Kuwait', code: 'kw' },
  { name: 'Kyrgyzstan', code: 'kg' },
  { name: 'Laos', code: 'la' },
  { name: 'Latvia', code: 'lv' },
  { name: 'Lebanon', code: 'lb' },
  { name: 'Lesotho', code: 'ls' },
  { name: 'Liberia', code: 'lr' },
  { name: 'Libya', code: 'ly' },
  { name: 'Liechtenstein', code: 'li' },
  { name: 'Lithuania', code: 'lt' },
  { name: 'Luxembourg', code: 'lu' },
  { name: 'Macao', code: 'mo' },
  { name: 'Madagascar', code: 'mg' },
  { name: 'Malawi', code: 'mw' },
  { name: 'Malaysia', code: 'my' },
  { name: 'Maldives', code: 'mv' },
  { name: 'Mali', code: 'ml' },
  { name: 'Malta', code: 'mt' },
  { name: 'Marshall Islands', code: 'mh' },
  { name: 'Martinique', code: 'mq' },
  { name: 'Mauritania', code: 'mr' },
  { name: 'Mauritius', code: 'mu' },
  { name: 'Mayotte', code: 'yt' },
  { name: 'Mexico', code: 'mx' },
  { name: 'Micronesia', code: 'fm' },
  { name: 'Moldova', code: 'md' },
  { name: 'Monaco', code: 'mc' },
  { name: 'Mongolia', code: 'mn' },
  { name: 'Montenegro', code: 'me' },
  { name: 'Montserrat', code: 'ms' },
  { name: 'Morocco', code: 'ma' },
  { name: 'Mozambique', code: 'mz' },
  { name: 'Myanmar', code: 'mm' },
  { name: 'Namibia', code: 'na' },
  { name: 'Nauru', code: 'nr' },
  { name: 'Nepal', code: 'np' },
  { name: 'Netherlands', code: 'nl' },
  { name: 'New Caledonia', code: 'nc' },
  { name: 'New Zealand', code: 'nz' },
  { name: 'Nicaragua', code: 'ni' },
  { name: 'Niger', code: 'ne' },
  { name: 'Nigeria', code: 'ng' },
  { name: 'Niue', code: 'nu' },
  { name: 'Norfolk Island', code: 'nf' },
  { name: 'North Korea', code: 'kp' },
  { name: 'North Macedonia', code: 'mk' },
  { name: 'Northern Mariana Islands', code: 'mp' },
  { name: 'Norway', code: 'no' },
  { name: 'Oman', code: 'om' },
  { name: 'Pakistan', code: 'pk' },
  { name: 'Palau', code: 'pw' },
  { name: 'Palestine', code: 'ps' },
  { name: 'Panama', code: 'pa' },
  { name: 'Papua New Guinea', code: 'pg' },
  { name: 'Paraguay', code: 'py' },
  { name: 'Peru', code: 'pe' },
  { name: 'Philippines', code: 'ph' },
  { name: 'Pitcairn', code: 'pn' },
  { name: 'Poland', code: 'pl' },
  { name: 'Portugal', code: 'pt' },
  { name: 'Puerto Rico', code: 'pr' },
  { name: 'Qatar', code: 'qa' },
  { name: 'Republic of the Congo', code: 'cg' },
  { name: 'Romania', code: 'ro' },
  { name: 'Russia', code: 'ru' },
  { name: 'Rwanda', code: 'rw' },
  { name: 'Réunion', code: 're' },
  { name: 'Saint Barthélemy', code: 'bl' },
  { name: 'Saint Helena, Ascension and Tristan da Cunha', code: 'sh' },
  { name: 'Saint Kitts and Nevis', code: 'kn' },
  { name: 'Saint Lucia', code: 'lc' },
  { name: 'Saint Martin (French part)', code: 'mf' },
  { name: 'Saint Pierre and Miquelon', code: 'pm' },
  { name: 'Saint Vincent and the Grenadines', code: 'vc' },
  { name: 'Samoa', code: 'ws' },
  { name: 'San Marino', code: 'sm' },
  { name: 'Sao Tome and Principe', code: 'st' },
  { name: 'Saudi Arabia', code: 'sa' },
  { name: 'Senegal', code: 'sn' },
  { name: 'Serbia', code: 'rs' },
  { name: 'Seychelles', code: 'sc' },
  { name: 'Sierra Leone', code: 'sl' },
  { name: 'Singapore', code: 'sg' },
  { name: 'Sint Maarten (Dutch part)', code: 'sx' },
  { name: 'Slovakia', code: 'sk' },
  { name: 'Slovenia', code: 'si' },
  { name: 'Solomon Islands', code: 'sb' },
  { name: 'Somalia', code: 'so' },
  { name: 'South Africa', code: 'za' },
  { name: 'South Georgia and the South Sandwich Islands', code: 'gs' },
  { name: 'South Korea', code: 'kr' },
  { name: 'South Sudan', code: 'ss' },
  { name: 'Spain', code: 'es' },
  { name: 'Sri Lanka', code: 'lk' },
  { name: 'Sudan', code: 'sd' },
  { name: 'Suriname', code: 'sr' },
  { name: 'Svalbard and Jan Mayen', code: 'sj' },
  { name: 'Sweden', code: 'se' },
  { name: 'Switzerland', code: 'ch' },
  { name: 'Syria', code: 'sy' },
  { name: 'Taiwan', code: 'tw' },
  { name: 'Tajikistan', code: 'tj' },
  { name: 'Tanzania', code: 'tz' },
  { name: 'Thailand', code: 'th' },
  { name: 'Timor-Leste', code: 'tl' },
  { name: 'Togo', code: 'tg' },
  { name: 'Tokelau', code: 'tk' },
  { name: 'Tonga', code: 'to' },
  { name: 'Trinidad and Tobago', code: 'tt' },
  { name: 'Tunisia', code: 'tn' },
  { name: 'Turkmenistan', code: 'tm' },
  { name: 'Turks and Caicos Islands', code: 'tc' },
  { name: 'Tuvalu', code: 'tv' },
  { name: 'Türkiye', code: 'tr' },
  { name: 'U.S. Virgin Islands', code: 'vi' },
  { name: 'Uganda', code: 'ug' },
  { name: 'Ukraine', code: 'ua' },
  { name: 'United Arab Emirates', code: 'ae' },
  { name: 'United Kingdom', code: 'gb' },
  { name: 'United States', code: 'us' },
  { name: 'United States Minor Outlying Islands', code: 'um' },
  { name: 'Uruguay', code: 'uy' },
  { name: 'Uzbekistan', code: 'uz' },
  { name: 'Vanuatu', code: 'vu' },
  { name: 'Venezuela', code: 've' },
  { name: 'Vietnam', code: 'vn' },
  { name: 'Wallis and Futuna', code: 'wf' },
  { name: 'Western Sahara', code: 'eh' },
  { name: 'Yemen', code: 'ye' },
  { name: 'Zambia', code: 'zm' },
  { name: 'Zimbabwe', code: 'zw' },
  { name: 'Åland Islands', code: 'ax' },
];

// Kept for anything that still references the full list by this name
// (e.g. finding the currently-selected country's flag code).
const COUNTRIES = ALL_COUNTRIES;

// Real flag IMAGES instead of emoji characters. Emoji flags render
// inconsistently across platforms — Windows in particular commonly
// falls back to showing the raw two-letter country code as plain text
// instead of an actual flag, since many of its default fonts simply
// don't include color flag emoji glyphs at all. Using real images
// guarantees the same visual result everywhere, same reasoning as
// using real book cover images rather than hoping for consistent emoji
// rendering.
// ---------- security: escaping user-controlled and external content ----------
// Real, confirmed gap found on a security review: several places
// rendered user-typed text (a person's own learning goal) and
// external/AI-generated content (book titles, authors, AI-written
// "reason" text) directly via innerHTML with no escaping at all. A
// goal typed as something like <img src=x onerror="..."> would
// genuinely execute as real HTML/JS, not just display as text. Every
// place that interpolates this kind of content into innerHTML now
// runs it through this first.
function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// URLs go into href/src attributes, not text content — escaping alone
// doesn't stop a "javascript:" URL from executing when clicked. Only
// allow genuine http(s) URLs through; anything else (including a
// malformed or deliberately malicious scheme) is safely dropped.
function safeUrl(url) {
  if (!url) return "";
  try {
    const parsed = new URL(url, window.location.href);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.href : "";
  } catch (e) {
    return "";
  }
}

function flagImg(code) {
  return `<img src="https://flagcdn.com/20x15/${code}.png" alt="" width="20" height="15" style="vertical-align:middle;margin-inline-end:.35rem;border-radius:2px;">`;
}

// ---------- screen navigation ----------
const screens = {
  landing: document.getElementById("landing-screen"),
  questions: document.getElementById("questions-screen"),
  seeking: document.getElementById("seeking-screen"),
  reveal: document.getElementById("reveal-screen"),
  paths: document.getElementById("paths-screen"),
  tracker: document.getElementById("tracker-screen"),
};

function showScreen(name) {
  Object.values(screens).forEach((s) => s.classList.remove("active"));
  screens[name].classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ---------- language ----------
// ---------- language: dropdown, matching the location picker pattern ----------
const languageCurrent = document.getElementById("language-current");
const languageDropdown = document.getElementById("language-dropdown");
const languageList = document.getElementById("language-list");
const LANG_SHORT_LABEL = { en: "EN", ar: "عر", fr: "FR" };

function openLanguageList() {
  languageDropdown.classList.remove("hidden");
  languageCurrent.setAttribute("aria-expanded", "true");
}
function closeLanguageList() {
  languageDropdown.classList.add("hidden");
  languageCurrent.setAttribute("aria-expanded", "false");
}

languageList.querySelectorAll("li").forEach((li) => {
  li.addEventListener("click", () => {
    applyLang(li.dataset.lang);
    closeLanguageList();
  });
});

languageCurrent.addEventListener("click", () => {
  languageDropdown.classList.contains("hidden") ? openLanguageList() : closeLanguageList();
});
document.addEventListener("click", (e) => {
  if (!e.target.closest(".language-picker")) closeLanguageList();
});

// ---------- location: real dropdown, not click-to-cycle ----------
const locationCurrent = document.getElementById("location-current");
const locationList = document.getElementById("location-list");
const locationDropdown = document.getElementById("location-dropdown");
const locationSearch = document.getElementById("location-search");

function makeCountryLi(c) {
  const li = document.createElement("li");
  li.role = "option";
  li.innerHTML = `${flagImg(c.code)}${c.name}`;
  li.dataset.country = c.name;
  li.addEventListener("click", () => {
    state.country = c.name;
    // The current-selection BUTTON uses the short code, not the full
    // name — country names vary enormously in length ("LB" vs "United
    // Arab Emirates"), and this button has a genuinely fixed width to
    // stay visually uniform with the other 2 top-bar buttons. A fixed
    // width sized for the longest possible country name would make
    // the button awkwardly wide; sized for a short one (like this was)
    // causes real, confirmed truncation/uneven padding for longer
    // names. The short code always fits cleanly either way. The full
    // name is still available as a native tooltip on hover.
    locationCurrent.innerHTML = `${flagImg(c.code)}${c.code.toUpperCase()}`;
    locationCurrent.title = c.name;
    closeLocationList();
  });
  return li;
}

// Renders the list, optionally filtered by search text. With no search
// text, shows the 3 original priority markets pinned at the top (with a
// divider), then the complete alphabetical list below — this is what
// lets someone visiting from anywhere in the world find their own
// country (the original gap this replaced), while keeping the 3
// original target markets one click away.
function renderLocationList(filterText = "") {
  locationList.innerHTML = "";
  const query = filterText.trim().toLowerCase();

  if (!query) {
    ALL_COUNTRIES.forEach((c) => locationList.appendChild(makeCountryLi(c)));
    return;
  }

  const matches = ALL_COUNTRIES.filter((c) => c.name.toLowerCase().includes(query));
  if (matches.length === 0) {
    const li = document.createElement("li");
    li.className = "no-country-results";
    li.textContent = "No countries found";
    locationList.appendChild(li);
    return;
  }
  matches.forEach((c) => locationList.appendChild(makeCountryLi(c)));
}

function openLocationList() {
  locationDropdown.classList.remove("hidden");
  locationCurrent.setAttribute("aria-expanded", "true");
  locationSearch.value = "";
  renderLocationList();
  locationSearch.focus();
}
function closeLocationList() {
  locationDropdown.classList.add("hidden");
  locationCurrent.setAttribute("aria-expanded", "false");
}

locationSearch.addEventListener("input", () => renderLocationList(locationSearch.value));

locationCurrent.addEventListener("click", () => {
  locationDropdown.classList.contains("hidden") ? openLocationList() : closeLocationList();
});
document.addEventListener("click", (e) => {
  if (!e.target.closest(".location-picker")) closeLocationList();
});

renderLocationList();
{
  const c0 = COUNTRIES.find((c) => c.name === state.country);
  if (c0) {
    locationCurrent.innerHTML = `${flagImg(c0.code)}${c0.code.toUpperCase()}`;
    locationCurrent.title = c0.name;
  }
}

// ---------- landing: goal + returning-visitor login ----------
const goalForm = document.getElementById("goal-form");
const goalInput = document.getElementById("goal-input");
const goalMessage = document.getElementById("goal-message");

goalForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!goalInput.value.trim()) {
    goalMessage.textContent = t("goalError");
    goalInput.focus();
    return;
  }
  state.goal = goalInput.value.trim();
  goalMessage.textContent = "";
  trackFunnelEvent("goal_submitted");
  showScreen("questions");
});

document.getElementById("returning-link").addEventListener("click", () => {
  if (state.userId) {
    // Already authenticated — this button now reads "Log out" (see
    // updateAuthButtonLabel), so clicking it should actually do that,
    // not open a login panel that wouldn't make sense to show someone
    // who's already signed in.
    logOut();
    return;
  }
  document.getElementById("returning-panel").classList.toggle("hidden");
});
document.addEventListener("click", (e) => {
  if (!e.target.closest(".auth-picker")) document.getElementById("returning-panel").classList.add("hidden");
});

// ---------- password reset: requesting the link ----------
document.getElementById("forgot-password-link").addEventListener("click", () => {
  // Carry over whatever they already typed in the login email field, so
  // they're not asked to type the same address twice.
  const alreadyTypedEmail = document.getElementById("return-email").value.trim();
  if (alreadyTypedEmail) {
    document.getElementById("reset-email").value = alreadyTypedEmail;
  }
  document.getElementById("reset-request-panel").classList.toggle("hidden");
});

document.getElementById("send-reset-link-btn").addEventListener("click", async () => {
  const email = document.getElementById("reset-email").value.trim();
  const msg = document.getElementById("reset-request-message");
  msg.textContent = "";

  if (!email) return;

  try {
    // redirectTo tells Supabase where to send the person back to after
    // they click the emailed link — this same page, so our own JS below
    // can catch the PASSWORD_RECOVERY event and show the new-password form.
    const redirectTo = window.location.origin + window.location.pathname;
    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) {
      msg.textContent = error.message;
      return;
    }
    msg.textContent = t("reset_link_sent");
  } catch (err) {
    console.error("Password reset request failed:", err);
    msg.textContent = "Could not reach the account service. Check supabase-config.js and your browser console for details.";
  }
});

// ---------- password reset: actually setting the new password ----------
// Supabase fires this specific event once someone clicks the emailed
// reset link and lands back on this page — that's the ONLY moment this
// overlay should appear, since it means Supabase has already verified
// the link and granted a temporary "you may change your password" state.
try {
  sb.auth.onAuthStateChange((event) => {
    if (event === "PASSWORD_RECOVERY") {
      document.getElementById("new-password-overlay").classList.remove("hidden");
    }
  });
} catch (err) {
  console.error("Could not register the auth state listener:", err);
}

document.getElementById("update-password-btn").addEventListener("click", async () => {
  const newPassword = document.getElementById("new-password-input").value;
  const msg = document.getElementById("new-password-message");
  msg.textContent = "";

  if (newPassword.length < 6) {
    msg.textContent = "Please choose a password of at least 6 characters.";
    return;
  }

  try {
    const { error } = await sb.auth.updateUser({ password: newPassword });
    if (error) {
      msg.textContent = error.message;
      return;
    }
    msg.textContent = t("password_updated");
    setTimeout(() => {
      document.getElementById("new-password-overlay").classList.add("hidden");
    }, 1800);
  } catch (err) {
    console.error("Password update failed:", err);
    msg.textContent = "Could not reach the account service. Check supabase-config.js and your browser console for details.";
  }
});

document.getElementById("signup-goto-login-btn").addEventListener("click", () => {
  const typedEmail = document.getElementById("email-input").value.trim();
  showScreen("landing");
  document.getElementById("returning-panel").classList.remove("hidden");
  document.getElementById("return-email").value = typedEmail;
  document.getElementById("return-password").focus();
});

// Real login: authenticates against Supabase, then shows a list of this
// user's actual saved paths — this replaces the old behavior of guessing
// which single path to jump into, which broke down the moment someone
// had more than one.
document.getElementById("return-login-btn").addEventListener("click", async () => {
  const email = document.getElementById("return-email").value.trim();
  const password = document.getElementById("return-password").value;
  const msg = document.getElementById("return-message");
  msg.textContent = "";

  let data, error;
  try {
    ({ data, error } = await sb.auth.signInWithPassword({ email, password }));
  } catch (err) {
    console.error("Supabase signInWithPassword threw:", err);
    msg.textContent = "Could not reach the account service. Check supabase-config.js and your browser console for details.";
    return;
  }

  if (error) {
    msg.textContent = error.message;
    return;
  }

  state.userId = data.user.id;
  updateAuthButtonLabel();

  const { data: profile } = await sb
    .from("profiles")
    .select("is_premium")
    .eq("id", data.user.id)
    .single();
  state.isPremium = profile ? profile.is_premium : false;
  celebrateIfNewlyPremium(state.isPremium);

  document.getElementById("returning-panel").classList.add("hidden");
  await showPathsList();
});

async function showPathsList() {
  const { data: paths, error } = await sb
    .from("paths")
    .select("id, goal, topic, content_type, content_language, items, created_at, unlocked_forever")
    .eq("user_id", state.userId)
    .order("created_at", { ascending: false });

  if (error) console.error("Could not load saved paths:", error.message);
  renderPathsList(paths || []);
  showScreen("paths");
}

function renderPathsList(paths) {
  const container = document.getElementById("paths-list-container");
  container.innerHTML = "";

  if (paths.length === 0) {
    container.innerHTML = `<p class="lede">${t("noPathsYet")}</p>`;
  }

  paths.forEach((p) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "path-list-item";
    item.innerHTML = `${escapeHtml(p.goal || p.topic)}<span class="path-item-topic">${escapeHtml(p.topic)}</span>`;
    item.addEventListener("click", async () => {
      state.currentPathId = p.id;
      // Replay the EXACT items originally shown, stored in the `items`
      // column, rather than re-running a live search — this is the fix
      // for the earlier limitation (live results can change over time,
      // so re-searching could show different items than what progress
      // was actually tracked against).
      //
      // The fallback re-search only exists for paths saved BEFORE this
      // fix existed, which won't have anything in `items` yet.
      if (p.items && p.items.length > 0) {
        state.currentPath = p.items;
      } else {
        console.warn(`Path ${p.id} has no stored items (saved before this fix) — falling back to a live re-search.`);
        state.currentPath = await buildPathReal(p.goal, p.content_type || "mix", p.content_language || "any", state.level);
      }
      state.goal = p.goal || "";
      state.currentPathUnlockedForever = !!p.unlocked_forever;

      // If they're currently Premium but this specific path was never
      // marked as permanently unlocked (created back when they were
      // free, then upgraded later — or created before this feature
      // existed at all), mark it now. This is the fair, real-world
      // case: viewing a path while genuinely Premium should always
      // grant it permanent access, not just paths created after
      // upgrading.
      if (state.isPremium && !p.unlocked_forever) {
        state.currentPathUnlockedForever = true;
        try {
          const { error } = await sb.from("paths").update({ unlocked_forever: true }).eq("id", p.id);
          if (error) console.error("Could not mark path as permanently unlocked:", error.message);
        } catch (err) {
          console.error("Could not mark path as permanently unlocked:", err);
        }
      }

      // Real, explicit product decision: content permanently stays
      // unlocked (see pathIsFullyUnlocked below), but tracker access
      // specifically requires an ACTIVE subscription — a free user
      // with a permanently-unlocked path still lands on reveal, not
      // tracker, matching the same rule everywhere else in the app.
      if (state.isPremium) {
        await loadProgressFromDb(state.userId, p.id);
        renderTracker();
        showScreen("tracker");
      } else {
        renderPathGrid();
        showScreen("reveal");
      }
    });
    container.appendChild(item);
  });

  // Free accounts only ever get one path — once they have it, the
  // "begin another path" action here becomes the upgrade prompt instead.
  // Same underlying rule as hasReachedFreePathLimit() above, just using
  // `paths` already fetched for rendering the list itself, rather than
  // a second, redundant query for a count already available for free.
  const startBtn = document.getElementById("start-new-path-button");
  startBtn.textContent = !state.isPremium && paths.length >= 1 ? t("newPathFree") : t("newPathPremium");
  startBtn.onclick = () => {
    if (!state.isPremium && paths.length >= 1) {
      openUpgrade();
    } else {
      showScreen("landing");
    }
  };
}

async function loadProgressFromDb(userId, pathId) {
  const { data } = await sb.from("progress").select("book_id").eq("user_id", userId).eq("path_id", pathId);
  state.completed = new Set((data || []).map((r) => r.book_id));
}

// ---------- questions ----------
document.querySelectorAll(".option-chip").forEach((btn) => {
  btn.addEventListener("click", () => {
    const group = btn.dataset.group;
    document.querySelectorAll(`.option-chip[data-group="${group}"]`).forEach((o) => {
      o.classList.remove("selected");
      o.setAttribute("aria-pressed", "false");
    });
    btn.classList.add("selected");
    btn.setAttribute("aria-pressed", "true");
    state[group] = btn.dataset.value;

    // The physical/digital question only makes sense when books are
    // actually part of the chosen path — hide it otherwise rather than
    // asking something irrelevant.
    if (group === "contentType") {
      const showFormat = btn.dataset.value === "books" || btn.dataset.value === "mix";
      document.getElementById("book-format-group").classList.toggle("hidden", !showFormat);
    }

    // "Something else" reveals a free-text field for describing their
    // own starting point in their own words — for when none of the 3
    // fixed level buckets genuinely fit (e.g. strong in a related
    // field, but new to this specific topic).
    if (group === "level") {
      const showOther = btn.dataset.value === "other";
      document.getElementById("level-other-group").classList.toggle("hidden", !showOther);
      if (!showOther) {
        document.getElementById("level-other-input").value = "";
        state.levelOther = "";
      }
    }

    // Honest expectation-setting: Arabic-language source coverage is
    // genuinely thinner right now than English's, so let people know
    // upfront rather than have them quietly wonder why an English item
    // showed up despite selecting Arabic.
    if (group === "contentLanguage") {
      const showArabicNote = btn.dataset.value === "ar";
      document.getElementById("arabic-language-note").classList.toggle("hidden", !showArabicNote);
    }
  });
});

document.getElementById("level-other-input").addEventListener("input", (e) => {
  state.levelOther = e.target.value;
});

// The single, shared definition of the free-tier path limit — used
// everywhere this needs checking, so there's exactly one place the
// actual rule lives, not several copies that could quietly drift out
// of sync with each other over time.
async function hasReachedFreePathLimit(userId) {
  const { count } = await sb.from("paths").select("id", { count: "exact", head: true }).eq("user_id", userId);
  return count >= 1;
}

// The top-bar button previously always said "Log in" regardless of
// whether someone was already authenticated — a real, confusing bug on
// its own (looks like login failed, or invites a redundant second
// login attempt). Updates the element's data-i18n KEY, not just its
// visible text directly — applyLang() re-reads this attribute on every
// language switch, so setting only textContent would get silently
// overwritten back to "Log in" the next time someone changes languages
// while already logged in.
function updateAuthButtonLabel() {
  const btn = document.getElementById("returning-link");
  const key = state.userId ? "logOutLink" : "returningLink";
  btn.setAttribute("data-i18n", key);
  btn.textContent = t(key);
}

document.getElementById("continue-button").addEventListener("click", async () => {
  document.getElementById("signup-message").textContent = "";
  document.getElementById("signup-goto-login-btn").classList.add("hidden");

  if (state.userId) {
    // Already logged in. Before proceeding, check the SAME free-tier
    // limit the paths-list screen enforces — this is the gap that let
    // a free user rack up multiple paths: every route back to this
    // landing screen (browser back button, a fresh visit while already
    // logged in, and others) used to skip this check entirely, since it
    // previously only lived on one specific button elsewhere. A fresh
    // query here (rather than trusting a possibly-stale cached count)
    // keeps this correct regardless of how they arrived. The real,
    // authoritative enforcement lives on the backend now too — this is
    // just for a fast, friendly response instead of a round-trip error.
    if (!state.isPremium) {
      try {
        if (await hasReachedFreePathLimit(state.userId)) {
          openUpgrade();
          return;
        }
      } catch (err) {
        console.warn("Could not check existing path count:", err);
        // Don't block a legitimate user over an unrelated hiccup — the
        // backend check is the real, authoritative backstop either way.
      }
    }

    showScreen("seeking");
    document.getElementById("seeking-status").textContent = "";
    document.getElementById("searching-dots").classList.add("hidden");
    document.getElementById("secret-message-btn").classList.add("hidden");
    // Already logged in — never show the signup form again. Showing it
    // here was the original bug: re-entering existing credentials just
    // gets rejected by Supabase since that account already exists.
    document.getElementById("email-form").classList.add("hidden");
    startSeekingDelay();
  } else {
    showScreen("seeking");
    document.getElementById("seeking-status").textContent = "";
    document.getElementById("searching-dots").classList.add("hidden");
    document.getElementById("secret-message-btn").classList.add("hidden");
    document.getElementById("email-form").classList.remove("hidden");
  }
});

// ---------- seeking: real signup gate (new users only) ----------
const emailForm = document.getElementById("email-form");
emailForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email-input").value.trim();
  const password = document.getElementById("signup-password").value;
  const agreedToTerms = document.getElementById("agree-terms-checkbox").checked;
  const msg = document.getElementById("signup-message");
  msg.textContent = "";

  // Supabase's own default minimum is 6 characters — matching that here
  // avoids a confusing mismatch where our check passes but theirs fails.
  if (!email || password.length < 6) {
    msg.textContent = "Please enter a valid email and a password of at least 6 characters.";
    return;
  }

  if (!agreedToTerms) {
    msg.textContent = t("agree_terms_required");
    return;
  }

  let data, error;
  try {
    ({ data, error } = await sb.auth.signUp({ email, password }));
  } catch (err) {
    // This catches things a normal {error} response wouldn't — e.g. a
    // malformed SUPABASE_URL, a network/CORS failure, or the config
    // still containing the placeholder text. Previously this failed
    // completely silently, which is the bug being fixed here.
    console.error("Supabase signUp threw:", err);
    msg.textContent = "Could not reach the account service. Check supabase-config.js and your browser console for details.";
    return;
  }

  if (error) {
    msg.textContent = error.message;
    // Supabase's message for this case includes "already registered" —
    // when this happens, don't just leave the user stuck on a form that
    // will only ever reject them; give them a direct way to log in
    // instead, carrying their typed email over so they're not retyping it.
    if (error.message.toLowerCase().includes("already registered")) {
      document.getElementById("signup-goto-login-btn").classList.remove("hidden");
    }
    return;
  }
  if (!data.session) {
    // Happens when your Supabase project requires email confirmation —
    // now the real, live behavior for real users. The confirmation link
    // is very often opened on a DIFFERENT device than the one used to
    // sign up (checking email on a phone, while the signup itself
    // happened on a laptop) — that other device has no way to know
    // confirmation happened unless this one actively checks. So rather
    // than just displaying a static message and leaving this screen
    // permanently stuck, poll for confirmation and continue
    // automatically the moment it's detected, from any device.
    msg.textContent = "Check your email to confirm your account. This page will continue automatically once you do — no need to come back and refresh.";

    // Real bug fixed here: this used to be a purely local variable,
    // recreated fresh on every signup submission with no reference to
    // any previous one. Someone who goes through the entire flow again
    // (new goal, new questions, re-entering the same still-unconfirmed
    // credentials) — exactly the "repeat from the beginning" scenario
    // reported — would end up with a SECOND polling loop running
    // concurrently alongside the first, neither aware of the other.
    // If confirmation then happened, both could detect it around the
    // same moment and both call continueAfterConfirmedSignup, racing
    // each other into duplicate profile upserts and duplicate path
    // generation. Tracking this at module level, and explicitly
    // clearing any previous one first, guarantees only one poller is
    // ever active — a fresh attempt correctly replaces the old one
    // instead of running alongside it.
    if (activeConfirmationPoll) clearInterval(activeConfirmationPoll);

    let attempts = 0;
    const maxAttempts = 100; // ~100 * 3s = 5 minutes of polling
    activeConfirmationPoll = setInterval(async () => {
      attempts++;
      if (attempts > maxAttempts) {
        clearInterval(activeConfirmationPoll);
        activeConfirmationPoll = null;
        msg.textContent = "Still waiting on that confirmation — once you've clicked the link in your email, you can also just log in directly from the landing page.";
        return;
      }

      // Attempting a real sign-in with the same credentials just used to
      // sign up is a reliable, direct way to detect confirmation — an
      // unconfirmed account is blocked from signing in at all, so
      // success here can only mean confirmation genuinely happened,
      // regardless of which device it happened on.
      try {
        const { data: signInData, error: signInError } = await sb.auth.signInWithPassword({ email, password });
        if (signInData && signInData.session) {
          clearInterval(activeConfirmationPoll);
          activeConfirmationPoll = null;
          msg.textContent = "";
          await continueAfterConfirmedSignup(signInData.user.id);
        }
        // Any error here (most commonly "Email not confirmed") just
        // means keep waiting — not a real failure worth surfacing.
      } catch (err) {
        // A genuine network hiccup on one poll shouldn't kill the whole
        // loop — just try again on the next interval.
      }
    }, 3000);

    return;
  }

  await continueAfterConfirmedSignup(data.user.id);
});

// Shared by both the immediate-confirm path (Confirm Email is off, or
// the session comes back right away) and the polling path above (Confirm
// Email is on, and confirmation was just detected from any device) — the
// exact same next steps either way, so there's only one real place this
// logic can drift out of sync with itself.
async function continueAfterConfirmedSignup(userId) {
  state.userId = userId;
  updateAuthButtonLabel();
  trackFunnelEvent("signup_completed");
  // Every new real account gets a matching row in our own profiles table.
  try {
    await sb.from("profiles").upsert({ id: userId, is_premium: false });
  } catch (err) {
    console.error("Could not create profile row:", err);
  }

  emailForm.classList.add("hidden");

  if (state.premiumFirstFlow) {
    // This account was created specifically to buy Premium, before any
    // goal exists yet — so there's no path to generate. Go straight to
    // checkout instead of the normal seeking/reveal sequence.
    upgradeOverlay.classList.remove("hidden");
    return;
  }

  startSeekingDelay();
}

// Shared by both "just signed up" and "already logged in, starting
// another path" — the simulated AI delay, then building AND saving the
// new path as its own row so it shows up in the paths list later.
// previouslyCompleted: when set (only for "Expand my scroll"), this is
// the full list of items the person just finished. Two things happen
// with it: (1) it's hard-excluded from the raw candidate pool BEFORE the
// AI ever sees it — a guarantee, not just an instruction, that nothing
// already-completed can be recommended again — and (2) it's given to
// the AI as context, so the new path assumes that foundation and builds
// genuinely deeper rather than starting over.
function startSeekingDelay(previouslyCompleted = []) {
  document.getElementById("searching-dots").classList.remove("hidden");
  document.getElementById("seeking-status").textContent = t("seekingStatus1");
  // Reset here (not just at the one real completion point below) so the
  // rotation correctly resumes if this runs a second time — generating
  // another path, or "Expand my scroll" — rather than staying paused
  // from a previous completion.
  document.querySelector(".seeking-bird-wrap").classList.remove("loading-complete");
  // Same reset reasoning as above — a previous attempt's "limit
  // blocked" mode shouldn't leak into this fresh attempt, in case an
  // earlier try was blocked and a later one (after upgrading, say)
  // succeeds normally.
  const secretBtn = document.getElementById("secret-message-btn");
  delete secretBtn.dataset.mode;
  secretBtn.classList.add("hidden");
  // Same reasoning again — a previous attempt's "topic not recognized"
  // note shouldn't linger if this fresh attempt (a rephrased goal,
  // say) actually succeeds normally this time.
  state.pathWasGenericFallback = false;

  setTimeout(async () => {
    const topic = resolveTopic(state.goal);

    // Someone who just finished every item in a real path has
    // demonstrably progressed on this topic, regardless of what level
    // they originally self-reported — so an expansion always sequences
    // as "wellread" rather than reusing their original starting level.
    // Computed BEFORE the content fetch below, so a live articles/
    // courses search for an expansion is also framed at the right
    // level, not just the final sequencing pass.
    const levelToUse = previouslyCompleted.length > 0 ? "wellread" : state.level;

    let rawItems = await buildPathReal(state.goal, state.contentType, state.contentLanguage, levelToUse);
    // Captured immediately — .filter() below returns a fresh array that
    // wouldn't carry this custom property forward.
    const goalWasNotRecognized = !!rawItems._usedGenericFallback;

    if (previouslyCompleted.length > 0) {
      const completedIds = new Set(previouslyCompleted.map((it) => it.id));
      rawItems = rawItems.filter((it) => !completedIds.has(it.id));
    }

    // Real items are already fetched at this point — this next step asks
    // the AI to select and SEQUENCE them into a genuine progression based
    // on the person's level, choosing only from these real, verified
    // items (never inventing new ones). If the backend isn't running,
    // this gracefully falls back to the unsequenced live results rather
    // than breaking anything. The ONE exception: a genuine free-limit
    // rejection must stop this flow entirely, not degrade — see the
    // real bug this fixes in sequenceWithAI's own comment above it.
    try {
      state.currentPath = await sequenceWithAI(state.goal, levelToUse, state.format, state.timeCommitment, rawItems, previouslyCompleted, state.levelOther);
      state.pathWasGenericFallback = goalWasNotRecognized;
    } catch (err) {
      if (err.isFreeLimitBlock) {
        document.getElementById("searching-dots").classList.add("hidden");
        document.getElementById("seeking-status").textContent = "";
        document.querySelector(".seeking-bird-wrap").classList.add("loading-complete");
        // Real gap fixed here: previously, closing the overlay via
        // "Not now" (rather than the overlay's own "Go to my path"
        // button) left the person stuck on an empty seeking screen
        // with genuinely nothing to do — the button that normally
        // reveals a freshly-generated path never appears in this
        // blocked scenario, since nothing was actually generated. This
        // repurposes that same button as a persistent way forward that
        // stays visible on the underlying screen itself, regardless of
        // which overlay button (or none at all) they actually click.
        const secretBtn = document.getElementById("secret-message-btn");
        secretBtn.dataset.mode = "limit-blocked";
        secretBtn.textContent = t("seeking_go_to_path");
        secretBtn.classList.remove("hidden");
        openUpgrade("limit");
        return;
      }
      throw err; // anything else is a genuine, unexpected failure — surface it normally
    }
    state.currentPathId = null;
    state.completed = new Set();
    // A path generated while genuinely Premium is immediately, and
    // permanently, unlocked — same fair reasoning as the click-handler
    // fix above.
    state.currentPathUnlockedForever = state.isPremium;

    if (state.userId) {
      try {
        const { data, error } = await sb
          .from("paths")
          .insert({
            user_id: state.userId,
            goal: state.goal,
            topic,
            content_type: state.contentType,
            content_language: state.contentLanguage,
            items: state.currentPath, // the ACTUAL chosen items, not just enough info to re-search later
            unlocked_forever: state.isPremium,
          })
          .select()
          .single();
        if (error) console.error("Could not save new path:", error.message);
        else state.currentPathId = data.id;
      } catch (err) {
        console.error("Could not save new path:", err);
      }
    }

    document.getElementById("searching-dots").classList.add("hidden");
    document.getElementById("seeking-status").textContent = t("seekingStatus2");
    // The real signal this is genuinely done, not just paused mid-step —
    // a continuously-spinning circle otherwise reads as "still working"
    // even once the actual result is ready.
    document.querySelector(".seeking-bird-wrap").classList.add("loading-complete");
    const btn = document.getElementById("secret-message-btn");
    btn.classList.remove("hidden");
    btn.textContent = t("secretText");
  }, 2200);
}

function resolveTopic(goal) {
  const goalLower = (goal || "").toLowerCase();
  return (
    Object.keys(CATALOG).find(
      (k) => k !== "default" && CATALOG[k].keywords.some((kw) => goalLower.includes(kw.toLowerCase()))
    ) || "default"
  );
}

function filterItems(items, contentType, contentLanguage) {
  const typeMap = { books: "book", articles: "article", videos: "video", courses: "course" };
  const wantedType = typeMap[contentType];

  let result = wantedType ? items.filter((item) => item.type === wantedType) : items;
  // Never let the type filter alone produce an empty list — fall back to
  // everything rather than showing the user nothing.
  if (result.length === 0) result = items;

  if (contentLanguage && contentLanguage !== "any") {
    const byLang = result.filter((item) => item.lang === contentLanguage);
    // Same safety rule: if nothing matches the requested language, fall
    // back to the type-filtered set rather than an empty path — better
    // to show something in the "wrong" language than nothing at all.
    if (byLang.length > 0) result = byLang;
  }

  return result;
}

// buildPath stays synchronous — used ONLY as an emergency fallback inside
// render functions that can't await anything (see renderPathGrid /
// renderTracker below). It never makes a network call.
function buildPath(goal) {
  const topic = resolveTopic(goal);
  return filterItems(CATALOG[topic].books, state.contentType, state.contentLanguage);
}

// Real book search against Open Library — no API key needed, callable
// directly from the browser. Returns null (not throws) on failure, so
// the caller can decide how to fall back rather than crashing.
// Goals are typed conversationally ("I want to understand math"), but a
// search API needs the actual subject ("math"), not the whole sentence
// — searching the raw sentence returns almost nothing useful, since the
// API tries to match every word literally, filler included.
// Open Library's search API returned a real, confirmed 422 error for a
// bare 2-letter query like "AI" — but works fine once expanded to the
// full phrase ("artificial intelligence"). This covers the common short
// tech/study acronyms people are likely to type as their actual goal.
const ACRONYM_EXPANSIONS = {
  ai: "artificial intelligence",
  ml: "machine learning",
  ux: "user experience design",
  ui: "user interface design",
  cs: "computer science",
  it: "information technology",
  hr: "human resources",
  pr: "public relations",
  seo: "search engine optimization",
  vr: "virtual reality",
  ar: "augmented reality",
  nlp: "natural language processing",
};

// Maps our internal language codes to what Open Library actually
// expects (the YouTube equivalent now lives server-side, in
// videoSearchService.js, since the whole video search call moved there).
const OPENLIBRARY_LANG_CODES = { en: "eng", ar: "ara", fr: "fre" };

function extractSearchTerm(goal) {
  if (!goal) return "";
  let term = goal.trim();
  term = term.replace(
    /^(i want to|i'd like to|help me|please|can you)?\s*(understand|learn about|learn|study|read about|explore|master|get into|know about)\s+/i,
    ""
  );
  term = term.trim() || goal;

  // Handle compound/combined acronyms like "AI/ML" or "AI & ML" — split
  // on non-letter separators, expand any recognized acronym token
  // individually, and rejoin. A plain exact-string lookup alone would
  // miss "AI/ML" entirely (it's not a key in the dictionary), which was
  // producing a poor, narrow search that starved both APIs of results.
  const tokens = term.split(/[\s/,&]+|\band\b/i).filter(Boolean);
  if (tokens.length > 0 && tokens.length <= 3) {
    const expandedTokens = tokens.map((tok) => ACRONYM_EXPANSIONS[tok.toLowerCase()] || tok);
    const anyExpanded = expandedTokens.some((tok, i) => tok !== tokens[i]);
    if (anyExpanded) return expandedTokens.join(" ");
  }

  const wholeMatch = ACRONYM_EXPANSIONS[term.toLowerCase()];
  return wholeMatch || term;
}

// SCAFFOLDING — intentionally empty right now. No real local bookstore
// partnership exists yet (that's a real business conversation still
// pending, not a technical gap). Once one does — e.g. Jamalon or another
// store with a real affiliate program — add entries here, keyed by the
// book's exact title in lowercase, and matching results will
// immediately start showing a real local-store buy link. Nothing here
// is fake or placeholder data; it's genuinely empty until real data
// exists, on purpose.
const LOCAL_STORE_CATALOG = {
  // Example of the shape once real data exists (commented out on purpose):
  // "sophie's world": { storeName: "Jamalon", url: "https://www.jamalon.com/en/example" },
};

function findLocalStoreLink(book) {
  if (!book || !book.title) return null;
  const key = book.title.trim().toLowerCase();
  return LOCAL_STORE_CATALOG[key] || null;
}

async function searchBooksOpenLibrary(query, contentLanguage) {
  try {
    let url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=20`;
    const langCode = OPENLIBRARY_LANG_CODES[contentLanguage];
    if (langCode) url += `&language=${langCode}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error("Open Library request failed: " + res.status);
    const data = await res.json();
    return (data.docs || []).slice(0, 6).map((doc) => {
      // "public" ebook_access + a real Internet Archive identifier means
      // this book is genuinely, legally free to read/download (usually
      // public domain) — not every book has this, and we only ever link
      // to the real archive.org details page (never a guessed direct
      // file URL, since exact file naming isn't guaranteed and a wrong
      // guess would be a broken link).
      const hasFreeEbook = doc.ebook_access === "public" && Array.isArray(doc.ia) && doc.ia.length > 0;
      return {
        id: doc.key,
        type: "book",
        title: doc.title,
        author: doc.author_name ? doc.author_name[0] : "Unknown author",
        coverUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : null,
        pdfUrl: hasFreeEbook ? `https://archive.org/details/${doc.ia[0]}` : null,
        reason: `A real, current book match for "${query}".`,
      };
    });
  } catch (err) {
    console.error("Book search failed, will fall back to the demo catalog:", err);
    return null;
  }
}

// The YouTube key no longer lives in any frontend file — this now calls
// our own backend, which holds the real key server-side, same pattern
// as every other secret in this project (Anthropic, Stripe). Same auth
// + graceful-fallback philosophy as sequenceWithAI/searchContentWithAI.
async function searchVideosYouTube(query, contentLanguage) {
  try {
    const { data: sessionData } = await sb.auth.getSession();
    const accessToken = sessionData && sessionData.session ? sessionData.session.access_token : null;
    if (!accessToken) {
      console.warn("No active session found — skipping video search.");
      return null;
    }

    const res = await fetch(`${window.BACKEND_URL || "http://localhost:4242"}/api/search-videos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ query, contentLanguage }),
    });
    if (!res.ok) throw new Error("video search backend not available");
    const result = await res.json();
    return result.items && result.items.length > 0 ? result.items : null;
  } catch (err) {
    console.warn("Video search unavailable, will fall back to the demo catalog:", err.message);
    return null;
  }
}

// This is the REAL path builder used whenever a new path is actually
// created — it fetches live books AND videos instead of using the small
// hardcoded list for those types. Articles/courses still come from the
// static demo catalog for now (their own live integrations come later).
//
// This function is ALSO used as a fallback when reopening a path that
// was saved before the `items` column existed (no stored item list to
// replay) — for every path created after this fix, reopening reads the
// stored items directly instead of calling this again (see the click
// handler in renderPathsList).
async function buildPathReal(goal, contentType, contentLanguage, level) {
  const topic = resolveTopic(goal);
  const staticItems = CATALOG[topic].books;
  const cleanTerm = extractSearchTerm(goal) || topic;

  // Real gap found and fixed here: if the goal doesn't match any known
  // topic keyword (topic === "default") AND the live search also comes
  // back empty for it, the person was silently shown generic,
  // unrelated "default" catalog items with zero indication anything
  // went wrong — they'd reasonably assume this genuinely was their
  // best-matched path, not a fallback. Tracked here and surfaced
  // honestly by the caller (see startSeekingDelay) instead.
  let usedGenericFallback = false;

  const wantsBooks = contentType === "books" || contentType === "mix";
  const wantsVideos = contentType === "videos" || contentType === "mix";

  let bookResults = [];
  if (wantsBooks) {
    const liveBooks = await searchBooksOpenLibrary(cleanTerm, contentLanguage);
    if (liveBooks && liveBooks.length > 0) {
      bookResults = liveBooks;
    } else {
      bookResults = filterItems(staticItems, "books", contentLanguage); // API failed/empty — fall back, still honoring language
      if (topic === "default") usedGenericFallback = true;
    }
  }

  let videoResults = [];
  if (wantsVideos) {
    const liveVideos = await searchVideosYouTube(cleanTerm, contentLanguage);
    if (liveVideos && liveVideos.length > 0) {
      videoResults = liveVideos;
    } else {
      videoResults = filterItems(staticItems, "videos", contentLanguage); // API failed/no key/empty — fall back, still honoring language
      if (topic === "default") usedGenericFallback = true;
    }
  }

  function markResult(arr) {
    arr._usedGenericFallback = usedGenericFallback;
    return arr;
  }

  if (contentType === "books") return markResult(bookResults);
  if (contentType === "videos") return markResult(videoResults);
  if (contentType === "mix") {
    // Articles/courses stay static-only within "mix" for now — a
    // deliberate scoping choice to keep cost and complexity contained,
    // since real web search costs more per call than Open Library/
    // YouTube. Picking "Articles" or "Courses" specifically DOES use
    // the real live search below.
    const remainingStatic = staticItems.filter((item) => item.type !== "book" && item.type !== "video");
    return markResult([...bookResults, ...videoResults, ...remainingStatic]);
  }

  if (contentType === "articles" || contentType === "courses") {
    const liveContent = await searchContentWithAI(goal, contentType, level || "basics", contentLanguage);
    if (liveContent && liveContent.length > 0) return markResult(liveContent);
    if (topic === "default") usedGenericFallback = true;
    return markResult(filterItems(staticItems, contentType, contentLanguage)); // search failed/not configured — fall back to demo data
  }

  if (topic === "default") usedGenericFallback = true;
  return markResult(filterItems(staticItems, contentType, contentLanguage));
}

// Sends the real, already-fetched items to the backend to be selected
// and sequenced into a genuine beginner→mastery progression, based on
// EVERY answer from the questionnaire — level, format, and time
// commitment — not just the goal. Same fallback philosophy as
// everywhere else in this app (payment checkout, etc.): try the real
// backend first, and gracefully degrade — here, to the plain
// unsequenced live results — if it isn't reachable.
async function sequenceWithAI(goal, level, format, timeCommitment, items, previouslyCompleted = [], levelOther = "") {
  if (!items || items.length === 0) return items;
  try {
    // The backend now requires proof of a real, currently logged-in
    // session — this is what actually stops anyone who finds this URL
    // from calling it directly and draining real Anthropic billing with
    // no relation to genuine site usage.
    const { data: sessionData } = await sb.auth.getSession();
    const accessToken = sessionData && sessionData.session ? sessionData.session.access_token : null;
    if (!accessToken) {
      // Shouldn't normally happen — reaching this point in the flow
      // always implies a just-completed signup or an existing login —
      // but degrade gracefully rather than break the experience if it
      // somehow does.
      console.warn("No active session found — skipping AI sequencing.");
      return items;
    }

    const res = await fetch(`${window.BACKEND_URL || "http://localhost:4242"}/api/sequence-path`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ goal, level, format, timeCommitment, items, previouslyCompleted, levelOther }),
    });

    if (!res.ok) {
      // Real bug fixed here: a 403 free-limit rejection was previously
      // treated identically to a genuine network/server failure, and
      // the catch block below would quietly fall back to returning the
      // raw items anyway — completely bypassing the backend's correct
      // rejection, and letting a free user who reached this point
      // (e.g. re-entering existing credentials after appearing logged
      // out) generate an unlimited number of paths regardless of the
      // real limit. This specific case must propagate as a distinct,
      // recognizable signal instead of silently degrading.
      let body = null;
      try { body = await res.json(); } catch (e) {}
      if (res.status === 403 && body && body.code === "FREE_PATH_LIMIT_REACHED") {
        const limitError = new Error("free path limit reached");
        limitError.isFreeLimitBlock = true;
        throw limitError;
      }
      throw new Error("sequencing backend not available");
    }

    const result = await res.json();
    return result.path && result.path.length > 0 ? result.path : items;
  } catch (err) {
    if (err.isFreeLimitBlock) throw err; // re-throw — the caller must handle this distinctly, not degrade
    console.warn("AI sequencing unavailable, using unsequenced live results:", err.message);
    return items;
  }
}

// Real web search for articles/courses via the backend — no dedicated
// search API exists for either type, so this asks Claude to actually
// search the web and compose recommendations, grounded against genuine
// search results (see contentSearchService.js). Same auth requirement,
// same graceful-degrade philosophy as sequenceWithAI: on any failure,
// return null so buildPathReal falls back to the static demo catalog
// instead of breaking the experience.
async function searchContentWithAI(goal, contentType, level, contentLanguage) {
  try {
    const { data: sessionData } = await sb.auth.getSession();
    const accessToken = sessionData && sessionData.session ? sessionData.session.access_token : null;
    if (!accessToken) {
      console.warn("No active session found — skipping live content search.");
      return null;
    }

    const res = await fetch(`${window.BACKEND_URL || "http://localhost:4242"}/api/search-content`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ goal, contentType, level, contentLanguage }),
    });
    if (!res.ok) throw new Error("content search backend not available");
    const result = await res.json();
    return result.items && result.items.length > 0 ? result.items : null;
  } catch (err) {
    console.warn("Live content search unavailable, will fall back to the demo catalog:", err.message);
    return null;
  }
}

document.getElementById("secret-message-btn").addEventListener("click", () => {
  const btn = document.getElementById("secret-message-btn");
  if (btn.dataset.mode === "limit-blocked") {
    showPathsList();
    return;
  }
  trackFunnelEvent("path_generated", { contentType: state.contentType, itemCount: state.currentPath.length });
  renderPathGrid();
  showScreen("reveal");
});

// ---------- reveal: free/premium locked path ----------
function renderPathGrid() {
  const grid = document.getElementById("path-grid");
  if (!grid) return;
  grid.innerHTML = "";
  const path = state.currentPath.length ? state.currentPath : buildPath(state.goal);

  const fallbackNote = document.getElementById("generic-fallback-note");
  if (fallbackNote) fallbackNote.classList.toggle("hidden", !state.pathWasGenericFallback);

  // Free users see the first 2 steps unlocked — enough to actually
  // perceive the AI's real step-to-step progression, not just judge a
  // single isolated item on faith. But NEVER the entire path, even on
  // a short 3-item path, so Premium always has something real left to
  // unlock (paths are never shorter than 3 items by design, but this
  // stays safe even in a rare edge case where one somehow is).
  let unlockedCount = Math.min(2, path.length);
  if (unlockedCount === path.length) unlockedCount = Math.max(0, path.length - 1);

  // "Fully unlocked" now means either currently Premium, OR this
  // specific path was genuinely unlocked while Premium at some point
  // before — see currentPathUnlockedForever's own comment near state's
  // definition for the real reasoning (paid access shouldn't vanish
  // the moment a subscription lapses).
  const pathIsFullyUnlocked = state.isPremium || state.currentPathUnlockedForever;

  document.getElementById("plan-badge").textContent = pathIsFullyUnlocked
    ? t("premiumPlan")
    : unlockedCount > 1
    ? `${t("freePlanTwo")} ${path.length}`
    : `${t("freePlan")} ${path.length}`;

  path.forEach((book, i) => {
    const locked = !pathIsFullyUnlocked && i >= unlockedCount;
    const card = document.createElement("article");
    card.className = "path-card" + (locked ? " locked" : "");

    if (locked) {
      // Real accessibility fix: this was previously only clickable with
      // a mouse — an <article> has no native keyboard behavior at all,
      // so anyone navigating by keyboard or screen reader couldn't
      // trigger the upgrade prompt. role="button" + tabindex make it
      // reachable via Tab; the keydown handler below makes Enter/Space
      // actually activate it, matching real button behavior.
      card.setAttribute("role", "button");
      card.setAttribute("tabindex", "0");
      card.setAttribute("aria-label", `${escapeHtml(book.title)} — ${t("unlockPrompt")}`);
      card.innerHTML = `
        <div class="locked-content">
          <span class="path-index">${String(i + 1).padStart(2, "0")}</span>
          <h3>${escapeHtml(book.title)}</h3>
          <p>${escapeHtml(book.author)}</p>
        </div>
        <div class="lock-overlay">
          <span style="font-size:1.3rem">🔒</span>
          <span class="lock-label">${t("unlockPrompt")}</span>
        </div>`;
      card.addEventListener("click", openUpgrade);
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openUpgrade();
        }
      });
    } else {
      const isBook = book.type === "book" || !book.type;
      let extraLinksHtml = "";

      if (!isBook && book.url) {
        const safeBookUrl = safeUrl(book.url);
        if (safeBookUrl) extraLinksHtml = `<a href="${safeBookUrl}" target="_blank" rel="noopener" class="text-button" style="margin-top:.5rem;display:inline-block">${t("open_link")} ↗</a>`;
      } else if (isBook) {
        const linkParts = [];
        const safePdfUrl = safeUrl(book.pdfUrl);
        if (safePdfUrl) {
          linkParts.push(
            `<a href="${safePdfUrl}" target="_blank" rel="noopener" class="text-button" style="margin-top:.5rem;margin-right:1rem;display:inline-block">${t("read_free_link")} ↗</a>`
          );
        }
        const localStore = findLocalStoreLink(book);
        const safeStoreUrl = localStore ? safeUrl(localStore.url) : "";
        if (localStore && safeStoreUrl) {
          linkParts.push(
            `<a href="${safeStoreUrl}" target="_blank" rel="noopener" class="text-button" style="margin-top:.5rem;display:inline-block">${t("buy_locally_prefix")} ${escapeHtml(localStore.storeName)} ↗</a>`
          );
        }
        extraLinksHtml = linkParts.join("");
      }

      const safeCoverUrl = safeUrl(book.coverUrl);
      const coverHtml = safeCoverUrl
        ? `<img src="${safeCoverUrl}" alt="Cover of ${escapeHtml(book.title)}" style="width:48px;height:auto;float:left;margin:0 .6rem .4rem 0;border:1px solid rgba(140,107,36,.4)">`
        : "";
      card.innerHTML = `
        <span class="path-index">${String(i + 1).padStart(2, "0")}</span>
        ${coverHtml}
        <h3>${escapeHtml(book.title)}</h3>
        <p>${escapeHtml(book.author)} — ${escapeHtml(book.reason)}</p>
        ${extraLinksHtml}`;
    }
    grid.appendChild(card);
  });

  const trackerBtn = document.getElementById("tracker-button");
  trackerBtn.textContent = state.isPremium ? t("unrollTracker") : t("unlockTracker");
}

// Explicit product decision: content stays permanently unlocked once
// earned (see pathIsFullyUnlocked in renderPathGrid), but tracker
// access specifically requires an ACTIVE subscription — a real,
// deliberate distinction between "content you paid for, keep it" and
// "an ongoing tool that needs an active subscription to keep using."
document.getElementById("tracker-button").addEventListener("click", () => {
  if (!state.isPremium) {
    openUpgrade();
    return;
  }
  renderTracker();
  showScreen("tracker");
});

// ---------- tracker (premium only) ----------
function renderTracker() {
  const list = document.getElementById("tracker-list");
  if (!list) return;
  list.innerHTML = "";
  const path = state.currentPath.length ? state.currentPath : buildPath(state.goal);

  path.forEach((book) => {
    const done = state.completed.has(book.id);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tracker-item" + (done ? " done" : "");
    btn.setAttribute("aria-pressed", String(done));
    btn.innerHTML = `
      <span class="tracker-check">${done ? "✓" : ""}</span>
      <span class="tracker-book">${escapeHtml(book.title)}</span>
      <span class="tracker-stage">${escapeHtml(book.author)}</span>`;
    btn.addEventListener("click", async () => {
      const isDone = state.completed.has(book.id);
      if (isDone) {
        state.completed.delete(book.id);
        if (state.userId && state.currentPathId) {
          await sb.from("progress").delete()
            .eq("user_id", state.userId)
            .eq("book_id", book.id)
            .eq("path_id", state.currentPathId);
        }
      } else {
        state.completed.add(book.id);
        if (state.userId && state.currentPathId) {
          await sb.from("progress").upsert({
            user_id: state.userId,
            book_id: book.id,
            path_id: state.currentPathId,
            done: true,
          });
        }
      }
      renderTracker();
    });
    list.appendChild(btn);
  });

  document.getElementById("progress-count").textContent = state.completed.size;
  document.getElementById("progress-total").textContent = path.length;
  document.getElementById("progress-label").textContent =
    state.completed.size === 1 ? t("progressLabelSingle") : t("progressLabel");

  // Only appears once every real item in the current path has actually
  // been marked complete — this is the moment someone's demonstrated
  // real progress and a genuine "go deeper" offer makes sense.
  const allComplete = path.length > 0 && state.completed.size === path.length;
  document.getElementById("expand-scroll-button").classList.toggle("hidden", !allComplete);

  const newPathBtn = document.getElementById("new-path-button");
  newPathBtn.textContent = state.isPremium ? t("newPathPremium") : t("newPathFree");
}

document.getElementById("expand-scroll-button").addEventListener("click", () => {
  const previouslyCompleted = state.currentPath; // snapshot before anything gets overwritten
  showScreen("seeking");
  document.getElementById("email-form").classList.add("hidden");
  document.getElementById("secret-message-btn").classList.add("hidden");
  document.getElementById("seeking-status").textContent = "";
  startSeekingDelay(previouslyCompleted);
});

document.getElementById("new-path-button").addEventListener("click", () => {
  if (state.isPremium) {
    state.goal = "";
    state.completed = new Set();
    state.currentPathId = null;
    goalInput.value = "";
    goalMessage.textContent = "";
    showScreen("landing");
    goalInput.focus();
  } else {
    openUpgrade();
  }
});

// Reaching the tracker screen always implies a real logged-in account
// (premium status itself is only ever checked against a real profiles
// row), so state.userId is guaranteed to already be set here — no need
// to log in again just to see the list of saved paths.
document.getElementById("view-paths-button").addEventListener("click", () => {
  showPathsList();
});
document.getElementById("reveal-view-paths-button").addEventListener("click", () => {
  // Real bug fixed here: someone (a free user specifically, since
  // tracker access is Premium-only) who clicked into a saved path from
  // their paths list had NO way back to that list without a manual
  // page refresh — the reveal screen simply had no such button at all.
  showPathsList();
});

// Lets someone bounce between the tracker (checklist) and the results
// screen (covers, reasons, open/buy links) freely, rather than only
// being able to go one direction.
document.getElementById("back-to-results-button").addEventListener("click", () => {
  renderPathGrid();
  showScreen("reveal");
});

// A REAL sign-out, not just clearing our own in-memory state. This
// matters specifically because of the session-persistence feature we
// built earlier: Supabase's client keeps the session token in the
// browser so a refresh logs you back in automatically. Without actually
// calling sb.auth.signOut() here, resetting `state` alone would be
// pointless — a refresh (or even just navigating within the app) would
// silently restore the same account, making it impossible to actually
// switch accounts or log out for real.
async function logOut() {
  try {
    await sb.auth.signOut();
  } catch (err) {
    console.error("Sign out failed:", err);
  }

  state.userId = null;
  updateAuthButtonLabel();
  state.isPremium = false;
  state.currentPath = [];
  state.currentPathId = null;
  state.completed = new Set();
  state.goal = "";
  goalInput.value = "";
  goalMessage.textContent = "";
  showScreen("landing");
}

// Redundant "Log out" buttons on the paths/tracker screens were removed
// — logging out is now handled consistently from the one real place,
// the top-bar button (which also correctly reflects real auth state,
// see updateAuthButtonLabel).

// ---------- verse overlay ----------
const verseOverlay = document.getElementById("verse-overlay");
document.getElementById("verse-button").addEventListener("click", () => {
  verseOverlay.classList.remove("hidden");
  document.getElementById("close-verse-button").focus();
});
document.getElementById("close-verse-button").addEventListener("click", () => {
  verseOverlay.classList.add("hidden");
  document.getElementById("verse-button").focus();
});
verseOverlay.addEventListener("click", (e) => { if (e.target === verseOverlay) verseOverlay.classList.add("hidden"); });

// ---------- upgrade / payment overlay ----------
const upgradeOverlay = document.getElementById("upgrade-overlay");
function openUpgrade(reason = null) {
  document.getElementById("checkout-status").textContent = "";
  // Real UX gap fixed here: this overlay opens from several different
  // contexts (a locked card, the paths list, the premium-first flow,
  // and now a genuine free-limit block) — but always looked identical,
  // with no explanation for why someone hitting the limit specifically
  // was suddenly shown a payment screen out of nowhere. Only that one
  // specific context now shows the explanatory message and an easy way
  // back to their existing path, instead of feeling like a dead end.
  const limitMsg = document.getElementById("upgrade-limit-message");
  const goToPathsBtn = document.getElementById("go-to-paths-button");
  const showLimitContext = reason === "limit" && state.userId && !state.premiumFirstFlow;
  limitMsg.classList.toggle("hidden", !showLimitContext);
  goToPathsBtn.classList.toggle("hidden", !showLimitContext);
  upgradeOverlay.classList.remove("hidden");
}

// Handles checkout being closed WITHOUT completing — either Paddle's own
// checkout.closed event (cancelling inside the payment form itself), or
// our own "Not now" / click-outside close. In the normal flow this needs
// nothing extra: closing just reveals the real screen that was already
// underneath (paths, tracker, reveal). But the premium-first flow (from
// the standalone pricing page) has NOTHING real underneath at this
// point — no goal, no path, nothing — so leaving it as-is is exactly
// the "stuck on an empty page forever" bug. Send them back to landing
// instead, same as if they'd never started.
function handlePaddleCheckoutClosed() {
  upgradeOverlay.classList.add("hidden");
  if (state.premiumFirstFlow) {
    state.premiumFirstFlow = false;
    showScreen("landing");
  }
}

document.getElementById("close-upgrade-button").addEventListener("click", handlePaddleCheckoutClosed);
upgradeOverlay.addEventListener("click", (e) => { if (e.target === upgradeOverlay) handlePaddleCheckoutClosed(); });
document.getElementById("go-to-paths-button").addEventListener("click", () => {
  upgradeOverlay.classList.add("hidden");
  showPathsList();
});

// Remembers the last known premium status in localStorage — this lets
// us reliably detect "you just became premium" from ANY place that
// fetches the real status (login, session restore, or right after
// paying), not just the one narrow page/session where a payment
// happened. This matters because a real payment's confirmation often
// only actually shows up the NEXT time the app checks — e.g. after a
// refresh, or coming back later — not necessarily while someone is
// still watching the exact tab where they paid.
function celebrateIfNewlyPremium(isPremiumNow) {
  const KEY = "bayt_al_hikma_last_known_premium";
  let wasPremiumBefore = false;
  try {
    wasPremiumBefore = localStorage.getItem(KEY) === "yes";
  } catch (err) {
    return; // storage unavailable — just skip the celebration, not fatal
  }
  if (isPremiumNow && !wasPremiumBefore) {
    trackFunnelEvent("upgraded_to_premium");
    celebratePremiumUnlock();
  }
  try {
    localStorage.setItem(KEY, isPremiumNow ? "yes" : "no");
  } catch (err) {
    // Non-fatal if this fails.
  }
}

// A brief, tasteful moment when someone genuinely becomes premium —
// called from both the real Paddle confirmation and the demo fallback,
// so the experience feels the same regardless of which path granted it.
// Real funnel tracking — the 5 genuine stages of the actual user
// journey (goal submitted, signed up, path generated, upgraded), not
// just raw page views. Defensive against window.umami not existing
// (script blocked, still loading, or not configured yet) — tracking is
// a nice-to-have, never something that should be able to break the app.
function trackFunnelEvent(name, data) {
  try {
    if (window.umami && typeof window.umami.track === "function") {
      window.umami.track(name, data);
    }
  } catch (err) {
    // Never let analytics failures affect the actual user experience.
  }
}

function celebratePremiumUnlock() {
  const el = document.getElementById("premium-celebration");
  if (!el) return;
  el.classList.remove("hidden");
  // Letting the browser paint the "hidden" removal first, THEN adding
  // "showing" on the next frame — this is what actually makes the CSS
  // transition play, rather than jumping straight to the end state.
  // Falls back to a short setTimeout if requestAnimationFrame isn't
  // available in this environment — same visual result either way.
  const nextFrame = typeof requestAnimationFrame === "function" ? requestAnimationFrame : (cb) => setTimeout(cb, 16);
  nextFrame(() => {
    nextFrame(() => el.classList.add("showing"));
  });
  setTimeout(() => {
    el.classList.remove("showing");
    setTimeout(() => el.classList.add("hidden"), 500); // matches the CSS transition duration
  }, 3200);
}

// Called when Paddle's checkout widget reports the purchase flow
// completed — this is UX feedback ONLY. It never sets premium status
// directly, since a browser event could be spoofed by anyone with dev
// tools open. Instead, it polls Supabase briefly to reflect what the
// REAL, authoritative source — the server-side webhook — actually set.
async function handlePaddleCheckoutCompleted() {
  const status = document.getElementById("checkout-status");
  const btn = document.getElementById("checkout-button");
  status.textContent = "Payment received — confirming your account...";

  for (let attempt = 0; attempt < 6; attempt++) {
    await new Promise((r) => setTimeout(r, 1500));
    try {
      const { data: profile } = await sb.from("profiles").select("is_premium").eq("id", state.userId).single();
      if (profile && profile.is_premium) {
        state.isPremium = true;
        btn.disabled = false;
        upgradeOverlay.classList.add("hidden");
        status.textContent = "";
        celebrateIfNewlyPremium(state.isPremium);

        if (state.premiumFirstFlow) {
          // They paid before ever picking a goal — now send them to
          // actually do that, already Premium from the very start.
          state.premiumFirstFlow = false;
          showScreen("landing");
          return;
        }

        renderPathGrid();
        renderTracker();
        return;
      }
    } catch (err) {
      console.warn("Checking premium status failed:", err);
    }
  }
  btn.disabled = false;
  status.textContent = "Payment received! It may take a moment to reflect — try refreshing shortly.";
}

document.getElementById("checkout-button").addEventListener("click", async () => {
  const status = document.getElementById("checkout-status");
  const btn = document.getElementById("checkout-button");
  status.textContent = "";
  btn.disabled = true;

  const priceId = window.PADDLE_PRICE_ID;
  const paddleReady = window.Paddle && priceId && !priceId.includes("PASTE_YOUR");

  if (paddleReady) {
    try {
      Paddle.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        // This is what lets the webhook know WHICH user just paid —
        // without it, a successful payment would have no way to be
        // linked back to a specific account.
        customData: { userId: state.userId },
      });
      btn.disabled = false;
      return;
    } catch (err) {
      console.warn("Paddle checkout failed to open, falling back to demo unlock:", err);
    }
  }

  // Demo fallback — same philosophy as everywhere else in this app: try
  // the real provider first, gracefully degrade if it isn't configured
  // yet (e.g. still testing locally without real Paddle keys).
  console.warn("Paddle not configured, using demo unlock instead.");
  setTimeout(async () => {
    state.isPremium = true;
    if (state.userId) {
      await sb.from("profiles").upsert({ id: state.userId, is_premium: true });
    }
    btn.disabled = false;
    upgradeOverlay.classList.add("hidden");
    renderPathGrid();
    renderTracker();
    celebrateIfNewlyPremium(state.isPremium);
  }, 900);
});

applyLang("en");
if (window.lucide) lucide.createIcons();

// ---------- restore session on page load ----------
// Supabase's client already remembers the session across a refresh (it
// saves it in the browser automatically) — the gap was that OUR OWN app
// state (state.userId, state.isPremium) never bothered to check. This
// runs once, right when the page loads, and asks Supabase directly:
// "is anyone actually still logged in?"
(async function restoreSession() {
  try {
    const { data, error } = await sb.auth.getSession();
    if (error) {
      console.error("Could not check for an existing session:", error.message);
      return;
    }

    const session = data.session;
    if (!session) {
      // Nobody logged in. Normally that just means a fresh visit — stay
      // on the landing page. But someone arriving from the standalone
      // pricing page who already clicked "Get Premium" has a different
      // intent: they've decided to pay before ever picking a goal, so
      // send them straight to account creation instead of making them
      // fake their way through a goal first.
      const params = new URLSearchParams(window.location.search);
      if (params.get("premium") === "1") {
        state.premiumFirstFlow = true;
        showScreen("seeking");
        document.getElementById("searching-dots").classList.add("hidden");
        document.getElementById("secret-message-btn").classList.add("hidden");
        document.getElementById("email-form").classList.remove("hidden");
      }
      return;
    }

    state.userId = session.user.id;
    updateAuthButtonLabel();

    const { data: profile } = await sb
      .from("profiles")
      .select("is_premium")
      .eq("id", session.user.id)
      .single();
    state.isPremium = profile ? profile.is_premium : false;
    celebrateIfNewlyPremium(state.isPremium);

    // Same destination as a manual login — their real saved paths list,
    // not a guess at which single path to show.
    await showPathsList();
  } catch (err) {
    console.error("Session restore failed:", err);
  }
})();

// ---------- how-it-works: open by default, collapsible, remembered ----------
(function initHowItWorks() {
  const HOW_IT_WORKS_KEY = "bayt_al_hikma_how_it_works_collapsed";
  const toggle = document.getElementById("how-it-works-toggle");
  const content = document.getElementById("how-it-works-content");
  if (!toggle || !content) return;

  let startCollapsed = false;
  try {
    // Genuine first-time visitors (nothing stored yet) always see it
    // OPEN — that's the whole point, since they're the ones most likely
    // to be confused. Only someone who has explicitly collapsed it
    // before sees it start collapsed on a later visit.
    startCollapsed = localStorage.getItem(HOW_IT_WORKS_KEY) === "yes";
  } catch (err) {
    // Storage unavailable — default to open, the safer choice for clarity.
  }

  function setState(collapsed) {
    content.classList.toggle("collapsed", collapsed);
    toggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
  }

  setState(startCollapsed);

  toggle.addEventListener("click", () => {
    const isNowCollapsed = !content.classList.contains("collapsed");
    setState(isNowCollapsed);
    try {
      localStorage.setItem(HOW_IT_WORKS_KEY, isNowCollapsed ? "yes" : "no");
    } catch (err) {
      // Non-fatal if this fails — just won't be remembered next visit.
    }
  });
})();

// ---------- cookie / local storage consent banner ----------
(function initCookieBanner() {
  const CONSENT_KEY = "bayt_al_hikma_cookie_consent";
  const banner = document.getElementById("cookie-consent-banner");
  const acceptBtn = document.getElementById("cookie-accept-button");
  if (!banner || !acceptBtn) return;

  let alreadyConsented = false;
  try {
    alreadyConsented = localStorage.getItem(CONSENT_KEY) === "yes";
  } catch (err) {
    // Storage can be unavailable in some private-browsing situations —
    // fail safe by just not showing the banner rather than crashing.
    console.warn("Could not check cookie consent status:", err);
    return;
  }

  if (!alreadyConsented) {
    banner.classList.remove("hidden");
  }

  acceptBtn.addEventListener("click", () => {
    try {
      localStorage.setItem(CONSENT_KEY, "yes");
    } catch (err) {
      console.warn("Could not save cookie consent choice:", err);
    }
    banner.classList.add("hidden");
  });
})();