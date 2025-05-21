// Supabase Configuration

import { createClient } from '@supabase/supabase-js';

// Replace with your actual Supabase project URL and anon key
const supabaseUrl = 'https://kfyzmpohxqbcryhibuii.supabase.com';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmeXptcG9oeHFiY3J5aGliaWlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MTQzMjcsImV4cCI6MjA2MzM5MDMyN30.tpxjG4CxzP0QJWGjLHvx-lEkxZVzCccCexWE4XTWBFk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
