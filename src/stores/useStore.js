
import { defineStore } from 'pinia'
import { supabase } from '../config/supabase'

export const useStore = defineStore('main', {
  state: () => ({
    user: null,
    isAuthenticated: false,
    isLoading: true
  }),

  actions: {
    async checkAuth() {
      this.isLoading = false
    },

    async login(initData) {
      try {
        // التحقق من Telegram WebApp
        const tg = window.Telegram?.WebApp
        
        if (!tg?.initDataUnsafe?.user) {
          throw new Error('بيانات Telegram غير متوفرة')
        }

        const tgUser = tg.initDataUnsafe.user

        // البحث عن المستخدم في Supabase
        let { data: user, error } = await supabase
          .from('users')
          .select('*')
          .eq('telegram_id', tgUser.id)
          .single()

        if (error && error.code === 'PGRST116') {
          // المستخدم غير موجود - إنشاء جديد
          const { data: newUser, error: createError } = await supabase
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
        await supabase
          .from('users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', user.id)

        this.user = user
        this.isAuthenticated = true

        return { success: true, user }

      } catch (error) {
        console.error('خطأ في تسجيل الدخول:', error)
        return { success: false, error: error.message }
      }
    },

    logout() {
      this.user = null
      this.isAuthenticated = false
    },

    async updateBalance(amount) {
      if (!this.user) return

      const newBalance = (this.user.balance || 0) + amount
      
      const { error } = await supabase
        .from('users')
        .update({ balance: newBalance })
        .eq('id', this.user.id)

      if (error) {
        console.error('خطأ في تحديث الرصيد:', error)
        return
      }

      this.user.balance = newBalance
    },

    async fetchUserData() {
      if (!this.user) return

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', this.user.id)
        .single()

      if (error) {
        console.error('خطأ في جلب البيانات:', error)
        return
      }

      this.user = data
    }
  }
})
