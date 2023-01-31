FROM node:18.13.0-bullseye-slim AS build
COPY package*.json /app/
WORKDIR /app
RUN npm ci
COPY . /app/
RUN npm run build && npm run bundle

FROM node:18.13.0-bullseye-slim
WORKDIR /app
COPY package.json /app/package.json
RUN npm install --omit=dev
COPY --from=build /app/dist /app
CMD ["node", "app.js"]
