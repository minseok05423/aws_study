import supabase from "./utils/supabase.ts";

async function a() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: "minseok05423@gmail.com",
    password: "minseok1744",
  });
  return { data, error };
}

const { data, error } = await a();

console.log("Data:", data);
console.log("Error:", error);
console.log("Access Token:", data?.session?.access_token);
