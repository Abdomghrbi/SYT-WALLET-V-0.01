
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
      const stored = localStorage.getItem('syt-wallet-user')
      if (stored) {
        try {
          this.user = JSON.parse(stored)
          this.isAuthenticated = true
        } catch (e) {
          console.error('خطأ في قراءة التخزين:', e)
        }
      }
      this.isLoading = false
    },

    async login(initData) {
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Telegram-Init-Data': initData
          },
          body: JSON.stringify({ initData })
        })

        const data = await response.json()

        if (data.success) {
          this.user = data.user
          this.isAuthenticated = true
          localStorage.setItem('syt-wallet-user', JSON.stringify(data.user))
          return { success: true }
        } else {
          throw new Error(data.message)
        }
      } catch (error) {
        return { success: false, error: error.message }
      }
    },

    logout() {
      this.user = null
      this.isAuthenticated = false
      localStorage.removeItem('syt-wallet-user')
      supabase.auth.signOut()
    },

    updateBalance(amount) {
      if (this.user) {
        this.user.balance += amount
        localStorage.setItem('syt-wallet-user', JSON.stringify(this.user))
      }
    }
  }
})
