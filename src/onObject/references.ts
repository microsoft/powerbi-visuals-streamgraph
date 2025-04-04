import powerbi from "powerbi-visuals-api";
import SubSelectableDirectEdit = powerbi.visuals.SubSelectableDirectEdit;
import SubSelectableDirectEditStyle = powerbi.visuals.SubSelectableDirectEditStyle;

import { IFontReference } from "./interfaces";

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
