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

# Install Playwright chromium dependencies manually (ttf-unifont/ttf-ubuntu-font-family
# were renamed to fonts-unifont/fonts-ubuntu in newer Debian releases)
RUN apt-get update && \
    apt-get install -y \
      fonts-unifont \
      libasound2 \
      libatk-bridge2.0-0 \
      libatk1.0-0 \
      libatspi2.0-0 \
      libcairo2 \
      libcups2 \
      libdbus-1-3 \
      libdrm2 \
      libgbm1 \
      libglib2.0-0 \
      libgtk-3-0 \
      libnspr4 \
      libnss3 \
      libpango-1.0-0 \
      libpangocairo-1.0-0 \
      libudev1 \
      libx11-6 \
      libx11-xcb1 \
      libxcb1 \
      libxcomposite1 \
      libxcursor1 \
      libxdamage1 \
      libxext6 \
      libxfixes3 \
      libxi6 \
      libxrandr2 \
      libxrender1 \
      libxss1 \
      libxtst6 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Patchwright chromium binary (deps already installed above)
RUN bunx -y patchright install chromium

ENTRYPOINT ["/usr/bin/tini", "--", "bun", "run", "./src/index.ts"]