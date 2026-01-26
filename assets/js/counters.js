const counters = {
  hours: 4200,
  missions: 128,
  pilots: 9,
  shows: 35
};

Object.keys(counters).forEach(id => {
  let count = 0;
  const target = counters[id];
  const element = document.getElementById(id);
  const interval = setInterval(() => {
    if (count < target) {
      count += Math.ceil(target / 100);
      element.textContent = count;
    } else {
      element.textContent = target;
      clearInterval(interval);
    }
  }, 40);
});
