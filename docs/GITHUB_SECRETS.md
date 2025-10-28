# GitHub Secrets 설정 가이드

Repository Settings → Secrets and variables → Actions에서 다음 시크릿들을 설정하세요.

## Repository Secrets

### AWS 관련
- `AWS_ROLE_ARN`: `arn:aws:iam::ACCOUNT-ID:role/github-actions-role`

### S3/CloudFront 관련
- `S3_BUCKET_NAME`: `alba-andonggalbi-web-prod`
- `CLOUDFRONT_DISTRIBUTION_ID`: CloudFront 배포 ID (예: E1234567890ABC)

### 애플리케이션 환경변수
- `VITE_API_URL`: `https://api-alba.andonggalbi.com`
- `VITE_APP_NAME`: `PostFNB Alba`

## Environment Secrets (production/staging)

각 환경별로 다른 값을 설정할 수 있습니다:

### Production Environment
- `VITE_API_URL`: `https://api-alba.andonggalbi.com`
- `S3_BUCKET_NAME`: `alba-andonggalbi-web-prod`

### Staging Environment
- `VITE_API_URL`: `https://api-staging-alba.andonggalbi.com`
- `S3_BUCKET_NAME`: `alba-andonggalbi-web-staging`