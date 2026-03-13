export async function downloadVideo(url: string, platform: string): Promise<ArrayBuffer> {
  const apiUrl = `https://api.downloader.saikoro.web.id/api?url=${encodeURIComponent(url)}`;
  
  const response = await fetch(apiUrl);
  const data = await response.json() as any;
  
  if (!data.status || !data.result?.url) {
    throw new Error('Failed to get download URL');
  }
  
  const videoResponse = await fetch(data.result.url);
  return await videoResponse.arrayBuffer();
}
