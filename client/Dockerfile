# 빌드 스테이지
FROM node:18-alpine AS build
WORKDIR /app

# 패키지 설치
COPY package*.json ./
RUN npm ci

# 환경 변수 설정 (빌드 타임)
ARG VITE_API_URL=http://api-alba.andonggalbi.com
ARG VITE_APP_NAME=PostFNB Alba
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_APP_NAME=$VITE_APP_NAME

# 빌드 실행
COPY . .
RUN npm run build

# 프로덕션 스테이지 (Nginx)
FROM nginx:alpine

# Nginx 설정 파일 복사
COPY nginx.conf /etc/nginx/nginx.conf

# 빌드된 파일 복사
COPY --from=build /app/dist /usr/share/nginx/html

# 포트 노출
EXPOSE 80

# Nginx 실행
CMD ["nginx", "-g", "daemon off;"]