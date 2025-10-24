# PostgreSQL 설치 가이드 (Windows)

## 🎯 PostgreSQL이 필요한 이유

PostFNB Alba 프로젝트는 PostgreSQL 데이터베이스를 사용합니다.
- 사용자 정보 저장
- 인증 토큰 관리
- 근무 기록 저장 (향후)

## 📦 설치 방법

### 방법 1: 공식 인스톨러 (권장)

#### 1단계: 다운로드

1. 브라우저에서 접속: https://www.postgresql.org/download/windows/
2. "Download the installer" 클릭
3. 최신 버전 선택 (PostgreSQL 16.x 권장)
4. Windows x86-64 다운로드

#### 2단계: 설치

1. 다운로드한 `.exe` 파일 실행
2. 설치 마법사 진행:

**구성 요소 선택**
- ✅ PostgreSQL Server (필수)
- ✅ pgAdmin 4 (GUI 도구, 권장)
- ✅ Command Line Tools (필수)
- ⬜ Stack Builder (선택)

**데이터 디렉토리**
- 기본값 사용: `C:\Program Files\PostgreSQL\16\data`

**비밀번호 설정** ⚠️ 중요!
- postgres 슈퍼유저 비밀번호 입력
- **이 비밀번호를 반드시 기억하세요!**
- 예: `post8003` (실제로는 더 강력한 비밀번호 사용)

**포트 설정**
- 기본값 사용: `5432`

**로케일**
- 기본값 사용 또는 `Korean, Korea` 선택

3. "Next" → "Next" → "Finish"

#### 3단계: 환경 변수 설정

PostgreSQL 명령어를 어디서나 사용하려면:

1. **시스템 환경 변수 편집**
   - Windows 검색: "환경 변수"
   - "시스템 환경 변수 편집" 클릭

2. **Path 편집**
   - "환경 변수" 버튼 클릭
   - "시스템 변수"에서 "Path" 선택
   - "편집" 클릭
   - "새로 만들기" 클릭
   - 추가: `C:\Program Files\PostgreSQL\16\bin`
   - "확인" 클릭

3. **PowerShell 재시작**
   - 모든 PowerShell 창 닫기
   - 새로 열기

#### 4단계: 설치 확인

```powershell
# PostgreSQL 버전 확인
psql --version

# 출력 예시: psql (PostgreSQL) 16.x
```

```powershell
# PostgreSQL 서비스 확인
Get-Service -Name postgresql*

# 출력 예시:
# Status   Name               DisplayName
# ------   ----               -----------
# Running  postgresql-x64-16  postgresql-x64-16 - PostgreSQL Server 16
```

### 방법 2: Chocolatey (개발자용)

Chocolatey가 설치되어 있다면:

```powershell
# 관리자 권한으로 PowerShell 실행
choco install postgresql

# 비밀번호 설정 프롬프트에서 입력
```

### 방법 3: Docker (고급 사용자)

Docker Desktop이 설치되어 있다면:

```powershell
# PostgreSQL 컨테이너 실행
docker run --name postfnb-postgres `
  -e POSTGRES_PASSWORD=postgres123 `
  -e POSTGRES_DB=postfnb_alba `
  -p 5432:5432 `
  -d postgres:16

# 확인
docker ps
```

## 🔧 PostgreSQL 설정

### 1. PostgreSQL 접속

```powershell
# postgres 사용자로 접속
psql -U postgres

# 비밀번호 입력 프롬프트
Password for user postgres: [설치 시 설정한 비밀번호]
```

성공 시:
```
psql (16.x)
Type "help" for help.

postgres=#
```

### 2. 데이터베이스 생성

```sql
-- postfnb_alba 데이터베이스 생성
CREATE DATABASE postfnb_alba;

-- 생성 확인
\l

-- postfnb_alba 데이터베이스로 전환
\c postfnb_alba

-- 종료
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
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/postfnb_alba
```

**형식**: `postgresql://사용자명:비밀번호@호스트:포트/데이터베이스명`

## ✅ 설치 확인 체크리스트

모든 항목이 체크되어야 합니다:

- [ ] PostgreSQL 설치 완료
- [ ] `psql --version` 명령어 실행됨
- [ ] PostgreSQL 서비스 실행 중 (`Get-Service -Name postgresql*`)
- [ ] `psql -U postgres` 접속 성공
- [ ] `postfnb_alba` 데이터베이스 생성됨
- [ ] `server/.env` 파일에 DATABASE_URL 설정됨

## 🚀 다음 단계

PostgreSQL 설치 후:

```powershell
# 1. 서버 디렉토리로 이동
cd server

# 2. 패키지 설치 (아직 안 했다면)
npm install

# 3. Prisma 클라이언트 생성
npm run prisma:generate

# 4. 데이터베이스 마이그레이션
npm run prisma:migrate
# 마이그레이션 이름: make_phone_required

# 5. 시드 데이터 생성 (테스트 계정)
npm run prisma:seed

# 6. 서버 실행
npm run dev
```

## 🔍 자주 발생하는 문제

### 문제 1: "psql 용어가 인식되지 않습니다"

**원인**: 환경 변수 Path에 PostgreSQL bin 경로가 없음

**해결**:
1. 환경 변수에 `C:\Program Files\PostgreSQL\16\bin` 추가
2. PowerShell 재시작
3. `psql --version` 재시도

### 문제 2: "connection refused"

**원인**: PostgreSQL 서비스가 실행되지 않음

**해결**:
```powershell
# 서비스 시작
Start-Service postgresql*

# 또는 서비스 관리자에서 수동 시작
# Windows 검색 → "서비스" → postgresql 찾아서 시작
```

### 문제 3: "password authentication failed"

**원인**: 비밀번호가 틀림

**해결**:
1. 설치 시 설정한 비밀번호 확인
2. `.env` 파일의 DATABASE_URL에서 비밀번호 수정

### 문제 4: "database does not exist"

**원인**: postfnb_alba 데이터베이스가 생성되지 않음

**해결**:
```powershell
psql -U postgres
CREATE DATABASE postfnb_alba;
\q
```

### 문제 5: "port 5432 already in use"

**원인**: 다른 프로그램이 5432 포트 사용 중

**해결**:
```powershell
# 포트 사용 확인
netstat -ano | findstr :5432

# 프로세스 종료
taskkill /PID [PID번호] /F

# 또는 PostgreSQL을 다른 포트로 설정
```

## 🛠️ 유용한 PostgreSQL 명령어

### psql 명령어

```sql
-- 데이터베이스 목록
\l

-- 데이터베이스 전환
\c database_name

-- 테이블 목록
\dt

-- 테이블 구조 확인
\d table_name

-- 사용자 목록
\du

-- 종료
\q
```

### 서비스 관리 (PowerShell)

```powershell
# 서비스 상태 확인
Get-Service -Name postgresql*

# 서비스 시작
Start-Service postgresql*

# 서비스 중지
Stop-Service postgresql*

# 서비스 재시작
Restart-Service postgresql*
```

## 📚 추가 리소스

- **공식 문서**: https://www.postgresql.org/docs/
- **pgAdmin 4**: PostgreSQL GUI 관리 도구
- **DBeaver**: 범용 데이터베이스 클라이언트

## 🎓 pgAdmin 4 사용법

PostgreSQL과 함께 설치된 pgAdmin 4를 사용하면 GUI로 데이터베이스를 관리할 수 있습니다:

1. **pgAdmin 4 실행**
   - Windows 검색: "pgAdmin 4"

2. **서버 연결**
   - Servers → PostgreSQL 16 → 우클릭 → Connect Server
   - 비밀번호 입력

3. **데이터베이스 생성**
   - Databases → 우클릭 → Create → Database
   - Database: `postfnb_alba`
   - Save

4. **쿼리 실행**
   - postfnb_alba → 우클릭 → Query Tool
   - SQL 쿼리 입력 후 실행

## 💡 개발 팁

### 데이터베이스 백업

```powershell
# 백업
pg_dump -U postgres postfnb_alba > backup.sql

# 복원
psql -U postgres postfnb_alba < backup.sql
```

### 데이터베이스 초기화

```powershell
# 데이터베이스 삭제 후 재생성
psql -U postgres
DROP DATABASE postfnb_alba;
CREATE DATABASE postfnb_alba;
\q

# Prisma 마이그레이션 재실행
cd server
npm run prisma:migrate
npm run prisma:seed
```

---

**설치 완료 후 이 문서의 "다음 단계"를 따라 프로젝트를 계속 진행하세요!**
