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
        value: true,
        topLevelToggle: false
    });

    name: string = "enableWiggle";
    displayName: string = "General";
    slices = [this.wiggle];
}

class BaseLabelColorCardSetting extends Card{
    labelColor = new formattingSettings.ColorPicker({
        name: "labelColor",
        displayName: "Color",
        value: { value: "#888888" },
    });
}

class BaseFontSizeCardSettings extends BaseLabelColorCardSetting{
    fontSize = new formattingSettings.NumUpDown({
        name: "fontSize",
        displayName: "Text Size",
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
        displayName: undefined,
        value: true,
        topLevelToggle: true
    });

    showAxisTitle = new formattingSettings.ToggleSwitch({
        name: "showAxisTitle",
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
    {value : LegendPosition[LegendPosition.TopCenter], displayName : "Top Center"}, 
    {value : LegendPosition[LegendPosition.BottomCenter], displayName : "Bottom Center"}, 
    {value : LegendPosition[LegendPosition.LeftCenter], displayName : "Left Center"}, 
    {value : LegendPosition[LegendPosition.RightCenter], displayName : "Right Center"}, 
]; 

export class EnableCategoryAxisCardSettings extends BaseAxisCardSettings {
    name: string = "enableCategoryAxis";
    displayName: string = "X-Axis";
    slices = [this.show, this.showAxisTitle, this.labelColor, this.fontSize];
}

export class EnableValueAxisCardSettings extends BaseAxisCardSettings {
    name: string = "enableValueAxis";
    displayName: string = "Y-Axis";
    slices = [this.show, this.showAxisTitle, this.labelColor, this.fontSize];
}

export class EnableLegendCardSettings extends BaseLabelColorCardSetting{
    public static DefaultTitleText: string = "";
    public static DefaultFontSizeInPoints: number = 8;

    show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayName: undefined,
        value: true,
        topLevelToggle: true
    });

    showAxisTitle = new formattingSettings.ToggleSwitch({
        name: "showAxisTitle",
        displayName: "Title",
        value: true,
        topLevelToggle: false
    });

    positionDropDown = new formattingSettings.ItemDropdown({
        items: positionOptions,
        value: positionOptions[0],
        displayName: "Position",
        displayNameKey: "Visual_LegendPosition",
        name: "positionDropDown"
    });

    legendName = new formattingSettings.TextInput({
        placeholder: "",
        value: "",
        displayName: "Legend Name",
        displayNameKey: "Visual_LegendName",
        name: "legendName"
    });

    fontSize = new formattingSettings.NumUpDown({
        name: "fontSize",
        displayName: "Text Size",
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

    name: string = "enableLegend";
    displayName: string = "Legend";
    displayNameKey: "Visual_Legend";
    slices = [this.show, this.positionDropDown, this.showAxisTitle, this.legendName, this.labelColor, this.fontSize];
}

export class EnableDataLabelsCardSettings extends BaseLabelColorCardSetting {
    show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayName: undefined,
        value: false,
        topLevelToggle: true
    });

    showValues = new formattingSettings.ToggleSwitch({
        name: "showValues",
        displayName: "Show Values",
        value: false,
        topLevelToggle: false
    });

    fontSize = new formattingSettings.NumUpDown({
        name: "fontSize",
        displayName: "Text Size",
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

    name: string = "enableDataLabels";
    displayName: string = "Data Labels";
    displayNameKey: "Visual_DataPointsLabels";
    slices = [this.show, this.showValues, this.labelColor, this.fontSize];
}

export class StreamGraphSettingsModel extends Model {
    enableWiggle = new EnableGeneralCardSettings();
    enableCategoryAxisCardSettings = new EnableCategoryAxisCardSettings();
    enableValueAxisCardSettings = new EnableValueAxisCardSettings();
    enableLegendCardSettings = new EnableLegendCardSettings();
    enableDataLabelsCardSettings = new EnableDataLabelsCardSettings();

    cards = [this.enableWiggle, this.enableCategoryAxisCardSettings, this.enableValueAxisCardSettings, this.enableLegendCardSettings, this.enableDataLabelsCardSettings];
}