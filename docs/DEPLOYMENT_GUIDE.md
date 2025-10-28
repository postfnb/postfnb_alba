# 배포 가이드

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