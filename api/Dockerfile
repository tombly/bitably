# syntax=docker/dockerfile:1

FROM node:current-alpine
COPY . /app
WORKDIR /app
RUN npm install
ENTRYPOINT ["npm", "start"]
