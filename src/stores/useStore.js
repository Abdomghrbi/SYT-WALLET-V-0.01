
async login(initData) {
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

    if (searchError) {
      console.error('خطأ في البحث:', searchError)
      throw searchError
    }

    // ✅ إذا وجدنا المستخدم
    if (user) {
      console.log('مستخدم موجود:', user.id)
      
      // تحديث آخر دخول
      await supabaseAdmin
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', user.id)

      this.user = user
      this.isAuthenticated = true
      return { success: true, user }
    }

    // ✅ إنشاء مستخدم جديد
    console.log('إنشاء مستخدم جديد...')
    
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

    if (createError) {
      // إذا كان المستخدم قد أُنشأ للتو (سباق)
      if (createError.code === '23505') {
        console.log('المستخدم أُنشأ للتو، جاري البحث...')
        
        const { data: existingUser } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('telegram_id', tgUser.id)
          .single()
        
        if (existingUser) {
          this.user = existingUser
          this.isAuthenticated = true
          return { success: true, user: existingUser }
        }
      }
      
      throw createError
    }

    console.log('مستخدم جديد:', newUser.id)
    this.user = newUser
    this.isAuthenticated = true
    return { success: true, user: newUser }

  } catch (error) {
    console.error('خطأ في تسجيل الدخول:', error)
    return { success: false, error: error.message }
  }
}
