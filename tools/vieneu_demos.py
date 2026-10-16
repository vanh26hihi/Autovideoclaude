# Generate one demo clip per VieNeu-TTS preset voice (same text) into voice-demos/.
import os, subprocess
from vieneu import Vieneu

TEXT = ("Mỗi người dành khoảng một phần ba cuộc đời để ngủ. "
        "Trong lúc bạn nhắm mắt, não bộ vẫn đang làm việc chăm chỉ, dọn dẹp chất thải và sắp xếp lại ký ức.")
os.makedirs("voice-demos", exist_ok=True)
tts = Vieneu()
voices = tts.list_preset_voices()
with open("voice-demos/voices.txt", "w", encoding="utf-8") as f:
    for i, (label, vid) in enumerate(voices, 1):
        print(f"[{i}/{len(voices)}] {label} ({vid})", flush=True)
        wav = f"voice-demos/{i:02d}.wav"
        tts.save(tts.infer(TEXT, voice=vid), wav)
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", wav, "-b:a", "128k", f"voice-demos/{i:02d}.mp3"], check=True)
        os.remove(wav)
        f.write(f"{i:02d}\t{label}\t{vid}\n")
