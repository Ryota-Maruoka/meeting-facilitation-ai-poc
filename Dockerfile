FROM node:22

WORKDIR /app

RUN apt-get update && apt-get install -y \
    postgresql-client \
    curl \
    unzip \
    less \
    groff \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g @anthropic-ai/claude-code

RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" \
  && unzip awscliv2.zip \
  && ./aws/install \
  && rm -rf aws awscliv2.zip