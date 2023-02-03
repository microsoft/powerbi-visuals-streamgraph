import powerbiVisualsApi from "powerbi-visuals-api";
import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import { legendInterfaces } from "powerbi-visuals-utils-chartutils";
import LegendPosition = legendInterfaces.LegendPosition;

import Card = formattingSettings.Card;
import Model = formattingSettings.Model;

import IEnumMember = powerbi.IEnumMember;

class EnableGeneralCardSettings extends Card {
    wiggle = new formattingSettings.ToggleSwitch({
        name: "wiggle",
        displayName: "Enable Wiggle",
        displayNameKey: "Visual_Wiggle",
        value: true,
        topLevelToggle: false
    });

    name: string = "general";
    displayName: string = "General";
    displayNameKey: string = "Visual_General";
    slices = [this.wiggle];
}

class BaseLabelColorCardSetting extends Card{
    labelColor = new formattingSettings.ColorPicker({
        name: "labelColor",
        displayNameKey: "Visual_LabelsFill",
        displayName: "Color",
        value: { value: "#888888" }
        // instanceKind: powerbi.VisualEnumerationInstanceKinds.ConstantOrRule
    });
}

class BaseFontSizeCardSettings extends BaseLabelColorCardSetting{
    fontSize = new formattingSettings.NumUpDown({
        name: "fontSize",
        displayName: "Text Size",
        displayNameKey: "Visual_TextSize",
        value: 12,
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
}

class BaseAxisCardSettings extends BaseFontSizeCardSettings{
    show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayName: "show",
        displayNameKey: "Visual_Show",
        value: true,
        topLevelToggle: true
    });

    showAxisTitle = new formattingSettings.ToggleSwitch({
        name: "showAxisTitle",
        displayNameKey: "Visual_Title",
        displayName: "Title",
        value: true,
        topLevelToggle: false
    });
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

export class EnableCategoryAxisCardSettings extends BaseAxisCardSettings {
    name: string = "categoryAxis";
    displayName: string = "X-Axis";
    displayNameKey: string = "Visual_XAxis";
    slices = [this.show, this.showAxisTitle, this.labelColor, this.fontSize];
}

export class EnableValueAxisCardSettings extends BaseAxisCardSettings {
    name: string = "valueAxis";
    displayName: string = "Y-Axis";
    displayNameKey: string = "Visual_YAxis";
    slices = [this.show, this.showAxisTitle, this.labelColor, this.fontSize];
}

export class EnableLegendCardSettings extends BaseLabelColorCardSetting{
    public static DefaultTitleText: string = "";
    public static DefaultFontSizeInPoints: number = 8;

    show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayName: "show",
        displayNameKey: "Visual_Show",
        value: true,
        topLevelToggle: true
    });

    showAxisTitle = new formattingSettings.ToggleSwitch({
        name: "showTitle",
        displayName: "Title",
        displayNameKey: "Visual_Title",
        value: true,
        topLevelToggle: false
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

    name: string = "legend";
    displayName: string = "Legend";
    displayNameKey: string = "Visual_Legend";
    slices = [this.show, this.positionDropDown, this.showAxisTitle, this.legendName, this.labelColor, this.fontSize];
}

export class EnableDataLabelsCardSettings extends Card{
    show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayName: undefined,
        displayNameKey: "Visual_Show",
        value: false,
        topLevelToggle: true
    });

    showValues = new formattingSettings.ToggleSwitch({
        name: "showValue",
        displayName: "Show Values",
        displayNameKey: "Visual_ShowValues",
        value: false,
        topLevelToggle: false
    });

    color = new formattingSettings.ColorPicker({
        name: "color",
        displayNameKey: "Visual_LabelsFill",
        displayName: "Color",
        value: { value: "#888888" }
    });

    fontSize = new formattingSettings.NumUpDown({
        name: "fontSize",
        displayName: "Text Size",
        displayNameKey: "Visual_TextSize",
        value: 9,
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

    name: string = "labels";
    displayName: string = "Data Labels";
    displayNameKey: string = "Visual_DataPointsLabels";
    slices = [this.show, this.showValues, this.color, this.fontSize];
}

export class StreamGraphSettingsModel extends Model {
    general = new EnableGeneralCardSettings();
    enableCategoryAxisCardSettings = new EnableCategoryAxisCardSettings();
    enableValueAxisCardSettings = new EnableValueAxisCardSettings();
    enableLegendCardSettings = new EnableLegendCardSettings();
    enableDataLabelsCardSettings = new EnableDataLabelsCardSettings();

    cards = [this.general, this.enableCategoryAxisCardSettings, this.enableValueAxisCardSettings, this.enableLegendCardSettings, this.enableDataLabelsCardSettings];
}