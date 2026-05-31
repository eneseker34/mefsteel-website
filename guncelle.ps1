# MefSteel Website Guncelleme Scripti
# Fotograf klasorundan resimleri kopyalar, manifest.json uretir, GitHub'a push eder

$FOTOLAR_KLASORU = "D:\00 SIRKET DOSYALARI\GENEL SIRKET DOSYALARI\WEB SITESI FOTOLARI"
$WEBSITE_KLASORU = "C:\mefsteel-website"
$NODE_EXE        = "C:\Program Files\nodejs\node.exe"

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  MefSteel Website Guncelleniyor..." -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# --- 1. FOTOGRAF KLASORU KONTROL ---
if (-not (Test-Path $FOTOLAR_KLASORU)) {
    Write-Host "[UYARI] Fotograf klasoru bulunamadi:" -ForegroundColor Yellow
    Write-Host "  $FOTOLAR_KLASORU" -ForegroundColor Yellow
    Write-Host "  Lutfen klasoru olusturun ve fotograflari ekleyin." -ForegroundColor Yellow
} else {
    Write-Host "[1/4] Fotograflar kopyalaniyor..." -ForegroundColor Green

    $KATEGORI_ESLESTIRME = @{
        "projeler"   = "$WEBSITE_KLASORU\images\projeler"
        "hero"       = "$WEBSITE_KLASORU\images\hero"
        "hakkimizda" = "$WEBSITE_KLASORU\images\hakkimizda"
    }

    foreach ($klasor in $KATEGORI_ESLESTIRME.Keys) {
        $kaynak = Join-Path $FOTOLAR_KLASORU $klasor
        $hedef  = $KATEGORI_ESLESTIRME[$klasor]
        if (Test-Path $kaynak) {
            New-Item -ItemType Directory -Force $hedef | Out-Null
            $dosyalar = Get-ChildItem $kaynak -File -Include "*.jpg","*.jpeg","*.png","*.webp"
            foreach ($dosya in $dosyalar) {
                $hedefDosya = Join-Path $hedef $dosya.Name
                if (-not (Test-Path $hedefDosya) -or (Get-Item $dosya.FullName).LastWriteTime -gt (Get-Item $hedefDosya).LastWriteTime) {
                    Copy-Item $dosya.FullName $hedefDosya -Force
                    Write-Host "   Kopyalandi: $klasor\$($dosya.Name)" -ForegroundColor Gray
                }
            }
        }
    }

    # Kok klasordeki fotograflar projeler'e gider
    $kokDosyalar = Get-ChildItem $FOTOLAR_KLASORU -File -Include "*.jpg","*.jpeg","*.png","*.webp"
    foreach ($dosya in $kokDosyalar) {
        $hedefDosya = "$WEBSITE_KLASORU\images\projeler\$($dosya.Name)"
        if (-not (Test-Path $hedefDosya) -or (Get-Item $dosya.FullName).LastWriteTime -gt (Get-Item $hedefDosya).LastWriteTime) {
            Copy-Item $dosya.FullName $hedefDosya -Force
            Write-Host "   Kopyalandi: projeler\$($dosya.Name)" -ForegroundColor Gray
        }
    }
}

# --- 2. MANIFEST.JSON OLUSTUR ---
Write-Host ""
Write-Host "[2/4] manifest.json olusturuluyor..." -ForegroundColor Green

$projelerKlasoru = "$WEBSITE_KLASORU\images\projeler"
$manifestDosyasi = "$projelerKlasoru\manifest.json"

$fotograflar = Get-ChildItem $projelerKlasoru -File -Include "*.jpg","*.jpeg","*.png","*.webp" |
               Where-Object { $_.Name -ne "manifest.json" } |
               Sort-Object Name

$KATEGORI_ESLESTIRME_ADI = @{
    "konut"      = @("villa","ev","konut","daire","bina","mesken","koy")
    "ticari"     = @("ofis","ticari","magazа","showroom","market","plaza")
    "endustriyel"= @("fabrika","depo","sanayi","endustr","ambar","fabr")
}

function Kategori-Bul($dosyaAdi) {
    $adKucuk = $dosyaAdi.ToLower()
    foreach ($kat in $KATEGORI_ESLESTIRME_ADI.Keys) {
        foreach ($anahtar in $KATEGORI_ESLESTIRME_ADI[$kat]) {
            if ($adKucuk -like "*$anahtar*") { return $kat }
        }
    }
    return "konut"
}

$manifest = @()
foreach ($foto in $fotograflar) {
    $isim = $foto.BaseName -replace "[-_]"," "
    $isim = (Get-Culture).TextInfo.ToTitleCase($isim.ToLower())
    $manifest += @{
        dosya     = $foto.Name
        isim      = $isim
        kategori  = Kategori-Bul $foto.BaseName
    }
}

$manifest | ConvertTo-Json -Depth 3 | Set-Content $manifestDosyasi -Encoding UTF8
Write-Host "   $($manifest.Count) fotograf manifest'e eklendi." -ForegroundColor Gray

# --- 3. GIT ADD + COMMIT + PUSH ---
Write-Host ""
Write-Host "[3/4] GitHub'a yukleniyor..." -ForegroundColor Green

Set-Location $WEBSITE_KLASORU

$tarih = Get-Date -Format "dd.MM.yyyy HH:mm"
$gitPath = (Get-Command git -ErrorAction SilentlyContinue)?.Source

if (-not $gitPath) {
    Write-Host "   [HATA] Git bulunamadi! Lutfen git yukleyin." -ForegroundColor Red
} else {
    try {
        & git add . 2>&1 | Out-Null
        $commitMesaji = "Site guncellendi: $tarih — $($manifest.Count) fotograf"
        & git commit -m $commitMesaji 2>&1 | Out-Null
        & git push 2>&1 | Out-Null
        Write-Host "   GitHub'a push edildi." -ForegroundColor Gray
    } catch {
        Write-Host "   [UYARI] Git push basarisiz: $_" -ForegroundColor Yellow
        Write-Host "   GitHub baglantisini kontrol edin." -ForegroundColor Yellow
    }
}

# --- 4. TAMAMLANDI ---
Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "  TAMAMLANDI!" -ForegroundColor Green
Write-Host "  $($manifest.Count) fotograf islendi." -ForegroundColor Green
Write-Host "  Vercel yaklasik 30 saniyede" -ForegroundColor Green
Write-Host "  mefsteel.com'u guncelleyecek." -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "Devam etmek icin bir tusa basin..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
