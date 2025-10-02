#!/usr/bin/env python3
"""
Script para converter PNG com transparência para PNG com fundo preto sólido
Remove o canal alpha e força fundo preto
"""

from PIL import Image
import os

def fix_icon_transparency(input_path, output_path):
    """Remove transparência e força fundo preto"""
    try:
        # Abre a imagem
        img = Image.open(input_path)
        print(f"Imagem original: {img.mode}, {img.size}")
        
        # Se tem transparência (RGBA), converte para RGB com fundo preto
        if img.mode in ('RGBA', 'LA'):
            # Cria uma nova imagem com fundo preto
            background = Image.new('RGB', img.size, (0, 0, 0))  # Preto sólido
            
            # Se tem canal alpha, usa ele para compor
            if img.mode == 'RGBA':
                background.paste(img, mask=img.split()[-1])  # Usa canal alpha como máscara
            else:
                background.paste(img)
            
            img = background
        
        # Garante que está em RGB (sem transparência)
        if img.mode != 'RGB':
            img = img.convert('RGB')
            
        # Salva sem transparência
        img.save(output_path, 'PNG', optimize=True)
        print(f"✅ Ícone corrigido salvo em: {output_path}")
        
        # Verifica o resultado
        result = Image.open(output_path)
        print(f"Resultado: {result.mode}, {result.size}")
        
    except Exception as e:
        print(f"❌ Erro: {e}")

# Caminhos dos ícones
icon_paths = [
    "public/icons/apple-touch-icon.png",
    "public/icons/icon-512x512.png", 
    "public/icons/icon-192x192.png",
    "public/icons/icon-384x384.png",
    "public/icons/icon-152x152.png",
    "public/icons/icon-144x144.png",
    "public/icons/icon-128x128.png",
    "public/icons/icon-96x96.png",
    "public/icons/icon-72x72.png"
]

print("🔧 Corrigindo transparência dos ícones...")

for path in icon_paths:
    if os.path.exists(path):
        print(f"\n📸 Processando: {path}")
        # Cria backup
        backup_path = path.replace('.png', '_backup.png')
        os.rename(path, backup_path)
        
        # Corrige transparência
        fix_icon_transparency(backup_path, path)
        
        # Remove backup se deu certo
        if os.path.exists(path):
            os.remove(backup_path)
            print(f"✅ {path} corrigido!")
    else:
        print(f"⚠️  Arquivo não encontrado: {path}")

print("\n🎉 Correção de ícones concluída!")
print("Execute 'npm run build && git add . && git commit -m \"Fix icon transparency\" && git push' para aplicar")