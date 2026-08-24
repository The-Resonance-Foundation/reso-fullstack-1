// Sound design for the marketing site — ported from the "Resonance Site"
// Claude Design project: plucked "plink" notes for hero ripples and nav
// hovers, and a low click for buttons. (The design's ambient background pad
// was removed on request — interactions make sound, nothing hums.) Muting is
// persisted in localStorage ("reso-muted"); audio starts on the first pointer
// gesture (browser autoplay policy).

const STORAGE_KEY = "reso-muted"

export function readMuted(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1"
  } catch {
    return false
  }
}

export function storeMuted(muted: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, muted ? "1" : "0")
  } catch {}
}

type AudioCtxCtor = typeof AudioContext
declare global {
  interface Window {
    webkitAudioContext?: AudioCtxCtor
  }
}

export class ResonanceAudio {
  private actx: AudioContext | null = null
  private master: GainNode | null = null
  private fxSend: GainNode | null = null
  muted = readMuted()

  /** Call on a user gesture — creates (or resumes) the AudioContext. */
  init() {
    if (this.actx) {
      if (this.actx.state === "suspended") void this.actx.resume()
      return
    }
    try {
      const Ctor = window.AudioContext || window.webkitAudioContext
      if (!Ctor) return
      const A = new Ctor()
      this.actx = A
      this.master = A.createGain()
      this.master.gain.value = this.muted ? 0 : 0.62
      this.master.connect(A.destination)
      const dl = A.createDelay(1)
      dl.delayTime.value = 0.29
      const fb = A.createGain()
      fb.gain.value = 0.28
      const wet = A.createGain()
      wet.gain.value = 0.2
      this.fxSend = A.createGain()
      this.fxSend.gain.value = 1
      this.fxSend.connect(dl)
      dl.connect(fb)
      fb.connect(dl)
      dl.connect(wet)
      wet.connect(this.master)
    } catch {
      // audio unavailable — the site stays silent
    }
  }

  setMuted(muted: boolean) {
    this.muted = muted
    storeMuted(muted)
    this.init()
    if (this.master && this.actx) {
      this.master.gain.cancelScheduledValues(this.actx.currentTime)
      this.master.gain.linearRampToValueAtTime(
        muted ? 0 : 0.62,
        this.actx.currentTime + 0.25
      )
    }
  }

  plink(f: number, g = 0.42, decay = 2.1) {
    if (!this.actx || !this.master || !this.fxSend || this.muted) return
    const A = this.actx
    const t = A.currentTime
    const partials: [number, number][] = [
      [1, g],
      [2, g * 0.26],
      [2.99, g * 0.09],
    ]
    for (const [m, gg] of partials) {
      const o = A.createOscillator()
      const gn = A.createGain()
      o.type = "sine"
      o.frequency.value = f * m
      gn.gain.setValueAtTime(0, t)
      gn.gain.linearRampToValueAtTime(gg, t + 0.012)
      gn.gain.exponentialRampToValueAtTime(0.0001, t + decay)
      o.connect(gn)
      gn.connect(this.master)
      gn.connect(this.fxSend)
      o.start(t)
      o.stop(t + decay + 0.1)
    }
  }

  click() {
    if (!this.actx || !this.master || this.muted) return
    const A = this.actx
    const t = A.currentTime
    const o = A.createOscillator()
    const g = A.createGain()
    o.type = "sine"
    o.frequency.setValueAtTime(320, t)
    o.frequency.exponentialRampToValueAtTime(140, t + 0.08)
    g.gain.setValueAtTime(0.14, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1)
    o.connect(g)
    g.connect(this.master)
    o.start(t)
    o.stop(t + 0.12)
  }
}
