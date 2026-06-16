import { describe, expect, it } from "vitest";
import { render } from "svelte/server";
import ExportPanel from "../src/components/ExportPanel.svelte";

describe("ExportPanel", () => {
  it("renders PNG and PDF export actions in the final export section", () => {
    const { body } = render(ExportPanel, {
      props: {
        includeUnassigned: false,
        canExportAssignments: true,
        totalPeaks: 12,
        assignedCount: 3,
        onIncludeUnassignedChange: () => undefined,
        onExportAssignments: () => undefined,
        onExportPng: () => undefined,
        onExportPdf: () => undefined,
      },
    });

    expect(body).toContain("annotated PNG or PDF versions of the current spectrum view");
    expect(body).toContain(">Download annotated PNG<");
    expect(body).toContain(">Download annotated PDF<");
  });
});
