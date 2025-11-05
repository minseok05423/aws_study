import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://tjpcqbwncobkjmvcjckj.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqcGNxYnduY29ia2ptdmNqY2tqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyMzQ4MTQsImV4cCI6MjA3NzgxMDgxNH0.PcJ6B0QsecU9fRX6k6fyJUwMs8YkCcnpqbl9ExtOdBQ";
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
