export function scrollToTop (duration, fps = 50) {
  scrollTo(0, duration, fps);
}

export function scrollTo (scrollY, duration, fps = 50) {
  let currentTop = window.scrollY;
  let frames = Math.floor(fps / 1000 * duration);
  let count = 0;

  let id = setInterval(() => {
    currentTop = window.scrollY;
    window.scrollTo(0, currentTop + (scrollY - currentTop) / frames * count);
    count++;
    if (count === frames || window.scrollY === scrollY) {
      clearInterval(id);
      window.scrollTo(0, scrollY);
    }
  }, duration / frames);
}

export default scrollToTop;
