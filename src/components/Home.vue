<template>
  <div class="p-4 pb-20">
    <!-- ترحيب -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold mb-1">
        أهلاً {{ user?.first_name || 'بك' }}! 
      </h1>
    
    </div>

    <!-- الرصيد -->
    <div class="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 mb-4">
      <div class="flex items-center justify-between mb-4">
        <div>
          <p class="text-blue-200 text-sm mb-1">الرصيد</p>
          <h2 class="text-2xl font-bold text-white">
            {{ formatBalance(user?.balance) }} <span class="text-lg">SYT</span>  
          </h2>     
        </div>
        <div class="bg-white/20 p-3 rounded-xl">
          <WalletIcon size="32" class="text-white" />
        </div>
      </div>
      
      <div class="flex items-center justify-between">
        <button 
          @click="$emit('change-tab', 'wallet')"
          class="bg-white text-blue-600 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1"
        >
          المحفظة <ArrowRightIcon size="16" />
        </button>
      </div>
    </div>

    <!-- إحصائيات سريعة -->
    <div class="grid grid-cols-2 gap-3 mb-4">
      <div class="bg-gray-900 rounded-xl p-4">
        <div class="flex items-center gap-2 mb-2">
          <AwardIcon size="20" class="text-yellow-400" />
          <span class="text-gray-400 text-sm">المهام</span>
        </div>
        <p class="text-2xl font-bold text-white">{{ user?.tasks_completed || 0 }}</p>
        
      </div>
      
      <div class="bg-gray-900 rounded-xl p-4">
        <div class="flex items-center gap-2 mb-2">
          <TrendingUpIcon size="20" class="text-green-300" />
          <span class="text-gray-400 text-sm">الأصدقاء</span>
        </div>
        <p class="text-2xl font-bold text-white">{{ user?.referral_count || 0 }}</p>
      </div>
    </div>

    <!-- دعوة صديق -->
    <div class="bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-4">
      <div class="flex items-center justify-between">
        <div>
          <h4 class="font-bold text-white mb-1">ادعُ أصدقاءك</h4>
          <p class="text-green-200 text-sm">
            احصل على 10% من أرباحهم
          </p>
        </div>
        <button 
          @click="$emit('change-tab', 'referrals')"
          class="bg-white text-green-600 px-4 py-2 rounded-lg text-sm font-medium"
        > دعوة
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { Wallet as WalletIcon, ArrowRight as ArrowRightIcon, Award as AwardIcon, TrendingUp as TrendingUpIcon } from 'lucide-vue-next'

export default {
  name: 'Home',
  components: {
    WalletIcon,
    ArrowRightIcon,
    AwardIcon,
    TrendingUpIcon
  },
  props: {
    user: {
      type: Object,
      required: true
    }
  },
  emits: ['change-tab'],
  setup() {
        
    const formatBalance = (balance) => {
      return balance ? parseFloat(balance).toFixed(4) : '0.0000'
               
    }

    return {
      formatBalance
    }
  }
}
</script>
