// src/stores/useStore.js
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
      // لا نتحقق من localStorage
      // ننتظر تسجيل الدخول عبر Telegram فقط
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
          // ❌ لا نحفظ في localStorage
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
      // ❌ لا نحذف من localStorage (لأنه غير موجود)
      supabase.auth.signOut()
    },

    updateBalance(amount) {
      if (this.user) {
        this.user.balance += amount
        // ❌ لا نحفظ التحديث في localStorage
      }
    }
  }
})
