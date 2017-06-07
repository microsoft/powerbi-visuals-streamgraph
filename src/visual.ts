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

module powerbi.extensibility.visual {
    // d3
    import Axis = d3.svg.Axis;
    import Area = d3.svg.Area;
    import Selection = d3.Selection;
    import LinearScale = d3.scale.Linear;
    import StackLayout = d3.layout.Stack;
    import UpdateSelection = d3.selection.Update;

    // powerbi.visuals
    import ISelectionId = powerbi.visuals.ISelectionId;

    // powerbi.extensibility.visual
    import DefaultOpacity = utils.DefaultOpacity;
    import LabelsSettings = settings.LabelsSettings;
    import VisualSettings = settings.VisualSettings;
    import LegendSettings = settings.LegendSettings;
    import BehaviorOptions = behavior.BehaviorOptions;
    import BaseAxisSettings = settings.BaseAxisSettings;
    import XAxisSettings = settings.XAxisSettings;
    import StreamGraphBehavior = behavior.StreamGraphBehavior;
    import createTooltipInfo = tooltipBuilder.createTooltipInfo;

    // powerbi.extensibility.utils.dataview
    import DataViewObjects = powerbi.extensibility.utils.dataview.DataViewObjects;

    // powerbi.extensibility.utils.svg
    import IMargin = powerbi.extensibility.utils.svg.IMargin;
    import translate = powerbi.extensibility.utils.svg.translate;
    import ClassAndSelector = powerbi.extensibility.utils.svg.CssConstants.ClassAndSelector;
    import createClassAndSelector = powerbi.extensibility.utils.svg.CssConstants.createClassAndSelector;

    // powerbi.extensibility.utils.interactivity
    import appendClearCatcher = powerbi.extensibility.utils.interactivity.appendClearCatcher;
    import IInteractiveBehavior = powerbi.extensibility.utils.interactivity.IInteractiveBehavior;
    import IInteractivityService = powerbi.extensibility.utils.interactivity.IInteractivityService;
    import createInteractivityService = powerbi.extensibility.utils.interactivity.createInteractivityService;

    // powerbi.extensibility.utils.chart
    import legend = powerbi.extensibility.utils.chart.legend;
    import ILegend = legend.ILegend;
    import LegendIcon = legend.LegendIcon;
    import LegendData = legend.LegendData;
    import LegendDataModule = legend.data;
    import legendProps = legend.legendProps;
    import createLegend = legend.createLegend;
    import LegendPosition = legend.LegendPosition;
    import AxisHelper = powerbi.extensibility.utils.chart.axis;
    import dataLabelUtils = powerbi.extensibility.utils.chart.dataLabel.utils;
    import ILabelLayout = powerbi.extensibility.utils.chart.dataLabel.ILabelLayout;

    // powerbi.extensibility.utils.formatting
    import valueFormatter = powerbi.extensibility.utils.formatting.valueFormatter;
    import TextProperties = powerbi.extensibility.utils.formatting.TextProperties;
    import IValueFormatter = powerbi.extensibility.utils.formatting.IValueFormatter;
    import textMeasurementService = powerbi.extensibility.utils.formatting.textMeasurementService;

    // powerbi.extensibility.utils.type
    import PixelConverter = powerbi.extensibility.utils.type.PixelConverter;

    // powerbi.extensibility.utils.tooltip
    import TooltipEventArgs = powerbi.extensibility.utils.tooltip.TooltipEventArgs;
    import ITooltipServiceWrapper = powerbi.extensibility.utils.tooltip.ITooltipServiceWrapper;
    import createTooltipServiceWrapper = powerbi.extensibility.utils.tooltip.createTooltipServiceWrapper;

    interface MeasureFunction {
        (textProperties: TextProperties, text?: string): number;
    }

    interface MeasureTickFunction {
        (value: number): any;
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

        private static DefaultMaxNumberOfAxisXValues: number = 5;

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

        private static AxisOrientationTop: string = "top";
        private static AxisOrientationBottom: string = "bottom";

        private static MaxTicks: number = 2;
        private static TickHeight: number = 6;

        private static YAxisLabelAngle: string = "rotate(-90)";
        private static YAxisLabelDy: string = "1em";
        private static XAxisLabelDy: string = "-0.5em";

        private static EmptyDisplayName: string = "";

        private static MinLabelSize: number = 0;

        private static MaxAxisLabelSize: number = 160;

        private static MiddleOfTheLabel: number = 2;
        private static AxisLabelFactor: number = 2;
        private static AxisLabelMiddle: number = 2;

        private static DefaultDataLabelsOffset: number = 4;
        private static DefaultLabelTickWidth: number = 10;

        private static XAxisLabelSize: number = 20;
        private static XAxisOffSize: number = 10;
        private static XAxisOnSize: number = 20;
        private static YAxisLabelSize: number = 20;
        private static YAxisOffSize: number = 10;
        private static YAxisOnSize: number = 45;

        private static DataPointsContainer = "dataPointsContainer";
        private static AxisGraphicsContextClassName = "axisGraphicsContext";

        private static XAxisClassName = "x axis";
        private static YAxisClassName = "y axis";

        private static DefaultFontFamily: string = "helvetica, arial, sans-serif";
        private static DefaultFontWeight: string = "normal";

        private static LayerSelector: ClassAndSelector = createClassAndSelector("layer");
        private static XAxisLabelSelector: ClassAndSelector = createClassAndSelector("xAxisLabel");
        private static YAxisLabelSelector: ClassAndSelector = createClassAndSelector("yAxisLabel");

        private static Sin60: number = 0.8660266281835431;
        private static Cos60: number = 0.5000001943375613;
        private static XAxisLabelHeightViewportMaxPercent: number = 0.25;

        private margin: IMargin = {
            left: StreamGraph.YAxisOnSize,
            right: 15,
            bottom: StreamGraph.XAxisOnSize,
            top: 10
        };

        private visualHost: IVisualHost;

        private legend: ILegend;
        private data: StreamData;
        private axisLabelProperties: AxisLabelProperties;
        private dataView: DataView;
        private viewport: IViewport;
        private colorPalette: IColorPalette;
        private behavior: IInteractiveBehavior;
        private interactivityService: IInteractivityService;

        private tooltipServiceWrapper: ITooltipServiceWrapper;

        private svg: Selection<any>;
        private xAxis: Selection<any>;
        private yAxis: Selection<any>;
        private clearCatcher: Selection<any>;
        private axisGraphicsContext: Selection<any>;
        private dataPointsContainer: Selection<any>;

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

        public static converter(
            dataView: DataView,
            colorPalette: IColorPalette,
            interactivityService: IInteractivityService,
            visualHost: IVisualHost): StreamData {

            if (!dataView
                || !dataView.categorical
                || !dataView.categorical.values
                || !dataView.categorical.categories
                || !colorPalette) {
                return null;
            }

            let maxNumberOfAxisXValues: number = StreamGraph.DefaultMaxNumberOfAxisXValues,
                categorical: DataViewCategorical = dataView.categorical,
                categories: DataViewCategoricalColumn[] = categorical.categories,
                values: DataViewValueColumns = categorical.values,
                series: StreamGraphSeries[] = [],
                legendData: LegendData = {
                    dataPoints: [],
                    title: values.source
                        ? values.source.displayName
                        : LegendSettings.DefaultTitleText,
                    fontSize: LegendSettings.DefaultFontSizeInPoints,
                },
                value: number = 0,
                valuesFormatter: IValueFormatter,
                categoryFormatter: IValueFormatter;

            const category: DataViewCategoricalColumn = categories && categories.length > 0
                ? categories[0]
                : null;

            const hasHighlights: boolean = !!(values.length > 0 && values[0].highlights),
                visualSettings: VisualSettings = StreamGraph.parseSettings(dataView),
                fontSizeInPx: string = PixelConverter.fromPoint(visualSettings.labels.fontSize);

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
                    { categories: null, values: values },
                    valueIndex);

                if (!label) {
                    if (tooltipInfo
                        && tooltipInfo[0]
                        && tooltipInfo[0].value) {
                        label = tooltipInfo[0].value;
                    } else {
                        label = values[valueIndex].source.displayName;
                    }
                }

                if (label) {
                    legendData.dataPoints.push({
                        label,
                        identity,
                        color: colorPalette.getColor(valueIndex.toString()).value,
                        icon: LegendIcon.Box,
                        selected: false
                    });
                }

                series[valueIndex] = {
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

                    series[valueIndex].dataPoints.push({
                        x: dataPointValueIndex,
                        y: isNaN(y)
                            ? StreamGraph.DefaultValue
                            : y,
                        text: label,
                        labelFontSize: fontSizeInPx
                    });
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

            const categoriesText: string[] = [];

            for (let categoryValueIndex: number = 0; categoryValueIndex < category.values.length; categoryValueIndex++) {
                let formattedValue: string = undefined;

                if (category.values[categoryValueIndex] != null) {
                    formattedValue = categoryFormatter.format(category.values[categoryValueIndex]);

                    let textLength: number = textMeasurementService.measureSvgTextWidth(
                        this.getTextPropertiesFunction(formattedValue));

                    /** shorter length recieved from Canvas pixel context element width measuring in different browsers
                     * so getTailoredTextOrDefault cuts string even if it fits well
                     * adjust to + 1px
                     */
                    textLength += 1;

                    if (textLength > maxNumberOfAxisXValues) {
                        maxNumberOfAxisXValues = textLength;
                    }
                }

                categoriesText.push(formattedValue);
            }

            return {
                series,
                legendData,
                categoriesText,
                categoryFormatter,
                maxNumberOfAxisXValues,
                settings: visualSettings,
                valueFormatter: valuesFormatter
            };
        }

        private static parseSettings(dataView: DataView): VisualSettings {
            const settings: VisualSettings = VisualSettings.parse<VisualSettings>(dataView);

            if (dataView
                && dataView.categorical
                && dataView.categorical.values
                && _.isEmpty(settings.legend.titleText)) {

                const valuesSource: DataViewMetadataColumn = dataView.categorical.values.source,
                    titleTextDefault: string = valuesSource
                        ? valuesSource.displayName
                        : settings.legend.titleText;

                settings.legend.titleText = titleTextDefault; // Force a value (shouldn't be empty with show=true)
            }

            return settings;
        }

        public static getAxisProperties(data: StreamData, viewportHeight: number): AxisLabelProperties {
            const needToRotate: boolean = data.settings.categoryAxis.rotateLabels;
            let maxTextSize: number = StreamGraph.MaxAxisLabelSize,
                settings: AxisLabelProperties = {
                    maxTextWidth: maxTextSize,
                    needToRotate: needToRotate,
                    marginLeft: data.settings.valueAxis.show ? StreamGraph.YAxisOnSize : StreamGraph.YAxisOffSize,
                    marginBottom: data.settings.categoryAxis.show ? StreamGraph.XAxisOnSize : StreamGraph.XAxisOffSize
                };

            if (!data.settings.categoryAxis.show || !data.settings.categoryAxis.rotateLabels) {
                return settings;
            }

            if (needToRotate) {
                const longestLabelWidth: number = data.maxNumberOfAxisXValues;

                let leftLabelWidth: number = textMeasurementService.measureSvgTextWidth(this.getTextPropertiesFunction(data.categoriesText[0])),
                    rotatedLongestLabelHeight: number = longestLabelWidth * StreamGraph.Sin60;

                const isLabelHeightTooLarge: boolean = rotatedLongestLabelHeight > viewportHeight * StreamGraph.XAxisLabelHeightViewportMaxPercent;

                if (isLabelHeightTooLarge) {
                    const cutTextHeight: number = viewportHeight * StreamGraph.XAxisLabelHeightViewportMaxPercent,
                        diffFactor: number = cutTextHeight / rotatedLongestLabelHeight,
                        horizontalCutTextSize: number = cutTextHeight / StreamGraph.Sin60;

                    rotatedLongestLabelHeight = cutTextHeight;

                    maxTextSize = maxTextSize > horizontalCutTextSize ? horizontalCutTextSize : maxTextSize * diffFactor;
                    leftLabelWidth = leftLabelWidth * diffFactor;
                } else {
                    maxTextSize = maxTextSize > longestLabelWidth ? longestLabelWidth : maxTextSize;
                }

                const rotatedTextHeight: number = StreamGraph.XAxisLabelSize * StreamGraph.Sin60,
                    rotatedTextWidth: number = StreamGraph.XAxisLabelSize * StreamGraph.Cos60,
                    rotatedTickHeight: number = StreamGraph.TickHeight * StreamGraph.Sin60,
                    leftLabelBoxWidth: number = leftLabelWidth * StreamGraph.Cos60 + rotatedTextHeight,
                    marginBottom: number = rotatedLongestLabelHeight + rotatedTickHeight + rotatedTextWidth;

                settings.maxTextWidth = maxTextSize;

                settings.marginLeft = (data.settings.valueAxis.show || data.settings.categoryAxis.show)  && leftLabelBoxWidth > settings.marginLeft ? leftLabelBoxWidth : settings.marginLeft;
                settings.marginBottom = data.settings.categoryAxis.show && marginBottom > settings.marginBottom ? marginBottom : settings.marginBottom;
            }

            return settings;
        }

        public init(options: VisualConstructorOptions): void {
            d3.select("html").style({
                "-webkit-tap-highlight-color": "transparent" // Turns off the blue highlighting at mobile browsers
            });

            this.visualHost = options.host;
            this.colorPalette = options.host.colorPalette;

            const element: HTMLElement = options.element;

            this.tooltipServiceWrapper = createTooltipServiceWrapper(
                this.visualHost.tooltipService,
                element);

            this.svg = d3.select(element)
                .append("svg")
                .classed(StreamGraph.VisualClassName, true);

            this.clearCatcher = appendClearCatcher(this.svg);

            this.axisGraphicsContext = this.svg
                .append("g")
                .classed(StreamGraph.AxisGraphicsContextClassName, true);

            this.xAxis = this.axisGraphicsContext
                .append("g")
                .classed(StreamGraph.XAxisClassName, true);

            this.yAxis = this.axisGraphicsContext
                .append("g")
                .classed(StreamGraph.YAxisClassName, true);

            this.dataPointsContainer = this.svg
                .append("g")
                .classed(StreamGraph.DataPointsContainer, true);

            this.behavior = new StreamGraphBehavior();

            this.interactivityService = createInteractivityService(this.visualHost);

            this.legend = createLegend(
                $(element),
                false,
                this.interactivityService,
                true);
        }

        public update(options: VisualUpdateOptions): void {
            if (!options
                || !options.dataViews
                || !options.dataViews[0]
                || !options.dataViews[0].categorical) {

                this.clearData();
                return;
            };

            this.viewport = StreamGraph.getViewport(options.viewport);

            this.dataView = options.dataViews[0];

            if (options.type !== 4 && options.type !== 32 ) {
                this.data = StreamGraph.converter(
                    this.dataView,
                    this.colorPalette,
                    this.interactivityService,
                    this.visualHost);
            }

            this.axisLabelProperties = StreamGraph.getAxisProperties(this.data, this.viewport.height);

            if (!this.data
                || !this.data.series
                || !this.data.series.length) {

                this.clearData();
                return;
            }

            this.renderLegend(this.data);
            this.renderXAxisLabels();
            this.renderYAxisLabels();

            this.svg.attr({
                "width": PixelConverter.toString(this.viewport.width),
                "height": PixelConverter.toString(this.viewport.height)
            });

            const selection: UpdateSelection<StreamGraphSeries> = this.renderChart(
                this.data.series,
                StreamGraph.AnimationDuration);

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
                    behaviorOptions);

                this.behavior.renderSelection(false);
            }
        }

        private static getStreamGraphLabelLayout(
            xScale: LinearScale<number, number>,
            yScale: LinearScale<number, number>,
            labelsSettings: LabelsSettings): ILabelLayout {

            const fontSize: string = PixelConverter.fromPoint(labelsSettings.fontSize);

            return {
                labelText: (dataPoint: StreamDataPoint) => dataPoint.text,
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
            duration: number): UpdateSelection<StreamGraphSeries> {

            const { width, height } = this.viewport;

            const stack: StackLayout<StreamGraphSeries, StreamDataPoint> = d3.layout
                .stack<StreamGraphSeries, StreamDataPoint>()
                .values((series: StreamGraphSeries) => {
                    return series.dataPoints;
                });

            if (this.data.settings.general.wiggle) {
                stack.offset("wiggle");
            }

            const layers: StreamGraphSeries[] = stack(series),
                margin: IMargin = this.margin,
                xScale: LinearScale<number, number> = d3.scale.linear()
                    .domain([0, series[0].dataPoints.length - 1])
                    .range([margin.left, width - margin.right]);

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

            const yScale: LinearScale<number, number> = d3.scale.linear()
                .domain([Math.min(yMin, 0), yMax])
                .range([height - margin.bottom, margin.top])
                .nice();

            const area: Area<StreamDataPoint> = d3.svg.area<StreamDataPoint>()
                .interpolate(<any>StreamGraph.d3_svg_lineMonotone)
                .x((dataPoint: StreamDataPoint) => xScale(dataPoint.x))
                .y0((dataPoint: StreamDataPoint) => yScale(dataPoint.y0))
                .y1((dataPoint: StreamDataPoint) => yScale(dataPoint.y0 + dataPoint.y))
                .defined((dataPoint: StreamDataPoint) => !isNaN(dataPoint.y0) && !isNaN(dataPoint.y));

            const selection: UpdateSelection<StreamGraphSeries> = this.dataPointsContainer
                .selectAll(StreamGraph.LayerSelector.selector)
                .data(layers);

            selection.enter()
                .append("path")
                .classed(StreamGraph.LayerSelector.class, true);

            selection
                .style({
                    "fill": (dataPoint: StreamGraphSeries, index: number) => {
                        return this.colorPalette.getColor(index.toString()).value;
                    },
                    "fill-opacity": DefaultOpacity
                })
                .transition()
                .duration(duration)
                .attr("d", (series: StreamGraphSeries) => {
                    return area(series.dataPoints);
                });

            selection
                .selectAll("path")
                .append("g")
                .classed(StreamGraph.DataPointsContainer, true);

            selection
                .exit()
                .remove();

            if (this.data.settings.labels.show) {
                const labelsXScale: LinearScale<number, number> = d3.scale.linear()
                    .domain([0, series[0].dataPoints.length - 1])
                    .range([0, width - margin.left - margin.right]);

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
                    height: height - margin.top - margin.bottom,
                    width: width - margin.right - margin.left,
                };

                const labels: UpdateSelection<StreamDataPoint> =
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

            this.drawAxis(this.data, xScale, yScale);

            return selection;
        }

        private drawAxis(
            data: StreamData,
            xScale: LinearScale<number, number>,
            yScale: LinearScale<number, number>): void {
            const categoriesText: string[] = this.data.categoriesText;
            const axisLabelProperties: AxisLabelProperties = this.axisLabelProperties;
            let maxNumberOfAxisXValues: number = this.data.maxNumberOfAxisXValues;

            const margin: IMargin = this.margin,
                shiftY: number = this.viewport.height - margin.bottom,
                shiftX: number = this.viewport.width - margin.right - margin.left,
                xAxis: Axis = d3.svg.axis();

            xAxis.scale(xScale)
                .orient("bottom")
                .ticks(categoriesText.length)
                .tickFormat((index: number): string => {
                    let item: string = categoriesText[index];
                    if (!!item) {
                        let textWidth: number = this.axisLabelProperties.maxTextWidth;

                        if (data.categoryFormatter) {
                            item = data.categoryFormatter.format(item);
                        }

                        if (!axisLabelProperties.needToRotate && index !== null
                            && index !== undefined
                            && (index === 0 || index === categoriesText.length - 1)) {

                            textWidth = (index ? margin.right : margin.left) * StreamGraph.AxisLabelFactor;
                        }

                        item = textMeasurementService.getTailoredTextOrDefault(
                                StreamGraph.getTextPropertiesFunction(item),
                                textWidth);

                        return item;
                    }

                    return null;
                });

            const yAxis: Axis = d3.svg.axis()
                .scale(yScale)
                .orient("left")
                .tickFormat((item: string): string => {
                    let temporaryItem: string = item;

                    if (data.valueFormatter) {
                        temporaryItem = data.valueFormatter.format(temporaryItem);
                    }

                    const maxWidth: number = StreamGraph.YAxisOnSize - StreamGraph.DefaultLabelTickWidth;

                    temporaryItem = textMeasurementService.getTailoredTextOrDefault(
                        StreamGraph.getTextPropertiesFunction(temporaryItem.toString()),
                        maxWidth);

                    return temporaryItem;
                });

            const maxTextWidth: number = axisLabelProperties.needToRotate ? axisLabelProperties.maxTextWidth : maxNumberOfAxisXValues,
                maxTicksByTextWidth: number = Math.round(shiftX / maxTextWidth);

            this.setMaxTicks(
                xAxis,
                shiftX,
                Math.max(
                    StreamGraph.MaxTicks,
                    maxTicksByTextWidth));

            this.setMaxTicks(yAxis, shiftY);

            const valueAxisSettings: BaseAxisSettings = this.data.settings.valueAxis;

            if (valueAxisSettings.show) {
                const axisColor: string = valueAxisSettings.labelColor;

                this.yAxis
                    .attr("transform", translate(margin.left, 0))
                    .call(yAxis);

                this.yAxis
                    .selectAll("text")
                    .style("fill", axisColor);
            } else {
                this.yAxis
                    .selectAll("*")
                    .remove();
            }

            const categoryAxisSettings: XAxisSettings = this.data.settings.categoryAxis;

            if (categoryAxisSettings.show) {
                const axisColor: string = categoryAxisSettings.labelColor;

                this.xAxis
                    .attr("transform", translate(0, shiftY))
                    .call(xAxis);
                if (axisLabelProperties.needToRotate) {
                    this.xAxis
                        .selectAll("text")
                        .style("text-anchor", "end")
                        .attr({
                            "dx": "-.8em",
                            "dy": ".15em",
                            "transform": "rotate(-60)"
                        })
                        .style("fill", axisColor);
                } else {
                    this.xAxis
                        .selectAll("text")
                        .style("text-anchor", "middle")
                        .attr("dx", null)
                        .attr("dy", "0.75em")
                        .attr("transform", null)
                        .style("fill", axisColor);
                }

                this.xAxis
                    .selectAll(".tick")
                    .append("title")
                    .text((index) => {
                        const label: string = categoriesText[index];
                        if (!!label) {
                            return label;
                        }
                    });
            } else {
                this.xAxis
                    .selectAll("*")
                    .remove();
            }
        }

        private renderYAxisLabels(): void {
            this.axisGraphicsContext
                .selectAll(StreamGraph.YAxisLabelSelector.selector)
                .remove();

            const valueAxisSettings: BaseAxisSettings = this.data.settings.valueAxis;

            this.margin.left =  this.axisLabelProperties.marginLeft;

            if (valueAxisSettings.showAxisTitle) {
                this.margin.left += StreamGraph.YAxisLabelSize;

                const categoryAxisSettings: XAxisSettings = this.data.settings.categoryAxis,
                    isXAxisOn: boolean = categoryAxisSettings.show,
                    isXTitleOn: boolean = categoryAxisSettings.showAxisTitle,
                    axisLabelRotationSettings: AxisLabelProperties = this.axisLabelProperties,
                    marginTop: number = this.margin.top,
                    height: number = this.viewport.height
                        - marginTop
                        - (isXAxisOn
                            ? StreamGraph.XAxisOnSize
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

                const yAxisLabel: Selection<any> = this.axisGraphicsContext.append("text")
                    .style({
                        "font-family": textSettings.fontFamily,
                        "font-size": textSettings.fontSize,
                        "font-style": textSettings.fontStyle,
                        "font-weight": textSettings.fontWeight
                    })
                    .attr({
                        transform: StreamGraph.YAxisLabelAngle,
                        fill: valueAxisSettings.labelColor,
                        x: -(marginTop + (height / StreamGraph.AxisLabelMiddle)),
                        dy: StreamGraph.YAxisLabelDy
                    })
                    .classed(StreamGraph.YAxisLabelSelector.class, true)
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
            this.axisGraphicsContext
                .selectAll(StreamGraph.XAxisLabelSelector.selector)
                .remove();

            const categoryAxisSettings: BaseAxisSettings = this.data.settings.categoryAxis;

            this.margin.bottom = this.axisLabelProperties.marginBottom;

            if (!categoryAxisSettings.showAxisTitle
                || !this.dataView.categorical.categories[0]
                || !this.dataView.categorical.categories[0].source) {
                return;
            }

            this.margin.bottom += StreamGraph.XAxisLabelSize;

            const valueAxisSettings: BaseAxisSettings = this.data.settings.valueAxis,
                axisLabelRotationSettings: AxisLabelProperties = this.axisLabelProperties,
                isYAxisOn: boolean = valueAxisSettings.show,
                isYTitleOn: boolean = valueAxisSettings.showAxisTitle,
                leftMargin: number = axisLabelRotationSettings.marginLeft
                    + (isYTitleOn
                        ? StreamGraph.YAxisLabelSize
                        : StreamGraph.MinLabelSize),
                width: number = this.viewport.width - this.margin.right - leftMargin,
                height: number = this.viewport.height;

            let xAxisText: string = this.dataView.categorical.categories[0].source.displayName;

            const textSettings: TextProperties = StreamGraph.getTextPropertiesFunction(xAxisText);

            xAxisText = textMeasurementService.getTailoredTextOrDefault(textSettings, width);

            const xAxisLabel: Selection<any> = this.axisGraphicsContext.append("text")
                .style({
                    "font-family": textSettings.fontFamily,
                    "font-size": textSettings.fontSize,
                    "font-weight": textSettings.fontWeight
                })
                .attr({
                    class: StreamGraph.XAxisLabelSelector.class,
                    transform: translate(
                        leftMargin + (width / StreamGraph.AxisLabelMiddle),
                        height),
                    fill: categoryAxisSettings.labelColor,
                    dy: StreamGraph.XAxisLabelDy,
                })
                .classed(StreamGraph.XAxisLabelSelector.class, true)
                .text(xAxisText);

            xAxisLabel.call(
                AxisHelper.LabelLayoutStrategy.clip,
                width,
                textMeasurementService.svgEllipsis);
        }

        private renderLegend(streamGraphData: StreamData): void {
            const legendSettings: LegendSettings = streamGraphData.settings.legend,
                legendData: LegendData = streamGraphData.legendData;

            if (!this.dataView || !this.dataView.metadata) {
                return;
            }

            const legendObjectProperties: DataViewObject = DataViewObjects.getObject(
                this.dataView.metadata.objects,
                "legend",
                {});

            legendObjectProperties["titleText"] = legendSettings.titleText; // Force legend title when show = true

            LegendDataModule.update(legendData, legendObjectProperties);

            const position: string = legendObjectProperties[legendProps.position] as string;

            if (position) {
                this.legend.changeOrientation(LegendPosition[position]);
            }

            this.legend.drawLegend(legendData, _.clone(this.viewport));
            legend.positionChartArea(this.svg, this.legend);

            this.updateViewport();
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
                .selectAll(StreamGraph.LayerSelector.selector)
                .remove();

            this.legend.drawLegend(
                { dataPoints: [] },
                this.viewport);

            this.yAxis
                .selectAll("*")
                .remove();

            this.axisGraphicsContext
                .selectAll(StreamGraph.YAxisLabelSelector.selector)
                .remove();

            this.xAxis
                .selectAll("*")
                .remove();

            this.axisGraphicsContext
                .selectAll(StreamGraph.XAxisLabelSelector.selector)
                .remove();

            this.svg
                .select(".labels")
                .remove();
        }

        public onClearSelection(): void {
            if (this.interactivityService) {
                this.interactivityService.clearSelection();
            }
        }

        private setMaxTicks(axis: Axis, maxSize: number, maxValue?: number): void {
            const maxTicks = maxValue === undefined
                ? StreamGraph.getTicksByAxis(axis).length
                : Math.min(maxValue, StreamGraph.getTicksByAxis(axis).length);

            const axisScaleDomain: string = axis.scale().domain.toString(),
                scaleLinearDomain: string = d3.scale.linear().domain.toString();

            if (axisScaleDomain === scaleLinearDomain) {
                axis.ticks(this.axisLabelProperties.needToRotate ? maxTicks : StreamGraph.getFittedTickLength(axis, maxSize, maxTicks));
            } else {
                axis.tickValues(StreamGraph.getFittedTickValues(axis, maxSize, maxTicks));
            }
        }

        private static getFittedTickLength(axis: Axis, maxSize: number, maxTicks: number): number {
            let ticks: any[] = StreamGraph.getTicksByAxis(axis),
                measureTickFunction: (value: number) => any = StreamGraph.getMeasureTickFunction(axis, ticks);

            for (; maxTicks > 0
                && maxSize > 0
                && (StreamGraph.measureTicks(ticks, measureTickFunction) > maxSize
                    || axis.scale().ticks([maxTicks]).length > maxTicks);
                maxTicks-- , ticks = StreamGraph.getTicksByAxis(axis)) {

                axis.ticks(maxTicks);
            }

            return maxTicks;
        }

        private static getFittedTickValues(axis: Axis, maxSize: number, maxTicks: number): any[] {
            let ticks: any[] = StreamGraph.getTicksByAxis(axis),
                maxWidthOf2Ticks: number,
                tickPairsWidths: any[] = [],
                measureTickFunction: MeasureTickFunction = StreamGraph.getMeasureTickFunction(axis, ticks);

            for (let currentMaxTicks: number = maxTicks, indexes: number[] = [];
                maxTicks > 0 && maxSize > 0;
                currentMaxTicks-- , indexes = []) {

                switch (currentMaxTicks) {
                    case 0: {
                        return [];
                    }
                    case 1: {
                        indexes = [0];
                        break;
                    }
                    case 2: {
                        indexes = [0, ticks.length - 1];
                        break;
                    }
                    default: {
                        const takeEvery: number = ticks.length / (currentMaxTicks - 1);

                        for (let index: number = 0; index < currentMaxTicks - 1; index++) {
                            indexes.push(Math.round(takeEvery * index));
                        }

                        indexes.push(ticks.length - 1);

                        break;
                    }
                }

                const ticksIndexes: any[][] = indexes.map((index: number) => [ticks[index], index]);

                maxWidthOf2Ticks = (maxSize / ticks.length) * StreamGraph.AxisLabelFactor;

                ticksIndexes.reduce((firstIndexes: number[], secondIndexes: number[]) => {
                    tickPairsWidths.push([
                        measureTickFunction(firstIndexes[0]) + measureTickFunction(secondIndexes[0]),
                        (secondIndexes[1] - firstIndexes[1]) * maxWidthOf2Ticks
                    ]);

                    return secondIndexes;
                });

                if (!tickPairsWidths.some((tick: any[]) => tick[0] > tick[1])) {
                    return ticksIndexes.map((tick: any[]) => tick[0]);
                }
            }

            return [];
        }

        private static measureTicks(ticks: any[], measureTickFunction: MeasureTickFunction): number {
            return ticks
                .map((tick: any) => measureTickFunction(tick))
                .reduce((firstTick: number, secondTick: number) => firstTick + secondTick);
        }

        private static getTicksByAxis(axis: Axis): any[] {
            const scale: LinearScale<number, number> = axis.scale(),
                result: any[] = axis.tickValues() === null
                    ? scale.ticks
                        ? scale.ticks.apply(scale, axis.ticks())
                        : scale.domain()
                    : axis.tickValues();

            return result.length === undefined
                ? [result]
                : result;
        }

        private static getMeasureTickFunction(axis: Axis, ticks: string[]): MeasureTickFunction {
            const measureFunction: MeasureFunction = axis.orient() === StreamGraph.AxisOrientationTop
                || axis.orient() === StreamGraph.AxisOrientationBottom
                ? textMeasurementService.measureSvgTextWidth
                : textMeasurementService.measureSvgTextHeight;

            const cache: any = {};

            return function (x: any): number {
                return cache[x]
                    ? cache[x]
                    : cache[x] = StreamGraph.Cos60 * measureFunction(
                        StreamGraph.getTextPropertiesFunction(
                            axis.tickFormat()(x)))
                    + axis.tickPadding();
            };
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
}
