import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://ousjubtwfvptzjpiaqsc.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91c2p1YnR3ZnZwdHpqcGlhcXNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxOTcxMjYsImV4cCI6MjA4NTc3MzEyNn0.l8Dq4qdXCoa9rc_Vyhy8JEixnbGpiK1SoZSU1a1PWzk";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const SALT_ROUNDS = 10;

async function hashExistingPasswords() {
  console.log("🔐 Début du hashage des mots de passe...");
  
  try {
    // Récupérer tous les utilisateurs
    const { data: users, error } = await supabase
      .from("users")
      .select("id, email, password_hash");
    
    if (error) throw error;
    
    console.log(`📊 ${users.length} utilisateurs trouvés`);
    
    let updatedCount = 0;
    let alreadyHashedCount = 0;
    
    // Hasher chaque mot de passe
    for (const user of users) {
      // Vérifier si déjà hashé (bcrypt hash commence par $2a$, $2b$ ou $2y$)
      if (user.password_hash && 
          (user.password_hash.startsWith('$2a$') || 
           user.password_hash.startsWith('$2b$') || 
           user.password_hash.startsWith('$2y$'))) {
        console.log(`✓ ${user.email} : déjà hashé`);
        alreadyHashedCount++;
        continue;
      }
      
      // Mot de passe par défaut si vide
      const plainPassword = user.password_hash || 'demo123';
      
      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash(plainPassword, SALT_ROUNDS);
      
      // Mettre à jour dans Supabase
      const { error: updateError } = await supabase
        .from("users")
        .update({ password_hash: hashedPassword })
        .eq("id", user.id);
      
      if (updateError) {
        console.error(`❌ Erreur pour ${user.email}:`, updateError.message);
      } else {
        console.log(`✅ ${user.email} : mot de passe hashé`);
        updatedCount++;
      }
    }
    
    console.log("\n🎉 HASHAGE TERMINÉ !");
    console.log(`📈 Résultats :`);
    console.log(`   • ${updatedCount} comptes mis à jour`);
    console.log(`   • ${alreadyHashedCount} comptes déjà hashés`);
    console.log(`   • Total : ${users.length} utilisateurs`);
    
  } catch (error) {
    console.error("❌ Erreur:", error.message);
  }
}

hashExistingPasswords();