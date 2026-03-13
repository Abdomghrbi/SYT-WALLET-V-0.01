<!-- src/components/Tasks.vue -->
<template>
  <div class="p-4 pb-20">
    <h2 class="text-xl font-bold mb-4">المهام المتاحة</h2>

    <div v-if="loading" class="flex justify-center p-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>

    <div v-else class="space-y-3">
      <!-- مهمة المكافأة اليومية -->
      <div
        class="bg-gray-900 rounded-xl p-4"
        :class="{ 'opacity-60': justClaimed }"
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
            <CheckCircleIcon v-if="justClaimed" size="16" class="text-green-400" />
            <ClockIcon v-else-if="!canClaim" size="16" class="text-yellow-400" />
            <span>{{ statusText }}</span>
          </div>

          <button
            v-if="canClaim && !justClaimed"
            @click="claimReward"
            :disabled="loadingTask"
            class="bg-green-500 text-white px-4 py-2 rounded-lg text-sm active:scale-95 transition-transform disabled:opacity-50"
          >
            {{ loadingTask ? 'جارٍ التحميل...' : 'استلام المكافأة' }}
          </button>

          <span
            v-else-if="justClaimed"
            class="text-green-400 text-sm font-medium"
          >
            ✅ تم الاستلام
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
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
    const justClaimed = ref(false)

    const DAILY_TASK_ID = '550e8400-e29b-41d4-a716-446655440000'
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
          .maybeSingle()

        lastClaimed.value = data?.claimed_at ? new Date(data.claimed_at) : null
      } catch (e) {
        console.error('خطأ في جلب آخر مكافأة:', e)
      } finally {
        loading.value = false
      }
    }

    onMounted(fetchLastClaim)

    const hoursSinceLastClaim = computed(() => {
      if (!lastClaimed.value) return Infinity
      return (new Date() - lastClaimed.value) / (1000 * 60 * 60)
    })

    const canClaim = computed(() => {
      return hoursSinceLastClaim.value >= COOLDOWN_HOURS || hoursSinceLastClaim.value === Infinity
    })

    const statusText = computed(() => {
      if (justClaimed.value) {
        return 'تم الاستلام لليوم'
      }
      
      if (canClaim.value) {
        return 'متاحة الآن'
      }
      
      const hours = hoursSinceLastClaim.value
      const remaining = Math.ceil(COOLDOWN_HOURS - hours)
      return `متاحة بعد ${remaining} ساعة`
    })

    const claimReward = async () => {
      if (!canClaim.value || loadingTask.value) return
      
      loadingTask.value = true

      try {
        const nowISO = new Date().toISOString()

        // إدراج سجل في user_tasks
        const { error: taskError } = await supabase.from('user_tasks').insert({
          user_id: props.user.id,
          task_id: DAILY_TASK_ID,
          status: 'completed',
          completed_at: nowISO,
          claimed_at: nowISO,
          reward_claimed: REWARD_AMOUNT
        })

        if (taskError) throw taskError

        // جلب الرصيد الحالي
        const { data: userData, error: fetchError } = await supabase
          .from('users')
          .select('balance, total_earned')
          .eq('id', props.user.id)
          .single()

        if (fetchError) throw fetchError

        const newBalance = parseFloat(userData.balance || 0) + REWARD_AMOUNT
        const newTotalEarned = parseFloat(userData.total_earned || 0) + REWARD_AMOUNT

        // تحديث الرصيد في جدول users
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            balance: newBalance,
            total_earned: newTotalEarned
          })
          .eq('id', props.user.id)

        if (updateError) throw updateError

        // تحديث البيانات محليًا
        props.user.balance = newBalance
        props.user.total_earned = newTotalEarned
        lastClaimed.value = new Date()
        justClaimed.value = true

      } catch (e) {
        console.error('خطأ أثناء استلام المكافأة:', e)
        alert('حدث خطأ، يرجى المحاولة مرة أخرى')
      } finally {
        loadingTask.value = false
      }
    }

    return { 
      loading, 
      claimReward, 
      canClaim, 
      justClaimed,
      statusText, 
      loadingTask 
    }
  }
}
</script>
