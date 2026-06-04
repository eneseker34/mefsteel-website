# MefSteel Website Guncelleme Scripti
# Kategori klasorlerinden fotograflari kopyalar, Excel bilgi foylerini okur,
# manifest.json uretir, GitHub push eder -> Vercel otomatik deploy eder

$FOTOLAR = "D:\00 SIRKET DOSYALARI\GENEL SIRKET DOSYALARI\WEB SITESI FOTOLARI"
$WEBSITE  = "C:\mefsteel-website"
$PYTHON   = "C:\Users\Enes\AppData\Local\Programs\Python\Python312\python.exe"

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  MefSteel Website Guncelleniyor..." -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# --- 1. FOTOGRAFLARI KOPYALA ---
Write-Host "[1/4] Fotograflar kopyalaniyor..." -ForegroundColor Green

$KATEGORILER = @("konut","ticari","endustriyel")
$toplam = 0

foreach ($kat in $KATEGORILER) {
    $kaynak = Join-Path $FOTOLAR $kat
    $hedef  = Join-Path $WEBSITE "images\projeler\$kat"

    if (-not (Test-Path $kaynak)) { continue }
    New-Item -ItemType Directory -Force $hedef | Out-Null

    # Alt klasorlerdeki fotograflari da kopyala
    $dosyalar = Get-ChildItem $kaynak -Recurse -File | Where-Object { $_.Extension -in @('.jpg','.jpeg','.png','.webp') }
    foreach ($d in $dosyalar) {
        $hedefDosya = Join-Path $hedef $d.Name
        Copy-Item $d.FullName $hedefDosya -Force
        $toplam++
    }
    Write-Host "   ${kat}: $($dosyalar.Count) fotograf" -ForegroundColor Gray
}

# Kok klasordeki fotograflar (kategorisiz)
$kokDosyalar = Get-ChildItem $FOTOLAR -File | Where-Object { $_.Extension -in @('.jpg','.jpeg','.png','.webp') }
foreach ($d in $kokDosyalar) {
    Copy-Item $d.FullName (Join-Path $WEBSITE "images\projeler\$($d.Name)") -Force
    $toplam++
}

Write-Host "   Toplam: $toplam fotograf kopyalandi." -ForegroundColor Gray

# --- 1b. WEBP DONUSUMU ---
Write-Host ""
Write-Host "[1b/4] WebP donusumu yapiliyor (kucuk dosya boyutu)..." -ForegroundColor Green
$webpScript = @"
import os, subprocess, sys
try:
    from PIL import Image
    HAS_PIL = True
except ImportError:
    HAS_PIL = False

PROJELER = r'C:\mefsteel-website\images\projeler'
donusturulan = 0

if HAS_PIL:
    for kok, klasorler, dosyalar in os.walk(PROJELER):
        for dosya in dosyalar:
            if dosya.lower().endswith(('.jpg','.jpeg','.png')):
                kaynak = os.path.join(kok, dosya)
                hedef  = os.path.splitext(kaynak)[0] + '.webp'
                if not os.path.exists(hedef):
                    try:
                        img = Image.open(kaynak)
                        img.save(hedef, 'WEBP', quality=85, method=6)
                        donusturulan += 1
                    except Exception:
                        pass
    print(f'{donusturulan} fotograf WebP formatina donusturuld.')
else:
    print('PIL yok, WebP donusumu atlandı. pip install Pillow')
"@
$webpScript | & $PYTHON
Write-Host "   WebP donusumu tamamlandi." -ForegroundColor Gray

# --- 2. MANIFEST.JSON OLUSTUR (Excel'den + klasor taramasi) ---
Write-Host ""
Write-Host "[2/4] manifest.json olusturuluyor..." -ForegroundColor Green

$pyScript = @"
import os, json, glob

WEBSITE  = r'C:\mefsteel-website\images\projeler'
FOTOLAR  = r'D:\00 ŞİRKET DOSYALARI\GENEL ŞİRKET DOSYALARI\WEB SİTESİ FOTOLARI'
KATEGORILER = ['konut','ticari','endustriyel']

manifest = []
goruldu = set()

# Excel foylerinden proje bilgilerini oku
try:
    import openpyxl
    for kat in KATEGORILER:
        xlsx = os.path.join(FOTOLAR, kat, f'PROJE_BILGI_FOYU_{kat.upper()}.xlsx')
        if not os.path.exists(xlsx): continue
        wb = openpyxl.load_workbook(xlsx, read_only=True)
        ws = wb.active
        for row in ws.iter_rows(min_row=5, values_only=True):
            if not row[1] or str(row[1]).strip() in ('', '...'): continue
            klasor  = str(row[1]).strip()
            isim    = str(row[2]).strip() if row[2] and str(row[2]).strip() != '...' else klasor
            konum   = str(row[3]).strip() if row[3] and str(row[3]).strip() != '...' else ''
            alan    = str(row[4]).strip() if row[4] and str(row[4]).strip() != '...' else ''
            yil     = str(row[5]).strip() if row[5] and str(row[5]).strip() != '...' else ''
            etiket  = str(row[6]).strip() if row[6] else kat
            aciklama= str(row[7]).strip() if row[7] and str(row[7]).strip() != '...' else ''
            if konum: aciklama = (aciklama + ' | ' + konum if aciklama else konum)
            if alan:  aciklama = (aciklama + ' | ' + alan + ' m2' if aciklama else alan + ' m2')

            # Bu klasordeki fotograflari bul
            klasor_yolu = os.path.join(FOTOLAR, kat, klasor)
            if os.path.isdir(klasor_yolu):
                dosyalar = sorted([f for f in os.listdir(klasor_yolu) if f.lower().endswith(('.jpg','.jpeg','.png','.webp'))])
                for d in dosyalar:
                    hedef_dosya = kat + '/' + d
                    if hedef_dosya not in goruldu:
                        goruldu.add(hedef_dosya)
                        manifest.append({'dosya': hedef_dosya, 'isim': isim, 'kategori': etiket,
                                        'aciklama': aciklama, 'yil': yil})
except ImportError:
    pass

# Kopyalanan tum fotograflari tara (Excel'de olmayanlari da ekle)
for kat in KATEGORILER:
    kat_dir = os.path.join(WEBSITE, kat)
    if not os.path.isdir(kat_dir): continue
    for f in sorted(os.listdir(kat_dir)):
        if not f.lower().endswith(('.jpg','.jpeg','.png','.webp')): continue
        dosya_yolu = kat + '/' + f
        if dosya_yolu not in goruldu:
            goruldu.add(dosya_yolu)
            manifest.append({'dosya': dosya_yolu, 'isim': 'MefSteel Proje',
                           'kategori': kat, 'aciklama': 'Hafif celik yapi projesi'})

# Kok klasordeki fotograflar
for f in sorted(os.listdir(WEBSITE)):
    if not f.lower().endswith(('.jpg','.jpeg','.png','.webp')): continue
    if f not in goruldu:
        goruldu.add(f)
        manifest.append({'dosya': f, 'isim': 'MefSteel Proje',
                        'kategori': 'konut', 'aciklama': 'Hafif celik yapi projesi'})

with open(os.path.join(WEBSITE, 'manifest.json'), 'w', encoding='utf-8') as fp:
    json.dump(manifest, fp, ensure_ascii=False)

print(f'{len(manifest)} fotograf manifest.json a yazildi.')
"@

$pyScript | & $PYTHON
if ($LASTEXITCODE -ne 0) {
    Write-Host "   [UYARI] manifest.json olusturulamadi" -ForegroundColor Yellow
}

# --- 3. GIT PUSH ---
Write-Host ""
Write-Host "[3/4] GitHub'a yukleniyor..." -ForegroundColor Green
Set-Location $WEBSITE
$tarih = Get-Date -Format "dd.MM.yyyy HH:mm"
try {
    & git add . 2>&1 | Out-Null
    & git commit -m "Site guncellendi: $tarih" 2>&1 | Out-Null
    & git push 2>&1 | Out-Null
    Write-Host "   Push basarili." -ForegroundColor Gray
} catch {
    Write-Host "   [UYARI] Push basarisiz: $_" -ForegroundColor Yellow
}

# --- 4. TAMAMLANDI ---
Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "  TAMAMLANDI!" -ForegroundColor Green
Write-Host "  Vercel ~30 saniyede gunceller." -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "Devam etmek icin bir tusa basin..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
