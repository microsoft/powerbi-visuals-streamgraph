import powerbi from "powerbi-visuals-api";
import ILocalizationManager = powerbi.extensibility.ILocalizationManager;

import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import { legendInterfaces } from "powerbi-visuals-utils-chartutils";
import { DataOrder, DataOffset } from "./utils";
import LegendPosition = legendInterfaces.LegendPosition;

import Card = formattingSettings.SimpleCard;
import CompositeCard = formattingSettings.CompositeCard;
import Group = formattingSettings.Group;
import Model = formattingSettings.Model;

import IEnumMember = powerbi.IEnumMember;
interface IEnumMemberWithDisplayNameKey extends IEnumMember{
    key: string;
}

const dataOrderOptions : IEnumMemberWithDisplayNameKey[] = [
    {value : DataOrder[DataOrder.None], displayName : "None", key: "Visual_DataOrder_None"}, 
    {value : DataOrder[DataOrder.Ascending], displayName : "Ascending", key: "Visual_DataOrder_Ascending"},
    {value : DataOrder[DataOrder.Descending], displayName : "Descending", key: "Visual_DataOrder_Descending"}, 
    {value : DataOrder[DataOrder.InsideOut], displayName : "InsideOut", key: "Visual_DataOrder_InsideOut"}, 
    {value : DataOrder[DataOrder.Reverse], displayName : "Reverse", key: "Visual_DataOrder_Reverse"}
];

const dataOffsetOptions : IEnumMemberWithDisplayNameKey[] = [
    {value : DataOffset[DataOffset.Silhouette], displayName : "Silhouette", key: "Visual_DataOffset_Silhouette"},
    {value : DataOffset[DataOffset.Expand], displayName : "Expand", key: "Visual_DataOffset_Expand"}
];

export const enum StreamGraphObjectNames {
    DataLabel = "labels"
}

export class BaseFontCardSettings extends Card {
    public fontFamily: formattingSettings.FontPicker;
    public fontSize: formattingSettings.NumUpDown;
    public bold: formattingSettings.ToggleSwitch;
    public italic: formattingSettings.ToggleSwitch;
    public underline: formattingSettings.ToggleSwitch;
    public font: formattingSettings.FontControl;
    private defaultSettingName: string = "label";

    constructor(settingName: string = ""){
        super();

        this.fontFamily = new formattingSettings.FontPicker({
            name: `${settingName || this.defaultSettingName}FontFamily`,
            value: "Segoe UI, wf_segoe-ui_normal, helvetica, arial, sans-serif"
        });
        this.fontSize = new formattingSettings.NumUpDown({
            name: settingName ? `${settingName}FontSize` : "fontSize",
            displayName: "Text Size",
            displayNameKey: "Visual_TextSize",
            value: 8,
            options: {
                minValue: {
                    type: powerbi.visuals.ValidatorType.Min,
                    value: 8,
                },
                maxValue: {
                    type: powerbi.visuals.ValidatorType.Max,
                    value: 60,
                }
            }
        });
        this.bold = new formattingSettings.ToggleSwitch({
            name: `${settingName || this.defaultSettingName}FontBold`,
            value: false
        });
        this.italic = new formattingSettings.ToggleSwitch({
            name: `${settingName || this.defaultSettingName}FontItalic`,
            value: false
        });
        this.underline = new formattingSettings.ToggleSwitch({
            name: `${settingName || this.defaultSettingName}FontUnderline`,
            value: false
        });
        this.font = new formattingSettings.FontControl({
            name: `${settingName}font`,
            displayNameKey: "Visual_Font",
            fontFamily: this.fontFamily,
            fontSize: this.fontSize,
            bold: this.bold,
            italic: this.italic,
            underline: this.underline
        });
    }
}

class AxisTitleGroup extends BaseFontCardSettings {
    constructor(settingName: string){
        super("title");

        this.name = `titleGroup${settingName}`;
        this.displayNameKey = `Visual_Title`;
        this.topLevelSlice = this.show;

        this.slices = [this.font, this.color];
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

export class GeneralCardSettings extends Card {
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

class LegendOptionsGroup extends Card {
    public defaultPosition: IEnumMember = positionOptions[0];

    public position = new formattingSettings.ItemDropdown({
        items: positionOptions,
        value: positionOptions[0],
        displayName: "Position",
        displayNameKey: "Visual_LegendPosition",
        name: "position"
    });

    name: string = "legendOptions";
    displayName: string = "Options";
    displayNameKey: string = "Visual_Options";
    slices = [this.position];
}

export class LegendTextGroup extends BaseFontCardSettings {
    public static DefaultLabelColor: string = "#000000";
    public static DefaultFontSizeInPoints: number = 8;

    public labelColor = new formattingSettings.ColorPicker({
        name: "labelColor",
        displayNameKey: "Visual_Color",
        value: { value: LegendTextGroup.DefaultLabelColor },
    });

    name: string = "legendText";
    displayName: string = "Text";
    displayNameKey: string = "Visual_Text";
    slices = [this.font, this.labelColor];
}

export class LegendTitleGroup extends Card {
    public static DefaultShowTitle: boolean = false;
    public static DefaultTitleText: string = "";

    public show = new formattingSettings.ToggleSwitch({
        name: "showTitle",
        displayNameKey: "Visual_ShowTitle",
        value: LegendTitleGroup.DefaultShowTitle,
    });

    topLevelSlice = this.show;

    public text = new formattingSettings.TextInput({
        name: "titleText",
        displayNameKey: "Visual_TitleText",
        value: LegendTitleGroup.DefaultTitleText,
        placeholder: "Title text",
    });

    name: string = "legendTitle";
    displayName: string = "Title";
    displayNameKey: string = "Visual_Title";
    slices = [this.text];
}

export class LegendCardSettings extends CompositeCard {
    public defaultShow: boolean = true;

    public name: string = "legend";
    public displayNameKey: string = "Visual_Legend";
    public analyticsPane: boolean = false;

    public show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayNameKey: "Visual_LegendShow",
        value: this.defaultShow,
    });

    public topLevelSlice: formattingSettings.ToggleSwitch = this.show;

    public options: LegendOptionsGroup = new LegendOptionsGroup();
    public text: LegendTextGroup = new LegendTextGroup();
    public title: LegendTitleGroup = new LegendTitleGroup();

    public groups = [this.options, this.text, this.title];
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

    name: string = StreamGraphObjectNames.DataLabel;
    displayName: string = "Data Labels";
    displayNameKey: string = "Visual_DataPointsLabels";
    slices = [this.showValues, this.font, this.color];

    constructor(){
        super();
        this.fontSize.value = 9;
    }
}

export class GraphCurvatureCardSettings extends Card{
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
                type: powerbi.visuals.ValidatorType.Min,
                value: 0,
            },
            maxValue: {
                type: powerbi.visuals.ValidatorType.Max,
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
    general = new GeneralCardSettings();
    categoryAxis = new BaseAxisCardSettings("categoryAxis", "Visual_XAxis");
    valueAxis = new BaseAxisCardSettings("valueAxis", "Visual_YAxis", true);
    legend = new LegendCardSettings();
    dataLabels = new DataLabelsCardSettings();
    graphCurvature = new GraphCurvatureCardSettings();

    cards = [
        this.general,
        this.categoryAxis,
        this.valueAxis,
        this.legend,
        this.dataLabels,
        this.graphCurvature
    ];

    public setLocalizedOptions(localizationManager: ILocalizationManager) {
        this.setLocalizedDisplayName(dataOrderOptions, localizationManager);
        this.setLocalizedDisplayName(dataOffsetOptions, localizationManager);
    }   

    private setLocalizedDisplayName(options: IEnumMemberWithDisplayNameKey[], localizationManager: ILocalizationManager) {
        options.forEach(option => {
            option.displayName = localizationManager.getDisplayName(option.key)
        });
    }
}
