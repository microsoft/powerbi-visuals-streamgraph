module powerbi.extensibility.visual.settings {
    export interface StreamGraphSettings {
        legendSettings: StreamGraphLegendSettings;
        categoryAxisSettings: StreamGraphAxisSettings;
        valueAxisSettings: StreamGraphAxisSettings;
        dataLabelsSettings: VisualDataLabelsSettings;
    }

    export interface StreamGraphLegendSettings {
        show: boolean;
        position: string;
        showTitle: boolean;
        labelColor: string;
        titleText: string;
        fontSize: number;
    }

    export interface StreamGraphAxisSettings {
        show: boolean;
        labelColor: string;
        showAxisTitle: boolean;
    }
}
