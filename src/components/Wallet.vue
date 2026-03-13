<template>
  <div class="p-4 pb-20">

    <!-- الرصيد -->
    <div class="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 mb-4">
      <p class="text-blue-200 text-sm mb-1">الرصيد المتاح</p>

      <h2 class="text-4xl font-bold text-white mb-2">
        {{ formatBalance(balance) }} <span class="text-xl">SYT</span>
      </h2>

      <p class="text-blue-200 text-sm">
        ≈ ${{ formatUsd(balance) }} USD
      </p>
    </div>

    <!-- أزرار -->
    <div class="grid grid-cols-2 gap-3 mb-4">

      <button
        @click="deposit"
        class="bg-gray-900 text-white p-4 rounded-xl flex flex-col items-center gap-2"
      >
        <ArrowDownLeftIcon size="24" class="text-green-400"/>
        <span class="text-sm">إيداع</span>
      </button>

      <button
        @click="sendTokens"
        class="bg-gray-900 text-white p-4 rounded-xl flex flex-col items-center gap-2"
      >
        <ArrowUpRightIcon size="24" class="text-red-400"/>
        <span class="text-sm">إرسال</span>
      </button>

    </div>

    <!-- سجل المعاملات -->
    <div class="bg-gray-900 rounded-xl p-4">

      <h3 class="font-semibold mb-4 flex items-center gap-2">
        <HistoryIcon size="18"/> سجل المعاملات
      </h3>

      <div v-if="transactions.length === 0" class="text-center text-gray-500 py-4">
        لا توجد معاملات
      </div>

      <div v-else class="space-y-3">

        <div
          v-for="tx in transactions"
          :key="tx.id"
          class="flex items-center justify-between py-2 border-b border-gray-800 last:border-0"
        >

          <div class="flex items-center gap-3">

            <div class="bg-gray-800 p-2 rounded-lg">
              <component
                :is="getTxIcon(tx.type)"
                size="20"
                :class="getTxColor(tx.type)"
              />
            </div>

            <div>
              <p class="font-medium text-sm">
                {{ getTxLabel(tx.type) }}
              </p>

              <p class="text-xs text-gray-500">
                {{ formatDate(tx.created_at) }}
              </p>
            </div>

          </div>

          <div class="text-right">

            <p :class="['font-bold', getTxColor(tx.type)]">
              {{ formatTxAmount(tx.amount, tx.type) }}
            </p>

            <p class="text-xs text-gray-500">
              {{ tx.status }}
            </p>

          </div>

        </div>

      </div>

    </div>

  </div>
</template>

<script>

import { ref, onMounted } from 'vue'
import { supabase } from '../config/supabase'

import {
  ArrowDownLeft as ArrowDownLeftIcon,
  ArrowUpRight as ArrowUpRightIcon,
  History as HistoryIcon,
  CheckCircle2 as CheckCircleIcon,
  Clock as ClockIcon
} from 'lucide-vue-next'

export default {

  name: 'Wallet',

  components: {
    ArrowDownLeftIcon,
    ArrowUpRightIcon,
    HistoryIcon
  },

  props:{
    user:{
      type:Object,
      required:true
    }
  },

  setup(props){

    const balance = ref(props.user?.balance || 0)
    const transactions = ref([])

    onMounted(()=>{
      fetchTransactions()
    })



    const fetchTransactions = async()=>{

      const { data } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', props.user.id)
        .order('created_at', { ascending:false })
        .limit(20)

      transactions.value = data || []

    }



    const deposit = async()=>{

      const amount = parseFloat(prompt("ادخل مبلغ الإيداع"))

      if(!amount) return

      const newBalance = balance.value + amount

      await supabase
        .from('users')
        .update({ balance:newBalance })
        .eq('id', props.user.id)

      await supabase
        .from('transactions')
        .insert({
          user_id:props.user.id,
          type:'deposit',
          amount:amount,
          status:'completed'
        })

      balance.value = newBalance

      fetchTransactions()

      alert("تم الإيداع بنجاح")

    }



    const sendTokens = async()=>{

      const receiverId = prompt("ادخل ID المستخدم المستلم")

      const amount = parseFloat(prompt("ادخل المبلغ"))

      if(!receiverId || !amount) return

      if(amount > balance.value){
        alert("الرصيد غير كافي")
        return
      }

      const { data:receiver } = await supabase
        .from('users')
        .select('*')
        .eq('id', receiverId)
        .single()

      if(!receiver){
        alert("المستخدم غير موجود")
        return
      }

      const senderNewBalance = balance.value - amount
      const receiverNewBalance = receiver.balance + amount


      await supabase
        .from('users')
        .update({ balance:senderNewBalance })
        .eq('id', props.user.id)


      await supabase
        .from('users')
        .update({ balance:receiverNewBalance })
        .eq('id', receiverId)


      await supabase
        .from('transactions')
        .insert({
          user_id:props.user.id,
          type:'withdraw',
          amount:amount,
          status:'completed'
        })


      await supabase
        .from('transactions')
        .insert({
          user_id:receiverId,
          type:'deposit',
          amount:amount,
          status:'completed'
        })


      balance.value = senderNewBalance

      fetchTransactions()

      alert("تم التحويل بنجاح")

    }



    const formatBalance = (val)=>parseFloat(val || 0).toFixed(4)

    const formatUsd = (val)=>((val||0)*0.001).toFixed(2)

    const formatDate = (date)=>new Date(date).toLocaleDateString('ar-SA')



    const getTxIcon = (type)=>({
      deposit:ArrowDownLeftIcon,
      withdraw:ArrowUpRightIcon
    }[type] || ClockIcon)



    const getTxColor = (type)=>({
      deposit:'text-green-400',
      withdraw:'text-red-400'
    }[type] || 'text-gray-400')



    const getTxLabel = (type)=>({
      deposit:'إيداع',
      withdraw:'إرسال'
    }[type] || type)



    const formatTxAmount = (amount,type)=>
      `${type==='deposit'?'+':'-'}${amount}`



    return{
      balance,
      transactions,
      deposit,
      sendTokens,
      formatBalance,
      formatUsd,
      formatDate,
      getTxIcon,
      getTxColor,
      getTxLabel,
      formatTxAmount
    }

  }

}
</script>
