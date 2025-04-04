import powerbi from "powerbi-visuals-api";

import CustomVisualSubSelection = powerbi.visuals.CustomVisualSubSelection;
import SubSelectionStyles = powerbi.visuals.SubSelectionStyles;
import VisualSubSelectionShortcuts = powerbi.visuals.VisualSubSelectionShortcuts;
import SubSelectionStylesType = powerbi.visuals.SubSelectionStylesType;
import VisualShortcutType = powerbi.visuals.VisualShortcutType;

import ILocalizationManager = powerbi.extensibility.ILocalizationManager;

import { IFontReference } from "./interfaces";
import { dataLabelsReferences } from "./references";

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
}