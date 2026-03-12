
async login(initData) {
  try {
    const tg = window.Telegram?.WebApp
    if (!tg?.initDataUnsafe?.user) {
      throw new Error('بيانات Telegram غير متوفرة')
    }

    const tgUser = tg.initDataUnsafe.user
    console.log('Telegram user:', tgUser.id)

    // البحث عن المستخدم - بأي طريقة
    let user = null
    let searchError = null

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('telegram_id', tgUser.id)
        .maybeSingle() 
      
      user = data
      searchError = error
    } catch (e) {
      searchError = e
    }

    console.log('Search result:', { user, searchError })

    
    if (user) {
      console.log('مستخدم موجود:', user.id)
      
      
      await supabaseAdmin
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', user.id)

      this.user = user
      this.isAuthenticated = true
      return { success: true, user }
    }

    
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
      
      if (createError.message?.includes('duplicate') || createError.code === '23505') {
        console.log('المستخدم موجود فعلاً، جاري البحث...')
        
        const { data: existingUser } = await supabase
          .from('users')
          .select('*')
          .eq('telegram_id', tgUser.id)
          .maybeSingle()
        
        if (existingUser) {
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
}
