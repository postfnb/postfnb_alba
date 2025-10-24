-- PostFNB Alba 데이터베이스 쿼리 모음
-- pgAdmin Query Tool에서 실행하세요

-- ========================================
-- 1. 기본 조회
-- ========================================

-- 모든 사용자 조회
SELECT * FROM "User";

-- 사용자 수 확인
SELECT COUNT(*) as total_users FROM "User";

-- 사용자 정보 (비밀번호 제외)
SELECT 
    id,
    email,
    name,
    phone,
    role,
    provider,
    "profileImage",
    "createdAt",
    "updatedAt",
    "lastLoginAt"
FROM "User"
ORDER BY "createdAt" DESC;

-- ========================================
-- 2. 통계 쿼리
-- ========================================

-- 역할별 사용자 수
SELECT 
    role,
    COUNT(*) as count
FROM "User"
GROUP BY role
ORDER BY count DESC;

-- 로그인 방식별 사용자 수
SELECT 
    provider,
    COUNT(*) as count
FROM "User"
GROUP BY provider;

-- 최근 7일간 가입한 사용자
SELECT 
    name,
    email,
    role,
    "createdAt"
FROM "User"
WHERE "createdAt" >= NOW() - INTERVAL '7 days'
ORDER BY "createdAt" DESC;

-- ========================================
-- 3. 사용자 검색
-- ========================================

-- 이메일로 검색
SELECT * FROM "User" WHERE email = 'admin@postfnb.com';

-- 이름으로 검색 (부분 일치)
SELECT * FROM "User" WHERE name LIKE '%관리%';

-- 전화번호로 검색
SELECT * FROM "User" WHERE phone = '010-1234-5678';

-- 역할로 검색
SELECT * FROM "User" WHERE role = 'ADMIN';

-- ========================================
-- 4. 로그인 관련
-- ========================================

-- 최근 로그인한 사용자 (상위 10명)
SELECT 
    name,
    email,
    role,
    "lastLoginAt"
FROM "User"
WHERE "lastLoginAt" IS NOT NULL
ORDER BY "lastLoginAt" DESC
LIMIT 10;

-- 한 번도 로그인하지 않은 사용자
SELECT 
    name,
    email,
    "createdAt"
FROM "User"
WHERE "lastLoginAt" IS NULL;

-- 오늘 로그인한 사용자
SELECT 
    name,
    email,
    "lastLoginAt"
FROM "User"
WHERE DATE("lastLoginAt") = CURRENT_DATE;

-- ========================================
-- 5. RefreshToken 관련
-- ========================================

-- 모든 리프레시 토큰 조회
SELECT * FROM "RefreshToken";

-- 사용자별 활성 토큰 수
SELECT 
    u.name,
    u.email,
    COUNT(rt.id) as token_count
FROM "User" u
LEFT JOIN "RefreshToken" rt ON u.id = rt."userId"
GROUP BY u.id, u.name, u.email
ORDER BY token_count DESC;

-- 만료된 토큰
SELECT * FROM "RefreshToken"
WHERE "expiresAt" < NOW();

-- 만료되지 않은 토큰
SELECT * FROM "RefreshToken"
WHERE "expiresAt" >= NOW();

-- ========================================
-- 6. 데이터 수정 (주의!)
-- ========================================

-- 사용자 역할 변경 (예시)
-- UPDATE "User" SET role = 'MANAGER' WHERE email = 'user@example.com';

-- 사용자 비밀번호 초기화 필요 시 (bcrypt 해시 필요)
-- UPDATE "User" SET password = '$2b$10$...' WHERE email = 'user@example.com';

-- 사용자 삭제 (주의!)
-- DELETE FROM "User" WHERE email = 'user@example.com';

-- ========================================
-- 7. 데이터 정리
-- ========================================

-- 만료된 리프레시 토큰 삭제
DELETE FROM "RefreshToken" WHERE "expiresAt" < NOW();

-- 특정 사용자의 모든 토큰 삭제
-- DELETE FROM "RefreshToken" WHERE "userId" = 'user-id-here';

-- ========================================
-- 8. 테이블 정보
-- ========================================

-- User 테이블 구조 확인
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'User'
ORDER BY ordinal_position;

-- RefreshToken 테이블 구조 확인
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'RefreshToken'
ORDER BY ordinal_position;

-- 인덱스 확인
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ========================================
-- 9. 데이터베이스 상태
-- ========================================

-- 현재 연결된 사용자
SELECT current_user;

-- 현재 데이터베이스
SELECT current_database();

-- 테이블 목록
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public';

-- 테이블별 레코드 수
SELECT 
    'User' as table_name,
    COUNT(*) as row_count
FROM "User"
UNION ALL
SELECT 
    'RefreshToken' as table_name,
    COUNT(*) as row_count
FROM "RefreshToken";
