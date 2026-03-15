
 "مشروع SYT-WALLET-V1
  Telegram Mini App
  
 التقنيات:
 Frontend: Vue 3 + Options API
 + Vite + Tailwind CSS
 
  Database: Supabase (PostgreSQL) State: Pinia (useStore)
  
 Backend: supabaseAdmin (Service Role) للكتابة
 supabase (Anon) للقراءة
 المميزات: 
 
 المنفذ: تسجيل دخول عبر Telegram WebApp
 (initData). إنشاء مستخدم تلقائي مع wallet_address و referral_code
 
 مهمة مكافأة يومية (25+ SYT) كل 24 ساعة.
 نظام إرسال واستلام SYT بين المستخدمين.
 سجل معاملات كامل (transactions).
 نظام إحالات (referral_code) قريباً"تحتاج API"
 
 واجهة متكاملة (Home, Tasks, Wallet, Referrals, Navigation)

متغيرات البيئة: 
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_SUPABASE_SERVICE_KEY

ملاحظات:  RLS مفعل على Supabase
يستخدم supabaseAdmin للعمليات التي تتطلب كتابة 
لا يستخدم localStorage لتخزين الجلسة.
