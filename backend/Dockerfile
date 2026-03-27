FROM node:22-bookworm-slim

ENV NODE_ENV=production
ENV LIBREOFFICE_PATH=/usr/bin/libreoffice

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        libreoffice \
        fonts-dejavu-core \
        ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src
COPY README.md ./

RUN mkdir -p /app/storage/uploads /app/storage/outputs

EXPOSE 4000

CMD ["node", "src/server.js"]
