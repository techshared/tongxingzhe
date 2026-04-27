# Multi-stage build
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Copy module files
COPY go.mod go.sum ./
RUN go mod download

# Copy source
COPY . .

# Build
RUN CGO_ENABLED=0 GOOS=linux go build -o user-service ./cmd

# Runtime stage
FROM debian:stable-slim

RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=builder /app/user-service .

EXPOSE 8080

ENV PORT=8080

CMD ["./user-service"]