import powerbi from "powerbi-visuals-api";
import SubSelectableDirectEdit = powerbi.visuals.SubSelectableDirectEdit;
import SubSelectableDirectEditStyle = powerbi.visuals.SubSelectableDirectEditStyle;

import { IAxisReference, IDataLabelReference, IFontReference, ILegendReference } from "./interfaces";
import { StreamGraphObjectNames } from "../streamGraphSettingsModel";

const createBaseFontReference = (objectName: string, settingName: string = ""): IFontReference => {
    const baseSettingName: string = "label";
    return {
        fontFamily: {
            objectName: objectName,
            propertyName: `${settingName || baseSettingName}FontFamily`
        },
        bold: {
            objectName: objectName,
            propertyName: `${settingName || baseSettingName}FontBold`
        },
        italic: {
            objectName: objectName,
            propertyName: `${settingName || baseSettingName}FontItalic`
        },
        underline: {
            objectName: objectName,
            propertyName: `${settingName || baseSettingName}FontUnderline`
        },
        fontSize: {
            objectName: objectName,
            propertyName: settingName ? `${settingName}FontSize` : `fontSize`
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

export const legendReferences: ILegendReference = {
    ...createBaseFontReference(StreamGraphObjectNames.Legend, "label"),
    cardUid: "Visual-legend-card",
    groupUid: "legendOptions-group",
    show: {
        objectName: StreamGraphObjectNames.Legend,
        propertyName: "show"
    },
    showTitle: {
        objectName: StreamGraphObjectNames.Legend,
        propertyName: "showTitle"
    },
    titleText: {
        objectName: StreamGraphObjectNames.Legend,
        propertyName: "titleText"
    },
    position: {
        objectName: StreamGraphObjectNames.Legend,
        propertyName: "position"
    }
}

export const TitleEdit: SubSelectableDirectEdit = {
    reference: {
        objectName: StreamGraphObjectNames.Legend,
        propertyName: "titleText"
    },
    style: SubSelectableDirectEditStyle.HorizontalLeft,
}

export const titleEditSubSelection = JSON.stringify(TitleEdit);

export const xAxisReferences: IAxisReference = {
    ...createBaseFontReference(StreamGraphObjectNames.XAxis, "label"),
    title: {...createBaseFontReference(StreamGraphObjectNames.XAxis, "title")},
    cardUid: "Visual-categoryAxis-card",
    groupUid: "optionsGroupcategoryAxis-group",
    show: {
        objectName: StreamGraphObjectNames.XAxis,
        propertyName: "show"
    },
    showAxisTitle: {
        objectName: StreamGraphObjectNames.XAxis,
        propertyName: "showAxisTitle"
    },
    titleColor: {
        objectName: StreamGraphObjectNames.XAxis,
        propertyName: "titleColor"
    }
}