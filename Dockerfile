# syntax=docker/dockerfile:1

FROM node:18

WORKDIR /app

RUN apt update && apt install -y zip

COPY ./package.json .
RUN npm install --save-prod

COPY . .
CMD ["npm", "run", "prod"]

# gamesorting_webapp listening port
EXPOSE 8080
# MariaDB default port
EXPOSE 3306 
# Redis default port
EXPOSE 6379  
