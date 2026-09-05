/* T's Services — language switcher
   ---------------------------------------------------------------------------
   Elements opt in with data-i18n="key" (textContent) or data-i18n-html="key"
   (innerHTML, for strings that carry markup like the hero headline). Anything
   without one of those attributes is left alone.

   WHAT IS TRANSLATED: navigation, hero, cart, section headings — the chrome
   people navigate by.

   WHAT IS NOT, DELIBERATELY: the ban-risk notice, the FAQ answers, the ToS and
   trademark disclaimers. Those are the paragraphs that decide whether a
   customer understood what they were buying and what could happen to their
   account. A translation nobody fluent has checked is worse than English there
   — get a speaker to do those before promising them in another language.
   --------------------------------------------------------------------------- */
(function () {
  'use strict';

  var STORE_KEY = 'ts_lang';

  /* Native names — people look for their own language, not the English name. */
  var LANGS = [
    { code: 'en', label: 'EN', name: 'English' },
    { code: 'es', label: 'ES', name: 'Español' },
    { code: 'pt', label: 'PT', name: 'Português' },
    { code: 'fr', label: 'FR', name: 'Français' },
    { code: 'de', label: 'DE', name: 'Deutsch' },
    { code: 'it', label: 'IT', name: 'Italiano' },
    { code: 'nl', label: 'NL', name: 'Nederlands' },
    { code: 'pl', label: 'PL', name: 'Polski' },
    { code: 'sv', label: 'SV', name: 'Svenska' },
    { code: 'tr', label: 'TR', name: 'Türkçe' },
    { code: 'ru', label: 'RU', name: 'Русский' },
    { code: 'ar', label: 'AR', name: 'العربية', rtl: true },
    { code: 'hi', label: 'HI', name: 'हिन्दी' },
    { code: 'id', label: 'ID', name: 'Indonesia' },
    { code: 'vi', label: 'VI', name: 'Tiếng Việt' },
    { code: 'th', label: 'TH', name: 'ไทย' },
    { code: 'zh', label: 'ZH', name: '中文' },
    { code: 'ja', label: 'JA', name: '日本語' },
    { code: 'ko', label: 'KO', name: '한국어' }
  ];

  var T = {
    en: {
      'nav.home': 'Home', 'nav.products': 'Products', 'nav.partners': 'Partners',
      'nav.faq': 'FAQ', 'nav.support': 'Support', 'nav.cart': 'Cart', 'nav.signIn': 'Sign In',
      'hero.kicker': 'Trusted by many',
      'hero.title': 'Best products at<br />your <span class="hl">fingertips.</span>',
      'hero.trust1': 'Instant delivery', 'hero.trust2': 'Secure checkout', 'hero.trust3': 'Real support 24/7',
      'hero.ctaShop': 'Browse Products', 'hero.ctaAccount': 'Create an Account',
      'cart.title': 'Your cart', 'cart.emptyTitle': 'Nothing in here yet',
      'cart.emptyCta': 'Create an Account', 'cart.subtotal': 'Subtotal', 'cart.checkout': 'Checkout',
      'sec.products': 'What We Sell', 'sec.partners': 'Who We Work With', 'sec.setup': 'Buy to Launch',
      'sec.faq': 'FAQ', 'sec.account': 'Sign In', 'sec.support': 'Need a Hand?'
    },
    es: {
      'nav.home': 'Inicio', 'nav.products': 'Productos', 'nav.partners': 'Socios',
      'nav.faq': 'Preguntas', 'nav.support': 'Soporte', 'nav.cart': 'Carrito', 'nav.signIn': 'Entrar',
      'hero.kicker': 'La confianza de muchos',
      'hero.title': 'Los mejores productos<br />a tu <span class="hl">alcance.</span>',
      'hero.trust1': 'Entrega inmediata', 'hero.trust2': 'Pago seguro', 'hero.trust3': 'Soporte real 24/7',
      'hero.ctaShop': 'Ver productos', 'hero.ctaAccount': 'Crear una cuenta',
      'cart.title': 'Tu carrito', 'cart.emptyTitle': 'Todavía no hay nada aquí',
      'cart.emptyCta': 'Crear una cuenta', 'cart.subtotal': 'Subtotal', 'cart.checkout': 'Pagar',
      'sec.products': 'Lo que vendemos', 'sec.partners': 'Con quién trabajamos', 'sec.setup': 'De la compra al juego',
      'sec.faq': 'Preguntas frecuentes', 'sec.account': 'Entrar', 'sec.support': '¿Necesitas ayuda?'
    },
    pt: {
      'nav.home': 'Início', 'nav.products': 'Produtos', 'nav.partners': 'Parceiros',
      'nav.faq': 'Perguntas', 'nav.support': 'Suporte', 'nav.cart': 'Carrinho', 'nav.signIn': 'Entrar',
      'hero.kicker': 'A confiança de muitos',
      'hero.title': 'Os melhores produtos<br />ao seu <span class="hl">alcance.</span>',
      'hero.trust1': 'Entrega imediata', 'hero.trust2': 'Pagamento seguro', 'hero.trust3': 'Suporte real 24/7',
      'hero.ctaShop': 'Ver produtos', 'hero.ctaAccount': 'Criar uma conta',
      'cart.title': 'Seu carrinho', 'cart.emptyTitle': 'Ainda não há nada aqui',
      'cart.emptyCta': 'Criar uma conta', 'cart.subtotal': 'Subtotal', 'cart.checkout': 'Finalizar',
      'sec.products': 'O que vendemos', 'sec.partners': 'Com quem trabalhamos', 'sec.setup': 'Da compra ao jogo',
      'sec.faq': 'Perguntas frequentes', 'sec.account': 'Entrar', 'sec.support': 'Precisa de ajuda?'
    },
    fr: {
      'nav.home': 'Accueil', 'nav.products': 'Produits', 'nav.partners': 'Partenaires',
      'nav.faq': 'FAQ', 'nav.support': 'Assistance', 'nav.cart': 'Panier', 'nav.signIn': 'Connexion',
      'hero.kicker': 'La confiance de nombreux clients',
      'hero.title': 'Les meilleurs produits<br />à portée de <span class="hl">main.</span>',
      'hero.trust1': 'Livraison instantanée', 'hero.trust2': 'Paiement sécurisé', 'hero.trust3': 'Assistance réelle 24h/24',
      'hero.ctaShop': 'Voir les produits', 'hero.ctaAccount': 'Créer un compte',
      'cart.title': 'Votre panier', 'cart.emptyTitle': 'Rien ici pour l’instant',
      'cart.emptyCta': 'Créer un compte', 'cart.subtotal': 'Sous-total', 'cart.checkout': 'Commander',
      'sec.products': 'Ce que nous vendons', 'sec.partners': 'Nos partenaires', 'sec.setup': "De l'achat au lancement",
      'sec.faq': 'Questions fréquentes', 'sec.account': 'Connexion', 'sec.support': "Besoin d'aide ?"
    },
    de: {
      'nav.home': 'Start', 'nav.products': 'Produkte', 'nav.partners': 'Partner',
      'nav.faq': 'FAQ', 'nav.support': 'Support', 'nav.cart': 'Warenkorb', 'nav.signIn': 'Anmelden',
      'hero.kicker': 'Von vielen genutzt',
      'hero.title': 'Beste Produkte<br />in deiner <span class="hl">Reichweite.</span>',
      'hero.trust1': 'Sofortige Lieferung', 'hero.trust2': 'Sicherer Checkout', 'hero.trust3': 'Echter Support rund um die Uhr',
      'hero.ctaShop': 'Produkte ansehen', 'hero.ctaAccount': 'Konto erstellen',
      'cart.title': 'Dein Warenkorb', 'cart.emptyTitle': 'Hier ist noch nichts',
      'cart.emptyCta': 'Konto erstellen', 'cart.subtotal': 'Zwischensumme', 'cart.checkout': 'Zur Kasse',
      'sec.products': 'Was wir verkaufen', 'sec.partners': 'Mit wem wir arbeiten', 'sec.setup': 'Vom Kauf zum Start',
      'sec.faq': 'Häufige Fragen', 'sec.account': 'Anmelden', 'sec.support': 'Brauchst du Hilfe?'
    },
    it: {
      'nav.home': 'Home', 'nav.products': 'Prodotti', 'nav.partners': 'Partner',
      'nav.faq': 'FAQ', 'nav.support': 'Supporto', 'nav.cart': 'Carrello', 'nav.signIn': 'Accedi',
      'hero.kicker': 'Scelto da molti',
      'hero.title': 'I migliori prodotti<br />a portata di <span class="hl">mano.</span>',
      'hero.trust1': 'Consegna immediata', 'hero.trust2': 'Pagamento sicuro', 'hero.trust3': 'Supporto reale 24/7',
      'hero.ctaShop': 'Vedi i prodotti', 'hero.ctaAccount': 'Crea un account',
      'cart.title': 'Il tuo carrello', 'cart.emptyTitle': 'Qui non c’è ancora nulla',
      'cart.emptyCta': 'Crea un account', 'cart.subtotal': 'Subtotale', 'cart.checkout': 'Vai al pagamento',
      'sec.products': 'Cosa vendiamo', 'sec.partners': 'Con chi lavoriamo', 'sec.setup': "Dall'acquisto al gioco",
      'sec.faq': 'Domande frequenti', 'sec.account': 'Accedi', 'sec.support': 'Ti serve aiuto?'
    },
    nl: {
      'nav.home': 'Home', 'nav.products': 'Producten', 'nav.partners': 'Partners',
      'nav.faq': 'FAQ', 'nav.support': 'Support', 'nav.cart': 'Winkelwagen', 'nav.signIn': 'Inloggen',
      'hero.kicker': 'Door velen vertrouwd',
      'hero.title': 'De beste producten<br />binnen <span class="hl">handbereik.</span>',
      'hero.trust1': 'Directe levering', 'hero.trust2': 'Veilig afrekenen', 'hero.trust3': 'Echte support 24/7',
      'hero.ctaShop': 'Bekijk producten', 'hero.ctaAccount': 'Account aanmaken',
      'cart.title': 'Je winkelwagen', 'cart.emptyTitle': 'Hier staat nog niets',
      'cart.emptyCta': 'Account aanmaken', 'cart.subtotal': 'Subtotaal', 'cart.checkout': 'Afrekenen',
      'sec.products': 'Wat we verkopen', 'sec.partners': 'Met wie we werken', 'sec.setup': 'Van aankoop tot start',
      'sec.faq': 'Veelgestelde vragen', 'sec.account': 'Inloggen', 'sec.support': 'Hulp nodig?'
    },
    pl: {
      'nav.home': 'Start', 'nav.products': 'Produkty', 'nav.partners': 'Partnerzy',
      'nav.faq': 'FAQ', 'nav.support': 'Pomoc', 'nav.cart': 'Koszyk', 'nav.signIn': 'Zaloguj się',
      'hero.kicker': 'Zaufało nam wielu',
      'hero.title': 'Najlepsze produkty<br />w zasięgu <span class="hl">ręki.</span>',
      'hero.trust1': 'Natychmiastowa dostawa', 'hero.trust2': 'Bezpieczna płatność', 'hero.trust3': 'Prawdziwe wsparcie 24/7',
      'hero.ctaShop': 'Zobacz produkty', 'hero.ctaAccount': 'Załóż konto',
      'cart.title': 'Twój koszyk', 'cart.emptyTitle': 'Na razie pusto',
      'cart.emptyCta': 'Załóż konto', 'cart.subtotal': 'Suma częściowa', 'cart.checkout': 'Do kasy',
      'sec.products': 'Co sprzedajemy', 'sec.partners': 'Z kim współpracujemy', 'sec.setup': 'Od zakupu do gry',
      'sec.faq': 'Częste pytania', 'sec.account': 'Zaloguj się', 'sec.support': 'Potrzebujesz pomocy?'
    },
    sv: {
      'nav.home': 'Hem', 'nav.products': 'Produkter', 'nav.partners': 'Partners',
      'nav.faq': 'FAQ', 'nav.support': 'Support', 'nav.cart': 'Varukorg', 'nav.signIn': 'Logga in',
      'hero.kicker': 'Betrodd av många',
      'hero.title': 'Bästa produkterna<br />inom <span class="hl">räckhåll.</span>',
      'hero.trust1': 'Direkt leverans', 'hero.trust2': 'Säker betalning', 'hero.trust3': 'Riktig support dygnet runt',
      'hero.ctaShop': 'Se produkter', 'hero.ctaAccount': 'Skapa konto',
      'cart.title': 'Din varukorg', 'cart.emptyTitle': 'Inget här ännu',
      'cart.emptyCta': 'Skapa konto', 'cart.subtotal': 'Delsumma', 'cart.checkout': 'Till kassan',
      'sec.products': 'Vad vi säljer', 'sec.partners': 'Vilka vi jobbar med', 'sec.setup': 'Från köp till start',
      'sec.faq': 'Vanliga frågor', 'sec.account': 'Logga in', 'sec.support': 'Behöver du hjälp?'
    },
    tr: {
      'nav.home': 'Ana sayfa', 'nav.products': 'Ürünler', 'nav.partners': 'İş ortakları',
      'nav.faq': 'SSS', 'nav.support': 'Destek', 'nav.cart': 'Sepet', 'nav.signIn': 'Giriş yap',
      'hero.kicker': 'Birçok kişinin tercihi',
      'hero.title': 'En iyi ürünler<br /><span class="hl">parmaklarınızın ucunda.</span>',
      'hero.trust1': 'Anında teslimat', 'hero.trust2': 'Güvenli ödeme', 'hero.trust3': 'Gerçek destek 7/24',
      'hero.ctaShop': 'Ürünlere göz at', 'hero.ctaAccount': 'Hesap oluştur',
      'cart.title': 'Sepetiniz', 'cart.emptyTitle': 'Burada henüz bir şey yok',
      'cart.emptyCta': 'Hesap oluştur', 'cart.subtotal': 'Ara toplam', 'cart.checkout': 'Ödemeye geç',
      'sec.products': 'Ne satıyoruz', 'sec.partners': 'Kimlerle çalışıyoruz', 'sec.setup': 'Satın almadan başlatmaya',
      'sec.faq': 'Sık sorulan sorular', 'sec.account': 'Giriş yap', 'sec.support': 'Yardım ister misiniz?'
    },
    ru: {
      'nav.home': 'Главная', 'nav.products': 'Товары', 'nav.partners': 'Партнёры',
      'nav.faq': 'Вопросы', 'nav.support': 'Поддержка', 'nav.cart': 'Корзина', 'nav.signIn': 'Войти',
      'hero.kicker': 'Нам доверяют многие',
      'hero.title': 'Лучшие товары<br />под <span class="hl">рукой.</span>',
      'hero.trust1': 'Мгновенная доставка', 'hero.trust2': 'Безопасная оплата', 'hero.trust3': 'Живая поддержка 24/7',
      'hero.ctaShop': 'Смотреть товары', 'hero.ctaAccount': 'Создать аккаунт',
      'cart.title': 'Ваша корзина', 'cart.emptyTitle': 'Здесь пока пусто',
      'cart.emptyCta': 'Создать аккаунт', 'cart.subtotal': 'Промежуточный итог', 'cart.checkout': 'Оформить',
      'sec.products': 'Что мы продаём', 'sec.partners': 'С кем мы работаем', 'sec.setup': 'От покупки до запуска',
      'sec.faq': 'Частые вопросы', 'sec.account': 'Войти', 'sec.support': 'Нужна помощь?'
    },
    ar: {
      'nav.home': 'الرئيسية', 'nav.products': 'المنتجات', 'nav.partners': 'الشركاء',
      'nav.faq': 'الأسئلة', 'nav.support': 'الدعم', 'nav.cart': 'السلة', 'nav.signIn': 'تسجيل الدخول',
      'hero.kicker': 'موثوق من الكثيرين',
      'hero.title': 'أفضل المنتجات<br />في <span class="hl">متناول يدك.</span>',
      'hero.trust1': 'تسليم فوري', 'hero.trust2': 'دفع آمن', 'hero.trust3': 'دعم حقيقي على مدار الساعة',
      'hero.ctaShop': 'تصفح المنتجات', 'hero.ctaAccount': 'إنشاء حساب',
      'cart.title': 'سلتك', 'cart.emptyTitle': 'لا شيء هنا بعد',
      'cart.emptyCta': 'إنشاء حساب', 'cart.subtotal': 'المجموع الفرعي', 'cart.checkout': 'إتمام الشراء',
      'sec.products': 'ما نبيعه', 'sec.partners': 'من نعمل معهم', 'sec.setup': 'من الشراء إلى التشغيل',
      'sec.faq': 'الأسئلة الشائعة', 'sec.account': 'تسجيل الدخول', 'sec.support': 'تحتاج مساعدة؟'
    },
    hi: {
      'nav.home': 'होम', 'nav.products': 'उत्पाद', 'nav.partners': 'साझेदार',
      'nav.faq': 'सवाल', 'nav.support': 'सहायता', 'nav.cart': 'कार्ट', 'nav.signIn': 'साइन इन',
      'hero.kicker': 'कई लोगों का भरोसा',
      'hero.title': 'बेहतरीन उत्पाद<br />आपकी <span class="hl">पहुँच में।</span>',
      'hero.trust1': 'तुरंत डिलीवरी', 'hero.trust2': 'सुरक्षित भुगतान', 'hero.trust3': 'असली सहायता 24/7',
      'hero.ctaShop': 'उत्पाद देखें', 'hero.ctaAccount': 'खाता बनाएँ',
      'cart.title': 'आपका कार्ट', 'cart.emptyTitle': 'यहाँ अभी कुछ नहीं है',
      'cart.emptyCta': 'खाता बनाएँ', 'cart.subtotal': 'उप-योग', 'cart.checkout': 'चेकआउट',
      'sec.products': 'हम क्या बेचते हैं', 'sec.partners': 'हम किसके साथ काम करते हैं', 'sec.setup': 'खरीद से शुरुआत तक',
      'sec.faq': 'अक्सर पूछे जाने वाले सवाल', 'sec.account': 'साइन इन', 'sec.support': 'मदद चाहिए?'
    },
    id: {
      'nav.home': 'Beranda', 'nav.products': 'Produk', 'nav.partners': 'Mitra',
      'nav.faq': 'FAQ', 'nav.support': 'Dukungan', 'nav.cart': 'Keranjang', 'nav.signIn': 'Masuk',
      'hero.kicker': 'Dipercaya banyak orang',
      'hero.title': 'Produk terbaik<br />dalam <span class="hl">genggaman.</span>',
      'hero.trust1': 'Pengiriman instan', 'hero.trust2': 'Pembayaran aman', 'hero.trust3': 'Dukungan nyata 24/7',
      'hero.ctaShop': 'Lihat produk', 'hero.ctaAccount': 'Buat akun',
      'cart.title': 'Keranjang Anda', 'cart.emptyTitle': 'Belum ada apa-apa di sini',
      'cart.emptyCta': 'Buat akun', 'cart.subtotal': 'Subtotal', 'cart.checkout': 'Bayar',
      'sec.products': 'Yang kami jual', 'sec.partners': 'Mitra kami', 'sec.setup': 'Dari beli sampai main',
      'sec.faq': 'Pertanyaan umum', 'sec.account': 'Masuk', 'sec.support': 'Butuh bantuan?'
    },
    vi: {
      'nav.home': 'Trang chủ', 'nav.products': 'Sản phẩm', 'nav.partners': 'Đối tác',
      'nav.faq': 'Hỏi đáp', 'nav.support': 'Hỗ trợ', 'nav.cart': 'Giỏ hàng', 'nav.signIn': 'Đăng nhập',
      'hero.kicker': 'Được nhiều người tin dùng',
      'hero.title': 'Sản phẩm tốt nhất<br />trong <span class="hl">tầm tay.</span>',
      'hero.trust1': 'Giao ngay lập tức', 'hero.trust2': 'Thanh toán an toàn', 'hero.trust3': 'Hỗ trợ thật 24/7',
      'hero.ctaShop': 'Xem sản phẩm', 'hero.ctaAccount': 'Tạo tài khoản',
      'cart.title': 'Giỏ hàng của bạn', 'cart.emptyTitle': 'Chưa có gì ở đây',
      'cart.emptyCta': 'Tạo tài khoản', 'cart.subtotal': 'Tạm tính', 'cart.checkout': 'Thanh toán',
      'sec.products': 'Chúng tôi bán gì', 'sec.partners': 'Chúng tôi hợp tác với ai', 'sec.setup': 'Từ mua đến chơi',
      'sec.faq': 'Câu hỏi thường gặp', 'sec.account': 'Đăng nhập', 'sec.support': 'Cần trợ giúp?'
    },
    th: {
      'nav.home': 'หน้าแรก', 'nav.products': 'สินค้า', 'nav.partners': 'พาร์ทเนอร์',
      'nav.faq': 'คำถาม', 'nav.support': 'ช่วยเหลือ', 'nav.cart': 'ตะกร้า', 'nav.signIn': 'เข้าสู่ระบบ',
      'hero.kicker': 'ได้รับความไว้วางใจจากหลายคน',
      'hero.title': 'สินค้าที่ดีที่สุด<br />อยู่<span class="hl">แค่ปลายนิ้ว</span>',
      'hero.trust1': 'ส่งทันที', 'hero.trust2': 'ชำระเงินปลอดภัย', 'hero.trust3': 'ซัพพอร์ตจริง 24/7',
      'hero.ctaShop': 'ดูสินค้า', 'hero.ctaAccount': 'สร้างบัญชี',
      'cart.title': 'ตะกร้าของคุณ', 'cart.emptyTitle': 'ยังไม่มีอะไรที่นี่',
      'cart.emptyCta': 'สร้างบัญชี', 'cart.subtotal': 'ยอดรวมย่อย', 'cart.checkout': 'ชำระเงิน',
      'sec.products': 'สิ่งที่เราขาย', 'sec.partners': 'เราทำงานกับใคร', 'sec.setup': 'จากซื้อจนเริ่มเล่น',
      'sec.faq': 'คำถามที่พบบ่อย', 'sec.account': 'เข้าสู่ระบบ', 'sec.support': 'ต้องการความช่วยเหลือ?'
    },
    zh: {
      'nav.home': '首页', 'nav.products': '产品', 'nav.partners': '合作伙伴',
      'nav.faq': '常见问题', 'nav.support': '支持', 'nav.cart': '购物车', 'nav.signIn': '登录',
      'hero.kicker': '众多用户的信赖之选',
      'hero.title': '最好的产品<br /><span class="hl">触手可及。</span>',
      'hero.trust1': '即时发货', 'hero.trust2': '安全结账', 'hero.trust3': '真人客服 24/7',
      'hero.ctaShop': '浏览产品', 'hero.ctaAccount': '创建账户',
      'cart.title': '您的购物车', 'cart.emptyTitle': '这里还什么都没有',
      'cart.emptyCta': '创建账户', 'cart.subtotal': '小计', 'cart.checkout': '结账',
      'sec.products': '我们出售什么', 'sec.partners': '我们的合作方', 'sec.setup': '从下单到启动',
      'sec.faq': '常见问题', 'sec.account': '登录', 'sec.support': '需要帮助吗？'
    },
    ja: {
      'nav.home': 'ホーム', 'nav.products': '製品', 'nav.partners': 'パートナー',
      'nav.faq': 'よくある質問', 'nav.support': 'サポート', 'nav.cart': 'カート', 'nav.signIn': 'ログイン',
      'hero.kicker': '多くの方に選ばれています',
      'hero.title': '最高の製品を<br /><span class="hl">手のひらに。</span>',
      'hero.trust1': '即時配送', 'hero.trust2': '安全な決済', 'hero.trust3': '24時間365日の有人サポート',
      'hero.ctaShop': '製品を見る', 'hero.ctaAccount': 'アカウントを作成',
      'cart.title': 'カート', 'cart.emptyTitle': 'まだ何もありません',
      'cart.emptyCta': 'アカウントを作成', 'cart.subtotal': '小計', 'cart.checkout': 'レジへ進む',
      'sec.products': '取り扱い商品', 'sec.partners': '提携先', 'sec.setup': '購入から起動まで',
      'sec.faq': 'よくある質問', 'sec.account': 'ログイン', 'sec.support': 'お困りですか？'
    },
    ko: {
      'nav.home': '홈', 'nav.products': '제품', 'nav.partners': '파트너',
      'nav.faq': '자주 묻는 질문', 'nav.support': '지원', 'nav.cart': '장바구니', 'nav.signIn': '로그인',
      'hero.kicker': '많은 분들이 신뢰합니다',
      'hero.title': '최고의 제품을<br /><span class="hl">손끝에서.</span>',
      'hero.trust1': '즉시 전달', 'hero.trust2': '안전한 결제', 'hero.trust3': '실제 상담원 24/7',
      'hero.ctaShop': '제품 보기', 'hero.ctaAccount': '계정 만들기',
      'cart.title': '장바구니', 'cart.emptyTitle': '아직 아무것도 없습니다',
      'cart.emptyCta': '계정 만들기', 'cart.subtotal': '소계', 'cart.checkout': '결제하기',
      'sec.products': '판매 상품', 'sec.partners': '함께하는 곳', 'sec.setup': '구매부터 실행까지',
      'sec.faq': '자주 묻는 질문', 'sec.account': '로그인', 'sec.support': '도움이 필요하신가요?'
    }
  };

  var els = {
    btn: document.getElementById('langBtn'),
    menu: document.getElementById('langMenu'),
    current: document.getElementById('langCurrent')
  };
  if (!els.btn || !els.menu) return;

  var active = 'en';

  function read() {
    try { return localStorage.getItem(STORE_KEY); } catch (err) { return null; }
  }
  function write(code) {
    try { localStorage.setItem(STORE_KEY, code); } catch (err) {}
  }

  function meta(code) {
    for (var i = 0; i < LANGS.length; i++) if (LANGS[i].code === code) return LANGS[i];
    return LANGS[0];
  }

  function apply(code) {
    var dict = T[code] || T.en;
    var fallback = T.en;

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.dataset.i18n;
      var value = dict[key] || fallback[key];
      if (value) el.textContent = value;
    });

    // Only strings defined in this file go through innerHTML — never user input.
    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      var key = el.dataset.i18nHtml;
      var value = dict[key] || fallback[key];
      if (value) el.innerHTML = value;
    });

    var info = meta(code);
    document.documentElement.lang = code;
    document.documentElement.dir = info.rtl ? 'rtl' : 'ltr';

    els.current.textContent = info.label;
    els.btn.setAttribute('aria-label', 'Language: ' + info.name);

    Array.prototype.forEach.call(els.menu.children, function (li) {
      var on = li.dataset.code === code;
      li.setAttribute('aria-selected', String(on));
      li.classList.toggle('is-active', on);
    });

    active = code;
    write(code);

    // Cart re-renders prices in the new locale.
    window.dispatchEvent(new CustomEvent('ts:languagechange', { detail: { lang: code } }));
  }

  /* ---- menu ---- */
  LANGS.forEach(function (l) {
    var li = document.createElement('li');
    li.className = 'langpick__opt';
    li.setAttribute('role', 'option');
    li.dataset.code = l.code;
    li.tabIndex = -1;

    var name = document.createElement('span');
    name.textContent = l.name;

    var code = document.createElement('span');
    code.className = 'langpick__code';
    code.textContent = l.label;

    li.appendChild(name);
    li.appendChild(code);
    li.addEventListener('click', function () { apply(l.code); closeMenu(true); });
    els.menu.appendChild(li);
  });

  function openMenu() {
    els.menu.hidden = false;
    els.btn.setAttribute('aria-expanded', 'true');
    var sel = els.menu.querySelector('.is-active') || els.menu.firstElementChild;
    if (sel) sel.focus();
  }
  function closeMenu(refocus) {
    els.menu.hidden = true;
    els.btn.setAttribute('aria-expanded', 'false');
    if (refocus) els.btn.focus();
  }

  els.btn.addEventListener('click', function () {
    if (els.menu.hidden) openMenu(); else closeMenu(false);
  });

  els.menu.addEventListener('keydown', function (e) {
    var opts = Array.prototype.slice.call(els.menu.children);
    var i = opts.indexOf(document.activeElement);

    if (e.key === 'Escape') { e.preventDefault(); closeMenu(true); }
    else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (i > -1) { apply(opts[i].dataset.code); closeMenu(true); }
    }
    else if (e.key === 'ArrowDown') { e.preventDefault(); opts[(i + 1) % opts.length].focus(); }
    else if (e.key === 'ArrowUp')   { e.preventDefault(); opts[(i - 1 + opts.length) % opts.length].focus(); }
    else if (e.key === 'Home')      { e.preventDefault(); opts[0].focus(); }
    else if (e.key === 'End')       { e.preventDefault(); opts[opts.length - 1].focus(); }
  });

  document.addEventListener('click', function (e) {
    if (els.menu.hidden) return;
    if (!e.target.closest('.langpick')) closeMenu(false);
  });

  /* ---- boot: saved choice, else the browser's preference, else English ---- */
  var saved = read();
  if (saved && T[saved]) {
    apply(saved);
  } else {
    var guess = (navigator.language || 'en').slice(0, 2).toLowerCase();
    apply(T[guess] ? guess : 'en');
  }
})();
