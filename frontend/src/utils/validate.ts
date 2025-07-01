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
