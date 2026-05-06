# PantryChef

**Nume Prenume:** ONCIU DIANA-ELENA
**Grupa:** 1147

**Link video prezentare:** _(de completat — YouTube, max 3 min, public nelistat)_
**Link publicare:** _(de completat — ex. `https://pantrychef.vercel.app`)_

---

## 1. Introducere

PantryChef este o aplicație web care îți ține evidența ingredientelor din cămară și îți propune rețete posibile generate cu AI pe baza a ceea ce ai în casă. Utilizatorul își creează cont prin GitHub OAuth, adaugă ingrediente cu cantități și unități de măsură, apoi cere generarea de sugestii de rețete (titlu, descriere, ingrediente, pași, timp estimat, dificultate). Rețetele primite pot fi salvate în propria colecție și marcate ca favorite.

Aplicația folosește **două servicii cloud externe**, expuse aplicației printr-un **API REST** propriu:

| Serviciu cloud | Rol |
| --- | --- |
| **MongoDB Atlas** | Stocare persistentă pentru utilizatori, ingrediente cămară și rețete salvate |
| **Google Gemini API** | Generare rețete pe baza ingredientelor (LLM cu structured JSON output) |

Stack tehnologic: Next.js 16 (App Router) + React 19 + Tailwind CSS v4, Mongoose pentru MongoDB, NextAuth v4 cu GitHub OAuth, `@google/generative-ai` pentru Gemini.

## 2. Descriere problemă

Persoanele care gătesc des acasă întâmpină recurent două probleme:

1. **Risipă alimentară** — ingrediente uitate în cămară expiră înainte de a fi folosite.
2. **Blocaj decizional** — „ce gătesc azi?" când ai în casă o combinație ciudată de produse.

Rețetele clasice presupun o listă de cumpărături predefinită. PantryChef inversează problema: pornește de la inventarul real al utilizatorului și generează 3 sugestii adaptate. Asta:

- reduce risipa, încurajând consumul ingredientelor existente,
- elimină blocajul decizional prin sugestii instantanee,
- păstrează rețetele preferate într-un istoric reutilizabil (favorite).

## 3. Descriere API

API-ul REST e expus sub `/api/`. Toate endpoint-urile (cu excepția `/api/auth/*`) cer autentificare prin cookie de sesiune NextAuth.

### Autentificare

Autentificarea folosește **NextAuth v4** cu strategy JWT (sesiune semnată în cookie HTTP-only) și provider GitHub OAuth.

| Metodă | Endpoint | Descriere |
| --- | --- | --- |
| `GET` | `/api/auth/providers` | Listează provider-ii configurați |
| `GET` | `/api/auth/csrf` | Token CSRF pentru flow-ul de sign-in |
| `GET` | `/api/auth/session` | Returnează sesiunea curentă (sau `{}` dacă nu există) |
| `GET/POST` | `/api/auth/signin/github` | Pornește flow-ul OAuth GitHub |
| `GET` | `/api/auth/callback/github` | Callback OAuth (apelat de GitHub) |
| `POST` | `/api/auth/signout` | Sign-out |

La primul sign-in, utilizatorul e creat automat în colecția `users` (Mongoose model `User`) și legat de email-ul GitHub.

### Cămară (`PantryItem`)

| Metodă | Endpoint | Descriere | Cod succes |
| --- | --- | --- | --- |
| `GET` | `/api/pantry` | Listă ingrediente ale utilizatorului | `200` |
| `POST` | `/api/pantry` | Adaugă ingredient nou | `201` |
| `PATCH` | `/api/pantry/{id}` | Actualizează ingredient (orice combinație de `name`, `quantity`, `unit`) | `200` |
| `DELETE` | `/api/pantry/{id}` | Șterge ingredient după ID | `204` |

### Rețete (`Recipe`)

| Metodă | Endpoint | Descriere | Cod succes |
| --- | --- | --- | --- |
| `GET` | `/api/recipes` | Listă rețete salvate | `200` |
| `POST` | `/api/recipes` | Salvează o rețetă (de obicei un draft generat) | `201` |
| `GET` | `/api/recipes/{id}` | Detaliu rețetă | `200` |
| `PATCH` | `/api/recipes/{id}` | Toggle favorite | `200` |
| `DELETE` | `/api/recipes/{id}` | Șterge rețetă | `204` |
| `POST` | `/api/recipes/generate` | Generează 3 drafts via Gemini pe baza cămării (NU le salvează) | `200` |

### Coduri de eroare

| Cod | Când apare |
| --- | --- |
| `400` | Body invalid sau câmpuri lipsă (`code: "VALIDATION"`) |
| `401` | Lipsește sesiunea (`code: "UNAUTHORIZED"`) |
| `404` | Resursă inexistentă (`code: "NOT_FOUND"`) |
| `429` | Limită Gemini atinsă (`code: "QUOTA"`) |
| `502` | Eroare upstream Gemini (`code: "AUTH" \| "UPSTREAM" \| "PARSE" \| "NETWORK"`) |
| `500` | Eroare neașteptată (`code: "INTERNAL"`) |

Format body eroare: `{ "error": "mesaj prietenos", "code": "COD" }`.

## 4. Flux de date

### Autentificare și autorizare

- **Frontend → backend**: cookie HTTP-only `next-auth.session-token` setat după sign-in.
- **Backend → MongoDB Atlas**: connection string cu user/parolă în `MONGODB_URI`, conexiune persistentă cached între request-uri (Mongoose).
- **Backend → Google Gemini**: `Authorization: x-goog-api-key` (gestionat intern de SDK-ul `@google/generative-ai`), cheie în `GEMINI_API_KEY`.
- **Frontend → GitHub OAuth**: redirect prin `/api/auth/signin/github` → autorizare GitHub → callback `/api/auth/callback/github` → setare cookie sesiune.

### Exemple request / response

#### `POST /api/pantry`

Request:

```http
POST /api/pantry HTTP/1.1
Content-Type: application/json
Cookie: next-auth.session-token=<jwt>

{
  "name": "roșii",
  "quantity": 500,
  "unit": "g"
}
```

Response `201`:

```json
{
  "item": {
    "id": "65f8c1b3...",
    "name": "roșii",
    "quantity": 500,
    "unit": "g",
    "createdAt": "2026-05-05T17:30:00.000Z"
  }
}
```

Validare: `name` non-vid (max 80 caractere), `quantity > 0`, `unit ∈ {buc, g, kg, ml, l, lingură, linguriță, cană}`.

#### `GET /api/pantry`

Response `200`:

```json
{
  "items": [
    { "id": "65f8c1b3...", "name": "roșii", "quantity": 500, "unit": "g", "createdAt": "2026-05-05T17:30:00.000Z" },
    { "id": "65f8c1b4...", "name": "ceapă", "quantity": 2, "unit": "buc", "createdAt": "2026-05-05T17:31:00.000Z" }
  ]
}
```

#### `PATCH /api/pantry/{id}`

Request (oricare câmp e opțional, măcar unul obligatoriu):

```json
{ "quantity": 750, "unit": "g" }
```

Response `200`:

```json
{
  "item": {
    "id": "65f8c1b3...",
    "name": "roșii",
    "quantity": 750,
    "unit": "g",
    "createdAt": "2026-05-05T17:30:00.000Z"
  }
}
```

#### `DELETE /api/pantry/{id}`

Response: `204 No Content` (fără body).

#### `POST /api/recipes/generate`

Request: fără body — folosește ingredientele din cămara utilizatorului.

Response `200`:

```json
{
  "drafts": [
    {
      "title": "Salată grecească rapidă",
      "description": "Salată mediteraneană proaspătă, ideală pentru o cină ușoară.",
      "ingredients": [
        { "name": "roșii", "quantity": "300 g" },
        { "name": "ceapă", "quantity": "1/2 buc" }
      ],
      "steps": [
        "Spală și taie roșiile în cuburi.",
        "Toacă mărunt ceapa.",
        "Combină în bol și asezonează."
      ],
      "timeMinutes": 10,
      "difficulty": "ușor",
      "sourcePrompt": "500 g roșii, 2 buc ceapă"
    }
  ]
}
```

Drafts NU sunt salvate automat. Utilizatorul le salvează individual prin `POST /api/recipes`.

#### `POST /api/recipes`

Request:

```json
{
  "title": "Salată grecească rapidă",
  "description": "...",
  "ingredients": [{ "name": "roșii", "quantity": "300 g" }],
  "steps": ["Spală...", "Toacă..."],
  "timeMinutes": 10,
  "difficulty": "ușor",
  "sourcePrompt": "500 g roșii, 2 buc ceapă"
}
```

Response `201`:

```json
{
  "recipe": {
    "id": "65f8c200...",
    "title": "Salată grecească rapidă",
    "description": "...",
    "ingredients": [...],
    "steps": [...],
    "timeMinutes": 10,
    "difficulty": "ușor",
    "favorite": false,
    "createdAt": "2026-05-05T17:35:00.000Z",
    "sourcePrompt": "..."
  }
}
```

#### `PATCH /api/recipes/{id}`

Request:

```json
{ "favorite": true }
```

Response `200`:

```json
{ "id": "65f8c200...", "favorite": true }
```

### Diagramă flux principală (generare rețetă)

```
Utilizator                     Next.js App                MongoDB Atlas        Google Gemini
    │                               │                          │                    │
    │ click „Generează rețete"      │                          │                    │
    ├──────────────────────────────►│                          │                    │
    │                               │ verifică sesiune (JWT)   │                    │
    │                               │ citește cămara user-ului │                    │
    │                               ├─────────────────────────►│                    │
    │                               │◄─────────────────────────┤                    │
    │                               │ trimite prompt + schema  │                    │
    │                               ├─────────────────────────────────────────────►│
    │                               │              răspuns JSON structurat (3 rețete)│
    │                               │◄─────────────────────────────────────────────┤
    │ 3 drafts afișate              │                          │                    │
    │◄──────────────────────────────┤                          │                    │
    │ click „Salvează" pe un draft  │                          │                    │
    ├──────────────────────────────►│                          │                    │
    │                               │ persistă rețetă          │                    │
    │                               ├─────────────────────────►│                    │
    │ confirmare                    │                          │                    │
    │◄──────────────────────────────┤                          │                    │
```

## 5. Capturi ecran aplicație

_(de adăugat după deploy)_

- `/` — landing page
- `/camara` — gestionare ingrediente
- `/retete` — listă rețete + drafts generate
- `/retete/{id}` — detaliu rețetă cu pași și buton favorite

## 6. Referințe

- [Next.js Documentation](https://nextjs.org/docs) (App Router, Route Handlers, Server Actions)
- [NextAuth.js v4](https://next-auth.js.org/) — autentificare cu GitHub OAuth + JWT
- [Mongoose](https://mongoosejs.com/) — ODM pentru MongoDB
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) — DBaaS
- [Google Gemini API](https://ai.google.dev/gemini-api/docs) — `@google/generative-ai` SDK + structured output
- [Tailwind CSS v4](https://tailwindcss.com/) — utility-first CSS
- [Lucide Icons](https://lucide.dev/) — set de iconițe
- [Vercel Platform](https://vercel.com/) — deploy

---

## Setup local

```bash
git clone <repo-url>
cd pantrychef
npm install
cp .env.example .env.local
# completează variabilele (vezi .env.example)
npm run dev
```

App-ul rulează la `http://localhost:3000`.

### Cerințe pentru `.env.local`

| Variabilă | De unde |
| --- | --- |
| `MONGODB_URI` | MongoDB Atlas → Connect → Drivers |
| `GEMINI_API_KEY` | [aistudio.google.com](https://aistudio.google.com/) → Get API key |
| `GEMINI_MODEL` | Optional, default `gemini-2.5-flash` |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `http://localhost:3000` în dev, URL public în prod |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | GitHub → Settings → Developer settings → OAuth Apps |

În GitHub OAuth App, **Authorization callback URL** trebuie să fie `${NEXTAUTH_URL}/api/auth/callback/github`.

## Deploy pe Vercel

1. Push pe GitHub repository.
2. [vercel.com/new](https://vercel.com/new) → import repo-ul.
3. Adaugă toate variabilele de mediu din `.env.example` în Vercel → Settings → Environment Variables.
4. Setează `NEXTAUTH_URL` la URL-ul de producție (ex. `https://pantrychef.vercel.app`).
5. Update GitHub OAuth App: adaugă `https://<production>/api/auth/callback/github` la Authorization callback URLs.
6. Deploy. Build-ul rulează `next build` automat.

## Structură proiect

```
app/
  api/
    auth/[...nextauth]/route.js   NextAuth handler
    pantry/route.js                GET, POST
    pantry/[id]/route.js           PATCH, DELETE
    recipes/route.js               GET, POST
    recipes/[id]/route.js          GET, PATCH, DELETE
    recipes/generate/route.js      POST
  camara/                          UI cămară (server actions + client view)
  retete/                          UI rețete (lista + detaliu)
  layout.js, page.js               Layout root + landing
components/
  Navbar.js, Providers.js, SignInPrompt.js
lib/
  mongoose.js                      Conexiune Mongoose cached
  authOptions.js, auth.js          NextAuth + helpers
  gemini.js                        Wrapper Gemini cu structured output
  api.js                           Helper withUser pentru route handlers
  errors.js                        ValidationError, NotFoundError
  services/
    pantry.js                      Logică cămară (folosită de actions + REST)
    recipes.js                     Logică rețete
models/
  User.js, PantryItem.js, Recipe.js
```
