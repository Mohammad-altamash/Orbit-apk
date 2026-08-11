# ORBIT — Flat Structure (GitHub mobile upload safe)

Yeh version me SAARI files ek hi folder mein hain — koi src/, app/, components/ subfolder nahi.
Isliye GitHub mobile web "Add file → Upload files" se seedha upload ho jayega, kuch bhi break nahi hoga.

## GitHub par kaise replace karo (phone se)

1. Apne repo ke root mein jao (github.com pe browser se, app se nahi)
2. Purani saari files select karo aur DELETE kar do — including:
   - `orbit.zip` (agar wahan pada hai)
   - `manifest.webmanifest.txt` (galat naam wali)
   - koi bhi subfolder jo bana ho
3. "Add file" → "Upload files" → is folder ki SAARI files ek saath select karke upload karo
4. Commit message likho "flat structure fix" → Commit directly to main

Vercel automatically naya build trigger karega.

## Files list (34 files, sab root me)
- `index.html`, `main.tsx`, `App.tsx`, `index.css`
- `package.json`, `vite.config.ts`, `tailwind.config.js`, `postcss.config.js`, `tsconfig.json`
- `manifest.webmanifest` (sahi naam, .txt nahi)
- Baaki sab `.tsx`/`.ts` files — screens aur components, sab flat

## Zaroori: .env variables Vercel par set karo
Vercel Dashboard → Project → Settings → Environment Variables:
- `VITE_SUPABASE_URL` = tumhara Supabase project URL
- `VITE_SUPABASE_ANON_KEY` = tumhara Supabase anon key

Yeh set kiye bina app build to ho jayega lekin login/database kaam nahi karega.
