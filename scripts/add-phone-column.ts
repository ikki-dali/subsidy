import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function addPhoneColumn() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('Adding phone column to companies table...');

  const { error } = await supabase.rpc('exec_sql', {
    query: 'ALTER TABLE companies ADD COLUMN IF NOT EXISTS phone TEXT;'
  });

  if (error) {
    // RPCが存在しない場合は、直接クエリを試みる
    console.log('RPC not available, trying direct approach...');
    
    // テスト用に既存のレコードを確認
    const { data, error: selectError } = await supabase
      .from('companies')
      .select('*')
      .limit(1);
    
    if (selectError) {
      console.error('Error:', selectError);
      return;
    }

    console.log('Current table structure sample:', data);
    console.log('\nPlease run the following SQL in Supabase Dashboard:');
    console.log('ALTER TABLE companies ADD COLUMN IF NOT EXISTS phone TEXT;');
  } else {
    console.log('Phone column added successfully!');
  }
}

addPhoneColumn();

