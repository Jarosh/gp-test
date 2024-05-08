FROM node:22

WORKDIR /home/node/lib
COPY ./lib/package*.json ./
RUN npm install

WORKDIR /home/node/app
COPY ./bin/package*.json ./
RUN npm install
COPY ./bin .
