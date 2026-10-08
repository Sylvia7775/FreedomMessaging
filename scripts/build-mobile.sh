#!/usr/bin/env bash
set -e

# Navigate to the mobile app directory
cd apps/mobile

# Install mobile dependencies
npm install

# Trigger EAS Android build
npx eas build --platform android
