export function isCloudinaryUrl(url: string): boolean {
  return url.includes('res.cloudinary.com');
}

export function cloudinaryPublicId(url: string): string {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.\w+)?$/);
  return match?.[1] ?? url;
}
