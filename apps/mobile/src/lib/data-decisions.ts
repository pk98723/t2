import { supabase } from "@/lib/supabase";

export interface Decision {
  id: string;
  item_name: string;
  price: number;
  funding_mode: string;
  verdict: "go" | "caution" | "stop";
  emi_ratio_after: number;
  emergency_months_after: number;
  created_at: string;
}

export async function fetchDecisions(userId: string): Promise<Decision[]> {
  const { data, error } = await supabase
    .from("decisions")
    .select("id,item_name,price,funding_mode,verdict,emi_ratio_after,emergency_months_after,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as Decision[];
}