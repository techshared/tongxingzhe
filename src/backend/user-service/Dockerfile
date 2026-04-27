# Runtime stage only - binary is built outside Docker
FROM debian:stable-slim

RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY user-service .

EXPOSE 8080

ENV PORT=8080

CMD ["./user-service"]