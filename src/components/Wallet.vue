
<template>
  <div class="p-4 pb-20">
    <!-- رصيد -->
    <div class="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 mb-4">
      <p class="text-blue-200 text-sm mb-1">الرصيد</p>
      <h2 class="text-4xl font-bold text-white mb-2">
        {{ formatBalance(user?.balance || 0) }} <span class="text-xl">SYT</span>
      </h2>
      <p class="text-blue-200 text-sm">≈ ${{ formatUsd(user?.balance || 0) }} USD</p>
    </div>

    <div v-if="!activeForm" class="grid grid-cols-2 gap-3 mb-4">
      <button 
        @click="activeForm = 'receive'"
        class="bg-gray-900 text-white p-4 rounded-xl flex flex-col items-center gap-2 active:scale-95 transition-transform">
        <ArrowDownLeftIcon size="24" class="text-green-400" />
        <span class="text-sm">استلام</span>
      </button>
      <button 
        @click="activeForm = 'send'"
        class="bg-gray-900 text-white p-4 rounded-xl flex flex-col items-center gap-2 active:scale-95 transition-transform">
        <ArrowUpRightIcon size="24" class="text-red-400" />
        <span class="text-sm">إرسال</span>
      </button>
    </div>

    <!-- نموذج الاستلام -->
    <div v-if="activeForm === 'receive'" class="bg-gray-900 rounded-xl p-4 mb-4">
      <div class="flex items-center justify-between mb-3">
        <h3 class="font-semibold flex items-center gap-2">
          <ArrowDownLeftIcon size="18" class="text-green-400" />
          استلام SYT
        </h3>
        <button 
          @click="activeForm = null" 
          class="text-gray-400 active:scale-95 transition-transform">
          ✕
        </button>
      </div>
      
      <p class="text-gray-400 text-sm mb-3">شارك هذا العنوان لاستلام SYT:</p>
      
      <div class="bg-black/30 rounded-lg p-3 mb-3">
        <code class="text-sm text-white break-all block mb-2">{{ user?.wallet_address }}</code>
        <button 
          @click="copyAddress"
          class="w-full bg-blue-500 text-white py-2 rounded-lg text-sm active:scale-95 transition-transform">
          نسخ العنوان
        </button>
      </div>
    </div>

    <!-- نموذج الإرسال -->
    <div v-if="activeForm === 'send'" class="bg-gray-900 rounded-xl p-4 mb-4">
      <div class="flex items-center justify-between mb-3">
        <h3 class="font-semibold flex items-center gap-2">
          <ArrowUpRightIcon size="18" class="text-red-400" />
          إرسال SYT
        </h3>
        <button 
          @click="activeForm = null" 
          class="text-gray-400 active:scale-95 transition-transform">
          ✕
        </button>
      </div>

      <!-- خطأ -->
      <div v-if="sendError" class="bg-red-900/50 border border-red-500 rounded-lg p-3 mb-3">
        <p class="text-red-300 text-sm">{{ sendError }}</p>
      </div>

      <!-- نجاح -->
      <div v-if="sendSuccess" class="bg-green-900/50 border border-green-500 rounded-lg p-3 mb-3">
        <p class="text-green-300 text-sm">✅ تم الإرسال بنجاح!</p>
      </div>

      <div class="space-y-3">
        <div>
          <label class="text-gray-400 text-sm block mb-1">عنوان المستلم</label>
          <input 
            v-model="sendForm.toAddress"
            type="text"
            placeholder="0x..."
            class="w-full bg-black/30 text-white p-3 rounded-lg text-sm border border-gray-700 focus:border-blue-500 outline-none"/>
        </div>

        <div>
          <label class="text-gray-400 text-sm block mb-1">المبلغ (SYT)</label>
          <input 
            v-model="sendForm.amount"
            type="number"
            placeholder="0.00"
            step="0.00000001"
            min="0"
            class="w-full bg-black/30 text-white p-3 rounded-lg text-sm border border-gray-700 focus:border-blue-500 outline-none"/>
          <p class="text-gray-500 text-xs mt-1">الرصيد المتاح: {{ formatBalance(user?.balance) }} SYT</p>
        </div>

        <button 
          @click="handleSend"
          :disabled="sending || !sendForm.toAddress || !sendForm.amount || sendForm.amount <= 0"
          class="w-full bg-red-500 text-white py-3 rounded-lg text-sm font-medium active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed">
          {{ sending ? 'جارٍ الإرسال...' : 'إرسال' }}
        </button>
      </div>
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
import { supabaseAdmin } from '../config/supabaseAdmin'
import { ArrowDownLeft as ArrowDownLeftIcon, ArrowUpRight as ArrowUpRightIcon, History as HistoryIcon, Copy as CopyIcon, CheckCircle2 as CheckCircleIcon, Clock as ClockIcon } from 'lucide-vue-next'

export default {
  name: 'Wallet',
  components: { ArrowDownLeftIcon, ArrowUpRightIcon, HistoryIcon, CopyIcon },
  props: { 
    user: { 
      type: Object, 
      required: true 
    } 
  },
  setup(props) {
    const transactions = ref([])
    
    const activeForm = ref(null)
    
    const sendForm = ref({
      toAddress: '',
      amount: ''
    })
    const sending = ref(false)
    const sendError = ref('')
    const sendSuccess = ref(false)

    onMounted(() => fetchTransactions())

    const fetchTransactions = async () => {
      const { data: txs } = await supabaseAdmin
        .from('transactions')
        .select('*')
        .eq('user_id', props.user.id)
        .order('created_at', { ascending: false })
        .limit(20)
      transactions.value = txs || []
    }

    const formatBalance = (val) => parseFloat(val || 0).toFixed(4)
    const formatUsd = (val) => ((val || 0) * 0.001).toFixed(2)
    const formatDate = (date) => new Date(date).toLocaleDateString('ar-SA')
    
    const copyAddress = () => {
      if (props.user?.wallet_address) {
        navigator.clipboard.writeText(props.user.wallet_address)
      }
    }

    const handleSend = async () => {
      sending.value = true
      sendError.value = ''
      sendSuccess.value = false

      try {
        const amount = parseFloat(sendForm.value.amount)
        const toAddress = sendForm.value.toAddress.trim()

        // التحققات
        if (!toAddress.startsWith('0x')) {
          throw new Error('عنوان غير صالح (يجب أن يبدأ بـ 0x)')
        }
        
        if (amount <= 0) {
          throw new Error('المبلغ يجب أن يكون أكبر من صفر')
        }
        
        if (amount > props.user.balance) {
          throw new Error('رصيد غير كافٍ')
        }

        // إيجاد المستلم
        const { data: receiver, error: receiverError } = await supabaseAdmin
          .from('users')
          .select('id, balance')
          .eq('wallet_address', toAddress)
          .single()

        if (receiverError || !receiver) {
          throw new Error('المستلم غير موجود')
        }

        if (receiver.id === props.user.id) {
          throw new Error('لا يمكن الإرسال لنفسك')
        }

        // خصم من المرسل
        const newBalance = props.user.balance - amount
        const { error: senderError } = await supabaseAdmin
          .from('users')
          .update({ balance: newBalance })
          .eq('id', props.user.id)

        if (senderError) throw new Error('فشل الخصم')

        // إضافة للمستلم
        const receiverNewBalance = receiver.balance + amount
        const { error: receiverUpdateError } = await supabaseAdmin
          .from('users')
          .update({ balance: receiverNewBalance })
          .eq('id', receiver.id)

        if (receiverUpdateError) {
          // إرجاع الرصيد
          await supabaseAdmin
            .from('users')
            .update({ balance: props.user.balance })
            .eq('id', props.user.id)
          throw new Error('فشل الإضافة للمستلم')
        }

        // تسجيل المعاملة
        const { error: txError } = await supabaseAdmin
          .from('transactions')
          .insert({
            user_id: props.user.id,
            type: 'withdraw',
            amount: amount,
            status: 'completed',
            to_address: toAddress,
            from_address: props.user.wallet_address,
            description: `إرسال إلى ${toAddress.substring(0, 10)}...`,
            created_at: new Date().toISOString()
          })

        if (txError) throw new Error('فشل تسجيل المعاملة')

        // تحديث المحلي
        props.user.balance = newBalance
        sendSuccess.value = true
        sendForm.value = { toAddress: '', amount: '' }
        
        // تحديث السجل
        fetchTransactions()

        // إغلاق النموذج بعد 2 ثانية
        setTimeout(() => {
          activeForm.value = null
          sendSuccess.value = false
        }, 2000)

      } catch (e) {
        sendError.value = e.message || 'حدث خطأ'
      } finally {
        sending.value = false
      }
    }

    const getTxIcon = (type) => ({ 
      deposit: ArrowDownLeftIcon, 
      withdraw: ArrowUpRightIcon, 
      reward: CheckCircleIcon, 
      referral_bonus: CheckCircleIcon, 
      task_bonus: CheckCircleIcon 
    }[type] || ClockIcon)

    const getTxColor = (type) => ({ 
      deposit: 'text-green-400', 
      withdraw: 'text-red-400', 
      reward: 'text-green-400', 
      referral_bonus: 'text-green-400', 
      task_bonus: 'text-green-400' 
    }[type] || 'text-gray-400')

    const getTxLabel = (type) => ({ 
      deposit: 'إيداع', 
      withdraw: 'إرسال', 
      reward: 'مكافأة', 
      referral_bonus: 'إحالة', 
      task_bonus: 'مهمة' 
    }[type] || type)

    const formatTxAmount = (amount, type) => {
      const prefix = ['deposit', 'reward', 'referral_bonus', 'task_bonus'].includes(type) ? '+' : '-'
      return `${prefix}${amount}`
    }

    return { 
      transactions, 
      activeForm,
      sendForm,
      sending,
      sendError,
      sendSuccess,
      formatBalance, 
      formatUsd, 
      formatDate, 
      copyAddress,
      handleSend,
      getTxIcon, 
      getTxColor, 
      getTxLabel, 
      formatTxAmount 
    }
  }
}
</script>
