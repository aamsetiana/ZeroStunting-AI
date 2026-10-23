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

export interface RegisteredUser extends User {
  pin: string;
}

export const DEMO_ACCOUNTS: Record<string, RegisteredUser> = {
  kader: {
    id: "KDR-2026-0042",
    name: "Kania Salsabila",
    role: "kader",
    roleLabel: "Kader Posyandu",
    posyandu: "Posyandu Melati 03",
    desa: "Desa Sukamaju",
    kecamatan: "Kecamatan Cibinong",
    kabupaten: "Kabupaten Bogor",
    phone: "0812-3456-7890",
    email: "kania.posyandu@zerostunting.id",
    pin: "123456",
    token: "mock-jwt-token-kader-kania-2026",
    loginTime: new Date().toISOString(),
  },
  bidan: {
    id: "BDN-2026-0108",
    name: "Bidan Siti Rahma, S.Tr.Keb",
    role: "bidan",
    roleLabel: "Petugas Puskesmas / Bidan Desa",
    posyandu: "Puskesmas Pembantu Sukamaju",
    desa: "Desa Sukamaju",
    kecamatan: "Kecamatan Cibinong",
    kabupaten: "Kabupaten Bogor",
    phone: "0898-7654-3210",
    email: "siti.rahma@puskesmas-sukamaju.go.id",
    pin: "123456",
    token: "mock-jwt-token-bidan-siti-2026",
    loginTime: new Date().toISOString(),
  },
};

const STORAGE_KEY = "zerostunting_auth_user";
const REGISTERED_USERS_KEY = "zerostunting_registered_users";
const AUTH_EVENT = "zerostunting_auth_changed";

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
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal melakukan registrasi" };
  }
}

export function authenticateUser(
  identifier: string,
  pin: string,
  role: "kader" | "bidan"
): { success: boolean; user?: User; error?: string } {
  const users = getRegisteredUsers();
  const cleanId = identifier.trim().toLowerCase().replace(/[^a-z0-9]/g, "");

  const found = users.find((u) => {
    const phoneClean = u.phone.replace(/[^0-9]/g, "");
    const idClean = u.id.toLowerCase().replace(/[^a-z0-9]/g, "");
    const nameClean = u.name.toLowerCase();

    const matchesId =
      phoneClean === cleanId ||
      idClean === cleanId ||
      nameClean.includes(identifier.trim().toLowerCase());

    return matchesId && u.role === role;
  });

  if (!found) {
    // If not found in custom list, check if matches any demo user
    const demo = DEMO_ACCOUNTS[role];
    if (demo && (identifier.includes("08") || identifier.toLowerCase().includes("kania") || identifier.toLowerCase().includes("siti"))) {
      const activeUser: User = {
        ...demo,
        loginTime: new Date().toISOString(),
      };
      saveStoredUser(activeUser);
      return { success: true, user: activeUser };
    }

    return {
      success: false,
      error: "Akun tidak ditemukan. Pastikan Nomor HP atau ID Kader dan Peran sudah sesuai.",
    };
  }

  // Validate PIN (allowing 123456 or matching stored PIN)
  if (found.pin && found.pin !== pin && pin !== "123456") {
    return {
      success: false,
      error: "PIN / Kata Sandi salah. Silakan coba kembali atau gunakan PIN demo '123456'.",
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
    const raw = localStorage.getItem(STORAGE_KEY);
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
    refreshUser();

    const handleAuthChange = () => {
      refreshUser();
    };

    window.addEventListener(AUTH_EVENT, handleAuthChange);
    window.addEventListener("storage", handleAuthChange);

    return () => {
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
