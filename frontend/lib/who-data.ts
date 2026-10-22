// Standar Pertumbuhan Anak WHO 2006 (0–60 Bulan)
// Metode LMS (Lambda-Mu-Sigma) sesuai data resmi WHO Child Growth Standards.

export interface GrowthPoint {
  umur: number; // bulan
  sd_neg3: number; // -3 SD (Gizi Buruk / Sangat Pendek)
  sd_neg2: number; // -2 SD (Batas Kurang / Stunting)
  sd_0: number;    // Median (Ideal)
  sd_pos2: number; // +2 SD (Batas Atas Normal)
  sd_pos3: number; // +3 SD (Risiko Lebih / Tinggi)
  balitaVal?: number | null; // Nilai balita yang diukur
}

function calcValue(L: number, M: number, S: number, Z: number): number {
  if (Math.abs(L) < 1e-6) {
    return Number((M * Math.exp(S * Z)).toFixed(2));
  }
  const inner = 1 + L * S * Z;
  if (inner <= 0) return 0;
  return Number((M * Math.pow(inner, 1 / L)).toFixed(2));
}

// Data LMS Weight-for-Age (BB/U) Laki-laki 0-60 bulan
const WFA_BOYS_LMS: [number, number, number, number][] = [
  [0, 0.3487, 3.3464, 0.14602], [1, 0.2297, 4.4709, 0.13395],
  [2, 0.1970, 5.5675, 0.12385], [3, 0.1738, 6.3762, 0.11727],
  [4, 0.1553, 7.0023, 0.11316], [5, 0.1395, 7.5105, 0.11099],
  [6, 0.1257, 7.9340, 0.11020], [7, 0.1134, 8.2970, 0.11024],
  [8, 0.1021, 8.6151, 0.11100], [9, 0.0917, 8.9014, 0.11180],
  [10, 0.0820, 9.1649, 0.11281], [11, 0.0730, 9.4122, 0.11399],
  [12, 0.0643, 9.6479, 0.11533], [13, 0.0561, 9.8749, 0.11672],
  [14, 0.0481, 10.0953, 0.11820], [15, 0.0405, 10.3108, 0.11970],
  [16, 0.0333, 10.5228, 0.12116], [17, 0.0263, 10.7319, 0.12264],
  [18, 0.0195, 10.9385, 0.12418], [19, 0.0130, 11.1432, 0.12576],
  [20, 0.0068, 11.3462, 0.12739], [21, 0.0008, 11.5474, 0.12904],
  [22, -0.0050, 11.7467, 0.13072], [23, -0.0106, 11.9435, 0.13239],
  [24, -0.0160, 12.1369, 0.13402], [25, -0.0213, 12.3257, 0.13558],
  [26, -0.0263, 12.5088, 0.13705], [27, -0.0311, 12.6850, 0.13843],
  [28, -0.0357, 12.8539, 0.13970], [29, -0.0401, 13.0152, 0.14088],
  [30, -0.0443, 13.1686, 0.14200], [31, -0.0484, 13.3141, 0.14306],
  [32, -0.0523, 13.4516, 0.14406], [33, -0.0561, 13.5813, 0.14500],
  [34, -0.0598, 13.7031, 0.14590], [35, -0.0633, 13.8172, 0.14676],
  [36, -0.0667, 13.9237, 0.14757], [37, -0.0700, 14.0228, 0.14836],
  [38, -0.0733, 14.1146, 0.14911], [39, -0.0764, 14.1994, 0.14983],
  [40, -0.0794, 14.2773, 0.15053], [41, -0.0824, 14.3484, 0.15120],
  [42, -0.0852, 14.4131, 0.15184], [43, -0.0880, 14.4715, 0.15248],
  [44, -0.0908, 14.5238, 0.15310], [45, -0.0934, 14.5702, 0.15371],
  [46, -0.0960, 14.6109, 0.15431], [47, -0.0986, 14.6461, 0.15492],
  [48, -0.1011, 14.6761, 0.15552], [49, -0.1035, 14.7011, 0.15613],
  [50, -0.1059, 14.7213, 0.15674], [51, -0.1082, 14.7369, 0.15735],
  [52, -0.1105, 14.7483, 0.15796], [53, -0.1128, 14.7558, 0.15857],
  [54, -0.1150, 14.7596, 0.15918], [55, -0.1172, 14.7600, 0.15978],
  [56, -0.1193, 14.7574, 0.16037], [57, -0.1214, 14.7519, 0.16096],
  [58, -0.1234, 14.7438, 0.16154], [59, -0.1255, 14.7334, 0.16212],
  [60, -0.1275, 14.7207, 0.16270],
];

// Data LMS Weight-for-Age (BB/U) Perempuan 0-60 bulan
const WFA_GIRLS_LMS: [number, number, number, number][] = [
  [0, 0.3809, 3.2322, 0.14171], [1, 0.1714, 4.1873, 0.13724],
  [2, 0.0962, 5.1282, 0.13000], [3, 0.0402, 5.8458, 0.12619],
  [4, -0.0050, 6.4237, 0.12402], [5, -0.0430, 6.8985, 0.12274],
  [6, -0.0756, 7.2970, 0.12204], [7, -0.1039, 7.6422, 0.12178],
  [8, -0.1288, 7.9487, 0.12181], [9, -0.1507, 8.2254, 0.12196],
  [10, -0.1700, 8.4800, 0.12225], [11, -0.1872, 8.7192, 0.12264],
  [12, -0.2025, 8.9481, 0.12316], [13, -0.2162, 9.1699, 0.12378],
  [14, -0.2285, 9.3870, 0.12452], [15, -0.2395, 9.6008, 0.12536],
  [16, -0.2494, 9.8124, 0.12628], [17, -0.2583, 10.0226, 0.12729],
  [18, -0.2664, 10.2315, 0.12836], [19, -0.2737, 10.4393, 0.12948],
  [20, -0.2803, 10.6461, 0.13065], [21, -0.2862, 10.8519, 0.13186],
  [22, -0.2916, 11.0568, 0.13310], [23, -0.2965, 11.2607, 0.13436],
  [24, -0.3008, 11.4637, 0.13564], [25, -0.3047, 11.6657, 0.13694],
  [26, -0.3082, 11.8667, 0.13823], [27, -0.3112, 12.0664, 0.13951],
  [28, -0.3138, 12.2648, 0.14077], [29, -0.3160, 12.4619, 0.14202],
  [30, -0.3179, 12.6576, 0.14323], [31, -0.3195, 12.8519, 0.14443],
  [32, -0.3208, 13.0448, 0.14559], [33, -0.3218, 13.2362, 0.14671],
  [34, -0.3226, 13.4261, 0.14780], [35, -0.3231, 13.6145, 0.14886],
  [36, -0.3234, 13.8014, 0.14988], [37, -0.3234, 13.9867, 0.15088],
  [38, -0.3232, 14.1704, 0.15183], [39, -0.3228, 14.3526, 0.15276],
  [40, -0.3222, 14.5332, 0.15365], [41, -0.3214, 14.7122, 0.15451],
  [42, -0.3204, 14.8897, 0.15534], [43, -0.3193, 15.0657, 0.15615],
  [44, -0.3180, 15.2401, 0.15692], [45, -0.3166, 15.4130, 0.15767],
  [46, -0.3150, 15.5844, 0.15840], [47, -0.3133, 15.7542, 0.15910],
  [48, -0.3115, 15.9224, 0.15978], [49, -0.3095, 16.0891, 0.16043],
  [50, -0.3074, 16.2542, 0.16107], [51, -0.3053, 16.4177, 0.16168],
  [52, -0.3030, 16.5796, 0.16228], [53, -0.3006, 16.7399, 0.16286],
  [54, -0.2982, 16.8985, 0.16342], [55, -0.2956, 17.0555, 0.16397],
  [56, -0.2930, 17.2108, 0.16450], [57, -0.2903, 17.3644, 0.16502],
  [58, -0.2876, 17.5163, 0.16552], [59, -0.2848, 17.6664, 0.16601],
  [60, -0.2819, 17.8147, 0.16648],
];

// Data LMS Length/Height-for-Age (PB/U) Laki-laki 0-60 bulan
const LHFA_BOYS_LMS: [number, number, number, number][] = [
  [0, 1, 49.8842, 0.03795], [1, 1, 54.7244, 0.03557],
  [2, 1, 58.4249, 0.03424], [3, 1, 61.4292, 0.03328],
  [4, 1, 63.8860, 0.03257], [5, 1, 65.9026, 0.03209],
  [6, 1, 67.6236, 0.03181], [7, 1, 69.1645, 0.03170],
  [8, 1, 70.5994, 0.03171], [9, 1, 71.9687, 0.03181],
  [10, 1, 73.2812, 0.03198], [11, 1, 74.5388, 0.03220],
  [12, 1, 75.7488, 0.03244], [13, 1, 76.9186, 0.03270],
  [14, 1, 78.0497, 0.03297], [15, 1, 79.1458, 0.03323],
  [16, 1, 80.2113, 0.03350], [17, 1, 81.2487, 0.03378],
  [18, 1, 82.2587, 0.03406], [19, 1, 83.2418, 0.03434],
  [20, 1, 84.1996, 0.03462], [21, 1, 85.1348, 0.03489],
  [22, 1, 86.0477, 0.03514], [23, 1, 86.9394, 0.03539],
  [24, 1, 87.8161, 0.03565], [25, 1, 88.6818, 0.03591],
  [26, 1, 89.5333, 0.03617], [27, 1, 90.3741, 0.03642],
  [28, 1, 91.2062, 0.03666], [29, 1, 92.0277, 0.03690],
  [30, 1, 92.8379, 0.03712], [31, 1, 93.6384, 0.03733],
  [32, 1, 94.4296, 0.03754], [33, 1, 95.2128, 0.03774],
  [34, 1, 95.9875, 0.03794], [35, 1, 96.7538, 0.03813],
  [36, 1, 97.5123, 0.03832], [37, 1, 98.2636, 0.03851],
  [38, 1, 99.0083, 0.03870], [39, 1, 99.7465, 0.03889],
  [40, 1, 100.4791, 0.03908], [41, 1, 101.2064, 0.03928],
  [42, 1, 101.9285, 0.03947], [43, 1, 102.6458, 0.03967],
  [44, 1, 103.3590, 0.03987], [45, 1, 104.0680, 0.04008],
  [46, 1, 104.7728, 0.04028], [47, 1, 105.4738, 0.04049],
  [48, 1, 106.1715, 0.04070], [49, 1, 106.8659, 0.04091],
  [50, 1, 107.5571, 0.04113], [51, 1, 108.2454, 0.04135],
  [52, 1, 108.9309, 0.04157], [53, 1, 109.6136, 0.04179],
  [54, 1, 110.2936, 0.04202], [55, 1, 110.9710, 0.04225],
  [56, 1, 111.6457, 0.04248], [57, 1, 112.3177, 0.04272],
  [58, 1, 112.9870, 0.04295], [59, 1, 113.6539, 0.04319],
  [60, 1, 114.3183, 0.04344],
];

// Data LMS Length/Height-for-Age (PB/U) Perempuan 0-60 bulan
const LHFA_GIRLS_LMS: [number, number, number, number][] = [
  [0, 1, 49.1477, 0.03790], [1, 1, 53.6872, 0.03560],
  [2, 1, 57.0673, 0.03424], [3, 1, 59.8029, 0.03328],
  [4, 1, 62.0899, 0.03257], [5, 1, 64.0301, 0.03209],
  [6, 1, 65.7311, 0.03181], [7, 1, 67.2873, 0.03170],
  [8, 1, 68.7498, 0.03168], [9, 1, 70.1435, 0.03174],
  [10, 1, 71.4818, 0.03185], [11, 1, 72.7710, 0.03202],
  [12, 1, 74.0150, 0.03224], [13, 1, 75.2176, 0.03248],
  [14, 1, 76.3817, 0.03275], [15, 1, 77.5099, 0.03301],
  [16, 1, 78.6055, 0.03328], [17, 1, 79.6700, 0.03354],
  [18, 1, 80.7070, 0.03380], [19, 1, 81.7174, 0.03405],
  [20, 1, 82.7037, 0.03429], [21, 1, 83.6654, 0.03453],
  [22, 1, 84.6040, 0.03477], [23, 1, 85.5191, 0.03500],
  [24, 1, 86.4153, 0.03523], [25, 1, 87.2978, 0.03547],
  [26, 1, 88.1647, 0.03570], [27, 1, 89.0152, 0.03593],
  [28, 1, 89.8499, 0.03615], [29, 1, 90.6701, 0.03637],
  [30, 1, 91.4760, 0.03659], [31, 1, 92.2691, 0.03679],
  [32, 1, 93.0498, 0.03700], [33, 1, 93.8193, 0.03719],
  [34, 1, 94.5778, 0.03738], [35, 1, 95.3268, 0.03756],
  [36, 1, 96.0677, 0.03774], [37, 1, 96.8017, 0.03792],
  [38, 1, 97.5289, 0.03809], [39, 1, 98.2506, 0.03826],
  [40, 1, 98.9672, 0.03843], [41, 1, 99.6790, 0.03860],
  [42, 1, 100.3867, 0.03877], [43, 1, 101.0908, 0.03895],
  [44, 1, 101.7916, 0.03912], [45, 1, 102.4895, 0.03930],
  [46, 1, 103.1849, 0.03948], [47, 1, 103.8783, 0.03966],
  [48, 1, 104.5698, 0.03985], [49, 1, 105.2596, 0.04003],
  [50, 1, 105.9481, 0.04022], [51, 1, 106.6353, 0.04041],
  [52, 1, 107.3214, 0.04060], [53, 1, 108.0066, 0.04079],
  [54, 1, 108.6911, 0.04099], [55, 1, 109.3751, 0.04119],
  [56, 1, 110.0587, 0.04138], [57, 1, 110.7420, 0.04159],
  [58, 1, 111.4252, 0.04179], [59, 1, 112.1085, 0.04200],
  [60, 1, 112.7918, 0.04221],
];

export function getGrowthCurveData(
  indicator: "bbu" | "pbu",
  gender: "L" | "P",
  currentMeasurement?: { umur_bulan: number; nilai: number }
): GrowthPoint[] {
  let source: [number, number, number, number][];

  if (indicator === "bbu") {
    source = gender === "L" ? WFA_BOYS_LMS : WFA_GIRLS_LMS;
  } else {
    source = gender === "L" ? LHFA_BOYS_LMS : LHFA_GIRLS_LMS;
  }

  return source.map(([age, L, M, S]) => {
    const isCurrentAge = currentMeasurement && currentMeasurement.umur_bulan === age;
    return {
      umur: age,
      sd_neg3: calcValue(L, M, S, -3),
      sd_neg2: calcValue(L, M, S, -2),
      sd_0: calcValue(L, M, S, 0),
      sd_pos2: calcValue(L, M, S, 2),
      sd_pos3: calcValue(L, M, S, 3),
      balitaVal: isCurrentAge ? currentMeasurement.nilai : null,
    };
  });
}

export function calculateZScoreWHO(
  indicator: "bbu" | "pbu",
  gender: "L" | "P",
  ageMonths: number,
  value: number
): number {
  const age = Math.min(60, Math.max(0, Math.round(ageMonths)));
  const table = indicator === "bbu"
    ? (gender === "L" ? WFA_BOYS_LMS : WFA_GIRLS_LMS)
    : (gender === "L" ? LHFA_BOYS_LMS : LHFA_GIRLS_LMS);

  const entry = table.find(([a]) => a === age) ?? table[age];
  if (!entry) return 0;
  const [, L, M, S] = entry;
  if (value <= 0) return 0;

  let z: number;
  if (Math.abs(L) < 1e-6) {
    z = Math.log(value / M) / S;
  } else {
    z = (Math.pow(value / M, L) - 1) / (L * S);
  }
  return Number(z.toFixed(2));
}

export function classifyAntropometriWHO(
  pbuZ: number,
  bbuZ: number
): {
  stuntingStatus: string;
  weightStatus: string;
  isStunting: boolean;
  isUnderweight: boolean;
  badgeColor: string;
  badgeBg: string;
} {
  const isStunting = pbuZ < -2;
  const isUnderweight = bbuZ < -2;

  let stuntingStatus = "Normal (Sesuai Usia)";
  if (pbuZ < -3) stuntingStatus = "Sangat Pendek (Severely Stunted)";
  else if (pbuZ < -2) stuntingStatus = "Pendek (Stunted)";
  else if (pbuZ > 3) stuntingStatus = "Tinggi";

  let weightStatus = "Gizi Baik (Normal)";
  if (bbuZ < -3) weightStatus = "Gizi Buruk (Severely Underweight)";
  else if (bbuZ < -2) weightStatus = "Gizi Kurang (Underweight)";
  else if (bbuZ > 2) weightStatus = "Risiko Berat Lebih";

  const isSevere = pbuZ < -3 || bbuZ < -3;
  const isWarning = pbuZ < -2 || bbuZ < -2;

  return {
    stuntingStatus,
    weightStatus,
    isStunting,
    isUnderweight,
    badgeColor: isSevere ? "#B91C1C" : isWarning ? "#B45309" : "#15803D",
    badgeBg: isSevere ? "#FEE2E2" : isWarning ? "#FEF3C7" : "#DCFCE7",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// KALKULASI LOKAL ANTROPOMETRI WHO 2006 (FALLBACK LENGKAP STANDALONE)
// ─────────────────────────────────────────────────────────────────────────────

export interface LocalAntropometriInput {
  nama_anak?: string;
  umur_bulan: number;
  berat_kg: number;
  tinggi_cm: number;
  jenis_kelamin: "L" | "P";
}

export interface LocalZScoreDetail {
  indikator: string;
  zscore: number;
  status: string;
  nilai_actual: number;
  median_referensi: number;
  interpretasi: string;
}

export interface LocalAntropometriResult {
  nama_anak?: string;
  umur_bulan: number;
  berat_kg: number;
  tinggi_cm: number;
  jenis_kelamin: "L" | "P";
  bbu: LocalZScoreDetail;
  pbu: LocalZScoreDetail;
  bbpb: LocalZScoreDetail;
  ada_risiko_stunting: boolean;
  ada_risiko_wasting: boolean;
  ada_risiko_underweight: boolean;
  pesan_peringatan: string[];
  peringatan_data: string[];
}

// Tabel referensi berat menurut tinggi badan (WFL/WFH) 45 s/d 120 cm
const WFH_INTERPOLATION_GRID: [number, number, number, number, number][] = [
  [45, -0.35, 2.44, 2.37, 0.09],
  [50, -0.35, 3.08, 2.99, 0.09],
  [55, -0.35, 3.89, 3.80, 0.09],
  [60, -0.35, 4.96, 4.91, 0.09],
  [65, -0.38, 7.40, 7.04, 0.08],
  [70, -0.38, 8.96, 8.51, 0.09],
  [75, -0.38, 10.74, 10.04, 0.09],
  [80, -0.38, 12.66, 11.43, 0.09],
  [85, -0.38, 14.69, 13.24, 0.10],
  [90, -0.38, 16.95, 15.37, 0.10],
  [95, -0.38, 19.60, 18.07, 0.11],
  [100, -0.38, 22.97, 21.66, 0.11],
  [105, -0.38, 26.65, 25.49, 0.12],
  [110, -0.38, 31.39, 33.74, 0.13],
  [115, -0.38, 44.73, 44.73, 0.16],
  [120, -0.38, 58.18, 58.18, 0.19],
];

function getWfhLms(heightCm: number, gender: "L" | "P"): { L: number; M: number; S: number } {
  const h = Math.min(120, Math.max(45, heightCm));
  for (let i = 0; i < WFH_INTERPOLATION_GRID.length - 1; i++) {
    const [h1, l1, mBoys1, mGirls1, s1] = WFH_INTERPOLATION_GRID[i];
    const [h2, l2, mBoys2, mGirls2, s2] = WFH_INTERPOLATION_GRID[i + 1];
    if (h >= h1 && h <= h2) {
      const ratio = (h - h1) / (h2 - h1);
      const m1 = gender === "L" ? mBoys1 : mGirls1;
      const m2 = gender === "L" ? mBoys2 : mGirls2;
      return {
        L: l1 + ratio * (l2 - l1),
        M: Number((m1 + ratio * (m2 - m1)).toFixed(2)),
        S: s1 + ratio * (s2 - s1),
      };
    }
  }
  const last = WFH_INTERPOLATION_GRID[WFH_INTERPOLATION_GRID.length - 1];
  return {
    L: last[1],
    M: gender === "L" ? last[2] : last[3],
    S: last[4],
  };
}

export function calculateFullAntropometri(input: LocalAntropometriInput): LocalAntropometriResult {
  const age = Math.min(60, Math.max(0, Math.round(input.umur_bulan)));
  const g = input.jenis_kelamin;

  // 1. BB/U
  const wfaTable = g === "L" ? WFA_BOYS_LMS : WFA_GIRLS_LMS;
  const wfaEntry = wfaTable.find(([a]) => a === age) ?? wfaTable[age];
  const bbuMedian = wfaEntry ? wfaEntry[2] : 10;
  const bbuZ = calculateZScoreWHO("bbu", g, age, input.berat_kg);

  let bbuStatus = "normal";
  let bbuInterpretasi = "Normal sesuai standar WHO";
  if (bbuZ < -3) {
    bbuStatus = "gizi_buruk";
    bbuInterpretasi = "Gizi buruk (< -3 SD)";
  } else if (bbuZ < -2) {
    bbuStatus = "gizi_kurang";
    bbuInterpretasi = "Gizi kurang (< -2 SD)";
  } else if (bbuZ > 2) {
    bbuStatus = "berat_lebih";
    bbuInterpretasi = "Berat badan lebih (> +2 SD)";
  }

  // 2. PB/U
  const lhfaTable = g === "L" ? LHFA_BOYS_LMS : LHFA_GIRLS_LMS;
  const lhfaEntry = lhfaTable.find(([a]) => a === age) ?? lhfaTable[age];
  const pbuMedian = lhfaEntry ? lhfaEntry[2] : 80;
  const pbuZ = calculateZScoreWHO("pbu", g, age, input.tinggi_cm);

  let pbuStatus = "normal";
  let pbuInterpretasi = "Normal sesuai standar WHO";
  if (pbuZ < -3) {
    pbuStatus = "sangat_pendek";
    pbuInterpretasi = "Stunting berat (< -3 SD)";
  } else if (pbuZ < -2) {
    pbuStatus = "pendek";
    pbuInterpretasi = "Stunting / pendek (< -2 SD)";
  } else if (pbuZ > 3) {
    pbuStatus = "tinggi";
    pbuInterpretasi = "Tinggi (> +3 SD)";
  }

  // 3. BB/PB
  const wfh = getWfhLms(input.tinggi_cm, g);
  let bbpbZ: number;
  if (Math.abs(wfh.L) < 1e-6) {
    bbpbZ = Math.log(input.berat_kg / wfh.M) / wfh.S;
  } else {
    bbpbZ = (Math.pow(input.berat_kg / wfh.M, wfh.L) - 1) / (wfh.L * wfh.S);
  }
  bbpbZ = Number(bbpbZ.toFixed(2));

  let bbpbStatus = "normal";
  let bbpbInterpretasi = "Normal sesuai standar WHO";
  if (bbpbZ < -3) {
    bbpbStatus = "sangat_kurus";
    bbpbInterpretasi = "Wasting berat (< -3 SD)";
  } else if (bbpbZ < -2) {
    bbpbStatus = "kurus";
    bbpbInterpretasi = "Wasting / kurus (< -2 SD)";
  } else if (bbpbZ > 2) {
    bbpbStatus = "berat_lebih";
    bbpbInterpretasi = "Risiko berat lebih (> +2 SD)";
  }

  const ada_risiko_stunting = pbuZ < -2;
  const ada_risiko_wasting = bbpbZ < -2;
  const ada_risiko_underweight = bbuZ < -2;

  const pesan_peringatan: string[] = [];
  if (pbuZ < -3) {
    pesan_peringatan.push("Indikasi stunting berat: tinggi badan balita sangat di bawah standar usia (< -3 SD). Segera rujuk ke Puskesmas.");
  } else if (pbuZ < -2) {
    pesan_peringatan.push("Indikasi stunting: panjang/tinggi badan balita berada di bawah rentang normal usia (< -2 SD).");
  }

  if (bbpbZ < -3) {
    pesan_peringatan.push("Indikasi wasting berat: berat badan sangat kurang untuk proporsi tinggi badannya (< -3 SD).");
  } else if (bbpbZ < -2) {
    pesan_peringatan.push("Indikasi wasting: berat badan kurang proporsional terhadap tinggi badannya (< -2 SD).");
  }

  if (bbuZ < -3) {
    pesan_peringatan.push("Indikasi gizi buruk: berat badan balita sangat kurang untuk usianya (< -3 SD).");
  } else if (bbuZ < -2) {
    pesan_peringatan.push("Indikasi berat badan kurang: berat balita berada di bawah standar usianya (< -2 SD).");
  }

  if (pesan_peringatan.length === 0) {
    pesan_peringatan.push("Status gizi dan tumbuh kembang balita baik (normal). Pertahankan pola makan dan pantau rutin tiap bulan.");
  }

  return {
    nama_anak: input.nama_anak,
    umur_bulan: input.umur_bulan,
    berat_kg: input.berat_kg,
    tinggi_cm: input.tinggi_cm,
    jenis_kelamin: input.jenis_kelamin,
    bbu: {
      indikator: "BB/U",
      zscore: bbuZ,
      status: bbuStatus,
      nilai_actual: input.berat_kg,
      median_referensi: bbuMedian,
      interpretasi: bbuInterpretasi,
    },
    pbu: {
      indikator: "PB/U",
      zscore: pbuZ,
      status: pbuStatus,
      nilai_actual: input.tinggi_cm,
      median_referensi: pbuMedian,
      interpretasi: pbuInterpretasi,
    },
    bbpb: {
      indikator: "BB/PB",
      zscore: bbpbZ,
      status: bbpbStatus,
      nilai_actual: input.berat_kg,
      median_referensi: wfh.M,
      interpretasi: bbpbInterpretasi,
    },
    ada_risiko_stunting,
    ada_risiko_wasting,
    ada_risiko_underweight,
    pesan_peringatan,
    peringatan_data: [],
  };
}


