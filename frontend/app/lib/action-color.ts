import { actionColors } from "~/theme/colors";

interface ActionAppearance {
  icon?: string;
  event?: string;
  color?: string;
}

export function getActionColor(action: ActionAppearance, deleteIcon: string) {
  if (action.icon === deleteIcon || /^delete(?:$|[-A-Z])/.test(action.event || "")) {
    return actionColors.delete;
  }
  return action.color;
}
