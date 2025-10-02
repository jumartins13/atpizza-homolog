#!/bin/bash

# Script para atualizar app Android após deploy na Vercel
# Author: Claude Code
# Usage: ./scripts/update-android.sh

set -e  # Para em caso de erro

echo "🎾 ATPizza - Atualizando versão Android..."

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para log colorido
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    error "Execute este script na raiz do projeto ATPizza"
fi

log "Verificando dependências..."

# Verificar se o Capacitor está instalado
if ! command -v npx cap &> /dev/null; then
    error "Capacitor CLI não encontrado. Execute: npm install -g @capacitor/cli"
fi

# Verificar se o Android Studio/SDK está configurado
if [ ! -d "android" ]; then
    error "Pasta android não encontrada. Execute 'npx cap add android' primeiro"
fi

# 1. Build do Angular
log "Building Angular app..."
npm run build || error "Falha no build do Angular"
success "✅ Angular build completo"

# 2. Sync com Capacitor
log "Sincronizando com Capacitor Android..."
npx cap sync android || error "Falha no sync do Capacitor"
success "✅ Capacitor sync completo"

# 3. Incrementar versão automaticamente
log "Incrementando versão do app..."

# Ler versão atual do build.gradle
BUILD_GRADLE="android/app/build.gradle"
CURRENT_VERSION=$(grep "versionCode" $BUILD_GRADLE | grep -o '[0-9]\+')
CURRENT_NAME=$(grep "versionName" $BUILD_GRADLE | grep -o '"[^"]*"' | tr -d '"')

NEW_VERSION=$((CURRENT_VERSION + 1))
NEW_NAME=$(echo $CURRENT_NAME | awk -F. '{$NF = $NF + 0.1; print}' | sed 's/\.0/.1/')

log "Versão atual: $CURRENT_VERSION ($CURRENT_NAME)"
log "Nova versão: $NEW_VERSION ($NEW_NAME)"

# Atualizar build.gradle
sed -i.bak "s/versionCode $CURRENT_VERSION/versionCode $NEW_VERSION/" $BUILD_GRADLE
sed -i.bak "s/versionName \"$CURRENT_NAME\"/versionName \"$NEW_NAME\"/" $BUILD_GRADLE

# Remover backup
rm $BUILD_GRADLE.bak

success "✅ Versão incrementada para $NEW_VERSION ($NEW_NAME)"

# 4. Commit automático das mudanças
log "Commitando mudanças..."
git add .
git commit -m "🤖 Auto-update Android version to $NEW_NAME

- Angular build updated
- Capacitor sync completed  
- Version bumped: $CURRENT_VERSION → $NEW_VERSION

🎾 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>" || warning "Nenhuma mudança para commit"

# 5. Push para repositório (se necessário)
if [ "$1" = "--push" ]; then
    log "Fazendo push das mudanças..."
    git push origin main || warning "Falha no push - verifique se há conflitos"
    success "✅ Push completo"
fi

echo ""
success "🎉 Atualização completa!"
echo ""
echo -e "${YELLOW}📱 PRÓXIMOS PASSOS:${NC}"
echo "1. Abra o Android Studio: npx cap open android"
echo "2. Build → Generate Signed Bundle/APK"  
echo "3. Use a keystore: atpizza-release.jks"
echo "4. Upload na Play Console"
echo ""
echo -e "${BLUE}💡 DICAS:${NC}"
echo "• Use --push para fazer git push automaticamente"
echo "• Versão incrementada automaticamente: $NEW_VERSION"
echo "• Firebase já está integrado!"
echo ""