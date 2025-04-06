import powerbi from "powerbi-visuals-api";

import IPoint = powerbi.extensibility.IPoint;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import VisualOnObjectFormatting = powerbi.extensibility.visual.VisualOnObjectFormatting;
import ILocalizationManager = powerbi.extensibility.ILocalizationManager;

import ISelectionId = powerbi.visuals.ISelectionId;
import CustomVisualSubSelection = powerbi.visuals.CustomVisualSubSelection;
import SubSelectionStyles = powerbi.visuals.SubSelectionStyles;
import VisualSubSelectionShortcuts = powerbi.visuals.VisualSubSelectionShortcuts;
import SubSelectionStylesType = powerbi.visuals.SubSelectionStylesType;

import { select as d3Select } from "d3-selection";
import { HtmlSubSelectionHelper, SubSelectableObjectNameAttribute } from "powerbi-visuals-utils-onobjectutils";

import { StreamGraphObjectNames } from "../streamGraphSettingsModel";
import { SubSelectionStylesService, SubSelectionShortcutsService } from "./helperServices";
import { StackedStackValue } from "../dataInterfaces";

export class StreamGraphOnObjectService implements VisualOnObjectFormatting {
    private localizationManager: ILocalizationManager;
    private htmlSubSelectionHelper: HtmlSubSelectionHelper;
    private getSelectionId: (stackedValue: StackedStackValue) => ISelectionId;
    private calculatePoints: (identity: ISelectionId) => IPoint[];

    constructor(element: HTMLElement, host: IVisualHost, localizationManager: ILocalizationManager,
        getSelectionId: (stackedValue: StackedStackValue) => ISelectionId,
        calculatePoints: (identity: ISelectionId) => IPoint[]
    ) {
        this.localizationManager = localizationManager;
        this.getSelectionId = getSelectionId;
        this.calculatePoints = calculatePoints;
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
                case StreamGraphObjectNames.Layers:
                    return SubSelectionShortcutsService.GetLayersShortcuts(this.localizationManager);
            }
        }
    }

    public selectionIdCallback(e: Element): powerbi.visuals.ISelectionId {
        const elementType: string = d3Select(e).attr(SubSelectableObjectNameAttribute);

        switch (elementType) {
            case StreamGraphObjectNames.Layers: {
                const datum: StackedStackValue = d3Select<Element, any>(e).datum();
                const identity = this.getSelectionId(datum);
                return identity;
            }
            default:
                return undefined;
        }
    }

    public customOutlineCallback(subSelections: CustomVisualSubSelection): powerbi.visuals.SubSelectionRegionOutlineFragment[] {
        const elementType: string = subSelections.customVisualObjects[0].objectName;

        switch (elementType) {
            case StreamGraphObjectNames.Layers:
                {
                    const subSelectionIdentity: powerbi.visuals.ISelectionId = subSelections.customVisualObjects[0].selectionId;
                    const points = this.calculatePoints(subSelectionIdentity);

                    const result: powerbi.visuals.SubSelectionRegionOutlineFragment[] = [{
                        id: subSelectionIdentity.getKey(),
                        outline: {
                            type: powerbi.visuals.SubSelectionOutlineType.Polygon,
                            points: points
                        }
                    }]
                    return result;
                }
            default:
                return undefined;
        }
    }
}