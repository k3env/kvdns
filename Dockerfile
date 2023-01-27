FROM node:18.13.0-bullseye-slim AS build
COPY . /app
WORKDIR /app
RUN npm ci && npm run build && npm run bundle

FROM node:18.13.0-bullseye-slim
COPY --from=build /app/app/app.js /app/app.cjs
COPY package.json /app/package.json
WORKDIR /app
RUN npm install --omit=dev
CMD ["node", "app.cjs"]
