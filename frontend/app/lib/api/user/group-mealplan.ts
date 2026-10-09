import { BaseCRUDAPI } from "../base/base-clients";
import type { CreatePlanEntry, CreateRandomEntry, ReadPlanEntry, UpdatePlanEntry } from "~/lib/api/types/meal-plan";

const prefix = "/api";

const routes = {
  mealplan: `${prefix}/households/mealplans`,
  random: `${prefix}/households/mealplans/random`,
  mealplanId: (id: string | number) => `${prefix}/households/mealplans/${id}`,
};

export class MealPlanAPI extends BaseCRUDAPI<CreatePlanEntry, ReadPlanEntry, UpdatePlanEntry> {
  override baseRoute = routes.mealplan;
  override itemRoute = routes.mealplanId;

  async setRandom(payload: CreateRandomEntry) {
    return await this.requests.post<ReadPlanEntry>(routes.random, payload);
  }
}
