# 문제 해결 가이드

## 프론트엔드 접속 안됨 (http://localhost:5173)

### 1단계: 패키지 설치 확인

```powershell
# 클라이언트 디렉토리로 이동
cd client

# 패키지 설치
npm install
```

**예상 소요 시간**: 2-5분

설치 중 오류가 발생하면:
```powershell
# node_modules 삭제 후 재설치
rm -r -force node_modules
rm package-lock.json
npm install
```

### 2단계: 환경 변수 설정

`.env` 파일을 생성해야 합니다:

```powershell
# client 디렉토리에서
Copy-Item .env.example .env
```

또는 수동으로 `client/.env` 파일 생성:
```env
VITE_API_URL=http://localhost:3000
```

### 3단계: 개발 서버 실행

```powershell
# client 디렉토리에서
npm run dev
```

**성공 시 출력**:
```
VITE v5.0.8  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
➜  press h to show help
```

### 4단계: 브라우저 접속

브라우저에서 http://localhost:5173 접속

---

## 자주 발생하는 오류

### ❌ 오류 1: "Cannot find module 'vite'"

**원인**: 패키지가 설치되지 않음

**해결**:
```powershell
cd client
npm install
```

### ❌ 오류 2: "Port 5173 is already in use"

**원인**: 포트가 이미 사용 중

**해결 방법 1**: 기존 프로세스 종료
```powershell
# 포트 사용 중인 프로세스 확인
netstat -ano | findstr :5173

# 프로세스 ID(PID) 확인 후 종료
taskkill /PID <PID번호> /F
```

**해결 방법 2**: 다른 포트 사용
```powershell
# vite.config.ts 수정
# server: { port: 5174 }
```

### ❌ 오류 3: "Failed to resolve import"

**원인**: TypeScript 설정 또는 의존성 문제

**해결**:
```powershell
# 패키지 재설치
npm install

# TypeScript 캐시 삭제
rm -r -force node_modules/.vite
```

### ❌ 오류 4: ENOENT 에러

**원인**: 필수 파일 누락

**해결**: 파일 존재 확인
```powershell
# client 디렉토리에서
dir index.html
dir src\main.tsx
dir src\App.tsx
```

파일이 없으면 프로젝트를 다시 생성해야 합니다.

---

## 백엔드 접속 안됨 (http://localhost:3000)

### 1단계: 패키지 설치

```powershell
cd server
npm install
```

### 2단계: PostgreSQL 확인

```powershell
# PostgreSQL 서비스 실행 확인
Get-Service -Name postgresql*
```

PostgreSQL이 설치되지 않았다면:
```powershell
# Chocolatey로 설치
choco install postgresql
```

### 3단계: 데이터베이스 생성

```powershell
# PostgreSQL 접속
psql -U postgres

# 데이터베이스 생성
CREATE DATABASE postfnb_alba;
\q
```

### 4단계: 환경 변수 설정

`server/.env` 파일 생성:
```powershell
cd server
Copy-Item .env.example .env
```

`.env` 파일 편집:
```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/postfnb_alba
JWT_ACCESS_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-here
CLIENT_URL=http://localhost:5173
```

**중요**: `your_password`를 실제 PostgreSQL 비밀번호로 변경하세요.

### 5단계: Prisma 설정

```powershell
# server 디렉토리에서
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

### 6단계: 서버 실행

```powershell
npm run dev
```

**성공 시 출력**:
```
🚀 서버가 포트 3000에서 실행 중입니다.
📍 API: http://localhost:3000
🏥 Health Check: http://localhost:3000/health
🌍 환경: development
```

---

## Prisma 오류

### ❌ "Can't reach database server"

**원인**: 데이터베이스 연결 실패

**해결**:
1. PostgreSQL 실행 확인
2. DATABASE_URL 확인
3. 방화벽 설정 확인

```powershell
# PostgreSQL 재시작
Restart-Service postgresql*

# 연결 테스트
psql -U postgres -d postfnb_alba
```

### ❌ "Prisma Client did not initialize yet"

**원인**: Prisma 클라이언트 생성 안됨

**해결**:
```powershell
npm run prisma:generate
```

---

## 전체 시스템 실행 체크리스트

### ✅ 백엔드 실행

1. [ ] PostgreSQL 실행 중
2. [ ] `server/.env` 파일 생성됨
3. [ ] `npm install` 완료
4. [ ] `npm run prisma:generate` 완료
5. [ ] `npm run prisma:migrate` 완료
6. [ ] `npm run dev` 실행
7. [ ] http://localhost:3000/health 접속 성공

### ✅ 프론트엔드 실행

1. [ ] `client/.env` 파일 생성됨
2. [ ] `npm install` 완료
3. [ ] `npm run dev` 실행
4. [ ] http://localhost:5173 접속 성공

---

## 빠른 실행 스크립트

### PowerShell 스크립트

```powershell
# 전체 프로젝트 설정 및 실행

# 1. 백엔드 설정
cd server
Copy-Item .env.example .env -ErrorAction SilentlyContinue
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed

# 2. 백엔드 실행 (새 터미널)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd $PWD; npm run dev"

# 3. 프론트엔드 설정
cd ..\client
Copy-Item .env.example .env -ErrorAction SilentlyContinue
npm install

# 4. 프론트엔드 실행 (새 터미널)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd $PWD; npm run dev"

Write-Host "✅ 설정 완료!" -ForegroundColor Green
Write-Host "📍 프론트엔드: http://localhost:5173" -ForegroundColor Cyan
Write-Host "📍 백엔드: http://localhost:3000" -ForegroundColor Cyan
```

---

## 도움이 필요하면

### 로그 확인

**프론트엔드 로그**:
- 브라우저 개발자 도구 (F12) > Console

**백엔드 로그**:
- 터미널에서 실행 중인 서버 로그 확인

### 포트 확인

```powershell
# 사용 중인 포트 확인
netstat -ano | findstr :5173
netstat -ano | findstr :3000
```

### 캐시 삭제

```powershell
# 프론트엔드 캐시
cd client
rm -r -force node_modules/.vite
rm -r -force dist

# 백엔드 캐시
cd server
rm -r -force dist
```

### 완전 초기화

모든 것을 처음부터 다시:
```powershell
# 프론트엔드
cd client
rm -r -force node_modules
rm package-lock.json
npm install

# 백엔드
cd ..\server
rm -r -force node_modules
rm package-lock.json
npm install
```
