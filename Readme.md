Вместе

Хранение данных: сервер использует SQLite (Node.js 22.13+). При первом запуске
`server/db/db.json` переносится в SQLite без изменения исходного файла.
Локально база создаётся в `server/db/events.sqlite`. На Amvera `server/start.js`
использует постоянный том `/data/events.sqlite`. При другом хостинге задайте
`DB_PATH` как абсолютный путь на постоянном томе. Для переноса JSON из другого
места задайте `LEGACY_DB_PATH`. SQLite-файлы и старый JSON исключены из Git.
Фотографии загружаются на сервер в папку `uploads` рядом с SQLite-файлом.
На Amvera это `/data/uploads` на том же постоянном томе; для отдельного пути задайте
`UPLOAD_DIR`. Без постоянного тома файлы пропадут после перезапуска контейнера.
Для политики и соглашения до публикации заполните данные оператора и контакт
в `src/components/LegalDocument.jsx` (документы открываются внутри профиля).
Мини-приложение для поиска и создания событий рядом. Работает как MAX Mini App и в обычном браузере.

https://img.shields.io/badge/MAX-Mini%20App-0077FF?style=flat-square
https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react
https://img.shields.io/badge/Vite-5.4-646CFF?style=flat-square&logo=vite
https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=node.js

📖 О проекте
Вместе — сервис для поиска интересных событий рядом, создания собственных встреч и сбора компании по интересам. Приложение помогает организовать досуг: спорт, настолки, культура, кино, прогулки, музыка.

Проект реализован как MAX Mini App с полноценной интеграцией MAX Bridge и ботом, при этом работает и в обычном браузере.

Что умеет приложение
Для пользователя:

Лента событий с фото, категориями, датой, расстоянием и количеством участников

Карта событий с кастомными маркерами по категориям и кластеризацией

Поиск по 5 000+ населённых пунктов России (города, ПГТ, крупные сёла)

Детальная карточка события с галереей, отзывами и похожими событиями

Присоединение к событию и отказ от участия

Избранное (лайки) с сохранением в localStorage

Отзывы с рейтингом (звёзды + текст)

Профиль организатора со статистикой

Тёмная тема

Фильтры: время, расстояние, категории, формат (онлайн/офлайн), цена, Пушкинская карта

Сортировка: ближайшие, популярные, новые

Для организатора:

Создание и редактирование событий

Загрузка до 5 фото

Указание точки на карте — город определяется автоматически по координатам

Ограничение на количество участников

Удаление своих событий с подтверждением

Для MAX:

MAX Bridge (haptic feedback, шаринг, deep-links)

Бот с командами /start, /my, /help

Deep-links на конкретное событие

Уведомления организатору о новых участниках

Напоминания за час до события

🚀 Быстрый старт
Требования
Node.js ≥ 20.19 (для бота)

npm ≥ 8

Frontend
bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production-сборка в dist/
npm run preview    # предпросмотр сборки
Backend
bash
cd server
npm install
npm start          # http://localhost:3001
npm run dev        # с автоперезапуском
Переменные окружения
Frontend (.env в корне):

env
VITE_USE_MOCK=true                       # true — моки; в production по умолчанию реальный API
VITE_API_URL=http://localhost:3001       # URL backend-сервера
Backend (server/.env):

env
PORT=3001
BOT_TOKEN=<токен бота от @MasterBot>
WEB_APP_URL=https://your-app.vercel.app
DADATA_TOKEN=<токен DaData для геокодинга>   # опционально
🏗️ Архитектура
Стек
Frontend:

React 18.3 + Vite 5.4

Leaflet 1.9 + react-leaflet 4.2 + react-leaflet-cluster 2.1

CSS без препроцессоров

JSON-данные: 5 111 населённых пунктов России (~0.6 МБ)

Backend:

Express 4

@maxhub/max-bot-api 0.3

Multer (загрузка фото)

In-memory БД с персистентностью в db.json

DaData + Nominatim (обратный геокодинг, опционально)

Деплой:

Frontend — Vercel

Bot / API — любой Node.js-хостинг

Структура проекта
text
neutralname/
├── src/
│   ├── api/
│   │   └── events.js                 # API-клиент (mock + real)
│   ├── components/                   # React-компоненты
│   ├── data/
│   │   ├── russianCities.json        # 5 111 населённых пунктов
│   │   ├── ruRegions.js              # Коды регионов → названия
│   │   └── mockEvents.js             # Моковые события
│   └── utils/                        # Утилиты
│
├── server/
│   ├── bot.js                        # MAX-бот
│   ├── index.js                      # Express-сервер
│   ├── db/                           # БД и сидинг
│   ├── routes/                       # API-роуты
│   └── utils/                        # Общие утилиты
│
├── scripts/
│   └── build-cities.mjs              # Генерация JSON из GeoNames
│
├── index.html
├── package.json
├── vite.config.js
├── vercel.json
└── README.md
📂 Что находится в каждом файле
Frontend
Файл	Назначение
src/App.jsx	Главный компонент. Управляет глобальным состоянием: выбранный город, события, лайки, избранное, фильтры, тема, модалки
src/main.jsx	Точка входа React
src/components/CityPickerModal.jsx	Модалка поиска города по 5 000+ населённым пунктам с debounce 120 мс
src/components/CreateEventForm.jsx	Форма создания/редактирования события: валидация, загрузка фото, выбор точки на карте с автоматическим определением города
src/components/EventCard.jsx	Карточка события в ленте: фото, категория, мета, кнопка «Присоединиться»
src/components/EventDetailModal.jsx	Детальная модалка: галерея, отзывы, организатор, карта места, похожие события
src/components/EventFeed.jsx	Лента событий с сортировкой и пустым состоянием
src/components/EventMap.jsx	Карта событий с кастомными маркерами по категориям и кластеризацией
src/components/EventLocationMap.jsx	Мини-карта места события на детальной странице
src/components/EventOwnerMenu.jsx	Меню организатора («Редактировать», «Удалить»)
src/components/EventSkeleton.jsx	Скелетон загрузки карточки события
src/components/FiltersModal.jsx	Модалка фильтров: время, расстояние, категории, формат, цена, Пушкинская карта
src/components/MyEvents.jsx	Вкладки «Участвую» / «Организую»
src/components/OrganizerProfileModal.jsx	Профиль организатора со статистикой и списком событий
src/components/Profile.jsx	Профиль пользователя, настройки, тёмная тема
src/components/Reviews.jsx	Отзывы к событию: список, средний рейтинг, форма
src/components/SearchBar.jsx	Поисковая строка с кнопкой фильтров и бейджем активных фильтров
src/components/DesktopSidebar.jsx	Боковое меню для ПК
src/components/Icon.jsx	Набор SVG-иконок (главный источник иконок)
src/components/DeleteEventDialog.jsx	Диалог подтверждения удаления события
src/utils/citySearch.js	Поиск по 5 000+ городов + findNearestCity для определения города по координатам
src/utils/cityStorage.js	Сохранение выбранного города в localStorage
src/utils/distance.js	Haversine, форматирование расстояния, eventBelongsToCity
src/utils/eventOwnership.js	Проверка, что событие принадлежит пользователю
src/utils/maxBridge.js	Обёртка над MAX WebApp API: haptic, share, deep-links, alert
src/utils/storage.js	localStorage: лайки, участие, тема, сортировка, уведомления
src/utils/moderationShared.js	Правила модерации контента (используется и фронтом, и сервером)
src/utils/contentModeration.js	Реэкспорт правил модерации
src/data/russianCities.json	5 111 населённых пунктов России с координатами, населением, типом, регионом
src/data/ruRegions.js	Карта кодов регионов GeoNames → человекочитаемые названия
src/data/mockEvents.js	Моковые события для локальной разработки
src/api/events.js	API-клиент: переключатель mock/real, все запросы к событиям и отзывам
Backend
Файл	Назначение
server/index.js	Express-сервер: CORS, статика, роуты, health-check, запуск бота
server/bot.js	MAX-бот: команды /start, /my, /help, callback-кнопки, напоминания
server/db/database.js	In-memory БД + персистентность в db.json
server/db/seedEvents.js	Начальные события для сидинга при первом запуске
server/db/db.json	Файл персистентности (генерируется автоматически)
server/routes/events.js	CRUD событий и отзывов, join/leave, модерация
server/routes/cities.js	Геокодинг через DaData + Nominatim (search и reverse)
server/routes/moderation.js	Проверка контента
server/routes/reports.js	Жалобы на события
server/routes/upload.js	Загрузка фото (Multer, до 5 файлов, 5 МБ, JPG/PNG/WEBP/GIF)
server/utils/moderation.js	Реэкспорт правил модерации
Инфраструктура
Файл	Назначение
scripts/build-cities.mjs	Генерация russianCities.json из RU.txt (GeoNames)
vite.config.js	Конфигурация Vite
vercel.json	Rewrites для SPA-роутинга на Vercel
package.json	Зависимости и скрипты frontend
server/package.json	Зависимости и скрипты backend
🌍 Поиск городов — ключевая фича
Данные
5 111 населённых пунктов России: 1 столица, 1 835 городов, 2 069 ПГТ, 1 206 крупных сёл

0.61 МБ JSON — грузится мгновенно, работает офлайн

Только кириллица — все названия на русском

Источник — GeoNames (CC BY 4.0), сгенерировано через scripts/build-cities.mjs

Как работает
Индексы по 1-й и 2-й буквам — из 5 000 записей поиск сужается до пула 200–300 за миллисекунды.

Скоринг релевантности:

точное совпадение — 10 000 очков

префикс — 5 000 очков

вхождение — 1 000 очков

бонус за население — log10(population) × 100

бонус за тип: столица +500, город +200, ПГТ +50

Debounce 120 мс — поиск не дёргается на каждое нажатие.

Исправление исторических названий — GeoNames отдаёт «Казан», «Сталинск», «Горький»; словарь NAME_FIXES подменяет их на актуальные.

findNearestCity(lat, lng, maxKm) — определение ближайшего города к точке за ~1 мс через bounding box + haversine.

Пример работы
Ввод	Результат
н	Находка, Нальчик, Набережные Челны...
ново	Новосибирск, Новокузнецк, Новороссийск...
новокуз	Новокузнецк
каз	Казань, Казанка, Приказанский...
🗺️ Работа с картой
Карта событий (EventMap.jsx)
Центрируется на выбранном городе (координаты из selectedCity)

Кастомные маркеры по категориям: настолки — синие, спорт — зелёные, культура — розовые, кино — оранжевые, музыка — фиолетовые

Кластеризация через react-leaflet-cluster

Превью-карточка активного события снизу

Кнопка «Моё местоположение»

Карта в форме создания (CreateEventForm.jsx)
Клик по карте → пикер → findNearestCity определяет ближайший город (радиус 100 км)

Подсказка под картой: «Определён город: Новокузнецк, Кемеровская область»

Поля city и district обновляются автоматически

Работает без внешних API

Карта места (EventLocationMap.jsx)
Мини-карта с точкой на детальной странице

Ссылка «Открыть в картах» → OpenStreetMap

🛡️ Модерация контента
Единый источник правил — moderationShared.js, используется и на фронте, и на сервере.

Проверяется:

Запрещённые слова — насилие, экстремизм, мошенничество, 18+, опасные активности (~40 слов)

Подозрительные паттерны — обфускация (у6ийство, уб!йство), английские эквиваленты (kill, murder, drug)

CAPS LOCK — >70% заглавных букв при длине >15 символов

Спам — 6+ одинаковых символов подряд

Опасные адреса — «у подъезда», «во дворе дома», «около школы №...», детские сады с номером

Небезопасные URL — javascript:, data:, vbscript:

Проверяется: название, описание, адрес.

🤖 MAX-бот
Команды:

/start — приветствие + кнопка открытия Mini App

/my — кнопка «Открыть мои события»

/help — справка

Возможности:

Открытие Mini App с deep-link (start_param=event_123)

Приём callback-кнопок (запись на событие)

Уведомления организатору о новом участнике

Напоминания за час до события

📡 API-сервер
Эндпоинты
События:

text
GET    /api/events?city=&category=&price=
GET    /api/events/joined?userId=
GET    /api/events/:id
POST   /api/events
PUT    /api/events/:id
DELETE /api/events/:id?userId=
POST   /api/events/:id/join
POST   /api/events/:id/leave
Отзывы:

text
GET  /api/events/:id/reviews
POST /api/events/:id/reviews
Города:

text
GET /api/cities/search?q=
GET /api/cities/reverse?lat=&lng=
Загрузка:

text
POST /api/upload          # multipart, до 5 фото, 5 МБ, JPG/PNG/WEBP/GIF
GET  /api/upload/list     # список загруженных (для отладки)
Модерация и жалобы:

text
POST /api/moderation/check
POST /api/reports
Health-check:

text
GET /health
🗄️ Хранилище
Серверное (server/db/database.js)
In-memory: events, reports, reviews, joinedUsers, reminders

Персистентность в db.json — сохраняется при каждом изменении

Автоматический сидинг при первом запуске из seedEvents.js

Клиентское (src/utils/storage.js)
joined — ID событий, где участвую

liked — избранное

notifications — тумблер уведомлений

sort — выбранная сортировка

theme — light / dark

city — выбранный город (в cityStorage.js)

🎨 UI/UX
Адаптивность
Мобильный — основная среда (MAX Mini App)

Планшет (768+) — контент центрируется, 2 колонки

ПК (1200+) — сайдбар, 3 колонки

Широкий (1600+) — 4 колонки

Тёмная тема
Полное покрытие всех компонентов. Переключатель в профиле, значение сохраняется в localStorage. CSS-переменные + data-theme="dark" на <body>.

Доступность
Все иконки — SVG с aria-hidden

Кнопки с aria-label

Модалки с role, aria-labelledby, aria-describedby

Тосты через aria-live="polite"

🛠️ Генерация данных городов
Если нужно пересобрать russianCities.json:

bash
# 1. Скачать RU.zip с https://download.geonames.org/export/dump/RU.zip
# 2. Распаковать в scripts/RU.txt
# 3. Запустить
node scripts/build-cities.mjs
Скрипт:

Фильтрует только населённые пункты России (feature class = P)

Оставляет только объекты с населением ≥ 500 человек

Отбрасывает мусорные названия (СНТ, ДНП, «им. Ленина», «2-е отделение»)

Оставляет только кириллицу

Дедуплицирует по имени + координатам

Сохраняет результат в src/data/russianCities.json

Результат: 5 111 объектов, 0.61 МБ.

📦 Зависимости
Frontend:

json
{
  "dependencies": {
    "leaflet": "^1.9.4",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-leaflet": "^4.2.1",
    "react-leaflet-cluster": "^2.1.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "vite": "^5.4.1"
  }
}
Backend:

json
{
  "dependencies": {
    "@maxhub/max-bot-api": "^0.3.1",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "multer": "^2.4.0",
    "node-fetch": "^3.3.2"
  }
}
✅ Реализовано
Функциональность
☑ Лента событий с фильтрами и сортировкой
☑ Карта событий с кластеризацией и кастомными маркерами
☑ Детальная карточка события с галереей
☑ Создание и редактирование события
☑ Присоединение и отказ от участия
☑ Отзывы с рейтингом
☑ Профиль организатора
☑ Мои события (участвую / организую)
☑ Избранное (лайки)
☑ Фильтры (время, расстояние, категория, формат, цена, Пушкинская карта)
☑ Сортировка (ближайшие / популярные / новые)
☑ Поиск по 5 000+ городов, ПГТ и сёл
☑ Определение города по клику на карте
☑ Тёмная тема
☑ Модерация контента
☑ Загрузка фото (до 5 штук)
☑ Жалобы на события
☑ Валидация адреса (запрет на жилые дома)
☑ Тёмная тема с сохранением
☑ Скелетоны загрузки
☑ Тосты с автоскрытием
☑ Debounce поиска
☑ Дедупликация запросов
Интеграции
☑ MAX Bridge (haptic, share, deep-links)
☑ MAX-бот с командами
☑ DaData (геокодинг, опционально)
☑ Nominatim (обратный геокодинг)
☑ OpenStreetMap (карты)
Технические
☑ Адаптив под мобильные / планшеты / ПК
☑ Офлайн-поиск городов
☑ Обработка ошибок с fallback
☑ Работа без сервера (mock-режим)
🎯 Особенности реализации
1. Определение города по координатам без API
Клик по карте → findNearestCity(lat, lng) перебирает 5 000 городов за ~1 мс через bounding box + haversine. Никаких сетевых запросов, никаких лимитов Nominatim.

2. Единый источник правил модерации
moderationShared.js импортируется и фронтом, и сервером. Правила нельзя рассинхронизировать.

3. Исправление исторических названий
GeoNames отдаёт «Казан», «Сталинск», «Горький». Словарь NAME_FIXES в citySearch.js подменяет их на актуальные до построения индексов.

4. Офлайн-поиск
Все 5 000 городов в JSON-е бандла. Приложение работает без интернета для поиска — только карта требует сети.

5. Условный рендер приветствия
{user && <p className="greeting">...</p>} — приветствие только для авторизованных через MAX Bridge.

🚢 Деплой
Frontend на Vercel
Подключите репозиторий к Vercel.

Установите переменные окружения:

VITE_USE_MOCK=false

VITE_API_URL=https://your-backend.com

Vercel автоматически соберёт проект (npm run build).

vercel.json уже содержит rewrites для SPA-роутинга.

Backend
bash
cd server
npm install
npm start
Требуется Node.js ≥ 20.19 для @maxhub/max-bot-api.

📝 Лицензии и источники
Карты — © OpenStreetMap contributors (ODbL)

Данные городов — GeoNames (CC BY 4.0)

Иконки — собственные SVG

Обработка данных — 152-ФЗ

Код — MIT

👥 Команда
нейтральное название — хакатон MAX 2026.

📞 Контакты
Бот в MAX: @t184_hakaton_bot

Демо: webtomax.vercel.app

<p align="center">Сделано с ❤️ командой нейтральное название</p>