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
import "./../style/visual.less";

// d3
import "d3-transition";
import { BaseType, Selection, select } from "d3-selection";
import { scaleLinear, ScaleLinear } from "d3-scale";
import { stackOrderNone, stackOrderAscending, stackOrderDescending, stackOrderInsideOut, stackOrderReverse } from "d3-shape";
import { stackOffsetNone, stackOffsetExpand, stackOffsetSilhouette } from "d3-shape";
import { curveCatmullRom, area, stack, Stack, Area, Series } from "d3-shape";
import { min, max, range } from "d3-array";

// powerbi
import powerbi from "powerbi-visuals-api";
import IViewport = powerbi.IViewport;
import PrimitiveValue = powerbi.PrimitiveValue;
import DataViewCategorical = powerbi.DataViewCategorical;
import DataViewCategoryColumn = powerbi.DataViewCategoryColumn;
import DataViewValueColumns = powerbi.DataViewValueColumns;
import DataViewMetadataColumn = powerbi.DataViewMetadataColumn;
import DataView = powerbi.DataView;

// powerbi.extensibility
import ISelectionId = powerbi.extensibility.ISelectionId;
import IVisual = powerbi.extensibility.IVisual;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import ISandboxExtendedColorPalette = powerbi.extensibility.ISandboxExtendedColorPalette;
import ILocalizationManager = powerbi.extensibility.ILocalizationManager;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import IColorPalette = powerbi.extensibility.IColorPalette;
import VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisualEventService = powerbi.extensibility.IVisualEventService;

import { DefaultOpacity, DataOrder, DataOffset } from "./utils";
import { StreamGraphSettingsModel, EnableValueAxisCardSettings, EnableCategoryAxisCardSettings, EnableDataLabelsCardSettings, EnableLegendCardSettings, EnableGeneralCardSettings } from "./streamGraphSettingsModel";
import { BehaviorOptions, StreamGraphBehavior } from "./behavior";
import { createTooltipInfo } from "./tooltipBuilder";
import { StreamData, StreamGraphSeries, StreamDataPoint, StackValue, StackedStackValue } from "./dataInterfaces";


// powerbi.extensibility.utils.svg
import { IMargin, manipulation, CssConstants } from "powerbi-visuals-utils-svgutils";
import translate = manipulation.translate;
import ClassAndSelector = CssConstants.ClassAndSelector;
import createClassAndSelector = CssConstants.createClassAndSelector;

// powerbi.extensibility.utils.color
import { ColorHelper } from "powerbi-visuals-utils-colorutils";

// powerbi.extensibility.utils.interactivity
import { interactivitySelectionService, interactivityBaseService } from "powerbi-visuals-utils-interactivityutils";
import appendClearCatcher = interactivityBaseService.appendClearCatcher;
import IInteractivityService = interactivityBaseService.IInteractivityService;
import IInteractiveBehavior = interactivityBaseService.IInteractiveBehavior;
import createInteractivitySelectionService = interactivitySelectionService.createInteractivitySelectionService;

// powerbi.extensibility.utils.chart
import { legendInterfaces, axis, legend, dataLabelUtils, dataLabelInterfaces, axisInterfaces } from "powerbi-visuals-utils-chartutils";
import ILegend = legendInterfaces.ILegend;
import LegendData = legendInterfaces.LegendData;
import createLegend = legend.createLegend;
import LegendPosition = legendInterfaces.LegendPosition;
import AxisHelper = axis;
import ILabelLayout = dataLabelInterfaces.ILabelLayout;
import IAxisProperties = axisInterfaces.IAxisProperties;
import LegendDataPoint = legendInterfaces.LegendDataPoint;
import { positionChartArea } from "powerbi-visuals-utils-chartutils/lib/legend/legend";
import { CreateAxisOptions } from "powerbi-visuals-utils-chartutils/lib/axis/axisInterfaces";

// powerbi.extensibility.utils.formatting
import { valueFormatter, textMeasurementService } from "powerbi-visuals-utils-formattingutils";
import { TextProperties } from "powerbi-visuals-utils-formattingutils/lib/src/interfaces";
import IValueFormatter = valueFormatter.IValueFormatter;

// powerbi.extensibility.utils.type
import { pixelConverter as PixelConverter } from "powerbi-visuals-utils-typeutils";
import { ValueType } from "powerbi-visuals-utils-typeutils/lib/valueType";

// powerbi.extensibility.utils.tooltip
import { ITooltipServiceWrapper, createTooltipServiceWrapper } from "powerbi-visuals-utils-tooltiputils";

// powerbi.extensibility.utils.formattingModel
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import ISelectionManager = powerbi.extensibility.ISelectionManager;

const ColumnDisplayName: string = "Visual_Column";

export enum VisualUpdateType {
    Data = 2,
    Resize = 4,
    ViewMode = 8,
    Style = 16,
    ResizeEnd = 32,
    All = 62,
}

export class StreamGraph implements IVisual {
    private static VisualClassName = "streamGraph";
    private static AnimationDuration: number = 0;
    private static MinViewport: IViewport = {
        width: 150,
        height: 100
    };
    private static MinInternalViewport: IViewport = {
        width: 0,
        height: 0
    };
    private static ValuesFormat: string = "g";
    private static DefaultValue: number = 0;
    private static TickHeight: number = 6;
    private static EmptyDisplayName: string = "";
    private static MinLabelSize: number = 0;
    private static MiddleOfTheLabel: number = 2;

    private static DefaultDataLabelsOffset: number = 4;
    // Axis
    private static Axes: ClassAndSelector = createClassAndSelector("axes");
    private static Axis: ClassAndSelector = createClassAndSelector("axis");
    private static YAxis: ClassAndSelector = createClassAndSelector("yAxis");
    private static XAxis: ClassAndSelector = createClassAndSelector("xAxis");
    private static axisGraphicsContext: ClassAndSelector = createClassAndSelector("axisGraphicsContext");
    private axes: Selection<BaseType, any, any, any>;
    private axisX: Selection<BaseType, any, any, any>;
    private axisY: Selection<BaseType, any, any, any>;
    private xAxisProperties: IAxisProperties;
    private yAxisProperties: IAxisProperties;
    private static XAxisOnSize: number = 20;
    private static XAxisOffSize: number = 10;
    private static YAxisOnSize: number = 25;
    private static YAxisOffSize: number = 30;
    private static XAxisLabelSize: number = 20;
    private static YAxisLabelSize: number = 20;
    private static AxisLabelMiddle: number = 2;
    private static AxisTextNodeTextAnchorForAngel0: string = "middle";
    private static AxisTextNodeDXForAngel0: string = "0em";
    private static AxisTextNodeDYForAngel0: string = "1em";
    private static YAxisLabelAngle: string = "rotate(-90)";
    private static YAxisLabelDy: number = 30;
    private static XAxisLabelDy: string = "-0.5em";
    private static curvatureValue = 0.5;
    private margin: IMargin = {
        left: StreamGraph.YAxisOnSize,
        right: -20,
        bottom: StreamGraph.XAxisOnSize,
        top: 0
    };
    private static isLocalizedLegendOrientationDropdown: boolean = false;
    private static isLocalizedDataOrderDropdown: boolean = false;
    private static isLocalizedDataOffsetDropdown: boolean = false;

    private events: IVisualEventService;

    private static XAxisLabelSelector: ClassAndSelector = createClassAndSelector("xAxisLabel");
    private static YAxisLabelSelector: ClassAndSelector = createClassAndSelector("yAxisLabel");

    private static DataPointsContainer = "dataPointsContainer";
    private static DefaultFontFamily: string = "helvetica, arial, sans-serif";
    private static DefaultFontWeight: string = "normal";
    private static LayerSelector: ClassAndSelector = createClassAndSelector("layer");

    private visualHost: IVisualHost;

    private legend: ILegend;
    private data: StreamData;
    private dataView: DataView;
    private viewport: IViewport;
    private colorPalette: ISandboxExtendedColorPalette;
    private behavior: IInteractiveBehavior;
    private interactivityService: IInteractivityService<StreamGraphSeries>;

    private tooltipServiceWrapper: ITooltipServiceWrapper;
    private svg: Selection<BaseType, any, any, any>;
    private clearCatcher: Selection<BaseType, StreamGraphSeries, any, any>;
    private dataPointsContainer: Selection<BaseType, StreamGraphSeries, any, any>;

    private localizationManager: ILocalizationManager;
    private selectionManager: ISelectionManager;

    private static formattingSettingsService: FormattingSettingsService;
    private static formattingSettings: StreamGraphSettingsModel;

    constructor(options: VisualConstructorOptions) {
        this.events = options.host.eventService;
        this.init(options);
    }

    private static getViewport(viewport: IViewport): IViewport {
        return {
            width: Math.max(
                StreamGraph.MinViewport.width,
                viewport.width),
            height: Math.max(
                StreamGraph.MinViewport.height,
                viewport.height)
        };
    }

    public static isNumber(value: PrimitiveValue): boolean {
        return !isNaN(value as number) && isFinite(value as number) && value !== null;
    }

    public static removeDisabledFormattingSettings(formattingSettings : StreamGraphSettingsModel) : void {
        //X-Axis
        if(!formattingSettings.enableCategoryAxisCardSettings.show.value) {
            formattingSettings.enableCategoryAxisCardSettings.slices = formattingSettings.enableCategoryAxisCardSettings.slices.filter(x => x.name !== "labelColor" && x.name !== "labelFont");
        }
        if(!formattingSettings.enableCategoryAxisCardSettings.showAxisTitle.value) {
            formattingSettings.enableCategoryAxisCardSettings.slices = formattingSettings.enableCategoryAxisCardSettings.slices.filter(x => x.name !== "titleColor");
        }

        //Y-Axis
        if(!formattingSettings.enableValueAxisCardSettings.show.value) {
            formattingSettings.enableValueAxisCardSettings.slices = formattingSettings.enableValueAxisCardSettings.slices.filter(x => x.name !== "highPrecision" && x.name !== "labelFont" && x.name !== "labelColor");
        }
        if(!formattingSettings.enableValueAxisCardSettings.showAxisTitle.value) {
            formattingSettings.enableValueAxisCardSettings.slices = formattingSettings.enableValueAxisCardSettings.slices.filter(x => x.name !== "titleColor");
        }
    }

    /* eslint-disable-next-line max-lines-per-function */
    public static converter(
        dataView: DataView,
        colorPalette: IColorPalette,
        interactivityService: IInteractivityService<StreamGraphSeries>,
        visualHost: IVisualHost,
    ): StreamData {

        if (!dataView
            || !dataView.categorical
            || !dataView.categorical.values
            || !dataView.categorical.categories
            || !colorPalette) {
            return null;
        }

        let xMaxValue: number = -Number.MAX_VALUE;
        let xLongestText : string = ""; //will contain the longest text in X Axis, used to calculate right margin offsets
        let xMinValue: number = Number.MAX_VALUE;
        let yMaxValue: number = -Number.MAX_VALUE;
        let yMinValue: number = Number.MAX_VALUE;

        const categorical: DataViewCategorical = dataView.categorical,
            categories: DataViewCategoryColumn[] = categorical.categories,
            values: DataViewValueColumns = categorical.values,
            series: StreamGraphSeries[] = [],
            legendData: LegendData = {
                dataPoints: [],
                title: values.source
                    ? values.source.displayName
                    : EnableLegendCardSettings.DefaultTitleText,
            };
        let value: number = 0;

        const category: DataViewCategoryColumn = categories && categories.length > 0
            ? categories[0]
            : null;

        const colorHelper: ColorHelper = new ColorHelper(colorPalette);

        this.formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(StreamGraphSettingsModel, dataView);
        this.removeDisabledFormattingSettings(this.formattingSettings);
        const formattingSettings = this.formattingSettings;
        const fontSizeInPx: string = PixelConverter.fromPoint(formattingSettings.enableDataLabelsCardSettings.fontSize.value);

        const stackValues: StackValue[] = [];

        for (let valueIndex: number = 0; valueIndex < values.length; valueIndex++) {
            let label: string = values[valueIndex].source.groupName as string,
                identity: ISelectionId = null,
                hasHighlights: boolean = !!(values.length > 0 && values[valueIndex].highlights);
            
            if(hasHighlights)
            {
                for(let idx = 0; idx < values[valueIndex].highlights.length; idx++)
                {
                    hasHighlights ||= !!(values[valueIndex].highlights[idx]);
                }
            }

            if (visualHost) {
                const categoryColumn: DataViewCategoryColumn = {
                    source: values[valueIndex].source,
                    values: null,
                    identity: [values[valueIndex].identity]
                };

                identity = visualHost.createSelectionIdBuilder()
                    .withCategory(categoryColumn, 0)
                    .withMeasure(values[valueIndex].source.queryName)
                    .createSelectionId();
            }

            const tooltipInfo: VisualTooltipDataItem[] = createTooltipInfo(
                dataView,
                { categories: null, values: values },
                visualHost.createLocalizationManager(),
                valueIndex
            );

            if (!label) {
                if (tooltipInfo
                    && tooltipInfo[0]
                    && tooltipInfo[0].value) {
                    label = tooltipInfo[0].value;
                } else {
                    label = values[valueIndex].source.displayName;
                }
            }

            const color: string = colorHelper.getHighContrastColor(
                "foreground",
                colorPalette.getColor(valueIndex.toString()).value,
            );

            if (label) {
                legendData.dataPoints.push({
                    color,
                    label,
                    identity,
                    selected: false
                });
            }

            series[valueIndex] = {
                color,
                identity,
                tooltipInfo,
                dataPoints: [],
                highlight: hasHighlights,
                selected: false,
                label
            };

            const dataPointsValues: PrimitiveValue[] = values[valueIndex].values;

            if (dataPointsValues.length === 0) {
                continue;
            }

            for (let dataPointValueIndex: number = 0; dataPointValueIndex < dataPointsValues.length; dataPointValueIndex++) {
                const y: number = dataPointsValues[dataPointValueIndex] as number;

                if (y > value) {
                    value = y;
                }
                const streamDataPoint: StreamDataPoint = {
                    x: dataPointValueIndex,
                    y: StreamGraph.isNumber(y)
                        ? y
                        : StreamGraph.DefaultValue,
                    text: label,
                    labelFontSize: fontSizeInPx,
                    highlight: hasHighlights && values[valueIndex].highlights && values[valueIndex].highlights[dataPointValueIndex] !== null
                };

                series[valueIndex].dataPoints.push(streamDataPoint);

                /* Adding values for d3.stack V5 */

                if (!stackValues[dataPointValueIndex]) {
                    stackValues[dataPointValueIndex] = {
                        x: streamDataPoint.x,
                        highlight : false
                    };
                }
                stackValues[dataPointValueIndex][label] = streamDataPoint.y;

                if (!stackValues[dataPointValueIndex].highlight) {
                    stackValues[dataPointValueIndex].highlight = streamDataPoint.highlight ? true : false;
                }

                if(streamDataPoint.text.length > xLongestText.length)
                {
                    xLongestText = streamDataPoint.text;
                }
                if (streamDataPoint.x > xMaxValue) {
                    xMaxValue = streamDataPoint.x;
                }
                if (streamDataPoint.x < xMinValue) {
                    xMinValue = streamDataPoint.x;
                }
                if (streamDataPoint.y > yMaxValue) {
                    yMaxValue = streamDataPoint.y;
                }
                if (streamDataPoint.y < yMinValue) {
                    yMinValue = streamDataPoint.y;
                }
            }
        }

        const arrayOfYs = [];
        for (let valueIndex: number = 0; valueIndex < values.length; valueIndex++) {
            const dataPointsValues: PrimitiveValue[] = values[valueIndex].values;

            for (let dataPointValueIndex: number = 0; dataPointValueIndex < dataPointsValues.length; dataPointValueIndex++) {
                let y: number = dataPointsValues[dataPointValueIndex] as number;

                if (y > value) {
                    value = y;
                }
                y = StreamGraph.isNumber(y)
                        ? y
                        : StreamGraph.DefaultValue;

                if(arrayOfYs.length <= dataPointValueIndex)
                    arrayOfYs.push(y)
                else
                    arrayOfYs[dataPointValueIndex] += y;
            }
        }
        for(let idx = 0; idx < arrayOfYs.length; idx++)
        {
            if (arrayOfYs[idx] > yMaxValue) {
                yMaxValue = arrayOfYs[idx];
            }
        }

        if (interactivityService) {
            interactivityService.applySelectionStateToData(series);
        }

        const valuesFormatter : IValueFormatter = valueFormatter.create({
            format: StreamGraph.ValuesFormat,
            value: value
        });

        const categoryFormatter: IValueFormatter = valueFormatter.create({
            format: valueFormatter.getFormatStringByColumn(category.source),
            value: category.values
        });
        const metadata: DataViewMetadataColumn = category.source;

        const categoriesText: PrimitiveValue[] = category.values;
        if (categoriesText.length) {
            if (metadata.type.dateTime && categoriesText[0] instanceof Date) {
                xMinValue = (<Date>categoriesText[0]).getTime();
                xMaxValue = (<Date>categoriesText[categoriesText.length - 1]).getTime();
                xLongestText = xMaxValue.toString();
            } else if (metadata.type.numeric) {
                xMinValue = categoriesText[0] as number;
                xMaxValue = categoriesText[categoriesText.length - 1] as number;
                xLongestText = xMaxValue.toString();
            } else {
                xMinValue = 0;
                xMaxValue = categoriesText.length - 1;
                for(let idx = 0; idx < categoriesText.length; idx ++)
                {
                    if((<string>categoriesText[idx]).length > xLongestText.length)
                    xLongestText = (<string>categoriesText[idx]);
                }
            }
        }

        const textProperties: TextProperties = {
            text: xLongestText,
            fontFamily: "sans-serif",
            fontSize: PixelConverter.toString(formattingSettings.enableCategoryAxisCardSettings.labelFont.fontSize.value)
        };
        const xAxisValueMaxTextSize: number = textMeasurementService.measureSvgTextWidth(textProperties);
        const xAxisValueMaxReservedTextSize: number = xAxisValueMaxTextSize * 1.15; //reserve additional space
        const textPropertiesY: TextProperties = {
            text: yMaxValue.toString(),
            fontFamily: "sans-serif",
            fontSize: PixelConverter.toString(formattingSettings.enableValueAxisCardSettings.labelFont.fontSize.value)
        };
        const yAxisValueMaxTextSize: number = textMeasurementService.measureSvgTextWidth(textPropertiesY);
        const yAxisValueMaxTextHalfSize: number = yAxisValueMaxTextSize / 2;
        const yAxisFontSize: number = +formattingSettings.enableValueAxisCardSettings.labelFont.fontSize.value;
        const yAxisFontHalfSize: number = yAxisFontSize / 2;
        const xAxisFontSize: number = +formattingSettings.enableCategoryAxisCardSettings.labelFont.fontSize.value;
        const xAxisFontHalfSize: number = xAxisFontSize / 2;

        StreamGraph.YAxisLabelSize = formattingSettings.enableValueAxisCardSettings.labelFont.fontSize.value;
        StreamGraph.XAxisLabelSize = formattingSettings.enableCategoryAxisCardSettings.labelFont.fontSize.value;

        /* Generate stack values for d3.stack V5 */
        const allLabels = legendData.dataPoints.map((dataPoint) => dataPoint.label);

        let stackVar: Stack<any, any, any> = stack()
            .keys(allLabels)
            .offset(stackOffsetNone);
        
        switch(formattingSettings.general.dataOrderDropDown.value.value){
            default:
            case DataOrder[DataOrder.None]:
                stackVar = stackVar.order(stackOrderNone);
                break;
            case DataOrder[DataOrder.Ascending]:
                stackVar = stackVar.order(stackOrderAscending);
                break;
            case DataOrder[DataOrder.Descending]:
                stackVar = stackVar.order(stackOrderDescending);
                break;
            case DataOrder[DataOrder.InsideOut]:
                stackVar = stackVar.order(stackOrderInsideOut);
                break;
            case DataOrder[DataOrder.Reverse]:
                stackVar = stackVar.order(stackOrderReverse);
                break;
        }

        if (formattingSettings.general.wiggle.value) {
            switch(formattingSettings.general.dataOffsetDropDown.value.value){
                default:
                case DataOffset[DataOffset.Silhouette]:
                    stackVar.offset(stackOffsetSilhouette);
                    break;
                case DataOffset[DataOffset.Expand]:
                    stackVar.offset(stackOffsetExpand);
                    yMaxValue = 1;
                    break;
            }
        }

        /* Adding values for d3.stack V5 */
        const stackedSeries = stackVar(stackValues);

        return {
            series,
            stackedSeries,
            metadata,
            formattingSettings,
            legendData,
            categoriesText,
            categoryFormatter,
            valueFormatter: valuesFormatter,
            yMaxValue,
            yMinValue,
            xMinValue,
            xMaxValue,
            yAxisValueMaxTextSize,
            yAxisValueMaxTextHalfSize,
            xAxisValueMaxTextSize,
            xAxisValueMaxReservedTextSize,
            yAxisFontSize,
            yAxisFontHalfSize,
            xAxisFontSize,
            xAxisFontHalfSize
        };
    }

    public init(options: VisualConstructorOptions): void {
        select("html").style(
            "-webkit-tap-highlight-color", "transparent" // Turns off the blue highlighting at mobile browsers
        );

        this.visualHost = options.host;
        this.colorPalette = options.host.colorPalette;
        this.localizationManager = options.host.createLocalizationManager();
        this.selectionManager = options.host.createSelectionManager();
        StreamGraph.formattingSettingsService = new FormattingSettingsService(this.localizationManager);

        const element: HTMLElement = options.element;

        this.tooltipServiceWrapper = createTooltipServiceWrapper(
            this.visualHost.tooltipService,
            element);

        this.svg = select(element)
            .append("svg")
            .classed(StreamGraph.VisualClassName, true);

        this.handleContextMenu();

        this.clearCatcher = appendClearCatcher(this.svg);

        this.dataPointsContainer = this.svg
            .insert("g")
            .classed(StreamGraph.DataPointsContainer, true);

        this.axes = this.svg
            .append("g")
            .classed(StreamGraph.Axes.className, true)
            .classed(StreamGraph.axisGraphicsContext.className, true);
        this.axisX = this.axes
            .append("g")
            .classed(StreamGraph.Axis.className, true)
            .classed(StreamGraph.XAxis.className, true);

        this.axisY = this.axes
            .append("g")
            .classed(StreamGraph.Axis.className, true)
            .classed(StreamGraph.YAxis.className, true);

        this.behavior = new StreamGraphBehavior();

        this.interactivityService = createInteractivitySelectionService(this.visualHost);

        this.legend = createLegend(
            element,
            false,
            this.interactivityService,
            true
        );
    }

    public update(options: VisualUpdateOptions): void {
        this.events.renderingStarted(options);

        if (!options
            || !options.dataViews
            || !options.dataViews[0]
            || !options.dataViews[0].categorical
        ) {
            this.clearData();
            this.events.renderingFinished(options);
            return;
        }

        this.viewport = StreamGraph.getViewport(options.viewport);
        this.dataView = options.dataViews[0];

        
        this.data = StreamGraph.converter(
            this.dataView,
            this.colorPalette,
            this.interactivityService,
            this.visualHost,
        );

        if (!this.data
            || !this.data.series
            || !this.data.series.length
        ) {
            this.clearData();
            this.events.renderingFinished(options);
            return;
        }

        this.localizeFormattingPanes(this.data);
        this.renderLegend(this.data);
        this.updateViewport();

        this.svg.attr("width", PixelConverter.toString(this.viewport.width));
        this.svg.attr("height", PixelConverter.toString(this.viewport.height));

        const values: DataViewValueColumns = this.dataView.categorical.values;
        const hasHighlights: boolean = !!(values.length > 0 && values[0].highlights);

        const selection: Selection<BaseType, StackedStackValue, any, any> = this.renderChart(
            this.data.series,
            this.data.stackedSeries,
            StreamGraph.AnimationDuration,
            hasHighlights
        );

        this.calculateAxes();

        this.tooltipServiceWrapper.addTooltip(
            selection,
            (tooltipEvent: any) => {
                const index: number = tooltipEvent.index;
                return this.data.series[index].tooltipInfo;
            },
            (tooltipEvent: any) => {
                const index: number = tooltipEvent.index;
                return this.data.series[index].identity;
            });

        const interactivityService: IInteractivityService<StreamGraphSeries> = this.interactivityService;

        if (interactivityService) {
            const behaviorOptions: BehaviorOptions = {
                selection,
                interactivityService,
                behavior: this.behavior,
                series: this.data.series,
                clearCatcher: this.clearCatcher,
                dataPoints: this.data.series,
                interactivityServiceOptions: {
                    overrideSelectionFromData: true
                }
            };

            interactivityService.bind(
                behaviorOptions
            );

            this.behavior.renderSelection(interactivityService.hasSelection());
        }
        this.events.renderingFinished(options);
    }

    private setTextNodesPosition(xAxisTextNodes: Selection<BaseType, any, any, any>,
        textAnchor: string,
        dx: string,
        dy: string): void {

        xAxisTextNodes
            .style("text-anchor", textAnchor)
            .attr("dx", dx)
            .attr("dy", dy);
    }

    private toggleAxisVisibility(
        isShown: boolean,
        className: string,
        axis: Selection<BaseType, any, any, any>): void {

        axis.classed(className, isShown);
        if (!isShown) {
            axis
                .selectAll("*")
                .remove();
        }
    }

    private static outerPadding: number = 0;

    private static applyWordBreak(
        text: Selection<any, StreamDataPoint, any, any>,
        axisProperties: IAxisProperties,
        maxHeight: number,
        dy : string): void {

        text.each(function () {
            const allowedLength: number = axisProperties.xLabelMaxWidth;

            textMeasurementService.wordBreak(
                this as Element,
                allowedLength,
                axisProperties.willLabelsWordBreak
                    ? maxHeight
                    : 0);
            (this as Element).setAttribute("y", dy);
        });
    }
    private hideFirstAndLastTickXAxis()
    {
        const xAxisLineNodes: Selection<BaseType, any, any, any> = this.axisX.selectAll("line");
        const xAxisLineNodesArray: BaseType[] = xAxisLineNodes.nodes();

        // This is done to make sure first and last tick always transparent (there are cases when they are not alligned with start and end of axis)
        if(xAxisLineNodesArray.length > 2)
        {
            for(let idx = 0; idx < xAxisLineNodesArray.length; idx++ )
            {
                (xAxisLineNodesArray[idx] as Element).setAttribute("opacity", "100");
            }
            (xAxisLineNodesArray[0] as Element).setAttribute("opacity", "0");
            (xAxisLineNodesArray[xAxisLineNodesArray.length - 1] as Element).setAttribute("opacity", "0");
        }
    }
    private setColorFontXAxis(xAxisTextNodes: Selection<BaseType, any, any, any>)
    {
        const categoryAxisLabelColor: string = this.data.formattingSettings.enableCategoryAxisCardSettings.labelColor.value.value,
            categoryAxisFontSize : string = this.data.formattingSettings.enableCategoryAxisCardSettings.labelFont.fontSize.value.toString(),
            categoryAxisFontFamily : string = this.data.formattingSettings.enableCategoryAxisCardSettings.labelFont.fontFamily.value;

        const categoryAxisFontIsBold : boolean = this.data.formattingSettings.enableCategoryAxisCardSettings.labelFont.bold.value,
            categoryAxisFontIsItalic : boolean = this.data.formattingSettings.enableCategoryAxisCardSettings.labelFont.italic.value,
            categoryAxisFontIsUnderlined : boolean = this.data.formattingSettings.enableCategoryAxisCardSettings.labelFont.underline.value;

        const xAxisTextNodesArray: BaseType[] = xAxisTextNodes.nodes();

        for(let idx = 0; idx < xAxisTextNodesArray.length; idx++ )
        {
            if(xAxisTextNodesArray[idx])
            {
                (xAxisTextNodesArray[idx] as Element)
                    .setAttribute("fill", categoryAxisLabelColor);
                (xAxisTextNodesArray[idx] as Element)
                    .setAttribute("stroke", categoryAxisLabelColor);
                (xAxisTextNodesArray[idx] as Element)
                    .setAttribute("font-size", categoryAxisFontSize);
                (xAxisTextNodesArray[idx] as Element)
                    .setAttribute("font-family", categoryAxisFontFamily);
                (xAxisTextNodesArray[idx] as Element)
                    .setAttribute("font-weight", categoryAxisFontIsBold ? "bold" : "normal");
                (xAxisTextNodesArray[idx] as Element)
                    .setAttribute("font-style", categoryAxisFontIsItalic ? "italic" : "normal");
                (xAxisTextNodesArray[idx] as Element)
                    .setAttribute("text-decoration", categoryAxisFontIsUnderlined ? "underline" : "normal");
            }
        }
    }
    private setColorFontYAxis(yAxisTextNodes: Selection<BaseType, any, any, any>)
    {
        const valueAxisLabelColor: string = this.data.formattingSettings.enableValueAxisCardSettings.labelColor.value.value,
            valueAxisFontSize : string = this.data.formattingSettings.enableValueAxisCardSettings.labelFont.fontSize.value.toString(),
            valueAxisFontFamily : string = this.data.formattingSettings.enableValueAxisCardSettings.labelFont.fontFamily.value;

        const valueAxisFontIsBold : boolean = this.data.formattingSettings.enableValueAxisCardSettings.labelFont.bold.value,
            valueAxisFontIsItalic : boolean = this.data.formattingSettings.enableValueAxisCardSettings.labelFont.italic.value,
            valueAxisFontIsUnderlined : boolean = this.data.formattingSettings.enableValueAxisCardSettings.labelFont.underline.value;


        const yAxisTextNodesArray : BaseType[] = yAxisTextNodes.nodes();

        for(let idx = 0; idx < yAxisTextNodesArray.length; idx++ )
        {
            if(yAxisTextNodesArray[idx])
            {
                (yAxisTextNodesArray[idx] as Element)
                    .setAttribute("fill", valueAxisLabelColor);
                (yAxisTextNodesArray[idx] as Element)
                    .setAttribute("stroke", valueAxisLabelColor);
                (yAxisTextNodesArray[idx] as Element)
                    .setAttribute("font-size", valueAxisFontSize);
                (yAxisTextNodesArray[idx] as Element)
                    .setAttribute("font-family", valueAxisFontFamily);
                (yAxisTextNodesArray[idx] as Element)
                    .setAttribute("font-weight", valueAxisFontIsBold ? "bold" : "normal");
                (yAxisTextNodesArray[idx] as Element)
                    .setAttribute("font-style", valueAxisFontIsItalic ? "italic" : "normal");
                (yAxisTextNodesArray[idx] as Element)
                    .setAttribute("text-decoration", valueAxisFontIsUnderlined ? "underline" : "normal");
            }
        }
    }
    private calculateAxes() {
        const showAxisTitle: boolean = this.data.formattingSettings.enableCategoryAxisCardSettings.showAxisTitle.value,
            xShow: boolean = this.data.formattingSettings.enableCategoryAxisCardSettings.show.value,

            yShow: boolean = this.data.formattingSettings.enableValueAxisCardSettings.show.value;

        this.viewport.height -= StreamGraph.TickHeight + (showAxisTitle ? StreamGraph.XAxisLabelSize : 0);
        const effectiveWidth: number = Math.max(0, this.viewport.width - this.margin.left - (this.margin.right + this.data.xAxisValueMaxReservedTextSize));
        const effectiveHeight: number = Math.max(0, this.viewport.height - (this.margin.top + this.data.yAxisFontHalfSize) - this.margin.bottom + (showAxisTitle ? StreamGraph.XAxisLabelSize : 0));
        const metaDataColumnPercent: powerbi.DataViewMetadataColumn = {
            displayName: this.localizationManager.getDisplayName(ColumnDisplayName),
            type: ValueType.fromDescriptor({ numeric: true }),
            objects: {
                general: {
                    formatString: "0 %",
                }
            }
        };

        //This is done beacuse d3.range() provided wrong range when parameter was huge number.
        let dataDomainVals : number[];
        let isScalarVal : boolean;
        if(this.data.metadata.type.dateTime){
            dataDomainVals = [this.data.xMinValue, this.data.xMaxValue];
            isScalarVal = true;
        }
        else {
            dataDomainVals = range(this.data.xMaxValue + 1);
            isScalarVal = false;
        }

        if (xShow) {
            const axisOptions: CreateAxisOptions = {
                pixelSpan: effectiveWidth,
                dataDomain: dataDomainVals,
                metaDataColumn: this.data.metadata,
                outerPadding: StreamGraph.outerPadding,
                innerPadding: 0,
                formatString: null,
                isScalar: isScalarVal,
                isVertical: false,
                useRangePoints: true, //will use scalePoint instead of scaleBand (https://d3-graph-gallery.com/graph/custom_axis.html)
                // todo fix types issue
                getValueFn: (value, dataType): any => {
                    if (dataType.dateTime) {
                        return new Date(value);
                    } else if (dataType.text) {
                        return this.data.categoriesText[value];
                    }
                    return value;
                }
            };

            this.xAxisProperties = AxisHelper.createAxis(axisOptions);

            this.axisX.call(this.xAxisProperties.axis);

            this.hideFirstAndLastTickXAxis();
            
            const xAxisTextNodes: Selection<BaseType, any, any, any> = this.axisX.selectAll("text");
            
            this.setColorFontXAxis(xAxisTextNodes);

            this.setTextNodesPosition(xAxisTextNodes, 
                StreamGraph.AxisTextNodeTextAnchorForAngel0, 
                StreamGraph.AxisTextNodeDXForAngel0,
                StreamGraph.AxisTextNodeDYForAngel0);

            StreamGraph.applyWordBreak(xAxisTextNodes, this.xAxisProperties, StreamGraph.XAxisLabelSize, this.data.formattingSettings.enableCategoryAxisCardSettings.labelFont.fontSize.value.toString());
        }

        if (yShow) {
            this.yAxisProperties = AxisHelper.createAxis({
                pixelSpan: effectiveHeight,
                dataDomain: [Math.min(this.data.yMinValue, 0), this.data.yMaxValue],
                metaDataColumn: metaDataColumnPercent,
                formatString: null,
                outerPadding: StreamGraph.outerPadding,
                isCategoryAxis: false,
                isScalar: true,
                isVertical: true,
                useTickIntervalForDisplayUnits: true,
                disableNice : this.data.formattingSettings.enableValueAxisCardSettings.highPrecision.value
            });

            this.axisY.call(this.yAxisProperties.axis);

            const yAxisTextNodes: Selection<BaseType, any, any, any> = this.axisY.selectAll("text");

            this.setColorFontYAxis(yAxisTextNodes);
        }

        this.renderXAxisLabels();
        this.renderYAxisLabels();

        this.axes.attr("transform", translate(this.margin.left, 0));
        this.axisX.attr("transform", translate(0, this.viewport.height - this.margin.bottom));
        this.axisY.attr("transform", translate(0, (this.margin.top + this.data.yAxisFontHalfSize)));

        this.toggleAxisVisibility(xShow, StreamGraph.XAxis.className, this.axisX);
        this.toggleAxisVisibility(yShow, StreamGraph.YAxis.className, this.axisY);
    }

    private renderYAxisLabels(): void {
        this.axes
            .selectAll(StreamGraph.YAxisLabelSelector.selectorName)
            .remove();
        const valueAxisSettings: EnableValueAxisCardSettings = this.data.formattingSettings.enableValueAxisCardSettings;
        const isYAxisOn : boolean = valueAxisSettings.show.value;
        this.margin.left = isYAxisOn
            ? StreamGraph.YAxisOnSize + this.data.yAxisValueMaxTextSize
            : StreamGraph.YAxisOffSize;

        if (valueAxisSettings.showAxisTitle.value) {
            this.margin.left += StreamGraph.YAxisLabelSize;

            const categoryAxisSettings: EnableCategoryAxisCardSettings = this.data.formattingSettings.enableCategoryAxisCardSettings,
                isXAxisOn: boolean = categoryAxisSettings.show.value,
                isXTitleOn: boolean = categoryAxisSettings.showAxisTitle.value,
                marginTop: number = (this.margin.top + this.data.yAxisFontHalfSize),
                height: number = this.viewport.height
                    - marginTop
                    - (isXAxisOn
                        ? StreamGraph.XAxisOnSize + this.data.xAxisFontSize
                        : StreamGraph.XAxisOffSize)
                    - (isXTitleOn
                        ? StreamGraph.XAxisLabelSize
                        : StreamGraph.MinLabelSize),
                values = this.dataView.categorical.values;

            let yAxisText: string = values.source
                ? values.source.displayName
                : StreamGraph.getYAxisTitleFromValues(values);

            const textSettings: TextProperties = StreamGraph.getTextPropertiesFunction(yAxisText);
            yAxisText = textMeasurementService.getTailoredTextOrDefault(textSettings, height);
            const yAxisLabel: Selection<BaseType, any, any, any> = this.axes.append("text")
                .style("font-family", textSettings.fontFamily)
                .style("font-size", textSettings.fontSize)
                .style("font-style", textSettings.fontStyle)
                .style("font-weight", textSettings.fontWeight)
                .attr("transform", StreamGraph.YAxisLabelAngle)
                .attr("fill", valueAxisSettings.titleColor.value.value)
                .attr("x", -(marginTop + (height / StreamGraph.AxisLabelMiddle)))
                .attr("y", PixelConverter.fromPoint(-(this.margin.left - StreamGraph.YAxisLabelDy)))
                .classed(StreamGraph.YAxisLabelSelector.className, true)
                .text(yAxisText);

            yAxisLabel.call(
                AxisHelper.LabelLayoutStrategy.clip,
                height,
                textMeasurementService.svgEllipsis);
        }
    }

    private static getYAxisTitleFromValues(values: DataViewValueColumns): string {
        const valuesMetadataArray: DataViewMetadataColumn[] = [];

        for (let valueIndex: number = 0; valueIndex < values.length; valueIndex++) {
            if (values[valueIndex]
                && values[valueIndex].source
                && values[valueIndex].source.displayName) {

                valuesMetadataArray.push({
                    displayName: values[valueIndex].source.displayName
                });
            }
        }

        const valuesNames: string[] = valuesMetadataArray
            .map((metadata: DataViewMetadataColumn) => {
                return metadata
                    ? metadata.displayName
                    : StreamGraph.EmptyDisplayName;
            })
            .filter((value: string, index: number, originalArray: string[]) => {
                return value !== StreamGraph.EmptyDisplayName
                    && originalArray.indexOf(value) === index;
            });

        return valueFormatter.formatListAnd(valuesNames);
    }

    private renderXAxisLabels(): void {
        this.axes
            .selectAll(StreamGraph.XAxisLabelSelector.selectorName)
            .remove();

        const categoryAxisSettings: EnableCategoryAxisCardSettings = this.data.formattingSettings.enableCategoryAxisCardSettings;
        this.margin.bottom = categoryAxisSettings.show.value
            ? StreamGraph.XAxisOnSize + parseInt(this.data.formattingSettings.enableCategoryAxisCardSettings.labelFont.fontSize.value.toString())
            : StreamGraph.XAxisOffSize;

        if (!categoryAxisSettings.showAxisTitle.value
            || !this.dataView.categorical.categories[0]
            || !this.dataView.categorical.categories[0].source) {
            return;
        }

        const valueAxisSettings: EnableValueAxisCardSettings = this.data.formattingSettings.enableValueAxisCardSettings,
            isYAxisOn: boolean = valueAxisSettings.show.value,
            isYTitleOn: boolean = valueAxisSettings.showAxisTitle.value,
            leftMargin: number = (isYAxisOn
                ? StreamGraph.YAxisOnSize
                : StreamGraph.YAxisOffSize)
                + (isYTitleOn
                    ? StreamGraph.YAxisLabelSize
                    : StreamGraph.MinLabelSize),
            width: number = this.viewport.width - (this.margin.right + this.data.xAxisValueMaxReservedTextSize) - leftMargin,
            height: number = this.viewport.height + StreamGraph.XAxisLabelSize + StreamGraph.TickHeight;

        let xAxisText: string = this.dataView.categorical.categories[0].source.displayName;

        const textSettings: TextProperties = StreamGraph.getTextPropertiesFunction(xAxisText);

        xAxisText = textMeasurementService.getTailoredTextOrDefault(textSettings, width);

        const xAxisLabel: Selection<BaseType, any, any, any> = this.axes.append("text")
            .style("font-family", textSettings.fontFamily)
            .style("font-size", textSettings.fontSize)
            .style("font-weight", textSettings.fontWeight)
            .attr("transform", translate(
                width / StreamGraph.AxisLabelMiddle,
                height))
            .attr("fill", categoryAxisSettings.titleColor.value.value)
            .attr("dy", StreamGraph.XAxisLabelDy)
            .classed(StreamGraph.XAxisLabelSelector.className, true)
            .text(xAxisText);

        xAxisLabel.call(
            AxisHelper.LabelLayoutStrategy.clip,
            width,
            textMeasurementService.svgEllipsis);
    }

    private static getStreamGraphLabelLayout(
        xScale: ScaleLinear<number, number>,
        yScale: ScaleLinear<number, number>,
        enableDataLabelsCardSettings: EnableDataLabelsCardSettings,
        colorPalette: ISandboxExtendedColorPalette
    ): ILabelLayout {

        const colorHelper = new ColorHelper(colorPalette);
        const color = enableDataLabelsCardSettings.color.value.value;

        const fontSize: string = PixelConverter.fromPoint(enableDataLabelsCardSettings.fontSize.value);

        return {
            labelText: (d) => d.text + (enableDataLabelsCardSettings.showValues.value ? " " + d.value : ""),
            labelLayout: {
                x: (d) => xScale(d.x),
                y: (d) => yScale(d.y0)
            },
            filter: (d: StreamDataPoint) => {
                return d != null && d.text != null;
            },
            style: {
                "fill": colorHelper.isHighContrast ? colorHelper.getHighContrastColor("foreground", color) : color,
                "font-size": fontSize,
            },
        };
    }

    /* eslint-disable-next-line max-lines-per-function */
    private renderChart(
        series: StreamGraphSeries[],
        stackedSeries: Series<any, any>[],
        duration: number,
        hasHighlights: boolean = false
    ): Selection<BaseType, StackedStackValue, any, any> {

        const { width, height } = this.viewport;

        this.margin.left = this.data.formattingSettings.enableValueAxisCardSettings.show.value
            ? StreamGraph.YAxisOnSize + this.data.yAxisValueMaxTextSize
            : StreamGraph.YAxisOffSize;

        if (this.data.formattingSettings.enableValueAxisCardSettings.showAxisTitle.value) {
            this.margin.left += StreamGraph.YAxisLabelSize;
        }

        this.margin.bottom = this.data.formattingSettings.enableCategoryAxisCardSettings.show.value
            ? StreamGraph.XAxisOnSize + this.data.xAxisFontSize
            : StreamGraph.XAxisOffSize;

        if (this.data.formattingSettings.enableCategoryAxisCardSettings.showAxisTitle.value) {
            this.margin.bottom += StreamGraph.XAxisLabelSize;
        }

        const
            margin: IMargin = this.margin,
            xScale: ScaleLinear<number, number> = scaleLinear()
                .domain([0, series[0].dataPoints.length - 1])
                .range([margin.left, width - (margin.right + this.data.xAxisValueMaxReservedTextSize)]);

        const yMin: number = min(stackedSeries, serie => min(serie, d => d[0]));
        const yMax: number = max(stackedSeries, serie => max(serie, d => d[1]));

        const yScale: ScaleLinear<number, number> = scaleLinear()
            .domain([Math.min(yMin, 0), yMax])
            .range([height - (margin.bottom + StreamGraph.TickHeight), (this.margin.top + this.data.yAxisFontHalfSize)]);

        let areaVar: Area<StreamDataPoint> = area<StreamDataPoint>()
            .x((d, i) => xScale(i))
            .y0(d => yScale(d[0]))
            .y1(d => yScale(d[1]))
            .defined(d => StreamGraph.isNumber(d[0]) && StreamGraph.isNumber(d[1]));
        
        if(this.data.formattingSettings.enableGraphCurvatureCardSettings.enabled.value) {
            areaVar = areaVar.curve(curveCatmullRom.alpha(this.data.formattingSettings.enableGraphCurvatureCardSettings.value.value / 10.0))
        }

        const isHighContrast: boolean = this.colorPalette.isHighContrast;


        const selection: Selection<BaseType, any, any, any> = this.dataPointsContainer
            .selectAll(StreamGraph.LayerSelector.selectorName)
            .data(stackedSeries);

        const selectionMerged = selection
            .enter()
            .append<BaseType>("path")
            .merge(selection);

        selectionMerged
            .classed(StreamGraph.LayerSelector.className, true)
            .style("opacity", DefaultOpacity)
            .style("fill", (d, index) => isHighContrast ? null : series[index].color)
            .style("stroke", (d, index) => isHighContrast ? series[index].color : null);

        selectionMerged
            .attr("tabindex", 0)
            .attr("focusable", true);

        selectionMerged
            .transition()
            .duration(duration)
            .attr("d", areaVar);

        selectionMerged
            .selectAll("path")
            .append("g")
            .classed(StreamGraph.DataPointsContainer, true);

        selection
            .exit()
            .remove();

        if (this.data.formattingSettings.enableDataLabelsCardSettings.show.value) {
            const labelsXScale: ScaleLinear<number, number> = scaleLinear()
                .domain([0, series[0].dataPoints.length - 1])
                .range([0, width - margin.left - this.margin.right - this.data.xAxisValueMaxReservedTextSize]);

            const layout: ILabelLayout = StreamGraph.getStreamGraphLabelLayout(
                labelsXScale,
                yScale,
                this.data.formattingSettings.enableDataLabelsCardSettings,
                this.colorPalette);

            // Merge all points into a single array
            let dataPointsArray: StreamDataPoint[] = [];

            stackedSeries.forEach((seriesItem: Series<any, any>) => {
                const filteredDataPoints: any[] = seriesItem.filter((dataPoint: any) => {
                    return dataPoint && dataPoint[0] !== null && dataPoint[0] !== undefined;
                }).map((dataPoint: any) => {
                    return {
                        x: dataPoint.data.x,
                        y0: dataPoint[0],
                        y: dataPoint[1],
                        text: seriesItem.key,
                        value: dataPoint.data[seriesItem.key],
                        highlight: dataPoint.data.highlight
                    };
                });

                if (filteredDataPoints.length > 0) {
                    dataPointsArray = dataPointsArray.concat(filteredDataPoints);
                }
            });

            const viewport: IViewport = {
                height: height,
                width: width - (this.margin.right + this.data.xAxisValueMaxReservedTextSize) - margin.left,
            };

            if (hasHighlights) {
                const highlightedPointArray: StreamDataPoint[] = dataPointsArray.filter((d: StreamDataPoint) => d.highlight && d.value !== StreamGraph.DefaultValue);
                const additionalPointsArray: StreamDataPoint[] = dataPointsArray.filter((d: StreamDataPoint) => highlightedPointArray[0] && d.text === highlightedPointArray[0].text && d.x < highlightedPointArray[0].x);
                dataPointsArray = additionalPointsArray.concat(highlightedPointArray);
            }

            dataLabelUtils.cleanDataLabels(this.svg);

            const labels: Selection<BaseType, StreamDataPoint, any, any> =
                dataLabelUtils.drawDefaultLabelsForDataPointChart(
                    dataPointsArray,
                    this.svg,
                    layout,
                    viewport);

            if (labels) {
                //If Y axis is on or Y title is on, we need to consider that
                let divider = 4;
                if(this.data.formattingSettings.enableValueAxisCardSettings.show.value)
                    divider--;
                if(this.data.formattingSettings.enableValueAxisCardSettings.showAxisTitle.value)
                    divider--;

                let offset: number = StreamGraph.DefaultDataLabelsOffset + margin.left / divider;

                //DataLabels value ON, Y axis OFF, Y title OFF
                if(this.data.formattingSettings.enableDataLabelsCardSettings.showValues.value 
                        && !this.data.formattingSettings.enableValueAxisCardSettings.show.value
                        && !this.data.formattingSettings.enableValueAxisCardSettings.showAxisTitle.value)
                    offset = StreamGraph.DefaultDataLabelsOffset - (margin.left * 0.2);
                
                //DataLabels value ON, Y axis OFF, Y title ON
                if(this.data.formattingSettings.enableDataLabelsCardSettings.showValues.value 
                        && !this.data.formattingSettings.enableValueAxisCardSettings.show.value
                        && this.data.formattingSettings.enableValueAxisCardSettings.showAxisTitle.value)
                    offset *= 0.5;

                labels.attr("transform", (dataPoint: StreamDataPoint) => {
                    return translate(
                        offset + (dataPoint.size.width / StreamGraph.MiddleOfTheLabel),
                        dataPoint.size.height / StreamGraph.MiddleOfTheLabel);
                });
            }
        }
        else {
            dataLabelUtils.cleanDataLabels(this.svg);
        }

        return selectionMerged;
    }

    private localizeLegendOrientationDropdown(enableLegendCardSettings : EnableLegendCardSettings)
    {
        const strToBeLocalized : string = "Visual_LegendPosition_";
        for(let i = 0; i < enableLegendCardSettings.positionDropDown.items.length; i ++)
        {
            enableLegendCardSettings.positionDropDown.items[i].displayName = this.localizationManager.getDisplayName(strToBeLocalized + enableLegendCardSettings.positionDropDown.items[i].displayName)
        }
        StreamGraph.isLocalizedLegendOrientationDropdown = true;
    }

    private localizeDataOrderDropdown(enableGeneralCardSettings : EnableGeneralCardSettings)
    {
        const strToBeLocalized : string = "Visual_DataOrder_";
        for(let i = 0; i < enableGeneralCardSettings.dataOrderDropDown.items.length; i ++)
        {
            enableGeneralCardSettings.dataOrderDropDown.items[i].displayName = this.localizationManager.getDisplayName(strToBeLocalized + enableGeneralCardSettings.dataOrderDropDown.items[i].displayName)
        }
        StreamGraph.isLocalizedDataOrderDropdown = true;
    }

    private localizeDataOffsetDropdown(enableGeneralCardSettings : EnableGeneralCardSettings)
    {
        const strToBeLocalized : string = "Visual_DataOffset_";
        for(let i = 0; i < enableGeneralCardSettings.dataOffsetDropDown.items.length; i ++)
        {
            enableGeneralCardSettings.dataOffsetDropDown.items[i].displayName = this.localizationManager.getDisplayName(strToBeLocalized + enableGeneralCardSettings.dataOffsetDropDown.items[i].displayName)
        }
        StreamGraph.isLocalizedDataOffsetDropdown = true;
    }
    
    private localizeFormattingPanes(streamGraphData: StreamData)
    {
        const enableLegendCardSettings: EnableLegendCardSettings = streamGraphData.formattingSettings.enableLegendCardSettings;
        const enableGeneralCardSettings: EnableGeneralCardSettings = streamGraphData.formattingSettings.general;
        
        if(!StreamGraph.isLocalizedLegendOrientationDropdown) this.localizeLegendOrientationDropdown(enableLegendCardSettings);
        if(!StreamGraph.isLocalizedDataOrderDropdown) this.localizeDataOrderDropdown(enableGeneralCardSettings);
        if(!StreamGraph.isLocalizedDataOffsetDropdown) this.localizeDataOffsetDropdown(enableGeneralCardSettings);
    }

    private renderLegend(streamGraphData: StreamData): void {
        const enableLegendCardSettings: EnableLegendCardSettings = streamGraphData.formattingSettings.enableLegendCardSettings;
        const title: string = enableLegendCardSettings.showAxisTitle.value
            ? enableLegendCardSettings.legendName.value || streamGraphData.legendData.title
            : undefined;

        const dataPoints: LegendDataPoint[] = enableLegendCardSettings.show.value
            ? streamGraphData.legendData.dataPoints
            : [];

        const legendData: LegendData = {
            ...streamGraphData.legendData,
            title,
            dataPoints,
            fontSize: enableLegendCardSettings.fontSize.value,
            labelColor: enableLegendCardSettings.labelColor.value.value,
            fontFamily: "helvetica, arial, sans-serif"
        };
        
        this.legend.changeOrientation(LegendPosition[enableLegendCardSettings.positionDropDown.value.value]);

        this.legend.drawLegend(legendData, { ...this.viewport });
        positionChartArea(this.svg, this.legend);
    }

    private updateViewport(): void {
        const legendMargins: IViewport = this.legend.getMargins(),
            legendPosition: LegendPosition = this.legend.getOrientation();

        switch (legendPosition) {
            case LegendPosition.Top:
            case LegendPosition.TopCenter:
            case LegendPosition.Bottom:
            case LegendPosition.BottomCenter: {
                this.viewport.height = Math.max(
                    StreamGraph.MinInternalViewport.height,
                    this.viewport.height - legendMargins.height);

                break;
            }
            case LegendPosition.Left:
            case LegendPosition.LeftCenter:
            case LegendPosition.Right:
            case LegendPosition.RightCenter: {
                this.viewport.width = Math.max(
                    StreamGraph.MinInternalViewport.width,
                    this.viewport.width - legendMargins.width);

                break;
            }
        }
    }

    private clearData(): void {
        this.svg
            .selectAll(StreamGraph.LayerSelector.selectorName)
            .remove();

        this.legend.drawLegend(
            { dataPoints: [] },
            this.viewport);

        this.axisX
            .selectAll("*")
            .remove();

        this.axisY
            .selectAll("*")
            .remove();

        this.svg
            .select(".labels")
            .remove();
    }

    private static getTextPropertiesFunction(text: string): TextProperties {
        const fontFamily: string = StreamGraph.DefaultFontFamily,
            fontSize: string = PixelConverter.fromPoint(EnableLegendCardSettings.DefaultFontSizeInPoints),
            fontWeight: string = StreamGraph.DefaultFontWeight;
        return {
            text,
            fontSize,
            fontWeight,
            fontFamily
        };
    }

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return StreamGraph.formattingSettingsService.buildFormattingModel(StreamGraph.formattingSettings);
    }

    private handleContextMenu() {
        this.svg.on("contextmenu", (event) => {
            const emptySelection = {
                "measures": [],
                "dataMap": {}
            };

            this.selectionManager.showContextMenu(emptySelection, {
                x: event.clientX,
                y: event.clientY
            })

            event.preventDefault();
        })
    }
}
