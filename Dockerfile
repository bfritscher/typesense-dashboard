ARG PUBLIC_PATH=/
FROM node:22-alpine AS builder
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

RUN apk del .gyp

FROM caddy:2-alpine
ARG PUBLIC_PATH
WORKDIR /srv

COPY --from=builder /app/dist/spa/ .${PUBLIC_PATH}

COPY generate-config.sh /usr/local/bin/generate-config.sh
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /usr/local/bin/generate-config.sh /entrypoint.sh

ENV TYPESENSE_API_KEY=${TYPESENSE_API_KEY}
ENV TYPESENSE_HOST=${TYPESENSE_HOST}
ENV TYPESENSE_NODE_PORT=${TYPESENSE_NODE_PORT}

EXPOSE 80
CMD ["/entrypoint.sh"]
