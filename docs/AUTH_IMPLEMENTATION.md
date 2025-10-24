# OAuth2 + JWT 인증 구현 요약

## 인증 흐름

### JWT 토큰 전략
- **Access Token**: 15분, API 인증용, 메모리 저장
- **Refresh Token**: 7일, 토큰 갱신용, HttpOnly 쿠키 저장

### 카카오 로그인 흐름
1. 사용자가 "카카오 로그인" 클릭
2. 카카오 인증 페이지로 리다이렉트
3. 인증 완료 후 콜백 URL로 리다이렉트
4. 서버에서 JWT 토큰 발급
5. 클라이언트로 전달

## 필수 패키지

### 백엔드
```bash
npm install passport passport-jwt passport-local passport-kakao jsonwebtoken bcrypt
npm install helmet express-rate-limit cookie-parser
npm install -D @types/passport @types/passport-jwt @types/passport-local @types/jsonwebtoken @types/bcrypt @types/cookie-parser
```

### 프론트엔드
```bash
npm install axios zustand react-router-dom
```

## 카카오 개발자 설정

1. https://developers.kakao.com/ 접속
2. 애플리케이션 생성
3. REST API 키 발급 → `.env`의 `KAKAO_CLIENT_ID`
4. Redirect URI 등록: `http://localhost:3000/api/auth/kakao/callback`
5. 동의 항목 설정 (닉네임, 프로필 사진)

## 환경 변수

```env
# JWT
JWT_ACCESS_SECRET=your-access-token-secret
JWT_REFRESH_SECRET=your-refresh-token-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Kakao
KAKAO_CLIENT_ID=your-kakao-rest-api-key
KAKAO_CLIENT_SECRET=your-kakao-client-secret
KAKAO_CALLBACK_URL=http://localhost:3000/api/auth/kakao/callback

# Client
CLIENT_URL=http://localhost:5173
```

## 주요 엔드포인트

- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `GET /api/auth/kakao` - 카카오 로그인 시작
- `GET /api/auth/kakao/callback` - 카카오 콜백
- `POST /api/auth/refresh` - 토큰 갱신
- `POST /api/auth/logout` - 로그아웃
- `GET /api/auth/me` - 사용자 정보 조회

## 데이터베이스 스키마 핵심

```prisma
model User {
  id           String       @id @default(uuid())
  email        String?      @unique
  password     String?
  name         String
  provider     AuthProvider @default(LOCAL)
  providerId   String?
  refreshTokens RefreshToken[]
}

enum AuthProvider {
  LOCAL
  KAKAO
  GOOGLE
}

model RefreshToken {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  expiresAt DateTime
}
```

## 보안 고려사항

1. **Refresh Token**: HttpOnly 쿠키로 저장 (XSS 방지)
2. **HTTPS**: 프로덕션 환경에서 필수
3. **Rate Limiting**: 무차별 대입 공격 방지
4. **Helmet**: HTTP 헤더 보안 강화
5. **토큰 만료 관리**: DB에서 만료 토큰 정기 삭제

## 다음 단계

- [ ] Passport 전략 구현
- [ ] JWT 유틸리티 함수 작성
- [ ] 인증 라우트 구현
- [ ] 프론트엔드 로그인 페이지 제작
- [ ] Axios 인터셉터 설정
- [ ] 카카오 개발자 콘솔 설정
