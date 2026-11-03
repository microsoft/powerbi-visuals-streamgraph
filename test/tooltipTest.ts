import powerbi from "powerbi-visuals-api";
import DataViewCategorical = powerbi.DataViewCategorical;
import ILocalizationManager = powerbi.extensibility.ILocalizationManager;

import { createTooltipInfo, hasTooltipFields } from "../src/tooltipBuilder";
import { StreamGraphSettingsModel } from "../src/streamGraphSettingsModel";

describe("Tooltips bucket", () => {
    const localizationManager = { getDisplayName: (key: string) => key } as ILocalizationManager;

    const buildCategorical = (withTooltips: boolean): DataViewCategorical => {
        const values: any = [
            {
                source: { displayName: "Sales", queryName: "sales", groupName: "A", roles: { Y: true } },
                values: [10, 20, 30]
            },
            {
                source: { displayName: "Sales", queryName: "sales", groupName: "B", roles: { Y: true } },
                values: [1, 2, 3]
            }
        ];

        if (withTooltips) {
            values.push(
                {
                    source: { displayName: "Profit", queryName: "profit", groupName: "A", roles: { Tooltips: true } },
                    values: [100, 200, 300]
                },
                {
                    source: { displayName: "Profit", queryName: "profit", groupName: "B", roles: { Tooltips: true } },
                    values: [-1, -2, -3]
                }
            );
        }
        values.source = { displayName: "Group", roles: { Series: true } };

        return {
            categories: [
                { source: { displayName: "Month", queryName: "month", roles: { Category: true } }, values: ["Jan", "Feb", "Mar"] },
                ...(withTooltips
                    ? [{ source: { displayName: "Region", queryName: "region", roles: { Tooltips: true } }, values: ["N", "S", "E"] }]
                    : [])
            ] as any,
            values
        };
    };

    it("detects whether the Tooltips bucket is populated", () => {
        expect(hasTooltipFields(buildCategorical(false))).toBe(false);
        expect(hasTooltipFields(buildCategorical(true))).toBe(true);
        expect(hasTooltipFields(undefined)).toBe(false);
    });

    it("returns default tooltip items when the Tooltips bucket is empty", () => {
        const items = createTooltipInfo(buildCategorical(false), localizationManager, 0, 1);

        expect(items.some(item => item.displayName === "Sales")).toBe(false);
        expect(items.some(item => item.displayName === "Group" && item.value === "A")).toBe(true);
    });

    it("returns only Tooltips bucket fields resolved for the hovered point", () => {
        const items = createTooltipInfo(buildCategorical(true), localizationManager, 0, 1);

        expect(items).toEqual([
            { displayName: "Region", value: "S" },
            { displayName: "Profit", value: "200" }
        ]);
    });

    it("resolves tooltip measures of the hovered series", () => {
        const items = createTooltipInfo(buildCategorical(true), localizationManager, 1, 2);

        expect(items.find(item => item.displayName === "Profit")?.value).toBe("-3");
    });

    it("returns no items when the point index is unknown", () => {
        expect(createTooltipInfo(buildCategorical(true), localizationManager, 0)).toEqual([]);
    });

    it("shows tooltips by default in the format settings", () => {
        const settings = new StreamGraphSettingsModel();

        expect(settings.tooltips.show.value).toBe(true);
        expect(settings.cards).toContain(settings.tooltips);
    });
});
