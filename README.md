# SocialMediaApp

SocialMediaApp, React Native ve Expo kullanılarak geliştirilmiş, modern ve etkileşimli bir sosyal medya mobil uygulamasıdır. Uygulama, kullanıcıların fotoğraf ve hikaye paylaşabildiği, diğer kullanıcılarla etkileşime geçebildiği, mesajlaşabildiği ve bildirimler alabildiği bir platform sunar. Arayüz ve kullanıcı deneyimi, Instagram gibi popüler sosyal medya uygulamalarından ilham alınarak tasarlanmıştır.

## Genel Mantık ve Temel Özellikler

- Kullanıcılar, fotoğraf ve hikaye (story) paylaşabilir, başkalarının içeriklerini görüntüleyebilir.
- Her kullanıcı kendi profilini oluşturabilir, düzenleyebilir ve diğer kullanıcıları takip edebilir.
- Takipçi ve takip edilen listeleri dinamik olarak güncellenir ve kullanıcılar arası etkileşim sağlanır.
- Kullanıcılar, gönderilere beğeni bırakabilir, yorum yapabilir ve içerikleri kaydedebilir.
- Hikaye (story) ekranında, kullanıcılar hikayeler arasında kolayca geçiş yapabilir ve hikaye izleme deneyimi Instagram'a benzer şekilde sunulur.
- Mesajlaşma (DM) özelliği ile kullanıcılar birebir sohbet edebilir.
- Bildirimler ekranında, kullanıcıya gelen etkileşimler (takip, beğeni, yorum vb.) listelenir ve yönetilebilir.
- Uygulama, modern mobil arayüz standartlarına uygun olarak light/dark mode, SafeArea ve gesture bar desteği ile geliştirilmiştir.

## Kullanılan Teknolojiler

- React Native
- Expo
- TypeScript
- React Navigation
- expo-camera
- react-native-safe-area-context
- @expo/vector-icons
- react-native-gesture-handler

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
    components/   # Uygulama bileşenleri
    screens/      # Ekranlar
    data/         # Mock veri ve örnekler
    types/        # Tip tanımları
```

Herhangi bir sorunda veya katkı yapmak isterseniz PR gönderebilirsiniz.
