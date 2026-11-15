# ---- BUILD FRONTEND ----
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --only=production
COPY frontend/ .
ARG BACKEND_URL=http://localhost:8000
ENV VITE_API_BASE_URL=${BACKEND_URL}
RUN npm run build

# ---- SERVE WITH NGINX ----
FROM nginx:alpine
COPY --from=frontend-build /app/frontend/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
