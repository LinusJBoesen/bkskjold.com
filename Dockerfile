FROM oven/bun:1.3 AS base
WORKDIR /app

# Install backend dependencies
COPY backend/package.json backend/bun.lockb* backend/
RUN cd backend && bun install --frozen-lockfile || cd backend && bun install

# Build frontend
COPY frontend/package.json frontend/bun.lockb* frontend/
RUN cd frontend && bun install --frozen-lockfile || cd frontend && bun install
COPY frontend/ frontend/
RUN cd frontend && bunx vite build

# Copy backend source
COPY backend/ backend/

# Create data directory for SQLite
RUN mkdir -p backend/data

# Move built frontend into backend/static
RUN mv frontend/dist backend/static

# Run from backend directory so relative paths resolve correctly
WORKDIR /app/backend
EXPOSE 3000
CMD ["bun", "run", "src/index.ts"]
