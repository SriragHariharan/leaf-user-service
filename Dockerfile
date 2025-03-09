FROM node:23-alpine3.20

WORKDIR /app

COPY package*.json ./

RUN npm install --force

COPY . .

RUN npm run build

EXPOSE 2001

CMD ["npm", "run", "start"]
