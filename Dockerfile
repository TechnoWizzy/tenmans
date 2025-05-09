FROM oven/bun:1.2.10

RUN apt-get update && apt-get install -y tini wget && apt-get clean

WORKDIR /app

COPY package.json tsconfig.json typedoc.json bun.lockb .env ./
RUN bun install --frozen-lockfile

COPY *.ts ./
COPY ./src ./src
COPY ./settings.json ./

RUN bun run docs

ARG COMMIT_MSG
ENV COMMIT_MESSAGE=$COMMIT_MSG

ENTRYPOINT ["/usr/bin/tini", "--", "bun", "run", "./index.ts"]