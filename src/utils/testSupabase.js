// Test Supabase Connection
import { supabase, checkBucket } from './supabase';

export const testSupabaseConnection = async () => {
  console.log('🔍 Testing Supabase Connection...');
  
  try {
    // Test 1: Check if Supabase client is initialized
    if (!supabase) {
      console.error('❌ Supabase client is not initialized');
      return false;
    }
    console.log('✅ Supabase client initialized');

    // Test 2: Check bucket exists
    const bucketResult = await checkBucket('yly-tasks');
    if (bucketResult.exists) {
      console.log('✅ Bucket "yly-tasks" exists');
    } else {
      console.warn('⚠️ Bucket "yly-tasks" does not exist. Please create it in Supabase Dashboard.');
      console.log('📝 Instructions:');
      console.log('   1. Go to: https://zidakvdpucmdotxdrfcs.supabase.co');
      console.log('   2. Navigate to Storage');
      console.log('   3. Create a new bucket named "yly-tasks"');
      console.log('   4. Make it public');
      return false;
    }

    // Test 3: Check environment variables
    if (!process.env.REACT_APP_SUPABASE_URL) {
      console.error('❌ REACT_APP_SUPABASE_URL is not set');
      return false;
    }
    console.log('✅ REACT_APP_SUPABASE_URL is set');

    if (!process.env.REACT_APP_SUPABASE_ANON_KEY) {
      console.error('❌ REACT_APP_SUPABASE_ANON_KEY is not set');
      return false;
    }
    console.log('✅ REACT_APP_SUPABASE_ANON_KEY is set');

    console.log('🎉 All Supabase tests passed!');
    return true;

  } catch (error) {
    console.error('❌ Supabase test failed:', error);
    return false;
  }
};

// Run test on import (only in development)
if (process.env.NODE_ENV === 'development') {
  testSupabaseConnection();
}
