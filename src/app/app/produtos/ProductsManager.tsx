"use client";

import { useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUp, ArrowDown, Pencil, Trash2, Plus, ImageOff, ListPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ProductFormDialog } from "./ProductFormDialog";
import { OptionGroupsDialog } from "./OptionGroupsDialog";
import {
  deleteProduct,
  toggleProductAvailable,
  toggleProductFeatured,
  moveProduct,
} from "./actions";
import type { Tables } from "@/lib/supabase/types";

type GroupWithOptions = Tables<"product_option_groups"> & {
  product_options: Tables<"product_options">[];
};

function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

interface ProductsManagerProps {
  categories: Tables<"categories">[];
  products: Tables<"products">[];
  optionGroups: GroupWithOptions[];
}

export function ProductsManager({ categories, products, optionGroups }: ProductsManagerProps) {
  const [isPending, startTransition] = useTransition();

  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-16 text-center">
        <p className="text-muted-foreground">Crie uma categoria antes de cadastrar produtos.</p>
        <Button asChild variant="outline" className="mt-2">
          <Link href="/app/categorias">Ir para categorias</Link>
        </Button>
      </div>
    );
  }

  const hasAnyProduct = products.length > 0;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-end">
        <ProductFormDialog
          categories={categories}
          trigger={
            <Button>
              <Plus className="size-4" /> Novo produto
            </Button>
          }
        />
      </div>

      {!hasAnyProduct && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border py-16 text-center">
          <p className="text-muted-foreground">Seu cardápio ainda está vazio.</p>
          <ProductFormDialog
            categories={categories}
            trigger={
              <Button>
                <Plus className="size-4" /> Adicionar primeiro produto
              </Button>
            }
          />
        </div>
      )}

      {categories.map((category) => {
        const categoryProducts = products
          .filter((p) => p.category_id === category.id)
          .sort((a, b) => a.sort_order - b.sort_order);

        if (categoryProducts.length === 0) return null;

        return (
          <section key={category.id} className="flex flex-col gap-2">
            <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {category.name}
            </h2>

            <ul className="flex flex-col gap-2">
              {categoryProducts.map((product, index) => (
                <li
                  key={product.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-4"
                >
                  <div className="flex flex-col">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-6"
                      disabled={index === 0 || isPending}
                      aria-label="Mover para cima"
                      onClick={() => startTransition(() => moveProduct(product.id, category.id, "up"))}
                    >
                      <ArrowUp className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-6"
                      disabled={index === categoryProducts.length - 1 || isPending}
                      aria-label="Mover para baixo"
                      onClick={() =>
                        startTransition(() => moveProduct(product.id, category.id, "down"))
                      }
                    >
                      <ArrowDown className="size-3.5" />
                    </Button>
                  </div>

                  <div className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                    {product.image_url ? (
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-muted-foreground">
                        <ImageOff className="size-5" aria-hidden="true" />
                      </div>
                    )}
                  </div>

                  <div className={`flex-1 ${!product.is_available ? "opacity-50" : ""}`}>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-card-foreground">{product.name}</p>
                      {product.is_featured && <Badge variant="secondary">Destaque</Badge>}
                      {!product.is_available && <Badge variant="outline">Esgotado</Badge>}
                    </div>
                    <p className="font-mono text-sm text-muted-foreground">
                      {product.compare_at_price_cents && (
                        <span className="mr-1.5 line-through opacity-70">
                          {formatPrice(product.compare_at_price_cents)}
                        </span>
                      )}
                      {formatPrice(product.price_cents)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <OptionGroupsDialog
                      productId={product.id}
                      productName={product.name}
                      groups={optionGroups.filter((group) => group.product_id === product.id)}
                      trigger={
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label="Complementos do produto"
                        >
                          <ListPlus className="size-4" />
                        </Button>
                      }
                    />

                    <Switch
                      checked={product.is_available}
                      disabled={isPending}
                      aria-label={product.is_available ? "Marcar esgotado" : "Marcar disponível"}
                      onCheckedChange={(checked) =>
                        startTransition(() => toggleProductAvailable(product.id, checked))
                      }
                    />

                    <Switch
                      checked={product.is_featured}
                      disabled={isPending}
                      aria-label={product.is_featured ? "Remover destaque" : "Destacar produto"}
                      onCheckedChange={(checked) =>
                        startTransition(() => toggleProductFeatured(product.id, checked))
                      }
                    />

                    <ProductFormDialog
                      categories={categories}
                      product={product}
                      trigger={
                        <Button type="button" variant="ghost" size="icon" aria-label="Editar produto">
                          <Pencil className="size-4" />
                        </Button>
                      }
                    />

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label="Excluir produto"
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir “{product.name}”?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Essa ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => startTransition(() => deleteProduct(product.id))}
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
