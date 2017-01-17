/*
 *  Power BI Visualizations
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved.
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

module powerbi.extensibility.visual.settings {
    // powerbi.extensibility.utils.chart
    import legendPosition = powerbi.extensibility.utils.chart.legend.position;
    import getDefaultPointLabelSettings = powerbi.extensibility.utils.chart.dataLabel.utils.getDefaultPointLabelSettings;

    // powerbi.extensibility.utils.dataview
    import DataViewObjectsParser = powerbi.extensibility.utils.dataview.DataViewObjectsParser;

    export class GeneralSettings {
        public wiggle: boolean = true;
    }

    export class BaseAxisSettings {
        public static DefaultColor: string = "#777";

        public show: boolean = true;
        public showAxisTitle: boolean = false;
        public labelColor: string = BaseAxisSettings.DefaultColor;
    }

    export class LegendSettings {
        public static DefaultLegendLabelFillColor: string = "#666666";
        public static DefaultFontSizeInPoints: number = 8;

        public static DefaultTitleText: string = "";

        public show: boolean = true;
        public position: string = legendPosition.top;
        public showTitle: boolean = true;
        public titleText: string = LegendSettings.DefaultTitleText;
        public labelColor: string = LegendSettings.DefaultLegendLabelFillColor;
        public fontSize: number = LegendSettings.DefaultFontSizeInPoints;
    }

    export class LabelsSettings {
        public show: boolean;
        public color: string;
        public fontSize: number;

        constructor() {
            const defaultSettings = getDefaultPointLabelSettings();

            this.show = defaultSettings.show;
            this.color = defaultSettings.labelColor;
            this.fontSize = defaultSettings.fontSize;
        }
    }

    export class VisualSettings extends DataViewObjectsParser {
        public general: GeneralSettings = new GeneralSettings();
        public categoryAxis: BaseAxisSettings = new BaseAxisSettings();
        public valueAxis: BaseAxisSettings = new BaseAxisSettings();
        public legend: LegendSettings = new LegendSettings();
        public labels: LabelsSettings = new LabelsSettings();
    }
}
