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
import powerbi from "powerbi-visuals-api";
import DataViewMetadataColumn = powerbi.DataViewMetadataColumn;
import PrimitiveValue = powerbi.PrimitiveValue;

// powerbi.extensibility.utils.interactivity
import { interactivitySelectionService } from "powerbi-visuals-utils-interactivityutils";
import SelectableDataPoint = interactivitySelectionService.SelectableDataPoint;


// powerbi.extensibility.utils.chart
import { legendInterfaces, dataLabelInterfaces } from "powerbi-visuals-utils-chartutils";
import LegendData = legendInterfaces.LegendData;
import IDataLabelInfo = dataLabelInterfaces.IDataLabelInfo;

// powerbi.extensibility.utils.formatting
import { valueFormatter } from "powerbi-visuals-utils-formattingutils";
import IValueFormatter = valueFormatter.IValueFormatter;

import VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;

// d3
import { Series } from "d3-shape";

// powerbi.extensibility.visual
import { StreamGraphSettingsModel } from "./streamGraphSettingsModel";

export interface StreamData {
    metadata: DataViewMetadataColumn;
    series: StreamGraphSeries[];
    stackedSeries: Series<any, any>[];
    legendData: LegendData;
    valueFormatter: IValueFormatter;
    categoryFormatter: IValueFormatter;
    formattingSettings: StreamGraphSettingsModel;
    categoriesText: PrimitiveValue[];
    xMinValue: number;
    xMaxValue: number;
    yMinValue: number;
    yMaxValue: number;
    yAxisValueMaxTextSize: number;
    yAxisValueMaxTextHalfSize: number;
    xAxisValueMaxTextSize: number;
    xAxisValueMaxReservedTextSize: number;
    yAxisFontSize: number;
    yAxisFontHalfSize: number;
    xAxisFontSize: number;
    xAxisFontHalfSize: number;
}

export interface AxisLabelProperties {
    maxTextWidth: number;
    needToRotate: boolean;
    marginBottom: number;
    marginLeft: number;
}

export interface StreamDataPoint extends IDataLabelInfo {
    x: number;
    y: number;
    y0?: number;
    text: string;
    labelFontSize: string;
    value?: number;
    highlight?: boolean;
}

export interface StreamGraphSeries extends SelectableDataPoint {
    color: string;
    dataPoints: StreamDataPoint[];
    tooltipInfo?: VisualTooltipDataItem[];
    highlight?: boolean;
    label: string;
}

export interface StackValue {
    x: number,
    highlight : boolean;
}

// https://github.com/d3/d3-shape#stack
export interface StackedStackValue extends StackValue {
    key: string,
    index: number
}

export interface LabelStyleProperties {
    color: string;
    fontSize: string;
    fontFamily: string;
    fontWeight: string;
    fontStyle: string;
    textDecoration: string;
    showValues: boolean;
}

export interface LabelDataItem {
    x: number;
    y: number;
    text: string;
    value: number | undefined;
    highlight: boolean;
    seriesIndex: number;
    pointIndex: number;
}