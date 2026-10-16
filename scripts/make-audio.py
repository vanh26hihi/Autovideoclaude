"""Generate the background music and sound effects used by the SocialMedia video.

Everything is synthesized with numpy, so there are no licensing concerns.
Run: python3 scripts/make-audio.py  (needs numpy and ffmpeg)
"""
import os
import subprocess
import wave

import numpy as np

SR = 44100
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "audio")
rng = np.random.default_rng(7)


def note(n):
    """MIDI note number -> frequency."""
    return 440.0 * 2 ** ((n - 69) / 12)


def env(length, attack, release):
    e = np.ones(length)
    a, r = int(attack * SR), int(release * SR)
    e[:a] = np.linspace(0, 1, a)
    e[-r:] *= np.linspace(1, 0, r)
    return e


def write(name, stereo):
    stereo = stereo / max(1e-9, np.abs(stereo).max()) * 0.9
    wav = os.path.join(OUT, name + ".wav")
    with wave.open(wav, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((stereo * 32767).astype("<i2").tobytes())
    subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-y", "-i", wav, "-b:a", "160k", os.path.join(OUT, name + ".mp3")],
        check=True,
    )
    os.remove(wav)


def music(duration=60.0, bpm=84):
    n = int(duration * SR)
    left, right = np.zeros(n), np.zeros(n)
    beat = 60 / bpm
    bar = beat * 4
    # Am - F - C - G, a calm, reflective loop
    chords = [[57, 60, 64], [53, 57, 60], [48, 55, 64], [55, 59, 62]]
    bass = [45, 41, 48, 43]
    t_bar = np.arange(int(bar * SR)) / SR

    bars = int(np.ceil(duration / bar))
    for b in range(bars):
        start = int(b * bar * SR)
        idx = b % 4
        seg = slice(start, min(n, start + len(t_bar)))
        length = seg.stop - seg.start
        t = t_bar[:length]
        # warm pad: detuned sines with soft swell
        pad = np.zeros(length)
        for m in chords[idx]:
            f = note(m)
            pad += np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 1.003 * t + 1)
            pad += 0.25 * np.sin(2 * np.pi * 2 * f * t)
        pad *= env(length, 0.6, 0.6) * 0.06
        # sub bass on beats 1 and 3
        bs = np.zeros(length)
        for k in (0, 2):
            s = int(k * beat * SR)
            l = min(int(1.6 * beat * SR), length - s)
            if l > 0:
                tt = np.arange(l) / SR
                bs[s : s + l] += np.sin(2 * np.pi * note(bass[idx]) * tt) * np.exp(-tt * 1.8)
        bs *= 0.18
        left[seg] += pad + bs
        right[seg] += pad * 0.95 + bs
        # pluck arpeggio on eighth notes
        arp = chords[idx] + [chords[idx][0] + 12]
        for k in range(8):
            s = start + int(k * beat / 2 * SR)
            l = int(0.5 * SR)
            if s + l > n:
                break
            tt = np.arange(l) / SR
            f = note(arp[[0, 1, 2, 3, 2, 1, 2, 3][k]] + 12)
            p = (np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(4 * np.pi * f * tt)) * np.exp(-tt * 7) * 0.05
            pan = 0.3 + 0.4 * (k % 2)
            left[s : s + l] += p * (1 - pan)
            right[s : s + l] += p * pan
        # soft kick and hat, starting after the intro bars
        if b >= 2:
            for k in range(4):
                s = start + int(k * beat * SR)
                if k in (0, 2):
                    l = int(0.3 * SR)
                    if s + l <= n:
                        tt = np.arange(l) / SR
                        f = 50 + 70 * np.exp(-tt * 30)
                        kick = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 12) * 0.22
                        left[s : s + l] += kick
                        right[s : s + l] += kick
                h = s + int(beat / 2 * SR)
                l = int(0.05 * SR)
                if h + l <= n:
                    hat = np.diff(rng.standard_normal(l + 1)) * np.exp(-np.arange(l) / SR * 80) * 0.015
                    left[h : h + l] += hat
                    right[h : h + l] += hat * 0.8

    fade = env(n, 2.0, 4.0)
    write("music", np.stack([left * fade, right * fade], axis=1))


def whoosh(duration=0.8):
    n = int(duration * SR)
    noise = rng.standard_normal(n)
    sweep = np.linspace(0.02, 0.35, n) ** 1.5
    y = np.empty(n)
    acc = 0.0
    for i in range(n):
        acc += sweep[i] * (noise[i] - acc)
        y[i] = acc
    shape = np.sin(np.linspace(0, np.pi, n)) ** 2
    y *= shape
    write("whoosh", np.stack([y, y * 0.9], axis=1) * 0.6)


def pop():
    l = int(0.18 * SR)
    t = np.arange(l) / SR
    f = 900 * np.exp(-t * 18) + 300
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 28)
    write("pop", np.stack([y, y], axis=1) * 0.5)


def ding():
    l = int(0.9 * SR)
    t = np.arange(l) / SR
    y = sum(a * np.sin(2 * np.pi * note(m) * t) for m, a in [(88, 1), (95, 0.4), (100, 0.2)]) * np.exp(-t * 5)
    write("ding", np.stack([y, y], axis=1) * 0.4)


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    music()
    whoosh()
    pop()
    ding()
