import Stripe from 'stripe';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function getAllCustomers() {
  let allCustomers = [];
  let hasMore = true;
  let startingAfter = null;
  
  while (hasMore) {
    const params = {
      limit: 100,
      ...(startingAfter && { starting_after: startingAfter })
    };
    
    const customers = await stripe.customers.list(params);
    allCustomers = allCustomers.concat(customers.data);
    
    if (customers.has_more) {
      startingAfter = customers.data[customers.data.length - 1].id;
    } else {
      hasMore = false;
    }
  }
  
  return allCustomers;
}

async function deleteAllCustomers() {
  console.log('🗑️  STRIPE CUSTOMER DELETION TOOL');
  console.log('==================================\n');
  
  try {
    // Get all customers
    console.log('🔍 Fetching all customers from Stripe...');
    const customers = await getAllCustomers();
    
    if (customers.length === 0) {
      console.log('✅ No customers found to delete.');
      rl.close();
      return;
    }
    
    console.log(`\n📊 Found ${customers.length} customer(s) to delete:\n`);
    
    // Show what will be deleted
    customers.forEach((customer, index) => {
      console.log(`${index + 1}. ID: ${customer.id}`);
      console.log(`   Email: ${customer.email || 'No email'}`);
      console.log(`   Name: ${customer.name || 'No name'}`);
      console.log(`   Created: ${new Date(customer.created * 1000).toISOString()}`);
      console.log(`   Subscriptions: ${customer.subscriptions?.total_count || 0}`);
      console.log(`   Payment methods: ${customer.invoice_settings?.default_payment_method ? 'Yes' : 'No'}`);
      console.log('');
    });
    
    // Confirmation prompts
    console.log('⚠️  WARNING: This action is PERMANENT and IRREVERSIBLE!');
    console.log('⚠️  All customers will be deleted immediately.');
    console.log('⚠️  This will also delete all associated subscriptions, payment methods, and invoices.');
    console.log('⚠️  This will affect ALL customer data in your Stripe account.\n');
    
    const firstConfirm = await askQuestion('Are you absolutely sure you want to delete ALL customers? (yes/no): ');
    
    if (firstConfirm.toLowerCase() !== 'yes') {
      console.log('❌ Operation cancelled.');
      rl.close();
      return;
    }
    
    const secondConfirm = await askQuestion(`Type "DELETE ${customers.length} CUSTOMERS" to confirm: `);
    
    if (secondConfirm !== `DELETE ${customers.length} CUSTOMERS`) {
      console.log('❌ Confirmation text did not match. Operation cancelled.');
      rl.close();
      return;
    }
    
    console.log('\n🗑️  Starting deletion process...\n');
    
    // Delete each customer
    const results = [];
    for (let i = 0; i < customers.length; i++) {
      const customer = customers[i];
      console.log(`[${i + 1}/${customers.length}] Deleting customer ${customer.id} (${customer.email || 'no email'})...`);
      
      try {
        const deletedCustomer = await stripe.customers.del(customer.id);
        results.push({
          id: customer.id,
          email: customer.email,
          status: deletedCustomer.deleted,
          success: true,
          error: null
        });
        console.log(`✅ Successfully deleted customer ${customer.id}`);
      } catch (error) {
        results.push({
          id: customer.id,
          email: customer.email,
          status: 'error',
          success: false,
          error: error.message
        });
        console.log(`❌ Failed to delete customer ${customer.id}: ${error.message}`);
      }
    }
    
    // Summary
    console.log('\n📊 DELETION SUMMARY:');
    console.log('===================');
    console.log(`Total customers: ${customers.length}`);
    console.log(`Successfully deleted: ${results.filter(r => r.success).length}`);
    console.log(`Failed to delete: ${results.filter(r => !r.success).length}`);
    
    if (results.filter(r => !r.success).length > 0) {
      console.log('\n❌ Failed deletions:');
      results.filter(r => !r.success).forEach(result => {
        console.log(`   - ${result.id} (${result.email}): ${result.error}`);
      });
    }
    
    console.log('\n✅ Deletion process completed.');
    
  } catch (error) {
    console.error('❌ Error during deletion process:', error.message);
  } finally {
    rl.close();
  }
}

deleteAllCustomers(); 