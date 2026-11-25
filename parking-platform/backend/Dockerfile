FROM golang:1.23-alpine AS builder
WORKDIR /app

RUN apk add --no-cache git ca-certificates tzdata

COPY go.mod ./
RUN go mod download

COPY . .
RUN go mod tidy && CGO_ENABLED=0 GOOS=linux go build -o /bin/parking-api ./cmd/api

FROM alpine:3.20
WORKDIR /app
RUN apk add --no-cache ca-certificates tzdata
ENV TZ=Asia/Bangkok

COPY --from=builder /bin/parking-api /usr/local/bin/parking-api
EXPOSE 8080
CMD ["/usr/local/bin/parking-api"]
