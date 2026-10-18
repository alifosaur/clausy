/**
 * Audio recording conversion and WAV encoding utilities for Clausy.
 * Converts browser MediaRecorder audio chunks (WebM/Opus, OGG, etc.) into
 * 16 kHz mono 16-bit linear PCM WAV format, ready for Sarvam Saaras STT.
 */

/**
 * Encodes a Float32Array of audio samples (-1.0 to 1.0) into a 16-bit mono PCM WAV ArrayBuffer.
 * Produces standard RIFF/WAVE 44-byte header matching Sarvam's expected format.
 */
export function encodeWav16BitMono(
  samples: Float32Array,
  sampleRate: number = 16000
): ArrayBuffer {
  const bytesPerSample = 2; // 16-bit
  const numChannels = 1; // mono
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // Helper to write ASCII strings
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // 1. "RIFF" chunk descriptor
  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true); // ChunkSize = 36 + Subchunk2Size
  writeString(8, "WAVE");

  // 2. "fmt " sub-chunk
  writeString(12, "fmt ");
  view.setUint32(16, 16, true); // Subchunk1Size = 16 for PCM
  view.setUint16(20, 1, true); // AudioFormat = 1 (linear PCM)
  view.setUint16(22, numChannels, true); // NumChannels = 1
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, byteRate, true); // ByteRate
  view.setUint16(32, blockAlign, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample = 16

  // 3. "data" sub-chunk
  writeString(36, "data");
  view.setUint32(40, dataSize, true); // Subchunk2Size = numSamples * bytesPerSample

  // Write PCM audio samples (Float32 [-1, 1] to signed 16-bit integer [-32768, 32767])
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    const val = s < 0 ? s * 0x8000 : s * 0x7fff;
    view.setInt16(offset, Math.floor(val), true);
    offset += 2;
  }

  return buffer;
}

/**
 * Decodes an arbitrary browser audio Blob (WebM/Opus, OGG, MP3) and resamples/converts it
 * to a 16 kHz mono 16-bit linear PCM WAV Blob.
 * If decoding is unsupported in the current environment (e.g. SSR), gracefully falls back to the original blob.
 */
export async function convertBlobTo16kHzMonoWav(blob: Blob): Promise<Blob> {
  if (typeof window === "undefined") {
    return blob;
  }

  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

  if (!AudioCtx) {
    return blob;
  }

  try {
    const arrayBuffer = await blob.arrayBuffer();
    const audioContext = new AudioCtx();
    let audioBuffer: AudioBuffer;
    try {
      audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    } finally {
      try {
        await audioContext.close();
      } catch {
        // ignore close error
      }
    }

    if (!audioBuffer || audioBuffer.duration <= 0) {
      return blob;
    }

    const targetSampleRate = 16000;
    const numChannels = 1;
    const frameCount = Math.max(1, Math.ceil(audioBuffer.duration * targetSampleRate));

    // Resample to 16 kHz mono using OfflineAudioContext
    const offlineCtx = new OfflineAudioContext(numChannels, frameCount, targetSampleRate);
    const source = offlineCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineCtx.destination);
    source.start(0);

    const renderedBuffer = await offlineCtx.startRendering();
    const monoChannelData = renderedBuffer.getChannelData(0);

    const wavBuffer = encodeWav16BitMono(monoChannelData, targetSampleRate);
    return new Blob([wavBuffer], { type: "audio/wav" });
  } catch (err) {
    console.warn("Audio conversion to 16kHz WAV failed, falling back to original blob:", err);
    return blob;
  }
}
