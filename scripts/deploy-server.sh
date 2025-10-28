#!/bin/bash
set -e

CLUSTER_NAME="postfnb-cluster"
SERVICE_NAME="postfnb-server"
REGION="ap-northeast-2"

echo "🚀 Updating ECS service..."
aws ecs update-service \
  --cluster $CLUSTER_NAME \
  --service $SERVICE_NAME \
  --force-new-deployment \
  --region $REGION

echo "⏳ Waiting for deployment to complete..."
aws ecs wait services-stable \
  --cluster $CLUSTER_NAME \
  --services $SERVICE_NAME \
  --region $REGION

echo "✅ Server deployment completed!"