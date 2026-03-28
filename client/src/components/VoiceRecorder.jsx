import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Trash2 } from 'lucide-react';

export default function VoiceRecorder({ onRecordingComplete, onClear }) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        const file = new File([audioBlob], 'voice_note.webm', { type: 'audio/webm' });
        onRecordingComplete(file);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    } catch (err) {
      console.error('Mic error:', err);
      alert('Microphone access denied or unavailable.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const clearAudio = () => {
    setAudioUrl(null);
    if (onClear) onClear();
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-4 bg-black/30 border border-white/10 rounded-xl p-3">
      {!isRecording && !audioUrl && (
        <button
          type="button"
          onClick={startRecording}
          className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 rounded-xl text-sm font-medium transition-colors"
        >
          <Mic className="h-4 w-4" /> Start Recording
        </button>
      )}

      {isRecording && (
        <div className="flex items-center gap-4 w-full">
          <div className="flex items-center gap-2 text-red-400 animate-pulse">
            <Mic className="h-4 w-4" />
            <span className="text-sm font-mono font-medium">{formatTime(recordingTime)}</span>
          </div>
          <button
            type="button"
            onClick={stopRecording}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 rounded-xl text-sm font-medium transition-colors ml-auto"
          >
            <Square className="h-4 w-4" /> Stop
          </button>
        </div>
      )}

      {audioUrl && !isRecording && (
        <div className="flex items-center gap-3 w-full">
          <audio src={audioUrl} controls className="h-9 flex-1 min-w-0" style={{ colorScheme: 'dark' }} />
          <button
            type="button"
            onClick={clearAudio}
            className="p-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors shrink-0"
            title="Delete recording"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
