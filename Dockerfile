# syntax=docker/dockerfile:1

FROM --platform=$BUILDPLATFORM node:20-alpine AS build
ARG TARGETPLATFORM
ARG BUILDPLATFORM
WORKDIR /build

COPY ./package.json .
RUN if [ "$TARGETPLATFORM" == "linux/arm/v6" ]; then \
        npm install --save-prod --target_arch=arm --target-platform=linux; \
    elif [ "$TARGETPLATFORM" == "linux/amd64" ]; then \
        npm install --save-prod --target_arch=x64 --target-platform=linux; \
    else \
        echo "$BUILDPLATFORM"; \
        echo "$TARGETPLATFORM"; \
        echo "Invalid architecture"; exit 1; \
    fi


FROM --platform=$TARGETPLATFORM node:20-alpine

WORKDIR /app

#COPY ./package.json .
#RUN npm install --save-prod

COPY --from=build /build/* ./node_modules/
COPY --from=build /build/package.json .
COPY --from=build /build/package-lock.json .
COPY . .
CMD ["npm", "run", "prod"]

# gamesorting_webapp listening port
EXPOSE 8080
# MariaDB default port
EXPOSE 3306 
