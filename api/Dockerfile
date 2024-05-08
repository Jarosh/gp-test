FROM node:22

WORKDIR /home/node/lib
COPY ./lib/package*.json ./
RUN npm install

WORKDIR /home/node/app
COPY ./api/package*.json ./
RUN npm install
COPY ./api .
