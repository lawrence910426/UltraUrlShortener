FROM node:17-bullseye
WORKDIR /app

COPY package.json ./

RUN npm install .
CMD ["npm", "run", "start"]
