import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data: staff } = await supabase.from('restaurant_staff').select('*');
  console.log('--- RESTAURANT STAFF ---');
  console.log(staff);

  const { data: rests } = await supabase.from('restaurants').select('id, name, owner_id');
  console.log('--- RESTAURANTS ---');
  console.log(rests);

  const { data: owners } = await supabase.from('owner_profiles').select('*');
  console.log('--- OWNER PROFILES ---');
  console.log(owners);
  
  const { data: users, error } = await supabase.auth.admin.listUsers();
  if (users?.users) {
      console.log('--- AUTH USERS ---');
      console.log(users.users.map(u => ({ id: u.id, email: u.email })));
  } else {
      console.error(error);
  }
}
check();
