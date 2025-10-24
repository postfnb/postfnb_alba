# 테스트 계정 정보

## 로그인 테스트용 계정

### 관리자 (ADMIN)
- **이메일**: admin@postfnb.com
- **비밀번호**: admin123!
- **전화번호**: 010-1234-5678

### 매니저 (MANAGER)
- **이메일**: manager@postfnb.com
- **비밀번호**: manager123!
- **전화번호**: 010-2345-6789

### 직원 (EMPLOYEE)
- **이메일**: employee@postfnb.com
- **비밀번호**: employee123!
- **전화번호**: 010-3456-7890

## 로그인 테스트 방법

1. 프론트엔드 서버 실행: http://localhost:5173
2. 백엔드 서버 실행: http://localhost:3000
3. 위 계정 중 하나로 로그인
4. 로그인 성공 시 Dashboard로 자동 이동

## 디버깅

브라우저 콘솔(F12)에서 다음 로그를 확인하세요:
- `[AuthStore] 로그인 시작`
- `[AuthStore] 로그인 응답 받음`
- `[AuthStore] 인증 상태 업데이트 완료`
- `[ProtectedRoute] 상태`
- `로그인 성공, dashboard로 이동`

## 문제 해결

### 로그인 후 Dashboard로 이동하지 않는 경우
1. 브라우저 콘솔에서 에러 확인
2. 네트워크 탭에서 API 응답 확인
3. localStorage에 accessToken이 저장되었는지 확인
4. 백엔드 서버가 정상 실행 중인지 확인
