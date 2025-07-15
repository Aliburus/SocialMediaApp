function validateEmail(email) {
  return /^\S+@\S+\.\S+$/.test(email);
}

function validatePhone(phone) {
  // +905xxxxxxxxx veya 05xxxxxxxxx veya 5xxxxxxxxx gibi Türk GSM formatları dahil
  return /^((\+\d{1,3})|0)?\d{10}$/.test(phone);
}

exports.validateRegisterInput = ({ name, username, email, password }) => {
  if (!name || !username || !email || !password) {
    return "All fields are required";
  }
  if (!validateEmail(email)) {
    // Email formatı değilse, telefon numarası formatı mı kontrol et
    if (!validatePhone(email)) {
      return "Invalid email or phone number format";
    }
  }
  if (password.length < 6) {
    return "Password must be at least 6 characters";
  }
  if (username.length < 3) {
    return "Username must be at least 3 characters";
  }
  return null;
};

exports.validateLoginInput = ({ emailOrUsername, password }) => {
  if (!emailOrUsername || !password) {
    return "All fields are required";
  }
  if (password.length < 6) {
    return "Password must be at least 6 characters";
  }
  return null;
};
