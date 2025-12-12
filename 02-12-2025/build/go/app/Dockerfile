# Dockerfile
FROM alpine:3.20

RUN apk add --no-cache ca-certificates \
  && adduser -D -u 10001 app

WORKDIR /app
COPY main /app/main

USER app
ENTRYPOINT ["/app/main"]
