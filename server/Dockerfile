FROM node:20-alpine

# Create non-root user for security
RUN addgroup -S app && adduser -S app -G app

WORKDIR /app

# Copy manifests and install production deps only
COPY package.json ./
RUN npm install --omit=dev && npm cache clean --force

# Copy source
COPY --chown=app:app . .

USER app

EXPOSE 5000

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:5000/health || exit 1

CMD ["node", "index.js"]
