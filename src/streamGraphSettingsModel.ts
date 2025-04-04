import powerbiVisualsApi from "powerbi-visuals-api";
import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import { legendInterfaces } from "powerbi-visuals-utils-chartutils";
import { DataOrder, DataOffset } from "./utils";
import LegendPosition = legendInterfaces.LegendPosition;

import Card = formattingSettings.SimpleCard;
import CompositeCard = formattingSettings.CompositeCard;
import Group = formattingSettings.Group;
import Model = formattingSettings.Model;

import IEnumMember = powerbi.IEnumMember;

const dataOrderOptions : IEnumMember[] = [
    {value : DataOrder[DataOrder.None], displayName : "None"}, 
    {value : DataOrder[DataOrder.Ascending], displayName : "Ascending"},
    {value : DataOrder[DataOrder.Descending], displayName : "Descending"}, 
    {value : DataOrder[DataOrder.InsideOut], displayName : "InsideOut"}, 
    {value : DataOrder[DataOrder.Reverse], displayName : "Reverse"}
];

const dataOffsetOptions : IEnumMember[] = [
    {value : DataOffset[DataOffset.Silhouette], displayName : "Silhouette"},
    {value : DataOffset[DataOffset.Expand], displayName : "Expand"}
];

export class BaseFontCardSettings extends Card {
    public fontFamily = new formattingSettings.FontPicker({
        name: "labelFontFamily",
        value: "Segoe UI, wf_segoe-ui_normal, helvetica, arial, sans-serif"
    });

    public fontSize = new formattingSettings.NumUpDown({
        name: "fontSize",
        displayName: "Text Size",
        displayNameKey: "Visual_TextSize",
        value: 8,
        options: {
            minValue: {
                type: powerbiVisualsApi.visuals.ValidatorType.Min,
                value: 8,
            },
            maxValue: {
                type: powerbiVisualsApi.visuals.ValidatorType.Max,
                value: 60,
            }
        }
    });

    public bold = new formattingSettings.ToggleSwitch({
        name: "labelFontBold",
        value: false
    });

    public italic = new formattingSettings.ToggleSwitch({
        name: "labelFontItalic",
        value: false
    });

    public underline = new formattingSettings.ToggleSwitch({
        name: "labelFontUnderline",
        value: false
    });

    public font = new formattingSettings.FontControl({
        name: "font",
        displayNameKey: "Visual_Font",
        fontFamily: this.fontFamily,
        fontSize: this.fontSize,
        bold: this.bold,
        italic: this.italic,
        underline: this.underline
    });
}

class AxisTitleGroup extends Card {
    constructor(settingName: string){
        super();

        this.name = `titleGroup${settingName}`;
        this.displayNameKey = `Visual_Title`;
        this.topLevelSlice = this.show;

        this.slices = [this.color];
    }

    public color = new formattingSettings.ColorPicker({
        name: "titleColor",
        displayNameKey: "Visual_Color",
        displayName: "Color",
        value: { value: "#000000" }
    });

    public show = new formattingSettings.ToggleSwitch({
        name: "showAxisTitle",
        displayNameKey: "Visual_Title",
        displayName: "Title",
        value: false,
    });
}

class AxisOptionsGroup extends BaseFontCardSettings {
    constructor(settingName: string, useHighPrecision: boolean = false){
        super();

        this.name = `optionsGroup${settingName}`;
        this.displayNameKey = `Visual_Values`;
        this.topLevelSlice = this.show;

        this.slices = [...(useHighPrecision ? [this.highPrecision] : []), this.font, this.labelColor];
    }

    public show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayName: "Show Axis",
        displayNameKey: "Visual_ShowAxis",
        value: true,
    });

    public labelColor = new formattingSettings.ColorPicker({
        name: "labelColor",
        displayNameKey: "Visual_Color",
        displayName: "Color",
        value: { value: "#000000" }
    });

    public highPrecision = new formattingSettings.ToggleSwitch({
        name: "highPrecision",
        displayName: "High Precision",
        displayNameKey: "Visual_HighPrecision",
        value: false,
    });
}

export class EnableGeneralCardSettings extends Card {
    wiggle = new formattingSettings.ToggleSwitch({
        name: "wiggle",
        displayName: "Enable Wiggle",
        displayNameKey: "Visual_Wiggle",
        value: true,
    });

    topLevelSlice = this.wiggle;


    dataOffsetDropDown = new formattingSettings.ItemDropdown({
        items: dataOffsetOptions,
        value: dataOffsetOptions[0],
        displayName: "Wiggle Type",
        displayNameKey: "Visual_DataOffset",
        name: "dataOffset"
    });

    dataOrderDropDown = new formattingSettings.ItemDropdown({
        items: dataOrderOptions,
        value: dataOrderOptions[0],
        displayName: "Data Order",
        displayNameKey: "Visual_DataOrder",
        name: "dataOrder"
    });

    name: string = "general";
    displayName: string = "General";
    displayNameKey: string = "Visual_General";
    slices = [this.wiggle, this.dataOffsetDropDown, this.dataOrderDropDown];
}

export class BaseAxisCardSettings extends CompositeCard {
    public title: AxisTitleGroup;
    public options: AxisOptionsGroup;
    public groups: Group[];

    constructor(name: string, displayNameKey: string, useHighPrecision: boolean = false){
        super();

        this.name = name;
        this.displayNameKey = displayNameKey;
        this.title = new AxisTitleGroup(name);
        this.options = new AxisOptionsGroup(name, useHighPrecision);
        this.groups = [this.options, this.title];
    }
}

const positionOptions : IEnumMember[] = [
    {value : LegendPosition[LegendPosition.Top], displayName : "Top"}, 
    {value : LegendPosition[LegendPosition.Bottom], displayName : "Bottom"},
    {value : LegendPosition[LegendPosition.Left], displayName : "Left"}, 
    {value : LegendPosition[LegendPosition.Right], displayName : "Right"}, 
    {value : LegendPosition[LegendPosition.TopCenter], displayName : "TopCenter"}, 
    {value : LegendPosition[LegendPosition.BottomCenter], displayName : "BottomCenter"}, 
    {value : LegendPosition[LegendPosition.LeftCenter], displayName : "LeftCenter"}, 
    {value : LegendPosition[LegendPosition.RightCenter], displayName : "RightCenter"}, 
]; 

export class EnableLegendCardSettings extends Card {
    public static DefaultTitleText: string = "";
    public static DefaultFontSizeInPoints: number = 8;

    show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayName: "show",
        displayNameKey: "Visual_Show",
        value: true,
    });

    topLevelSlice = this.show;

    showAxisTitle = new formattingSettings.ToggleSwitch({
        name: "showTitle",
        displayName: "Title",
        displayNameKey: "Visual_Title",
        value: true,
    });

    positionDropDown = new formattingSettings.ItemDropdown({
        items: positionOptions,
        value: positionOptions[0],
        displayName: "Position",
        displayNameKey: "Visual_LegendPosition",
        name: "position"
    });

    legendName = new formattingSettings.TextInput({
        placeholder: "",
        value: "",
        displayName: "Legend Name",
        displayNameKey: "Visual_LegendName",
        name: "titleText"
    });

    fontSize = new formattingSettings.NumUpDown({
        name: "fontSize",
        displayName: "Text Size",
        displayNameKey: "Visual_TextSize",
        value: 8,
        options: {
            minValue: {
                type: powerbiVisualsApi.visuals.ValidatorType.Min,
                value: 8,
            },
            maxValue: {
                type: powerbiVisualsApi.visuals.ValidatorType.Max,
                value: 60,
            }
        }
    });

    labelColor = new formattingSettings.ColorPicker({
        name: "labelColor",
        displayNameKey: "Visual_Color",
        displayName: "Color",
        value: { value: "#666666" }
    });

    name: string = "legend";
    displayName: string = "Legend";
    displayNameKey: string = "Visual_Legend";
    slices = [this.positionDropDown, this.showAxisTitle, this.legendName, this.labelColor, this.fontSize];
}

export class DataLabelsCardSettings extends BaseFontCardSettings {
    show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayName: undefined,
        displayNameKey: "Visual_Show",
        value: false,
    });

    topLevelSlice = this.show;

    showValues = new formattingSettings.ToggleSwitch({
        name: "showValue",
        displayName: "Show Values",
        displayNameKey: "Visual_ShowValues",
        value: false,
    });

    color = new formattingSettings.ColorPicker({
        name: "color",
        displayNameKey: "Visual_Color",
        displayName: "Color",
        value: { value: "#888888" }
    });

    name: string = "labels";
    displayName: string = "Data Labels";
    displayNameKey: string = "Visual_DataPointsLabels";
    slices = [this.showValues, this.font, this.color];
}

export class EnableGraphCurvatureCardSettings extends Card{
    enabled = new formattingSettings.ToggleSwitch({
        name: "enabled",
        value: true,
    });

    topLevelSlice = this.enabled;

    value = new formattingSettings.NumUpDown({
        name: "value",
        displayName: "Curvature Value",
        displayNameKey: "Visual_CurvatureValue",
        value: 5,
        options: {
            minValue: {
                type: powerbiVisualsApi.visuals.ValidatorType.Min,
                value: 0,
            },
            maxValue: {
                type: powerbiVisualsApi.visuals.ValidatorType.Max,
                value: 50,
            }
        }
    });

    name: string = "curvature";
    displayName: string = "Curvature";
    displayNameKey: string = "Visual_Curvature";
    slices = [this.value];
}

export class StreamGraphSettingsModel extends Model {
    general = new EnableGeneralCardSettings();
    categoryAxis = new BaseAxisCardSettings("categoryAxis", "Visual_XAxis");
    valueAxis = new BaseAxisCardSettings("valueAxis", "Visual_YAxis", true);
    enableLegendCardSettings = new EnableLegendCardSettings();
    dataLabels = new DataLabelsCardSettings();
    enableGraphCurvatureCardSettings = new EnableGraphCurvatureCardSettings();

    cards = [
        this.general,
        this.categoryAxis,
        this.valueAxis,
        this.enableLegendCardSettings,
        this.dataLabels,
        this.enableGraphCurvatureCardSettings
    ];
}
