const windowAny = window as any;
declare var webkitAudioContext: any;

// Small polyfill for Safari
// Source: https://gist.github.com/jakearchibald/131d7101b134b6f7bed1d8320e4da599
if (!windowAny.AudioContext && windowAny.webkitAudioContext) {
  const oldFunc = webkitAudioContext.prototype.decodeAudioData;
  webkitAudioContext.prototype.decodeAudioData = function(arraybuffer) {
    return new Promise((resolve, reject) => {
      oldFunc.call(this, arraybuffer, resolve, reject);
    });
  };
}

export function createAudioContext(): AudioContext {
  return new ((window as any).AudioContext || (window as any).webkitAudioContext)();
}
