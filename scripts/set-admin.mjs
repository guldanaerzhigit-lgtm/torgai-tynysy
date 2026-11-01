import {applicationDefault,initializeApp} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';

const email=process.argv[2];
const requestedRole=process.argv[3]||'superadmin';
const allowedRoles=['superadmin','editor','archivist','viewer','remove'];
if(!email||!allowedRoles.includes(requestedRole)){
 console.error('Қолдану: node scripts/set-admin.mjs email@example.com superadmin|editor|archivist|viewer|remove');
 process.exit(1);
}
initializeApp({credential:applicationDefault()});
const auth=getAuth();
const user=await auth.getUserByEmail(email);
if(!user.emailVerified){
 console.error('Алдымен Firebase Auth аккаунтындағы электрондық поштаны растаңыз.');
 process.exit(1);
}
const claims={...(user.customClaims||{})};
delete claims.admin;
delete claims.role;
if(requestedRole==='superadmin'){
 claims.admin=true;
 claims.role='superadmin';
}else if(requestedRole!=='remove'){
 claims.role=requestedRole;
}
await auth.setCustomUserClaims(user.uid,claims);
console.log(requestedRole==='remove'?'Рөл алынды: '+email:'Рөл берілді: '+email+' → '+requestedRole);
console.log('Пайдаланушы аккаунттан шығып, қайта кіруі керек.');
