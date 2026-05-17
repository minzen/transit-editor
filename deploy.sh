#!/bin/bash

# Deployment script for transit-editor
# Load environment variables from .env file if it exists
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Configure these variables for your VPS
# These can be set in .env file instead of here
VPS_USER="${VPS_USER:-your_username}"
VPS_HOST="${VPS_HOST:-your_vps_ip_or_domain}"
VPS_PATH="${VPS_PATH:-/opt/transit-editor}"

# Optional: If you want to build locally and push the image
# LOCAL_BUILD=true

# Optional: If you want to build on the VPS
REMOTE_BUILD=true

# Get version from Git tags or commit hash
VERSION=$(git describe --tags --always 2>/dev/null || echo "latest")
BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ')

echo "🚀 Starting deployment to $VPS_USER@$VPS_HOST..."
echo "🏷️  Version: $VERSION"
echo "📅 Build date: $BUILD_DATE"

if [ "$REMOTE_BUILD" = true ]; then
    echo "📦 Copying files to VPS..."
    # Use tar with exclusions instead of rsync for better compatibility
    tar --exclude='node_modules' \
        --exclude='.git' \
        --exclude='dist' \
        --exclude='.env' \
        -czf - . | ssh $VPS_USER@$VPS_HOST "cd $VPS_PATH && tar -xzf -"

    echo "🔨 Building Docker image on VPS..."
    ssh $VPS_USER@$VPS_HOST "cd $VPS_PATH && VERSION=$VERSION BUILD_DATE=$BUILD_DATE docker compose build"

    echo "🔄 Restarting services on VPS..."
    ssh $VPS_USER@$VPS_HOST "cd $VPS_PATH && VERSION=$VERSION docker compose up -d --force-recreate"
else
    echo "🔨 Building Docker image locally..."
    docker-compose build

    echo "📤 Pushing image to VPS..."
    # Note: This requires setting up a registry or using docker save/load
    # For simplicity, we'll use the remote build approach
    echo "⚠️  Local build not configured, using remote build instead"
    tar --exclude='node_modules' \
        --exclude='.git' \
        --exclude='dist' \
        --exclude='.env' \
        -czf - . | ssh $VPS_USER@$VPS_HOST "cd $VPS_PATH && tar -xzf -"

    echo "🔨 Building Docker image on VPS..."
    ssh $VPS_USER@$VPS_HOST "cd $VPS_PATH && VERSION=$VERSION BUILD_DATE=$BUILD_DATE docker compose build"

    echo "🔄 Restarting services on VPS..."
    ssh $VPS_USER@$VPS_HOST "cd $VPS_PATH && VERSION=$VERSION docker compose up -d --force-recreate"
fi

echo "✅ Deployment complete!"
echo "🌐 Your app should be available at http://$VPS_HOST"
