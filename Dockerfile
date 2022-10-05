FROM node:18-alpine as builder

WORKDIR /app
RUN yarn global add @quasar/cli

COPY package.json yarn.lock ./
RUN yarn install

COPY . .
ARG PUBLIC_PATH /
RUN quasar build


FROM caddy:2-alpine

WORKDIR /srv
COPY --from=builder /app/dist/spa/ ./

EXPOSE 80
CMD ["caddy", "file-server"]
