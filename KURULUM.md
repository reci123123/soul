# SoulStone — Gerçek Backend Kurulumu (Supabase + Netlify Functions)

Bu versiyon artık gerçek kullanıcı hesapları, kalıcı veri (Postgres) ve gerçek AI mentor (OpenAI) içeriyor. Toplam kurulum ~15-20 dakika sürer, kod yazmana gerek yok — sadece birkaç yere anahtar yapıştıracaksın.

Kullanılan servisler:
- **Supabase** → kullanıcı girişi (auth) + veritabanı (ücretsiz plan yeterli)
- **Netlify** → siteyi barındırır + AI mentor için sunucu fonksiyonu çalıştırır
- **OpenAI** → gerçek AI mentor cevapları için

---

## 1) Supabase projesi oluştur

1. https://supabase.com → ücretsiz hesap aç → **New Project**.
2. Bir isim ver (örn. `soulstone`), bölge seç, şifre belirle → **Create**.
3. Proje hazır olunca sol menüden **SQL Editor**'e git.
4. Bu klasördeki `supabase-schema.sql` dosyasının tüm içeriğini kopyala, SQL Editor'e yapıştır, **Run** butonuna bas.
   - Bu, `player_state`, `journal_entries`, `mentor_messages` tablolarını ve güvenlik kurallarını (her kullanıcı sadece kendi verisini görür) oluşturur.
5. Sol menüden **Project Settings → API** sekmesine git. İki değeri kopyala:
   - **Project URL** (örn. `https://abcxyz.supabase.co`)
   - **anon public** key (uzun bir metin)
6. Sol menüden **Authentication → Providers → Email** kısmının açık olduğundan emin ol (varsayılan olarak açıktır).
   - İstersen **Authentication → Settings** içinde "Confirm email" seçeneğini kapatabilirsin, böylece kayıt olan kullanıcı e-posta onayı beklemeden direkt giriş yapabilir (test için pratik).

## 2) OpenAI API anahtarı al

1. https://platform.openai.com/api-keys → **Create new secret key**.
2. Anahtarı kopyala (bir daha gösterilmez, güvenli bir yere kaydet).
3. Hesabında ödeme yöntemi/kredi olması gerekir (OpenAI kullanım başına ücretlendirir).

## 3) index.html içine Supabase bilgilerini yapıştır

`index.html` dosyasını bir metin editörüyle aç, en alttaki `<script type="module">` bloğunda şu satırları bul:

```js
const SUPABASE_URL = 'https://YOUR-PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR-ANON-PUBLIC-KEY';
```

Kendi Supabase URL ve anon key değerlerinle değiştir, kaydet.

> Not: `anon key` tarayıcıda görünmesi güvenli olan bir anahtardır (Supabase'in Row Level Security kuralları veriyi zaten korur). OpenAI anahtarını asla buraya koyma — o sadece Netlify'da, sunucu tarafında kalacak (adım 5).

## 4) GitHub'a yükle (Netlify Functions için gerekli)

Fonksiyonların çalışması için **Git tabanlı deploy** gerekiyor (sürükle-bırak ile fonksiyonlar çalışmaz).

1. Bu klasörü (`index.html`, `netlify.toml`, `netlify/` klasörü) bir GitHub reposuna yükle.
2. https://app.netlify.com → **Add new site → Import an existing project** → GitHub'ı bağla → reponu seç.
3. Build ayarları otomatik `netlify.toml` dosyasından okunur, dokunmana gerek yok. **Deploy** butonuna bas.

## 5) OpenAI anahtarını Netlify'a güvenli şekilde ekle

1. Netlify'da sitenin sayfasında **Site configuration → Environment variables** git.
2. **Add a variable** → Key: `OPENAI_API_KEY`, Value: (adım 2'de aldığın anahtar) → Save.
3. **Deploys** sekmesine gidip **Trigger deploy → Deploy site** ile yeniden yayınla (env var'ın etkili olması için).

## 6) Test et

1. Netlify'ın verdiği linke git (örn. `https://soulstone-xyz.netlify.app`).
2. Kayıt ol (e-posta + şifre) → doğum bilgilerini gir → "Haritamı oluştur ve kaydet" de.
3. Sığınağına gir, bir günlük kaydı yaz, bir görev tamamla, Mentor sekmesinden mesaj gönder.
4. Sayfayı yenile / farklı bir tarayıcıdan aynı hesapla giriş yap — verilerin kalıcı olduğunu göreceksin.

---

## Sorun giderme

- **"Backend henüz bağlanmadı" uyarısı çıkıyor** → adım 3'ü unutmuşsun, `index.html` içindeki URL/anahtarı güncelleyip yeniden deploy et.
- **Kayıt olunca giriş yapamıyorum** → Supabase'de e-posta onayı açık olabilir; e-postana gelen linke tıkla, ya da adım 1.6'daki ayarı kapat.
- **Mentor mesaj göndermiyor / hata veriyor** → Netlify fonksiyonunun deploy olduğundan (Functions sekmesinde `mentor-chat` görünmeli) ve `OPENAI_API_KEY`'in doğru girildiğinden emin ol; env var ekledikten sonra mutlaka yeniden deploy tetiklemen gerekiyor.
- **Görev/taş verileri kaydolmuyor** → Supabase SQL Editor'de `supabase-schema.sql` dosyasının tamamının hatasız çalıştığından emin ol (özellikle RLS politikaları kısmı).

---

## Sırada ne var?

Bu kurulum MVP seviyesinde çalışan gerçek bir backend. `SoulStone-Technical-Architecture.md` dosyasındaki tam mimari (ayrı Core API/Mentor/Jobs servisleri, Prisma, gerçek astroloji/ay API entegrasyonları, achievement sistemi, topluluk katmanı vb.) bir sonraki büyüme aşaması için yol haritası olarak düşünülebilir — bu Supabase kurulumu, o mimarinin "hızlı başlangıç" versiyonu.
