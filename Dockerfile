FROM node:23-slim
WORKDIR /app
RUN npm install -g bun @elizaos/cli
COPY package.json bun.lock* ./
RUN bun install
COPY . .
ENV OPENAI_API_KEY=nosana
ENV MODEL_NAME=qwen3.5-27b
EXPOSE 3000
CMD ["elizaos", "start", "--character", "./characters/agent.character.json"]
