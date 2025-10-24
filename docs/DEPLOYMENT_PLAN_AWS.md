# AWS 배포 설계서 (alba.andonggalbi.com, ap-northeast-2)

- 도메인: alba.andonggalbi.com
- 리전: Asia Pacific (Seoul) ap-northeast-2
- 아키텍처: ECS Fargate(백엔드) + ALB + RDS(PostgreSQL) + S3/CloudFront(프론트) + Route53 + ACM + Secrets Manager + CloudWatch

## 1. 아키텍처 개요

- 백엔드: ECS Fargate 서비스 (컨테이너) → ALB(HTTPS) 뒤에서 동작
- 데이터베이스: Amazon RDS for PostgreSQL (프라이빗 서브넷)
- 프론트엔드: S3 정적 호스팅 + CloudFront CDN (OAC로 S3 프라이빗 접근)
- 도메인/SSL: Route53 레코드, ACM(서울/버지니아) 인증서
- 보안/비밀: VPC 분할 서브넷, 보안그룹 최소허용, Secrets Manager
- 관측: CloudWatch Logs/지표/알람

```mermaid
flowchart TD
  User((User)) --> CF[CloudFront: alba.andonggalbi.com]
  CF -- OAC --> S3[S3 Private Bucket: web-static]
  User -->|API| ALB[ALB: api.alba.andonggalbi.com]
  ALB --> ECS[ECS Fargate Service]
  ECS --> RDS[(RDS PostgreSQL)]
  ECS --> CW[CloudWatch Logs]
  ECS --> SM[Secrets Manager]

  