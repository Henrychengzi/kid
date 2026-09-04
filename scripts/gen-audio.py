#!/usr/bin/env python3
"""批量生成朗读音频（edge-tts 神经网络语音）。

用法：python3 scripts/gen-audio.py
读取 scripts/audio-tasks.json，输出 public/audio/<hash>.mp3

中文：zh-CN-XiaoxiaoNeural（温暖女声）
英文：en-US-AnaNeural（儿童女声）
语速由运行时 playbackRate 控制，这里按正常语速生成。
"""
import asyncio
import json
import sys
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parent.parent
TASKS_FILE = ROOT / "scripts" / "audio-tasks.json"
OUT_DIR = ROOT / "public" / "audio"

VOICES = {
    "zh-CN": "zh-CN-XiaoxiaoNeural",
    "en-US": "en-US-AnaNeural",
}
PROXY = "http://127.0.0.1:18080"  # 沙箱代理，本地环境改为 None 即可
CONCURRENCY = 8
RETRIES = 3

done = 0
failed = []


async def gen_one(task: dict, sem: asyncio.Semaphore):
    global done
    text, lang, h = task["text"], task["lang"], task["hash"]
    out = OUT_DIR / f"{h}.mp3"
    if out.exists() and out.stat().st_size > 0:
        done += 1
        return
    voice = VOICES["zh-CN" if lang.startswith("zh") else "en-US"]
    async with sem:
        for attempt in range(RETRIES):
            try:
                tts = edge_tts.Communicate(text, voice, proxy=PROXY or None)
                await tts.save(str(out))
                if out.exists() and out.stat().st_size > 0:
                    done += 1
                    if done % 200 == 0:
                        print(f"进度 {done}/{len(TASKS)}", flush=True)
                    return
            except Exception as e:
                if attempt == RETRIES - 1:
                    failed.append({"hash": h, "text": text, "error": str(e)[:120]})
                else:
                    await asyncio.sleep(1.5 * (attempt + 1))
    print(f"失败: {h} {text} ", flush=True)


async def main():
    tasks = json.loads(TASKS_FILE.read_text(encoding="utf-8"))
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    sem = asyncio.Semaphore(CONCURRENCY)
    print(f"开始生成 {len(tasks)} 条音频（并发 {CONCURRENCY}）...", flush=True)
    await asyncio.gather(*(gen_one(t, sem) for t in tasks))
    print(f"\n完成 {done}/{len(tasks)}，失败 {len(failed)}")
    if failed:
        (ROOT / "scripts" / "audio-failed.json").write_text(
            json.dumps(failed, ensure_ascii=False, indent=1), encoding="utf-8"
        )
        sys.exit(1)
    print("全部生成成功")


if __name__ == "__main__":
    asyncio.run(main())
