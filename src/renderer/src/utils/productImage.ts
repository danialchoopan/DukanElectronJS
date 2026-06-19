let imageDataCache: Record<string, string> = {}

export async function getProductImageUrl(imageBase64: string): Promise<string> {
  if (imageBase64.startsWith('data:image') || imageBase64.startsWith('http')) {
    return imageBase64
  }
  if (imageDataCache[imageBase64]) return imageDataCache[imageBase64]
  const r = await window.api.products.getImage(imageBase64)
  if (r.success && r.data) {
    imageDataCache[imageBase64] = r.data as string
    return r.data as string
  }
  return ''
}

export function clearImageCache() {
  imageDataCache = {}
}
