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
    
    <!-- Debug Console -->
    <div v-if="showConsole" class="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 p-4 max-h-48 overflow-auto z-50 font-mono text-xs">
      <div class="flex justify-between items-center mb-2">
        <span class="text-green-400 font-bold">🔧 Debug</span>
        <button @click="showConsole = false" class="text-red-400">✕</button>
      </div>
      <div v-for="(log, i) in consoleLogs" :key="i" :class="log.type === 'error' ? 'text-red-400' : log.type === 'warn' ? 'text-yellow-400' : 'text-green-300'" class="mb-1">
        {{ log.time }} | {{ log.message }}
      </div>
    </div>
    
    <button v-if="!showConsole" @click="showConsole = true" class="fixed bottom-20 right-4 bg-gray-800 text-white px-3 py-2 rounded-full text-xs z-50 border border-gray-600">
      🐛
    </button>
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
      addLog('=== بدء التحقق ===')
      
      const url = window.location.href
      const search = window.location.search
      const tg = window.Telegram?.WebApp
      
      addLog(`URL: ${url}`)
      addLog(`Search: ${search}`)
      addLog(`Telegram: ${!!tg}`)
      
      let refCode = null
      
      // محاولة ١: URL
      const urlParams = new URLSearchParams(search)
      refCode = urlParams.get('ref') || urlParams.get('start')
      addLog(`من URL: ${refCode || 'فاضي'}`)
      
      // محاولة ٢: Telegram
      if (!refCode && tg) {
        addLog(`initDataUnsafe: ${JSON.stringify(tg.initDataUnsafe)}`)
        addLog(`initData: ${tg.initData?.substring(0, 50) || 'فاضي'}`)
        
        refCode = tg.initDataUnsafe?.start_param
        
        if (!refCode && tg.initData) {
          try {
            const params = new URLSearchParams(tg.initData)
            refCode = params.get('start_param')
          } catch (e) {
            addLog(`خطأ parsing: ${e.message}`, 'error')
          }
        }
        addLog(`من Telegram: ${refCode || 'فاضي'}`)
      }
      
      addLog(`🎯 النهائي: ${refCode || 'NULL'}`, refCode ? 'info' : 'warn')
      
      if (!refCode || !refCode.startsWith('SYT')) {
        addLog('❌ كود غير صالح', 'error')
        return
      }
      
      addLog('جاري تحديث Supabase...')
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
          addLog(`❌ خطأ: ${error.message}`, 'error')
        } else if (data && data.length > 0) {
          addLog(`✅ تم! ID: ${data[0].id}`)
        } else {
          addLog(`⚠️ ما لقينا إحالة`, 'warn')
        }
      } catch (err) {
        addLog(`❌ خطأ: ${err.message}`, 'error')
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
