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
import * as d3 from "d3";
import Selection = d3.Selection;
import LinearScale = d3.ScaleLinear;

// powerbi
import powerbi from "powerbi-visuals-api";
import IViewport = powerbi.IViewport;
import PrimitiveValue = powerbi.PrimitiveValue;
import DataViewCategorical = powerbi.DataViewCategorical;
import DataViewCategoryColumn = powerbi.DataViewCategoryColumn;
import DataViewValueColumns = powerbi.DataViewValueColumns;
import DataViewMetadataColumn = powerbi.DataViewMetadataColumn;
import DataView = powerbi.DataView;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstanceEnumeration = powerbi.VisualObjectInstanceEnumeration;

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

import { DefaultOpacity } from "./utils";
import { VisualSettings, LabelsSettings, LegendSettings, BaseAxisSettings } from "./settings";
import { BehaviorOptions, StreamGraphBehavior } from "./behavior"
import { createTooltipInfo } from "./tooltipBuilder";
import { StreamData, StreamGraphSeries, StreamDataPoint } from "./dataInterfaces";

// powerbi.extensibility.utils.svg
import * as SvgUtils from "powerbi-visuals-utils-svgutils";
import IMargin = SvgUtils.IMargin;
import translate = SvgUtils.manipulation.translate;
import ClassAndSelector = SvgUtils.CssConstants.ClassAndSelector;
import createClassAndSelector = SvgUtils.CssConstants.createClassAndSelector;

// powerbi.extensibility.utils.color
import { ColorHelper } from "powerbi-visuals-utils-colorutils";

// powerbi.extensibility.utils.interactivity
import { interactivityService } from "powerbi-visuals-utils-interactivityutils";
import appendClearCatcher = interactivityService.appendClearCatcher;
import IInteractivityService = interactivityService.IInteractivityService;
import IInteractiveBehavior = interactivityService.IInteractiveBehavior;
import createInteractivityService = interactivityService.createInteractivityService;

// powerbi.extensibility.utils.chart
import * as ChartUtils from "powerbi-visuals-utils-chartutils";
import ILegend = ChartUtils.legendInterfaces.ILegend;
import LegendIcon = ChartUtils.legendInterfaces.LegendIcon;
import LegendData = ChartUtils.legendInterfaces.LegendData;
import createLegend = ChartUtils.legend.createLegend;
import LegendPosition = ChartUtils.legendInterfaces.LegendPosition;
import AxisHelper = ChartUtils.axis;
import dataLabelUtils = ChartUtils.dataLabelUtils;
import ILabelLayout = ChartUtils.dataLabelInterfaces.ILabelLayout;
import IAxisProperties = ChartUtils.axisInterfaces.IAxisProperties;
import LegendDataPoint = ChartUtils.legendInterfaces.LegendDataPoint;
import { positionChartArea } from "powerbi-visuals-utils-chartutils/lib/legend/legend";
import { CreateAxisOptions } from "powerbi-visuals-utils-chartutils/lib/axis/axisInterfaces";

// powerbi.extensibility.utils.formatting
import * as FormattingUtils from "powerbi-visuals-utils-formattingutils";
import valueFormatter = FormattingUtils.valueFormatter.valueFormatter;
import TextProperties = FormattingUtils.textMeasurementService.TextProperties;
import IValueFormatter = FormattingUtils.valueFormatter.IValueFormatter;
import textMeasurementService = FormattingUtils.textMeasurementService.textMeasurementService;

// powerbi.extensibility.utils.type
import { pixelConverter as PixelConverter } from "powerbi-visuals-utils-typeutils";
import { ValueType } from "powerbi-visuals-utils-typeutils/lib/valueType";

// powerbi.extensibility.utils.tooltip
import { TooltipEventArgs, ITooltipServiceWrapper, createTooltipServiceWrapper } from "powerbi-visuals-utils-tooltiputils";

const ColumnDisplayName: string = "Visual_Column";

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
    private static LineLinearPoints: number = 3;
    private static TangentsLineLinear: number = 1;
    private static TangentsOffset: number = 2;
    private static FirstPi: number = 1;
    private static SecondPi: number = 2;
    private static TangentsSplitter: number = 5;
    private static PathPointDuplicator: number = 2;
    private static PathPointDelimiter: number = 3;
    private static MinLineSlope: number = 1e-6;
    private static LineSlopeS: number = 9;
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
    private axes: d3.Selection<d3.BaseType, any, any, any>;
    private axisX: d3.Selection<d3.BaseType, any, any, any>;
    private axisY: d3.Selection<d3.BaseType, any, any, any>;
    private xAxisProperties: IAxisProperties;
    private yAxisProperties: IAxisProperties;
    private static XAxisOnSize: number = 20;
    private static XAxisOffSize: number = 10;
    private static YAxisOnSize: number = 25;
    private static YAxisOffSize: number = 10;
    private static XAxisLabelSize: number = 20;
    private static YAxisLabelSize: number = 20;
    private static AxisLabelMiddle: number = 2;
    private static AxisTextNodeTextAnchorForAngel0: string = "middle";
    private static AxisTextNodeDXForAngel0: string = "0em";
    private static AxisTextNodeDYForAngel0: string = "1em";
    private static YAxisLabelAngle: string = "rotate(-90)";
    private static YAxisLabelDy: number = 30;
    private static XAxisLabelDy: string = "-0.5em";
    private margin: IMargin = {
        left: StreamGraph.YAxisOnSize,
        right: -20,
        bottom: StreamGraph.XAxisOnSize,
        top: 0
    };
    private static DefaultMaxNumberOfAxisXValues: number = 5;

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
    private interactivityService: IInteractivityService;

    private tooltipServiceWrapper: ITooltipServiceWrapper;
    private svg: Selection<d3.BaseType, any, any, any>;
    private clearCatcher: Selection<d3.BaseType, any, any, any>;
    private dataPointsContainer: Selection<d3.BaseType, any, any, any>;

    private localizationManager: ILocalizationManager;

    constructor(options: VisualConstructorOptions) {
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

    public static isNumber(value: PrimitiveValue) {
        return !isNaN(value as number) && isFinite(value as number) && value !== null;
    }

    public static converter(
        dataView: DataView,
        colorPalette: IColorPalette,
        interactivityService: IInteractivityService,
        visualHost: IVisualHost
    ): StreamData {

        if (!dataView
            || !dataView.categorical
            || !dataView.categorical.values
            || !dataView.categorical.categories
            || !colorPalette) {
            return null;
        }

        let xMaxValue: number = -Number.MAX_VALUE;
        let xMinValue: number = Number.MAX_VALUE;
        let yMaxValue: number = -Number.MAX_VALUE;
        let yMinValue: number = Number.MAX_VALUE;

        let categorical: DataViewCategorical = dataView.categorical,
            categories: DataViewCategoryColumn[] = categorical.categories,
            values: DataViewValueColumns = categorical.values,
            series: StreamGraphSeries[] = [],
            legendData: LegendData = {
                dataPoints: [],
                title: values.source
                    ? values.source.displayName
                    : LegendSettings.DefaultTitleText,
            },
            value: number = 0,
            valuesFormatter: IValueFormatter,
            categoryFormatter: IValueFormatter;

        const category: DataViewCategoryColumn = categories && categories.length > 0
            ? categories[0]
            : null;

        const colorHelper: ColorHelper = new ColorHelper(colorPalette);

        const hasHighlights: boolean = !!(values.length > 0 && values[0].highlights);

        const settings: VisualSettings = StreamGraph.parseSettings(dataView, colorHelper);

        const fontSizeInPx: string = PixelConverter.fromPoint(settings.labels.fontSize);

        for (let valueIndex: number = 0; valueIndex < values.length; valueIndex++) {
            let label: string = values[valueIndex].source.groupName as string,
                identity: ISelectionId = null;

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
                    icon: LegendIcon.Box,
                    selected: false
                });
            }

            series[valueIndex] = {
                color,
                identity,
                tooltipInfo,
                dataPoints: [],
                highlight: hasHighlights,
                selected: false
            };

            const dataPointsValues: PrimitiveValue[] = values[valueIndex].values;

            if (dataPointsValues.length === 0) {
                continue;
            }

            for (let dataPointValueIndex: number = 0; dataPointValueIndex < dataPointsValues.length; dataPointValueIndex++) {
                const y: number = hasHighlights
                    ? values[valueIndex].highlights[dataPointValueIndex] as number
                    : dataPointsValues[dataPointValueIndex] as number;

                if (y > value) {
                    value = y;
                }
                let streamDataPoint: StreamDataPoint = {
                    x: dataPointValueIndex,
                    y: StreamGraph.isNumber(y)
                        ? y
                        : StreamGraph.DefaultValue,
                    text: label,
                    labelFontSize: fontSizeInPx
                };
                series[valueIndex].dataPoints.push(streamDataPoint);
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
        if (interactivityService) {
            interactivityService.applySelectionStateToData(series);
        }

        valuesFormatter = valueFormatter.create({
            format: StreamGraph.ValuesFormat,
            value: value
        });

        categoryFormatter = valueFormatter.create({
            format: valueFormatter.getFormatStringByColumn(category.source),
            value: category.values
        });
        const metadata: DataViewMetadataColumn = category.source;

        const categoriesText: PrimitiveValue[] = category.values;
        if (categoriesText.length) {
            if (metadata.type.dateTime && categoriesText[0] instanceof Date) {
                xMinValue = (<Date>categoriesText[0]).getTime();
                xMaxValue = (<Date>categoriesText[categoriesText.length - 1]).getTime();
            } else if (metadata.type.numeric) {
                xMinValue = categoriesText[0] as number;
                xMaxValue = categoriesText[categoriesText.length - 1] as number;
            } else {
                xMinValue = 0;
                xMaxValue = categoriesText.length - 1;
            }
        }

        let textProperties: TextProperties = {
            text: xMaxValue.toString(),
            fontFamily: "sans-serif",
            fontSize: PixelConverter.toString(settings.categoryAxis.fontSize)
        };
        let xAxisValueMaxTextSize: number = textMeasurementService.measureSvgTextWidth(textProperties);
        let xAxisValueMaxTextHalfSize: number = xAxisValueMaxTextSize / 2;
        let textPropertiesY: TextProperties = {
            text: yMaxValue.toString(),
            fontFamily: "sans-serif",
            fontSize: PixelConverter.toString(settings.valueAxis.fontSize)
        };
        let yAxisValueMaxTextSize: number = textMeasurementService.measureSvgTextWidth(textPropertiesY);
        let yAxisValueMaxTextHalfSize: number = yAxisValueMaxTextSize / 2;
        let yAxisFontSize: number = +settings.valueAxis.fontSize;
        let yAxisFontHalfSize: number = yAxisFontSize / 2;
        let xAxisFontSize: number = +settings.categoryAxis.fontSize;
        let xAxisFontHalfSize: number = xAxisFontSize / 2;

        return {
            series,
            metadata,
            settings,
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
            xAxisValueMaxTextHalfSize,
            yAxisFontSize,
            yAxisFontHalfSize,
            xAxisFontSize,
            xAxisFontHalfSize
        };
    }

    private static parseSettings(dataView: DataView, colorHelper: ColorHelper): VisualSettings {
        const settings: VisualSettings = VisualSettings.parse<VisualSettings>(dataView);

        if (dataView
            && dataView.categorical
            && dataView.categorical.values
            && !settings.legend.titleText
        ) {

            const valuesSource: DataViewMetadataColumn = dataView.categorical.values.source,
                titleTextDefault: string = valuesSource
                    ? valuesSource.displayName
                    : settings.legend.titleText;

            settings.legend.titleText = titleTextDefault; // Force a value (shouldn't be empty with show=true)
        }

        settings.categoryAxis.labelColor = colorHelper.getHighContrastColor(
            "foreground",
            settings.categoryAxis.labelColor,
        );

        settings.valueAxis.labelColor = colorHelper.getHighContrastColor(
            "foreground",
            settings.valueAxis.labelColor,
        );

        settings.legend.labelColor = colorHelper.getHighContrastColor(
            "foreground",
            settings.legend.labelColor,
        );

        settings.labels.color = colorHelper.getHighContrastColor(
            "foreground",
            settings.labels.color,
        );

        return settings;
    }

    public init(options: VisualConstructorOptions): void {
        d3.select("html").style(
            "-webkit-tap-highlight-color", "transparent" // Turns off the blue highlighting at mobile browsers
        );

        this.visualHost = options.host;
        this.colorPalette = options.host.colorPalette;
        this.localizationManager = options.host.createLocalizationManager();

        const element: HTMLElement = options.element;

        this.tooltipServiceWrapper = createTooltipServiceWrapper(
            this.visualHost.tooltipService,
            element);

        this.svg = d3.select(element)
            .append("svg")
            .classed(StreamGraph.VisualClassName, true);

        this.clearCatcher = appendClearCatcher(this.svg);

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

        this.dataPointsContainer = this.svg
            .append("g")
            .classed(StreamGraph.DataPointsContainer, true);

        this.behavior = new StreamGraphBehavior();

        this.interactivityService = createInteractivityService(this.visualHost);

        this.legend = createLegend(
            element,
            false,
            this.interactivityService,
            true,
        );
    }

    public update(options: VisualUpdateOptions): void {
        if (!options
            || !options.dataViews
            || !options.dataViews[0]
            || !options.dataViews[0].categorical
        ) {
            this.clearData();
            return;
        }

        this.viewport = StreamGraph.getViewport(options.viewport);
        this.dataView = options.dataViews[0];

        if (options.type !== 4 && options.type !== 32) {
            this.data = StreamGraph.converter(
                this.dataView,
                this.colorPalette,
                this.interactivityService,
                this.visualHost
            );
        }

        if (!this.data
            || !this.data.series
            || !this.data.series.length
        ) {
            this.clearData();
            return;
        }

        this.renderLegend(this.data);
        this.updateViewport();

        this.svg.attr("width", PixelConverter.toString(this.viewport.width));
        this.svg.attr("height", PixelConverter.toString(this.viewport.height));

        const selection: Selection<d3.BaseType, StreamGraphSeries, any, any> = this.renderChart(
            this.data.series,
            StreamGraph.AnimationDuration
        );

        this.calculateAxes();

        this.tooltipServiceWrapper.addTooltip(
            selection,
            (tooltipEvent: TooltipEventArgs<StreamGraphSeries>) => {
                const tooltipInfo: VisualTooltipDataItem[] = tooltipEvent.data.tooltipInfo;

                return tooltipInfo.length > 0
                    ? tooltipInfo
                    : null;
            });

        const interactivityService: IInteractivityService = this.interactivityService;

        if (interactivityService) {
            const behaviorOptions: BehaviorOptions = {
                selection,
                interactivityService,
                clearCatcher: this.clearCatcher
            };

            interactivityService.bind(
                this.data.series,
                this.behavior,
                behaviorOptions
            );

            this.behavior.renderSelection(false);
        }
    }

    private setTextNodesPosition(xAxisTextNodes: Selection<d3.BaseType, any, any, any>,
        textAnchor: string,
        dx: string,
        dy: string,
        transform: string): void {

        xAxisTextNodes
            .style("text-anchor", textAnchor)
            .attr("dx", dx)
            .attr("dy", dy)
            .attr("transform", transform);
    }

    private toggleAxisVisibility(
        isShown: boolean,
        className: string,
        axis: d3.Selection<d3.BaseType, any, any, any>): void {

        axis.classed(className, isShown);
        if (!isShown) {
            axis
                .selectAll("*")
                .remove();
        }
    }

    private static outerPadding: number = 0;

    private calculateAxes() {
        let showAxisTitle: boolean = this.data.settings.categoryAxis.showAxisTitle,
            categoryAxisLabelColor: string = this.data.settings.categoryAxis.labelColor,
            xShow: boolean = this.data.settings.categoryAxis.show,

            valueAxisLabelColor: string = this.data.settings.valueAxis.labelColor,
            yShow: boolean = this.data.settings.valueAxis.show;

        this.viewport.height -= StreamGraph.TickHeight + (showAxisTitle ? StreamGraph.XAxisLabelSize : 0);
        let effectiveWidth: number = Math.max(0, this.viewport.width - this.margin.left - (this.margin.right + this.data.xAxisValueMaxTextHalfSize));
        let effectiveHeight: number = Math.max(0, this.viewport.height - (this.margin.top + this.data.yAxisFontHalfSize) - this.margin.bottom + (showAxisTitle ? StreamGraph.XAxisLabelSize : 0));
        let metaDataColumnPercent: powerbi.DataViewMetadataColumn = {
            displayName: this.localizationManager.getDisplayName(ColumnDisplayName),
            type: ValueType.fromDescriptor({ numeric: true }),
            objects: {
                general: {
                    formatString: "0 %",
                }
            }
        };

        if (xShow) {
            const axisOptions: CreateAxisOptions = {
                pixelSpan: effectiveWidth,
                dataDomain: [this.data.xMinValue, this.data.xMaxValue],
                metaDataColumn: this.data.metadata,
                outerPadding: StreamGraph.outerPadding,
                formatString: null,
                isScalar: true,
                isVertical: false,
                // todo fix types issue
                getValueFn: (value, dataType): any => {
                    if (dataType.dateTime) {
                        return new Date(value);
                    } else if (dataType.text) {
                        return this.data.categoriesText[value];
                    }
                    return value;
                }
            }

            this.xAxisProperties = AxisHelper.createAxis(axisOptions);

            this.axisX.call(this.xAxisProperties.axis);

            this.axisX
                .style("fill", categoryAxisLabelColor)
                .style("stroke", categoryAxisLabelColor)
                .style("font-size", this.data.settings.categoryAxis.fontSize);

            let transformParams: any[] = [
                StreamGraph.AxisTextNodeTextAnchorForAngel0,
                StreamGraph.AxisTextNodeDXForAngel0,
                StreamGraph.AxisTextNodeDYForAngel0
            ];

            const xAxisTextNodes: Selection<d3.BaseType, any, any, any> = this.axisX.selectAll("text");

            this.setTextNodesPosition.apply(this, [xAxisTextNodes].concat(transformParams));
        }

        if (yShow) {
            this.yAxisProperties = AxisHelper.createAxis({
                pixelSpan: effectiveHeight,
                dataDomain: [this.data.yMinValue, this.data.yMaxValue],
                metaDataColumn: metaDataColumnPercent,
                formatString: null,
                outerPadding: StreamGraph.outerPadding,
                isCategoryAxis: false,
                isScalar: true,
                isVertical: true,
                useTickIntervalForDisplayUnits: true
            });

            this.axisY.call(this.yAxisProperties.axis);

            this.axisY
                .style("fill", valueAxisLabelColor)
                .style("stroke", valueAxisLabelColor)
                .style("font-size", this.data.settings.valueAxis.fontSize);
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
        const valueAxisSettings: BaseAxisSettings = this.data.settings.valueAxis;
        this.margin.left = valueAxisSettings.show
            ? StreamGraph.YAxisOnSize + this.data.yAxisValueMaxTextSize
            : StreamGraph.YAxisOffSize;

        if (valueAxisSettings.showAxisTitle) {
            this.margin.left += StreamGraph.YAxisLabelSize;

            const categoryAxisSettings: BaseAxisSettings = this.data.settings.categoryAxis,
                isXAxisOn: boolean = categoryAxisSettings.show,
                isXTitleOn: boolean = categoryAxisSettings.showAxisTitle,
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
            const yAxisLabel: Selection<d3.BaseType, any, any, any> = this.axes.append("text")
                .style("font-family", textSettings.fontFamily)
                .style("font-size", textSettings.fontSize)
                .style("font-style", textSettings.fontStyle)
                .style("font-weight", textSettings.fontWeight)
                .attr("transform", StreamGraph.YAxisLabelAngle)
                .attr("fill", valueAxisSettings.labelColor)
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

        const categoryAxisSettings: BaseAxisSettings = this.data.settings.categoryAxis;
        this.margin.bottom = categoryAxisSettings.show
            ? StreamGraph.XAxisOnSize + parseInt(this.data.settings.categoryAxis.fontSize.toString())
            : StreamGraph.XAxisOffSize;

        if (!categoryAxisSettings.showAxisTitle
            || !this.dataView.categorical.categories[0]
            || !this.dataView.categorical.categories[0].source) {
            return;
        }

        const valueAxisSettings: BaseAxisSettings = this.data.settings.valueAxis,
            isYAxisOn: boolean = valueAxisSettings.show,
            isYTitleOn: boolean = valueAxisSettings.showAxisTitle,
            leftMargin: number = (isYAxisOn
                ? StreamGraph.YAxisOnSize
                : StreamGraph.YAxisOffSize)
                + (isYTitleOn
                    ? StreamGraph.YAxisLabelSize
                    : StreamGraph.MinLabelSize),
            width: number = this.viewport.width - (this.margin.right + this.data.xAxisValueMaxTextHalfSize) - leftMargin,
            height: number = this.viewport.height + StreamGraph.XAxisLabelSize + StreamGraph.TickHeight;

        let xAxisText: string = this.dataView.categorical.categories[0].source.displayName;

        const textSettings: TextProperties = StreamGraph.getTextPropertiesFunction(xAxisText);

        xAxisText = textMeasurementService.getTailoredTextOrDefault(textSettings, width);

        const xAxisLabel: Selection<d3.BaseType, any, any, any> = this.axes.append("text")
            .style("font-family", textSettings.fontFamily)
            .style("font-size", textSettings.fontSize)
            .style("font-weight", textSettings.fontWeight)
            .attr("transform", translate(
                leftMargin + (width / StreamGraph.AxisLabelMiddle),
                height))
            .attr("fill", categoryAxisSettings.labelColor)
            .attr("dy", StreamGraph.XAxisLabelDy)
            .classed(StreamGraph.XAxisLabelSelector.className, true)
            .text(xAxisText);

        xAxisLabel.call(
            AxisHelper.LabelLayoutStrategy.clip,
            width,
            textMeasurementService.svgEllipsis);
    }

    private static getStreamGraphLabelLayout(
        xScale: LinearScale<number, number>,
        yScale: LinearScale<number, number>,
        labelsSettings: LabelsSettings
    ): ILabelLayout {

        const fontSize: string = PixelConverter.fromPoint(labelsSettings.fontSize);

        return {
            labelText: (dataPoint: StreamDataPoint) => dataPoint.text + (labelsSettings.showValue ? " " + dataPoint.y : ""),
            labelLayout: {
                x: (dataPoint: StreamDataPoint) => xScale(dataPoint.x),
                y: (dataPoint: StreamDataPoint) => yScale(dataPoint.y0)
            },
            filter: (dataPoint: StreamDataPoint) => {
                return dataPoint != null && dataPoint.text != null;
            },
            style: {
                "fill": labelsSettings.color,
                "font-size": fontSize,
            },
        };
    }

    /**
     * d3 line monotone interpolation with reduced tangents Y. Fixes bug 7322.
     * @param points
     */
    private static d3_svg_lineMonotone(points: number[]) {
        if (points.length < StreamGraph.LineLinearPoints) {
            return d3_svg_lineLinear(points);
        }

        let tangents: number[][] = d3_svg_lineMonotoneTangents(points);

        if (tangents.length < StreamGraph.TangentsLineLinear
            || points.length !== tangents.length
            && points.length !== tangents.length + StreamGraph.TangentsOffset) {

            return d3_svg_lineLinear(points);
        }

        tangents.forEach((tangentsGroup: number[]) => {
            tangentsGroup[1] = tangentsGroup[1] / StreamGraph.TangentsSplitter;
        });

        let quad: boolean = points.length !== tangents.length,
            path: string = "",
            p0: number = points[0],
            p: number = points[1],
            t0: number[] = tangents[0],
            t: number[] = t0,
            pi: number = StreamGraph.FirstPi;

        if (quad) {
            path += `Q${p[0] - t0[0] * StreamGraph.PathPointDuplicator / StreamGraph.PathPointDelimiter},${p[1] - t0[1] * StreamGraph.PathPointDuplicator / StreamGraph.PathPointDelimiter},${p[0]},${p[1]}`;

            p0 = points[1];
            pi = StreamGraph.SecondPi;
        }

        if (tangents.length > 1) {
            t = tangents[1];
            p = points[pi];

            pi++;

            path += `C${p0[0] + t0[0]},${p0[1] + t0[1]},${p[0] - t[0]},${p[1] - t[1]},${p[0]},${p[1]}`;

            for (let i: number = 2; i < tangents.length; i++ , pi++) {
                p = points[pi];
                t = tangents[i];

                path += `S${p[0] - t[0]},${p[1] - t[1]},${p[0]},${p[1]}`;
            }
        }

        if (quad) {
            let lp: number = points[pi];

            path += `Q${p[0] + t[0] * StreamGraph.PathPointDuplicator / StreamGraph.PathPointDelimiter},${p[1] + t[1] * StreamGraph.PathPointDuplicator / StreamGraph.PathPointDelimiter},${lp[0]},${lp[1]}`;
        }

        return points[0] + path;

        function d3_svg_lineMonotoneTangents(points: number[]) {
            let tangents: number[][] = [],
                d: number,
                a: number,
                b: number,
                s: number,
                m: number[] = d3_svg_lineFiniteDifferences(points),
                i: number = -1,
                j: number = points.length - 1;

            while (++i < j) {
                d = d3_svg_lineSlope(points[i], points[i + 1]);

                if (Math.abs(d) < StreamGraph.MinLineSlope) {
                    m[i] = m[i + 1] = 0;
                } else {
                    a = m[i] / d;
                    b = m[i + 1] / d;
                    s = a * a + b * b;

                    if (s > StreamGraph.LineSlopeS) {
                        s = d * StreamGraph.PathPointDelimiter / Math.sqrt(s);

                        m[i] = s * a;
                        m[i + 1] = s * b;
                    }
                }
            }

            i = -1;

            while (++i <= j) {
                s = (points[Math.min(j, i + 1)][0] - points[Math.max(0, i - 1)][0])
                    / (StreamGraph.PathPointDuplicator * StreamGraph.PathPointDelimiter * (1 + m[i] * m[i]));

                tangents.push([s || 0, m[i] * s || 0]);
            }

            return tangents;
        }

        function d3_svg_lineFiniteDifferences(points: number[]): number[] {
            let i: number = 0,
                j: number = points.length - 1,
                m: number[] = [],
                p0: number = points[0],
                p1: number = points[1],
                d: number = m[0] = d3_svg_lineSlope(p0, p1);

            while (++i < j) {
                m[i] = (d + (d = d3_svg_lineSlope(p0 = p1, p1 = points[i + 1])))
                    / StreamGraph.PathPointDuplicator;
            }

            m[i] = d;

            return m;
        }

        function d3_svg_lineSlope(p0: number, p1: number): number {
            return (p1[1] - p0[1]) / (p1[0] - p0[0]);
        }

        function d3_svg_lineLinear(points: number[]): string {
            return points.join("L");
        }
    }

    private renderChart(
        series: StreamGraphSeries[],
        duration: number
    ): Selection<d3.BaseType, StreamGraphSeries, any, any> {

        const { width, height } = this.viewport;

        const stack: d3.Stack<any, StreamGraphSeries, StreamDataPoint> = d3
            .stack<StreamGraphSeries, StreamDataPoint>()
        // .value((series: StreamGraphSeries, k: StreamDataPoint) => {}
        // )
        //.values((series: StreamGraphSeries) => {
        //    return series.dataPoints;
        //});

        if (this.data.settings.general.wiggle) {
            stack.offset(d3.stackOffsetWiggle);
        }

        stack(series);

        this.margin.left = this.data.settings.valueAxis.show
            ? StreamGraph.YAxisOnSize + this.data.yAxisValueMaxTextSize
            : StreamGraph.YAxisOffSize;

        if (this.data.settings.valueAxis.showAxisTitle) {
            this.margin.left += StreamGraph.YAxisLabelSize;
        }

        this.margin.bottom = this.data.settings.categoryAxis.show
            ? StreamGraph.XAxisOnSize + this.data.xAxisFontSize
            : StreamGraph.XAxisOffSize;

        if (this.data.settings.categoryAxis.showAxisTitle) {
            this.margin.bottom += StreamGraph.XAxisLabelSize;
        }

        const layers: any[] = stack(series),
            margin: IMargin = this.margin,
            xScale: LinearScale<number, number> = d3.scaleLinear()
                .domain([0, series[0].dataPoints.length - 1])
                .range([margin.left, width - (margin.right + this.data.xAxisValueMaxTextHalfSize)]);

        const yMax: number = d3.max(layers, (series: StreamGraphSeries) => {
            return d3.max(series.dataPoints, (dataPoint: StreamDataPoint) => {
                return dataPoint.y0 + dataPoint.y;
            });
        });

        const yMin: number = d3.min(layers, (series: StreamGraphSeries) => {
            return d3.min(series.dataPoints, (dataPoint: StreamDataPoint) => {
                return dataPoint.y0 + dataPoint.y;
            });
        });

        const yScale: LinearScale<number, number> = d3.scaleLinear()
            .domain([Math.min(yMin, 0), yMax])
            .range([height - (margin.bottom + StreamGraph.TickHeight), (this.margin.top - this.data.yAxisFontHalfSize)])
            .nice();

        const area: d3.Area<StreamDataPoint> = d3.area<StreamDataPoint>()
            .curve(<any>StreamGraph.d3_svg_lineMonotone)
            .x((dataPoint: StreamDataPoint) => xScale(dataPoint.x))
            .y0((dataPoint: StreamDataPoint) => yScale(dataPoint.y0))
            .y1((dataPoint: StreamDataPoint) => yScale(dataPoint.y0 + dataPoint.y))
            .defined((dataPoint: StreamDataPoint) => StreamGraph.isNumber(dataPoint.y0) && StreamGraph.isNumber(dataPoint.y));

        const isHighContrast: boolean = this.colorPalette.isHighContrast;

        let selection: Selection<d3.BaseType, StreamGraphSeries, any, any> = this.dataPointsContainer
            .selectAll(StreamGraph.LayerSelector.selectorName)
            .data(layers);

        selection
            .exit()
            .remove();

        selection = selection
            .enter()
            .append("path")
            .classed(StreamGraph.LayerSelector.className, true)
            .merge(selection)
            .style("opacity", DefaultOpacity)
            .style("fill", isHighContrast
                ? null
                : (series: StreamGraphSeries) => series.color)
            .style("stroke", isHighContrast
                ? (series: StreamGraphSeries) => series.color
                : null);

        selection
            .transition()
            .duration(duration)
            .attr("d", (series: StreamGraphSeries) => {
                return area(series.dataPoints);
            });

        selection
            .selectAll("path")
            .append("g")
            .classed(StreamGraph.DataPointsContainer, true);

        if (this.data.settings.labels.show) {
            const labelsXScale: LinearScale<number, number> = d3.scaleLinear()
                .domain([0, series[0].dataPoints.length - 1])
                .range([0, width - margin.left - this.margin.right - this.data.xAxisValueMaxTextHalfSize]);

            const layout: ILabelLayout = StreamGraph.getStreamGraphLabelLayout(
                labelsXScale,
                yScale,
                this.data.settings.labels);

            // Merge all points into a single array
            let dataPointsArray: StreamDataPoint[] = [];

            series.forEach((seriesItem: StreamGraphSeries) => {
                let filteredDataPoints: StreamDataPoint[];

                filteredDataPoints = seriesItem.dataPoints.filter((dataPoint: StreamDataPoint) => {
                    return dataPoint && dataPoint.y !== null && dataPoint.y !== undefined;
                });

                if (filteredDataPoints.length > 0) {
                    dataPointsArray = dataPointsArray.concat(filteredDataPoints);
                }
            });

            const viewport: IViewport = {
                height: height - (this.margin.top + this.data.yAxisFontHalfSize) - margin.bottom,
                width: width - (this.margin.right + this.data.xAxisValueMaxTextHalfSize) - margin.left,
            };

            const labels: Selection<d3.BaseType, StreamDataPoint, any, any> =
                dataLabelUtils.drawDefaultLabelsForDataPointChart(
                    dataPointsArray,
                    this.svg,
                    layout,
                    viewport);

            if (labels) {
                const offset: number = StreamGraph.DefaultDataLabelsOffset + margin.left;

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

        return selection;
    }

    private renderLegend(streamGraphData: StreamData): void {
        const legendSettings: LegendSettings = streamGraphData.settings.legend;

        const title: string = legendSettings.showTitle
            ? legendSettings.titleText || streamGraphData.legendData.title
            : undefined;

        const dataPoints: LegendDataPoint[] = legendSettings.show
            ? streamGraphData.legendData.dataPoints
            : [];

        const legendData: LegendData = {
            ...streamGraphData.legendData,
            title,
            dataPoints,
            fontSize: legendSettings.fontSize,
            labelColor: legendSettings.labelColor,
        };

        debugger;
        this.legend.changeOrientation(LegendPosition[legendSettings.position]);

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
            fontSize: string = PixelConverter.fromPoint(LegendSettings.DefaultFontSizeInPoints),
            fontWeight: string = StreamGraph.DefaultFontWeight;
        return {
            text,
            fontSize,
            fontWeight,
            fontFamily
        };
    }

    public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration {
        const settings: VisualSettings = this.data && this.data.settings
            || VisualSettings.getDefault() as VisualSettings;

        return VisualSettings.enumerateObjectInstances(
            settings,
            options);
    }
}
