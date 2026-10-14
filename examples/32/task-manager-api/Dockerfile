# syntax=docker/dockerfile:1

FROM golang:1.24-alpine AS build

WORKDIR /src

# Сначала копируем модули: этот слой останется в кэше, пока зависимости не меняются.
COPY go.mod ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/task-manager-api ./cmd/api

FROM alpine:3.21

RUN addgroup -S app && adduser -S -G app app
USER app

COPY --from=build /out/task-manager-api /task-manager-api

EXPOSE 8080

ENTRYPOINT ["/task-manager-api"]
