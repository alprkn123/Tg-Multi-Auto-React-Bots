export async function transcribeAudio(videoBuffer: ArrayBuffer, env: any): Promise<string> {
  const API_KEY = env.ASSEMBLYAI_API_KEY;
  
  if (!API_KEY) {
    return 'Transcription not available (API key missing)';
  }

  try {
    const uploadRes = await fetch('https://api.assemblyai.com/v2/upload', {
      method: 'POST',
      headers: { 'authorization': API_KEY },
      body: videoBuffer
    });
    const { upload_url } = await uploadRes.json() as any;

    const transcriptRes = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        'authorization': API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({ audio_url: upload_url })
    });
    const { id } = await transcriptRes.json() as any;

    let result: any;
    while (true) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      const checkRes = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, {
        headers: { 'authorization': API_KEY }
      });
      result = await checkRes.json() as any;
      if (result.status === 'completed') break;
      if (result.status === 'error') throw new Error(result.error);
    }

    return result.text || 'No speech detected';
  } catch (error) {
    console.error('Transcription error:', error);
    return 'Transcription failed';
  }
}
