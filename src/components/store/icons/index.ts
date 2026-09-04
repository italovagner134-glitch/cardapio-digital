import { StarIcon } from "./StarIcon";
import { BurgerIcon } from "./BurgerIcon";
import { ComboIcon } from "./ComboIcon";
import { ChickenIcon } from "./ChickenIcon";
import { DrinkIcon } from "./DrinkIcon";
import { DessertIcon } from "./DessertIcon";
import { PizzaIcon } from "./PizzaIcon";
import { IceCreamIcon } from "./IceCreamIcon";
import { FriesIcon } from "./FriesIcon";
import { UtensilsIcon } from "./UtensilsIcon";
import { GiftIcon } from "./GiftIcon";

export const CATEGORY_ICONS = {
  star: StarIcon,
  burger: BurgerIcon,
  combo: ComboIcon,
  chicken: ChickenIcon,
  drink: DrinkIcon,
  dessert: DessertIcon,
  pizza: PizzaIcon,
  icecream: IceCreamIcon,
  fries: FriesIcon,
  utensils: UtensilsIcon,
} as const;

export type CategoryIconKey = keyof typeof CATEGORY_ICONS;

export {
  StarIcon,
  BurgerIcon,
  ComboIcon,
  ChickenIcon,
  DrinkIcon,
  DessertIcon,
  PizzaIcon,
  IceCreamIcon,
  FriesIcon,
  UtensilsIcon,
  GiftIcon,
};
export type { IconProps } from "./types";
