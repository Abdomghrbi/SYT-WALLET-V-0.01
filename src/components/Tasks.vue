<template>
  <div class="p-4 pb-20">

    <h2 class="text-xl font-bold mb-4">المهام المتاحة</h2>

    <div v-if="loading" class="flex justify-center p-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>

    <div v-else-if="tasks.length === 0" class="text-center text-gray-500 py-8">
      لا توجد مهام متاحة حالياً
    </div>

    <div v-else class="space-y-3">

      <div
        v-for="task in tasks"
        :key="task.id"
        class="bg-gray-900 rounded-xl p-4"
        :class="{ 'opacity-60': isCompleted(task.id) }"
      >

        <div class="flex items-start justify-between">

          <div class="flex items-center gap-3">
            <div class="bg-blue-500/20 p-2 rounded-lg">
              <GiftIcon size="20" class="text-blue-400" />
            </div>
            <div>
              <h3 class="font-semibold">{{ task.title?.ar || task.title }}</h3>
              <p class="text-sm text-gray-400">{{ task.description?.ar || task.description }}</p>
            </div>
          </div>

          <div class="text-right">
            <span class="text-green-400 font-bold">+{{ task.reward_amount }} {{ task.reward_currency }}</span>
          </div>

        </div>

        <div class="mt-3 flex items-center justify-between">
          <div class="flex items-center gap-2 text-sm text-gray-500">
            <CheckCircleIcon v-if="isCompleted(task.id)" size="16" class="text-green-400" />
            <ClockIcon v-else-if="isSubmitted(task.id)" size="16" class="text-yellow-400" />
            <span>
              {{ statusText(task) }}
            </span>
          </div>

          <button
            v-if="canClaim(task)"
            @click="claimReward(task)"
            class="bg-green-500 text-white px-4 py-2 rounded-lg text-sm"
          >
            {{ loadingTaskId === task.id ? '...' : 'استلام المكافأة' }}
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
  components: {
    GiftIcon,
    CheckCircleIcon,
    ClockIcon
  },
  props: {
    user: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const tasks = ref([])
    const userTasks = ref([])
    const loading = ref(true)
    const loadingTaskId = ref(null)

    onMounted(() => {
      fetchTasks()
    })

    const fetchTasks = async () => {
      loading.value = true
      try {
        const { data: allTasks } = await supabase
          .from('tasks')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true })

        const { data: myTasks } = await supabase
          .from('user_tasks')
          .select('*')
          .eq('user_id', props.user.id)

        tasks.value = allTasks || []
        userTasks.value = myTasks || []

      } catch (error) {
        console.error('خطأ في جلب المهام:', error)
      } finally {
        loading.value = false
      }
    }

    const getUserTask = (taskId) => {
      return userTasks.value
        .filter(ut => ut.task_id === taskId)
        .sort((a,b)=> new Date(b.claimed_at) - new Date(a.claimed_at))[0]
    }

    const isSubmitted = (taskId) => getUserTask(taskId)?.status === 'submitted'
    const isCompleted = (taskId) => ['completed', 'claimed'].includes(getUserTask(taskId)?.status)

    const canClaim = (task) => {
      if (!task.is_repeatable) {
        return !isCompleted(task.id)
      }

      const ut = getUserTask(task.id)
      if (!ut) return true
      if (!ut.claimed_at) return true

      const lastClaim = new Date(ut.claimed_at)
      const now = new Date()
      const diffHours = (now - lastClaim) / (1000*60*60)
      return diffHours >= (task.cooldown_hours || 24)
    }

    const statusText = (task) => {
      if (!task.is_repeatable) return isCompleted(task.id) ? 'تم الاستلام' : 'متاحة'
      const ut = getUserTask(task.id)
      if (!ut) return 'متاحة الآن'
      const lastClaim = new Date(ut.claimed_at)
      const now = new Date()
      const diffHours = (now - lastClaim) / (1000*60*60)
      if(diffHours >= (task.cooldown_hours || 24)) return 'متاحة الآن'
      const remaining = Math.ceil((task.cooldown_hours || 24) - diffHours)
      return `متاحة بعد ${remaining} ساعة`
    }

    const claimReward = async (task) => {
      if (!canClaim(task)) return
      loadingTaskId.value = task.id
      const reward = task.reward_amount || 0

      try {
        // تسجيل المهمة في user_tasks
        await supabase.from('user_tasks').insert({
          user_id: props.user.id,
          task_id: task.id,
          status: 'completed',
          completed_at: new Date().toISOString(),
          claimed_at: new Date().toISOString(),
          reward_claimed: reward
        })

        // تحديث رصيد المستخدم
        const { data:userData } = await supabase
          .from('users')
          .select('balance')
          .eq('id', props.user.id)
          .single()

        const newBalance = (userData.balance || 0) + reward

        await supabase
          .from('users')
          .update({ balance: newBalance })
          .eq('id', props.user.id)

        // تحديث الرصيد مباشرة في الواجهة
        props.user.balance = newBalance

        // إعادة تحميل المهام
        await fetchTasks()

      } catch (e) {
        console.error(e)
      }

      loadingTaskId.value = null
    }

    return {
      tasks,
      loading,
      loadingTaskId,
      isSubmitted,
      isCompleted,
      canClaim,
      statusText,
      claimReward
    }
  }
}
</script>
