FROM node:20-alpine

# Install build dependencies for better-sqlite3, docker/tar client, restic
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    docker-cli \
    tar \
    curl \
    bzip2 \
    sqlite \
    mysql-client \
    postgresql-client \
    fuse

# Install Restic
RUN curl -fsSL https://github.com/restic/restic/releases/download/v0.17.3/restic_0.17.3_linux_amd64.bz2 \
    | bzip2 -d > /usr/local/bin/restic && \
    chmod +x /usr/local/bin/restic

WORKDIR /app

COPY package*.json ./
# Build from source using the system python/g++ to get sqlcipher
RUN npm install

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

CMD ["npm", "start"]
