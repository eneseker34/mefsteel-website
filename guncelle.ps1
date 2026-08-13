# MefSteel Website Guncelleme Scripti
# Kaynak foto klasorlerinden fotograflari WEB BOYUTUNA KUCULTEREK kopyalar,
# .webp kopyalarini uretir, Excel bilgi foylerini okuyup manifest.json yazar,
# GitHub'a push eder -> Vercel otomatik deploy eder.
#
# 2026-08-11 BAKIM - duzeltilen 3 kok sorun:
#   1) Fotograflar kucultulmuyordu -> site 2,1 GB idi, galeri fotolari 3-3,8 MB.
#      Artik max 1600 px / kalite 78 ile kopyalanir (~4-10 kat kucuk).
#   2) Uretilen .webp kopyalari da kuculmuyordu (jpg'den bile buyuktuler).
#      Artik kucultulmus goruntuden uretilir; site <picture> ile bunlari sunar.
#   3) manifest.json'da Turkce harfler "?" oluyordu (galeride "Akku? Villa").
#      Sebep: Python kodu "$pyScript | & python" ile STDIN uzerinden gonderiliyordu;
#      PowerShell bu boruda ASCII'ye cevirip Turkce harfleri bozuyordu. Artik kod
#      gecici bir .py dosyasina UTF-8 yazilip dosya olarak calistiriliyor.
#      Ayrica Excel eslestirmesi KLASOR ADI yerine PROJE ADI slug'i ile yapiliyor
#      (foyde klasor sutunu "BUTUN ISLER" yazdigi icin eslesme hic tutmuyordu).

# NOT: Kaynak foto klasoru yolu asagidaki Python kodunun icinde tanimli (FOTOLAR).
# DIKKAT: Bu dosya UTF-8 BOM ile kaydedilmelidir - yoldaki "ŞİRKET" kelimesi
# Turkce harf icerir ve PowerShell 5.1 BOM'suz dosyayi ANSI sanip bozar.
$WEBSITE = "C:\mefsteel-website"
$PYTHON  = "C:\Users\Enes\AppData\Local\Programs\Python\Python312\python.exe"

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  MefSteel Website Guncelleniyor..." -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Python kodu burada TEK PARCA halinde tutulur ve gecici bir dosyaya UTF-8 yazilir.
# ONEMLI: kodu "| & python" ile borudan gondermeyin - Turkce karakterler bozulur.
# Tek tirnakli here-string (@' '@) kullaniliyor ki PowerShell icerideki $ ve ` isaretlerine dokunmasin.
$pyKod = @'
# -*- coding: utf-8 -*-
import os, sys, json, re, shutil
sys.stdout.reconfigure(encoding="utf-8")

FOTOLAR  = r'D:\00 ŞİRKET DOSYALARI\GENEL ŞİRKET DOSYALARI\WEB SİTESİ FOTOLARI'
PROJELER = r'C:\mefsteel-website\images\projeler'
KATEGORILER = ['konut', 'ticari', 'endustriyel']

MAX_KENAR   = 1600   # galeri karti ~400px, lightbox tam ekran -> retina icin de yeterli
JPG_KALITE  = 78
WEBP_KALITE = 75

try:
    from PIL import Image, ImageOps
except ImportError:
    print('HATA: Pillow kurulu degil. Once su komutu calistirin:')
    print('   pip install Pillow')
    sys.exit(1)

try:
    import openpyxl
except ImportError:
    openpyxl = None


TR = str.maketrans('çğıöşüÇĞİÖŞÜ', 'cgiosuCGIOSU')

# Proje adlarinda herkeste ortak gecen kelimeler - eslestirmede ayirt edici degiller
GENEL = {'villa', 'projesi', 'proje', 've', 'ile', 'yapi', ''}


def slug(s):
    """'AKKUŞ VİLLA PROJESİ' -> 'akkus-villa-projesi'"""
    s = s.translate(TR).lower()
    s = re.sub(r'[^a-z0-9]+', '-', s)
    return s.strip('-')


def kucuk(s):
    """Turkce dogru kucultme: I->ı, İ->i (Python'un .lower()'i bunu yanlis yapar)"""
    return s.replace('I', 'ı').replace('İ', 'i').lower()


def baslik(s):
    """'TEKİRDAĞ/ÇERKEZKÖY' -> 'Tekirdağ/Çerkezköy'
       'İLERİ KABA (ÇELİK+KAPLAMA)' -> 'İleri Kaba (Çelik+Kaplama)'
       Sadece bosluktan degil, / ( + - . , ayraclarindan sonra da buyuk harf gelir."""
    sonuc = []
    yeni_kelime = True
    for ch in s:
        if ch in ' /(+-.,':
            sonuc.append(ch)
            yeni_kelime = True
        elif yeni_kelime:
            sonuc.append(ch.upper())
            yeni_kelime = False
        else:
            sonuc.append(kucuk(ch))
    return ''.join(sonuc)


def ozel_kelimeler(s):
    """Eslestirmede kullanilacak ayirt edici kelimeler."""
    return {k for k in slug(s).split('-') if k not in GENEL and len(k) > 1}


# Excel foyunde eslesmeyen fotograflar icin kategoriye gore varsayilan metin
VARSAYILAN = {
    'hibrit':      {'isim': 'MefSteel Hibrit Proje',
                    'aciklama': 'Betonarme üzerine hafif çelik hibrit uygulama'},
    'ticari':      {'isim': 'MefSteel Ticari Proje',
                    'aciklama': 'Hafif çelik ticari yapı projesi'},
    'endustriyel': {'isim': 'MefSteel Endüstriyel Proje',
                    'aciklama': 'Hafif çelik endüstriyel yapı projesi'},
    '_':           {'isim': 'MefSteel Proje',
                    'aciklama': 'Hafif çelik yapı projesi'},
}


# ---------- 1) Fotograflari KUCULTEREK kopyala + webp uret ----------
print('[1/3] Fotograflar kucultulerek kopyalaniyor...')
kopyalanan = 0
atlanan = 0
for kat in KATEGORILER:
    kaynak = os.path.join(FOTOLAR, kat)
    hedef_dir = os.path.join(PROJELER, kat)
    if not os.path.isdir(kaynak):
        continue
    os.makedirs(hedef_dir, exist_ok=True)

    for kok, _, dosyalar in os.walk(kaynak):
        for d in sorted(dosyalar):
            if not d.lower().endswith(('.jpg', '.jpeg', '.png')):
                continue
            kaynak_yol = os.path.join(kok, d)
            hedef_yol = os.path.join(hedef_dir, d)
            webp_yol = os.path.splitext(hedef_yol)[0] + '.webp'

            # Kaynak degismediyse tekrar isleme (hizli calissin)
            if os.path.exists(hedef_yol) and os.path.exists(webp_yol):
                if os.path.getmtime(hedef_yol) >= os.path.getmtime(kaynak_yol):
                    atlanan += 1
                    continue
            try:
                img = Image.open(kaynak_yol)
                img = ImageOps.exif_transpose(img)   # telefon fotolarindaki donme bilgisi
                if img.mode in ('RGBA', 'P', 'LA'):
                    img = img.convert('RGB')
                if max(img.size) > MAX_KENAR:
                    img.thumbnail((MAX_KENAR, MAX_KENAR), Image.LANCZOS)
                img.save(hedef_yol, 'JPEG', quality=JPG_KALITE, optimize=True, progressive=True)
                img.save(webp_yol, 'WEBP', quality=WEBP_KALITE, method=4)
                kopyalanan += 1
            except Exception as e:
                print('   !! ' + d + ': ' + str(e))

print('   ' + str(kopyalanan) + ' foto islendi, ' + str(atlanan) + ' degismemis foto atlandi.')


# ---------- 2) manifest.json ----------
print('')
print('[2/3] manifest.json olusturuluyor...')

# Excel foyunden proje bilgileri.
# (Foydeki "KLASOR ADI" sutunu guvenilmez - hepsinde "BUTUN ISLER" yaziyor.
#  Bu yuzden eslestirme PROJE ADI ile fotograf dosya adi arasinda yapilir:
#  'AKKUŞ VİLLA PROJESİ' <-> 'akkus-villa-01.jpg')
projeler = []       # (ozel_kelime_kumesi, bilgi)
if openpyxl:
    for kat in KATEGORILER:
        xlsx = os.path.join(FOTOLAR, kat, 'PROJE_BILGI_FOYU_' + kat.upper() + '.xlsx')
        if not os.path.exists(xlsx):
            continue
        wb = openpyxl.load_workbook(xlsx, read_only=True)
        ws = wb.active
        for row in ws.iter_rows(min_row=4, values_only=True):
            if not row or len(row) < 8 or not row[2]:
                continue
            ad = str(row[2]).strip()
            if ad in ('', '...') or ad.upper().startswith('PROJE ADI'):
                continue
            konum  = str(row[3]).strip() if row[3] and str(row[3]).strip() != '...' else ''
            alan   = str(row[4]).strip() if row[4] and str(row[4]).strip() != '...' else ''
            yil    = str(row[5]).strip() if row[5] and str(row[5]).strip() != '...' else ''
            etiket = str(row[6]).strip() if row[6] else kat
            acik   = str(row[7]).strip() if row[7] and str(row[7]).strip() != '...' else ''

            parcalar = [baslik(p) for p in (acik, konum) if p]
            if alan:
                parcalar.append(alan + ' m2')
            projeler.append((ozel_kelimeler(ad), {
                'isim': baslik(ad),
                'kategori': etiket,
                'aciklama': ' | '.join(parcalar) or 'Hafif celik yapi projesi',
                'yil': yil,
            }))


def proje_bul(dosya_adi):
    """'akkus-villa-01' -> Excel'deki 'AKKUŞ VİLLA PROJESİ' kaydi.
    Herkeste ortak kelimeler (villa/projesi) atilir, kalan OZEL kelimelerde
    en cok ortakligi olan proje secilir."""
    kok = re.sub(r'-\d+$', '', slug(dosya_adi))
    aday = ozel_kelimeler(kok)
    if not aday:
        return None
    en_iyi, en_skor = None, 0
    for kelime, bilgi in projeler:
        skor = len(aday & kelime)
        if skor > en_skor:
            en_iyi, en_skor = bilgi, skor
    return en_iyi


manifest = []
eslesmeyen = {}

# images/projeler altindaki TUM fotograflari tara. Kaynak klasorde artik olmayan
# eski fotograflar da galeride kalsin diye disk taranir, kaynak degil.
#
# SIRA ONEMLI: galeri "Tumu" sekmesinde ilk 24 fotografi gosterir, yani bu sira
# ana sayfadaki vitrindir. Konut (villa) fotograflari once gelmeli; alfabetik
# siralama yapilirsa vitrin endustriyel fotograflarla acilir.
SIRA = ['konut', 'ticari', 'endustriyel', 'hibrit']
klasorler = [k for k in SIRA if os.path.isdir(os.path.join(PROJELER, k))]
klasorler += [k for k in sorted(os.listdir(PROJELER))
              if os.path.isdir(os.path.join(PROJELER, k)) and k not in SIRA]

for kat in klasorler:
    kat_dir = os.path.join(PROJELER, kat)
    for f in sorted(os.listdir(kat_dir)):
        if not f.lower().endswith(('.jpg', '.jpeg', '.png')):
            continue
        # NOT: .webp manifest'e EKLENMEZ. Her foto icin bir .webp kopyasi var;
        # ikisi de listelenirse galeride ayni foto iki kez gorunur.
        # .webp'i tarayiciya <picture> etiketi sunuyor (js/main.js).
        ad = os.path.splitext(f)[0]
        yol = kat + '/' + f

        bilgi = None if ad.startswith('mefsteel-') or ad.lower().startswith('img-') else proje_bul(ad)
        if bilgi:
            kayit = {'dosya': yol, 'isim': bilgi['isim'], 'kategori': bilgi['kategori'],
                     'aciklama': bilgi['aciklama']}
            if bilgi['yil']:
                kayit['yil'] = bilgi['yil']
        else:
            # Excel'de yoksa kategoriye gore makul bir varsayilan kullan
            varsayilan = VARSAYILAN.get(kat, VARSAYILAN['_'])
            kayit = {'dosya': yol, 'isim': varsayilan['isim'], 'kategori': kat,
                     'aciklama': varsayilan['aciklama']}
            kk = re.sub(r'-\d+$', '', slug(ad))
            if not kk.startswith('mefsteel-') and not kk.startswith('img-'):
                eslesmeyen[kk] = eslesmeyen.get(kk, 0) + 1
        manifest.append(kayit)

# Kategori klasorune girmemis, dogrudan images/projeler altinda duran fotograflar
# (IMG-20250223-WAxxxx.jpg gibi eski toplu yuklemeler). Bunlar da galeride
# gorunmeye devam etmeli - atlanirsa galeriden ~320 foto birden duser.
for f in sorted(os.listdir(PROJELER)):
    if not f.lower().endswith(('.jpg', '.jpeg', '.png')):
        continue
    manifest.append({'dosya': f, 'isim': 'MefSteel Proje', 'kategori': 'konut',
                     'aciklama': 'Hafif celik yapi projesi'})

# DIKKAT: Site bu dosyayi okur -> images/projeler/manifest.json
# (Kokteki C:\mefsteel-website\manifest.json artik KULLANILMIYOR.)
# ensure_ascii=False + encoding='utf-8' -> Turkce harfler dosyaya dogru yazilir
with open(os.path.join(PROJELER, 'manifest.json'), 'w', encoding='utf-8') as fp:
    json.dump(manifest, fp, ensure_ascii=False, indent=2)

gercek = len([k for k in manifest if k['isim'] != 'MefSteel Proje'])
print('   ' + str(len(manifest)) + ' fotograf yazildi (' + str(gercek) + ' tanesi gercek proje adiyla).')

if eslesmeyen:
    print('')
    print('   [DIKKAT] Su fotograflar Excel foyunde eslesmedi, "MefSteel Proje" yazacak:')
    for e, n in sorted(eslesmeyen.items(), key=lambda x: -x[1])[:10]:
        print('      - ' + e + '  (' + str(n) + ' foto)')
    print('   Foydeki "PROJE ADI" sutununa bu projeyi eklerseniz duzelir.')

# Guvenlik kontrolu: manifest'te bozuk karakter kalmamali
bozuk = [k for k in manifest if '?' in k.get('isim', '') or '?' in k.get('aciklama', '')]
if bozuk:
    print('')
    print('   [UYARI] ' + str(len(bozuk)) + ' kayitta "?" var - Turkce karakter yine bozulmus olabilir.')
'@

# --- Python kodunu gecici dosyaya UTF-8 (BOM'suz) yaz ve calistir ---
$gecici = Join-Path $env:TEMP "mefsteel_guncelle.py"
[System.IO.File]::WriteAllText($gecici, $pyKod, (New-Object System.Text.UTF8Encoding($false)))

& $PYTHON $gecici
$pyDurum = $LASTEXITCODE
Remove-Item $gecici -ErrorAction SilentlyContinue

if ($pyDurum -ne 0) {
    Write-Host ""
    Write-Host "   [HATA] Guncelleme yarida kaldi, GitHub'a gonderilmedi." -ForegroundColor Red
    Write-Host "Devam etmek icin bir tusa basin..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

# --- GIT PUSH ---
Write-Host ""
Write-Host "[3/3] GitHub'a yukleniyor..." -ForegroundColor Green
Set-Location $WEBSITE
$tarih = Get-Date -Format "dd.MM.yyyy HH:mm"
& git add .
& git commit -m "Site guncellendi: $tarih"
& git push
if ($?) {
    Write-Host "   Push basarili." -ForegroundColor Gray
} else {
    Write-Host "   [UYARI] Push basarisiz olabilir - yukaridaki mesaja bakin." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "  TAMAMLANDI!" -ForegroundColor Green
Write-Host "  Vercel ~30 saniyede gunceller." -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "Devam etmek icin bir tusa basin..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
