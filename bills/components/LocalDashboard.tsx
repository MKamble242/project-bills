"use client";

import ExpenseDashboard from "@/components/ExpenseDashboard";
import ShopDashboard from "@/components/ShopDashboard";
import JobDashboard from "@/components/JobDashboard";
import ClassDashboard from "@/components/ClassDashboard";
import { useProfession } from "@/components/ProfessionGate";

export default function LocalDashboard() {
  const { profile } = useProfession();
  if (profile?.professionGroup === "shop") return <ShopDashboard />;
  if (profile?.professionGroup === "job") return <JobDashboard />;
  if (profile?.professionGroup === "fees") return <ClassDashboard />;
  return <ExpenseDashboard />;
}
