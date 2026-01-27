const soundBtn = document.getElementById("sound-toggle");
const ambiance = document.getElementById("ambiance");

soundBtn.onclick = () => {
  ambiance.paused ? ambiance.play() : ambiance.pause();
};
