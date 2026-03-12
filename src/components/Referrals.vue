
<template>
  <div class="p-4 pb-20">
    <!-- الإحصائيات -->
    <div class="grid grid-cols-2 gap-3 mb-4">
      <div class="bg-gray-900 rounded-xl p-4 text-center">
        <UsersIcon size="24" class="mx-auto mb-2 text-blue-400" />
        <p class="text-2xl font-bold text-white">{{ stats.referralCount }}</p>
        <p class="text-xs text-gray-400">عدد الإحالات</p>
      </div>
      <div class="bg-gray-900 rounded-xl p-4 text-center">
        <GiftIcon size="24" class="mx-auto mb-2 text-green-400" />
        <p class="text-2xl font-bold text-white">{{ formatBalance(stats.referralEarnings) }}</p>
        <p class="text-xs text-gray-400">أرباح الإحالات</p>
      </div>
    </div>

    <!-- كود الإحالة -->
    <div class="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-4 mb-4">
      <p class="text-blue-200 text-sm mb-3">كود الإحالة الخاص بك</p>
      
      <div class="bg-black/30 rounded-lg p-3 mb-3">
        <code class="text-xl font-bold text-white tracking-wider">{{ stats.referralCode }}</code>
      </div>

      <div class="flex gap-2">
        <button
          @click="copyReferral"
          class="flex-1 bg-white/20 text-white py-2 rounded-lg text-sm flex items-center justify-center gap-2"
        >
          <CopyIcon size="16" /> نسخ الرابط
        </button>
        <button
          @click="shareReferral"
          class="flex-1 bg-white text-blue-600 py-2 rounded-lg text-sm flex items-center justify-center gap-2"
        >
          <ShareIcon size="16" /> مشاركة
        </button>
      </div>
    </div>

    <!-- شرح نظام الإحالة -->
    <div class="bg-gray-900 rounded-xl p-4 mb-4">
      <h3 class="font-semibold mb-3 flex items-center gap-2">
        <GiftIcon size="18" class="text-yellow-400" />
        كيف تعمل الإحالات؟
      </h3>
      <ul class="space-y-2 text-sm text-gray-400">
        <li class="flex items-start gap-2">
          <span class="text-blue-400">1.</span>
          شارك كودك مع أصدقائك
        </li>
        <li class="flex items-start gap-2">
          <span class="text-blue-400">2.</span>
          عند تسجيلهم يحصلون على 100 SYT مكافأة
        </li>
        <li class="flex items-start gap-2">
          <span class="text-blue-400">3.</span>
          تحصل أنت على 10% من أرباحهم
        </li>
      </ul>
    </div>

    <!-- قائمة الإحالات -->
    <div class="bg-gray-900 rounded-xl p-4">
      <h3 class="font-semibold mb-4">الإحالات الأخيرة</h3>
      
      <div v-if="referrals.length === 0" class="text-center py-8 text-gray-500">
        <UsersIcon size="48" class="mx-auto mb-3 opacity-30" />
        <p>لم تقم بأي إحالات بعد</p>
        <p class="text-sm mt-1">ابدأ بدعوة أصدقائك!</p>
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
    const stats = ref({
      referralCount: 0,
      referralEarnings: 0,
      referralCode: ''
    })

    onMounted(() => {
      fetchReferralData()
    })

    const fetchReferralData = async () => {
      const { data: userData } = await supabase
        .from('users')
        .select('referral_code, referral_count, referral_earnings')
        .eq('id', props.user.id)
        .single()

      if (userData) {
        stats.value = {
          referralCount: userData.referral_count || 0,
          referralEarnings: userData.referral_earnings || 0,
          referralCode: userData.referral_code || ''
        }
      }

      const { data: refs } = await supabase
        .from('referrals')
        .select('*, referred:referred_id (first_name, username, created_at)')
        .eq('referrer_id', props.user.id)
        .order('created_at', { ascending: false })

      referrals.value = refs || []
    }

    const formatBalance = (val) => parseFloat(val || 0).toFixed(4)
    const formatDate = (date) => new Date(date).toLocaleDateString('ar-SA')

    const copyReferral = () => {
      const link = `https://t.me/SYT_Wallet_Test_bot?start=${stats.value.referralCode}`
      navigator.clipboard.writeText(link)
    }

    const shareReferral = () => {
      const link = `https://t.me/syt_wallet_bot?start=${stats.value.referralCode}`
      const text = `انضم لمحفظة SYT واحصل على مكافآت! 🚀\n\n${link}`
      
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.openTelegramLink(
          `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`
        )
      } else {
        navigator.clipboard.writeText(text)
      }
    }

    return {
      referrals,
      stats,
      formatBalance,
      formatDate,
      copyReferral,
      shareReferral
    }
  }
}
</script>
