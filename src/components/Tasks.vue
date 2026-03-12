<template>
  <div class="p-4 pb-20">
    <h2 class="text-xl font-bold mb-4">المهام المتاحة</h2>

    <div v-if="loading" class="flex justify-center p-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>

    <div v-else class="space-y-3">

      <div
        class="bg-gray-900 rounded-xl p-4"
        :class="{ 'opacity-60': isCompleted }"
      >

        <div class="flex items-start justify-between">
          <div class="flex items-center gap-3">
            <div class="bg-blue-500/20 p-2 rounded-lg">
              <GiftIcon size="20" class="text-blue-400" />
            </div>
            <div>
              <h3 class="font-semibold">مكافأة تسجيل الدخول اليومي</h3>
              <p class="text-sm text-gray-400">اضغط هنا لاستلام 25 عملة SYT</p>
            </div>
          </div>

          <div class="text-right">
            <span class="text-green-400 font-bold">+25 SYT</span>
          </div>
        </div>

        <div class="mt-3 flex items-center justify-between">
          <div class="flex items-center gap-2 text-sm text-gray-500">
            <CheckCircleIcon v-if="isCompleted" size="16" class="text-green-400" />
            <ClockIcon v-else-if="isPending" size="16" class="text-yellow-400" />
            <span>{{ statusText }}</span>
          </div>

          <button
            v-if="canClaim"
            @click="claimReward"
            class="bg-green-500 text-white px-4 py-2 rounded-lg text-sm"
          >
            {{ loading ? '...' : 'استلام المكافأة' }}
          </button>
        </div>

      </div>

    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { supabase } from '../config/supabase'
import { Gift as GiftIcon, CheckCircle2 as CheckCircleIcon, Clock as ClockIcon } from 'lucide-vue-next'

export default {
  name: 'Tasks',
  components: { GiftIcon, CheckCircleIcon, ClockIcon },
  props: {
    user: { type: Object, required: true }
  },
  setup(props) {
    const loading = ref(true)
    const loadingTask = ref(false)
    const lastClaimed = ref(null)

    const DAILY_TASK_ID = 'daily-login'  // فقط معرف وهمي للمهمة اليومية
    const REWARD_AMOUNT = 25
    const COOLDOWN_HOURS = 24

    const fetchLastClaim = async () => {
      loading.value = true
      try {
        const { data } = await supabase
          .from('user_tasks')
          .select('claimed_at')
          .eq('user_id', props.user.id)
          .eq('task_id', DAILY_TASK_ID)
          .order('claimed_at', { ascending: false })
          .limit(1)
          .single()

        lastClaimed.value = data?.claimed_at ? new Date(data.claimed_at) : null

      } catch (e) {
        console.error(e)
      } finally {
        loading.value = false
      }
    }

    onMounted(fetchLastClaim)

    const now = () => new Date()

    const hoursSinceLastClaim = () => {
      if (!lastClaimed.value) return Infinity
      return (now() - lastClaimed.value) / (1000 * 60 * 60)
    }

    const canClaim = ref(false)
    const isCompleted = ref(false)
    const isPending = ref(true)
    const statusText = ref('جارٍ التحميل...')

    const updateStatus = () => {
      if (hoursSinceLastClaim() >= COOLDOWN_HOURS) {
        canClaim.value = true
        isCompleted.value = false
        isPending.value = false
        statusText.value = 'متاحة الآن'
      } else {
        canClaim.value = false
        isCompleted.value = false
        isPending.value = true
        const remaining = Math.ceil(COOLDOWN_HOURS - hoursSinceLastClaim())
        statusText.value = `متاحة بعد ${remaining} ساعة`
      }
      if (hoursSinceLastClaim() === Infinity) {
        // لم يستلم من قبل
        canClaim.value = true
        isCompleted.value = false
        isPending.value = false
        statusText.value = 'متاحة الآن'
      }
    }

    // تحديث الحالة كل ثانية
    setInterval(updateStatus, 1000)
    onMounted(updateStatus)

    const claimReward = async () => {
      if (!canClaim.value) return
      loadingTask.value = true

      try {
        const nowISO = new Date().toISOString()

        // إدراج مهمة في user_tasks
        await supabase.from('user_tasks').insert({
          user_id: props.user.id,
          task_id: DAILY_TASK_ID,
          status: 'completed',
          completed_at: nowISO,
          claimed_at: nowISO,
          reward_claimed: REWARD_AMOUNT
        })

        // تحديث رصيد المستخدم
        const { data: userData } = await supabase
          .from('users')
          .select('balance')
          .eq('id', props.user.id)
          .single()

        const newBalance = (userData.balance || 0) + REWARD_AMOUNT

        await supabase
          .from('users')
          .update({ balance: newBalance })
          .eq('id', props.user.id)

        // تحديث الرصيد محلياً
        props.user.balance = newBalance
        lastClaimed.value = new Date()
        updateStatus()

      } catch (e) {
        console.error(e)
      } finally {
        loadingTask.value = false
      }
    }

    return { loading, claimReward, canClaim, isCompleted, isPending, statusText, loadingTask }
  }
}
</script>
