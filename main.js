const soundBtn = document.getElementById("sound-toggle");
const ambiance = document.getElementById("ambiance");

soundBtn.onclick = () => {
  ambiance.paused ? ambiance.play() : ambiance.pause();
};
const gate = document.getElementById("entry-gate");
const enterBtn = document.getElementById("enter-site");

enterBtn.addEventListener("click", () => {
  gate.style.opacity = "0";
  setTimeout(() => gate.remove(), 800);
});
const revealElements = document.querySelectorAll(".fade-in");

const revealOnScroll = () => {
  const trigger = window.innerHeight * 0.85;

  revealElements.forEach(el => {
    const top = el.getBoundingClientRect().top;
    if (top < trigger) {
      el.classList.add("visible");
    }
  });
};

window.addEventListener("scroll", revealOnScroll);
window.addEventListener("load", revealOnScroll);
