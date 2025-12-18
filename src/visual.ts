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

import { DefaultOpacity, DataOrder, DataOffset, LabelOrientationMode } from "./utils";
import { StreamGraphSettingsModel, BaseAxisCardSettings, LegendTitleGroup, LegendCardSettings, BaseFontCardSettings } from "./streamGraphSettingsModel";
import { BehaviorOptions, StreamGraphBehavior } from "./behavior";
import { createTooltipInfo } from "./tooltipBuilder";
import { StreamData, StreamGraphSeries, StreamDataPoint, StackValue, StackedStackValue, LabelStyleProperties, LabelDataItem } from "./dataInterfaces";


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
import { legendInterfaces, axis, legend, axisInterfaces } from "powerbi-visuals-utils-chartutils";
import ILegend = legendInterfaces.ILegend;
import LegendData = legendInterfaces.LegendData;
import createLegend = legend.createLegend;
import LegendPosition = legendInterfaces.LegendPosition;
import AxisHelper = axis;
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

// powerbi.extensibility.utils.dataview
import { dataViewObjects } from "powerbi-visuals-utils-dataviewutils";

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
    private static StreamPropertyIdentifier = {
        fill: { objectName: "streams", propertyName: "fill" }
    };

    //cache style properties
    private cachedLabelStyles: LabelStyleProperties | null = null;
    private lastStyleUpdate: number = 0;
    private readonly STYLE_CACHE_DURATION = 1000; // 1 second cache
    
    // Data Labels Constants
    private static LabelPaddingVertical: number = 8;
    private static LabelPaddingVerticalReduced: number = 4;
    private static LabelOffsetSpacing: number = 2;
    private static LabelWidthCharacterMultiplier: number = 0.6;
    private static MinLabelWidth: number = 4;
    private static MaxOverlapIterations: number = 5;
    
    // Axis
    private static Axes: ClassAndSelector = createClassAndSelector("axes");
    private static Axis: ClassAndSelector = createClassAndSelector("axis");
    private static YAxis: ClassAndSelector = createClassAndSelector("yAxis");
    private static XAxis: ClassAndSelector = createClassAndSelector("xAxis");
    private static LabelMiddleSelector: ClassAndSelector = createClassAndSelector("labelMiddle");
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
    // Constants for rotated labels
    private static YAxisLabelAngle: string = "rotate(-90)";
    private static CategoryTextRotationDegree: number = 45.0;
    private static YAxisLabelDy: number = 30;
    private static YAxisMaxTextWidth: number = 80;
    private static XAxisLabelDy: string = "0.3em";
    private static RotatedLabelMarginFactor: number = 0.4;
    private static MaxRotatedLabelMargin: number = 50;
    private static YAxisTitleSpacingOn: number = 15;
    private static YAxisTitleSpacingOff: number = 10;
    private margin: IMargin = {
        left: StreamGraph.YAxisOnSize,
        right: -20,
        bottom: StreamGraph.XAxisOnSize,
        top: 0
    };

    private events: IVisualEventService;
    private xAxisBaseline: number;  
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
    private colorHelper: ColorHelper;
    private behavior: IInteractiveBehavior;
    private interactivityService: IInteractivityService<StreamGraphSeries>;

    private tooltipServiceWrapper: ITooltipServiceWrapper;
    private element: Selection<BaseType, any, any, any>;
    private svg: Selection<BaseType, any, any, any>;
    private clearCatcher: Selection<BaseType, StreamGraphSeries, any, any>;
    private dataPointsContainer: Selection<BaseType, StreamGraphSeries, any, any>;
    private labelsSelection: Selection<BaseType, any, any, any>;

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
                    : LegendTitleGroup.DefaultTitleText,
            };
        let value: number = 0;

        const category: DataViewCategoryColumn = categories && categories.length > 0
            ? categories[0]
            : null;

        const colorHelper: ColorHelper = new ColorHelper(colorPalette);

        this.formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(StreamGraphSettingsModel, dataView);
        const formattingSettings = this.formattingSettings;
        const fontSizeInPx: string = PixelConverter.fromPoint(formattingSettings.dataLabels.fontSize.value);

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

            const seriesObject: powerbi.DataViewObjects = values[valueIndex].source.objects;
            const fillColor = StreamGraph.getSeriesColor(
                valueIndex,
                colorHelper,
                seriesObject,
            );
            const color: string = colorHelper.getHighContrastColor(
                "foreground",
               fillColor,
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
            fontSize: PixelConverter.toString(formattingSettings.categoryAxis.options.fontSize.value)
        };
        const xAxisValueMaxTextSize: number = textMeasurementService.measureSvgTextWidth(textProperties);
        const xAxisValueMaxReservedTextSize: number = xAxisValueMaxTextSize * 1.15; //reserve additional space
        const textPropertiesY: TextProperties = {
            text: yMaxValue.toString(),
            fontFamily: "sans-serif",
            fontSize: PixelConverter.toString(formattingSettings.valueAxis.options.fontSize.value)
        };
        const yAxisValueMaxTextSize: number = textMeasurementService.measureSvgTextWidth(textPropertiesY);
        const yAxisValueMaxTextHalfSize: number = yAxisValueMaxTextSize / 2;
        const yAxisFontSize: number = +formattingSettings.valueAxis.options.fontSize.value;
        const yAxisFontHalfSize: number = yAxisFontSize / 2;
        const xAxisFontSize: number = +formattingSettings.categoryAxis.options.fontSize.value;
        const xAxisFontHalfSize: number = xAxisFontSize / 2;

        StreamGraph.YAxisLabelSize = formattingSettings.valueAxis.options.fontSize.value;
        StreamGraph.XAxisLabelSize = formattingSettings.categoryAxis.options.fontSize.value;

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

    private static getSeriesColor(
        seriesIndex: number,
        colorHelper: ColorHelper,
        seriesObjects: powerbi.DataViewObjects,
    ): string {

        const defaultPaletteColor = colorHelper.getColorForMeasure(
            seriesObjects,
            seriesIndex.toString()
        );

        // Check if there's a custom color set for this stream
        const customStreamsColor = dataViewObjects.getFillColor(
            seriesObjects,
            StreamGraph.StreamPropertyIdentifier.fill
        );
        
        return customStreamsColor || defaultPaletteColor;
    }

    public init(options: VisualConstructorOptions): void {
        select("html").style(
            "-webkit-tap-highlight-color", "transparent" // Turns off the blue highlighting at mobile browsers
        );

        this.visualHost = options.host;
        this.colorPalette = options.host.colorPalette;
        this.colorHelper = new ColorHelper(this.colorPalette);
        this.localizationManager = options.host.createLocalizationManager();
        this.selectionManager = options.host.createSelectionManager();
        StreamGraph.formattingSettingsService = new FormattingSettingsService(this.localizationManager);

        const element: HTMLElement = options.element;
        this.element = select(element);

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

        this.data.formattingSettings.populateStreams(this.data.series);

        if (!this.data
            || !this.data.series
            || !this.data.series.length
        ) {
            this.clearData();
            this.events.renderingFinished(options);
            return;
        }

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
                labelsSelection: this.labelsSelection,
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

    private setColorFontXAxis(xAxisTextNodes: Selection<BaseType, any, any, any>) {
        const options = this.data.formattingSettings.categoryAxis.options;

        this.applyAxisTextStyle(xAxisTextNodes, {
            color: options.labelColor.value.value,
            fontSize: options.fontSize.value.toString(),
            fontFamily: options.fontFamily.value,
            bold: options.bold.value,
            italic: options.italic.value,
            underline: options.underline.value
        });
    }

    private setColorFontYAxis(yAxisTextNodes: Selection<BaseType, any, any, any>) {
        const options = this.data.formattingSettings.valueAxis.options;

        this.applyAxisTextStyle(yAxisTextNodes, {
            color: options.labelColor.value.value,
            fontSize: options.fontSize.value.toString(),
            fontFamily: options.fontFamily.value,
            bold: options.bold.value,
            italic: options.italic.value,
            underline: options.underline.value
        });
    }

    private applyAxisTextStyle(
        textNodes: Selection<BaseType, any, any, any>,
        options: {
            color: string;
            fontSize: string;
            fontFamily: string;
            bold: boolean;
            italic: boolean;
            underline: boolean;
        }
    ): void {
        const { color, fontSize, fontFamily, bold, italic, underline } = options;

        textNodes
            .attr("fill", this.colorHelper.getHighContrastColor("foreground", color))
            .attr("stroke", color)
            .attr("font-size", fontSize)
            .attr("font-family", fontFamily)
            .attr("font-weight", bold ? "bold" : "normal")
            .attr("font-style", italic ? "italic" : "normal")
            .attr("text-decoration", underline ? "underline" : "none");
    }

    private calculateAxes() {
        const showAxisTitle: boolean = this.data.formattingSettings.categoryAxis.title.show.value,
            xShow: boolean = this.data.formattingSettings.categoryAxis.options.show.value,

            yShow: boolean = this.data.formattingSettings.valueAxis.options.show.value;

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

        this.renderXAxis(effectiveWidth, dataDomainVals, isScalarVal);
        this.renderYAxis(effectiveHeight, metaDataColumnPercent);

        this.renderXAxisLabels();
        this.renderYAxisLabels();

        this.axes.attr("transform", translate(this.margin.left, 0));
        this.axisX.attr("transform", translate(0, this.xAxisBaseline));
        this.axisY.attr("transform", translate(0, (this.margin.top + this.data.yAxisFontHalfSize)));

        this.toggleAxisVisibility(xShow, StreamGraph.XAxis.className, this.axisX);
        this.toggleAxisVisibility(yShow, StreamGraph.YAxis.className, this.axisY);
    }

    private renderXAxis(effectiveWidth: number, dataDomainVals: number[], isScalarVal: boolean): void {
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
                }   return value;
            }
        };

        this.xAxisProperties = AxisHelper.createAxis(axisOptions);
        this.axisX.call(this.xAxisProperties.axis);

        this.hideFirstAndLastTickXAxis();
        
        const xAxisTextNodes: Selection<BaseType, any, any, any> = this.axisX.selectAll("text");
        
        this.setColorFontXAxis(xAxisTextNodes);

        // Handle label rotation based on orientation mode
        const orientationMode = this.data.formattingSettings.categoryAxis.options.labelOrientationMode.value.value;
        
        if (orientationMode === LabelOrientationMode[LabelOrientationMode.ForceRotate]) {
            xAxisTextNodes
                .classed(StreamGraph.LabelMiddleSelector.className, true)
                .style("text-anchor", StreamGraph.AxisTextNodeTextAnchorForAngel0)
                .attr("dx", StreamGraph.AxisTextNodeDXForAngel0)
                .attr("dy", StreamGraph.AxisTextNodeDYForAngel0)
                .attr("transform", `rotate(-${StreamGraph.CategoryTextRotationDegree})`);
            
            // Fix positions for rotated labels
            const categoryLabels = this.axisX.selectAll(".tick");
            categoryLabels.each(function () {
                const shiftX: number = (<any>this).getBBox().width / Math.tan(StreamGraph.CategoryTextRotationDegree * Math.PI / 180) / 2.0;
                const shiftY: number = (<any>this).getBBox().width * Math.tan(StreamGraph.CategoryTextRotationDegree * Math.PI / 180) / 2.0;
                const currTransform: string = (<any>this).attributes.transform.value;
                const translate: [number, number, number] = StreamGraph.parseSvgTransformToTranslateAndRotation(currTransform);
                select(<any>this)
                    .attr("transform", () => {
                        return manipulation.translate(+translate[0] - shiftX, +translate[1] + shiftY);
                    });
            });
        } else {
           xAxisTextNodes
            .attr("text-anchor", "middle")
            .attr("dx", StreamGraph.AxisTextNodeDXForAngel0)
            .attr("dy", StreamGraph.AxisTextNodeDYForAngel0)
            .attr("transform", null);
            // Apply word break for non-rotated labels to handle long text
            StreamGraph.applyWordBreak(xAxisTextNodes, this.xAxisProperties, StreamGraph.XAxisLabelSize, this.data.formattingSettings.categoryAxis.options.fontSize.value.toString());
        }
    }

    public static parseSvgTransformToTranslateAndRotation(transform: string): [number, number, number] {
        // eslint-disable-next-line powerbi-visuals/no-http-string
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.setAttributeNS(null, "transform", transform);
        const matrix = g.transform.baseVal.consolidate().matrix;
        return [matrix.e, matrix.f, -Math.asin(matrix.a) * 180 / Math.PI];
    }

    private calculateXAxisAdditionalHeight(categories: PrimitiveValue[]): number {
        if (!categories || categories.length === 0) {
            return 0;
        }

        const sortedByLength: PrimitiveValue[] = [...categories].sort((a: string, b: string) => 
            (a ? a.toString().length : 0) > (b ? b.toString().length : 0) ? 1 : -1);
        let longestCategory: PrimitiveValue = sortedByLength[categories.length - 1] || "";

        if (longestCategory instanceof Date) {
            const metadataColumn: DataViewMetadataColumn = this.dataView.categorical.categories[0].source;
            const formatString: string = valueFormatter.getFormatStringByColumn(metadataColumn);

            const formatter = valueFormatter.create({
                format: formatString,
                value: longestCategory,
                columnType: {
                    dateTime: true
                }
            });

            longestCategory = formatter.format(longestCategory);
        }

        const textProperties: TextProperties = {
            text: longestCategory.toString(),
            fontFamily: "sans-serif",
            fontSize: PixelConverter.toString(this.data.formattingSettings.categoryAxis.options.fontSize.value)
        };

        const longestCategoryWidth = textMeasurementService.measureSvgTextWidth(textProperties);
        const requiredHeight = longestCategoryWidth * Math.tan(StreamGraph.CategoryTextRotationDegree * Math.PI / 180);
        return requiredHeight;
    }

    /**
     * Calculates the additional left margin needed for rotated X-axis labels.
     * This prevents rotated labels from being clipped at the left edge of the visual.
     * returns the extra margin in pixels, or 0 if labels are not rotated
     */
    private getExtraLeftMarginForRotatedLabels(): number {
        const orientationMode = this.data.formattingSettings.categoryAxis.options.labelOrientationMode.value.value;
        if (orientationMode !== LabelOrientationMode[LabelOrientationMode.ForceRotate]) {
            return 0;
        }
        const rotatedLabelHeight = this.calculateXAxisAdditionalHeight(this.data.categoriesText);
        return Math.min(rotatedLabelHeight * StreamGraph.RotatedLabelMarginFactor, StreamGraph.MaxRotatedLabelMargin);
    }
    
    private renderYAxis(effectiveHeight: number, metaDataColumnPercent: powerbi.DataViewMetadataColumn): void {
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
            disableNice : this.data.formattingSettings.valueAxis.options.highPrecision.value
        });
        
        this.axisY.call(this.yAxisProperties.axis);

        const yAxisTextNodes: Selection<BaseType, any, any, any> = this.axisY.selectAll("text");
        this.setColorFontYAxis(yAxisTextNodes);
    }

    private renderYAxisLabels(): void {
        this.axes
            .selectAll(StreamGraph.YAxisLabelSelector.selectorName)
            .remove();
        const valueAxisSettings: BaseAxisCardSettings = this.data.formattingSettings.valueAxis;
        const isYAxisOn: boolean = valueAxisSettings.options.show.value;
        
        // Calculate base left margin for Y-axis
        const baseMarginLeft = isYAxisOn
            ? StreamGraph.YAxisOnSize + this.data.yAxisValueMaxTextSize
            : StreamGraph.YAxisOffSize;
        
        this.margin.left = baseMarginLeft;
        
        // Add extra left margin for rotated X-axis labels
        const extraRotatedMargin = this.getExtraLeftMarginForRotatedLabels();
        this.margin.left += extraRotatedMargin;

        if (valueAxisSettings.title.show.value) {
            this.margin.left += StreamGraph.YAxisLabelSize;

            const categoryAxisSettings: BaseAxisCardSettings = this.data.formattingSettings.categoryAxis,
                isXAxisOn: boolean = categoryAxisSettings.options.show.value,
                isXTitleOn: boolean = categoryAxisSettings.title.show.value,
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

            const textSettings: TextProperties = StreamGraph.getTextPropertiesFunction(yAxisText, valueAxisSettings.title);
            yAxisText = textMeasurementService.getTailoredTextOrDefault(textSettings, height);
            
            // Calculate Y-axis title position with proper spacing from labels
            const yTitleOffset = baseMarginLeft + (isYAxisOn ? StreamGraph.YAxisTitleSpacingOn : StreamGraph.YAxisTitleSpacingOff);
            
            const yAxisLabel: Selection<BaseType, any, any, any> = this.axes.append("text")
                .style("font-family", textSettings.fontFamily)
                .style("font-size", textSettings.fontSize)
                .style("font-style", textSettings.fontStyle)
                .style("font-weight", textSettings.fontWeight)
                .style("text-decoration", valueAxisSettings.title.underline.value ? "underline" : "none")
                .attr("transform", StreamGraph.YAxisLabelAngle)
                .attr("fill", this.colorHelper.getHighContrastColor("foreground", valueAxisSettings.title.color.value.value))
                .attr("x", -(marginTop + (height / StreamGraph.AxisLabelMiddle)))
                .attr("y", -yTitleOffset + StreamGraph.YAxisLabelDy)
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

        const categoryAxisSettings: BaseAxisCardSettings = this.data.formattingSettings.categoryAxis;
        const isXAxisOn: boolean = categoryAxisSettings.options.show.value;
        const additionalMarginForRotation = this.getAdditionalMarginForRotatedLabels();
        
        // Calculate the base bottom margin (axis + labels + rotation space)
        const baseBottomMargin = isXAxisOn
            ? StreamGraph.XAxisOnSize + parseInt(this.data.formattingSettings.categoryAxis.options.fontSize.value.toString()) + additionalMarginForRotation
            : StreamGraph.XAxisOffSize;
        
        this.margin.bottom = baseBottomMargin;

        if (!categoryAxisSettings.title.show.value
            || !this.dataView.categorical.categories[0]
            || !this.dataView.categorical.categories[0].source) {
            return;
        }
        
        // Calculate available width for title, accounting for both left and right margins
        const width: number = this.viewport.width - (this.margin.right + this.data.xAxisValueMaxReservedTextSize) - this.margin.left;
        
        // Position X-axis title below the axis and its labels
        // The height includes the axis baseline plus space for labels and rotated label margins
        const height: number = this.xAxisBaseline + baseBottomMargin - StreamGraph.TickHeight;

        let xAxisText: string = this.dataView.categorical.categories[0].source.displayName;
        const textSettings: TextProperties = StreamGraph.getTextPropertiesFunction(xAxisText, categoryAxisSettings.title);

        xAxisText = textMeasurementService.getTailoredTextOrDefault(textSettings, width);

        const xAxisLabel: Selection<BaseType, any, any, any> = this.axes.append("text")
            .style("font-family", textSettings.fontFamily)
            .style("font-size", textSettings.fontSize)
            .style("font-weight", textSettings.fontWeight)
            .style("font-style", textSettings.fontStyle)
            .style("text-decoration", categoryAxisSettings.title.underline.value ? "underline" : "none")
            .attr("transform", translate(
                width / StreamGraph.AxisLabelMiddle,
                height))
            .attr("fill", this.colorHelper.getHighContrastColor("foreground", categoryAxisSettings.title.color.value.value))
            .attr("dy", StreamGraph.XAxisLabelDy)
            .classed(StreamGraph.XAxisLabelSelector.className, true)
            .text(xAxisText);

        xAxisLabel.call(
            AxisHelper.LabelLayoutStrategy.clip,
            width,
            textMeasurementService.svgEllipsis);
    }

    private renderChart(
        series: StreamGraphSeries[],
        stackedSeries: Series<any, any>[],
        duration: number,
        hasHighlights: boolean = false
    ): Selection<BaseType, StackedStackValue, any, any> {
        const { width, height } = this.viewport;
        // Calculate left margin for Y-axis and Y-axis title
        this.margin.left = this.data.formattingSettings.valueAxis.options.show.value
            ? StreamGraph.YAxisOnSize + Math.min(this.data.yAxisValueMaxTextSize, StreamGraph.YAxisMaxTextWidth)
            : StreamGraph.YAxisOffSize;

        // Add extra left margin for rotated X-axis labels
        this.margin.left += this.getExtraLeftMarginForRotatedLabels();

        if (this.data.formattingSettings.valueAxis.title.show.value) {
            this.margin.left += StreamGraph.YAxisLabelSize;
        }

        const additionalMarginForRotation = this.getAdditionalMarginForRotatedLabels();
        this.margin.bottom = this.data.formattingSettings.categoryAxis.options.show.value
            ? StreamGraph.XAxisOnSize + this.data.xAxisFontSize + additionalMarginForRotation
            : StreamGraph.XAxisOffSize;

        if (this.data.formattingSettings.categoryAxis.title.show.value) {
            this.margin.bottom += StreamGraph.XAxisLabelSize;
        }

        const
            margin: IMargin = this.margin,
            xScale: ScaleLinear<number, number> = scaleLinear()
                .domain([0, series[0].dataPoints.length - 1])
                .range([margin.left, width - (margin.right + this.data.xAxisValueMaxReservedTextSize)]);

        const yMin: number = min(stackedSeries, serie => min(serie, d => d[0]));
        const yMax: number = max(stackedSeries, serie => max(serie, d => d[1]));
        const baselineY: number = height - (margin.bottom + StreamGraph.TickHeight);

        const yScale: ScaleLinear<number, number> = scaleLinear()
            .domain([Math.min(yMin, 0), yMax])
            .range([baselineY, (this.margin.top + this.data.yAxisFontHalfSize)]);

        // remember baseline for axis positioning
        this.xAxisBaseline = baselineY;
        let areaVar: Area<StreamDataPoint> = area<StreamDataPoint>()
            .x((d, i) => xScale(i))
            .y0(d => yScale(d[0]))
            .y1(d => yScale(d[1]))
            .defined(d => StreamGraph.isNumber(d[0]) && StreamGraph.isNumber(d[1]));
        
        if(this.data.formattingSettings.graphCurvature.enabled.value) {
            areaVar = areaVar.curve(curveCatmullRom.alpha(this.data.formattingSettings.graphCurvature.value.value / 10.0))
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
            .style("stroke", (d, index) => isHighContrast ? series[index].color : null)
            .attr("tabindex", 0)
            .attr("focusable", true);

        selectionMerged
            .transition()
            .duration(duration)
            .attr("d", areaVar);

        selection
            .exit()
            .remove();

        this.renderDataLabels(series, stackedSeries, xScale, yScale, hasHighlights);

        return selectionMerged;
    }

    private renderDataLabels(
        series: StreamGraphSeries[], 
        stackedSeries: Series<any, any>[], 
        xScale: ScaleLinear<number, number>, 
        yScale: ScaleLinear<number, number>, 
        hasHighlights: boolean
    ): void {
        if (!this.data?.formattingSettings?.dataLabels?.show?.value) {
            this.clearDataLabels();
            return;
        }

        const dataLabelsSettings = this.data.formattingSettings.dataLabels;
        const styleProperties = this.extractLabelStyleProperties(dataLabelsSettings);
        
        const labelsContainer = this.createOrUpdateLabelsContainer();
        const streamLabelGroups = this.createStreamLabelGroups(labelsContainer, stackedSeries);

        // Collect all labels first for overlap detection
        const allLabelData: LabelDataItem[] = [];

        // Process each stream's labels
        streamLabelGroups.each((seriesItem: Series<any, any>, seriesIndex: number) => {
            const labelData = this.prepareLabelData(
                seriesItem,
                series[seriesIndex],
                seriesIndex,
                xScale,
                yScale,
                hasHighlights
            );
            allLabelData.push(...labelData);
        });

        // Apply overlap handling
        const processedLabels = this.applyOverlapHandling(allLabelData, dataLabelsSettings);

        // Render processed labels
        streamLabelGroups.each((seriesItem: Series<any, any>, seriesIndex: number) => {
            const streamLabels = processedLabels.filter(label => label.seriesIndex === seriesIndex);
            this.renderStreamLabels(
                select(streamLabelGroups.nodes()[seriesIndex]),
                streamLabels,
                dataLabelsSettings,
                styleProperties
            );
        });

        this.labelsSelection = streamLabelGroups;
    }

    //Clears all data labels from the visualization
    private clearDataLabels(): void {
        const labelsContainer = this.svg.selectAll(".data-labels-container");
        if (!labelsContainer.empty()) {
            // Remove event listeners and clean up D3 selections
            labelsContainer.selectAll("*").on(".", null);
            labelsContainer.remove();
        }
        
        // Clear references to prevent memory leaks
        this.labelsSelection = null;
        this.cachedLabelStyles = null;
        this.lastStyleUpdate = 0;
    }

    //Extracts and processes style properties for labels
    private extractLabelStyleProperties(dataLabelsSettings: any): LabelStyleProperties {
        const now = Date.now();
        
        // Use cached styles if available and recent
        if (this.cachedLabelStyles && 
            (now - this.lastStyleUpdate) < this.STYLE_CACHE_DURATION) {
            return this.cachedLabelStyles;
        }

        const styles: LabelStyleProperties = {
            color: dataLabelsSettings?.color?.value?.value || "#000000",
            fontSize: PixelConverter.fromPoint(dataLabelsSettings?.fontSize?.value || 12),
            fontFamily: dataLabelsSettings?.font?.fontFamily?.value || "Arial",
            fontWeight: dataLabelsSettings?.font?.bold?.value ? "bold" : "normal",
            fontStyle: dataLabelsSettings?.font?.italic?.value ? "italic" : "normal",
            textDecoration: dataLabelsSettings?.font?.underline?.value ? "underline" : "none",
            showValues: dataLabelsSettings?.showValues?.value || false
        };
        
        // Cache the styles for performance
        this.cachedLabelStyles = styles;
        this.lastStyleUpdate = now;
        
        return styles;
    }

   // Creates or updates the main labels container
    private createOrUpdateLabelsContainer(): Selection<BaseType, any, any, any> {
        const labelsContainer = this.svg
            .selectAll(".data-labels-container")
            .data([0]);

        const labelsContainerEnter = labelsContainer
            .enter()
            .append("g")
            .classed("data-labels-container", true)
            .attr("role", "group") // Accessibility
            .attr("aria-label", "Data labels");

        return labelsContainerEnter.merge(labelsContainer as any);
    }

    //Creates and manages stream label groups
    private createStreamLabelGroups(
        labelsContainer: Selection<BaseType, any, any, any>, 
        stackedSeries: Series<any, any>[]
    ): Selection<BaseType, any, any, any> {
        const streamLabelGroups = labelsContainer
            .selectAll(".stream-label-group")
            .data(stackedSeries, (d: any, i: number) => i.toString());
        const streamLabelGroupsEnter = streamLabelGroups
            .enter()
            .append("g")
            .classed("stream-label-group", true)
            .attr("data-stream-index", (d: any, i: number) => i)
            .attr("aria-label", (d: any, i: number) => `Stream ${i + 1} labels`);

        const streamLabelGroupsMerged = streamLabelGroupsEnter.merge(streamLabelGroups as any);
        streamLabelGroups.exit().remove();

        return streamLabelGroupsMerged;
    }

    //Renders labels for a specific stream
    private renderStreamLabels(
        streamGroup: Selection<BaseType, any, any, any>,
        labelData: LabelDataItem[],
        dataLabelsSettings: any,
        styleProperties: LabelStyleProperties
    ): void {
        if (!streamGroup || streamGroup.empty()) {
            return;
        }

        const labels = streamGroup
            .selectAll("text.data-labels")
            .data(labelData, (d: LabelDataItem) => `${d.seriesIndex}-${d.pointIndex}`);

        labels.exit().remove();

        const labelsEnter = labels
            .enter()
            .append("text")
            .classed("data-labels", true);

        const labelsMerged = labelsEnter.merge(labels as any);

        // Apply styles and attributes
        this.applyLabelStyles(labelsMerged, dataLabelsSettings, styleProperties);
    }

    /**
     * Prepares label data for a specific series with optimized filtering
     */
    private prepareLabelData(
        seriesItem: Series<any, any>,
        seriesData: StreamGraphSeries,
        seriesIndex: number,
        xScale: ScaleLinear<number, number>,
        yScale: ScaleLinear<number, number>,
        hasHighlights: boolean
    ): LabelDataItem[] {
        const labelData: LabelDataItem[] = [];
        
        seriesItem.forEach((dataPoint: any, pointIndex: number) => {
            if (this.isValidDataPoint(dataPoint)) {
                const labelItem = this.createLabelItem(
                    dataPoint, 
                    seriesData, 
                    seriesIndex, 
                    pointIndex, 
                    xScale, 
                    yScale
                );
                
                if (labelItem && this.shouldIncludeLabel(labelItem, hasHighlights)) {
                    labelData.push(labelItem);
                }
            }
        });

        return labelData;
    }

    // Checks if a data point is valid for labeling
    private isValidDataPoint(dataPoint: any): boolean {
        return dataPoint && dataPoint[0] !== null && dataPoint[0] !== undefined;
    }

    private createLabelItem(
        dataPoint: any,
        seriesData: StreamGraphSeries,
        seriesIndex: number,
        pointIndex: number,
        xScale: ScaleLinear<number, number>,
        yScale: ScaleLinear<number, number>
    ): any {
        // Calculate the actual value for the data point
        const actualValue = dataPoint[1] - dataPoint[0];
        
        return {
            x: xScale(dataPoint.data.x),
            y: yScale((dataPoint[0] + dataPoint[1]) / 2),
            text: seriesData.label,
            value: actualValue,
            highlight: dataPoint.data.highlight,
            seriesIndex: seriesIndex,
            pointIndex: pointIndex
        };
    }

    private shouldIncludeLabel(labelItem: any, hasHighlights: boolean): boolean {
        if (hasHighlights) {
            return labelItem.highlight && labelItem.value !== StreamGraph.DefaultValue;
        }
        return true;
    }

    // Applies styling to label elements with accessibility
    private applyLabelStyles(
        labelsMerged: Selection<BaseType, LabelDataItem, any, any>, 
        dataLabelsSettings: any, 
        styleProperties: LabelStyleProperties
    ): void {
        if (!labelsMerged || labelsMerged.empty()) {
            return;
        }

        labelsMerged
            .text((d: LabelDataItem) => this.formatLabelText(d, styleProperties.showValues))
            .attr("x", (d: LabelDataItem) => d.x)
            .attr("y", (d: LabelDataItem) => d.y)
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .attr("aria-label", (d: LabelDataItem) => 
                `${d.text}${styleProperties.showValues && d.value !== undefined ? ': ' + d.value : ''}`
            )
            .style("fill", this.colorHelper.getHighContrastColor("foreground", styleProperties.color))
            .style("font-size", styleProperties.fontSize)
            .style("font-family", styleProperties.fontFamily)
            .style("font-weight", styleProperties.fontWeight)
            .style("font-style", styleProperties.fontStyle)
            .style("text-decoration", styleProperties.textDecoration)
            .style("pointer-events", "none")
            .style("user-select", "none");
    }

    private formatLabelText(labelData: LabelDataItem, showValues: boolean): string {
        const baseText = labelData.text;
        if (showValues && labelData.value !== undefined) {
            return `${baseText} ${labelData.value}`;
        }
        return baseText;
    }

    private applyOverlapHandling(labelData: LabelDataItem[], dataLabelsSettings: any): LabelDataItem[] {
        const overlapHandling = dataLabelsSettings?.overlapHandling?.value?.value;        
        // Handle both numeric enum values and enum name strings
        if (!overlapHandling || overlapHandling === "Standard") {
            return labelData;
        }

        if (overlapHandling === "HideOverlap") {
            return this.hideOverlappingLabels(labelData, dataLabelsSettings);
        }

        if (overlapHandling === "OffsetOverlap") {
            return this.offsetOverlappingLabels(labelData, dataLabelsSettings);
        }

        return labelData;
    }

 
    // Hides overlapping labels by removing them from the array
    private hideOverlappingLabels(labelData: LabelDataItem[], dataLabelsSettings: any): LabelDataItem[] {
        const processedLabels: LabelDataItem[] = [];
        const fontSize = dataLabelsSettings?.fontSize?.value || 12;
        const labelHeight = fontSize + StreamGraph.LabelPaddingVertical; // More generous padding
        
        // Calculate label width based on text content
        const getLabelWidth = (label: LabelDataItem) => {
            const textLength = label.text ? label.text.length : 6;
            return Math.max(fontSize * StreamGraph.LabelWidthCharacterMultiplier * textLength, fontSize * StreamGraph.MinLabelWidth); // Minimum width
        };

        // Sort labels by x position (left to right) for better distribution
        const sortedLabels = [...labelData].sort((a, b) => a.x - b.x);

        for (const currentLabel of sortedLabels) {
            let hasOverlap = false;
            const currentWidth = getLabelWidth(currentLabel);

            // Check if current label overlaps with any already processed label
            for (const existingLabel of processedLabels) {
                const existingWidth = getLabelWidth(existingLabel);
                const maxWidth = Math.max(currentWidth, existingWidth);
                
                if (this.labelsOverlap(currentLabel, existingLabel, maxWidth, labelHeight)) {
                    hasOverlap = true;
                    break;
                }
            }

            // Only add label if it doesn't overlap with existing ones
            if (!hasOverlap) {
                processedLabels.push(currentLabel);
            }
        }

        return processedLabels;
    }

    // Offsets overlapping labels to avoid overlaps
    private offsetOverlappingLabels(labelData: LabelDataItem[], dataLabelsSettings: any): LabelDataItem[] {
        const fontSize = dataLabelsSettings?.fontSize?.value || 12;
        const labelHeight = fontSize + StreamGraph.LabelPaddingVerticalReduced; // Reduced padding
        const offsetDistance = labelHeight + StreamGraph.LabelOffsetSpacing; // Smaller spacing
        const maxIterations = StreamGraph.MaxOverlapIterations;
        
        // Calculate label width based on text content
        const getLabelWidth = (label: LabelDataItem) => {
            const textLength = label.text ? label.text.length : 6;
            return Math.max(fontSize * StreamGraph.LabelWidthCharacterMultiplier * textLength, fontSize * StreamGraph.MinLabelWidth); // Reduced width
        };

        // Create a copy of label data to modify
        const processedLabels: LabelDataItem[] = labelData.map(label => ({ ...label }));

        // Sort by original y position
        processedLabels.sort((a, b) => a.y - b.y);

        // Iterative overlap resolution
        for (let iteration = 0; iteration < maxIterations; iteration++) {
            let overlapFound = false;
            
            // Check each label against all others
            for (let i = 0; i < processedLabels.length - 1; i++) {
                for (let j = i + 1; j < processedLabels.length; j++) {
                    const label1 = processedLabels[i];
                    const label2 = processedLabels[j];
                    
                    const width1 = getLabelWidth(label1);
                    const width2 = getLabelWidth(label2);
                    const maxWidth = Math.max(width1, width2);

                    if (this.labelsOverlap(label1, label2, maxWidth, labelHeight)) {
                        // Move the lower label down
                        const upperLabel = label1.y < label2.y ? label1 : label2;
                        const lowerLabel = label1.y >= label2.y ? label1 : label2;
                        
                        const newY = upperLabel.y + offsetDistance;
                        if (lowerLabel.y < newY) {
                            lowerLabel.y = newY;
                            overlapFound = true;
                        }
                    }
                }
            }
            
            // If no overlaps were found, we're done
            if (!overlapFound) {
                break;
            }
            
            // Re-sort after moving labels
            processedLabels.sort((a, b) => a.y - b.y);
        }

        return processedLabels;
    }

    
    // Checks if two labels overlap
    private labelsOverlap(label1: LabelDataItem, label2: LabelDataItem, width: number, height: number): boolean {
        const halfWidth = width / 2;
        const halfHeight = height / 2;

        // Calculate bounding boxes
        const box1 = {
            left: label1.x - halfWidth,
            right: label1.x + halfWidth,
            top: label1.y - halfHeight,
            bottom: label1.y + halfHeight
        };

        const box2 = {
            left: label2.x - halfWidth,
            right: label2.x + halfWidth,
            top: label2.y - halfHeight,
            bottom: label2.y + halfHeight
        };

        // Check if boxes overlap
        const overlaps = !(box1.right <= box2.left || 
                          box1.left >= box2.right || 
                          box1.bottom <= box2.top || 
                          box1.top >= box2.bottom);
        
        return overlaps;
    }

    private renderLegend(streamGraphData: StreamData): void {
        const legendSettings: LegendCardSettings = streamGraphData.formattingSettings.legend;
        const title: string = legendSettings.title.show.value
            ? legendSettings.title.text.value || streamGraphData.legendData.title
            : undefined;

        const dataPoints: LegendDataPoint[] = legendSettings.show.value
            ? streamGraphData.legendData.dataPoints
            : [];

        const legendData: LegendData = {
            ...streamGraphData.legendData,
            title,
            dataPoints,
            fontSize: legendSettings.text.fontSize.value,
            labelColor: this.colorHelper.getHighContrastColor("foreground", legendSettings.text.labelColor.value.value),
            fontFamily: legendSettings.text.fontFamily.value
        };
        
        this.legend.changeOrientation(LegendPosition[legendSettings.options.position.value.value]);

        this.legend.drawLegend(legendData, { ...this.viewport });

        const legendSelection = this.element
            .select(".legend");

        legendSelection.selectAll("text")
            .style("font-weight",  () => legendSettings.text.font.bold.value ? "bold" : "normal")
            .style("font-style",  () => legendSettings.text.font.italic.value ? "italic" : "normal")
            .style("text-decoration", () => legendSettings.text.font.underline.value ? "underline" : "none");

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

        this.svg
            .selectAll(".data-labels-container")
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
    }

    private static getTextPropertiesFunction(text: string, settings: BaseFontCardSettings): TextProperties {
        const fontFamily: string = settings.fontFamily.value,
            fontSize: string = PixelConverter.fromPoint(settings.fontSize.value),
            fontWeight: string = settings.bold.value ? "bold" : StreamGraph.DefaultFontWeight,
            fontStyle: string = settings.italic.value ? "italic" : StreamGraph.DefaultFontWeight;
        return {
            text,
            fontSize,
            fontWeight,
            fontFamily,
            fontStyle
        };
    }

    private getAdditionalMarginForRotatedLabels(): number {
        const orientationMode = this.data.formattingSettings.categoryAxis.options.labelOrientationMode.value.value;
        if (orientationMode !== LabelOrientationMode[LabelOrientationMode.ForceRotate]) {
            return 0;
        }

        // get the longest category label
        const longestText = this.data.categoriesText
            .map(c => c ? c.toString() : "")
            .reduce((a, b) => a.length > b.length ? a : b, "");

        if (!longestText) {
            return 0;
        }
        // measure rotated text height precisely
        const fontSize = this.data.formattingSettings.categoryAxis.options.fontSize.value;
        const textProps: TextProperties = {
            text: longestText,
            fontFamily: "sans-serif",
            fontSize: PixelConverter.toString(fontSize),
        };

        const textWidth = textMeasurementService.measureSvgTextWidth(textProps);
        // true height of rotated text:
        // height = width * sin(45°)
        const extraHeight = textWidth * Math.sin(StreamGraph.CategoryTextRotationDegree * Math.PI / 180);
        const maxAdditionalMargin = Math.min(extraHeight, fontSize * 2.5);
        return maxAdditionalMargin + 5; // +5px small safe padding
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
