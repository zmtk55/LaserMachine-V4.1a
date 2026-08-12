// Script to initialize database schema
import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_JZdbhAlO8qg2@ep-small-rice-ai4thzx0-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require';

async function initDatabase() {
  console.log('Connecting to Neon database...');
  const sql = neon(DATABASE_URL);
  
  // Read schema file
  const schema = readFileSync('./database/schema.sql', 'utf-8');
  
  // Split by semicolon and filter empty statements
  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  console.log(`Found ${statements.length} SQL statements to execute`);
  
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    if (stmt.length < 5) continue;
    
    try {
      await sql.unsafe(stmt);
      console.log(`✓ Statement ${i + 1}/${statements.length} executed`);
    } catch (error) {
      // Ignore "already exists" errors
      if (error.message?.includes('already exists')) {
        console.log(`○ Statement ${i + 1}: Already exists (skipped)`);
      } else {
        console.error(`✗ Statement ${i + 1} failed:`, error.message);
      }
    }
  }
  
  console.log('\n✅ Database initialization complete!');
  
  // Verify tables exist
  const tables = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    ORDER BY table_name
  `;
  console.log('\nTables created:', tables.map(t => t.table_name).join(', '));
}

initDatabase().catch(console.error);
