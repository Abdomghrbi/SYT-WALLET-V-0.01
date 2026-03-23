<template>
  <div class="min-h-screen bg-black text-white">
    <Auth v-if="!isAuthenticated" />
    <Home v-else-if="activeTab === 'home'" :user="user" @change-tab="activeTab = $event" />
    <Tasks v-else-if="activeTab === 'tasks'" :user="user" />
    <Wallet v-else-if="activeTab === 'wallet'" :user="user" />
    <Referrals v-else-if="activeTab === 'referrals'" :user="user" />
    <Navigation v-if="isAuthenticated" :active-tab="activeTab" @change-tab="activeTab = $event" />
  </div>
</template>

<script lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useStore } from './stores/useStore'
import { createClient } from '@supabase/supabase-js'
import Auth from './components/Auth.vue'
import Navigation from './components/Navigation.vue'
import Home from './components/Home.vue'
import Tasks from './components/Tasks.vue'
import Wallet from './components/Wallet.vue'
import Referrals from './components/Referrals.vue'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

export default {
  name: 'App',
  components: {
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
      let telegramId = null
      
      if (window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
        telegramId = window.Telegram.WebApp.initDataUnsafe.user.id
      } else {
        return
      }
      
      try {
        await supabase
          .from('referrals')
          .update({ 
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('referred_telegram_id', telegramId) 
          .eq('status', 'pending')
      } catch (err) {
        console.error(err)
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
