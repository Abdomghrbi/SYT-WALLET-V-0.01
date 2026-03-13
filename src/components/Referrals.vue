<template>
  <div class="p-4 pb-20">
    <!-- الإحصائيات -->
    <div class="grid grid-cols-2 gap-3 mb-4">
      <div class="bg-gray-900 rounded-xl p-4 text-center">
        <UsersIcon size="24" class="mx-auto mb-2 text-blue-400" />
        <p class="text-2xl font-bold text-white">{{ user?.referral_count || 0 }}</p>
        <p class="text-xs text-gray-400">عدد الإحالات</p>
      </div>
      <div class="bg-gray-900 rounded-xl p-4 text-center">
        <GiftIcon size="24" class="mx-auto mb-2 text-green-400" />
        <p class="text-2xl font-bold text-white">{{ formatBalance(user?.referral_earnings) }}</p>
        <p class="text-xs text-gray-400">أرباح الإحالات</p>
      </div>
    </div>

    <!-- كود الإحالة -->
    <div class="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-4 mb-4">
      <p class="text-blue-200 text-sm mb-3">كود الإحالة الخاص بك</p>
      
      <div v-if="user?.referral_code" class="bg-black/30 rounded-lg p-3 mb-3">
        <code class="text-xl font-bold text-white tracking-wider">{{ user.referral_code }}</code>
      </div>
      
      <div v-else class="bg-black/30 rounded-lg p-3 mb-3">
        <p class="text-gray-400 text-sm">لا يوجد كود إحالة</p>
      </div>

      <div class="flex gap-2">
        <button
          @click="copyReferral"
          :disabled="!user?.referral_code"
          class="flex-1 bg-white/20 text-white py-2 rounded-lg text-sm flex items-center justify-center gap-2 active:scale-95 active:bg-white/30 transition-all duration-150 disabled:opacity-50"
        >
          <CopyIcon size="16" /> نسخ الرابط
        </button>
        <button
          @click="shareReferral"
          :disabled="!user?.referral_code"
          class="flex-1 bg-white text-blue-600 py-2 rounded-lg text-sm flex items-center justify-center gap-2 active:scale-95 transition-all duration-150 disabled:opacity-50"
        >
          <ShareIcon size="16" /> مشاركة
        </button>
      </div>
    </div>
    
    <!-- قائمة الإحالات -->
    <div class="bg-gray-900 rounded-xl p-4">
      <h3 class="font-semibold mb-4">الإحالات الأخيرة</h3>
      
      <div v-if="referrals.length === 0" class="text-center py-8 text-gray-500">
        <UsersIcon size="48" class="mx-auto mb-3 opacity-30" />
        <p>لا يوجد</p>
        <p class="text-sm mt-1">ابدأ بدعوة أصدقائك</p>
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="ref in referrals"
          :key="ref.id"
          class="flex items-center justify-between py-2 border-b border-gray-800 last:border-0"
        >
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
              <span class="text-blue-400 font-bold">{{ ref.referred?.first_name?.[0] || '?' }}</span>
            </div>
            <div>
              <p class="font-medium text-sm">{{ ref.referred?.first_name || 'مستخدم' }}</p>
              <p class="text-xs text-gray-500">@{{ ref.referred?.username || 'unknown' }}</p>
            </div>
          </div>
          
          <div class="text-right">
            <p class="text-green-400 font-bold text-sm">+{{ ref.referrer_bonus }} SYT</p>
            <p class="text-xs text-gray-500">{{ formatDate(ref.created_at) }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { supabase } from '../config/supabase'
import { Users as UsersIcon, Gift as GiftIcon, Copy as CopyIcon, Share2 as ShareIcon } from 'lucide-vue-next'

export default {
  name: 'Referrals',
  components: {
    UsersIcon,
    GiftIcon,
    CopyIcon,
    ShareIcon
  },
  props: {
    user: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const referrals = ref([])

    onMounted(() => {
      if (props.user?.id) {
        fetchReferrals()
      }
    })

    const fetchReferrals = async () => {
      const { data } = await supabase
        .from('referrals')
        .select(`
          *,
          referred:referred_id (
            first_name,
            username,
            created_at
          )
        `)
        .eq('referrer_id', props.user.id)
        .order('created_at', { ascending: false })

      referrals.value = data || []
    }

    const formatBalance = (val) => {
      return val ? parseFloat(val).toFixed(4) : '0.0000'
    }

    const formatDate = (date) => {
      return date ? new Date(date).toLocaleDateString('ar-SA') : ''
    }

    const copyReferral = () => {
      const code = props.user?.referral_code
      if (!code) return
      
      const link = `https://t.me/SYT_Wallet_Test_bot?start=${code}`
    
      navigator.clipboard.writeText(link)
    showToast.value = true

    // إخفاء الرسالة بعد ثانيتين
    setTimeout(() => {
      showToast.value = false
    }, 2000)

  } catch (err) {
    console.error('Copy failed')
      }
      
    }

    const shareReferral = () => {
  const code = props.user?.referral_code
  if (!code) return
  
  const link = `https://t.me/SYT_Wallet_Test_bot?start=${code}`
  
  if (window.Telegram?.WebApp) {
  
    window.Telegram.WebApp.openTelegramLink(
      `https://t.me/share/url?url=${encodeURIComponent(link)}`
    )
  } else {
    navigator.clipboard.writeText(text)
  }
    }

    return {
      referrals,
      formatBalance,
      formatDate,
      copyReferral,
      shareReferral
    }
  }
}
</script>
