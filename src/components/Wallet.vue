
<template>
  <div class="p-4 pb-20">
    <!-- رصيد -->
    <div class="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 mb-4">
      <p class="text-blue-200 text-sm mb-1">الرصيد المتاح</p>
      <h2 class="text-4xl font-bold text-white mb-2">
        {{ formatBalance(balance) }} <span class="text-xl">SYT</span>
      </h2>
      <p class="text-blue-200 text-sm">≈ ${{ formatUsd(balance) }} USD</p>
    </div>

    <!-- عنوان المحفظة -->
    <div class="bg-gray-900 rounded-xl p-4 mb-4">
      <div class="flex items-center justify-between mb-2">
        <span class="text-gray-400 text-sm">عنوان المحفظة</span>
        <button v-if="walletAddress" @click="copyAddress" class="text-blue-400 text-sm flex items-center gap-1">
          <CopyIcon size="14" /> نسخ
        </button>
      </div>
      
      <div v-if="walletAddress" class="bg-black/30 rounded-lg p-3">
        <code class="text-sm text-white break-all">{{ walletAddress }}</code>
      </div>
    
    </div>

    <!-- أزرار سريعة -->
    <div class="grid grid-cols-2 gap-3 mb-4">
      <button class="bg-gray-900 text-white p-4 rounded-xl flex flex-col items-center gap-2">
        <ArrowDownLeftIcon size="24" class="text-green-400" />
        <span class="text-sm">إيداع</span>
      </button>
      <button class="bg-gray-900 text-white p-4 rounded-xl flex flex-col items-center gap-2">
        <ArrowUpRightIcon size="24" class="text-red-400" />
        <span class="text-sm">سحب</span>
      </button>
    </div>

    <!-- سجل المعاملات -->
    <div class="bg-gray-900 rounded-xl p-4">
      <h3 class="font-semibold mb-4 flex items-center gap-2">
        <HistoryIcon size="18" /> سجل المعاملات
      </h3>

      <div v-if="transactions.length === 0" class="text-center text-gray-500 py-4">لا توجد معاملات</div>

      <div v-else class="space-y-3">
        <div v-for="tx in transactions" :key="tx.id" class="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
          <div class="flex items-center gap-3">
            <div class="bg-gray-800 p-2 rounded-lg">
              <component :is="getTxIcon(tx.type)" size="20" :class="getTxColor(tx.type)" />
            </div>
            <div>
              <p class="font-medium text-sm">{{ getTxLabel(tx.type) }}</p>
              <p class="text-xs text-gray-500">{{ formatDate(tx.created_at) }}</p>
            </div>
          </div>
          
          <div class="text-right">
            <p :class="['font-bold', getTxColor(tx.type)]">{{ formatTxAmount(tx.amount, tx.type) }}</p>
            <p class="text-xs text-gray-500">{{ tx.status === 'completed' ? 'مكتمل' : tx.status }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { supabase } from '../config/supabase'
import { ArrowDownLeft as ArrowDownLeftIcon, ArrowUpRight as ArrowUpRightIcon, History as HistoryIcon, Copy as CopyIcon, CheckCircle2 as CheckCircleIcon, Clock as ClockIcon } from 'lucide-vue-next'

export default {
  name: 'Wallet',
  components: { ArrowDownLeftIcon, ArrowUpRightIcon, HistoryIcon, CopyIcon },
  props: { user: { type: Object, required: true } },
  setup(props) {
    const balance = ref(0)
    const walletAddress = ref('')
    const transactions = ref([])

    onMounted(() => fetchWalletData())

    const fetchWalletData = async () => {
      const { data } = await supabase.from('users').select('balance, wallet_address').eq('id', props.user.id).single()
      if (data) {
        balance.value = data.balance || 0
        walletAddress.value = data.wallet_address || ''
      }
      const { data: txs } = await supabase.from('transactions').select('*').eq('user_id', props.user.id).order('created_at', { ascending: false }).limit(20)
      transactions.value = txs || []
    }

    const formatBalance = (val) => parseFloat(val || 0).toFixed(4)
    const formatUsd = (val) => ((val || 0) * 0.001).toFixed(2)
    const formatDate = (date) => new Date(date).toLocaleDateString('ar-SA')
    const copyAddress = () => navigator.clipboard.writeText(walletAddress.value)

    const getTxIcon = (type) => ({ deposit: ArrowDownLeftIcon, withdraw: ArrowUpRightIcon, reward: CheckCircleIcon, referral_bonus: CheckCircleIcon, task_bonus: CheckCircleIcon }[type] || ClockIcon)
    const getTxColor = (type) => ({ deposit: 'text-green-400', withdraw: 'text-red-400', reward: 'text-green-400', referral_bonus: 'text-green-400', task_bonus: 'text-green-400' }[type] || 'text-gray-400')
    const getTxLabel = (type) => ({ deposit: 'إيداع', withdraw: 'سحب', reward: 'مكافأة', referral_bonus: 'إحالة', task_bonus: 'مهمة' }[type] || type)
    const formatTxAmount = (amount, type) => `${['deposit', 'reward', 'referral_bonus', 'task_bonus'].includes(type) ? '+' : '-'}${amount}`

    return { balance, walletAddress, transactions, formatBalance, formatUsd, formatDate, copyAddress, getTxIcon, getTxColor, getTxLabel, formatTxAmount }
  }
}
</script>
