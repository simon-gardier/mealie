import { BaseCRUDAPI } from "../base/base-clients";
import type { IngredientUnitCreate, IngredientUnitOut } from "~/lib/api/types/recipe";

const prefix = "/api";

const routes = {
  unit: `${prefix}/units`,
  unitsUnit: (tag: string) => `${prefix}/units/${tag}`,
  merge: `${prefix}/units/merge`,
};

export class UnitAPI extends BaseCRUDAPI<IngredientUnitCreate, IngredientUnitOut> {
  override baseRoute: string = routes.unit;
  override itemRoute = routes.unitsUnit;

  merge(fromId: string, toId: string) {
    return this.requests.put<IngredientUnitOut, { fromUnit: string; toUnit: string }>(routes.merge, { fromUnit: fromId, toUnit: toId });
  }
}
