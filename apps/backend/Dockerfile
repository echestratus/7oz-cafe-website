# syntax=docker/dockerfile:1.7

FROM golang:1.25-alpine AS build
WORKDIR /src

RUN apk add --no-cache git ca-certificates

COPY go.mod go.sum ./
RUN go mod download

COPY . .

ARG VERSION=dev
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w -X main.version=${VERSION}" -o /out/api ./cmd/api

FROM alpine:3.21 AS runtime
RUN apk add --no-cache ca-certificates curl tzdata \
  && addgroup -S sevenoz \
  && adduser -S -G sevenoz sevenoz

WORKDIR /app
COPY --from=build /out/api /app/api
COPY database/migrations /app/database/migrations

RUN mkdir -p /app/storage \
  && chown -R sevenoz:sevenoz /app

USER sevenoz
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fsS http://127.0.0.1:8080/health || exit 1

ENTRYPOINT ["/app/api"]
