# Arya Terzi - Randevu Yönetim Sistemi

Görükle, Nilüfer / Bursa'da profesyonel terzi ve kuru temizleme hizmetleri için randevu yönetim sistemi.

## 🚀 Özellikler

### Mevcut Özellikler
- ✅ **Online Randevu** - Müşteriler tarih ve saat seçerek randevu alabilir
- ✅ **WhatsApp Entegrasyonu** - Direkt WhatsApp iletişimi
- ✅ **Admin Panel** - Randevu yönetimi ve filtreleme
- ✅ **Müşteri Arama** - Telefon numarası ile randevu sorgulama
- ✅ **Mobil Responsive** - Tüm cihazlarda sorunsuz çalışma
- ✅ **SEO Optimizasyonu** - Google sıralaması için hazır
- ✅ **Google Analytics** - Ziyaretçi ve dönüşüm takibi

### Yeni Backend Özellikleri (Supabase)
- 🆕 **Cloud Database** - Veriler localStorage yerine güvenli veritabanında
- 🆕 **Çoklu Cihaz Erişimi** - Telefon, tablet, bilgisayar senkronizasyonu
- 🆕 **Veri Güvenliği** - Otomatik yedekleme, veri kaybı riski yok
- 🆕 **Gerçek Zamanlı Güncellemeler** - Anlık randevu senkronizasyonu
- 🆕 **Gelişmiş Raporlama** - Günlük/haftalık/aylık istatistikler

## 🛠️ Kurulum

### 1. Supabase Backend Kurulumu

#### Adım 1: Supabase Hesabı Oluşturun
1. [supabase.com](https://supabase.com) adresine gidin
2. Ücretsiz hesap oluşturun
3. Yeni proje oluşturun (örn: "arya-terzi")

#### Adım 2: Database Şemasını İmport Edin
1. Supabase Dashboard → SQL Editor'a gidin
2. `supabase-setup.sql` dosyasının içeriğini yapıştırın
3. Run tuşuna basın

#### Adım 3: API Anahtarlarını Alın
1. Settings → API sekmesine gidin
2. `URL` ve `anon public` anahtarını kopyalayın
3. `index.html` dosyasında şu bölümü güncelleyin:

```javascript
const SUPABASE_CONFIG = {
    URL: 'https://sizin-proje-id.supabase.co',  // Kendi URL'niz
    ANON_KEY: 'sizin-anon-key-buraya'           // Kendi anon key'iniz
};
```

### 2. Google Analytics Kurulumu

1. [Google Analytics](https://analytics.google.com) adresine gidin
2. Yeni mülk (property) oluşturun
3. GA4 ölçüm ID'nizi (G-XXXXXXXXXX formatında) kopyalayın
4. `index.html` dosyasında şu bölümü güncelleyin:

```javascript
gtag('config', 'G-SIZIN-ID', {  // Kendi ID'niz
```

### 3. Deployment (Yayınlama)

#### Seçenek A: Vercel (Ücretsiz, Önerilen)
1. [vercel.com](https://vercel.com) adresine gidin
2. GitHub hesabınızı bağlayın
3. Projeyi import edin
4. Deploy edin

#### Seçenek B: Netlify
1. [netlify.com](https://netlify.com) adresine gidin
2. Sürükle-bırak ile dosyaları yükleyin

#### Seçenek C: GitHub Pages
1. GitHub repo'su oluşturun
2. Dosyaları yükleyin
3. Settings → Pages → Deploy from branch

## 📱 Kullanım Rehberi

### Müşteri İçin
1. Web sitesine gidin
2. "Randevu Al" butonuna tıklayın
3. Formu doldurun (isim, soyisim, telefon, email, hizmet, tarih, saat)
4. Gönder butonuna tıklayın
5. Onay mesajı görünecektir

### Admin İçin
1. Anahtar ikonuna (🔒) tıklayın
2. Şifre: `398908` (değiştirmeniz önerilir)
3. Admin panelde:
   - Tüm randevuları görüntüleyin
   - Tarih ve hizmete göre filtreleyin
   - Randevu silme işlemi yapın

## 📊 WhatsApp Business API (İsteğe Bağlı)

Otomatik randevu onayları ve hatırlatmalar için:

### Twilio Entegrasyonu
1. [twilio.com](https://twilio.com) hesabı oluşturun
2. WhatsApp Sandbox'a kaydolun
3. API credentials alın
4. Edge Function olarak Supabase'e ekleyin (yakında)

## 🔒 Güvenlik Önlemleri

- ✅ XSS koruması (escapeHtml)
- ✅ Input sanitization
- ✅ Row Level Security (RLS) aktif
- ✅ Telefon numarası masking (*** *** XX XX)
- ✅ Şifre hash'leme (production'da bcrypt önerilir)

## 📈 Gelecek Geliştirmeler

- [ ] SMS OTP doğrulama
- [ ] E-ticaret entegrasyonu (ödeme)
- [ ] Müşteri sadakat puan sistemi
- [ ] Otomatik SMS/WhatsApp hatırlatmalar
- [ ] Çoklu dil desteği (İngilizce)
- [ ] Dark/Light tema toggle
- [ ] PWA (Progressive Web App)

## 📞 Destek

Sorularınız için:
- **WhatsApp**: 0555 182 3776
- **Email**: aryaterzim@gmail.com
- **Adres**: Görükle, Atatürk Cd. Nilüfer/Bursa

## 📝 License

MIT License - Ticari kullanım serbest.

---

**Not**: Bu proje Arya Terzi işletmesi için özel olarak geliştirilmiştir.
