import { BaseCRUDAPI } from "../base/base-clients";
import type { MultiPurposeLabelCreate, MultiPurposeLabelOut, MultiPurposeLabelUpdate } from "~/lib/api/types/labels";

const prefix = "/api";

const routes = {
  labels: `${prefix}/groups/labels`,
  labelsId: (id: string | number) => `${prefix}/groups/labels/${id}`,
};

export class MultiPurposeLabelsApi extends BaseCRUDAPI<
  MultiPurposeLabelCreate,
  MultiPurposeLabelOut,
  MultiPurposeLabelUpdate
> {
  override baseRoute = routes.labels;
  override itemRoute = routes.labelsId;
}
