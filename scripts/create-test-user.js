import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load both .env and .env.local files
dotenv.config();
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function createTestUser() {
  console.log('👤 Creating new test user...\n');

  try {
    const testUser = {
      email: 'testuser@example.com',
      first_name: 'Test',
      last_name: 'User',
      phone: '+1234567890',
      address: '123 Test Street, Test City, TC 12345',
      resume_url: 'https://example.com/resume.pdf',
      linkedin_url: 'https://linkedin.com/in/testuser',
      subscription_fee: 50, // $50 for testing
      status: 'pending'
    };

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('user_id, email')
      .eq('email', testUser.email)
      .single();

    if (existingUser) {
      console.log('⚠️  Test user already exists, updating...');
      
      const { error: updateError } = await supabase
        .from('users')
        .update({
          first_name: testUser.first_name,
          last_name: testUser.last_name,
          phone: testUser.phone,
          address: testUser.address,
          resume_url: testUser.resume_url,
          linkedin_url: testUser.linkedin_url,
          subscription_fee: testUser.subscription_fee,
          status: 'pending',
          is_paid: false,
          stripe_customer_id: null,
          next_billing_at: null
        })
        .eq('user_id', existingUser.user_id);

      if (updateError) {
        console.log('❌ Error updating test user:', updateError.message);
        return;
      }

      console.log('✅ Test user updated successfully');
      console.log(`   User ID: ${existingUser.user_id}`);
      console.log(`   Email: ${testUser.email}`);
      console.log(`   Subscription Fee: $${testUser.subscription_fee}`);
      console.log(`   Status: ${testUser.status}`);
      
      return existingUser.user_id;
    } else {
      // Create new user
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert([testUser])
        .select('user_id, email')
        .single();

      if (insertError) {
        console.log('❌ Error creating test user:', insertError.message);
        return;
      }

      console.log('✅ Test user created successfully');
      console.log(`   User ID: ${newUser.user_id}`);
      console.log(`   Email: ${newUser.email}`);
      console.log(`   Subscription Fee: $${testUser.subscription_fee}`);
      console.log(`   Status: ${testUser.status}`);
      
      return newUser.user_id;
    }

  } catch (error) {
    console.error('❌ Error creating test user:', error);
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args[0] === '--help' || args[0] === '-h') {
    console.log('Create Test User Script');
    console.log('\nUsage:');
    console.log('  node scripts/create-test-user.js');
    console.log('\nThis script will:');
    console.log('1. Create a new test user or update existing one');
    console.log('2. Set subscription fee to $50 for testing');
    console.log('3. Reset user status to pending');
    console.log('4. Remove any existing Stripe data');
    return;
  }

  await createTestUser();
}

main().catch(console.error); 