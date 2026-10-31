# Торғай тынысы — электронды газет мұрағаты

## Стек
React + Vite, Firebase Authentication, Firestore және Cloudflare R2 Worker.

## Жергілікті іске қосу
1. `.env.example` файлын `.env` деп көшіріп, Firebase Web App мәндерін енгізіңіз.
2. `npm install`
3. `npm run dev`

## Firebase баптауы
- Firebase Console ішінде Authentication → Email/Password провайдерін қосыңыз.
- Firestore Database жасаңыз және `firestore.rules` ережелерін жариялаңыз.
- Редакторға арналған Firebase Auth аккаунтын жасаңыз.
- Серверде Firebase Admin SDK credentials баптап, `node scripts/set-admin.mjs editor@example.com` командасымен admin custom claim беріңіз.
- Әкімші аккаунты email-ін растаған болуы керек. Рөл берілгеннен кейін аккаунттан шығып, қайта кіріңіз.

## Cloudflare R2 Worker
1. `torgai-tynysy-files` атты R2 bucket жасаңыз.
2. `worker/wrangler.toml` ішіндегі Firebase project ID мен ALLOWED_ORIGINS мәндерін ауыстырыңыз.
3. `cd worker && npm install`
4. `npx wrangler secret put` қажет емес: Worker Firebase ID token-ді Google жария кілттерімен тексереді.
5. `npx wrangler deploy`
6. Worker URL-ін root `.env` ішіндегі `VITE_UPLOAD_API_URL` мәніне енгізіңіз және Pages environment variables ішіне де қосыңыз.

Worker-дің `/upload` және `/delete` маршруттары Firebase-тегі `admin: true` custom claim-ін талап етеді. PDF пен мұқаба R2-де сақталады, ал жария файлдар `/files/<key>` арқылы беріледі.

## Cloudflare Pages
Build command: `npm run build`
Build output: `dist`

## Қауіпсіздік
- `.env`, service-account JSON және құпия кілттерді GitHub-қа жүктемеңіз.
- Firebase custom claim тек сенімді Admin SDK ортасынан беріледі.
- Firestore public read, admin-only write ережелері қолданылады.
