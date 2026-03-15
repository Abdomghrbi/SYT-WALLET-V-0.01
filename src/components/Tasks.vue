<template>
  <div class="p-4 pb-20">
    <h2 class="text-xl font-bold mb-4">المهام المتاحة</h2>

    <!-- عرض الخطأ -->
    <div v-if="errorMessage" class="bg-red-900/50 border border-red-500 rounded-xl p-4 mb-4">
      <p class="text-red-400 text-sm font-bold">⚠️ خطأ:</p>
      <p class="text-red-300 text-xs">{{ errorMessage }}</p>
      <button @click="errorMessage = ''" class="text-red-400 text-xs mt-2 underline">إخفاء</button>
    </div>

    <div v-if="loading" class="flex justify-center p-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>

    <div v-else class="space-y-3">
      <!-- ✅ مهمة مكافأة التسجيل (مرة واحدة) -->
      <div v-if="!signupClaimed" class="bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl p-4">
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-3">
            <div class="bg-white/20 p-2 rounded-lg">
              <GiftIcon size="20" class="text-white" />
            </div>
            <div>
              <h3 class="font-semibold text-white">🎁 مكافأة التسجيل</h3>
              <p class="text-sm text-purple-200">احصل على 250 SYT ترحيبية</p>
            </div>
          </div>
          <div class="text-right">
            <span class="text-green-300 font-bold">+250 SYT</span>
          </div>
        </div>

        <div class="mt-3 flex items-center justify-between">
          <span class="text-purple-200 text-sm">متاحة لمرة واحدة</span>

          <button
            @click="claimSignupReward"
            :disabled="loadingSignup"
            class="bg-white text-purple-600 px-4 py-2 rounded-lg text-sm font-bold active:scale-95 transition-transform disabled:opacity-50"
          >
            {{ loadingSignup ? 'جارٍ التحميل...' : 'استلام المكافأة' }}
          </button>
        </div>
      </div>

      <!-- ✅ مهمة مكافأة يومية -->
      <div class="bg-gray-900 rounded-xl p-4" :class="{ 'opacity-60': dailyJustClaimed }">
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-3">
            <div class="bg-blue-500/20 p-2 rounded-lg">
              <GiftIcon size="20" class="text-blue-400" />
            </div>
            <div>
              <h3 class="font-semibold">مكافأة تسجيل الدخول اليومي</h3>
              <p class="text-sm text-gray-400">اضغط للاستلام</p>
            </div>
          </div>
          <div class="text-right">
            <span class="text-green-400 font-bold">+25 SYT</span>
          </div>
        </div>

        <div class="mt-3 flex items-center justify-between">
          <div class="flex items-center gap-2 text-sm text-gray-500">
            <CheckCircleIcon v-if="dailyJustClaimed" size="16" class="text-green-400" />
            <ClockIcon v-else-if="!canClaimDaily" size="16" class="text-yellow-400" />
            <span>{{ dailyStatusText }}</span>
          </div>

          <button
            v-if="canClaimDaily && !dailyJustClaimed"
            @click="claimDailyReward"
            :disabled="loadingDaily"
            class="bg-green-500 text-white px-4 py-2 rounded-lg text-sm active:scale-95 transition-transform disabled:opacity-50"
          >
            {{ loadingDaily ? 'جارٍ التحميل...' : 'استلام المكافأة' }}
          </button>

          <span v-else-if="dailyJustClaimed" class="text-green-400 text-sm font-medium">
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
    // ✅ مهمة التسجيل
    const SIGNUP_TASK_ID = '660e8400-e29b-41d4-a716-446655440001'
    const SIGNUP_REWARD = 250
    const signupClaimed = ref(true) // افتراضياً مستلم حتى نتحقق
    const loadingSignup = ref(false)

    // ✅ المهمة اليومية
    const DAILY_TASK_ID = '550e8400-e29b-41d4-a716-446655440000'
    const DAILY_REWARD = 1
    const COOLDOWN_HOURS = 24
    const loading = ref(true)
    const loadingDaily = ref(false)
    const lastDailyClaimed = ref(null)
    const dailyJustClaimed = ref(false)
    const errorMessage = ref('')

    // ✅ التحقق من مكافأة التسجيل عند التحميل
    const checkSignupClaimed = async () => {
      try {
        const { data } = await supabaseAdmin
          .from('user_tasks')
          .select('id')
          .eq('user_id', props.user.id)
          .eq('task_id', SIGNUP_TASK_ID)
          .maybeSingle()

        signupClaimed.value = !!data // true إذا وجدنا سجل
      } catch (e) {
        console.error('خطأ في التحقق من مكافأة التسجيل:', e)
        signupClaimed.value = true // افتراضياً مستلم لتجنب الخطأ
      }
    }

    const fetchLastDailyClaim = async () => {
      loading.value = true
      try {
        const { data } = await supabaseAdmin
          .from('user_tasks')
          .select('claimed_at')
          .eq('user_id', props.user.id)
          .eq('task_id', DAILY_TASK_ID)
          .order('claimed_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        lastDailyClaimed.value = data?.claimed_at ? new Date(data.claimed_at) : null
      } catch (e) {
        console.error('خطأ في جلب آخر مكافأة يومية:', e)
      } finally {
        loading.value = false
      }
    }

    onMounted(() => {
      checkSignupClaimed()
      fetchLastDailyClaim()
    })

    const hoursSinceLastDailyClaim = computed(() => {
      if (!lastDailyClaimed.value) return Infinity
      return (new Date() - lastDailyClaimed.value) / (1000 * 60 * 60)
    })

    const canClaimDaily = computed(() => {
      return hoursSinceLastDailyClaim.value >= COOLDOWN_HOURS || hoursSinceLastDailyClaim.value === Infinity
    })

    const dailyStatusText = computed(() => {
      if (dailyJustClaimed.value) return 'تم الاستلام لليوم'
      if (canClaimDaily.value) return 'متاحة الآن'
      const remaining = Math.ceil(COOLDOWN_HOURS - hoursSinceLastDailyClaim.value)
      return `متاحة بعد ${remaining} ساعة`
    })

    // ✅ استلام مكافأة التسجيل
    const claimSignupReward = async () => {
      if (signupClaimed.value || loadingSignup.value) return

      loadingSignup.value = true
      errorMessage.value = ''

      try {
        const nowISO = new Date().toISOString()

        // التحقق مرة أخرى (للأمان)
        const { data: existing } = await supabaseAdmin
          .from('user_tasks')
          .select('id')
          .eq('user_id', props.user.id)
          .eq('task_id', SIGNUP_TASK_ID)
          .maybeSingle()

        if (existing) {
          signupClaimed.value = true
          throw new Error('لقد استلمت هذه المكافأة مسبقاً')
        }

        // إدراج المهمة
        const { error: taskError } = await supabaseAdmin
          .from('user_tasks')
          .insert({
            user_id: props.user.id,
            task_id: SIGNUP_TASK_ID,
            status: 'completed',
            completed_at: nowISO,
            claimed_at: nowISO,
            reward_claimed: SIGNUP_REWARD
          })

        if (taskError) throw new Error('task: ' + taskError.message)

        // جلب وتحديث الرصيد
        const { data: userData, error: fetchError } = await supabaseAdmin
          .from('users')
          .select('balance, total_earned')
          .eq('id', props.user.id)
          .single()

        if (fetchError) throw new Error('fetch: ' + fetchError.message)

        const newBalance = parseFloat(userData.balance || 0) + SIGNUP_REWARD
        const newTotalEarned = parseFloat(userData.total_earned || 0) + SIGNUP_REWARD

        const { error: updateError } = await supabaseAdmin
          .from('users')
          .update({ balance: newBalance, total_earned: newTotalEarned })
          .eq('id', props.user.id)

        if (updateError) throw new Error('update: ' + updateError.message)

        // تحديث المحلي
        props.user.balance = newBalance
        props.user.total_earned = newTotalEarned
        signupClaimed.value = true

      } catch (e) {
        errorMessage.value = e.message || 'حدث خطأ'
      } finally {
        loadingSignup.value = false
      }
    }

    // ✅ استلام المكافأة اليومية
    const claimDailyReward = async () => {
      if (!canClaimDaily.value || loadingDaily.value) return

      loadingDaily.value = true
      errorMessage.value = ''

      try {
        const nowISO = new Date().toISOString()

        // إدراج المهمة
        const { error: taskError } = await supabaseAdmin
          .from('user_tasks')
          .insert({
            user_id: props.user.id,
            task_id: DAILY_TASK_ID,
            status: 'completed',
            completed_at: nowISO,
            claimed_at: nowISO,
            reward_claimed: DAILY_REWARD
          })

        if (taskError) throw new Error('task: ' + taskError.message)

        // جلب وتحديث الرصيد
        const { data: userData, error: fetchError } = await supabaseAdmin
          .from('users')
          .select('balance, total_earned')
          .eq('id', props.user.id)
          .single()

        if (fetchError) throw new Error('fetch: ' + fetchError.message)

        const newBalance = parseFloat(userData.balance || 0) + DAILY_REWARD
        const newTotalEarned = parseFloat(userData.total_earned || 0) + DAILY_REWARD

        const { error: updateError } = await supabaseAdmin
          .from('users')
          .update({ balance: newBalance, total_earned: newTotalEarned })
          .eq('id', props.user.id)

        if (updateError) throw new Error('update: ' + updateError.message)

        // تحديث المحلي
        props.user.balance = newBalance
        props.user.total_earned = newTotalEarned
        lastDailyClaimed.value = new Date()
        dailyJustClaimed.value = true

      } catch (e) {
        errorMessage.value = e.message || 'حدث خطأ'
      } finally {
        loadingDaily.value = false
      }
    }

    return {
      // تسجيل
      signupClaimed,
      loadingSignup,
      claimSignupReward,
      // يومية
      loading,
      loadingDaily,
      canClaimDaily,
      dailyJustClaimed,
      dailyStatusText,
      claimDailyReward,
      // عام
      errorMessage
    }
  }
}
</script>
