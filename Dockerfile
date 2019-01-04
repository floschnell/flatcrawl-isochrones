FROM node:8.15.0-alpine

COPY ./package.json /opt/app/package.json
COPY ./yarn.lock /opt/app/yarn.lock

WORKDIR /opt/app
RUN yarn install

COPY src /opt/app/src
