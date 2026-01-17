FROM node:18-bullseye

RUN apt update && apt install -y ffmpeg

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
CMD ["npm", "start"]
