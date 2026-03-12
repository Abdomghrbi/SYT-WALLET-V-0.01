<template>
  <div class="p-4 pb-20">

    <h2 class="text-xl font-bold mb-4">المكافأة اليومية</h2>

    <div class="bg-gray-900 rounded-xl p-4">

      <div class="flex items-center justify-between">

        <div class="flex items-center gap-3">

          <div class="bg-blue-500/20 p-2 rounded-lg">
            <GiftIcon size="20" class="text-blue-400"/>
          </div>

          <div>
            <h3 class="font-semibold">مكافأة تسجيل الدخول</h3>
            <p class="text-sm text-gray-400">
              احصل على 25 عملة كل 24 ساعة
            </p>
          </div>

        </div>

        <span class="text-green-400 font-bold">+25</span>

      </div>

      <div class="mt-4 flex justify-between items-center">

        <span class="text-sm text-gray-400">
          {{ statusText }}
        </span>

        <button
          @click="claimReward"
          :disabled="!canClaim || loading"
          class="px-4 py-2 rounded-lg text-sm"
          :class="canClaim ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-400'"
        >
          {{ loading ? '...' : 'استلام المكافأة' }}
        </button>

      </div>

    </div>

  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { supabase } from '../config/supabase'
import { Gift as GiftIcon } from 'lucide-vue-next'

export default {

  name:'Tasks',

  components:{
    GiftIcon
  },

  props:{
    user:{
      type:Object,
      required:true
    }
  },

  setup(props){

    const canClaim = ref(false)
    const statusText = ref("جارٍ التحقق...")
    const loading = ref(false)

    const DAILY_TASK_ID = "6c3c8c9c-3c0a-4c88-bc57-2d89c9c1c001"
    
    const checkDailyReward = async ()=>{

      const { data } = await supabase
      .from('user_tasks')
      .select('claimed_at')
      .eq('user_id', props.user.id)
      .eq('task_id', DAILY_TASK_ID)
      .order('claimed_at',{ ascending:false })
      .limit(1)

      if(!data || data.length === 0){

        canClaim.value = true
        statusText.value = "متاحة الآن"
        return

      }

      const lastClaim = new Date(data[0].claimed_at)
      const now = new Date()

      const diffHours = (now - lastClaim) / (1000*60*60)

      if(diffHours >= 24){

        canClaim.value = true
        statusText.value = "متاحة الآن"

      }else{

        const remaining = Math.ceil(24 - diffHours)

        canClaim.value = false
        statusText.value = `متاحة بعد ${remaining} ساعة`

      }

    }


    const claimReward = async ()=>{

      if(!canClaim.value) return

      loading.value = true

      const reward = 25

      try{

        await supabase
        .from('user_tasks')
        .insert({
          user_id: props.user.id,
          task_id: DAILY_TASK_ID,
          status:'completed',
          completed_at:new Date().toISOString(),
          claimed_at:new Date().toISOString(),
          reward_claimed:reward
        })


        const { data:userData } = await supabase
        .from('users')
        .select('balance')
        .eq('id',props.user.id)
        .single()

        const newBalance = (userData.balance || 0) + reward


        await supabase
        .from('users')
        .update({ balance:newBalance })
        .eq('id',props.user.id)


        /* تحديث الرصيد في الواجهة فوراً */

        props.user.balance = newBalance


        checkDailyReward()

      }catch(e){

        console.error(e)

      }

      loading.value = false

    }


    onMounted(()=>{

      checkDailyReward()

    })


    return{
      canClaim,
      statusText,
      loading,
      claimReward
    }

  }

}
</script>
