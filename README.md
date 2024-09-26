# Tifa

Tifa is remove noise from GitHub notifications.

## Setup

```sh
# Install dependencies
pnpm install

# Run the bot
pnpm start
```

## Docker

```sh
# 1. Build container
docker build -t probot-tmep .

# 2. Start container
docker run -e APP_ID=<app-id> -e PRIVATE_KEY=<pem-value> probot-tmep
```
