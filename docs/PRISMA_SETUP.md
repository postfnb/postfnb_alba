# Prisma 설정 가이드

## 오류: 'prisma'은(는) 내부 또는 외부 명령이 아닙니다

### 원인
서버 패키지가 설치되지 않아서 Prisma CLI를 찾을 수 없습니다.

### 해결 방법

#### 1단계: 서버 패키지 설치

```powershell
cd server
npm install
```

**예상 소요 시간**: 2-5분

설치가 완료되면 다음과 같은 메시지가 표시됩니다:
```
added XXX packages, and audited XXX packages in XXs
```

#### 2단계: Prisma 설치 확인

```powershell
npx prisma --version
```

성공 시 출력:
```
prisma                  : 5.8.0
@prisma/client          : 5.8.0
```

#### 3단계: Prisma 클라이언트 생성

```powershell
npm run prisma:generate
```

또는

```powershell
npx prisma generate
```

#### 4단계: 데이터베이스 마이그레이션

```powershell
npm run prisma:migrate
```

또는

```powershell
npx prisma migrate dev --name add_phone_to_user
```

마이그레이션 이름 입력 프롬프트가 나타나면:
```
Enter a name for the new migration: › add_phone_to_user
```

## 전체 설정 순서

### 1. PostgreSQL 설치 및 실행

#### Windows에서 PostgreSQL 설치
```powershell
# Chocolatey로 설치
choco install postgresql

# 또는 공식 사이트에서 다운로드
# https://www.postgresql.org/download/windows/
```

#### PostgreSQL 서비스 시작
```powershell
# 서비스 상태 확인
Get-Service -Name postgresql*

# 서비스 시작
Start-Service postgresql*
```

### 2. 데이터베이스 생성

```powershell
# PostgreSQL 접속
psql -U postgres

# 데이터베이스 생성
CREATE DATABASE postfnb_alba;

# 확인
\l

# 종료
\q
```

### 3. 환경 변수 설정

`server/.env` 파일 생성:

```powershell
cd server
Copy-Item .env.example .env
```

`.env` 파일 편집:
```env
PORT=3000
NODE_ENV=development

# PostgreSQL 연결 문자열
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/postfnb_alba

# JWT 시크릿 (랜덤 문자열로 변경)
JWT_ACCESS_SECRET=your-super-secret-access-key-change-this
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this

# 클라이언트 URL
CLIENT_URL=http://localhost:5173
```

**중요**: `your_password`를 실제 PostgreSQL 비밀번호로 변경하세요.

### 4. 서버 패키지 설치

```powershell
cd server
npm install
```

### 5. Prisma 설정

```powershell
# Prisma 클라이언트 생성
npm run prisma:generate

# 데이터베이스 마이그레이션
npm run prisma:migrate
# 마이그레이션 이름: add_phone_to_user

# 시드 데이터 생성 (테스트 계정)
npm run prisma:seed
```

### 6. 서버 실행

```powershell
npm run dev
```

성공 시 출력:
```
🚀 서버가 포트 3000에서 실행 중입니다.
📍 API: http://localhost:3000
🏥 Health Check: http://localhost:3000/health
🌍 환경: development
```

## 자주 발생하는 오류

### 오류 1: "Can't reach database server"

**원인**: PostgreSQL이 실행되지 않음

**해결**:
```powershell
# PostgreSQL 서비스 시작
Start-Service postgresql*

# 또는 재시작
Restart-Service postgresql*
```

### 오류 2: "Environment variable not found: DATABASE_URL"

**원인**: `.env` 파일이 없거나 DATABASE_URL이 설정되지 않음

**해결**:
```powershell
# .env 파일 생성
Copy-Item .env.example .env

# .env 파일 편집하여 DATABASE_URL 설정
```

### 오류 3: "Authentication failed"

**원인**: PostgreSQL 비밀번호가 틀림

**해결**:
```env
# .env 파일에서 비밀번호 확인
DATABASE_URL=postgresql://postgres:올바른_비밀번호@localhost:5432/postfnb_alba
```

### 오류 4: "Database 'postfnb_alba' does not exist"

**원인**: 데이터베이스가 생성되지 않음

**해결**:
```powershell
# PostgreSQL 접속
psql -U postgres

# 데이터베이스 생성
CREATE DATABASE postfnb_alba;
\q
```

### 오류 5: "Prisma Client did not initialize yet"

**원인**: Prisma 클라이언트가 생성되지 않음

**해결**:
```powershell
npm run prisma:generate
```

## Prisma 유용한 명령어

### Prisma Studio (DB GUI)
```powershell
npm run prisma:studio
```
브라우저에서 http://localhost:5555 접속

### 마이그레이션 상태 확인
```powershell
npx prisma migrate status
```

### 마이그레이션 리셋 (주의: 모든 데이터 삭제)
```powershell
npx prisma migrate reset
```

### 데이터베이스 스키마 확인
```powershell
npx prisma db pull
```

### 스키마 포맷팅
```powershell
npx prisma format
```

## 빠른 설정 스크립트

전체 설정을 한 번에 실행:

```powershell
# server 디렉토리에서
cd server

# 1. 패키지 설치
npm install

# 2. 환경 변수 설정
Copy-Item .env.example .env
Write-Host "⚠️ .env 파일을 편집하여 DATABASE_URL을 설정하세요!" -ForegroundColor Yellow
pause

# 3. Prisma 설정
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed

# 4. 서버 실행
npm run dev
```

## 검증 체크리스트

설정이 올바르게 되었는지 확인:

- [ ] PostgreSQL 서비스 실행 중
- [ ] `postfnb_alba` 데이터베이스 생성됨
- [ ] `server/.env` 파일 존재
- [ ] `DATABASE_URL` 올바르게 설정됨
- [ ] `npm install` 완료
- [ ] `npx prisma --version` 실행됨
- [ ] `npm run prisma:generate` 완료
- [ ] `npm run prisma:migrate` 완료
- [ ] `npm run prisma:seed` 완료
- [ ] `npm run dev` 실행됨
- [ ] http://localhost:3000/health 접속 성공

## 도움말

### PostgreSQL 비밀번호 찾기

PostgreSQL 설치 시 설정한 비밀번호를 잊었다면:

1. **Windows 서비스에서 PostgreSQL 재설정**
2. **또는 pgAdmin에서 비밀번호 변경**

### 완전 초기화

모든 것을 처음부터 다시 시작:

```powershell
# 1. node_modules 삭제
cd server
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json

# 2. 패키지 재설치
npm install

# 3. Prisma 재설정
npm run prisma:generate
npx prisma migrate reset
npm run prisma:seed

# 4. 서버 실행
npm run dev
```
