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
- Әр қызметкерге Firebase Authentication аккаунтын жасаңыз және email мекенжайын растатыңыз.
- Сенімді компьютерде Firebase Admin SDK credentials баптаңыз. Service account JSON файлын GitHub-қа жүктемеңіз.
- Рөл тағайындау: `node scripts/set-admin.mjs email@example.com superadmin`, немесе `editor`, `archivist`, `viewer`.
- Рөлді алып тастау: `node scripts/set-admin.mjs email@example.com remove`.
- Рөл өзгергеннен кейін пайдаланушы аккаунттан шығып, қайта кіруі керек.

### Рөлдер
- `superadmin` — толық қолжетімділік, сайт баптаулары және барлық бөлімдер.
- `editor` — жаңалықтар мен мақалаларды жариялау/өшіру.
- `archivist` — газет PDF-терін және тарихи фотосуреттерді жүктеу/өшіру.
- `viewer` — тек оқу статистикасын көру.

Custom Claims тек Firebase Admin SDK арқылы серверден беріледі. Клиент браузерінен рөл беруге болмайды.

## Cloudflare R2 Worker
1. `torgai-tynysy-files` атты R2 bucket жасаңыз.
2. `worker/wrangler.toml` ішіндегі Firebase project ID мен ALLOWED_ORIGINS мәндерін ауыстырыңыз.
3. `cd worker && npm install`
4. `npx wrangler deploy`
5. Worker URL-ін root `.env` ішіндегі `VITE_UPLOAD_API_URL` мәніне енгізіңіз және Pages environment variables ішіне де қосыңыз.

Worker Firebase ID token-ді тексеріп, файл түрі бойынша рөлді сервер жағында шектейді. Файлдар R2-де `archive/`, `history/`, `articles/`, `site/` қалталарына бөлінеді. Бұрынғы `issues/` файлдарын архив қызметкері және бас әкімші өшіре алады.

## Cloudflare Pages
Build command: `npm run build`
Build output: `dist`

## Қауіпсіздік
- `.env`, service-account JSON және құпия кілттерді GitHub-қа жүктемеңіз.
- Firestore рұқсаттары `firestore.rules` арқылы тексеріледі.
- Custom Claims тек сенімді Admin SDK ортасынан беріледі.
