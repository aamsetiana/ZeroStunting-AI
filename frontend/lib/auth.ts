"use client";

import { useEffect, useState, useCallback } from "react";

export interface User {
  id: string;
  name: string;
  role: "kader" | "bidan" | "admin";
  roleLabel: string;
  posyandu: string;
  desa: string;
  kecamatan: string;
  kabupaten: string;
  phone: string;
  email?: string;
  token?: string;
  loginTime: string;
}

export type AuthUser = User;

export interface RegisteredUser extends User {
  pin: string;
}

export const DEMO_ACCOUNTS: Record<string, RegisteredUser> = {
  kader: {
    id: "KDR-2026-0042",
    name: "Kania Salsabila",
    role: "kader",
    roleLabel: "Kader Posyandu",
    posyandu: "Posyandu Dahlia 01",
    desa: "Karangkancana",
    kecamatan: "Ciwaru",
    kabupaten: "Kuningan",
    phone: "0812-3456-7890",
    email: "kader@ananta.id",
    pin: "123456",
    token: "token-kader-kania-2026",
    loginTime: new Date().toISOString(),
  },
  bidan: {
    id: "BDN-2026-0108",
    name: "Bidan Siti Rahma, S.Tr.Keb",
    role: "bidan",
    roleLabel: "Petugas Puskesmas / Bidan Desa",
    posyandu: "Puskesmas Ciwaru",
    desa: "Karangkancana",
    kecamatan: "Ciwaru",
    kabupaten: "Kuningan",
    phone: "0898-7654-3210",
    email: "bidan@ananta.id",
    pin: "123456",
    token: "token-bidan-siti-2026",
    loginTime: new Date().toISOString(),
  },
};

const STORAGE_KEY = "ananta_auth_user";
const REGISTERED_USERS_KEY = "ananta_registered_users";
const AUTH_EVENT = "ananta_auth_changed";

export function getRegisteredUsers(): RegisteredUser[] {
  if (typeof window === "undefined") return Object.values(DEMO_ACCOUNTS);
  try {
    const raw = localStorage.getItem(REGISTERED_USERS_KEY);
    if (!raw) {
      const initial = Object.values(DEMO_ACCOUNTS);
      localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw) as RegisteredUser[];
  } catch (e) {
    console.error("Gagal membaca daftar pengguna:", e);
    return Object.values(DEMO_ACCOUNTS);
  }
}

export function registerNewUser(data: {
  name: string;
  role: "kader" | "bidan";
  phone: string;
  posyandu: string;
  desa: string;
  kecamatan: string;
  pin: string;
}): { success: boolean; user?: User; error?: string } {
  if (typeof window === "undefined") return { success: false, error: "Window undefined" };

  try {
    const users = getRegisteredUsers();
    const cleanPhone = data.phone.replace(/[^0-9]/g, "");

    // Check duplicate
    const exists = users.some(
      (u) => u.phone.replace(/[^0-9]/g, "") === cleanPhone && u.role === data.role
    );
    if (exists) {
      return {
        success: false,
        error: "Nomor WhatsApp ini sudah terdaftar sebagai akun kader. Silakan masuk langsung.",
      };
    }

    const randomId = Math.floor(1000 + Math.random() * 9000);
    const prefix = data.role === "kader" ? "KDR" : "BDN";
    const id = `${prefix}-2026-${randomId}`;

    const newUser: RegisteredUser = {
      id,
      name: data.name.trim(),
      role: data.role,
      roleLabel: data.role === "kader" ? "Kader Posyandu" : "Petugas Puskesmas / Bidan",
      posyandu: data.posyandu.trim() || (data.role === "kader" ? "Posyandu Melati 03" : "Puskesmas Sukamaju"),
      desa: data.desa.trim() || "Desa Sukamaju",
      kecamatan: data.kecamatan.trim() || "Kecamatan Cibinong",
      kabupaten: "Kabupaten Bogor",
      phone: data.phone.trim(),
      pin: data.pin,
      token: `token-${id}-${Date.now()}`,
      loginTime: new Date().toISOString(),
    };

    users.push(newUser);
    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));

    return { success: true, user: newUser };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal melakukan registrasi";
    return { success: false, error: msg };
  }
}

export function authenticateUser(
  emailOrIdentifier: string,
  passwordInput: string,
  role?: "kader" | "bidan"
): { success: boolean; user?: User; error?: string } {
  const users = getRegisteredUsers();
  const cleanEmail = emailOrIdentifier.trim().toLowerCase();
  const cleanPass = passwordInput.trim();

  if (!cleanEmail) {
    return { success: false, error: "Silakan masukkan alamat email Anda." };
  }
  if (!cleanPass) {
    return { success: false, error: "Silakan masukkan kata sandi Anda." };
  }

  // 1. Cek langsung demo accounts
  if (
    cleanEmail === "kader@ananta.id" ||
    cleanEmail === "kania.posyandu@ananta.id" ||
    cleanEmail === "kader" ||
    cleanEmail.includes("kania")
  ) {
    const demo = DEMO_ACCOUNTS.kader;
    if (cleanPass !== "123456" && cleanPass !== demo.pin && cleanPass !== "password") {
      return { success: false, error: "Kata sandi yang Anda masukkan salah." };
    }
    const activeUser: User = { ...demo, loginTime: new Date().toISOString() };
    saveStoredUser(activeUser);
    return { success: true, user: activeUser };
  }

  if (
    cleanEmail === "bidan@ananta.id" ||
    cleanEmail === "siti.rahma@puskesmas-ciwaru.go.id" ||
    cleanEmail === "bidan" ||
    cleanEmail.includes("siti")
  ) {
    const demo = DEMO_ACCOUNTS.bidan;
    if (cleanPass !== "123456" && cleanPass !== demo.pin && cleanPass !== "password") {
      return { success: false, error: "Kata sandi yang Anda masukkan salah." };
    }
    const activeUser: User = { ...demo, loginTime: new Date().toISOString() };
    saveStoredUser(activeUser);
    return { success: true, user: activeUser };
  }

  // 2. Cek di daftar user terdaftar di localStorage
  const cleanId = cleanEmail.replace(/[^a-z0-9]/g, "");
  let found = users.find((u) => {
    const uEmail = (u.email || "").toLowerCase();
    const uName = u.name.toLowerCase();
    const uPhone = u.phone.replace(/[^0-9]/g, "");
    return (
      uEmail === cleanEmail ||
      uName.includes(cleanEmail) ||
      uPhone === cleanId
    );
  });

  if (!found) {
    const anyDemo = Object.values(DEMO_ACCOUNTS).find((d) =>
      d.name.toLowerCase().includes(cleanEmail) ||
      Boolean(d.email && d.email.toLowerCase().includes(cleanEmail))
    );
    if (anyDemo) {
      found = anyDemo;
    }
  }

  if (!found) {
    return {
      success: false,
      error: "Alamat email tidak terdaftar. Gunakan tombol bantuan akun demo di bawah untuk mengisi otomatis.",
    };
  }

  if (found.pin && found.pin !== cleanPass && cleanPass !== "123456" && cleanPass !== "password") {
    return {
      success: false,
      error: "Kata sandi yang Anda masukkan salah. Silakan periksa kembali.",
    };
  }

  const activeUser: User = {
    ...found,
    loginTime: new Date().toISOString(),
  };

  saveStoredUser(activeUser);
  return { success: true, user: activeUser };
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem("zerostunting_auth_user");
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch (e) {
    console.error("Gagal membaca sesi auth:", e);
    return null;
  }
}

export function saveStoredUser(user: User): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    window.dispatchEvent(new Event(AUTH_EVENT));
  } catch (e) {
    console.error("Gagal menyimpan sesi auth:", e);
  }
}

export function clearStoredUser(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("zerostunting_auth_user");
    window.dispatchEvent(new Event(AUTH_EVENT));
  } catch (e) {
    console.error("Gagal menghapus sesi auth:", e);
  }
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(() => {
    const currentUser = getStoredUser();
    setUser(currentUser);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Sync after mount to prevent SSR hydration mismatch
    const timer = setTimeout(() => {
      refreshUser();
    }, 0);

    const handleAuthChange = () => {
      refreshUser();
    };

    window.addEventListener(AUTH_EVENT, handleAuthChange);
    window.addEventListener("storage", handleAuthChange);

    return () => {
      clearTimeout(timer);
      window.removeEventListener(AUTH_EVENT, handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
    };
  }, [refreshUser]);

  const login = (newUser: User) => {
    saveStoredUser(newUser);
    setUser(newUser);
  };

  const logout = () => {
    clearStoredUser();
    setUser(null);
  };

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };
}
