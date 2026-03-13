
<template>
  <div class="p-4 pb-20">
    <h2 class="text-xl font-bold mb-4">المهام المتاحة</h2>

    <!-- عرض الخطأ -->
    <div v-if="errorMessage" class="bg-red-900/50 border border-red-500 rounded-xl p-4 mb-4">
      <p class="text-red-400 text-sm font-bold">⚠️ خطأ:</p>
      <p class="text-red-300 text-xs">{{ errorMessage }}</p>
      <button @click="errorMessage = ''" class="text-red-400 text-xs mt-2 underline">إخفاء</button>
    </div>

    <!-- عرض خطوات التنفيذ -->
    <div v-if="debugSteps.length > 0" class="bg-blue-900/30 border border-blue-500 rounded-xl p-4 mb-4">
      <p class="text-blue-400 text-sm font-bold mb-2">🔍 خطوات التنفيذ:</p>
      <ul class="space-y-1">
        <li v-for="(step, index) in debugSteps" :key="index" class="text-blue-300 text-xs">
          {{ index + 1 }}. {{ step }}
        </li>
      </ul>
      <button @click="debugSteps = []" class="text-blue-400 text-xs mt-2 underline">مسح</button>
    </div>

    <div v-if="loading" class="flex justify-center p-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>

    <div v-else class="space-y-3">
      <div class="bg-gray-900 rounded-xl p-4" :class="{ 'opacity-60': justClaimed }">
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

          <span v-else-if="justClaimed" class="text-green-400 text-sm font-medium">
            ✅ تم الاستلام
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { supabaseAdmin } from '../config/supabaseAdmin'
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
    const errorMessage = ref('')
    const debugSteps = ref([]) // ✅ تسجيل الخطوات

    const DAILY_TASK_ID = '550e8400-e29b-41d4-a716-446655440000'
    const REWARD_AMOUNT = 25
    const COOLDOWN_HOURS = 24

    const addStep = (step) => {
      debugSteps.value.push(`${new Date().toLocaleTimeString()}: ${step}`)
      console.log(step)
    }

    const fetchLastClaim = async () => {
      loading.value = true
      addStep('بدء fetchLastClaim')
      
      try {
        addStep(`البحث عن مهام المستخدم: ${props.user.id}`)
        
        const { data, error } = await supabaseAdmin
          .from('user_tasks')
          .select('claimed_at')
          .eq('user_id', props.user.id)
          .eq('task_id', DAILY_TASK_ID)
          .order('claimed_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (error) {
          addStep(`❌ خطأ في البحث: ${error.message}`)
          errorMessage.value = 'fetchLastClaim: ' + error.message
        } else {
          addStep(`✅ نتيجة البحث: ${data ? 'found' : 'not found'}`)
        }
        
        lastClaimed.value = data?.claimed_at ? new Date(data.claimed_at) : null
        addStep(`lastClaimed: ${lastClaimed.value}`)
        
      } catch (e) {
        addStep(`❌ catch: ${e.message || e}`)
        errorMessage.value = 'catch fetchLastClaim: ' + (e.message || e)
      } finally {
        loading.value = false
        addStep('انتهى fetchLastClaim')
      }
    }

    onMounted(() => {
      addStep('onMounted - props.user: ' + JSON.stringify({
        id: props.user?.id,
        telegram_id: props.user?.telegram_id,
        balance: props.user?.balance
      }))
      fetchLastClaim()
    })

    const hoursSinceLastClaim = computed(() => {
      if (!lastClaimed.value) return Infinity
      return (new Date() - lastClaimed.value) / (1000 * 60 * 60)
    })

    const canClaim = computed(() => {
      const result = hoursSinceLastClaim.value >= COOLDOWN_HOURS || hoursSinceLastClaim.value === Infinity
      addStep(`canClaim: ${result} (hours: ${hoursSinceLastClaim.value})`)
      return result
    })

    const statusText = computed(() => {
      if (justClaimed.value) return 'تم الاستلام لليوم'
      if (canClaim.value) return 'متاحة الآن'
      const remaining = Math.ceil(COOLDOWN_HOURS - hoursSinceLastClaim.value)
      return `متاحة بعد ${remaining} ساعة`
    })

    const claimReward = async () => {
      addStep('=== بدء claimReward ===')
      
      if (!canClaim.value) {
        addStep('❌ cannot claim - متوقف')
        return
      }
      
      if (loadingTask.value) {
        addStep('❌ already loading - متوقف')
        return
      }
      
      loadingTask.value = true
      errorMessage.value = ''
      debugSteps.value = [] // مسح الخطوات القديمة

      try {
        const nowISO = new Date().toISOString()
        addStep(`الوقت الحالي: ${nowISO}`)

        if (!props.user?.id) {
          addStep('❌ معرف المستخدم غير موجود')
          throw new Error('معرف المستخدم غير موجود')
        }
        
        addStep(`معرف المستخدم: ${props.user.id}`)

        // ✅ الخطوة 1: إدراج في user_tasks
        addStep('الخطوة 1: إدراج في user_tasks...')
        
        const insertData = {
          user_id: props.user.id,
          task_id: DAILY_TASK_ID,
          status: 'completed',
          completed_at: nowISO,
          claimed_at: nowISO,
          reward_claimed: REWARD_AMOUNT
        }
        addStep(`بيانات الإدراج: ${JSON.stringify(insertData)}`)

        const { data: insertResult, error: taskError } = await supabaseAdmin
          .from('user_tasks')
          .insert(insertData)
          .select()

        if (taskError) {
          addStep(`❌ خطأ في الإدراج: ${taskError.message}`)
          addStep(`كود الخطأ: ${taskError.code}`)
          throw new Error('user_tasks: ' + taskError.message)
        }
        
        addStep(`✅ تم الإدراج بنجاح: ${JSON.stringify(insertResult)}`)

        // ✅ الخطوة 2: جلب الرصيد الحالي
        addStep('الخطوة 2: جلب الرصيد الحالي...')
        
        const { data: userData, error: fetchError } = await supabaseAdmin
          .from('users')
          .select('balance, total_earned')
          .eq('id', props.user.id)
          .single()

        if (fetchError) {
          addStep(`❌ خطأ في جلب الرصيد: ${fetchError.message}`)
          throw new Error('fetch balance: ' + fetchError.message)
        }

        if (!userData) {
          addStep('❌ لم يتم العثور على المستخدم')
          throw new Error('لم يتم العثور على المستخدم')
        }
        
        addStep(`✅ الرصيد الحالي: balance=${userData.balance}, total_earned=${userData.total_earned}`)

        const newBalance = parseFloat(userData.balance || 0) + REWARD_AMOUNT
        const newTotalEarned = parseFloat(userData.total_earned || 0) + REWARD_AMOUNT
        
        addStep(`الرصيد الجديد: ${newBalance}, total_earned الجديد: ${newTotalEarned}`)

        // ✅ الخطوة 3: تحديث الرصيد
        addStep('الخطوة 3: تحديث الرصيد...')
        
        const { data: updateResult, error: updateError } = await supabaseAdmin
          .from('users')
          .update({ 
            balance: newBalance,
            total_earned: newTotalEarned
          })
          .eq('id', props.user.id)
          .select()

        if (updateError) {
          addStep(`❌ خطأ في التحديث: ${updateError.message}`)
          throw new Error('update balance: ' + updateError.message)
        }
        
        addStep(`✅ تم التحديث بنجاح: ${JSON.stringify(updateResult)}`)

        // ✅ الخطوة 4: تحديث البيانات محليًا
        addStep('الخطوة 4: تحديث البيانات محليًا...')
        
        props.user.balance = newBalance
        props.user.total_earned = newTotalEarned
        lastClaimed.value = new Date()
        justClaimed.value = true
        
        addStep('✅ تم الانتهاء بنجاح!')

      } catch (e) {
        addStep(`❌❌ خطأ نهائي: ${e.message}`)
        errorMessage.value = e.message || 'حدث خطأ غير معروف'
      } finally {
        loadingTask.value = false
        addStep('=== انتهى claimReward ===')
      }
    }

    return { 
      loading, 
      claimReward, 
      canClaim, 
      justClaimed,
      statusText, 
      loadingTask,
      errorMessage,
      debugSteps
    }
  }
}
</script>
