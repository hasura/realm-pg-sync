FROM node:8

WORKDIR /app

COPY app/package.json ./
COPY app/realm-postgres-adapters-1.1.2.tgz ./

#install node modules
RUN npm install

# Add app source files
ADD app /app

# Build react app
RUN npm run build

CMD ["node", "server.js"]
