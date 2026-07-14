"use client";

import { useRef, useState, useCallback, useEffect } from "react";

interface VoiceRecorderProps {
  audio: { id: string; url: string; file_name: string } | null;
  onAdd: (blob: Blob, fileName: string) => Promise<{ id: string; url: string; file_name: string } | null>;
  onRemove: () => void;
  maxDuration?: number;
}

export default function VoiceRecorder({ audio, onAdd, onRemove, maxDuration = 180 }: VoiceRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [playing, setPlaying] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const startRecording = useCallback(async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      setDuration(0);

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const recorder = new MediaRecorder(stream, { mimeType });
      recorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        if (timerRef.current) clearInterval(timerRef.current);
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;

        if (chunksRef.current.length === 0) return;

        const blob = new Blob(chunksRef.current, { type: mimeType });
        chunksRef.current = [];

        setUploading(true);
        try {
          await onAdd(blob, `voice-${Date.now()}.webm`);
        } catch {
          setError("语音上传失败");
        } finally {
          setUploading(false);
        }
      };

      recorder.start(1000);
      setRecording(true);

      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          if (prev >= maxDuration) {
            recorder.stop();
            setRecording(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch {
      setError("需要麦克风权限才能录制语音");
    }
  }, [maxDuration, onAdd]);

  const stopRecording = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
      setRecording(false);
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  }, [playing]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div>
      <label className="block text-sm text-bark/70 mb-2">
        语音留言 <span className="text-sepia/50 text-xs">(选填，最长{maxDuration}秒)</span>
      </label>

      {!audio ? (
        <div className="flex items-center gap-3">
          {!recording && !uploading && (
            <button
              type="button"
              onClick={startRecording}
              className="vintage-btn-outline vintage-btn-sm flex items-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
              开始录制
            </button>
          )}
          {recording && (
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-rust text-sm">
                <span className="w-2 h-2 rounded-full bg-rust animate-ping" />
                录制中 {formatTime(duration)}
              </span>
              <button
                type="button"
                onClick={stopRecording}
                className="vintage-btn-primary vintage-btn-sm bg-rust"
              >
                停止录制
              </button>
            </div>
          )}
          {uploading && (
            <span className="flex items-center gap-1 text-sepia/60 text-sm">
              <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" />
              </svg>
              上传中...
            </span>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-3 p-3 bg-cream/50 rounded-sm border border-sepia/20">
          <button
            type="button"
            onClick={togglePlay}
            className="w-8 h-8 rounded-full bg-moss/10 flex items-center justify-center text-moss hover:bg-moss/20 transition-colors"
          >
            {playing ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5,3 19,12 5,21" />
              </svg>
            )}
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-sepia/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-moss/40 rounded-full transition-all"
                  style={{ width: playing ? "60%" : "0%" }}
                />
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="text-sepia/40 hover:text-rust text-sm transition-colors"
          >
            删除
          </button>
          <audio
            ref={audioRef}
            src={audio.url}
            onEnded={() => setPlaying(false)}
            onPause={() => setPlaying(false)}
            className="hidden"
          />
        </div>
      )}

      {error && <p className="text-rust text-xs mt-1">{error}</p>}
    </div>
  );
}
