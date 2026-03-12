
import { defineStore } from 'pinia'
import { supabase } from '../config/supabase'
import { supabaseAdmin } from '../config/supabaseAdmin'

export const useStore = defineStore('main', {
  state: () => ({
    user: null,
    isAuthenticated: false,
    isLoading: true
  }),

  actions: {
    async login(initData) {
      try {
        const tg = window.Telegram?.WebApp
        if (!tg?.initDataUnsafe?.user) {
          throw new Error('بيانات Telegram غير متوفرة')
        }

        const tgUser = tg.initDataUnsafe.user

        // البحث عن المستخدم
        let { data: user, error } = await supabase
          .from('users')
          .select('*')
          .eq('telegram_id', tgUser.id)
          .single()

        // إنشاء مستخدم جديد باستخدام Service Role
        if (error && error.code === 'PGRST116') {
          const { data: newUser, error: createError } = await supabaseAdmin
            .from('users')
            .insert({
              telegram_id: tgUser.id,
              username: tgUser.username,
              first_name: tgUser.first_name,
              last_name: tgUser.last_name,
              photo_url: tgUser.photo_url,
              language_code: tgUser.language_code || 'ar',
              balance: 0,
              total_earned: 0,
              referral_count: 0,
              tasks_completed: 0
            })
            .select()
            .single()

          if (createError) throw createError
          user = newUser
        } else if (error) {
          throw error
        }

        // تحديث آخر دخول
        await supabaseAdmin
          .from('users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', user.id)

        this.user = user
        this.isAuthenticated = true

        return { success: true, user }

      } catch (error) {
        console.error('خطأ:', error)
        return { success: false, error: error.message }
      }
    },

    logout() {
      this.user = null
      this.isAuthenticated = false
    }
  }
})
