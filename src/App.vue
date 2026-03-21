<template>
  <div class="min-h-screen bg-black text-white">
    <SpeedInsights />
    <div class="pb-16">
      <Auth v-if="!isAuthenticated" />
      <Home v-else-if="activeTab === 'home'" :user="user" @change-tab="activeTab = $event" />
      <Tasks v-else-if="activeTab === 'tasks'" :user="user" />
      <Wallet v-else-if="activeTab === 'wallet'" :user="user" />
      <Referrals v-else-if="activeTab === 'referrals'" :user="user" />
    </div>
    
    <Navigation v-if="isAuthenticated" :active-tab="activeTab" @change-tab="activeTab = $event" />
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useStore } from './stores/useStore'
import { SpeedInsights } from '@vercel/speed-insights/vue'
import { createClient } from '@supabase/supabase-js'
import Auth from './components/Auth.vue'
import Navigation from './components/Navigation.vue'
import Home from './components/Home.vue'
import Tasks from './components/Tasks.vue'
import Wallet from './components/Wallet.vue'
import Referrals from './components/Referrals.vue'

// استخدام متغيرات البيئة من Vercel
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

export default {
  name: 'App',
  components: {
    SpeedInsights,
    Auth,
    Navigation,
    Home,
    Tasks,
    Wallet,
    Referrals
  },
  setup() {
    const store = useStore()
    const activeTab = ref('home')
    
    // دالة تحديث حالة الإحالة
const updateReferralStatus = async () => {
  let refCode = null
  
  // مصدر ١: URL العادي (للاختبار)
  const urlParams = new URLSearchParams(window.location.search)
  refCode = urlParams.get('ref') || urlParams.get('start')
  
  // مصدر ٢: Telegram WebApp initData
  if (!refCode && window.Telegram?.WebApp) {
    const tg = window.Telegram.WebApp
    
    // الطريقة ١: من start_param
    refCode = tg.initDataUnsafe?.start_param
    
    // الطريقة ٢: من initData كـ string
    if (!refCode && tg.initData) {
      const initDataParams = new URLSearchParams(tg.initData)
      refCode = initDataParams.get('start_param')
    }
    
    // طباعة للتصحيح
    console.log('Telegram initDataUnsafe:', tg.initDataUnsafe)
    console.log('Telegram initData:', tg.initData)
  }
  
  console.log('🎯 الكود النهائي:', refCode)
  
  if (!refCode || !refCode.startsWith('SYT')) {
    console.log('❌ ما في كود صالح')
    return
  }
  
  // ... باقي الكود نفسه (التحديث بـ Supabase)
  try {
    const { data, error } = await supabase
      .from('referrals')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('referrer_code', refCode)
      .eq('status', 'pending')
      .select()
    
    if (error) {
      console.error('❌ خطأ:', error.message)
    } else if (data && data.length > 0) {
      console.log('✅ تم التحديث:', data[0].id)
    } else {
      console.log('⚠️ ما لقينا إحالة pending')
    }
  } catch (err) {
    console.error('❌ خطأ عام:', err)
  }
}
    
    onMounted(() => {
      store.checkAuth()
      updateReferralStatus() // تحديث الإحالة عند فتح التطبيق
    })
    
    return {
      activeTab,
      isAuthenticated: computed(() => store.isAuthenticated),
      user: computed(() => store.user)
    }
  }
}
</script>
