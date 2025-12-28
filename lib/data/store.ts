"use client";

import { create } from "zustand";
import {
  User,
  Project,
  Offer,
  AnalyticsEvent,
  OfferStatus,
} from "./types";
import { users, projects, offers, events } from "./seed";

interface AppState {
  // Data
  users: User[];
  projects: Project[];
  offers: Offer[];
  events: AnalyticsEvent[];

  // Current user
  currentUser: User | null;

  // Actions
  setCurrentUser: (userId: string) => void;
  switchRole: (role: "creator" | "marketer") => void;

  // Project actions
  addProject: (project: Omit<Project, "id" | "createdAt">) => void;
  updateProject: (projectId: string, updates: Partial<Project>) => void;

  // Offer actions
  createOffer: (projectId: string, marketerId: string) => void;
  updateOfferStatus: (offerId: string, status: OfferStatus) => void;

  // Event simulation
  simulateClick: (projectId: string, marketerId: string | null) => void;
}

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2, 11);

// Generate referral code
const generateReferralCode = (marketerName: string, projectName: string) => {
  const cleanName = marketerName.split(" ")[0].toUpperCase();
  const cleanProject = projectName.replace(/\s+/g, "").substring(0, 4).toUpperCase();
  return `${cleanName}${cleanProject}${Math.floor(Math.random() * 100)}`;
};

export const useAppStore = create<AppState>((set, get) => ({
  // Initialize with seed data
  users: [...users],
  projects: [...projects],
  offers: [...offers],
  events: [...events],

  // Default to first creator
  currentUser: users.find((u) => u.role === "creator") || null,

  setCurrentUser: (userId: string) => {
    const user = get().users.find((u) => u.id === userId);
    if (user) {
      set({ currentUser: user });
    }
  },

  switchRole: (role: "creator" | "marketer") => {
    const user = get().users.find((u) => u.role === role);
    if (user) {
      set({ currentUser: user });
    }
  },

  addProject: (projectData) => {
    const currentUser = get().currentUser;
    if (!currentUser || currentUser.role !== "creator") return;

    const newProject: Project = {
      ...projectData,
      id: `proj-${generateId()}`,
      userId: currentUser.id,
      createdAt: new Date(),
    };

    set((state) => ({
      projects: [...state.projects, newProject],
    }));
  },

  updateProject: (projectId, updates) => {
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId ? { ...p, ...updates } : p
      ),
    }));
  },

  createOffer: (projectId: string, marketerId: string) => {
    const project = get().projects.find((p) => p.id === projectId);
    const marketer = get().users.find((u) => u.id === marketerId);

    if (!project || !marketer) return;

    // Check if offer already exists
    const existingOffer = get().offers.find(
      (o) => o.projectId === projectId && o.marketerId === marketerId
    );
    if (existingOffer) return;

    const referralCode = generateReferralCode(marketer.name, project.name);
    const referralLink = `https://${project.name
      .toLowerCase()
      .replace(/\s+/g, "")}.io/?ref=${referralCode.toLowerCase()}`;

    const newOffer: Offer = {
      id: `offer-${generateId()}`,
      projectId,
      creatorId: project.userId,
      marketerId,
      status: "pending",
      referralCode,
      referralLink,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    set((state) => ({
      offers: [...state.offers, newOffer],
    }));
  },

  updateOfferStatus: (offerId: string, status: OfferStatus) => {
    set((state) => ({
      offers: state.offers.map((o) =>
        o.id === offerId ? { ...o, status, updatedAt: new Date() } : o
      ),
    }));
  },

  simulateClick: (projectId: string, marketerId: string | null) => {
    const newEvent: AnalyticsEvent = {
      id: `event-${generateId()}`,
      projectId,
      marketerId,
      type: "click",
      amount: 0,
      currency: "usd",
      createdAt: new Date(),
    };

    set((state) => ({
      events: [...state.events, newEvent],
    }));
  },
}));

// Selector hooks for better performance
export const useCurrentUser = () => useAppStore((state) => state.currentUser);
export const useProjects = () => useAppStore((state) => state.projects);
export const useOffers = () => useAppStore((state) => state.offers);
export const useEvents = () => useAppStore((state) => state.events);
export const useUsers = () => useAppStore((state) => state.users);
