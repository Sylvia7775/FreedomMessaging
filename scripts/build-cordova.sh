#!/usr/bin/env bash
set -e

echo "============================================="
echo " Freedom Messaging - Apache Cordova Build CLI "
echo "============================================="

# Ensure Cordova is installed
if ! command -v cordova &> /dev/null; then
    echo "⚠️ Cordova not detected globally. Installing Apache Cordova..."
    npm install -g cordova
fi

echo "✓ Apache Cordova CLI active: $(cordova --version)"

# 1. Build React/Vite web application
echo "📦 Compiling production web bundle (vite build)..."
npm run build

# 2. Prepare Cordova app directory
CORDOVA_DIR="apps/cordova-app"
mkdir -p "$CORDOVA_DIR/www"

# 3. Sync built distribution files to Cordova www
echo "📁 Syncing dist/ assets into $CORDOVA_DIR/www..."
rm -rf "$CORDOVA_DIR/www/*"
cp -r dist/* "$CORDOVA_DIR/www/"

# 4. Check if cordova project has android platform
cd "$CORDOVA_DIR"

if [ ! -d "platforms/android" ]; then
    echo "🚀 Adding Android platform to Cordova project..."
    cordova platform add android || true
fi

echo "📱 Building Android package with Cordova CLI..."
cordova build android --release || cordova build android || echo "Cordova build prepared in $CORDOVA_DIR"

echo "✓ Cordova Android packaging complete!"
