"use client";

import { create } from "zustand";

// ---------------------------------------------------------------------------
// State interface
// ---------------------------------------------------------------------------

interface AppState {
  /** Whether the sidebar is collapsed. */
  sidebarCollapsed: boolean;
  /** Toggle the sidebar between collapsed and expanded. */
  toggleSidebar: () => void;

  /** IDs of recently viewed analyses (most recent first, max 10). */
  recentAnalysisIds: string[];
  /** Push an analysis ID to the front of the recents list. */
  addRecentAnalysis: (id: string) => void;

  /** Member IDs currently selected for comparison. */
  selectedMemberIds: string[];
  /** Toggle a member in or out of the comparison selection. */
  toggleMemberSelection: (id: string) => void;
  /** Clear all selected members. */
  clearSelection: () => void;

  /** The project currently selected for comparison. */
  selectedProjectId: string | null;
  /** Set (or clear) the project used for comparison. */
  setSelectedProject: (id: string | null) => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

const MAX_RECENT = 10;

export const useAppStore = create<AppState>((set) => ({
  // -- Sidebar --------------------------------------------------------------
  sidebarCollapsed: false,
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  // -- Recent analyses ------------------------------------------------------
  recentAnalysisIds: [],
  addRecentAnalysis: (id: string) =>
    set((state) => {
      // Remove duplicate if it already exists, then prepend
      const filtered = state.recentAnalysisIds.filter(
        (existing) => existing !== id,
      );
      return {
        recentAnalysisIds: [id, ...filtered].slice(0, MAX_RECENT),
      };
    }),

  // -- Member selection for comparison --------------------------------------
  selectedMemberIds: [],
  toggleMemberSelection: (id: string) =>
    set((state) => {
      const exists = state.selectedMemberIds.includes(id);
      return {
        selectedMemberIds: exists
          ? state.selectedMemberIds.filter((mid) => mid !== id)
          : [...state.selectedMemberIds, id],
      };
    }),
  clearSelection: () => set({ selectedMemberIds: [] }),

  // -- Project selection for comparison -------------------------------------
  selectedProjectId: null,
  setSelectedProject: (id: string | null) =>
    set({ selectedProjectId: id }),
}));
