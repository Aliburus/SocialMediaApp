export function validateEmail(email: string) {
  return /^\S+@\S+\.\S+$/.test(email);
}

export function validatePhone(phone: string) {
  // +905xxxxxxxxx veya 05xxxxxxxxx veya 5xxxxxxxxx gibi Türk GSM formatları dahil
  return /^((\+\d{1,3})|0)?\d{10}$/.test(phone);
}

export function validateRegisterInput({
  name,
  username,
  email,
  password,
}: {
  name: string;
  username: string;
  email: string;
  password: string;
}) {
  if (!name || !username || !email || !password) {
    return "Tüm alanlar zorunlu";
  }
  if (!validateEmail(email)) {
    if (!validatePhone(email)) {
      return "Geçersiz email veya telefon numarası formatı";
    }
  }
  if (password.length < 6) {
    return "Şifre en az 6 karakter olmalı";
  }
  if (username.length < 3) {
    return "Kullanıcı adı en az 3 karakter olmalı";
  }
  return null;
}

export function validateLoginInput({
  emailOrUsername,
  password,
}: {
  emailOrUsername: string;
  password: string;
}) {
  if (!emailOrUsername || !password) {
    return "Tüm alanlar zorunlu";
  }
  if (password.length < 6) {
    return "Şifre en az 6 karakter olmalı";
  }
  return null;
}

// Tarih formatı için timeAgo fonksiyonu (genel kullanım)
export const timeAgo = (date: string | Date) => {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);
  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600)
    return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000)
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 31536000)
    return `${Math.floor(diffInSeconds / 2592000)} months ago`;
  return `${Math.floor(diffInSeconds / 31536000)} years ago`;
};
