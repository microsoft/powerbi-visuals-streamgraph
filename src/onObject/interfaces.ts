import powerbi from "powerbi-visuals-api";

import GroupFormattingModelReference = powerbi.visuals.GroupFormattingModelReference;
import FormattingId = powerbi.visuals.FormattingId;

export interface IFontReference extends GroupFormattingModelReference {
    fontFamily: FormattingId;
    bold: FormattingId;
    italic: FormattingId;
    underline: FormattingId;
    fontSize: FormattingId;
    color: FormattingId;
}

export interface IDataLabelReference extends IFontReference {
    show: FormattingId;
    showValue: FormattingId;
}

export interface ILegendReference extends IFontReference {
    show: FormattingId;
    showTitle: FormattingId;
    position: FormattingId;
    titleText: FormattingId;
    titleGroupUid: string;
}

export interface IAxisReference extends IFontReference {
    show: FormattingId;
    showAxisTitle: FormattingId;
    titleColor: FormattingId;
    title: IFontReference;
    titleGroupUid: string;
}

export interface IYAxisReference extends IAxisReference {
    highPrecision: FormattingId;
}

export interface ILayerInterface extends GroupFormattingModelReference {
    curvatureEnable: FormattingId;
    curvatureValue: FormattingId;
    wiggle: FormattingId;
    dataOrder: FormattingId;
    dataOffset: FormattingId;
    curvatureCardUid: string;
}