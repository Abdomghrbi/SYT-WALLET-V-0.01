
<template>
  <div class="min-h-screen bg-black text-white">
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
import Auth from './components/Auth.vue'
import Navigation from './components/Navigation.vue'
import Home from './components/Home.vue'
import Tasks from './components/Tasks.vue'
import Wallet from './components/Wallet.vue'
import Referrals from './components/Referrals.vue'

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
    
    onMounted(() => {
      store.checkAuth()
    })
    
    return {
      activeTab,
      isAuthenticated: computed(() => store.isAuthenticated),
      user: computed(() => store.user)
    }
  }
}
</script>
