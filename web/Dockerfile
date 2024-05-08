FROM node:22

WORKDIR /home/node/app
COPY ./web/package*.json ./
RUN npm install
COPY ./web .
