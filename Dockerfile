############################################################
# Global Arguments
############################################################
ARG BUN_VERSION=1.3
ARG BUILD_IMAGE=oven/bun:${BUN_VERSION}
ARG RUNTIME_IMAGE=oven/bun:${BUN_VERSION}-slim

############################################################
# Build Stage: Compile Application
############################################################
FROM ${BUILD_IMAGE} as builder

WORKDIR /app

# Copy dependency files
COPY package.json tsconfig.json typedoc.json bun.lockb ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source files
COPY ./src ./src
COPY ./settings.json ./

# Generate documentation
RUN bun run docs

############################################################
# Runtime Stage: Run app with minimal base
############################################################
FROM ${RUNTIME_IMAGE} as runtime

# Install runtime dependencies
RUN apt-get update && \
    apt-get install -y tini wget && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy built artifacts and dependencies from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/docs ./docs
COPY --from=builder /app/settings.json ./
COPY --from=builder /app/package.json ./

# Install Playwright with dependencies
RUN bunx -y playwright@1.54.0 install --with-deps chromium

ENTRYPOINT ["/usr/bin/tini", "--", "bun", "run", "./src/index.ts"]