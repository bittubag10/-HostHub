# HostHub Frontend — Setup Guide

Ye React (Vite) frontend tumhare **HostHub Spring Boot backend** ke liye bana hai — maine tumhari zip ke andar ke actual controllers, DTOs, security config, aur JWT claims padhkar hi ye banaya hai, taaki har API call exactly tumhare backend contract se match kare.

## Design
Theme: "boutique hotel key-card" — deep ink/pine background, brass gold accent, Fraunces (display serif) + Inter (body) + IBM Plex Mono (prices/dates). Signature element: bookings ek perforated **key-card / boarding-pass** style ticket mein dikhti hain (`KeyCard.jsx`), My Bookings aur Admin → Bookings dono jagah.

## Stack
React 18 + Vite + Tailwind CSS + React Router + Zustand (auth state) + Axios (JWT + auto-refresh interceptor).

---

## ⚠️ Backend mein 2 zaroori changes (inke bina frontend chalega hi nahi)

### 1. CORS enable karo
Tumhare backend mein **koi CORS config nahi tha** — browser hi request ko block kar dega. Maine ek file bana di hai:

`backend-patch/CorsConfig.java` — isko copy karke apne project mein daalo:
`src/main/java/com/example/HostHub/config/CorsConfig.java`

Ye `http://localhost:5173` (Vite ka default port) se aane wali requests allow karega, cookies ke saath (refresh-token flow ke liye zaroori hai).

### 2. `application.properties` mein `frontend.url` fix karo
Abhi ye set hai:
```properties
frontend.url=http://localhost:8080
```
Isse Stripe checkout ke baad user backend URL par redirect ho jaata (jahan koi frontend hai hi nahi). Isko frontend ke URL se replace karo:
```properties
frontend.url=http://localhost:5173
```
Ye backend ke `BookingServiceImpl` mein Stripe ko `frontendUrl + "/payments/success"` aur `/payments/failure"` bhejta hai — dono routes is frontend mein already bane hue hain.

> Optional but recommended: `BookingServiceImpl.initiatePayment()` mein success/failure URL ke saath `?bookingId=" + booking.getId()` append kar do, taaki payment ke baad frontend directly us booking ka status dikha sake. Abhi ke liye frontend generic success/failure message dikhata hai aur "My Bookings" par bhej deta hai (webhook se status automatically update ho jayega).

Restart backend after these two changes.

---

## Backend run karna

```bash
cd HostHub
# application.properties mein postgres db "hosthub-db" already configured hai — banale agar nahi hai
./mvnw spring-boot:run
```
Backend `http://localhost:8080` par chalega, context-path `/api/v1` ke saath (matlab full base URL: `http://localhost:8080/api/v1`).

Stripe webhook test karne ke liye (local mein) Stripe CLI use karo:
```bash
stripe listen --forward-to localhost:8080/api/v1/payments/webhook
```

---

## Frontend run karna

```bash
cd hosthub-frontend
npm install
cp .env.example .env       # already backend ka URL point kar raha hai
npm run dev
```
Browser mein kholo: `http://localhost:5173`

Production build ke liye: `npm run build` → `dist/` folder deploy kar sakte ho (Vercel/Netlify/Nginx).

---

## Test flow (end-to-end)

1. **Sign up** karo (`/signup`) — har naya user by default sirf `GUEST` role paata hai (yeh backend `AuthService.signUp()` mein hardcoded hai).
2. Ek hotel-manager account banane ke liye, DB mein manually role add karo (backend mein koi "become a host" API nahi hai):
   ```sql
   -- apna user id daalo
   INSERT INTO app_user_roles (user_id, roles) VALUES (1, 'HOTEL_MANAGER');
   ```
   (Table/column names Hibernate ki default naming se hain — agar match na ho to apni DB mein `\d app_user*` chala kar actual table dekh lena.)
3. Us manager account se login karke **Manager Console** (`/admin`) mein jaao → property add karo → uske rooms add karo → har room ki **Inventory** (date-wise availability + surge pricing) update karo.
4. Ab guest account se `/` par city + dates se search karo → hotel kholo → room book karo → guest details bharo → "Proceed to payment" pe Stripe checkout khulega (test mode — Stripe ke test card `4242 4242 4242 4242` use karo).
5. Payment ke baad `/payments/success` par redirect hoga, aur **My Bookings** mein booking ka status dikhega.

---

## Project structure
```
src/
  api/axios.js          → baseURL + JWT interceptor + auto refresh-on-401
  store/auth.js          → zustand store, JWT decode (roles/email/id)
  components/            → Navbar, KeyCard (signature), route guards, etc.
  pages/                  → Home/Search, HotelDetails, Booking flow, MyBookings, Profile
  pages/admin/            → Manager console: hotels, rooms, inventory, bookings, reports
```

## Notes / known backend quirks the frontend works around
- `GET /hotels/search` aur `/admin/hotels/{id}/reports` types ke controllers `@RequestBody` ke saath GET use karte hain — frontend axios se `{ data: payload }` bhejta hai jo isko handle kar leta hai.
- Access token sirf **10 minute** mein expire ho jaata hai — isliye axios interceptor automatically `/auth/refresh` call karke silently naya token le leta hai jab bhi 401 aaye, ya app load hone par.
- `HotelSearchRequest` mein end-date field ka naam `EndDate` (capital E) hai — frontend wahi exact key bhejta hai.
