export function isCloudinaryUrl(url: string): boolean {
  return url.includes('res.cloudinary.com');
}

export function cloudinaryPublicId(url: string): string {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.\w+)?$/);
  return match?.[1] ?? url;
}

export function cloudinaryThumbnail(url: string, size: number): string {
  return url.replace('/upload/', `/upload/w_${size},h_${size},c_fill,q_auto,f_auto/`);
}
