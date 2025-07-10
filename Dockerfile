# 1. Build the React frontend
FROM node:18 AS frontend-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# 2. Build the backend and copy frontend build
FROM node:18 AS backend
WORKDIR /app
COPY server/package*.json ./server/
RUN cd server && npm install
COPY server/ ./server/
# Copy frontend build into backend's public directory (adjust if needed)
COPY --from=frontend-build /app/client/dist ./server/public

# 3. Start the server
WORKDIR /app/server
EXPOSE 3000
CMD ["npm", "start"] 