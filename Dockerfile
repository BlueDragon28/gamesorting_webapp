# syntax=docker/dockerfile:1

FROM node:20-alpine

WORKDIR /app

COPY ./package.json .
RUN npm install --save-prod

COPY . .
CMD ["npm", "run", "prod"]

# gamesorting_webapp listening port
EXPOSE 8080
# MariaDB default port
EXPOSE 3306 
