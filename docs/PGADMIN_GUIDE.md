# pgAdmin에서 데이터 확인하는 방법

## 1. pgAdmin 접속

1. pgAdmin 실행
2. 왼쪽 패널에서 서버 확장

## 2. 데이터베이스 연결 확인

### 서버 연결 정보
- **Host**: localhost
- **Port**: 5432
- **Database**: postfnb_alba
- **Username**: postgres (또는 설정한 사용자명)
- **Password**: 설정한 비밀번호

### 연결 단계
```
Servers
  └─ PostgreSQL 16 (또는 설치된 버전)
      └─ Databases
          └─ postfnb_alba  ← 이 데이터베이스를 찾으세요
```

## 3. 테이블 확인 방법

### 경로
```
postfnb_alba
  └─ Schemas
      └─ public
          └─ Tables
              ├─ User          ← 사용자 테이블
              └─ RefreshToken  ← 리프레시 토큰 테이블
```

### User 테이블 데이터 보기

1. **방법 1: 우클릭 메뉴**
   - `User` 테이블 우클릭
   - `View/Edit Data` → `All Rows` 선택

2. **방법 2: SQL 쿼리**
   - `postfnb_alba` 데이터베이스 우클릭
   - `Query Tool` 선택
   - 다음 쿼리 실행:
   ```sql
   SELECT * FROM "User";
   ```

3. **방법 3: 특정 컬럼만 보기**
   ```sql
   SELECT id, email, name, phone, role, provider, "createdAt", "lastLoginAt"
   FROM "User"
   ORDER BY "createdAt" DESC;
   ```

## 4. 현재 등록된 사용자 (2025-10-02 기준)

총 **4명**의 사용자가 등록되어 있습니다:

### 1. 관리자 (ADMIN)
- **이메일**: admin@postfnb.com
- **전화번호**: 010-1234-5678
- **가입일**: 2025-10-01
- **마지막 로그인**: 2025-10-02 11:17:29

### 2. 매니저 (MANAGER)
- **이메일**: manager@postfnb.com
- **전화번호**: 010-2345-6789
- **가입일**: 2025-10-01

### 3. 직원 (EMPLOYEE)
- **이메일**: employee@postfnb.com
- **전화번호**: 010-3456-7890
- **가입일**: 2025-10-01

### 4. 박찬호 (EMPLOYEE)
- **이메일**: chan5@naver.com
- **전화번호**: 010-2596-3159
- **가입일**: 2025-10-01
- **마지막 로그인**: 2025-10-02 10:10:35

## 5. 문제 해결

### 테이블이 안 보이는 경우

1. **새로고침**
   - `Tables` 폴더 우클릭 → `Refresh` 선택

2. **스키마 확인**
   - `public` 스키마가 확장되어 있는지 확인
   - 다른 스키마에 테이블이 있을 수 있음

3. **데이터베이스 재연결**
   - 서버 우클릭 → `Disconnect`
   - 다시 우클릭 → `Connect`

4. **권한 확인**
   ```sql
   -- 현재 사용자 확인
   SELECT current_user;
   
   -- 테이블 목록 확인
   SELECT tablename FROM pg_tables WHERE schemaname = 'public';
   ```

### 데이터가 안 보이는 경우

1. **필터 확인**
   - View/Edit Data 창에서 필터가 적용되어 있는지 확인

2. **쿼리로 직접 확인**
   ```sql
   -- 사용자 수 확인
   SELECT COUNT(*) FROM "User";
   
   -- 모든 사용자 조회
   SELECT * FROM "User";
   ```

3. **트랜잭션 확인**
   - 커밋되지 않은 트랜잭션이 있는지 확인
   - Query Tool에서 `COMMIT;` 실행

## 6. 유용한 SQL 쿼리

### 사용자 통계
```sql
-- 역할별 사용자 수
SELECT role, COUNT(*) as count
FROM "User"
GROUP BY role;

-- 로그인 방식별 사용자 수
SELECT provider, COUNT(*) as count
FROM "User"
GROUP BY provider;
```

### 최근 가입 사용자
```sql
SELECT name, email, role, "createdAt"
FROM "User"
ORDER BY "createdAt" DESC
LIMIT 10;
```

### 최근 로그인 사용자
```sql
SELECT name, email, "lastLoginAt"
FROM "User"
WHERE "lastLoginAt" IS NOT NULL
ORDER BY "lastLoginAt" DESC
LIMIT 10;
```

## 7. 데이터베이스 백업

### 백업 생성
1. `postfnb_alba` 데이터베이스 우클릭
2. `Backup...` 선택
3. 파일명 지정 후 `Backup` 클릭

### 복원
1. `postfnb_alba` 데이터베이스 우클릭
2. `Restore...` 선택
3. 백업 파일 선택 후 `Restore` 클릭

## 8. 문제가 계속되는 경우

명령어로 직접 확인:
```bash
# 서버 디렉토리에서 실행
cd d:\windsurf\postfnb_alba\server
npx ts-node src/scripts/listUsers.ts
```

이 스크립트는 데이터베이스에 직접 연결하여 사용자 목록을 보여줍니다.
