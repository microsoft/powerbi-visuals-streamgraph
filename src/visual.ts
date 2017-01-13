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
    import legendPosition = legend.position;
    import createLegend = legend.createLegend;
    import LegendPosition = legend.LegendPosition;
    import AxisHelper = powerbi.extensibility.utils.chart.axis;
    import dataLabelUtils = powerbi.extensibility.utils.chart.dataLabel.utils;
    import ILabelLayout = powerbi.extensibility.utils.chart.dataLabel.ILabelLayout;
    import VisualDataLabelsSettings = powerbi.extensibility.utils.chart.dataLabel.VisualDataLabelsSettings;
    import VisualDataLabelsSettingsOptions = powerbi.extensibility.utils.chart.dataLabel.VisualDataLabelsSettingsOptions;

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

    export class StreamGraph implements IVisual {
        private static VisualClassName = "streamGraph";

        private static AnimationDuration: number = 0;

        private static MinViewport: IViewport = {
            width: 150,
            height: 100
        };

        private static DataPointsContainer = "dataPointsContainer";
        private static DefaultDataLabelsOffset: number = 4;
        private static DefaultLabelTickWidth: number = 10;
        private static MaxNumberOfAxisXValues: number = 5;
        private static StreamGraphAxisGraphicsContextClassName = "axisGraphicsContext";
        private static StreamGraphDefaultFontFamily: string = "helvetica, arial, sans-serif";
        private static StreamGraphDefaultFontWeight: string = "normal";
        private static StreamGraphXAxisClassName = "x axis";
        private static StreamGraphYAxisClassName = "y axis";
        private static XAxisLabelSize: number = 20;
        private static XAxisOffSize: number = 10;
        private static XAxisOnSize: number = 20;
        private static YAxisLabelSize: number = 20;
        private static YAxisOffSize: number = 10;
        private static YAxisOnSize: number = 45;

        private static Layer: ClassAndSelector = createClassAndSelector("layer");
        private static XAxisLabel: ClassAndSelector = createClassAndSelector("xAxisLabel");
        private static YAxisLabel: ClassAndSelector = createClassAndSelector("yAxisLabel");

        private margin: IMargin = {
            left: StreamGraph.YAxisOnSize,
            right: 15,
            bottom: StreamGraph.XAxisOnSize,
            top: 10
        };

        private visualHost: IVisualHost;

        private legend: ILegend;
        private data: StreamData;
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
            colorPalett: IColorPalette,
            interactivityService: IInteractivityService,
            visualHost: IVisualHost): StreamData {

            if (!dataView
                || !dataView.categorical
                || !dataView.categorical.values
                || !dataView.categorical.categories
                || !colorPalett) {
                return null;
            }

            var catDv: DataViewCategorical = dataView.categorical,
                categories = catDv.categories,
                values: DataViewValueColumns = catDv.values,
                series: StreamGraphSeries[] = [],
                legendData: LegendData = {
                    dataPoints: [],
                    title: values.source ? values.source.displayName : "",
                    fontSize: LegendSettings.DefaultFontSizeInPoints,
                },
                value: number = 0,
                valuesFormatter: IValueFormatter,
                categoryFormatter: IValueFormatter;

            var category = categories && categories.length > 0 ? categories[0] : null;
            var hasHighlights: boolean = !!(values.length > 0 && values[0].highlights);

            const visualSettings: VisualSettings = StreamGraph.parseSettings(dataView);

            var fontSizeInPx = PixelConverter.fromPoint(visualSettings.labels.fontSize);

            for (var valueIndex = 0; valueIndex < values.length; valueIndex++) {
                var label: string = values[valueIndex].source.groupName as string;

                let identity: ISelectionId = null;

                if (visualHost) {
                    var categoryColumn: DataViewCategoryColumn = {
                        source: values[valueIndex].source,
                        values: null,
                        identity: [values[valueIndex].identity]
                    };

                    identity = visualHost.createSelectionIdBuilder()
                        .withCategory(categoryColumn, 0)
                        .withMeasure(values[valueIndex].source.queryName)
                        .createSelectionId();
                }

                var tooltipInfo: VisualTooltipDataItem[] = createTooltipInfo(
                    { categories: null, values: values },
                    valueIndex);

                if (!label) {
                    if (tooltipInfo &&
                        tooltipInfo[0] &&
                        tooltipInfo[0].value) {
                        label = tooltipInfo[0].value;
                    } else {
                        label = values[valueIndex].source.displayName;
                    }
                }

                if (label) {
                    legendData.dataPoints.push({
                        label: label,
                        color: colorPalett.getColor(valueIndex.toString()).value,
                        icon: LegendIcon.Box,
                        selected: false,
                        identity: identity,
                    });
                }

                series[valueIndex] = {
                    dataPoints: [],
                    tooltipInfo: tooltipInfo,
                    highlight: hasHighlights,
                    identity: identity,
                    selected: false,
                };

                var dataPointsValues = values[valueIndex].values;
                if (dataPointsValues.length === 0) {
                    continue;
                }

                for (var k = 0; k < dataPointsValues.length; k++) {
                    var y: number = <number>(hasHighlights ? values[valueIndex].highlights[k] : dataPointsValues[k]);
                    if (y > value) {
                        value = y;
                    }

                    series[valueIndex].dataPoints.push({
                        x: k,
                        y: isNaN(y) ? 0 : y,
                        text: label,
                        labelFontSize: fontSizeInPx
                    });
                }
            }

            if (interactivityService) {
                interactivityService.applySelectionStateToData(series);
            }

            valuesFormatter = valueFormatter.create({
                format: "g",
                value: value
            });

            categoryFormatter = valueFormatter.create({
                format: valueFormatter.getFormatStringByColumn(category.source),
                value: category.values
            });

            var categoriesText: string[] = [];
            var getTextPropertiesFunction = this.getTextPropertiesFunction;

            for (var index = 0; index < category.values.length; index++) {
                var formattedValue: string;
                if (category.values[index] != null) {
                    formattedValue = categoryFormatter.format(category.values[index]);
                    var textLength = textMeasurementService.measureSvgTextWidth(getTextPropertiesFunction(formattedValue));
                    if (textLength > StreamGraph.MaxNumberOfAxisXValues)
                        StreamGraph.MaxNumberOfAxisXValues = textLength;
                }
                categoriesText.push(formattedValue);
            }

            return {
                series,
                legendData,
                categoriesText,
                categoryFormatter,
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

        public init(options: VisualConstructorOptions): void {
            const element: HTMLElement = options.element;

            this.visualHost = options.host;
            this.colorPalette = options.host.colorPalette;

            this.tooltipServiceWrapper = createTooltipServiceWrapper(
                this.visualHost.tooltipService,
                element);

            this.svg = d3.select(element)
                .append("svg")
                .classed(StreamGraph.VisualClassName, true)
                .style("position", "absolute");

            this.clearCatcher = appendClearCatcher(this.svg);

            this.axisGraphicsContext = this.svg
                .append("g")
                .classed(StreamGraph.StreamGraphAxisGraphicsContextClassName, true);

            this.xAxis = this.axisGraphicsContext
                .append("g")
                .classed(StreamGraph.StreamGraphXAxisClassName, true);

            this.yAxis = this.axisGraphicsContext
                .append("g")
                .classed(StreamGraph.StreamGraphYAxisClassName, true);

            this.dataPointsContainer = this.svg
                .append("g")
                .classed(StreamGraph.DataPointsContainer, true);

            this.behavior = new StreamGraphBehavior();

            this.interactivityService = createInteractivityService(this.visualHost);
            this.legend = createLegend($(element), false, this.interactivityService, true);
        }

        public update(options: VisualUpdateOptions): void {
            if (!options.dataViews
                || !options.dataViews[0]
                || !options.dataViews[0].categorical) {

                this.clearData();
                return;
            };

            this.viewport = StreamGraph.getViewport(options.viewport);

            var dataView: DataView = this.dataView = options.dataViews[0];

            this.data = StreamGraph.converter(
                dataView,
                this.colorPalette,
                this.interactivityService,
                this.visualHost);

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

            var selection: UpdateSelection<StreamGraphSeries> = this.renderChart(
                this.data.series,
                StreamGraph.AnimationDuration);

            this.tooltipServiceWrapper.addTooltip(
                selection,
                (tooltipEvent: TooltipEventArgs<StreamGraphSeries>) => {
                    return tooltipEvent.data.tooltipInfo;
                });

            var interactivityService = this.interactivityService;

            if (interactivityService) {
                var behaviorOptions: BehaviorOptions = {
                    selection: selection,
                    clearCatcher: this.clearCatcher,
                    interactivityService: interactivityService,
                };

                interactivityService.bind(
                    this.data.series,
                    this.behavior,
                    behaviorOptions);
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
        private static d3_svg_lineMonotone(points) {
            if (points.length < 3) {
                return d3_svg_lineLinear(points);
            }

            let tangents = d3_svg_lineMonotoneTangents(points);

            if (tangents.length < 1 || points.length !== tangents.length && points.length !== tangents.length + 2) {
                return d3_svg_lineLinear(points);
            }

            tangents.forEach(x => x[1] = x[1] / 5);

            let quad = points.length !== tangents.length, path = "", p0 = points[0], p = points[1], t0 = tangents[0], t = t0, pi = 1;
            if (quad) {
                path += "Q" + (p[0] - t0[0] * 2 / 3) + "," + (p[1] - t0[1] * 2 / 3) + "," + p[0] + "," + p[1];
                p0 = points[1];
                pi = 2;
            }

            if (tangents.length > 1) {
                t = tangents[1];
                p = points[pi];
                pi++;
                path += "C" + (p0[0] + t0[0]) + "," + (p0[1] + t0[1]) + "," + (p[0] - t[0]) + "," + (p[1] - t[1]) + "," + p[0] + "," + p[1];
                for (let i = 2; i < tangents.length; i++ , pi++) {
                    p = points[pi];
                    t = tangents[i];
                    path += "S" + (p[0] - t[0]) + "," + (p[1] - t[1]) + "," + p[0] + "," + p[1];
                }
            }

            if (quad) {
                let lp = points[pi];
                path += "Q" + (p[0] + t[0] * 2 / 3) + "," + (p[1] + t[1] * 2 / 3) + "," + lp[0] + "," + lp[1];
            }

            return points[0] + path;

            function d3_svg_lineMonotoneTangents(points) {
                let tangents = [], d, a, b, s, m = d3_svg_lineFiniteDifferences(points), i = -1, j = points.length - 1;
                while (++i < j) {
                    d = d3_svg_lineSlope(points[i], points[i + 1]);
                    if (Math.abs(d) < 1e-6) {
                        m[i] = m[i + 1] = 0;
                    } else {
                        a = m[i] / d;
                        b = m[i + 1] / d;
                        s = a * a + b * b;
                        if (s > 9) {
                            s = d * 3 / Math.sqrt(s);
                            m[i] = s * a;
                            m[i + 1] = s * b;
                        }
                    }
                }

                i = -1;
                while (++i <= j) {
                    s = (points[Math.min(j, i + 1)][0] - points[Math.max(0, i - 1)][0]) / (6 * (1 + m[i] * m[i]));
                    tangents.push([s || 0, m[i] * s || 0]);
                }

                return tangents;
            }

            function d3_svg_lineFiniteDifferences(points) {
                let i = 0, j = points.length - 1, m = [], p0 = points[0], p1 = points[1], d = m[0] = d3_svg_lineSlope(p0, p1);
                while (++i < j) {
                    m[i] = (d + (d = d3_svg_lineSlope(p0 = p1, p1 = points[i + 1]))) / 2;
                }

                m[i] = d;
                return m;
            }

            function d3_svg_lineSlope(p0, p1) {
                return (p1[1] - p0[1]) / (p1[0] - p0[0]);
            }

            function d3_svg_lineLinear(points) {
                return points.join("L");
            }
        }

        private renderChart(series: StreamGraphSeries[], duration: number): UpdateSelection<StreamGraphSeries> {
            const { width, height } = this.viewport;

            var stack: StackLayout<StreamGraphSeries, StreamDataPoint> = d3.layout
                .stack<StreamGraphSeries, StreamDataPoint>()
                .values((series: StreamGraphSeries) => {
                    return series.dataPoints;
                });

            if (this.data.settings.general.wiggle) {
                stack.offset("wiggle");
            }

            var layers: StreamGraphSeries[] = stack(series);
            var margin: IMargin = this.margin;
            var xScale: LinearScale<number, number> = d3.scale.linear()
                .domain([0, series[0].dataPoints.length - 1])
                .range([margin.left, width - margin.right]);

            var yMax = d3.max(layers, (layer: StreamGraphSeries) => {
                return d3.max(layer.dataPoints, (d: StreamDataPoint) => {
                    return d.y0 + d.y;
                });
            });

            var yMin = d3.min(layers, (layer: StreamGraphSeries) => {
                return d3.min(layer.dataPoints, (d: StreamDataPoint) => {
                    return d.y0 + d.y;
                });
            });

            var yScale: LinearScale<number, number> = d3.scale.linear()
                .domain([Math.min(yMin, 0), yMax])
                .range([height - margin.bottom, margin.top])
                .nice();

            let area: Area<StreamDataPoint> = d3.svg.area<StreamDataPoint>()
                .interpolate(<any>StreamGraph.d3_svg_lineMonotone)
                .x(d => xScale(d.x))
                .y0(d => yScale(d.y0))
                .y1(d => yScale(d.y0 + d.y))
                .defined((d: StreamDataPoint) => !isNaN(d.y0) && !isNaN(d.y));

            var selection: UpdateSelection<StreamGraphSeries> = this.dataPointsContainer
                .selectAll(StreamGraph.Layer.selector)
                .data(layers);

            selection.enter()
                .append("path")
                .classed(StreamGraph.Layer.class, true);

            selection
                .style("fill", (d: StreamGraphSeries, index: number) => {
                    return this.colorPalette.getColor(index.toString()).value;
                })
                .style("fill-opacity", DefaultOpacity)
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
                var labelsXScale: LinearScale<number, number> = d3.scale.linear()
                    .domain([0, series[0].dataPoints.length - 1])
                    .range([0, width - margin.left - margin.right]);

                var layout: ILabelLayout = StreamGraph.getStreamGraphLabelLayout(
                    labelsXScale,
                    yScale,
                    this.data.settings.labels);

                // Merge all points into a single array
                var dataPointsArray: StreamDataPoint[] = [];

                series.forEach((seriesItem: StreamGraphSeries) => {
                    var filteredDataPoints: StreamDataPoint[];

                    filteredDataPoints = seriesItem.dataPoints.filter((dataPoint: StreamDataPoint) => {
                        return dataPoint && dataPoint.y !== null && dataPoint.y !== undefined;
                    });

                    if (filteredDataPoints.length > 0) {
                        dataPointsArray = dataPointsArray.concat(filteredDataPoints);
                    }
                });

                var viewport: IViewport = {
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
                    var offset: number = StreamGraph.DefaultDataLabelsOffset + margin.left;

                    labels.attr("transform", (dataPoint: StreamDataPoint) => {
                        return translate(
                            offset + (dataPoint.size.width / 2),
                            dataPoint.size.height / 2);
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

            var margin: IMargin = this.margin,
                shiftY: number = this.viewport.height - margin.bottom,
                shiftX: number = this.viewport.width - margin.left - margin.right,
                categoriesText = this.data.categoriesText,
                xAxis: Axis = d3.svg.axis(),
                maxNumberOfAxisXValues: number = StreamGraph.MaxNumberOfAxisXValues;

            for (var index: number = 0; index < categoriesText.length; index++) {
                if (categoriesText[index] != null) {
                    var str = categoriesText[index].toString();
                    var textLength = textMeasurementService.measureSvgTextWidth(StreamGraph.getTextPropertiesFunction(str));
                    if (textLength > maxNumberOfAxisXValues)
                        maxNumberOfAxisXValues = textLength;
                }
            }

            xAxis.scale(xScale)
                .orient("bottom")
                .ticks(categoriesText.length)
                .tickFormat((index: number): string => {
                    var item: string = categoriesText[index];

                    if (data.categoryFormatter) {
                        item = data.categoryFormatter.format(item);
                    }

                    if (index !== null && index !== undefined &&
                        (index === 0 || index === categoriesText.length - 1)) {
                        item = textMeasurementService.getTailoredTextOrDefault(
                            StreamGraph.getTextPropertiesFunction(item),
                            (index ? margin.right : margin.left) * 2);
                    }

                    return item;
                });

            var yAxis: Axis = d3.svg.axis()
                .scale(yScale)
                .orient("left")
                .tickFormat((item: any): any => {
                    var tempItem = item;
                    if (data.valueFormatter) {
                        tempItem = data.valueFormatter.format(tempItem);
                    }
                    tempItem = textMeasurementService.getTailoredTextOrDefault(
                        StreamGraph.getTextPropertiesFunction(tempItem.toString()),
                        StreamGraph.YAxisOnSize - StreamGraph.DefaultLabelTickWidth);
                    return tempItem;
                });

            this.setMaxTicks(xAxis, shiftX, Math.max(2, Math.round(shiftX / maxNumberOfAxisXValues)));
            this.setMaxTicks(yAxis, shiftY);

            var valueAxisSettings: BaseAxisSettings = this.data.settings.valueAxis;
            if (valueAxisSettings.show) {
                var axisColor: string = valueAxisSettings.labelColor;
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

            var categoryAxisSettings: BaseAxisSettings = this.data.settings.categoryAxis;
            if (categoryAxisSettings.show) {
                var axisColor: string = categoryAxisSettings.labelColor;

                this.xAxis
                    .attr("transform", translate(0, shiftY))
                    .call(xAxis);

                this.xAxis
                    .selectAll("text")
                    .style("fill", axisColor);
            } else {
                this.xAxis
                    .selectAll("*")
                    .remove();
            }
        }

        private renderYAxisLabels(): void {
            this.axisGraphicsContext.selectAll(StreamGraph.YAxisLabel.selector).remove();
            var valueAxisSettings: BaseAxisSettings = this.data.settings.valueAxis;
            this.margin.left = valueAxisSettings.show ? StreamGraph.YAxisOnSize : StreamGraph.YAxisOffSize;

            if (valueAxisSettings.showAxisTitle) {
                this.margin.left += StreamGraph.YAxisLabelSize;
                var categoryAxisSettings: BaseAxisSettings = this.data.settings.categoryAxis;
                var isXAxisOn: boolean = categoryAxisSettings.show === true;
                var isXTitleOn: boolean = categoryAxisSettings.showAxisTitle === true;
                var marginTop: number = this.margin.top;
                var height: number = this.viewport.height - marginTop - (isXAxisOn ? StreamGraph.XAxisOnSize : StreamGraph.XAxisOffSize) - (isXTitleOn ? StreamGraph.XAxisLabelSize : 0);
                var values = this.dataView.categorical.values;
                var yAxisText: string = values.source ? values.source.displayName : StreamGraph.getYAxisTitleFromValues(values);

                var textSettings: TextProperties = StreamGraph.getTextPropertiesFunction(yAxisText);

                yAxisText = textMeasurementService.getTailoredTextOrDefault(textSettings, height);
                var yAxisClass: string = StreamGraph.YAxisLabel.class;

                var yAxisLabel: Selection<any> = this.axisGraphicsContext.append("text")
                    .style("text-anchor", "middle")
                    .style("font-family", textSettings.fontFamily)
                    .style("font-size", textSettings.fontSize)
                    .style("font-style", textSettings.fontStyle)
                    .style("font-weight", textSettings.fontWeight)
                    .text(yAxisText)
                    .call((text: Selection<any>) => {
                        text.each(function () {
                            var text = d3.select(this);
                            text.attr({
                                class: yAxisClass,
                                transform: "rotate(-90)",
                                fill: valueAxisSettings.labelColor,
                                x: -(marginTop + (height / 2)),
                                dy: "1em"
                            });
                        });
                    });

                yAxisLabel.call(AxisHelper.LabelLayoutStrategy.clip,
                    height,
                    textMeasurementService.svgEllipsis);
            }
        }

        private static getYAxisTitleFromValues(values: DataViewValueColumns): string {
            var valuesMetadataArray: powerbi.DataViewMetadataColumn[] = [];
            for (var i = 0; i < values.length; i++) {
                if (values[i] && values[i].source && values[i].source.displayName) {
                    valuesMetadataArray.push({ displayName: values[i].source.displayName });
                }
            }
            var valuesNames: string[] = valuesMetadataArray.map(v => v ? v.displayName : "").filter((value, index, self) => value !== "" && self.indexOf(value) === index);
            return valueFormatter.formatListAnd(valuesNames);
        }

        private renderXAxisLabels(): void {
            this.axisGraphicsContext.selectAll(StreamGraph.XAxisLabel.selector).remove();
            var categoryAxisSettings: BaseAxisSettings = this.data.settings.categoryAxis;
            this.margin.bottom = categoryAxisSettings.show ? StreamGraph.XAxisOnSize : StreamGraph.XAxisOffSize;

            if (!categoryAxisSettings.showAxisTitle ||
                !this.dataView.categorical.categories[0] ||
                !this.dataView.categorical.categories[0].source) {
                return;
            }

            this.margin.bottom += StreamGraph.XAxisLabelSize;
            var valueAxisSettings: BaseAxisSettings = this.data.settings.valueAxis;
            var isYAxisOn: boolean = valueAxisSettings.show === true;
            var isYTitleOn: boolean = valueAxisSettings.showAxisTitle === true;
            var leftMargin: number = (isYAxisOn ? StreamGraph.YAxisOnSize : StreamGraph.YAxisOffSize) + (isYTitleOn ? StreamGraph.YAxisLabelSize : 0);
            var width: number = this.viewport.width - this.margin.right - leftMargin;
            var height: number = this.viewport.height;
            var xAxisText: string = this.dataView.categorical.categories[0].source.displayName;
            var textSettings: TextProperties = StreamGraph.getTextPropertiesFunction(xAxisText);
            xAxisText = textMeasurementService.getTailoredTextOrDefault(textSettings, width);
            var xAxisClass: string = StreamGraph.XAxisLabel.class;
            var xAxisLabel: Selection<any> = this.axisGraphicsContext.append("text")
                .style("text-anchor", "middle")
                .style("font-family", textSettings.fontFamily)
                .style("font-size", textSettings.fontSize)
                .style("font-weight", textSettings.fontWeight)
                .text(xAxisText)
                .call((text: Selection<any>) => {
                    text.each(function () {
                        var text = d3.select(this);
                        text.attr({
                            class: xAxisClass,
                            transform: translate(leftMargin + (width / 2), height),
                            fill: categoryAxisSettings.labelColor,
                            dy: "-0.5em",
                        });
                    });
                });

            xAxisLabel.call(AxisHelper.LabelLayoutStrategy.clip,
                width,
                textMeasurementService.svgEllipsis);
        }

        private renderLegend(streamGraphData: StreamData): void {
            var legendSettings: LegendSettings = streamGraphData.settings.legend;
            var legendData: LegendData = streamGraphData.legendData;
            if (!this.dataView || !this.dataView.metadata) {
                return;
            }

            var legendObjectProperties: DataViewObject = DataViewObjects.getObject(this.dataView.metadata.objects, "legend", {});
            legendObjectProperties["titleText"] = legendSettings.titleText; // Force legend title when show = true
            LegendDataModule.update(legendData, legendObjectProperties);

            var position: string = <string>legendObjectProperties[legendProps.position];

            if (position) {
                this.legend.changeOrientation(LegendPosition[position]);
            }

            this.legend.drawLegend(legendData, _.clone(this.viewport));
            legend.positionChartArea(this.svg, this.legend);

            this.updateViewPort();
        }

        private updateViewPort(): void {
            var legendMargins: IViewport = this.legend.getMargins(),
                legendPosition: LegendPosition = this.legend.getOrientation();

            switch (legendPosition) {
                case LegendPosition.Top:
                case LegendPosition.TopCenter:
                case LegendPosition.Bottom:
                case LegendPosition.BottomCenter: {
                    this.viewport.height = Math.max(0, this.viewport.height - legendMargins.height);
                    break;
                }
                case LegendPosition.Left:
                case LegendPosition.LeftCenter:
                case LegendPosition.Right:
                case LegendPosition.RightCenter: {
                    this.viewport.width = Math.max(0, this.viewport.width - legendMargins.width);
                    break;
                }
            }
        }

        private clearData(): void {
            this.svg.selectAll(StreamGraph.Layer.selector).remove();
            this.legend.drawLegend({ dataPoints: [] }, this.viewport);
            this.yAxis.selectAll("*").remove();
            this.axisGraphicsContext.selectAll(StreamGraph.YAxisLabel.selector).remove();
            this.xAxis.selectAll("*").remove();
            this.axisGraphicsContext.selectAll(StreamGraph.XAxisLabel.selector).remove();
            this.svg.select(".labels").remove();
        }

        public onClearSelection(): void {
            if (this.interactivityService) {
                this.interactivityService.clearSelection();
            }
        }

        private setMaxTicks(axis: Axis, maxSize: number, maxValue?: number): void {
            var maxTicks = maxValue === undefined
                ? StreamGraph.getTicksByAxis(axis).length
                : Math.min(maxValue, StreamGraph.getTicksByAxis(axis).length);

            if (axis.scale().domain.toString() === d3.scale.linear().domain.toString()) {
                axis.ticks(StreamGraph.getFittedTickLength(axis, maxSize, maxTicks));
            } else {
                axis.tickValues(StreamGraph.getFittedTickValues(axis, maxSize, maxTicks));
            }
        }

        private static getFittedTickLength(axis: Axis, maxSize: number, maxTicks: number): number {
            for (var ticks: any[] = StreamGraph.getTicksByAxis(axis), measureTickFunction = StreamGraph.getMeasureTickFunction(axis, ticks);
                maxTicks > 0 && maxSize > 0 && (StreamGraph.measureTicks(ticks, measureTickFunction) > maxSize || axis.scale().ticks([maxTicks]).length > maxTicks);
                maxTicks-- , ticks = StreamGraph.getTicksByAxis(axis)) {
                axis.ticks(maxTicks);
            }
            return maxTicks;
        }

        private static getFittedTickValues(axis: Axis, maxSize: number, maxTicks: number): any[] {
            var ticks: any[] = StreamGraph.getTicksByAxis(axis),
                maxWidthOf2Ticks: number,
                tickPairsWidths: any[] = [],
                measureTickFunction: (any) => number = StreamGraph.getMeasureTickFunction(axis, ticks);

            for (var currentMaxTicks: number = maxTicks, indexes: number[] = [];
                maxTicks > 0 && maxSize > 0;
                currentMaxTicks-- , indexes = []) {
                switch (currentMaxTicks) {
                    case 0:
                        return [];
                    case 1:
                        indexes = [0];
                        break;
                    case 2:
                        indexes = [0, ticks.length - 1];
                        break;
                    default:
                        var takeEvery: number = ticks.length / (currentMaxTicks - 1);

                        for (var i = 0; i < currentMaxTicks - 1; i++) {
                            indexes.push(Math.round(takeEvery * i));
                        }

                        indexes.push(ticks.length - 1);
                        break;
                }

                var ticksIndexes: any[][] = indexes.map(x => [ticks[x], x]);
                maxWidthOf2Ticks = (maxSize / ticks.length) * 2;

                ticksIndexes.reduce((a, b) => {
                    tickPairsWidths.push([measureTickFunction(a[0]) + measureTickFunction(b[0]), (b[1] - a[1]) * maxWidthOf2Ticks]);
                    return b;
                });

                if (!tickPairsWidths.some(x => x[0] > x[1])) {
                    return ticksIndexes.map(x => x[0]);
                }
            }
            return [];
        }

        private static measureTicks(ticks: any[], measureTickFunction: (number) => any): number {
            return ticks.map((x: any) => measureTickFunction(x)).reduce((a: number, b: number) => a + b);
        }

        private static getTicksByAxis(axis: Axis): any[] {
            var scale = axis.scale();
            var result: any = axis.tickValues() === null
                ? scale.ticks
                    ? scale.ticks.apply(scale, axis.ticks())
                    : scale.domain()
                : axis.tickValues();

            return result.length === undefined ? [result] : result;
        }

        private static getMeasureTickFunction(axis: Axis, ticks: string[]): (number) => any {
            var measureFunction = axis.orient() === "top" || axis.orient() === "bottom"
                ? textMeasurementService.measureSvgTextWidth
                : textMeasurementService.measureSvgTextHeight;

            var cache = {};

            return function (x: any): number {
                return cache[x]
                    ? cache[x]
                    : cache[x] = measureFunction(StreamGraph.getTextPropertiesFunction(axis.tickFormat()(x))) + axis.tickPadding();
            };
        }

        private static getTextPropertiesFunction(text: string): TextProperties {
            var fontFamily: string = StreamGraph.StreamGraphDefaultFontFamily,
                fontSize: string = PixelConverter.fromPoint(LegendSettings.DefaultFontSizeInPoints),
                fontWeight: string = StreamGraph.StreamGraphDefaultFontWeight;

            return { text: text, fontFamily: fontFamily, fontSize: fontSize, fontWeight: fontWeight };
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
