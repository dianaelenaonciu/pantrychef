# PantryChef

**Nume Prenume:** ONCIU DIANA-ELENA
**Grupa:** 1147

**Link video prezentare:** _(de completat — YouTube, max 3 min, public nelistat)_
**Link publicare:** https://pantrychef-diana.vercel.app

---

## 1. Introducere

PantryChef este o aplicație web care îți ține evidența ingredientelor din cămară și îți propune rețete generate cu AI pe baza a ce ai în casă. Utilizatorul se autentifică cu GitHub, adaugă ingrediente cu cantități și unități, apoi cere generarea de sugestii de rețete pe care le poate salva și marca drept favorite.

Aplicația folosește **două servicii cloud externe**, expuse aplicației printr-un **API REST** propriu:

| Serviciu cloud | Rol |
| --- | --- |
| **MongoDB Atlas** | Stocare persistentă pentru utilizatori, ingrediente și rețete |
| **Google Gemini API** | Generare rețete pe baza ingredientelor (LLM cu structured JSON output) |

Stack tehnologic: Next.js 16 (App Router) + React 19 + Tailwind CSS v4, Mongoose pentru MongoDB, NextAuth v4 cu GitHub OAuth, `@google/generative-ai` pentru Gemini.

## 2. Descriere problemă

Persoanele care gătesc des acasă întâmpină recurent două probleme:

1. **Risipă alimentară** — ingrediente uitate în cămară expiră înainte de a fi folosite.
2. **Blocaj decizional** — „ce gătesc azi?" când ai în casă o combinație ciudată de produse.

Rețetele clasice presupun o listă de cumpărături predefinită. PantryChef inversează problema: pornește de la inventarul real al utilizatorului și generează 3 sugestii adaptate. Asta reduce risipa, elimină blocajul decizional prin sugestii instantanee și păstrează rețetele preferate într-un istoric reutilizabil.

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

## 5. Capturi ecran aplicație

_(de adăugat după deploy)_

- `/` — landing page
<img width="1701" height="814" alt="Screenshot 2026-05-08 at 12 50 10" src="https://github.com/user-attachments/assets/18d287e5-7588-4bb8-bc92-3dfd013dd5bc" />

- `/camara` — gestionare ingrediente
<img width="1701" height="844" alt="Screenshot 2026-05-08 at 12 53 04" src="https://github.com/user-attachments/assets/6d095cf7-dcd4-408c-b398-e2680dd9e496" />

- `/retete` — listă rețete + drafts generate
<img width="1701" height="844" alt="Screenshot 2026-05-08 at 12 53 18" src="https://github.com/user-attachments/assets/18b3af5e-3280-4e87-8c89-b59a50dc0e18" />

- `/retete/{id}` — detaliu rețetă cu pași și buton favorite
<img width="1701" height="951" alt="Screenshot 2026-05-08 at 12 54 18" src="https://github.com/user-attachments/assets/b04c58bf-ea42-40c9-b6b5-1b027cb0b5c8" />

## 6. Referințe

- [Next.js Documentation](https://nextjs.org/docs)
- [NextAuth.js v4](https://next-auth.js.org/)
- [Mongoose](https://mongoosejs.com/)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [Google Gemini API](https://ai.google.dev/gemini-api/docs)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vercel](https://vercel.com/)
