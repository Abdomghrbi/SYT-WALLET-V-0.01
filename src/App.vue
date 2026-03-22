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
    const showConsole = ref(false)
    const consoleLogs = ref([])

    const addLog = (msg, type = 'info') => {
      const time = new Date().toLocaleTimeString()
      consoleLogs.value.push({ time, message: msg, type })
      if (type === 'error') console.error(msg)
      else if (type === 'warn') console.warn(msg)
      else console.log(msg)
    }

    
      const updateReferralStatus = async () => {
  let refCode = null
  
  // مصدر ١: URL
  const urlParams = new URLSearchParams(window.location.search)
  refCode = urlParams.get('ref') || urlParams.get('start')
  
  // مصدر ٢: Telegram (احتياطي)
  if (!refCode && window.Telegram?.WebApp) {
    const tg = window.Telegram.WebApp
    refCode = tg.initDataUnsafe?.start_param
    
    if (!refCode && tg.initData) {
      try {
        const params = new URLSearchParams(tg.initData)
        refCode = params.get('start_param')
      } catch (e) {
        console.error('خطأ parsing:', e)
      }
    }
  }
  
  if (!refCode || !refCode.startsWith('SYT')) return
  
  // تحديث Supabase
  try {
    await supabase
      .from('referrals')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('referrer_code', refCode)
      .eq('status', 'completed')
  } catch (err) {
    console.error('خطأ:', err)
  }
      }

    onMounted(() => {
      store.checkAuth()
      setTimeout(updateReferralStatus, 500)
    })

    return {
      activeTab,
      isAuthenticated: computed(() => store.isAuthenticated),
      user: computed(() => store.user),
      showConsole,
      consoleLogs
    }
  }
}
</script>
