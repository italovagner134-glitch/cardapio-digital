import { Button } from "@/components/ui/button";
import { signOut } from "@/app/app/actions";

interface TopBarProps {
  restaurantName: string;
}

export function TopBar({ restaurantName }: TopBarProps) {
  return (
    <header className="flex items-center justify-between border-b border-border bg-card px-4 py-4 sm:px-8">
      <div className="flex flex-col">
        <span className="font-heading text-sm font-semibold text-card-foreground">
          {restaurantName}
        </span>
        <span className="text-xs text-muted-foreground">Cardápio Digital</span>
      </div>

      <form action={signOut}>
        <Button type="submit" variant="ghost" size="sm">
          Sair
        </Button>
      </form>
    </header>
  );
}
