FROM node:20-slim    
WORKDIR /app

COPY package*.json ./
COPY shared/minio_utils/package*.json ./shared/minio_utils/
COPY services/api/package*.json ./services/api/

RUN npm install

COPY shared/ ./shared/
COPY services/api/ ./services/api/

WORKDIR /app/services/api
EXPOSE 3000
CMD ["node","src/server.js"]