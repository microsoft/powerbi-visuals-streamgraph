import powerbi from "powerbi-visuals-api";

import IVisualHost = powerbi.extensibility.visual.IVisualHost;

import CustomVisualSubSelection = powerbi.visuals.CustomVisualSubSelection;
import SubSelectionStyles = powerbi.visuals.SubSelectionStyles;
import VisualSubSelectionShortcuts = powerbi.visuals.VisualSubSelectionShortcuts;
import SubSelectionStylesType = powerbi.visuals.SubSelectionStylesType;
import VisualOnObjectFormatting = powerbi.extensibility.visual.VisualOnObjectFormatting;
import ILocalizationManager = powerbi.extensibility.ILocalizationManager;

import { select as d3Select } from "d3-selection";
import { HtmlSubSelectionHelper, SubSelectableObjectNameAttribute } from "powerbi-visuals-utils-onobjectutils";

import { StreamGraphObjectNames } from "../streamGraphSettingsModel";
import { SubSelectionStylesService, SubSelectionShortcutsService } from "./helperServices";

export class StreamGraphOnObjectService implements VisualOnObjectFormatting {
    private localizationManager: ILocalizationManager;
    private htmlSubSelectionHelper: HtmlSubSelectionHelper;

    constructor(element: HTMLElement, host: IVisualHost, localizationManager: ILocalizationManager) {
        this.localizationManager = localizationManager;
        this.htmlSubSelectionHelper = HtmlSubSelectionHelper.createHtmlSubselectionHelper({
            hostElement: element,
            subSelectionService: host.subSelectionService,
            selectionIdCallback: (e) => this.selectionIdCallback(e),
            customOutlineCallback: (e) => this.customOutlineCallback(e)
        });
    }

    public setFormatMode(isFormatMode: boolean): void {
        this.htmlSubSelectionHelper.setFormatMode(isFormatMode);
    }

    public updateOutlinesFromSubSelections(subSelections: CustomVisualSubSelection[], clearExistingOutlines?: boolean, suppressRender?: boolean): void {
        this.htmlSubSelectionHelper.updateOutlinesFromSubSelections(subSelections, clearExistingOutlines, suppressRender);
    }

    public getSubSelectables(filter?: SubSelectionStylesType): CustomVisualSubSelection[] | undefined{
        return this.htmlSubSelectionHelper.getAllSubSelectables(filter);
    }

    public getSubSelectionStyles(subSelections: CustomVisualSubSelection[]): SubSelectionStyles | undefined{
        const visualObject = subSelections[0]?.customVisualObjects[0];
        if (visualObject) {
            switch (visualObject.objectName) {
                case StreamGraphObjectNames.DataLabel:
                    return SubSelectionStylesService.GetLabelsStyles();
                case StreamGraphObjectNames.Legend:
                    return SubSelectionStylesService.GetLegendStyles();
                case StreamGraphObjectNames.XAxis:
                    return SubSelectionStylesService.GetXAxisStyles();
                case StreamGraphObjectNames.XAxisLabel:
                    return SubSelectionStylesService.GetXAxisTitleStyles();
                case StreamGraphObjectNames.YAxis:
                    return SubSelectionStylesService.GetYAxisStyles();
                case StreamGraphObjectNames.YAxisLabel:
                    return SubSelectionStylesService.GetYAxisTitleStyles();
            }
        }
    }

    public getSubSelectionShortcuts(subSelections: CustomVisualSubSelection[]): VisualSubSelectionShortcuts | undefined{
        const visualObject = subSelections[0]?.customVisualObjects[0];
        if (visualObject) {
            switch (visualObject.objectName) {
                case StreamGraphObjectNames.DataLabel:
                    return SubSelectionShortcutsService.GetLabelsShortcuts(this.localizationManager);
                case StreamGraphObjectNames.Legend:
                    return SubSelectionShortcutsService.GetLegendShortcuts(this.localizationManager);
                case StreamGraphObjectNames.LegendTitle:
                    return SubSelectionShortcutsService.GetLegendTitleShortcuts(this.localizationManager);
                case StreamGraphObjectNames.XAxis:
                    return SubSelectionShortcutsService.GetXAxisShortcuts(this.localizationManager);
                case StreamGraphObjectNames.XAxisLabel:
                    return SubSelectionShortcutsService.GetXAxisTitleShortcuts(this.localizationManager);
                case StreamGraphObjectNames.YAxis:
                    return SubSelectionShortcutsService.GetYAxisShortcuts(this.localizationManager);
                case StreamGraphObjectNames.YAxisLabel:
                    return SubSelectionShortcutsService.GetYAxisTitleShortcuts(this.localizationManager);
            }
        }
    }

    public selectionIdCallback(e: Element): powerbi.visuals.ISelectionId {
        const elementType: string = d3Select(e).attr(SubSelectableObjectNameAttribute);

        switch (elementType) {
            default:
                return undefined;
        }
    }

    public customOutlineCallback(subSelections: CustomVisualSubSelection): powerbi.visuals.SubSelectionRegionOutlineFragment[] {
        const elementType: string = subSelections.customVisualObjects[0].objectName;

        switch (elementType) {
            default:
                return undefined;
        }
    }
}