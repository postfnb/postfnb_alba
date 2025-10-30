# 배포 가이드

## 🐳 Docker 이미지 생성

### 1. 기본 빌드

#### 1.1 서버 이미지 빌드
```bash
cd server

# 기본 빌드
docker build -t postfnb-alba-server:latest .

# 버전 태그 추가
docker build -t postfnb-alba-server:1.0.0 .

# 여러 태그 동시 지정
docker build -t postfnb-alba-server:latest -t postfnb-alba-server:1.0.0 .
```

#### 1.2 클라이언트 이미지 빌드
```bash
cd client

# 기본 빌드
docker build -t postfnb-alba-client:latest .

# 환경 변수 전달
docker build \
  --build-arg VITE_API_URL=https://api.yourdomain.com \
  -t postfnb-alba-client:latest .
```

### 2. 빌드 상태 확인

```bash
# 상세 로그 출력
docker build --progress=plain -t postfnb-alba-server:latest .

# 캐시 무시하고 재빌드
docker build --no-cache -t postfnb-alba-server:latest .

# 빌드된 이미지 확인
docker images | grep postfnb

# 이미지 크기 확인
docker images postfnb-alba-server:latest --format "table {{.Repository}}\t{{.Size}}"
```

### 3. Dockerfile 구조 분석

#### 멀티스테이지 빌드 (Multi-stage Build)

**Stage 1: deps (의존성)**
- 프로덕션 의존성만 설치
- npm 캐시 정리로 이미지 크기 최소화

**Stage 2: build (빌드)**
- TypeScript 컴파일
- Prisma Client 생성
- 개발 의존성 포함

**Stage 3: runner (실행)**
- 필요한 파일만 복사 (node_modules, dist, prisma)
- Non-root 사용자(nodejs)로 실행
- 최종 프로덕션 이미지

---

## 🚀 Docker 컨테이너 실행

### 1. 기본 실행

```bash
# 포트 매핑과 함께 실행
docker run -p 3000:3000 postfnb-alba-server:latest

# 백그라운드 실행
docker run -d -p 3000:3000 postfnb-alba-server:latest

# 컨테이너 이름 지정
docker run -d -p 3000:3000 --name alba-server postfnb-alba-server:latest
```

### 2. 환경 변수 설정

```bash
# 환경 변수 직접 전달
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:password@db:5432/postfnb_alba" \
  -e JWT_ACCESS_SECRET="your-secret-key" \
  -e JWT_REFRESH_SECRET="your-refresh-secret" \
  -e NODE_ENV=production \
  --name alba-server \
  postfnb-alba-server:latest

# .env 파일에서 로드
docker run -d \
  -p 3000:3000 \
  --env-file .env \
  --name alba-server \
  postfnb-alba-server:latest
```

### 3. 네트워크 설정

```bash
# 커스텀 네트워크 생성
docker network create alba-network

# 네트워크에 연결하여 실행
docker run -d \
  -p 3000:3000 \
  --network alba-network \
  -e DATABASE_URL="postgresql://user:password@db:5432/postfnb_alba" \
  --name alba-server \
  postfnb-alba-server:latest
```

### 4. 리소스 제한

```bash
# CPU 및 메모리 제한
docker run -d \
  -p 3000:3000 \
  --cpus="1" \
  --memory="512m" \
  --name alba-server \
  postfnb-alba-server:latest
```

---

## 🐳 Docker Compose를 이용한 실행

### 1. docker-compose.yml 작성

```yaml
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    container_name: alba-db
    environment:
      POSTGRES_USER: alba_user
      POSTGRES_PASSWORD: alba_password
      POSTGRES_DB: postfnb_alba
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U alba_user"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - alba-network

  server:
    build:
      context: ./server
      dockerfile: Dockerfile
    container_name: alba-server
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      PORT: 3000
      DATABASE_URL: postgresql://alba_user:alba_password@db:5432/postfnb_alba
      JWT_ACCESS_SECRET: ${JWT_ACCESS_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
    depends_on:
      db:
        condition: service_healthy
    networks:
      - alba-network
    restart: unless-stopped

  client:
    build:
      context: ./client
      dockerfile: Dockerfile
    container_name: alba-client
    ports:
      - "80:80"
    depends_on:
      - server
    networks:
      - alba-network
    restart: unless-stopped

volumes:
  postgres_data:

networks:
  alba-network:
    driver: bridge
```

### 2. .env 파일 설정

```bash
# .env
JWT_ACCESS_SECRET=your-strong-access-secret-key
JWT_REFRESH_SECRET=your-strong-refresh-secret-key
KAKAO_CLIENT_ID=your-kakao-client-id
KAKAO_CLIENT_SECRET=your-kakao-client-secret
KAKAO_CALLBACK_URL=https://yourdomain.com/api/auth/kakao/callback
CLIENT_URL=https://yourdomain.com
VITE_API_URL=https://api.yourdomain.com
```

### 3. Docker Compose 실행

```bash
# 컨테이너 시작
docker-compose up -d

# 로그 확인
docker-compose logs -f server

# 컨테이너 상태 확인
docker-compose ps

# 컨테이너 중지
docker-compose down

# 모든 데이터 삭제
docker-compose down -v
```

---

## 🔍 컨테이너 관리

### 1. 실행 중인 컨테이너 확인

```bash
# 실행 중인 컨테이너 목록
docker ps

# 모든 컨테이너 목록 (중지된 것 포함)
docker ps -a

# 특정 컨테이너 상세 정보
docker inspect alba-server
```

### 2. 로그 확인

```bash
# 로그 출력
docker logs alba-server

# 실시간 로그 (tail -f)
docker logs -f alba-server

# 마지막 100줄만 출력
docker logs --tail 100 alba-server

# 타임스탬프 포함
docker logs -t alba-server
```

### 3. 컨테이너 내부 접속

```bash
# 셸 접속
docker exec -it alba-server sh

# 특정 명령 실행
docker exec alba-server npm run list-users

# 루트 권한으로 접속
docker exec -it -u root alba-server sh
```

### 4. 컨테이너 제어

```bash
# 재시작
docker restart alba-server

# 중지
docker stop alba-server

# 시작
docker start alba-server

# 강제 종료
docker kill alba-server

# 삭제
docker rm alba-server
```

---

## 🖼️ 이미지 관리

### 1. 이미지 정보 확인

```bash
# 이미지 목록
docker images

# 특정 이미지 정보
docker inspect postfnb-alba-server:latest

# 이미지 히스토리 (레이어 정보)
docker history postfnb-alba-server:latest
```

### 2. 이미지 태그 관리

```bash
# 새 태그 추가
docker tag postfnb-alba-server:latest postfnb-alba-server:v1.0.0

# 태그 제거
docker rmi postfnb-alba-server:v1.0.0
```

### 3. 이미지 저장 및 로드

```bash
# 이미지를 파일로 저장
docker save postfnb-alba-server:latest -o alba-server.tar

# 파일에서 이미지 로드
docker load -i alba-server.tar

# 압축하여 저장
docker save postfnb-alba-server:latest | gzip > alba-server.tar.gz

# 압축 파일에서 로드
docker load -i alba-server.tar.gz
```

### 4. 이미지 푸시 (Docker Hub)

```bash
# Docker Hub 로그인
docker login

# 이미지 태그 변경 (username/repository 형식)
docker tag postfnb-alba-server:latest username/alba-server:latest

# 이미지 푸시
docker push username/alba-server:latest

# 로그아웃
docker logout
```

### 5. 이미지 정리

```bash
# 사용하지 않는 이미지 삭제
docker image prune

# 특정 이미지 삭제
docker rmi postfnb-alba-server:latest

# 강제 삭제
docker rmi -f postfnb-alba-server:latest
```

---

## 🔐 보안 고려사항

### 1. Non-root 사용자
- ✅ Dockerfile에서 `nodejs` 사용자로 실행
- ✅ 파일 권한 설정 (`--chown=nodejs:nodejs`)

### 2. 환경 변수 관리
```bash
# ✅ 권장 방법: .env 파일 사용 (Git에 커밋하지 않음)
docker run --env-file .env alba-server

# ✅ Docker Secrets 사용 (Swarm/Kubernetes)
docker secret create jwt_secret secret.txt
```

### 3. 이미지 스캔
```bash
# Trivy를 이용한 취약점 스캔
trivy image postfnb-alba-server:latest

# Docker Scout (Docker Desktop)
docker scout cves postfnb-alba-server:latest
```

---

## 📊 성능 최적화

### 1. 이미지 크기 최소화
```bash
# 현재 이미지 크기 확인
docker images postfnb-alba-server:latest --format "table {{.Repository}}\t{{.Size}}"

# 멀티스테이지 빌드로 크기 감소
# - deps 단계: 프로덕션 의존성만
# - build 단계: 빌드 도구 포함 (최종 이미지에 미포함)
# - runner 단계: 필요한 파일만 복사
```

### 2. 빌드 시간 단축
```bash
# 캐시 활용 (기본값)
docker build -t postfnb-alba-server:latest .

# 불필요한 파일 제외 (.dockerignore)
cat server/.dockerignore
```

### 3. 런타임 성능
```bash
# 리소스 제한 설정
docker run -d \
  --cpus="2" \
  --memory="1g" \
  --memory-swap="2g" \
  postfnb-alba-server:latest

# 헬스체크 모니터링
docker ps --format "table {{.Names}}\t{{.Status}}"
```

---

## 🚨 문제 해결

### 빌드 실패
```bash
# 1. 캐시 무시하고 재빌드
docker build --no-cache -t postfnb-alba-server:latest .

# 2. 상세 로그 확인
docker build --progress=plain -t postfnb-alba-server:latest .

# 3. 빌드 컨텍스트 확인
ls -la server/
```

### 컨테이너 실행 실패
```bash
# 1. 로그 확인
docker logs alba-server

# 2. 포트 충돌 확인
netstat -an | grep 3000

# 3. 환경 변수 확인
docker exec alba-server env

# 4. 컨테이너 내부 접속
docker exec -it alba-server sh
```

### 데이터베이스 연결 실패
```bash
# 1. 네트워크 확인
docker network ls
docker network inspect alba-network

# 2. DNS 확인
docker exec alba-server nslookup db

# 3. 포트 확인
docker exec alba-server netstat -an | grep 5432
```

---

## 📚 유용한 명령어 모음

### 빌드 및 실행
```bash
# 이미지 빌드
cd server
docker build -t postfnb-alba-server:latest .

# 컨테이너 실행
docker run -d -p 3000:3000 --name alba-server postfnb-alba-server:latest

# Docker Compose 실행
docker-compose up -d
```

### 모니터링
```bash
# 실시간 로그
docker logs -f alba-server

# 리소스 사용량
docker stats alba-server

# 컨테이너 상태
docker ps
```

### 유지보수
```bash
# 컨테이너 재시작
docker restart alba-server

# 컨테이너 내부 접속
docker exec -it alba-server sh

# 이미지 정리
docker image prune
```

---

## 자동 배포

### 서버 배포
- `server/` 폴더의 파일을 수정하고 `main` 또는 `develop` 브랜치에 푸시
- GitHub Actions가 자동으로 ECR에 이미지 빌드/푸시 후 ECS 서비스 업데이트

### 클라이언트 배포
- `client/` 폴더의 파일을 수정하고 `main` 또는 `develop` 브랜치에 푸시
- GitHub Actions가 자동으로 빌드 후 S3 업로드 및 CloudFront 캐시 무효화

## 수동 배포

### GitHub Actions에서 수동 실행
1. GitHub 리포지토리 → Actions 탭
2. 원하는 워크플로 선택
3. "Run workflow" 버튼 클릭

### 로컬에서 스크립트 실행
```bash
# 서버 배포
./scripts/deploy-server.sh

# 클라이언트 배포
./scripts/deploy-client.sh