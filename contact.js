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
    status.innerText = "⚠️ Please fill all fields.";
    status.style.color = "orange";
    return;
  }

  // ✅ Better email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    status.innerText = "⚠️ Please enter a valid email.";
    status.style.color = "orange";
    return;
  }

  // ===== UI LOCK =====
  button.disabled = true;
  button.innerText = "Sending...";
  status.innerText = "";
  
  const params = { name, email, message };

  emailjs.send(
    "service_a7ayyfv",
    "template_4acypww",
    params
  )
  .then(() => {
    status.innerText = "✅ Message sent successfully!";
    status.style.color = "lightgreen";
    form.reset();
  })
  .catch((error) => {
    status.innerText = "❌ Failed to send message. Try again.";
    status.style.color = "red";
    console.error(error);
  })
  .finally(() => {
    button.disabled = false;
    button.innerText = "Send Message";
  });
}

// ===== ATTACH EVENT =====
document.getElementById("contactForm").addEventListener("submit", sendMessage);