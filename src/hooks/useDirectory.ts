import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import type { Views } from "@/lib/database.types";

export type DirectoryProfile = Views<"directory_profiles">;

/** Searchable attendee directory (limited public columns only). */
export function useDirectory(search: string) {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ["directory", search],
    queryFn: async (): Promise<DirectoryProfile[]> => {
      let q = supabase
        .from("directory_profiles")
        .select("*")
        .order("full_name", { ascending: true })
        .limit(50);
      if (search.trim()) q = q.ilike("full_name", `%${search.trim()}%`);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).filter((p) => p.id !== userId);
    },
  });
}
