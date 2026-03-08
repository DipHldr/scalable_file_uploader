FROM node:20-slim
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
COPY shared/infra/package*.json ./shared/infra/
COPY shared/utils/package*.json ./shared/utils/
COPY services/worker/package*.json ./services/worker/

RUN npm install

COPY shared/ ./shared/
COPY services/worker/ ./services/worker/

WORKDIR /app/services/worker
CMD ["npx","nodemon","--watch","src","--watch","../../shared","src/transcoder.js"]