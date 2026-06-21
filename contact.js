function sendMessage(event) {
  event.preventDefault();

  const status = document.getElementById("status");
  const form = document.getElementById("contactForm");
  const button = form.querySelector("button");

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const message = document.getElementById("message").value.trim();

  // ===== VALIDATION =====
  if (!name || !email || !message) {
    status.innerText = "⚠️ لطفاً همه فیلدها را پر کنید / Please fill all fields.";
    status.style.color = "var(--color-warning)";
    return;
  }

  // ✅ Better email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    status.innerText = "⚠️ لطفاً یک ایمیل معتبر وارد کنید / Please enter a valid email.";
    status.style.color = "var(--color-warning)";
    return;
  }

  // ===== UI LOCK =====
  button.disabled = true;
  button.innerText = "ارسال در حال انجام / Sending...";
  status.innerText = "";
  
  const params = { name, email, message };

  emailjs.send(
    "service_a7ayyfv",
    "template_4acypww",
    params
  )
  .then(() => {
    status.innerText = "✅ پیام شما با موفقیت ارسال شد / Message sent successfully!";
    status.style.color = "var(--color-success)";
    form.reset();
  })
  .catch((error) => {
    status.innerText = "❌ خطا در ارسال پیام / Failed to send message. Try again.";
    status.style.color = "var(--color-error)";
    console.error(error);
  })
  .finally(() => {
    button.disabled = false;
    button.innerText = "ارسال پیام / Send Message 🚀";
  });
}

// ===== ATTACH EVENT =====
document.getElementById("contactForm").addEventListener("submit", sendMessage);