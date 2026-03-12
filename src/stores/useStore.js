
import { defineStore } from 'pinia'
import { supabase } from '../config/supabase'
import { supabaseAdmin } from '../config/supabaseAdmin'

const generateWalletAddress = (telegramId) => {
  const prefix = '0x'
  const hash = telegramId.toString(16).padStart(40, '0')
  return prefix + hash
}

const generateReferralCode = () => {
  return 'SYT' + Math.random().toString(36).substring(2, 8).toUpperCase()
}

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

    async login() {
      try {
        const tg = window.Telegram?.WebApp
        if (!tg?.initDataUnsafe?.user) {
          throw new Error('بيانات Telegram غير متوفرة')
        }

        const tgUser = tg.initDataUnsafe.user
        console.log('Telegram user ID:', tgUser.id)

        const { data: user, error: searchError } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('telegram_id', tgUser.id)
          .maybeSingle()

        if (searchError) throw searchError

        if (user) {
          console.log('مستخدم موجود:', user.id)
          
          const updates = {}
          if (!user.wallet_address) updates.wallet_address = generateWalletAddress(user.telegram_id)
          if (!user.referral_code) updates.referral_code = generateReferralCode()
          
          if (Object.keys(updates).length > 0) {
            const { data: updatedUser } = await supabaseAdmin
              .from('users')
              .update(updates)
              .eq('id', user.id)
              .select()
              .single()
            if (updatedUser) Object.assign(user, updatedUser)
          }
          
          await supabaseAdmin
            .from('users')
            .update({ last_login: new Date().toISOString() })
            .eq('id', user.id)

          this.user = user
          this.isAuthenticated = true
          return { success: true, user }
        }

        const { data: newUser, error: createError } = await supabaseAdmin
          .from('users')
          .insert({
            telegram_id: tgUser.id,
            username: tgUser.username,
            first_name: tgUser.first_name,
            last_name: tgUser.last_name,
            photo_url: tgUser.photo_url,
            language_code: tgUser.language_code || 'ar',
            wallet_address: generateWalletAddress(tgUser.id),
            referral_code: generateReferralCode(),
            balance: 0,
            total_earned: 0,
            referral_count: 0,
            tasks_completed: 0
          })
          .select()
          .single()

        if (createError) {
          if (createError.code === '23505') {
            const { data: existingUser } = await supabaseAdmin
              .from('users')
              .select('*')
              .eq('telegram_id', tgUser.id)
              .single()
            
            if (existingUser) {
              const updates = {}
              if (!existingUser.wallet_address) updates.wallet_address = generateWalletAddress(existingUser.telegram_id)
              if (!existingUser.referral_code) updates.referral_code = generateReferralCode()
              
              if (Object.keys(updates).length > 0) {
                const { data: updatedUser } = await supabaseAdmin
                  .from('users')
                  .update(updates)
                  .eq('id', existingUser.id)
                  .select()
                  .single()
                if (updatedUser) Object.assign(existingUser, updatedUser)
              }
              
              this.user = existingUser
              this.isAuthenticated = true
              return { success: true, user: existingUser }
            }
          }
          throw createError
        }

        this.user = newUser
        this.isAuthenticated = true
        return { success: true, user: newUser }

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
