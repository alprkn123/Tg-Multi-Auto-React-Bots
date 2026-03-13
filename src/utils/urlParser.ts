export function extractUrl(text: string): string | null {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = text.match(urlRegex);
  return matches ? matches[0] : null;
}

export function detectPlatform(url: string): string {
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return 'YouTube';
  } else if (url.includes('tiktok.com')) {
    return 'TikTok';
  } else if (url.includes('instagram.com')) {
    return 'Instagram';
  } else {
    throw new Error('Platform not supported');
  }
}
