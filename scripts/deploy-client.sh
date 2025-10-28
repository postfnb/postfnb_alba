#!/bin/bash
set -e

BUCKET_NAME="alba-andonggalbi-web-prod"
DISTRIBUTION_ID="E1234567890ABC"

echo "🚀 Deploying to S3..."
aws s3 sync client/dist/ s3://$BUCKET_NAME --delete

echo "🔄 Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*"

echo "✅ Client deployment completed!"