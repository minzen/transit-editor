#!/bin/bash

# Deployment script for transit-editor
# Configure these variables for your VPS

VPS_USER="your_username"
VPS_HOST="your_vps_ip_or_domain"
VPS_PATH="/opt/transit-editor"

# Optional: If you want to build locally and push the image
# LOCAL_BUILD=true

# Optional: If you want to build on the VPS
REMOTE_BUILD=true

echo "🚀 Starting deployment to $VPS_USER@$VPS_HOST..."

if [ "$REMOTE_BUILD" = true ]; then
    echo "📦 Copying files to VPS..."
    rsync -avz --exclude 'node_modules' --exclude 'dist' --exclude '.git' \
        ./ $VPS_USER@$VPS_HOST:$VPS_PATH/

    echo "🔨 Building Docker image on VPS..."
    ssh $VPS_USER@$VPS_HOST "cd $VPS_PATH && docker-compose build"

    echo "🔄 Restarting services on VPS..."
    ssh $VPS_USER@$VPS_HOST "cd $VPS_PATH && docker-compose up -d --force-recreate"
else
    echo "🔨 Building Docker image locally..."
    docker-compose build

    echo "📤 Pushing image to VPS..."
    # Note: This requires setting up a registry or using docker save/load
    # For simplicity, we'll use the remote build approach
    echo "⚠️  Local build not configured, using remote build instead"
    rsync -avz --exclude 'node_modules' --exclude 'dist' --exclude '.git' \
        ./ $VPS_USER@$VPS_HOST:$VPS_PATH/

    echo "🔨 Building Docker image on VPS..."
    ssh $VPS_USER@$VPS_HOST "cd $VPS_PATH && docker-compose build"

    echo "🔄 Restarting services on VPS..."
    ssh $VPS_USER@$VPS_HOST "cd $VPS_PATH && docker-compose up -d --force-recreate"
fi

echo "✅ Deployment complete!"
echo "🌐 Your app should be available at http://$VPS_HOST"
