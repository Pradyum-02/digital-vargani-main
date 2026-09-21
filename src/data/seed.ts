import type {
  AppData,
  Building,
  Mandal,
  Wing,
} from "@/types";

export function buildSeedData(): AppData {
  const mandal: Mandal = {
    id: "mandal-vedant-residency",
    name: "Vedant Residency Ganpati Mandal",
    nameMarathi: "वेदांत रेसिडेन्सी गणपती मंडळ",
    address: "",
    phone: "",
    year: 2026,
    defaultVarganiAmount: 0,
    pautiPrefix: "GM",
    receiptFooter: "",
    language: "en",
    currency: "INR",
  };

  const buildings: Building[] = [
    {
      id: "phase-1",
      name: "Phase 1",
    },
    {
      id: "phase-2",
      name: "Phase 2",
    },
    {
      id: "phase-3",
      name: "Phase 3",
    },
  ];

  const wings: Wing[] = [
    // Phase 1
    {
      id: "phase-1-wing-a",
      buildingId: "phase-1",
      name: "A",
    },
    {
      id: "phase-1-wing-b",
      buildingId: "phase-1",
      name: "B",
    },
    {
      id: "phase-1-wing-c",
      buildingId: "phase-1",
      name: "C",
    },

    // Phase 2
    {
      id: "phase-2-wing-a",
      buildingId: "phase-2",
      name: "A",
    },
    {
      id: "phase-2-wing-b",
      buildingId: "phase-2",
      name: "B",
    },
    {
      id: "phase-2-wing-c",
      buildingId: "phase-2",
      name: "C",
    },

    // Phase 3
    {
      id: "phase-3-wing-a",
      buildingId: "phase-3",
      name: "A",
    },
    {
      id: "phase-3-wing-b",
      buildingId: "phase-3",
      name: "B",
    },
  ];

  return {
    mandal,
    buildings,
    wings,

    // Households are created by the collector
    // when they visit each door.
    households: [],

    // Collector account will be configured later.
    collectors: [],

    // Financial data starts completely empty.
    collections: [],
    expenses: [],
    incomes: [],

    notifications: [],
    auditLogs: [],

    currentUserId: "",
  };
}