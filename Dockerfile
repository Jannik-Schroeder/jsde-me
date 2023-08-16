FROM node:18-alpine

WORKDIR /app

COPY . .
RUN npm i --force
RUN npm run build

CMD ["npm", "run", "start"]