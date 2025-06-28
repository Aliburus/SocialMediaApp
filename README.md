# SocialMediaApp

Bu proje, React Native ve Expo kullanılarak geliştirilmiş, Instagram benzeri bir sosyal medya mobil uygulamasıdır.

## Özellikler

- Ana akış (postlar, beğeni, yorum, paylaşım)
- Hikaye (story) görüntüleme ve ekleme
- Kamera ile fotoğraf çekme ve hikaye paylaşma
- DM (mesajlaşma) ve sohbet ekranları
- Profil ve sekmeli profil görünümü (gönderiler, reels, kaydedilenler, etiketlenenler)
- Takipçi ve takip edilen listeleri
- Bildirimler
- Modern ve Instagram'a benzer arayüz
- SafeArea ve gesture bar uyumluluğu

## Kullanılan Teknolojiler

- React Native
- Expo
- TypeScript
- React Navigation
- expo-camera
- react-native-safe-area-context
- @expo/vector-icons

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

3. Uygulamayı gerçek cihazda veya emülatörde çalıştırın (Expo Go uygulaması ile QR kod okutabilirsiniz).

## Klasör Yapısı

```
frontend/
  src/
    components/   # Bileşenler
    screens/      # Ekranlar
    data/         # Mock veri
    types/        # Tip tanımları
```

Herhangi bir sorunda veya katkı yapmak isterseniz PR gönderebilirsiniz.
