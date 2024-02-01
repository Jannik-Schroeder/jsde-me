FROM node:21-alpine

WORKDIR /app

COPY . .
RUN npm install --force
RUN npm run build

CMD ["npm", "run", "start"]