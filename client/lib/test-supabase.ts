import { supabase } from './supabase'

export async function testSupabaseConnection() {
  console.log('🔗 Testing Supabase connection...')
  
  try {
    // Test 1: Vérifier que les variables sont définies
    console.log('Supabase URL:', process.env.EXPO_PUBLIC_SUPABASE_URL?.substring(0, 20) + '...')
    
    // Test 2: Récupérer les catégories
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .limit(3)
    
    if (error) {
      console.error('❌ Supabase error:', error.message)
      return false
    }
    
    console.log('✅ Supabase connected successfully!')
    console.log('📊 Categories found:', categories?.length || 0)
    
    // Test 3: Récupérer les utilisateurs de démo
    const { data: users } = await supabase
      .from('users')
      .select('email, role, status')
      .eq('status', 'active')
    
    console.log('👤 Active users:', users?.map(u => u.email))
    
    return true
    
  } catch (error) {
    console.error('❌ Connection test failed:', error)
    return false
  }
}