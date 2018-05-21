FROM node:8

WORKDIR /src

COPY src/package.json ./
COPY src/realm-postgres-adapters-1.1.2.tgz ./

#install node modules
RUN npm install

# Add app source files
ADD src /src

# Build react app
RUN npm run build

CMD ["node", "server.js"]
