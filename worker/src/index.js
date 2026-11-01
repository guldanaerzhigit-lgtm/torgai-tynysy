import {createRemoteJWKSet,jwtVerify} from 'jose';
const keys=createRemoteJWKSet(new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'));
const cors=(origin,env)=>({'Access-Control-Allow-Origin':(env.ALLOWED_ORIGINS||'').split(',').map(x=>x.trim()).includes(origin)?origin:(env.ALLOWED_ORIGINS||'*').split(',')[0],'Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Authorization,Content-Type','Access-Control-Max-Age':'86400','Vary':'Origin'});
const json=(v,s,h)=>new Response(JSON.stringify(v),{status:s,headers:{'Content-Type':'application/json; charset=utf-8',...h}});
const roles=['superadmin','editor','archivist','viewer'];
async function authenticate(req,env){const token=(req.headers.get('Authorization')||'').replace(/^Bearer\\s+/i,'');if(!token)throw Error('Авторизация қажет.');const {payload}=await jwtVerify(token,keys,{issuer:'https://securetoken.google.com/'+env.FIREBASE_PROJECT_ID,audience:env.FIREBASE_PROJECT_ID});if(payload.email_verified!==true)throw Error('Электрондық пошта расталуы керек.');const role=payload.role||(payload.admin===true?'superadmin':'');if(!roles.includes(role))throw Error('Әкімші рөлі берілмеген.');return {role};}

let oauthCache={token:'',expires:0};
async function serviceToken(env){
 if(oauthCache.token&&oauthCache.expires>Date.now()+60000)return oauthCache.token;
 if(!env.FIREBASE_SERVICE_ACCOUNT)throw Error('FIREBASE_SERVICE_ACCOUNT Secret орнатылмаған.');
 const jose=await import('jose'),sa=JSON.parse(env.FIREBASE_SERVICE_ACCOUNT),key=await jose.importPKCS8(sa.private_key,'RS256');
 const assertion=await new jose.SignJWT({scope:'https://www.googleapis.com/auth/identitytoolkit https://www.googleapis.com/auth/cloud-platform'})
 .setProtectedHeader({alg:'RS256',kid:sa.private_key_id,typ:'JWT'}).setIssuer(sa.client_email).setSubject(sa.client_email)
 .setAudience('https://oauth2.googleapis.com/token').setIssuedAt().setExpirationTime('1h').sign(key);
 const res=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion})});
 const data=await res.json();if(!res.ok)throw Error('Google қызметтік авторизациясы өтпеді.');oauthCache={token:data.access_token,expires:Date.now()+Number(data.expires_in||3600)*1000};return oauthCache.token;
}
async function adminApi(env,path,body){
 const res=await fetch('https://identitytoolkit.googleapis.com/v1/'+path,{method:'POST',headers:{Authorization:'Bearer '+await serviceToken(env),'Content-Type':'application/json'},body:JSON.stringify(body||{})});
 const data=await res.json().catch(()=>({}));if(!res.ok)throw Error(data.error?.message||'Firebase Admin API қатесі.');return data;
}
async function staffRoute(req,env,url){
 const {role}=await authenticate(req,env);if(role!=='superadmin')return json({error:'Қызметкерлерді тек бас әкімші басқара алады.'},403);
 if(req.method==='GET'&&url.pathname==='/staff/list'){
  let pageToken='',users=[];
  for(let i=0;i<10;i++){const q=new URLSearchParams({maxResults:'1000'});if(pageToken)q.set('nextPageToken',pageToken);
   const res=await fetch('https://identitytoolkit.googleapis.com/v1/projects/'+env.FIREBASE_PROJECT_ID+'/accounts:batchGet?'+q,{headers:{Authorization:'Bearer '+await serviceToken(env)}});
   const data=await res.json();if(!res.ok)throw Error('Қызметкерлер тізімін алу мүмкін болмады.');users.push(...(data.users||[]));pageToken=data.nextPageToken||'';if(!pageToken)break;}
  const staff=users.map(u=>{let x={};try{x=JSON.parse(u.customAttributes||'{}')}catch{};const r=x.role||(x.admin===true?'superadmin':'');return r?{uid:u.localId,email:u.email||'',role:r,emailVerified:!!u.emailVerified}:null}).filter(Boolean);
  return json({staff},200);
 }
 const body=await req.json();
 if(req.method==='POST'&&url.pathname==='/staff/invite'){
  const email=String(body.email||'').trim().toLowerCase(),newRole=String(body.role||'');
  if(!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)||!['editor','archivist','viewer'].includes(newRole))return json({error:'Email немесе рөл дұрыс емес.'},400);
  if(!env.FIREBASE_WEB_API_KEY)throw Error('FIREBASE_WEB_API_KEY айнымалысын қосу қажет.');
  const temp=crypto.randomUUID()+'Aa1!',apiKey=env.FIREBASE_WEB_API_KEY;
  const created=await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signUp?key='+apiKey,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password:temp,returnSecureToken:true})});
  const user=await created.json();if(!created.ok)throw Error(user.error?.message==='EMAIL_EXISTS'?'Бұл email бұрын тіркелген. Тізімнен рөлін өзгертіңіз.':'Аккаунт ашылмады: '+(user.error?.message||'қате'));
  await adminApi(env,'accounts:update',{localId:user.localId,customAttributes:JSON.stringify({role:newRole})});
  for(const requestType of ['VERIFY_EMAIL','PASSWORD_RESET']){
   const payload=requestType==='VERIFY_EMAIL'?{requestType,idToken:user.idToken}:{requestType,email};
   const sent=await fetch('https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key='+apiKey,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
   if(!sent.ok)throw Error('Шақыру хатын жіберу мүмкін болмады. Firebase Auth email баптауын тексеріңіз.');
  }
  return json({success:true,message:'Растау және құпиясөз орнату хаттары жіберілді.'},200);
 }
 if(req.method==='POST'&&url.pathname==='/staff/role'){
  const uid=String(body.uid||''),newRole=String(body.role||'');if(!uid||!['superadmin','editor','archivist','viewer'].includes(newRole))return json({error:'Пайдаланушы немесе рөл дұрыс емес.'},400);
  const found=await adminApi(env,'accounts:lookup',{localId:[uid]}),target=found.users?.[0];if(!target)throw Error('Қызметкер табылмады.');
  if(target.localId===env.SUPERADMIN_UID&&newRole!=='superadmin')return json({error:'Негізгі бас әкімшінің рөлін өзгертуге болмайды.'},403);
  let claims={};try{claims=JSON.parse(target.customAttributes||'{}')}catch{};delete claims.admin;claims.role=newRole;if(newRole==='superadmin')claims.admin=true;
  await adminApi(env,'accounts:update',{localId:uid,customAttributes:JSON.stringify(claims)});return json({success:true,message:'Қызметкер рөлі жаңартылды.'},200);
 }
 if(req.method==='POST'&&url.pathname==='/staff/remove'){
  const uid=String(body.uid||'');if(!uid)return json({error:'Қызметкер таңдалмады.'},400);
  const found=await adminApi(env,'accounts:lookup',{localId:[uid]}),target=found.users?.[0];if(!target)throw Error('Қызметкер табылмады.');
  if(target.localId===env.SUPERADMIN_UID)return json({error:'Негізгі бас әкімшіні алып тастауға болмайды.'},403);
  let claims={};try{claims=JSON.parse(target.customAttributes||'{}')}catch{};delete claims.role;delete claims.admin;
  await adminApi(env,'accounts:update',{localId:uid,customAttributes:JSON.stringify(claims)});return json({success:true,message:'Қызметкердің қолжетімділігі алынды.'},200);
 }
 return null;
}
\nfunction canUpload(role,category){return role==='superadmin'||(role==='archivist'&&['archive','history'].includes(category))||(role==='editor'&&category==='article');}
function canDelete(role,key){return role==='superadmin'||(role==='archivist'&&(key.startsWith('archive/')||key.startsWith('history/')||key.startsWith('issues/')))||(role==='editor'&&key.startsWith('articles/'));}
export default {async fetch(req,env){const origin=req.headers.get('Origin')||'',h=cors(origin,env),url=new URL(req.url);if(req.method==='OPTIONS')return new Response(null,{status:204,headers:h});try{if(url.pathname.startsWith('/staff/')){const staffResponse=await staffRoute(req,env,url);if(staffResponse)return new Response(staffResponse.body,{status:staffResponse.status,headers:{...Object.fromEntries(staffResponse.headers),...h}});}if(req.method==='GET'&&url.pathname.startsWith('/files/')){const key=decodeURIComponent(url.pathname.slice(7));if(!key||key.includes('..'))return json({error:'Файл табылмады.'},404,h);const obj=await env.NEWSPAPER_BUCKET.get(key);if(!obj)return json({error:'Файл табылмады.'},404,h);const headers=new Headers(h);obj.writeHttpMetadata(headers);headers.set('etag',obj.httpEtag);headers.set('Cache-Control','public, max-age=3600');headers.set('Content-Disposition','inline');return new Response(obj.body,{headers});}if(req.method==='POST'&&url.pathname==='/ask'){const body=await req.json();const question=String(body.question||'').trim().slice(0,500);const context=String(body.context||'').slice(0,14000);if(!question||!context)return json({error:'Сұрақ пен газет мәтінін жіберіңіз.'},400,h);if(!env.AI)return json({error:'Workers AI қосылмаған. Worker-ді қайта жариялау қажет.'},503,h);const result=await env.AI.run('@cf/meta/llama-3.1-8b-instruct',{messages:[{role:'system',content:'Сен «Торғай тынысы» газетінің тарихи мұрағаты бойынша көмекшісің. Тек берілген газет үзінділеріне сүйеніп жауап бер. Ақпарат мәтінде болмаса, оны нақты айт. Дереккөз ретінде газет нөмірі мен бетін көрсет. Қазақ тілінде жауап бер.'},{role:'user',content:'Сұрақ: '+question+'\\n\\nГазет мұрағатынан табылған үзінділер:\\n'+context}],max_tokens:700,temperature:0.2});return json({answer:result.response||'Жауап жасалмады.'},200,h);}if(req.method==='POST'&&url.pathname==='/upload'){const {role}=await authenticate(req,env);const form=await req.formData(),file=form.get('file'),category=String(form.get('category')||'archive');if(!canUpload(role,category))return json({error:'Бұл бөлімге файл жүктеуге рұқсатыңыз жоқ.'},403,h);if(!(file instanceof File))return json({error:'Файл жіберілмеді.'},400,h);if(!['application/pdf','image/jpeg','image/png','image/webp'].includes(file.type))return json({error:'PDF немесе сурет файлын таңдаңыз.'},415,h);if(file.size>50*1024*1024)return json({error:'Файл 50 МБ-тан аспауы керек.'},413,h);if(category==='archive'&&file.type!=='application/pdf')return json({error:'Мұрағатқа тек PDF жүктеледі.'},415,h);if(category!=='archive'&&file.type==='application/pdf')return json({error:'Бұл бөлімге сурет файлын таңдаңыз.'},415,h);const name=String(file.name||'file').replace(/[^a-zA-Z0-9._-]/g,'-').slice(-90),prefix={archive:'archive',history:'history',article:'articles',site:'site'}[category],key=prefix+'/'+crypto.randomUUID()+'/'+name;await env.NEWSPAPER_BUCKET.put(key,file.stream(),{httpMetadata:{contentType:file.type,cacheControl:'public, max-age=3600'}});return json({key,url:url.origin+'/files/'+encodeURIComponent(key)},200,h);}if(req.method==='POST'&&url.pathname==='/delete'){const {role}=await authenticate(req,env);const body=await req.json(),list=Array.isArray(body.keys)?body.keys:[];if(!list.length||list.length>4||list.some(k=>typeof k!=='string'||k.includes('..')||!canDelete(role,k)))return json({error:'Бұл файлдарды өшіруге рұқсатыңыз жоқ немесе файл кілті дұрыс емес.'},403,h);await Promise.all(list.map(k=>env.NEWSPAPER_BUCKET.delete(k)));return json({success:true},200,h);}return json({error:'Маршрут табылмады.'},404,h);}catch(e){return json({error:e.message||'Сервер қатесі.'},403,h);}}};
