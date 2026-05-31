import {
  industryTemplates,
  platformModules,
  platformPrinciples,
  workflowBlueprints
} from "@/content/revanta-os";

export function getRevantaOsManifest() {
  return {
    name: "Revanta OS",
    modules: platformModules,
    principles: platformPrinciples,
    workflows: workflowBlueprints,
    templates: industryTemplates,
    totals: {
      modules: platformModules.length,
      workflows: workflowBlueprints.length,
      templates: industryTemplates.length
    }
  };
}
