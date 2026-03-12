
<template>
  <div class="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
    <!-- حالة التحميل -->
    <div v-if="loading" class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
      <p class="text-gray-400">جاري تسجيل الدخول...</p>
    </div>

    <!-- حالة الخطأ -->
    <div v-else-if="error" class="text-center w-full max-w-sm">
      <div class="text-red-500 text-4xl mb-4">⚠️</div>
      <p class="text-red-400 mb-6">{{ error }}</p>
      
      <!-- وضع المطور -->
      <div class="bg-gray-900 rounded-xl p-4 mb-4">
        <p class="text-gray-400 text-sm mb-2">وضع المطور:</p>
        <button 
          @click="devLogin"
          class="bg-blue-500 text-white px-6 py-2 rounded-lg w-full active:scale-95 transition-transform"
        >
          تسجيل دخول وهمي
        </button>
      </div>
      
      <button 
        @click="retry"
        class="bg-gray-800 text-white px-6 py-2 rounded-lg active:scale-95 transition-transform"
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

    onMounted(() => {
      authenticate()
    })

    const authenticate = async () => {
      try {
        const tg = window.Telegram?.WebApp
        
        // ✅ التحقق من وجود Telegram
        if (!tg?.initDataUnsafe?.user) {
          loading.value = false
          return
        }

        // ✅ توسيع الشاشة
        tg.expand()
        tg.ready()

        // ✅ تسجيل الدخول (login تستخدم Telegram مباشرة من window)
        const result = await store.login()
        
        if (!result.success) {
          throw new Error(result.error)
        }

        // ✅ إخفاء التحميل عند النجاح (App.vue يتولى الباقي)
        loading.value = false

      } catch (err) {
        console.error('خطأ في Auth:', err)
        error.value = err.message
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
        total_earned: 500,
        wallet_address: '0x1234567890abcdef1234567890abcdef12345678'
      }
      store.isAuthenticated = true
      loading.value = false
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
