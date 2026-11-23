export function getPhotoUrl(url) {
  if (!url) return null
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'
  if (url.startsWith('/uploads')) {
    return `${baseUrl}${url}`
  }
  return `${baseUrl}/${url.replace(/^\//, '')}`
}
