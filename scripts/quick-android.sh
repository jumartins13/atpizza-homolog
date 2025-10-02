#!/bin/bash

echo "🚀 Quick Android Build & Install"

# 1. Build Angular
echo "📦 Building Angular app..."
npm run build

# 2. Sync with Capacitor  
echo "🔄 Syncing with Capacitor..."
npx cap sync android

# 3. Build APK (background)
echo "🏗️ Building APK..."
cd android
./gradlew assembleDebug

# 4. Show APK location
echo "✅ APK ready at:"
echo "$(pwd)/app/build/outputs/apk/debug/app-debug.apk"

# 5. Try to install if device connected
if command -v adb &> /dev/null; then
    echo "📱 Checking for connected devices..."
    if adb devices | grep -q device; then
        echo "🔧 Installing APK..."
        adb install -r app/build/outputs/apk/debug/app-debug.apk
        echo "✅ APK installed! Launch ATPizza on your device."
    else
        echo "📱 No device connected. Install APK manually."
    fi
else
    echo "📱 ADB not found. Install APK manually."
fi