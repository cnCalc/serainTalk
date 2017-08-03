function scrollToTop (duration, fps = 60) {
  let currentTop = window.scrollY;
  let frames = Math.floor(fps / 1000 * duration);
  let step = currentTop / frames;
  let count = 0;

  let id = setInterval(() => {
    currentTop -= step;
    window.scrollTo(0, window.scrollY - window.scrollY * count / frames);
    count++;
    if (count === frames) {
      clearInterval(id);
    }
  }, duration / frames);
}

export default scrollToTop;
