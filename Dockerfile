FROM node:21-bookworm

ARG SITE_URL=https://jsde.me

ENV NEXT_PUBLIC_SITE_URL=$SITE_URL

WORKDIR /app
COPY . .
RUN npm install --force
RUN npm run build
CMD ["npm", "run", "start"]
