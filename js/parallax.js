document.addEventListener('mousemove', e => {
  const x = (e.clientX / window.innerWidth - 0.5) * 10;
  const y = (e.clientY / window.innerHeight - 0.5) * 10;

  document.body.style.backgroundPosition = `${50 + x}% ${50 + y}%`;
});
