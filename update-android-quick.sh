#!/bin/bash

# 🎾 ATPizza - Script rápido de atualização Android
# Execute após fazer deploy na Vercel

echo "🚀 Iniciando atualização Android..."

# Build e sync
npm run build && npx cap sync android

# Incrementar versão
CURRENT=$(grep "versionCode" android/app/build.gradle | grep -o '[0-9]\+')
NEW=$((CURRENT + 1))
sed -i.bak "s/versionCode $CURRENT/versionCode $NEW/" android/app/build.gradle
rm android/app/build.gradle.bak

echo "✅ Versão incrementada: $CURRENT → $NEW"
echo "📱 Abrindo Android Studio..."

# Abrir Android Studio
npx cap open android

echo ""
echo "🎯 AGORA NO ANDROID STUDIO:"
echo "1. Build → Generate Signed Bundle/APK"
echo "2. Usar keystore: atpizza-release.jks" 
echo "3. Upload na Play Console"
echo ""