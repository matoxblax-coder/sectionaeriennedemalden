const scenes = document.querySelectorAll('.aircraft-scene');

scenes.forEach(scene => {
  const track = scene.querySelector('.scene-track');
  const panels = scene.querySelectorAll('.scene-panel');
  const totalPanels = panels.length;
  const sceneHeight = window.innerHeight * totalPanels;

  scene.style.height = `${sceneHeight}px`;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      window.addEventListener('scroll', () => {
        const rect = scene.getBoundingClientRect();
        const progress = Math.min(
          Math.max(-rect.top / (sceneHeight - window.innerHeight), 0),
          1
        );

        const translateX = -progress * (totalPanels - 1) * window.innerWidth;
        track.style.transform = `translateX(${translateX}px)`;

        const index = Math.round(progress * (totalPanels - 1));
        const bg = panels[index].dataset.bg;
        scene.style.setProperty('--bg', `url(${bg})`);
        scene.style.backgroundImage = `url(${bg})`;
      });
    });
  }, { threshold: 0.1 });

  observer.observe(scene);
});
