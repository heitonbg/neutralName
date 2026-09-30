# syntax=docker/dockerfile:1

# ---------- Build React/Vite frontend ----------
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY index.html vite.config.js ./
COPY src ./src
COPY public ./public

# Browser requests go through nginx to the backend container.
ARG VITE_API_URL=/backend
ARG VITE_USE_MOCK=false
ARG VITE_BOT_USERNAME=t280_hakaton_max_bot
ARG VITE_LOCAL_TEST_USER=false
ARG VITE_LOCAL_USER_ID=local-reviewer
ARG VITE_LOCAL_USER_NAME=Проверяющий
ARG VITE_LOCAL_USER_CITY=Казань
ENV VITE_API_URL=${VITE_API_URL} \
    VITE_USE_MOCK=${VITE_USE_MOCK} \
    VITE_BOT_USERNAME=${VITE_BOT_USERNAME} \
    VITE_LOCAL_TEST_USER=${VITE_LOCAL_TEST_USER} \
    VITE_LOCAL_USER_ID=${VITE_LOCAL_USER_ID} \
    VITE_LOCAL_USER_NAME=${VITE_LOCAL_USER_NAME} \
    VITE_LOCAL_USER_CITY=${VITE_LOCAL_USER_CITY}

RUN npm run build

# ---------- Small production web server ----------
FROM nginx:1.27-alpine AS runtime
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
