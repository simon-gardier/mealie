import { mount } from "@vue/test-utils";
import { ref } from "vue";
import { expect, test, vi } from "vitest";
import { readFileSync, writeFileSync } from "node:fs";
import { compileStyle } from "vue/compiler-sfc";
import RecipePrintView from "./RecipePrintView.vue";

const preferences = vi.hoisted(() => ({ imagePosition: "left", showDescription: true, showNotes: true, showNutrition: true, showLinkedIngredients: true, showSubstitutions: true, expandChildRecipes: true }));
vi.mock("~/composables/use-users/preferences", () => ({ ImagePosition: { left: "left", right: "right", hidden: "hidden" }, useUserPrintPreferences: () => ref(preferences) }));
vi.mock("~/composables/api", () => ({ useStaticRoutes: () => ({ recipeImage: () => "photo.png" }) }));
vi.mock("~/composables/recipe-page/shared-state", () => ({ usePageState: () => ({ imageKey: ref(0) }) }));
vi.mock("~/composables/recipes/use-scaled-amount", () => ({ useScaledAmount: (amount: number, scale: number) => ({ scaledAmountDisplay: amount ? String(amount * scale) : "" }) }));
vi.mock("~/composables/recipes", () => ({
  useIngredientTextParser: () => ({ parseIngredientText: (ingredient: any) => [ingredient.quantity, ingredient.unit?.name, ingredient.food?.name, ingredient.note].filter(Boolean).join(" ") }),
  useFoodPlurality: () => ({ shouldPluralizeFood: () => false }),
  ingredientSubstitutionSummary: (ingredient: any) => ingredient.substitutions?.map((item: any) => item.note).join(", ") || "",
  useNutritionLabels: () => ({ labels: { calories: { label: "Calories", suffix: "kcal" }, proteinContent: { label: "Proteines", suffix: "g" } } }),
}));

const messages: Record<string, string> = { "recipe.ingredients": "Ingredients", "recipe.instructions": "Instructions", "recipe.notes": "Remarques", "recipe.nutrition": "Valeurs nutritionnelles", "recipe.total-time": "Temps total", "recipe.prep-time": "Temps de preparation", "recipe.perform-time": "Temps de cuisson" };
const translate = (key: string, params: any = {}) => messages[key] || (key === "recipe.step-index" ? `Etape ${params.step}` : key === "recipe.serves-amount" ? `${params.amount} portions` : key === "recipe.substitutions-with-value" ? `Substitutions : ${params.substitutions}` : key);
const recipe = {
  id: "recipe", slug: "crepes", image: "image", name: "Crepes au Sarrasin farcies a l'oeuf, fromage et jambon : la meilleure recette",
  recipeServings: 6, recipeYieldQuantity: 0, recipeYield: "", totalTime: "2 heures 25 minutes", prepTime: "5 minutes", performTime: "20 minutes",
  description: "Une recette de crepes au sarrasin a partager en famille.",
  recipeIngredient: [
    { referenceId: "flour", title: "Pate a crepes", quantity: 250, unit: { name: "g" }, food: { name: "farine de sarrasin" }, substitutions: [{ note: "farine de ble" }] },
    { referenceId: "milk", quantity: 25, originalText: "25 cl de lait", note: "", food: null },
    { referenceId: "eggs", quantity: 6, food: { name: "oeufs" } },
    { referenceId: "water", quantity: 25, originalText: "25 cl d'eau" },
    { referenceId: "butter", quantity: 40, originalText: "40 g de beurre" },
    { referenceId: "oil", originalText: "huile" },
    { referenceId: "salt", originalText: "sel" },
    { referenceId: "ham", originalText: "6 tranches de jambon" },
  ],
  recipeInstructions: [
    { text: "Verser la farine dans un saladier. Ajouter les oeufs et fouetter en ajoutant progressivement le lait et l'eau. Incorporer le beurre fondu, puis laisser reposer deux heures.", ingredientReferences: [{ referenceId: "milk" }] },
    { text: "Faire chauffer une poele a crepes avec l'huile. Quand elle est bien chaude, verser la pate et la repartir sur toute la surface." },
    { text: "Faire cuire le premier cote, puis retourner la crepe. Casser un oeuf par-dessus, poivrer, laisser blanchir puis ajouter le fromage et le jambon. Rabattre les cotes." },
    { text: "Renouveler l'operation jusqu'a epuisement de la pate." },
    { text: "Servir chaud avec une salade verte." },
  ],
  notes: [{ title: "Conseil", text: "La pate peut etre preparee a l'avance et conservee au refrigerateur." }],
  nutrition: { calories: "428", proteinContent: "29" },
};

function render(value = recipe) {
  vi.stubGlobal("useI18n", () => ({ t: translate }));
  return mount(RecipePrintView, { props: { recipe: value as any }, global: { stubs: { SafeMarkdown: { props: ["source"], template: "<div><p>{{ source }}</p></div>" } } } });
}

test("all print options preserve titles, unresolved ingredients, notes, substitutions and nutrition without mutating recipe data", () => {
  const before = JSON.stringify(recipe);
  const wrapper = render();
  expect(wrapper.find("h1").text()).toBe(recipe.name);
  expect(wrapper.text()).toContain("25 cl de lait");
  expect(wrapper.text()).not.toContain("25 25 cl de lait");
  expect(wrapper.find(".step-ingredient-grid").text()).toContain("25 cl de lait");
  expect(wrapper.find(".substitution-body").text()).toContain("farine de ble");
  expect(wrapper.find(".nutrition-table").text()).toContain("428 kcal");
  expect(wrapper.text()).toContain("Conseil");
  expect(JSON.stringify(recipe)).toBe(before);
  if (process.env.PETIT_CHEF_PRINT_AUDIT) {
    const source = readFileSync("app/components/Domain/Recipe/RecipePrintView.vue", "utf8").split("<style scoped>")[1]?.split("</style>")[0];
    const id = wrapper.html().match(/data-v-[a-f0-9]+/)?.[0];
    if (!source || !id) throw new Error("The print audit requires scoped styles and a rendered scope id.");
    const css = compileStyle({ source, filename: "RecipePrintView.vue", id, scoped: true }).code;
    writeFileSync(process.env.PETIT_CHEF_PRINT_AUDIT, `<html><head><meta charset="utf-8"><style>:root{--v-theme-print-background:255,255,255;--v-theme-print-foreground:0,0,0;--v-theme-separator:198,198,200}body{margin:0}@page{size:A4;margin:14mm}${css}</style></head><body>${wrapper.html()}</body></html>`);
  }
  wrapper.unmount();
});

test("hides absent optional notes, nutrition and image", () => {
  const wrapper = render({ ...recipe, image: "", notes: [], nutrition: { calories: "", proteinContent: "" } });
  expect(wrapper.find(".print-image").exists()).toBe(false);
  expect(wrapper.find(".nutrition-table").exists()).toBe(false);
  expect(wrapper.find(".note-body").exists()).toBe(false);
  expect(wrapper.findAll("h2")).toHaveLength(2);
  wrapper.unmount();
});
