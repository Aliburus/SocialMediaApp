function validateEmail(email) {
  return /^\S+@\S+\.\S+$/.test(email);
}

function validatePhone(phone) {
  // +905xxxxxxxxx veya 05xxxxxxxxx veya 5xxxxxxxxx gibi Türk GSM formatları dahil
  return /^((\+\d{1,3})|0)?\d{10}$/.test(phone);
}

exports.validateRegisterInput = ({ name, username, email, password }) => {
  if (!name || !username || !email || !password) {
    return "Tüm alanlar zorunlu";
  }
  if (!validateEmail(email)) {
    // Email formatı değilse, telefon numarası formatı mı kontrol et
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
};

exports.validateLoginInput = ({ emailOrUsername, password }) => {
  if (!emailOrUsername || !password) {
    return "Tüm alanlar zorunlu";
  }
  if (password.length < 6) {
    return "Şifre en az 6 karakter olmalı";
  }
  return null;
};
