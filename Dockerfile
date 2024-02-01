FROM node:21-bookworm

WORKDIR /app

COPY . .
RUN npm install --force
RUN npm run build

CMD ["npm", "run", "start"]