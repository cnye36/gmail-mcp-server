#!/bin/bash

# Gmail MCP Server Deployment Script
# Usage: ./scripts/deploy.sh [environment]

set -e

ENVIRONMENT=${1:-production}
IMAGE_NAME="gmail-mcp-server"
CONTAINER_NAME="gmail-mcp-server"

echo "🚀 Deploying Gmail MCP Server to $ENVIRONMENT environment..."

# Stop and remove existing container if it exists
if [ "$(docker ps -aq -f name=$CONTAINER_NAME)" ]; then
    echo "📦 Stopping existing container..."
    docker stop $CONTAINER_NAME || true
    docker rm $CONTAINER_NAME || true
fi

# Remove old image if it exists
if [ "$(docker images -q $IMAGE_NAME)" ]; then
    echo "🗑️  Removing old image..."
    docker rmi $IMAGE_NAME || true
fi

# Build new image
echo "🔨 Building new image..."
docker build -t $IMAGE_NAME .

# Start the new container
echo "🚀 Starting new container..."
docker-compose up -d

# Show container status
echo "📊 Container status:"
docker ps | grep $CONTAINER_NAME

# Show logs
echo "📋 Recent logs:"
docker-compose logs --tail=20 gmail-mcp-server

echo "✅ Deployment completed!"
echo "🌐 Server should be available at http://localhost:8080/mcp"
echo "📊 Check health: curl http://localhost:8080/mcp" 