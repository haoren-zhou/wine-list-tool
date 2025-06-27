# syntax=docker/dockerfile:1
FROM ghcr.io/astral-sh/uv:python3.11-bookworm-slim
ENV DEBIAN_FRONTEND=noninteractive
ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_NO_CACHE=1

RUN apt-get update && apt-get install -y --no-install-recommends
RUN uv python install 3.11

WORKDIR /app

COPY . .

RUN uv sync --locked --no-install-project --no-dev

RUN uv sync --locked --no-dev

EXPOSE 8000

CMD ["uv", "run", "fastapi", "run", "main.py", "--port", "8000"]