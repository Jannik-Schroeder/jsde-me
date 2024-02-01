FROM node:18-alpine

WORKDIR /app

COPY . .
RUN npm install --legacy-peer-deps
RUN npm run build

CMD ["npm", "run", "start"]