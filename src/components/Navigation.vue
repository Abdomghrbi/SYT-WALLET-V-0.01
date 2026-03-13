<template>
  <nav class="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800">
    <div class="flex justify-around items-center h-26">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="$emit('change-tab', tab.id)"
        class="flex flex-col items-center justify-center w-full h-full"
        :class="activeTab === tab.id ? 'text-blue-400' : 'text-gray-500'"
      >
        <component :is="tab.icon" size="24" />
        <span class="text-xs mt-1">{{ tab.label }}</span>
      </button>
    </div>
  </nav>
</template>

<script>
import { Home, Wallet, ListTodo, Users } from 'lucide-vue-next'

export default {
  name: 'Navigation',
  props: {
    activeTab: {
      type: String,
      required: true
    }
  },
  emits: ['change-tab'],
  setup() {
    const tabs = [
      { id: 'home', icon: Home, label: 'الرئيسية' },
      { id: 'tasks', icon: ListTodo, label: 'المهام' },
      { id: 'referrals', icon: Users, label: 'الإحالات' },
      { id: 'wallet', icon: Wallet, label: 'المحفظة' }
    ]

    return {
      tabs
    }
  }
}
</script>
