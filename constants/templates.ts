import { DocumentCategory, DocumentTemplate } from "@/constants/types";
import { getV1Categories, getV1Templates } from "@/templates/v1/library";

export interface CategoryWithTemplates extends DocumentCategory {
  templates: DocumentTemplate[];
}

const templates = getV1Templates();
const categories = getV1Categories();

export const TEMPLATE_LIBRARY: DocumentTemplate[] = templates;

export const CATEGORIES: CategoryWithTemplates[] = categories.map((category) => ({
  ...category,
  templates: templates.filter((template) => template.categoryId === category.id),
}));

const TEMPLATE_MAP = new Map<string, DocumentTemplate>(
  TEMPLATE_LIBRARY.map((template) => [template.id, template])
);

export function findTemplate(templateId: string) {
  const template = TEMPLATE_MAP.get(templateId);
  if (!template) return null;

  const category = CATEGORIES.find((item) => item.id === template.categoryId);
  if (!category) return null;

  return { template, category };
}
