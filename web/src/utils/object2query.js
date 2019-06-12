export default function object2query (obj) {
  return Object.keys(obj).map(key => {
    if (Array.isArray(obj[key])) {
      return obj[key].map(item => `${key}=${encodeURIComponent(item)}`).join('&');
    }

    return `${key}=${encodeURIComponent(obj[key])}`;
  }).join('&');
}