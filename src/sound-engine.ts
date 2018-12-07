import { createAudioContext } from './sound-polyfill';

const AUDIO_FILE = 'audio/zampona-sounds.mp3';

const pitchList = [
  { pitch: 62, in: 53725, out: 105200 },
  { pitch: 64, in: 47864, out: 93723 },
  { pitch: 66, in: 54899, out: 107200 },
  { pitch: 67, in: 51818, out: 101183 },
  { pitch: 69, in: 46479, out: 99200 },
  { pitch: 71, in: 43464, out: 121332 },
  { pitch: 72, in: 41024, out: 114522 },
  { pitch: 74, in: 54177, out: 112787 },
  { pitch: 76, in: 48266, out: 100482 },
  { pitch: 78, in: 58281, out: 113814 },
  { pitch: 79, in: 55010, out: 107426 },
  { pitch: 81, in: 52736, out: 112642 },
  { pitch: 83, in: 46983, out: 100353 },
];

class ZamponaNote {
  readonly sourceNode = this.context.createBufferSource();
  readonly gainNode = this.context.createGain();
  readonly startPoint: number;

  constructor(public readonly pitch: number, private context: AudioContext, buffer: AudioBuffer) {
    let index = 0;
    let noteInfo = pitchList[index];
    while (noteInfo.pitch < pitch && index < pitchList.length - 1) {
      index++;
      noteInfo = pitchList[index];
    }
    this.startPoint = index * 4;
    this.sourceNode.buffer = buffer;
    this.sourceNode.loopStart = this.startPoint + noteInfo.in / 44100.0;
    this.sourceNode.loopEnd = this.startPoint + noteInfo.out / 44100.0;
    this.sourceNode.loop = true;
    if (pitch != noteInfo.pitch) {
      this.sourceNode.detune.value = 100 * (pitch - noteInfo.pitch);
    }
    this.sourceNode.connect(this.gainNode);
    this.gainNode.connect(context.destination);
  }

  play() {
    this.sourceNode.start(0, this.startPoint);
  }

  stop() {
    const stopTime = this.context.currentTime + 0.1;
    this.gainNode.gain.exponentialRampToValueAtTime(0.00001, stopTime);
    this.sourceNode.stop(stopTime);
  }
}

export class ZamponaSoundEngine {
  private context: AudioContext = createAudioContext();
  private soundPromise = this.loadSound();
  private notes = new Map<number, ZamponaNote>();

  public loaded = this.soundPromise.then(() => void 0);

  constructor(private audioFile = AUDIO_FILE) {}

  async loadSound() {
    const response = await window.fetch(this.audioFile);
    const arrayBuffer = await response.arrayBuffer();
    return await this.context.decodeAudioData(arrayBuffer);
  }

  async playNote(pitch: number, volume: number = 1.0) {
    const buffer = await this.soundPromise;
    if (!this.notes.has(pitch)) {
      const note = new ZamponaNote(pitch, this.context, buffer);
      this.notes.set(pitch, note);
      note.play();
      return note;
    }
  }

  async stopNote(pitch: number) {
    const note = this.notes.get(pitch);
    if (note) {
      note.stop();
      this.notes.delete(pitch);
    }
  }
}
