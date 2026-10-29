# Taskly v2

Migración limpia del marketplace geolocalizado de Taskly: **Expo** + **Supabase JS**.

El stack anterior (Manus / Vite / tRPC / MySQL) se reemplazó. El saldo de Tasklys solo cambia en Postgres mediante RPC (`spend_taskly`, `cashout_taskly`), no desde el cliente.

## Arranque

1. Copia `.env.example` a `.env` y pon URL + anon key de Supabase.
2. En el SQL Editor de Supabase, ejecuta [`supabase/schema.sql`](supabase/schema.sql).
3. Instala y corre:

```bash
npm install
npx expo start
```

## Schema

- `profiles(id, username, lat, lng)`
- `wallets(user_id, balance)` — sin writes directos; RLS de lectura propia
- `services(id, owner_id, title, description, taskly_price, lat, lng, status)`
- `transactions(id, from_user, to_user, amount, type)`

## RPC

- `nearby_services(p_lat, p_lng, p_radius_km default 3)` — servicios publicados a ≤ 3 km (Haversine)
- `spend_taskly(p_to_user, p_amount)` — valida autenticación y saldo, bloquea wallets y transfiere
- `cashout_taskly(p_amount)` — descuenta el monto, registra 15% como `fee` y 85% como `cashout`

## App

La pantalla inicial (`src/app/index.tsx`) pide ubicación y usa `react-native-deck-swiper` sobre el resultado de `fetchNearbyServices()`.
