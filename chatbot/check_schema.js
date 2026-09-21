require('dotenv').config({path:__dirname+'/.env'});
const {createClient}=require('@supabase/supabase-js');
const s=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_KEY);

async function check() {
  const {data: cData, error: cErr} = await s.from('clients').insert({platform:'test', external_id:'test'}).select();
  if(cErr) console.log('CLIENTS ERROR:', cErr.message);
  else {
    console.log('CLIENTS:', Object.keys(cData?.[0]||{}));
    await s.from('clients').delete().eq('platform','test');
  }
  
  const {data: iData, error: iErr} = await s.from('interactions').insert({session_id:'test', role:'user', message_text:'test', platform:'test'}).select();
  if(iErr) console.log('INTERACTIONS ERROR:', iErr.message);
  else {
    console.log('INTERACTIONS:', Object.keys(iData?.[0]||{}));
    await s.from('interactions').delete().eq('session_id','test');
  }
}
check();
