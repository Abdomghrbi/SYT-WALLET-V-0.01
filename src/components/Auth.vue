
<template>
  <div class="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
    <!-- حالة التحميل -->
    <div v-if="loading" class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
      <p class="text-gray-400">جاري تسجيل الدخول...</p>
    </div>

    <!-- حالة الخطأ -->
    <div v-else-if="error" class="text-center">
      <div class="text-red-500 text-4xl mb-4">⚠️</div>
      <p class="text-red-400 mb-6">{{ error }}</p>
      
      <!-- وضع المطور -->
      <div class="bg-gray-900 rounded-xl p-4 mb-4 max-w-sm w-full">
        <p class="text-gray-400 text-sm mb-2">وضع المطور:</p>
        <button 
          @click="devLogin"
          class="bg-blue-500 text-white px-6 py-2 rounded-lg w-full"
        >
          تسجيل دخول وهمي
        </button>
      </div>
      
      <button 
        @click="retry"
        class="bg-gray-800 text-white px-6 py-2 rounded-lg"
      >
        إعادة المحاولة
      </button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useStore } from '../stores/useStore'

export default {
  name: 'Auth',
  setup() {
    const store = useStore()
    const loading = ref(true)
    const error = ref(null)

    onMounted(async () => {
      await authenticate()
    })

    const authenticate = async () => {
      try {
        // التحقق من Telegram
        const tg = window.Telegram?.WebApp
        
        if (!tg?.initData) {
          // وضع التطوير
          if (import.meta.env.DEV) {
            loading.value = false
            return
          }
          throw new Error('يرجى فتح التطبيق من Telegram')
        }

        // توسيع الشاشة
        tg.expand()
        tg.ready()

        // تسجيل الدخول
        const result = await store.login(tg.initData)
        
        if (!result.success) {
          throw new Error(result.error)
        }

      } catch (err) {
        error.value = err.message
      } finally {
        loading.value = false
      }
    }

    const devLogin = () => {
      store.user = {
        id: 'dev-user-123',
        telegram_id: 123456789,
        first_name: 'مطور',
        username: 'developer',
        balance: 1000,
        referral_code: 'SYT123',
        referral_count: 5,
        total_earned: 500
      }
      store.isAuthenticated = true
      localStorage.setItem('syt-wallet-user', JSON.stringify(store.user))
    }

    const retry = () => {
      error.value = null
      loading.value = true
      window.location.reload()
    }

    return {
      loading,
      error,
      devLogin,
      retry
    }
  }
}
</script>
