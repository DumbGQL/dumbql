# Docker Reference

Used by the project-creator skill when user requests Docker setup.
Apply this reference for ANY technology — adapt image names and commands per tech.

---

## Interview questions (add to Phase 1 when Docker requested)

Ask grouped:
- Single container or multi-service? (if multi → docker-compose)
- Production image only, or dev + prod?
- Does the app need a database? (postgres, mysql, redis, mongo → add to compose)
- Any external services? (message queue, S3-compatible storage, etc.)
- Target deployment: Docker Hub / GHCR / private registry / just local?

---

## Dockerfile — best practices (all languages)

### Always use multi-stage builds

Single-stage images carry build tools into production — bloated and insecure.

```dockerfile
# ❌ Bad — single stage, build tools in prod image
FROM golang:1.22
WORKDIR /app
COPY . .
RUN go build -o server .
CMD ["./server"]

# ✅ Good — multi-stage
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o server ./cmd/server

FROM gcr.io/distroless/static-debian12 AS runner
COPY --from=builder /app/server /server
ENTRYPOINT ["/server"]
```

### Pin base image versions — never use `latest`

```dockerfile
# ❌ Bad
FROM node:latest
FROM golang:latest

# ✅ Good
FROM node:20.14-alpine3.20
FROM golang:1.22-alpine3.20
```

### Copy dependency files first, then source (layer caching)

```dockerfile
# ✅ Good — deps cached unless lockfile changes
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY . .
```

### Run as non-root user

```dockerfile
# ✅ Good
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
```

### Use .dockerignore

Always generate `.dockerignore` alongside `Dockerfile`:
```
.git
.gitignore
node_modules
dist
.env*
*.log
coverage
.nyc_output
__pycache__
*.pyc
target       # Rust/Java
bin          # Go
```

### HEALTHCHECK

```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1
```

---

## Language-specific Dockerfiles

### Go

```dockerfile
FROM golang:1.22-alpine3.20 AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o server ./cmd/server

FROM gcr.io/distroless/static-debian12
COPY --from=builder /app/server /server
EXPOSE 8080
ENTRYPOINT ["/server"]
```

### Node / Angular SSR

```dockerfile
FROM node:20.14-alpine3.20 AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20.14-alpine3.20 AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
RUN addgroup -S app && adduser -S app -G app
USER app
EXPOSE 4000
CMD ["node", "dist/server/main.js"]
```

### Angular (static — nginx)

```dockerfile
FROM node:20.14-alpine3.20 AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=builder /app/dist/<project-name>/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

nginx.conf for Angular SPA routing:
```nginx
server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  gzip on;
  gzip_types text/plain text/css application/json application/javascript;
}
```

### Python

```dockerfile
FROM python:3.11-slim AS builder
WORKDIR /app
COPY pyproject.toml ./
RUN pip install --no-cache-dir build && python -m build

FROM python:3.11-slim
WORKDIR /app
COPY --from=builder /app/dist/*.whl ./
RUN pip install --no-cache-dir *.whl && rm *.whl
RUN addgroup --system app && adduser --system --group app
USER app
EXPOSE 8000
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Rust

```dockerfile
FROM rust:1.78-alpine AS builder
RUN apk add --no-cache musl-dev
WORKDIR /app
COPY Cargo.toml Cargo.lock ./
RUN mkdir src && echo "fn main(){}" > src/main.rs && cargo build --release && rm src/main.rs
COPY src ./src
RUN touch src/main.rs && cargo build --release

FROM gcr.io/distroless/static-debian12
COPY --from=builder /app/target/release/<project> /<project>
EXPOSE 8080
ENTRYPOINT ["/<project>"]
```

### Java / Kotlin (Spring Boot)

```dockerfile
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app
COPY gradlew ./
COPY gradle ./gradle
RUN chmod +x gradlew && ./gradlew dependencies --no-daemon
COPY . .
RUN ./gradlew bootJar --no-daemon

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S spring && adduser -S spring -G spring
USER spring
COPY --from=builder /app/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

---

## docker-compose (dev environment)

Generate when user has multi-service or needs a database.

```yaml
# compose.yml (modern name, not docker-compose.yml)
name: <project>

services:
  app:
    build:
      context: .
      target: builder        # dev stage if multi-stage has one
    ports:
      - "8080:8080"
    environment:
      - DATABASE_URL=postgres://user:password@db:5432/<project>
    depends_on:
      db:
        condition: service_healthy
    volumes:
      - .:/app               # hot reload in dev only

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: <project>
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user -d <project>"]
      interval: 5s
      timeout: 5s
      retries: 5
    ports:
      - "5432:5432"          # expose only in dev

volumes:
  postgres_data:
```

**Security note**: never commit real passwords. Use `.env` file loaded by compose:
```yaml
environment:
  - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
```
Add `.env` to `.gitignore`, provide `.env.example` with placeholder values.

---

## CI — Docker build & push (GitHub Actions)

```yaml
docker:
  runs-on: ubuntu-latest
  needs: [test]
  permissions:
    contents: read
    packages: write
  steps:
    - uses: actions/checkout@v4
    - uses: docker/setup-buildx-action@v3
    - uses: docker/login-action@v3
      with:
        registry: ghcr.io
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}
    - uses: docker/build-push-action@v5
      with:
        context: .
        push: ${{ github.ref == 'refs/heads/main' }}
        tags: ghcr.io/${{ github.repository }}:${{ github.sha }}
        cache-from: type=gha
        cache-to: type=gha,mode=max
```
