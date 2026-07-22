ARG PUBLIC_PATH=/
FROM node:24-alpine AS builder
ARG PUBLIC_PATH
WORKDIR /app

RUN apk add --no-cache --virtual .gyp \
        g++ make py3-pip

COPY package.json package-lock.json ./
COPY src-electron/package.json src-electron/package-lock.json ./src-electron/
RUN npm ci --ignore-scripts
RUN npm ci --prefix src-electron --ignore-scripts

COPY . .

RUN npm run postinstall
RUN npm run build

FROM caddy:2-alpine
ARG PUBLIC_PATH
WORKDIR /srv
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
COPY --from=builder /app/dist/spa/ .${PUBLIC_PATH}

EXPOSE 80
CMD ["/entrypoint.sh"]
