import { supabase } from './supabase'

export async function testDatabaseConnection() {
  console.log('🧪 Test de connexion à Supabase...')
  
  try {
    // Test 1: Récupérer les catégories
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('id, name')
      .limit(5)
    
    if (catError) {
      console.error('❌ Erreur categories:', catError.message)
      return false
    }
    
    console.log(`✅ ${categories?.length || 0} catégories trouvées`)
    
    // Test 2: Récupérer les utilisateurs actifs
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('email, role, status')
      .eq('status', 'active')
    
    if (userError) {
      console.error('❌ Erreur users:', userError.message)
      return false
    }
    
    console.log(`✅ ${users?.length || 0} utilisateurs actifs`)
    
    // Test 3: Récupérer les clients
    const { data: clients, error: clientError } = await supabase
      .from('clients')
      .select('id, name')
      .limit(5)
    
    if (clientError) {
      console.error('❌ Erreur clients:', clientError.message)
      return false
    }
    
    console.log(`✅ ${clients?.length || 0} clients trouvés`)
    
    console.log('🎉 Tous les tests passés avec succès!')
    return true
    
  } catch (error) {
    console.error('❌ Erreur inattendue:', error)
    return false
  }
}