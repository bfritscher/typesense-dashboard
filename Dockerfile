ARG PUBLIC_PATH=/
FROM node:24-alpine AS builder
ARG PUBLIC_PATH
WORKDIR /app

RUN apk add --no-cache --virtual .gyp \
        g++ make py3-pip

RUN npm install -g @quasar/cli

COPY package.json package-lock.json ./
RUN npm install --ignore-scripts

COPY . .

RUN quasar prepare
RUN quasar build

FROM caddy:2-alpine
ARG PUBLIC_PATH
WORKDIR /srv
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
COPY --from=builder /app/dist/spa/ .${PUBLIC_PATH}

EXPOSE 80
CMD ["/entrypoint.sh"]
