import powerbi from "powerbi-visuals-api";

import SubSelectionStyles = powerbi.visuals.SubSelectionStyles;
import VisualSubSelectionShortcuts = powerbi.visuals.VisualSubSelectionShortcuts;
import SubSelectionStylesType = powerbi.visuals.SubSelectionStylesType;
import VisualShortcutType = powerbi.visuals.VisualShortcutType;

import ILocalizationManager = powerbi.extensibility.ILocalizationManager;

import { IAxisReference, IFontReference, IYAxisReference } from "./interfaces";
import { dataLabelsReferences, legendReferences, xAxisReferences, yAxisReferences } from "./references";

export class SubSelectionStylesService {
    private static GetSubselectionStylesForText(objectReference: IFontReference): SubSelectionStyles {
        return {
            type: SubSelectionStylesType.Text,
            fontFamily: {
                reference: {
                    ...objectReference.fontFamily
                },
                label: objectReference.fontFamily.propertyName
            },
            bold: {
                reference: {
                    ...objectReference.bold
                },
                label: objectReference.bold.propertyName
            },
            italic: {
                reference: {
                    ...objectReference.italic
                },
                label: objectReference.italic.propertyName
            },
            underline: {
                reference: {
                    ...objectReference.underline
                },
                label: objectReference.underline.propertyName
            },
            fontSize: {
                reference: {
                    ...objectReference.fontSize
                },
                label: objectReference.fontSize.propertyName
            },
            fontColor: {
                reference: {
                    ...objectReference.color
                },
                label: objectReference.color.propertyName
            }
        };
    }

    public static GetLabelsStyles(): SubSelectionStyles {
        return SubSelectionStylesService.GetSubselectionStylesForText(dataLabelsReferences);
    }

    public static GetLegendStyles(): SubSelectionStyles {
        return SubSelectionStylesService.GetSubselectionStylesForText(legendReferences);
    }

    public static GetXAxisStyles(): SubSelectionStyles {
        return SubSelectionStylesService.GetSubselectionStylesForText(xAxisReferences);
    }

    public static GetXAxisTitleStyles(): SubSelectionStyles {
        return SubSelectionStylesService.GetSubselectionStylesForText(xAxisReferences.title);
    }

    public static GetYAxisStyles(): SubSelectionStyles {
        return SubSelectionStylesService.GetSubselectionStylesForText(yAxisReferences);
    }

    public static GetYAxisTitleStyles(): SubSelectionStyles {
        return SubSelectionStylesService.GetSubselectionStylesForText(yAxisReferences.title);
    }
}

export class SubSelectionShortcutsService {
    public static GetLabelsShortcuts(localizationManager: ILocalizationManager): VisualSubSelectionShortcuts {
        return [
            {
                type: VisualShortcutType.Toggle,
                ...dataLabelsReferences.show,
                disabledLabel: localizationManager.getDisplayName("Visual_OnObject_Delete")
            },
            {
                type: VisualShortcutType.Toggle,
                ...dataLabelsReferences.showValue,
                disabledLabel: localizationManager.getDisplayName("Visual_OnObject_DeleteValues"),
                enabledLabel: localizationManager.getDisplayName("Visual_ShowValues")
            },
            {
                type: VisualShortcutType.Divider,
            },
            {
                type: VisualShortcutType.Reset,
                relatedResetFormattingIds: [
                    dataLabelsReferences.bold,
                    dataLabelsReferences.fontFamily,
                    dataLabelsReferences.fontSize,
                    dataLabelsReferences.italic,
                    dataLabelsReferences.underline,
                    dataLabelsReferences.color,
                    dataLabelsReferences.show,
                    dataLabelsReferences.showValue
                ]
            },
            {
                type: VisualShortcutType.Navigate,
                destinationInfo: { cardUid: dataLabelsReferences.cardUid, groupUid: dataLabelsReferences.groupUid },
                label: localizationManager.getDisplayName("Visual_OnObject_FormatLabels")
            }
        ];
    }

    public static GetLegendShortcuts(localizationManager: ILocalizationManager): VisualSubSelectionShortcuts{
        return [
            {
                type: VisualShortcutType.Picker,
                ...legendReferences.position,
                label: localizationManager.getDisplayName("Visual_LegendPosition")
            },
            {
                type: VisualShortcutType.Toggle,
                ...legendReferences.show,
                disabledLabel: localizationManager.getDisplayName("Visual_OnObject_Delete")
            },
            {
                type: VisualShortcutType.Toggle,
                ...legendReferences.showTitle,
                enabledLabel: localizationManager.getDisplayName("Visual_OnObject_AddTitle")
            },
            {
                type: VisualShortcutType.Divider,
            },
            {
                type: VisualShortcutType.Reset,
                relatedResetFormattingIds: [
                    legendReferences.bold,
                    legendReferences.fontFamily,
                    legendReferences.fontSize,
                    legendReferences.italic,
                    legendReferences.underline,
                    legendReferences.color,
                    legendReferences.showTitle,
                    legendReferences.titleText
                ]
            },
            {
                type: VisualShortcutType.Navigate,
                destinationInfo: { cardUid: legendReferences.cardUid, groupUid: legendReferences.groupUid },
                label: localizationManager.getDisplayName("Visual_OnObject_FormatLegend")
            }
        ];
    }

    public static GetLegendTitleShortcuts(localizationManager: ILocalizationManager): VisualSubSelectionShortcuts {
        return [
            {
                type: VisualShortcutType.Toggle,
                ...legendReferences.showTitle,
                disabledLabel: localizationManager.getDisplayName("Visual_OnObject_Delete")
            },
            {
                type: VisualShortcutType.Divider,
            },
            {
                type: VisualShortcutType.Reset,
                relatedResetFormattingIds: [
                    legendReferences.showTitle,
                    legendReferences.titleText
                ]
            },
            {
                type: VisualShortcutType.Navigate,
                destinationInfo: { cardUid: legendReferences.cardUid, groupUid: legendReferences.titleGroupUid },
                label: localizationManager.getDisplayName("Visual_OnObject_FormatTitle")
            }
        ];
    }

    private static GetAxisShortcuts(axisReference: IAxisReference, displayKey: string, localizationManager: ILocalizationManager): VisualSubSelectionShortcuts {
        const yAxisInterface = (axisReference as IYAxisReference);
        return [
            {
                type: VisualShortcutType.Toggle,
                ...axisReference.show,
                disabledLabel: localizationManager.getDisplayName("Visual_OnObject_Delete")
            },
            {
                type: VisualShortcutType.Toggle,
                ...axisReference.showAxisTitle,
                enabledLabel: localizationManager.getDisplayName("Visual_OnObject_AddTitle")
            },
            yAxisInterface?.highPrecision ? {
                type: VisualShortcutType.Toggle,
                ...yAxisInterface.highPrecision,
                enabledLabel: localizationManager.getDisplayName("Visual_OnObject_EnableHighPrecision"),
                disabledLabel: localizationManager.getDisplayName("Visual_OnObject_DisableHighPrecision")
            } : null,
            {
                type: VisualShortcutType.Divider,
            },
            {
                type: VisualShortcutType.Reset,
                relatedResetFormattingIds: [
                    axisReference.bold,
                    axisReference.fontFamily,
                    axisReference.fontSize,
                    axisReference.italic,
                    axisReference.underline,
                    axisReference.color,
                    axisReference.show,
                    axisReference.showAxisTitle
                ]
            },
            {
                type: VisualShortcutType.Navigate,
                destinationInfo: { cardUid: axisReference.cardUid, groupUid: axisReference.groupUid },
                label: localizationManager.getDisplayName(displayKey)
            }
        ];
    }

    private static GetAxisTitleShortcuts(axisTitleReference: IAxisReference, localizationManager: ILocalizationManager): VisualSubSelectionShortcuts {
        return [
            {
                type: VisualShortcutType.Toggle,
                ...axisTitleReference.showAxisTitle,
                disabledLabel: localizationManager.getDisplayName("Visual_OnObject_Delete")
            },
            {
                type: VisualShortcutType.Divider,
            },
            {
                type: VisualShortcutType.Reset,
                relatedResetFormattingIds: [
                    axisTitleReference.showAxisTitle,
                    axisTitleReference.title.bold,
                    axisTitleReference.title.fontFamily,
                    axisTitleReference.title.fontSize,
                    axisTitleReference.title.italic,
                    axisTitleReference.title.underline,
                    axisTitleReference.title.color,
                ]
            },
            {
                type: VisualShortcutType.Navigate,
                destinationInfo: { cardUid: axisTitleReference.cardUid, groupUid: axisTitleReference.titleGroupUid},
                label: localizationManager.getDisplayName("Visual_OnObject_FormatTitle")
            }
        ];
    }

    public static GetXAxisShortcuts(localizationManager: ILocalizationManager): VisualSubSelectionShortcuts {
       return SubSelectionShortcutsService.GetAxisShortcuts(xAxisReferences, "Visual_OnObject_FormatXAxis", localizationManager);
    }

    public static GetXAxisTitleShortcuts(localizationManager: ILocalizationManager): VisualSubSelectionShortcuts {
        return SubSelectionShortcutsService.GetAxisTitleShortcuts(xAxisReferences, localizationManager);
    }

    public static GetYAxisShortcuts(localizationManager: ILocalizationManager): VisualSubSelectionShortcuts {
        return SubSelectionShortcutsService.GetAxisShortcuts(yAxisReferences, "Visual_OnObject_FormatYAxis", localizationManager);
    }

    public static GetYAxisTitleShortcuts(localizationManager: ILocalizationManager): VisualSubSelectionShortcuts {
        return SubSelectionShortcutsService.GetAxisTitleShortcuts(yAxisReferences, localizationManager);
    }
}