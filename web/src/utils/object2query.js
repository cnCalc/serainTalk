export default function object2query (obj) {
  return Object.keys(obj).map(key => `${key}=${encodeURIComponent(obj[key])}`).join('&');
}