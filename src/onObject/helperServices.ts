import powerbi from "powerbi-visuals-api";

import CustomVisualSubSelection = powerbi.visuals.CustomVisualSubSelection;
import SubSelectionStyles = powerbi.visuals.SubSelectionStyles;
import VisualSubSelectionShortcuts = powerbi.visuals.VisualSubSelectionShortcuts;
import SubSelectionStylesType = powerbi.visuals.SubSelectionStylesType;
import VisualShortcutType = powerbi.visuals.VisualShortcutType;

import ILocalizationManager = powerbi.extensibility.ILocalizationManager;

import { IFontReference } from "./interfaces";
import { dataLabelsReferences, legendReferences, xAxisReferences } from "./references";

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
                destinationInfo: { cardUid: legendReferences.cardUid, groupUid: "legendTitle-group" },
                label: localizationManager.getDisplayName("Visual_OnObject_FormatTitle")
            }
        ];
    }

    public static GetXAxisShortcuts(localizationManager: ILocalizationManager): VisualSubSelectionShortcuts {
        return [
            {
                type: VisualShortcutType.Toggle,
                ...xAxisReferences.show,
                disabledLabel: localizationManager.getDisplayName("Visual_OnObject_Delete")
            },
            {
                type: VisualShortcutType.Toggle,
                ...xAxisReferences.showAxisTitle,
                enabledLabel: localizationManager.getDisplayName("Visual_OnObject_AddTitle")
            },
            {
                type: VisualShortcutType.Divider,
            },
            {
                type: VisualShortcutType.Reset,
                relatedResetFormattingIds: [
                    xAxisReferences.bold,
                    xAxisReferences.fontFamily,
                    xAxisReferences.fontSize,
                    xAxisReferences.italic,
                    xAxisReferences.underline,
                    xAxisReferences.color,
                    xAxisReferences.show,
                    xAxisReferences.showAxisTitle
                ]
            },
            {
                type: VisualShortcutType.Navigate,
                destinationInfo: { cardUid: xAxisReferences.cardUid, groupUid: xAxisReferences.groupUid },
                label: localizationManager.getDisplayName("Visual_OnObject_FormatXAxis")
            }
        ];
    }

    public static GetXAxisTitleShortcuts(localizationManager: ILocalizationManager): VisualSubSelectionShortcuts {
        return [
            {
                type: VisualShortcutType.Toggle,
                ...xAxisReferences.showAxisTitle,
                disabledLabel: localizationManager.getDisplayName("Visual_OnObject_Delete")
            },
            {
                type: VisualShortcutType.Divider,
            },
            {
                type: VisualShortcutType.Reset,
                relatedResetFormattingIds: [
                    xAxisReferences.showAxisTitle,
                    xAxisReferences.title.bold,
                    xAxisReferences.title.fontFamily,
                    xAxisReferences.title.fontSize,
                    xAxisReferences.title.italic,
                    xAxisReferences.title.underline,
                    xAxisReferences.title.color,
                ]
            },
            {
                type: VisualShortcutType.Navigate,
                destinationInfo: { cardUid: xAxisReferences.cardUid, groupUid: "titleGroupcategoryAxis-group"},
                label: localizationManager.getDisplayName("Visual_OnObject_FormatTitle")
            }
        ];
    }
}