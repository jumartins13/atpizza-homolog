# 🤖 Automação de Atualizações Android

Este projeto possui scripts automáticos para atualizar o app Android sempre que você fizer deploy na Vercel.

## 🚀 Scripts Disponíveis

### 1. Atualização Rápida (Recomendado)
```bash
npm run android:quick
```
**O que faz:**
- ✅ Build do Angular
- ✅ Sync com Capacitor
- ✅ Incrementa versão automaticamente
- ✅ Abre Android Studio

### 2. Atualização Completa
```bash
npm run update:android
```
**O que faz:**
- ✅ Build do Angular
- ✅ Sync com Capacitor  
- ✅ Incrementa versão
- ✅ Commit automático
- ✅ Log colorido completo

### 3. Atualização + Push
```bash
npm run update:android:push
```
**O que faz:**
- ✅ Tudo da atualização completa
- ✅ Git push automático

### 4. Apenas Sync
```bash
npm run android:sync
```
**O que faz:**
- ✅ Build + Capacitor sync (sem incrementar versão)

### 5. Abrir Android Studio
```bash
npm run android:open
```

## 🔄 Fluxo de Atualização

### Passo a Passo Manual:
1. **Faça mudanças no código Angular**
2. **Deploy na Vercel** (automático via git push)
3. **Execute:** `npm run android:quick`
4. **No Android Studio:** Build → Generate Signed Bundle/APK
5. **Upload na Play Console**

### Passo a Passo Automático (GitHub Actions):
1. **Faça mudanças no código Angular**
2. **Git push para main**
3. **GitHub Actions faz tudo automaticamente:**
   - Build Angular
   - Sync Capacitor
   - Incrementa versão
   - Gera AAB
   - Cria release no GitHub
4. **Baixe o AAB dos artifacts**
5. **Upload na Play Console**

## 📱 Versioning

O script incrementa automaticamente:
- **versionCode**: 1 → 2 → 3...
- **versionName**: 1.0 → 1.1 → 1.2...

## 🔐 Keystore

**IMPORTANTE:** Sempre use a mesma keystore:
- **Arquivo:** `atpizza-release.jks` 
- **Local:** Desktop ou pasta segura
- **Backup:** Guarde em local seguro!

## 🎯 Arquivo de Configuração

Os scripts estão em:
- `/scripts/update-android.sh` - Script completo
- `/update-android-quick.sh` - Script rápido
- `/.github/workflows/auto-update-android.yml` - GitHub Actions

## 🔥 Firebase

O Firebase já está integrado! Mudanças na web aparecem instantaneamente no Android.

## 🛠️ Troubleshooting

### Erro de permissão:
```bash
chmod +x scripts/update-android.sh
chmod +x update-android-quick.sh
```

### Android Studio não abre:
```bash
export CAPACITOR_ANDROID_STUDIO_PATH="/Applications/Android Studio.app"
```

### Gradle error:
```bash
cd android && ./gradlew clean
```

## 💡 Dicas

- Use `android:quick` para atualizações rápidas
- Use `update:android:push` para automatizar git push
- Mantenha backup da keystore sempre!
- Firebase sincroniza dados automaticamente
- Versão incrementa automaticamente

---

🎾 **ATPizza - Powered by Claude Code**