#!/usr/bin/env python3
"""Record every line in tools/voice/lines.json with a natural neural voice (Kokoro, voice af_heart).

    pip install kokoro-onnx soundfile --break-system-packages
    python3 tools/voice/make.py            # records only the lines that have no clip yet, then writes voice/v1/index.json

The model (~330 MB) is downloaded once to ~/.cache/kokoro from the kokoro-onnx GitHub release.
Clips: voice/v1/<id>.mp3 (mono MP3); id = the same hash the app computes from the line's text.
"""
import json, os, subprocess, sys, time, pathlib, urllib.request
import numpy as np

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / 'voice' / 'v1'
VOICE, SPEED = os.environ.get('CQ_VOICE', 'af_heart'), float(os.environ.get('CQ_SPEED', '0.92'))
CACHE = pathlib.Path(os.environ.get('CQ_MODEL_DIR', pathlib.Path.home() / '.cache' / 'kokoro'))
REL = 'https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/'


def model():
    CACHE.mkdir(parents=True, exist_ok=True)
    for f in ('kokoro-v1.0.onnx', 'voices-v1.0.bin'):
        if not (CACHE / f).exists():
            print('downloading', f); urllib.request.urlretrieve(REL + f, CACHE / f)
    from kokoro_onnx import Kokoro
    return Kokoro(str(CACHE / 'kokoro-v1.0.onnx'), str(CACHE / 'voices-v1.0.bin'))


def trim(s, sr, kind):
    """Cut silence at both ends; keep a short natural tail (longer after a whole sentence)."""
    thr = 0.012
    idx = np.where(np.abs(s) > thr)[0]
    if not len(idx):
        return s
    a = max(0, idx[0] - int(0.03 * sr))
    tail = 0.06 if kind in ('piece', 'num') else 0.22
    b = min(len(s), idx[-1] + int(tail * sr))
    return s[a:b]


def to_mp3(s, sr, path):
    pcm = (np.clip(s, -1, 1) * 32767).astype('<i2').tobytes()
    tmp = str(path) + '.tmp.mp3'
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-f', 's16le', '-ar', str(sr), '-ac', '1', '-i', '-',
                    '-af', 'afade=t=in:d=0.01', '-c:a', 'libmp3lame', '-b:a', '40k', tmp], input=pcm, check=True)
    os.replace(tmp, path)


def main():
    lines = json.load(open(ROOT / 'tools' / 'voice' / 'lines.json'))
    OUT.mkdir(parents=True, exist_ok=True)
    todo = [l for l in lines if not (OUT / (l['id'] + '.mp3')).exists()]
    limit = int(sys.argv[1]) if len(sys.argv) > 1 else len(todo)
    todo = todo[:limit]
    print(len(lines), 'lines,', len(todo), 'to record', flush=True)
    if todo:
        k = model()
        t0 = time.time()
        for i, l in enumerate(todo):
            text = l['t']
            try:
                s, sr = k.create(text, voice=VOICE, speed=SPEED, lang='en-us')
                to_mp3(trim(s, sr, l['kind']), sr, OUT / (l['id'] + '.mp3'))
            except Exception as e:  # a line the voice cannot say stays on the device voice
                print('FAILED', repr(text), e, flush=True)
            if i % 50 == 0:
                el = time.time() - t0
                print(f'{i}/{len(todo)}  {el:.0f}s  eta {el / (i + 1) * (len(todo) - i - 1) / 60:.0f} min', flush=True)
    have = sorted(p.stem for p in OUT.glob('*.mp3'))
    wanted = {l['id'] for l in lines}
    ids = [h for h in have if h in wanted]
    json.dump({'voice': VOICE, 'speed': SPEED, 'ids': ids}, open(OUT / 'index.json', 'w'), separators=(',', ':'))
    print('index.json:', len(ids), 'clips;', len(have) - len(ids), 'unused clips on disk')


if __name__ == '__main__':
    main()
