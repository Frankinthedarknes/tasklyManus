import { supabase } from "./supabase";

export async function spendTaskly(toUserId: string, amount: number) {
  const { data, error } = await supabase.rpc("spend_taskly", {
    p_to_user: toUserId,
    p_amount: amount,
  });

  if (error) {
    throw error;
  }

  return data as string;
}

export async function cashoutTaskly(amount: number) {
  const { data, error } = await supabase.rpc("cashout_taskly", {
    p_amount: amount,
  });

  if (error) {
    throw error;
  }

  return data as string;
}
