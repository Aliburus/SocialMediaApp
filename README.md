# SocialMediaApp

SocialMediaApp, React Native ve Expo ile geliştirilmiş modern bir sosyal medya uygulamasıdır.

## Temel Özellikler

- Fotoğraf ve hikaye paylaşımı (galeri veya kamera ile)
- Profil ve takip sistemi
- Beğeni, yorum, kaydetme
- DM (mesajlaşma)
- Bildirimler
- Arşivleme ve arşivden çıkarma (post, story, reels)
- Light/Dark mode ve SafeArea desteği
  
- Story ve post arşivleme




## Kullanılan Teknolojiler

- React Native
- Expo
- TypeScript
- React Navigation
- expo-camera
- react-native-safe-area-context
- @expo/vector-icons
- react-native-gesture-handler
- Axios (API istekleri için)
- Node.js + Express (backend)
- MongoDB (veritabanı)

## Kurulum

1. Bağımlılıkları yükleyin:

   ```sh
   cd frontend
   npm install
   # veya
   yarn install
   ```

2. Expo projesini başlatın:

   ```sh
   npx expo start
   ```

3. Backend'i başlatmak için:

   ```sh
   cd ../backend
   npm install
   npm start
   ```

4. Uygulamayı gerçek cihazda veya emülatörde çalıştırın (Expo Go uygulaması ile QR kod okutabilirsiniz).

## Klasör Yapısı

```
frontend/
  src/
    components/   # Uygulama bileşenleri
    screens/      # Ekranlar
    data/         # Mock veri ve örnekler
    types/        # Tip tanımları
backend/
  controllers/    # API controller dosyaları
  models/         # Mongoose modelleri
  routes/         # Express route dosyaları
  server.js       # Sunucu başlangıcı
```


