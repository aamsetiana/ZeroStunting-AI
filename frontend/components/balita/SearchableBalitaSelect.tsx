"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Search, ChevronDown, Check, X, Baby } from "lucide-react";
import type { BalitaItem } from "./RiwayatData";

interface SearchableBalitaSelectProps {
  balitaList: BalitaItem[];
  selectedId: string;
  onSelect: (balita: BalitaItem) => void;
}

export function SearchableBalitaSelect({
  balitaList,
  selectedId,
  onSelect,
}: SearchableBalitaSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedBalita = useMemo(() => {
    return balitaList.find((b) => b.id === selectedId) || balitaList[0];
  }, [balitaList, selectedId]);

  // Filter balita berdasarkan nama, nama ibu, atau dusun
  const filteredList = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return balitaList;
    return balitaList.filter(
      (b) =>
        b.nama.toLowerCase().includes(q) ||
        b.namaIbu.toLowerCase().includes(q) ||
        b.dusun.toLowerCase().includes(q) ||
        (b.nik && b.nik.includes(q))
    );
  }, [balitaList, query]);

  // Close when clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (balita: BalitaItem) => {
    onSelect(balita);
    setIsOpen(false);
    setQuery("");
  };

  return (
    <div ref={containerRef} style={{ position: "relative", flex: "1 1 360px", minWidth: 260 }}>
      {/* Trigger Button (Tampilan balita terpilih) */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          padding: "9px 14px",
          borderRadius: 10,
          border: isOpen ? "1.5px solid #16A34A" : "1.5px solid #CBD5E1",
          background: "#FFFFFF",
          color: "#0F172A",
          fontSize: 14,
          fontWeight: 700,
          cursor: "pointer",
          textAlign: "left",
          outline: "none",
          transition: "all 0.15s ease",
          boxShadow: isOpen ? "0 0 0 3px rgba(22, 163, 74, 0.12)" : "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, overflow: "hidden" }}>
          <Search size={16} color="#64748B" style={{ flexShrink: 0 }} />
          <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {selectedBalita ? (
              <>
                <strong style={{ color: "#0F172A" }}>{selectedBalita.nama}</strong>{" "}
                <span style={{ color: "#64748B", fontWeight: 600 }}>
                  ({selectedBalita.umurBulan} bln — {selectedBalita.jenisKelamin === "L" ? "Laki-laki" : "Perempuan"})
                </span>
              </>
            ) : (
              "Cari nama balita..."
            )}
          </span>
        </div>
        <ChevronDown
          size={16}
          color="#64748B"
          style={{
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
            flexShrink: 0,
          }}
        />
      </button>

      {/* Popover Live Search & Daftar Hasil */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            zIndex: 60,
            background: "#FFFFFF",
            border: "1.5px solid #CBD5E1",
            borderRadius: 12,
            boxShadow: "0 12px 28px -4px rgba(15, 23, 42, 0.15), 0 4px 10px -2px rgba(15, 23, 42, 0.08)",
            padding: 8,
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          {/* Input Live Search */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "7px 12px",
              borderRadius: 8,
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
            }}
          >
            <Search size={15} color="#16A34A" style={{ flexShrink: 0 }} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ketik nama balita, ibu, atau dusun..."
              style={{
                flex: 1,
                border: "none",
                background: "transparent",
                fontSize: 13,
                fontWeight: 600,
                color: "#0F172A",
                outline: "none",
              }}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#94A3B8",
                  cursor: "pointer",
                  padding: 2,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* List Hasil Pencarian */}
          <div
            style={{
              maxHeight: 250,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            {filteredList.length === 0 ? (
              <div
                style={{
                  padding: "16px 12px",
                  textAlign: "center",
                  fontSize: 13,
                  color: "#64748B",
                }}
              >
                Tidak ada balita yang cocok dengan kata kunci &ldquo;<strong>{query}</strong>&rdquo;
              </div>
            ) : (
              filteredList.map((balita) => {
                const isSelected = balita.id === selectedId;
                return (
                  <button
                    key={balita.id}
                    type="button"
                    onClick={() => handleSelect(balita)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "none",
                      background: isSelected ? "#F0FDF4" : "transparent",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background 0.15s ease",
                      color: "#0F172A",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = "#F8FAFC";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: isSelected ? "#15803D" : "#0F172A" }}>
                          {balita.nama}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: "1px 6px",
                            borderRadius: 4,
                            background: balita.jenisKelamin === "L" ? "#E0F2FE" : "#FCE7F3",
                            color: balita.jenisKelamin === "L" ? "#0284C7" : "#DB2777",
                          }}
                        >
                          {balita.jenisKelamin === "L" ? "♂ L" : "♀ P"}
                        </span>
                        <span style={{ fontSize: 12, color: "#64748B" }}>
                          {balita.umurBulan} Bulan
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: "#64748B" }}>
                        Ibu: {balita.namaIbu} • {balita.dusun.split(" (")[0]}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 6,
                          background:
                            balita.statusGizi === "rujukan"
                              ? "#FEE2E2"
                              : balita.statusGizi === "waspada"
                              ? "#FEF3C7"
                              : "#DCFCE7",
                          color:
                            balita.statusGizi === "rujukan"
                              ? "#B91C1C"
                              : balita.statusGizi === "waspada"
                              ? "#B45309"
                              : "#15803D",
                        }}
                      >
                        {balita.labelStatus}
                      </span>
                      {isSelected && <Check size={16} color="#16A34A" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
