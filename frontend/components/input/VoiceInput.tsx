"use client";

import React, { useState } from "react";
import { Mic, MicOff, Volume2 } from "lucide-react";

export interface VoiceExtractedData {
  nama_anak?: string;
  umur_bulan?: number;
  berat_kg?: number;
  tinggi_cm?: number;
  jenis_kelamin?: "L" | "P";
}

interface VoiceInputProps {
  onExtracted: (data: VoiceExtractedData) => void;
}

export function VoiceInput({ onExtracted }: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [speechTranscript, setSpeechTranscript] = useState("");
  const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null);

  // NLP Voice Parser Bahasa Indonesia (Mode 2)
  const parseVoiceText = (text: string) => {
    let nama = "";
    let umur: number | undefined;
    let berat: number | undefined;
    let tinggi: number | undefined;
    let jk: "L" | "P" = "L";

    // Normalisasi teks
    const lower = text.toLowerCase().replace(/koma/g, ".");

    // Deteksi Jenis Kelamin
    if (lower.includes("perempuan") || lower.includes("cewek") || lower.includes("anak perempuan") || lower.includes("putri")) {
      jk = "P";
    }

    // Deteksi Umur (bulan)
    const ageMatch = lower.match(/(?:umur|usia)\s*(\d+)\s*(?:bulan)?/);
    if (ageMatch) umur = parseInt(ageMatch[1], 10);

    // Deteksi Berat Badan (kg)
    const weightMatch = lower.match(/(?:berat|bb)\s*(\d+(?:\.\d+)?)\s*(?:kg|kilo)?/);
    if (weightMatch) berat = parseFloat(weightMatch[1]);

    // Deteksi Tinggi Badan (cm)
    const heightMatch = lower.match(/(?:tinggi|panjang|tb|pb)\s*(\d+(?:\.\d+)?)\s*(?:cm|senti)?/);
    if (heightMatch) tinggi = parseFloat(heightMatch[1]);

    // Deteksi Nama Balita
    const nameMatch = lower.match(/(?:anak|nama)\s+([a-zA-Z\s]+?)(?:,|umur|berat|tinggi|$)/);
    if (nameMatch) {
      nama = nameMatch[1].trim();
      nama = nama.charAt(0).toUpperCase() + nama.slice(1);
    }

    const extracted: VoiceExtractedData = {
      nama_anak: nama || undefined,
      umur_bulan: umur,
      berat_kg: berat,
      tinggi_cm: tinggi,
      jenis_kelamin: jk,
    };

    onExtracted(extracted);
    setVoiceFeedback(
      `Berhasil mengekstrak data dari suara: ${nama ? `Anak ${nama}, ` : ""}Umur ${umur ?? "-"} bln, BB ${berat ?? "-"} kg, TB ${tinggi ?? "-"} cm.`
    );
  };

  const handleSpeakText = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const ut = new SpeechSynthesisUtterance(text);
    ut.lang = "id-ID";
    window.speechSynthesis.speak(ut);
  };

  // Trigger simulasi ucapan cepat
  const handleSimulateVoice = (sampleText: string) => {
    setSpeechTranscript(sampleText);
    parseVoiceText(sampleText);
  };

  const handleToggleVoice = () => {
    if (isRecording) {
      setIsRecording(false);
      return;
    }

    interface SpeechRecognitionResultItem {
      transcript: string;
    }

    interface SpeechRecognitionEventLike {
      results: {
        [index: number]: {
          [index: number]: SpeechRecognitionResultItem;
        };
      };
    }

    interface SpeechRecognitionInstance {
      lang: string;
      continuous: boolean;
      interimResults: boolean;
      onstart: (() => void) | null;
      onresult: ((event: SpeechRecognitionEventLike) => void) | null;
      onerror: (() => void) | null;
      onend: (() => void) | null;
      start: () => void;
    }

    type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

    // Cek dukungan Web Speech API pada browser
    const windowWithSpeech = window as unknown as {
      SpeechRecognition?: SpeechRecognitionCtor;
      webkitSpeechRecognition?: SpeechRecognitionCtor;
    };
    const SpeechRecognition =
      windowWithSpeech.SpeechRecognition ||
      windowWithSpeech.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceFeedback("Browser belum mendukung perekaman mikrofon langsung. Gunakan tombol simulasi ucapan cepat di bawah!");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "id-ID";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsRecording(true);
        setVoiceFeedback("Mendengarkan... Silakan ucapkan data balita (contoh: 'Anak Budi, umur 24 bulan, berat 11.5 kg, tinggi 86 cm')");
      };

      recognition.onresult = (event: SpeechRecognitionEventLike) => {
        const transcript = event.results[0][0].transcript;
        setSpeechTranscript(transcript);
        parseVoiceText(transcript);
        setIsRecording(false);
      };

      recognition.onerror = () => {
        setIsRecording(false);
        setVoiceFeedback("Gagal mendeteksi mikrofon atau izin ditolak. Silakan gunakan tombol simulasi ucapan cepat di bawah.");
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } catch {
      setIsRecording(false);
      setVoiceFeedback("Mikrofon tidak dapat diakses. Gunakan tombol simulasi ucapan cepat di bawah.");
    }
  };

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #BBF7D0",
        borderRadius: 16,
        padding: "20px",
        marginBottom: 20,
        boxShadow: "0 4px 14px rgba(22, 163, 74, 0.08)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button
            type="button"
            onClick={handleToggleVoice}
            title={isRecording ? "Hentikan Merekam" : "Mulai Merekam Suara"}
            style={{
              width: 50,
              height: 50,
              borderRadius: "50%",
              border: "none",
              cursor: "pointer",
              background: isRecording ? "#EF4444" : "#16A34A",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: isRecording
                ? "0 0 16px rgba(239, 68, 68, 0.55)"
                : "0 4px 12px rgba(22, 163, 74, 0.3)",
              transition: "all 0.2s",
              flexShrink: 0,
            }}
          >
            {isRecording ? <MicOff size={22} /> : <Mic size={22} />}
          </button>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#0F172A" }}>
                {isRecording ? "Mendengarkan Suara Ibu Kader..." : "Klik Mikrofon & Ucapkan Pengukuran Balita"}
              </h4>
              {isRecording && (
                <span style={{ fontSize: 10, color: "#DC2626", background: "#FEE2E2", padding: "2px 8px", borderRadius: 99, fontWeight: 700 }}>
                  🔴 Sedang Merekam
                </span>
              )}
            </div>
            <p style={{ margin: "3px 0 0", fontSize: 11.5, color: "#64748B" }}>
              Format bebas: &ldquo;Anak Budi Santoso, umur 24 bulan, berat 12.5 kg, tinggi 87 cm, laki-laki&rdquo;
            </p>
          </div>
        </div>

        {/* Audio Wave Visualizer saat Merekam */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {isRecording ? (
            <div style={{ display: "flex", alignItems: "center", gap: 3, height: 26 }} title="Merekam gelombang audio">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                <span key={i} className="audio-bar" style={{ background: "#EF4444" }} />
              ))}
            </div>
          ) : (
            <span style={{ fontSize: 11, color: "#16A34A", fontWeight: 700, background: "#DCFCE7", padding: "4px 10px", borderRadius: 99 }}>
              🎙️ Mode 2: Voice-to-Form
            </span>
          )}
        </div>
      </div>

      {/* Feedback & Instruksi */}
      {voiceFeedback && (
        <div
          style={{
            fontSize: 12,
            padding: "8px 12px",
            borderRadius: 8,
            marginBottom: 10,
            background: isRecording ? "#FEF2F2" : "#F0FDF4",
            color: isRecording ? "#991B1B" : "#166534",
            border: `1px solid ${isRecording ? "#FCA5A5" : "#BBF7D0"}`,
          }}
        >
          {voiceFeedback}
        </div>
      )}

      {/* Real-time Transcript Preview */}
      {speechTranscript && (
        <div
          style={{
            background: "#F8FAFC",
            border: "1px solid #E2E8F0",
            borderRadius: 10,
            padding: "10px 14px",
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <div style={{ fontSize: 12, color: "#334155" }}>
            <span style={{ fontWeight: 700, color: "#16A34A" }}>Transkrip Suara: </span>
            &ldquo;{speechTranscript}&rdquo;
          </div>
          <button
            type="button"
            onClick={() => handleSpeakText(`Transkrip tercatat: ${speechTranscript}`)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "4px 8px",
              borderRadius: 6,
              border: "1px solid #E2E8F0",
              background: "#FFFFFF",
              fontSize: 10.5,
              color: "#475569",
              cursor: "pointer",
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            <Volume2 size={12} color="#16A34A" /> Baca Ulang
          </button>
        </div>
      )}

      {/* Quick Simulation Chips */}
      <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: 10 }}>
        <span style={{ fontSize: 11, color: "#64748B", fontWeight: 700 }}>Simulasi Ucapan Suara Cepat (1-Klik):</span>
        <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => handleSimulateVoice("Anak Budi Santoso, umur 24 bulan, berat 12.5 kg, tinggi 87 cm, laki-laki")}
            style={{
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: 8,
              padding: "5px 10px",
              fontSize: 11,
              color: "#334155",
              cursor: "pointer",
            }}
          >
            🗣️ &ldquo;Budi Santoso, 24 bln, BB 12.5 kg, TB 87 cm (Normal)&rdquo;
          </button>
          <button
            type="button"
            onClick={() => handleSimulateVoice("Anak Siti Aisyah, umur 18 bulan, berat 8.2 kg, tinggi 74 cm, perempuan")}
            style={{
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: 8,
              padding: "5px 10px",
              fontSize: 11,
              color: "#334155",
              cursor: "pointer",
            }}
          >
            🗣️ &ldquo;Siti Aisyah, 18 bln, BB 8.2 kg, TB 74 cm (Waspada Stunting)&rdquo;
          </button>
          <button
            type="button"
            onClick={() => handleSimulateVoice("Anak Dimas Saputra, umur 26 bulan, berat 8.8 kg, tinggi 81 cm, laki-laki")}
            style={{
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: 8,
              padding: "5px 10px",
              fontSize: 11,
              color: "#334155",
              cursor: "pointer",
            }}
          >
            🗣️ &ldquo;Dimas Saputra, 26 bln, BB 8.8 kg, TB 81 cm (Stunting Berat)&rdquo;
          </button>
        </div>
      </div>
    </div>
  );
}
