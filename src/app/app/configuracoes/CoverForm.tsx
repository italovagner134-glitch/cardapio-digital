"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateRestaurantMedia, type SettingsActionState } from "./actions";
import type { Tables } from "@/lib/supabase/types";

interface CoverFormProps {
  restaurant: Tables<"restaurants">;
}

const COVER_TYPES = [
  { value: "image", label: "Foto" },
  { value: "video", label: "Vídeo" },
] as const;

/** Logo + capa (foto OU vídeo) — ver o comentário em actions.ts sobre por
 * que isto não existia antes (só o onboarding gravava, uma vez). Limites de
 * tamanho/formato reais são checados no servidor (lib/uploads.ts); aqui só
 * o `accept` do input, que é conveniência de UI, nunca a validação de
 * verdade. */
export function CoverForm({ restaurant }: CoverFormProps) {
  const [state, formAction, isPending] = useActionState<SettingsActionState, FormData>(
    updateRestaurantMedia,
    undefined,
  );
  const [coverType, setCoverType] = useState<"image" | "video">(
    restaurant.cover_type === "video" ? "video" : "image",
  );

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">Logo</h2>
        <div className="flex items-center gap-4">
          {restaurant.logo_url && (
            <Image
              src={restaurant.logo_url}
              alt=""
              width={56}
              height={56}
              className="size-14 shrink-0 rounded-full border border-border object-cover"
            />
          )}
          <div className="flex flex-1 flex-col gap-2">
            <Label htmlFor="logo">{restaurant.logo_url ? "Trocar logo" : "Enviar logo"}</Label>
            <Input id="logo" name="logo" type="file" accept="image/jpeg,image/png,image/webp,image/gif" />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Capa da loja
        </h2>

        <div className="flex flex-col gap-2">
          <Label htmlFor="cover-type-image">Tipo de capa</Label>
          <div className="flex gap-3">
            {COVER_TYPES.map((type) => (
              <label
                key={type.value}
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-accent"
              >
                <input
                  id={`cover-type-${type.value}`}
                  type="radio"
                  name="coverType"
                  value={type.value}
                  checked={coverType === type.value}
                  onChange={() => setCoverType(type.value)}
                />
                {type.label}
              </label>
            ))}
          </div>
        </div>

        {coverType === "image" ? (
          <div className="flex flex-col gap-3">
            {restaurant.cover_url && (
              <Image
                src={restaurant.cover_url}
                alt=""
                width={400}
                height={225}
                className="aspect-video w-full max-w-xs rounded-lg border border-border object-cover"
              />
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="coverImage">{restaurant.cover_url ? "Trocar imagem de capa" : "Enviar imagem de capa"}</Label>
              <Input
                id="coverImage"
                name="coverImage"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {restaurant.cover_video_url && (
              <video
                src={restaurant.cover_video_url}
                poster={restaurant.cover_poster_url ?? undefined}
                muted
                playsInline
                controls
                className="aspect-video w-full max-w-xs rounded-lg border border-border object-cover"
              />
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="coverVideo">
                {restaurant.cover_video_url ? "Trocar vídeo de capa" : "Enviar vídeo de capa"}
              </Label>
              <Input id="coverVideo" name="coverVideo" type="file" accept="video/mp4,video/webm,video/quicktime" />
              <p className="text-xs text-muted-foreground">
                MP4, WebM ou MOV, até 10MB — o ideal é um vídeo curto (10-12s), sem áudio, que fique bem em loop.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="coverPoster">Imagem de capa do vídeo (opcional)</Label>
              <Input id="coverPoster" name="coverPoster" type="file" accept="image/jpeg,image/png,image/webp,image/gif" />
              <p className="text-xs text-muted-foreground">
                Mostrada enquanto o vídeo carrega, e no lugar dele pra quem está com economia de dados ativada.
              </p>
            </div>
          </div>
        )}
      </section>

      {state?.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p role="status" className="text-sm text-manjericao-600">
          Mídia salva.
        </p>
      )}

      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? "Enviando…" : "Salvar mídia"}
      </Button>
    </form>
  );
}
