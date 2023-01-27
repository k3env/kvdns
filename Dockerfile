FROM node:18.13.0-bullseye-slim AS build
COPY . /app
WORKDIR /app
RUN npm ci && npm run build

FROM node:18.13.0-bullseye-slim
COPY --from=build /app/dist /app
COPY package.json /app/package.json
WORKDIR /app
RUN npm install --omit=dev
CMD ["node", "main.js"]
