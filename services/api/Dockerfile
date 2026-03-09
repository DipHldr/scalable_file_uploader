FROM node:20-slim    
WORKDIR /app

COPY package*.json ./
COPY shared/infra/package*.json ./shared/infra/
COPY shared/utils/package*.json ./shared/utils/
COPY services/api/package*.json ./services/api/

RUN npm install

COPY shared/ ./shared/
COPY infra/migrations/ ./infra/migrations/
COPY services/api/ ./services/api/

WORKDIR /app/services/api
EXPOSE 3000
CMD ["npx","nodemon","--watch","src","--watch","../../shared","src/server.js"]