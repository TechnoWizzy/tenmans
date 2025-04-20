FROM oven/bun:1.2.10-debian

RUN apt-get update && apt-get install -y tini wget && apt-get clean

WORKDIR /app

COPY package.json bun.lockb .env ./
RUN bun install --frozen-lockfile

COPY *.ts ./
COPY ./src ./src

ENTRYPOINT ["/usr/bin/tini", "--", "bun", "run", "./index.ts"]