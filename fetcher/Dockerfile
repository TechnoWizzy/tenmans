############################################################
# Global Arguments
############################################################
ARG BUN_VERSION=1.3
ARG RUNTIME_IMAGE=oven/bun:${BUN_VERSION}-slim

############################################################
# Runtime Stage: Headed Chromium under Xvfb
############################################################
FROM ${RUNTIME_IMAGE} as runtime

# Install runtime and Playwright chromium dependencies
RUN apt-get update && \
    apt-get install -y \
      tini \
      wget \
      fontconfig \
      fonts-unifont \
      fonts-noto-color-emoji \
      fonts-freefont-ttf \
      fonts-ipafont-gothic \
      fonts-wqy-zenhei \
      fonts-tlwg-loma-otf \
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
      xvfb \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY fonts/ /usr/local/share/fonts/windows/
RUN fc-cache -f -v

WORKDIR /app

# Install dependencies
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

# Copy source files
COPY ./src ./src

# The licensed Chromium build is downloaded on first launch into /root/.cloakbrowser, which compose mounts as a volume
ENV DISPLAY=:99

# Clear the lock a restarted container leaves behind, then wait for Xvfb's socket before launching the browser
ENTRYPOINT ["/usr/bin/tini", "--", "sh", "-c", "rm -f /tmp/.X99-lock /tmp/.X11-unix/X99; Xvfb :99 -screen 0 1920x1080x24 -nolisten tcp & for i in $(seq 100); do [ -e /tmp/.X11-unix/X99 ] && break; sleep 0.1; done; exec bun run ./src/index.ts"]
