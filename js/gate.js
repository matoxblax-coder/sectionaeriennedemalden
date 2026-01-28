const gate = document.getElementById('gate');
const btn = document.getElementById('enter-site');

btn.addEventListener('click', () => {
  gate.style.opacity = '0';
  gate.style.pointerEvents = 'none';

  setTimeout(() => {
    gate.remove();
  }, 1200);
});
