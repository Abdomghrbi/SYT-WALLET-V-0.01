
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
              {{ isCompleted(task.id) ? 'تم الاستلام' : isSubmitted(task.id) ? 'قيد المراجعة' : 'متاحة' }}
            </span>
          </div>

          <button
            v-if="isPending(task.id)"
            @click="startTask(task)"
            class="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm"
          >
            بدء المهمة
          </button>

          <button
            v-else-if="isDone(task.id)"
            @click="claimReward(task.id)"
            class="bg-green-500 text-white px-4 py-2 rounded-lg text-sm"
          >
            استلام المكافأة
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

    onMounted(() => {
      fetchTasks()
    })

    const fetchTasks = async () => {
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
      return userTasks.value.find(ut => ut.task_id === taskId)
    }

    const isPending = (taskId) => !getUserTask(taskId)
    const isSubmitted = (taskId) => getUserTask(taskId)?.status === 'submitted'
    const isDone = (taskId) => getUserTask(taskId)?.status === 'completed'
    const isCompleted = (taskId) => ['completed', 'claimed'].includes(getUserTask(taskId)?.status)

    const startTask = async (task) => {
      if (task.requirements?.url) {
        window.open(task.requirements.url, '_blank')
      }

      await supabase.from('user_tasks').insert({
        user_id: props.user.id,
        task_id: task.id,
        status: 'submitted',
        submitted_at: new Date().toISOString()
      })

      fetchTasks()
    }

    const claimReward = async (taskId) => {
      await supabase.rpc('claim_task_reward', {
        p_user_id: props.user.id,
        p_task_id: taskId
      })
      fetchTasks()
    }

    return {
      tasks,
      loading,
      isPending,
      isSubmitted,
      isDone,
      isCompleted,
      startTask,
      claimReward
    }
  }
}
</script>
