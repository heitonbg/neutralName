# Docker launch

## Requirements
- Docker Engine with Docker Compose v2

## Start
```bash
cp .env.example .env
# Optional: put BOT_TOKEN / AI_API_KEY / DADATA_TOKEN into .env

docker compose up --build
```

Open:
- Mini App: http://localhost:5173
- API health check: http://localhost:3001/health

Stop:
```bash
docker compose down
```

Stop and remove persisted SQLite/uploads:
```bash
docker compose down -v
```

## What runs
- `frontend`: React/Vite is built once, then served by nginx.
- `backend`: Node.js/Express API + SQLite + optional MAX bot/reminders.
- SQLite and uploaded files are persisted in the named volume `app-data`.

The frontend uses `/backend` as a same-origin proxy. nginx forwards it to `backend:3001`, so the browser does not need to know Docker service names and local CORS is avoided.

## Optional MAX bot
The API starts without `BOT_TOKEN`; bot status will be `disabled`. To test the real bot, set `BOT_TOKEN` and use a publicly reachable HTTPS `WEB_APP_URL` because a phone/MAX client cannot open your computer's `localhost`.
## Локальный пользователь вне MAX

При открытии `http://localhost:5173` в обычном браузере MAX Bridge не передаёт `initDataUnsafe.user`.
Чтобы локальная Docker-проверка не зависела от запуска через MAX, `compose.yaml` по умолчанию включает `VITE_LOCAL_TEST_USER=true` и создаёт тестовый профиль `local-reviewer`.

Это позволяет в локальном режиме:

- загрузить пустую/существующую ленту без вечного skeleton;
- создать событие;
- присоединяться к событиям;
- проверять «Мои события», друзей и профиль.

Для production/реального запуска внутри MAX установите:

```env
VITE_LOCAL_TEST_USER=false
```

Тогда пользователь снова берётся только из MAX Bridge. Бот для локального создания событий не требуется; `BOT_TOKEN` нужен только для самого бота и уведомлений.

