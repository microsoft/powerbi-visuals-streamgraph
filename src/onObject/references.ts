import powerbi from "powerbi-visuals-api";
import SubSelectableDirectEdit = powerbi.visuals.SubSelectableDirectEdit;
import SubSelectableDirectEditStyle = powerbi.visuals.SubSelectableDirectEditStyle;

import { IAxisReference, IDataLabelReference, IFontReference, ILegendReference, IYAxisReference } from "./interfaces";
import { LegendTitleGroup, StreamGraphObjectNames } from "../streamGraphSettingsModel";
import { StreamGraphOnObjectService } from "./onObjectService";

const createBaseFontReference = (objectName: string, colorName: string = "", settingName: string = ""): IFontReference => {
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
            propertyName: colorName ? `${colorName}Color` : `color`
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
    titleGroupUid: `${StreamGraphObjectNames.LegendTitle}-group`,
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
    title: {...createBaseFontReference(StreamGraphObjectNames.XAxis, "title", "title")},
    cardUid: "Visual-categoryAxis-card",
    groupUid: `${StreamGraphObjectNames.XAxisLabel}-group`,
    titleGroupUid: "titleGroupcategoryAxis-group",
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

export const yAxisReferences: IYAxisReference = {
    ...createBaseFontReference(StreamGraphObjectNames.YAxis, "label"),
    title: {...createBaseFontReference(StreamGraphObjectNames.YAxis, "title", "title")},
    cardUid: "Visual-valueAxis-card",
    groupUid: `${StreamGraphObjectNames.YAxisLabel}-group`,
    titleGroupUid: "titleGroupvalueAxis-group",
    show: {
        objectName: StreamGraphObjectNames.YAxis,
        propertyName: "show"
    },
    showAxisTitle: {
        objectName: StreamGraphObjectNames.YAxis,
        propertyName: "showAxisTitle"
    },
    titleColor: {
        objectName: StreamGraphObjectNames.YAxis,
        propertyName: "titleColor"
    },
    highPrecision: {
        objectName: StreamGraphObjectNames.YAxis,
        propertyName: "highPrecision"
    }
}
