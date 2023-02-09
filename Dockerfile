FROM node:16

RUN apt update \
    && apt install --assume-yes chromium


WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install

RUN ln -snf /usr/share/zoneinfo/Asia/Seoul /etc/localtime

COPY ./src ./src
COPY ./index.js ./index.js
CMD [ "node", "index.js" ]