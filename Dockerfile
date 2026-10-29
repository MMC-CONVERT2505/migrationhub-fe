# build stage
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
# Search-console verification tokens (public, optional): baked into the home page at build time.
ARG VITE_GSC_VERIFICATION=
ARG VITE_BING_VERIFICATION=
ENV VITE_GSC_VERIFICATION=${VITE_GSC_VERIFICATION} VITE_BING_VERIFICATION=${VITE_BING_VERIFICATION}

RUN npm run build

# production image — nginx serves the SPA and proxies /api to the backend
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY security-headers.conf /etc/nginx/security-headers.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
