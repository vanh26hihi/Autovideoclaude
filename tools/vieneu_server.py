"""Local VieNeu-TTS server for the video pipeline.

POST /tts  {"text": "...", "voice": "Thiện Minh"}  ->  audio/mpeg bytes

Setup (once):  pip install vieneu   (Python 3.10–3.12; ffmpeg must be on PATH)
Run:           python tools/vieneu_server.py
Env:           VIENEU_VOICE (default "Thiện Minh"), VIENEU_PORT (default 8124)
"""
import io
import json
import os
import subprocess
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import soundfile as sf
from vieneu import Vieneu

DEFAULT_VOICE = os.environ.get("VIENEU_VOICE", "Thiện Minh")
PORT = int(os.environ.get("VIENEU_PORT", "8124"))
SAMPLE_RATE = 48000

tts = Vieneu()
lock = threading.Lock()  # one inference at a time on CPU


def to_mp3(samples) -> bytes:
    wav = io.BytesIO()
    sf.write(wav, samples, SAMPLE_RATE, format="WAV")
    return subprocess.run(
        ["ffmpeg", "-v", "error", "-i", "pipe:0", "-b:a", "192k", "-f", "mp3", "pipe:1"],
        input=wav.getvalue(), capture_output=True, check=True,
    ).stdout


class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path != "/tts":
            self.send_error(404)
            return
        try:
            body = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0))))
            text = body["text"]
            voice = body.get("voice") or DEFAULT_VOICE
        except (ValueError, KeyError):
            self.send_error(400, "expected JSON {text, voice?}")
            return
        try:
            with lock:
                mp3 = to_mp3(tts.infer(text, voice=voice))
        except Exception as e:  # surface as 500 so the client retries/reports
            self.send_error(500, str(e)[:200])
            return
        self.send_response(200)
        self.send_header("Content-Type", "audio/mpeg")
        self.send_header("Content-Length", str(len(mp3)))
        self.end_headers()
        self.wfile.write(mp3)

    def log_message(self, fmt, *args):
        print(f"[vieneu] {fmt % args}", flush=True)


if __name__ == "__main__":
    print(f"VieNeu-TTS server on http://127.0.0.1:{PORT}/tts (voice: {DEFAULT_VOICE})", flush=True)
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
