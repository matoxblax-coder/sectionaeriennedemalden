// Fade-in on scroll
const elements = document.querySelectorAll(".fade-in");
window.addEventListener("scroll", () => {
  const triggerBottom = window.innerHeight * 0.8;
  elements.forEach(el => {
    const top = el.getBoundingClientRect().top;
    if (top < triggerBottom) el.classList.add("visible");
  });
});

// Audio control
const soundBtn = document.getElementById("sound-toggle");
const ambiance = document.getElementById("ambiance");

soundBtn.addEventListener("click", () => {
  if (ambiance.paused) {
    ambiance.play();
    soundBtn.textContent = "🎧 Ambiance ON";
  } else {
    ambiance.pause();
    soundBtn.textContent = "🎧 Ambiance OFF";
  }
});
