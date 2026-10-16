"""Generate the Vietnamese voiceover for the SocialMedia video with eSpeak NG.

Needs: python3 -m pip install espeakng-loader, plus ffmpeg.
Each line is written to public/audio/vo-<n>.mp3 and fitted to its scene length.
Run: python3 scripts/make-voiceover.py
"""
import ctypes
import os
import subprocess
import wave

import espeakng_loader

OUT = os.path.join(os.path.dirname(__file__), "..", "public", "audio")

# (text, seconds available in the scene)
LINES = [
    ("Hôm nay, bạn đã lướt điện thoại bao lâu?", 5.0),
    (
        "Giả sử mỗi ngày, bạn dành ba giờ cho mạng xã hội. "
        "Một năm sẽ là một nghìn không trăm chín mươi lăm giờ, tương đương bốn mươi lăm ngày.",
        9.5,
    ),
    (
        "Cái giá phải trả là vô hình. Chúng ta ngủ ít hơn. Hay so sánh bản thân với người khác. "
        "Khó tập trung hơn. Và cô đơn, dù luôn được kết nối.",
        14.0,
    ),
    ("Kết nối nhiều hơn, nhưng gần nhau ít hơn?", 5.0),
    (
        "Hãy lấy lại thời gian của bạn. Tắt thông báo không cần thiết. Cất điện thoại một giờ trước khi ngủ. "
        "Đặt giới hạn cho từng ứng dụng. Và hẹn gặp bạn bè ngoài đời thật.",
        11.5,
    ),
    ("Hãy dùng mạng xã hội, đừng để nó dùng bạn. Đặt điện thoại xuống, và nhìn lên.", 8.5),
]

lib = ctypes.CDLL(espeakng_loader.get_library_path())
CALLBACK = ctypes.CFUNCTYPE(ctypes.c_int, ctypes.POINTER(ctypes.c_short), ctypes.c_int, ctypes.c_void_p)
samples: list[int] = []


@CALLBACK
def on_audio(wav, count, _events):
    if count > 0:
        samples.extend(wav[:count])
    return 0


AUDIO_OUTPUT_RETRIEVAL = 1
rate = lib.espeak_Initialize(AUDIO_OUTPUT_RETRIEVAL, 0, espeakng_loader.get_data_path().encode(), 0)
lib.espeak_SetSynthCallback(on_audio)
lib.espeak_SetVoiceByName(b"vi")
ESPEAK_RATE, ESPEAK_PITCH = 1, 3
lib.espeak_SetParameter(ESPEAK_PITCH, 45, 0)


def synth(text: str, wpm: int) -> float:
    samples.clear()
    lib.espeak_SetParameter(ESPEAK_RATE, wpm, 0)
    data = text.encode("utf-8")
    ESPEAK_CHARS_UTF8 = 1
    lib.espeak_Synth(data, len(data) + 1, 0, 0, 0, ESPEAK_CHARS_UTF8, None, None)
    lib.espeak_Synchronize()
    return len(samples) / rate


os.makedirs(OUT, exist_ok=True)
for i, (text, budget) in enumerate(LINES, start=1):
    wpm = 125
    while synth(text, wpm) > budget and wpm < 260:
        wpm += 10
    wav = os.path.join(OUT, f"vo-{i}.wav")
    with wave.open(wav, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(rate)
        w.writeframes((ctypes.c_short * len(samples))(*samples))
    subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-y", "-i", wav, "-af", "loudnorm=I=-16", "-ar", "44100", "-b:a", "128k",
         os.path.join(OUT, f"vo-{i}.mp3")],
        check=True,
    )
    os.remove(wav)
    print(f"vo-{i}: {len(samples) / rate:.1f}s at {wpm} wpm (budget {budget}s)")
