"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { restaurantOnboardingSchema } from "@/lib/validations/restaurant";
import { parseBusinessHoursFromForm } from "@/lib/parse-business-hours-form";
import { slugify } from "@/lib/slugify";
import { validateUpload } from "@/lib/uploads";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export type OnboardingActionState = { error?: string } | undefined;

const MAX_SLUG_ATTEMPTS = 20;

export async function createRestaurant(
  _prevState: OnboardingActionState,
  formData: FormData,
): Promise<OnboardingActionState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const businessHours = parseBusinessHoursFromForm(formData);

  const parsed = restaurantOnboardingSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
    phone: formData.get("phone"),
    whatsapp: formData.get("whatsapp"),
    address: formData.get("address"),
    city: formData.get("city"),
    businessHours,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Verifique os dados informados." };
  }

  const slug = await findAvailableSlug(supabase, slugify(parsed.data.name) || "restaurante");

  const { data: restaurant, error } = await supabase.rpc("create_restaurant", {
    p_name: parsed.data.name,
    p_slug: slug,
    p_category: parsed.data.category,
    p_phone: parsed.data.phone,
    p_whatsapp: parsed.data.whatsapp,
    p_address: parsed.data.address,
    p_city: parsed.data.city,
    p_business_hours: parsed.data.businessHours.map((hour) => ({
      day_of_week: hour.dayOfWeek,
      opens_at: hour.isClosed ? null : hour.opensAt,
      closes_at: hour.isClosed ? null : hour.closesAt,
      is_closed: hour.isClosed,
    })),
  });

  if (error || !restaurant) {
    return { error: "Não foi possível criar seu restaurante. Tente novamente." };
  }

  // Logo/capa são opcionais — se o upload falhar, o restaurante continua
  // criado normalmente (o dono adiciona a imagem depois em Configurações).
  await uploadOptionalImage(supabase, restaurant.id, formData.get("logo"), "logo");
  await uploadOptionalImage(supabase, restaurant.id, formData.get("cover"), "cover");

  redirect("/app");
}

async function findAvailableSlug(
  supabase: SupabaseClient<Database>,
  baseSlug: string,
): Promise<string> {
  let slug = baseSlug;

  for (let attempt = 1; attempt <= MAX_SLUG_ATTEMPTS; attempt += 1) {
    const { data: available } = await supabase.rpc("is_slug_available", { p_slug: slug });
    if (available) return slug;
    slug = `${baseSlug}-${attempt + 1}`;
  }

  return `${baseSlug}-${Date.now()}`;
}

async function uploadOptionalImage(
  supabase: SupabaseClient<Database>,
  restaurantId: string,
  file: FormDataEntryValue | null,
  kind: "logo" | "cover",
) {
  if (!(file instanceof File) || file.size === 0) return;

  const validation = await validateUpload(file, "image");
  if (!validation.ok) return;

  const path = `${restaurantId}/${kind}.${validation.extension}`;

  const { error: uploadError } = await supabase.storage
    .from("restaurant-media")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) return;

  const { data } = supabase.storage.from("restaurant-media").getPublicUrl(path);

  const update =
    kind === "logo" ? { logo_url: data.publicUrl } : { cover_url: data.publicUrl };

  await supabase.from("restaurants").update(update).eq("id", restaurantId);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
