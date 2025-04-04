import powerbi from "powerbi-visuals-api";
import SubSelectableDirectEdit = powerbi.visuals.SubSelectableDirectEdit;
import SubSelectableDirectEditStyle = powerbi.visuals.SubSelectableDirectEditStyle;

import { IDataLabelReference, IFontReference } from "./interfaces";
import { StreamGraphObjectNames } from "../streamGraphSettingsModel";

const createBaseFontReference = (objectName: string, settingName: string = ""): IFontReference => {
    return {
        fontFamily: {
            objectName: objectName,
            propertyName: "labelFontFamily"
        },
        bold: {
            objectName: objectName,
            propertyName: "labelFontBold"
        },
        italic: {
            objectName: objectName,
            propertyName: "labelFontItalic"
        },
        underline: {
            objectName: objectName,
            propertyName: "labelFontUnderline"
        },
        fontSize: {
            objectName: objectName,
            propertyName: "fontSize"
        },
        color: {
            objectName: objectName,
            propertyName: settingName ? `${settingName}Color` : "color"
        }
    }
}

export const dataLabelsReferences: IDataLabelReference = {
    ...createBaseFontReference(StreamGraphObjectNames.DataLabel),
    cardUid: "Visual-labels-card",
    groupUid: "labels-group",
    show: {
        objectName: StreamGraphObjectNames.DataLabel,
        propertyName: "show"
    },
    showValue: {
        objectName: StreamGraphObjectNames.DataLabel,
        propertyName: "showValue"
    }
}
