<template>
  <div class="p-4 pb-20">

    <!-- عنوان الصفحة -->
    <h2 class="text-xl font-bold mb-4">المكافآت اليومية</h2>

    <div class="bg-gray-900 rounded-xl p-4">

      <div class="flex items-center justify-between">

        <div class="flex items-center gap-3">
          <div class="bg-blue-500/20 p-2 rounded-lg">
            <GiftIcon size="20" class="text-blue-400"/>
          </div>

          <div>
            <h3 class="font-semibold">مكافأة تسجيل الدخول</h3>
            <p class="text-sm text-gray-400">
              احصل على 25 عملة مرة كل 24 ساعة
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
          :disabled="!canClaim"
          @click="claimDailyReward"
          class="px-4 py-2 rounded-lg text-sm"
          :class="canClaim ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-400'"
        >
          استلام المكافأة
        </button>

      </div>

    </div>

  </div>
</template>

<script>

/* استيراد أدوات Vue */
import { ref, onMounted } from 'vue'

/* استيراد اتصال Supabase */
import { supabase } from '../config/supabase'

/* استيراد الأيقونة */
import { Gift as GiftIcon } from 'lucide-vue-next'

export default {

  name: 'DailyReward',

  components: {
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

    let lastClaimTime = null


    /* فحص آخر مكافأة استلمها المستخدم */
    const checkDailyReward = async ()=>{

      const { data } = await supabase
      .from('user_tasks')
      .select('*')
      .eq('user_id',props.user.id)
      .eq('task_type','daily_login')
      .order('created_at',{ascending:false})
      .limit(1)

      if(!data || data.length === 0){

        canClaim.value = true
        statusText.value = "متاحة الآن"

        return
      }

      lastClaimTime = new Date(data[0].created_at)

      const now = new Date()

      const diff = now - lastClaimTime

      const hours = diff / (1000*60*60)

      if(hours >= 24){

        canClaim.value = true
        statusText.value = "متاحة الآن"

      }else{

        const remaining = Math.ceil(24 - hours)

        canClaim.value = false
        statusText.value = `متاحة بعد ${remaining} ساعة`

      }

    }


    /* استلام المكافأة اليومية */
    const claimDailyReward = async ()=>{

      if(!canClaim.value) return


      /* تسجيل العملية في قاعدة البيانات */
      await supabase
      .from('user_tasks')
      .insert({
        user_id:props.user.id,
        task_type:'daily_login',
        reward:25
      })


      /* زيادة رصيد المستخدم */
      await supabase.rpc('add_user_balance',{
        p_user_id:props.user.id,
        p_amount:25
      })


      checkDailyReward()

    }


    onMounted(()=>{
      checkDailyReward()
    })


    return{
      canClaim,
      statusText,
      claimDailyReward
    }

  }

}
</script>
