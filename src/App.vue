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

    const updateReferralStatus = async () => {
  
      // ═══════════════════════════════════════
      let telegramId = null
      
      if (window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
        telegramId = window.Telegram.WebApp.initDataUnsafe.user.id
      } else {

        console.log('⚠️ Telegram ID غير متوفر')
        return
      }
      
      console.log('🆔 Telegram ID:', telegramId)
    
      // ═══════════════════════════════════════
      try {
        const { data, error } = await supabase
          .from('referrals')
          .update({ 
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('referred_telegram_id', telegramId) 
          .eq('status', 'pending')                   
          .select()
        
        if (error) {
          console.error('❌ خطأ:', error.message)
        } else if (data && data.length > 0) {
          console.log('✅ تم تحديث الإحالة:', data[0].referrer_code)
        } else {
          console.log('ℹ️ لا يوجد إحالة pending لهذا المستخدم')
        }
      } catch (err) {
        console.error('❌ خطأ عام:', err)
      }
    }

    onMounted(() => {
      store.checkAuth()
      setTimeout(updateReferralStatus, 1000)
    })

    return {
      activeTab,
      isAuthenticated: computed(() => store.isAuthenticated),
      user: computed(() => store.user)
    }
  }
}
</script>
