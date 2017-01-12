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
    export interface StreamProperty {
        [propertyName: string]: DataViewObjectPropertyIdentifier;
    }

    export class StreamGraph implements IVisual {
        private static VisualClassName = "streamGraph";

        private static Properties: any = {
            general: {
                formatString: <DataViewObjectPropertyIdentifier>{
                    objectName: "general",
                    propertyName: "formatString"
                }
            },
            legend: {
                show: <DataViewObjectPropertyIdentifier>{
                    objectName: "legend",
                    propertyName: "show"
                },
                position: <DataViewObjectPropertyIdentifier>{
                    objectName: "legend",
                    propertyName: "position"
                },
                showTitle: <DataViewObjectPropertyIdentifier>{
                    objectName: "legend",
                    propertyName: "showTitle"
                },
                titleText: <DataViewObjectPropertyIdentifier>{
                    objectName: "legend",
                    propertyName: "titleText"
                },
                labelColor: <DataViewObjectPropertyIdentifier>{
                    objectName: "legend",
                    propertyName: "labelColor"
                },
                fontSize: <DataViewObjectPropertyIdentifier>{
                    objectName: "legend",
                    propertyName: "fontSize"
                }
            },
            categoryAxis: {
                show: <DataViewObjectPropertyIdentifier>{
                    objectName: "categoryAxis",
                    propertyName: "show"
                },
                labelColor: <DataViewObjectPropertyIdentifier>{
                    objectName: "categoryAxis",
                    propertyName: "labelColor"
                },
                showAxisTitle: <DataViewObjectPropertyIdentifier>{
                    objectName: "categoryAxis",
                    propertyName: "showAxisTitle"
                }
            },
            valueAxis: {
                show: <DataViewObjectPropertyIdentifier>{
                    objectName: "valueAxis",
                    propertyName: "show"
                },
                labelColor: <DataViewObjectPropertyIdentifier>{
                    objectName: "valueAxis",
                    propertyName: "labelColor"
                },
                showAxisTitle: <DataViewObjectPropertyIdentifier>{
                    objectName: "valueAxis",
                    propertyName: "showAxisTitle"
                }
            },
            labels: {
                show: <DataViewObjectPropertyIdentifier>{
                    objectName: "labels",
                    propertyName: "show"
                },
                color: <DataViewObjectPropertyIdentifier>{
                    objectName: "labels",
                    propertyName: "color"
                },
                fontSize: <DataViewObjectPropertyIdentifier>{
                    objectName: "labels",
                    propertyName: "fontSize"
                }
            }
        };

        private static DataPointsContainer = "dataPointsContainer";
        private static DefaultDataLabelsOffset: number = 4;
        private static DefaultLabelTickWidth: number = 10;
        private static DefaultLegendLabelFillColor: string = "#666666";
        private static MaxNumberOfAxisXValues: number = 5;
        private static StreamGraphAxisGraphicsContextClassName = "axisGraphicsContext";
        private static StreamGraphDefaultColor = "#777";
        private static StreamGraphDefaultFontFamily: string = "wf_segoe-ui_normal";
        private static StreamGraphDefaultFontSizeInPoints: number = 8;
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

        private axisGraphicsContext: D3.Selection;
        private behavior: IInteractiveBehavior;
        private clearCatcher: D3.Selection;
        private colors: IColorScale;
        private data: StreamData;
        private dataPointsContainer: D3.Selection;
        private dataView: DataView;
        private interactivityService: IInteractivityService;
        private legend: ILegend;
        private svg: D3.Selection;
        private viewport: IViewport;
        private xAxis: D3.Selection;
        private yAxis: D3.Selection;

        private static StreamGraphDefaultSettings: StreamGraphSettings = {
            legendSettings: {
                show: true,
                position: legendPosition.top,
                showTitle: true,
                labelColor: StreamGraph.DefaultLegendLabelFillColor,
                titleText: "",
                fontSize: StreamGraph.StreamGraphDefaultFontSizeInPoints
            },
            categoryAxisSettings: {
                show: true,
                labelColor: StreamGraph.StreamGraphDefaultColor,
                showAxisTitle: false,
            },
            valueAxisSettings: {
                show: true,
                labelColor: StreamGraph.StreamGraphDefaultColor,
                showAxisTitle: false,
            },
            dataLabelsSettings: dataLabelUtils.getDefaultPointLabelSettings(),
        };

        constructor(options: VisualConstructorOptions) {

        }

        public static converter(dataView: DataView, colors: IColorScale, interactivityService: IInteractivityService): StreamData {
            if (!dataView ||
                !dataView.categorical ||
                !dataView.categorical.values ||
                !dataView.categorical.categories ||
                !colors) {
                return null;
            }

            var catDv: DataViewCategorical = dataView.categorical,
                categories = catDv.categories,
                values: DataViewValueColumns = catDv.values,
                series: StreamGraphSeries[] = [],
                legendData: LegendData = {
                    dataPoints: [],
                    title: values.source ? values.source.displayName : "",
                    fontSize: StreamGraph.StreamGraphDefaultFontSizeInPoints,
                },
                value: number = 0,
                valueFormatter: IValueFormatter,
                categoryFormatter: IValueFormatter;

            var category = categories && categories.length > 0 ? categories[0] : null;
            var formatString = StreamGraph.Properties.general.formatString;
            var hasHighlights: boolean = !!(values.length > 0 && values[0].highlights);
            var streamGraphSettings: StreamGraphSettings = StreamGraph.parseSettings(dataView);
            var fontSizeInPx = PixelConverter.fromPoint(streamGraphSettings.dataLabelsSettings.fontSize);

            for (var i = 0; i < values.length; i++) {
                var label: string = <string>values[i].source.groupName;
                var identity: SelectionId = values[i].identity
                    ? SelectionId.createWithId(values[i].identity)
                    : SelectionId.createWithMeasure(values[i].source.queryName);

                var tooltipInfo: TooltipDataItem[] = TooltipBuilder.createTooltipInfo(
                    formatString,
                    { categories: null, values: values },
                    null,
                    null,
                    null,
                    null,
                    i);

                if (!label) {
                    if (tooltipInfo &&
                        tooltipInfo[0] &&
                        tooltipInfo[0].value) {
                        label = tooltipInfo[0].value;
                    } else {
                        label = values[i].source.displayName;
                    }
                }

                if (label) {
                    legendData.dataPoints.push({
                        label: label,
                        color: colors.getColor(i).value,
                        icon: LegendIcon.Box,
                        selected: false,
                        identity: identity,
                    });
                }

                series[i] = {
                    dataPoints: [],
                    tooltipInfo: tooltipInfo,
                    highlight: hasHighlights,
                    identity: identity,
                    selected: false,
                };

                var dataPointsValues = values[i].values;
                if (dataPointsValues.length === 0) {
                    continue;
                }

                for (var k = 0; k < dataPointsValues.length; k++) {
                    var y: number = <number>(hasHighlights ? values[i].highlights[k] : dataPointsValues[k]);
                    if (y > value) {
                        value = y;
                    }

                    series[i].dataPoints.push({
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

            valueFormatter = ValueFormatter.create({
                format: "g",
                value: value
            });

            categoryFormatter = ValueFormatter.create({
                format: ValueFormatter.getFormatString(
                    category.source,
                    StreamGraph.Properties.general.formatString),
                value: category.values
            });

            var categoriesText: string[] = [];
            var getTextPropertiesFunction = this.getTextPropertiesFunction;

            for (var index = 0; index < category.values.length; index++) {
                var formattedValue: string;
                if (category.values[index] != null) {
                    formattedValue = categoryFormatter.format(category.values[index]);
                    var textLength = TextMeasurementService.measureSvgTextWidth(getTextPropertiesFunction(formattedValue));
                    if (textLength > StreamGraph.MaxNumberOfAxisXValues)
                        StreamGraph.MaxNumberOfAxisXValues = textLength;
                }
                categoriesText.push(formattedValue);
            }

            return {
                series: series,
                legendData: legendData,
                valueFormatter: valueFormatter,
                categoryFormatter: categoryFormatter,
                streamGraphSettings: streamGraphSettings,
                categoriesText: categoriesText
            };
        }

        private static parseSettings(dataView: DataView): StreamGraphSettings {
            if (!dataView || !dataView.metadata) {
                return StreamGraph.StreamGraphDefaultSettings;
            }

            var objects: DataViewObjects = dataView.metadata.objects;
            var streamGraphSettings: StreamGraphSettings = _.cloneDeep(StreamGraph.StreamGraphDefaultSettings);

            var categoryAxisSettings: StreamGraphAxisSettings = streamGraphSettings.categoryAxisSettings;
            categoryAxisSettings.show = DataViewObjects.getValue<boolean>(objects, StreamGraph.Properties.categoryAxis.show, categoryAxisSettings.show);
            categoryAxisSettings.labelColor = <string>DataViewObjects.getFillColor(objects, StreamGraph.Properties.categoryAxis.labelColor, categoryAxisSettings.labelColor);
            categoryAxisSettings.showAxisTitle = DataViewObjects.getValue<boolean>(objects, StreamGraph.Properties.categoryAxis.showAxisTitle, categoryAxisSettings.showAxisTitle);

            var valueAxisSettings: StreamGraphAxisSettings = streamGraphSettings.valueAxisSettings;
            valueAxisSettings.show = DataViewObjects.getValue<boolean>(objects, StreamGraph.Properties.valueAxis.show, valueAxisSettings.show);
            valueAxisSettings.labelColor = <string>DataViewObjects.getFillColor(objects, StreamGraph.Properties.valueAxis.labelColor, valueAxisSettings.labelColor);
            valueAxisSettings.showAxisTitle = DataViewObjects.getValue<boolean>(objects, StreamGraph.Properties.valueAxis.showAxisTitle, valueAxisSettings.showAxisTitle);

            var dataLabelsSettings: VisualDataLabelsSettings = streamGraphSettings.dataLabelsSettings;
            dataLabelsSettings.show = DataViewObjects.getValue<boolean>(objects, StreamGraph.Properties.labels.show, dataLabelsSettings.show);
            dataLabelsSettings.labelColor = <string>DataViewObjects.getFillColor(objects, StreamGraph.Properties.labels.color, dataLabelsSettings.labelColor);
            dataLabelsSettings.fontSize = DataViewObjects.getValue<number>(objects, StreamGraph.Properties.labels.fontSize, dataLabelsSettings.fontSize);

            var legendSettings: StreamGraphLegendSettings = streamGraphSettings.legendSettings;
            var valuesSource: DataViewMetadataColumn = dataView.categorical.values.source;
            var titleTextDefault: string = valuesSource && _.isEmpty(legendSettings.titleText) ? valuesSource.displayName : legendSettings.titleText;

            legendSettings.show = DataViewObjects.getValue<boolean>(objects, StreamGraph.Properties.legend.show, legendSettings.show);
            legendSettings.position = DataViewObjects.getValue<string>(objects, StreamGraph.Properties.legend.position, legendSettings.position);
            legendSettings.showTitle = DataViewObjects.getValue<boolean>(objects, StreamGraph.Properties.legend.showTitle, legendSettings.showTitle);
            legendSettings.titleText = DataViewObjects.getValue<string>(objects, StreamGraph.Properties.legend.titleText, titleTextDefault);
            legendSettings.labelColor = DataViewObjects.getValue<string>(objects, StreamGraph.Properties.legend.labelColor, legendSettings.labelColor);
            legendSettings.fontSize = DataViewObjects.getValue<number>(objects, StreamGraph.Properties.legend.fontSize, legendSettings.fontSize);

            if (_.isEmpty(legendSettings.titleText)) {
                legendSettings.titleText = titleTextDefault; // Force a value (shouldn't be empty with show=true)
            }

            return streamGraphSettings;
        }

        public init(options: VisualInitOptions): void {
            var element: JQuery = options.element;

            var svg: D3.Selection = this.svg = d3.select(element.get(0))
                .append("svg")
                .classed(StreamGraph.VisualClassName, true)
                .style("position", "absolute");

            this.clearCatcher = appendClearCatcher(svg);
            this.axisGraphicsContext = svg.append("g").classed(StreamGraph.StreamGraphAxisGraphicsContextClassName, true);
            this.xAxis = this.axisGraphicsContext.append("g").classed(StreamGraph.StreamGraphXAxisClassName, true);
            this.yAxis = this.axisGraphicsContext.append("g").classed(StreamGraph.StreamGraphYAxisClassName, true);
            this.dataPointsContainer = svg.append("g").classed(StreamGraph.DataPointsContainer, true);
            this.viewport = options.viewport;
            this.colors = options.style.colorPalette.dataColors.getNewColorScale();
            this.behavior = new StreamGraphWebBehavior();
            var interactivity = options.interactivity;
            this.interactivityService = createInteractivityService(options.host);
            this.legend = createLegend(element, interactivity && interactivity.isInteractiveLegend, this.interactivityService, true);
        }

        public update(options: VisualUpdateOptions): void {
            if (!options.dataViews || !options.dataViews[0] || !options.dataViews[0].categorical) {
                this.clearData();
                return;
            };

            this.viewport = {
                width: Math.max(0, options.viewport.width),
                height: Math.max(0, options.viewport.height)
            };

            var duration: number = options.suppressAnimations ? 0 : 250,
                dataView: DataView = this.dataView = options.dataViews[0],
                data: StreamData = this.data = StreamGraph.converter(dataView, this.colors, this.interactivityService);

            if (!data || !data.series || !data.series.length) {
                this.clearData();
                return;
            }

            this.renderLegend(data);
            this.renderXAxisLabels();
            this.renderYAxisLabels();

            this.svg.attr({
                "width": this.viewport.width + "px",
                "height": this.viewport.height + "px"
            });

            var selection: D3.UpdateSelection = this.renderChart(data.series, duration);

            TooltipManager.addTooltip(selection, (tooltipEvent: TooltipEvent) => tooltipEvent.data.tooltipInfo);

            var interactivityService = this.interactivityService;

            if (interactivityService) {
                var behaviorOptions: StreamGraphBehaviorOptions = {
                    selection: selection,
                    clearCatcher: this.clearCatcher,
                    interactivityService: interactivityService,
                };

                interactivityService.bind(data.series, this.behavior, behaviorOptions);
            }
        }

        private static getStreamGraphLabelLayout(xScale: D3.Scale.LinearScale, yScale: D3.Scale.LinearScale, dataLabelsSettings: VisualDataLabelsSettings): ILabelLayout {
            var fontSize = PixelConverter.fromPoint(dataLabelsSettings.fontSize);

            return {
                labelText: (d: StreamDataPoint) => {
                    return d.text;
                },
                labelLayout: {
                    x: (d: StreamDataPoint) => xScale(d.x),
                    y: (d: StreamDataPoint) => yScale(d.y0)
                },
                filter: (d: StreamDataPoint) => {
                    return (d != null && d.text != null);
                },
                style: {
                    "fill": dataLabelsSettings.labelColor,
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

        private renderChart(series: StreamGraphSeries[], duration: number): D3.UpdateSelection {
            var stack: D3.Layout.StackLayout = d3.layout.stack()
                .values((d: StreamGraphSeries) => d.dataPoints);
            var width: number = this.viewport.width;
            var height: number = this.viewport.height;

            if (StreamGraph.getWiggle(this.dataView)) {
                stack.offset("wiggle");
            }

            var layers: StreamGraphSeries[] = stack(series);
            var margin: IMargin = this.margin;
            var xScale: D3.Scale.LinearScale = d3.scale.linear()
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

            var yScale: D3.Scale.LinearScale = d3.scale.linear()
                .domain([Math.min(yMin, 0), yMax])
                .range([height - margin.bottom, margin.top])
                .nice();

            let area: D3.Svg.Area = d3.svg.area()
                .interpolate(<any>StreamGraph.d3_svg_lineMonotone)
                .x(d => xScale(d.x))
                .y0(d => yScale(d.y0))
                .y1(d => yScale(d.y0 + d.y))
                .defined((d: StreamDataPoint) => !isNaN(d.y0) && !isNaN(d.y));

            var selection: D3.UpdateSelection = this.dataPointsContainer.selectAll(StreamGraph.Layer.selector)
                .data(layers);

            selection.enter()
                .append("path")
                .classed(StreamGraph.Layer.class, true);

            selection
                .style("fill", (d: StreamGraphSeries, i) => this.colors.getColor(i).value)
                .style("fill-opacity", streamGraphUtils.DefaultOpacity)
                .transition()
                .duration(duration)
                .attr("d", (d: StreamGraphSeries) => area(d.dataPoints));

            selection.selectAll("path").append("g").classed(StreamGraph.DataPointsContainer, true);

            selection.exit().remove();

            if (this.data.streamGraphSettings.dataLabelsSettings.show) {
                var labelsXScale: D3.Scale.LinearScale = d3.scale.linear()
                    .domain([0, series[0].dataPoints.length - 1])
                    .range([0, width - margin.left - margin.right]);

                var layout: ILabelLayout = StreamGraph.getStreamGraphLabelLayout(labelsXScale, yScale, this.data.streamGraphSettings.dataLabelsSettings);

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

                var labels: D3.UpdateSelection = dataLabelUtils.drawDefaultLabelsForDataPointChart(dataPointsArray, this.svg, layout, viewport);

                if (labels) {
                    var offset: number = StreamGraph.DefaultDataLabelsOffset + margin.left;
                    labels.attr("transform", (d) => SVGUtil.translate(offset + (d.size.width / 2), d.size.height / 2));
                }
            }
            else {
                dataLabelUtils.cleanDataLabels(this.svg);
            }

            this.drawAxis(this.data, xScale, yScale);

            return selection;
        }

        private drawAxis(data: StreamData, xScale: D3.Scale.LinearScale, yScale: D3.Scale.LinearScale): void {
            var margin: IMargin = this.margin,
                shiftY: number = this.viewport.height - margin.bottom,
                shiftX: number = this.viewport.width - margin.left - margin.right,
                categoriesText = this.data.categoriesText,
                xAxis: D3.Svg.Axis = d3.svg.axis(),
                maxNumberOfAxisXValues: number = StreamGraph.MaxNumberOfAxisXValues;

            for (var index: number = 0; index < categoriesText.length; index++) {
                if (categoriesText[index] != null) {
                    var str = categoriesText[index].toString();
                    var textLength = TextMeasurementService.measureSvgTextWidth(StreamGraph.getTextPropertiesFunction(str));
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
                        item = TextMeasurementService.getTailoredTextOrDefault(
                            StreamGraph.getTextPropertiesFunction(item),
                            (index ? margin.right : margin.left) * 2);
                    }

                    return item;
                });

            var yAxis: D3.Svg.Axis = d3.svg.axis()
                .scale(yScale)
                .orient("left")
                .tickFormat((item: any): any => {
                    var tempItem = item;
                    if (data.valueFormatter) {
                        tempItem = data.valueFormatter.format(tempItem);
                    }
                    tempItem = TextMeasurementService.getTailoredTextOrDefault(
                        StreamGraph.getTextPropertiesFunction(tempItem.toString()),
                        StreamGraph.YAxisOnSize - StreamGraph.DefaultLabelTickWidth);
                    return tempItem;
                });

            this.setMaxTicks(xAxis, shiftX, Math.max(2, Math.round(shiftX / maxNumberOfAxisXValues)));
            this.setMaxTicks(yAxis, shiftY);

            var valueAxisSettings = this.data.streamGraphSettings.valueAxisSettings;
            if (valueAxisSettings.show) {
                var axisColor: Fill = valueAxisSettings.labelColor;
                this.yAxis
                    .attr("transform", SVGUtil.translate(margin.left, 0))
                    .call(yAxis);
                this.yAxis.selectAll("text").style("fill", axisColor);
            } else
                this.yAxis.selectAll("*").remove();

            var categoryAxisSettings = this.data.streamGraphSettings.categoryAxisSettings;
            if (categoryAxisSettings.show) {
                var axisColor: Fill = categoryAxisSettings.labelColor;
                this.xAxis
                    .attr("transform", SVGUtil.translate(0, shiftY))
                    .call(xAxis);
                this.xAxis.selectAll("text").style("fill", axisColor);
            } else
                this.xAxis.selectAll("*").remove();
        }

        private renderYAxisLabels(): void {
            this.axisGraphicsContext.selectAll(StreamGraph.YAxisLabel.selector).remove();
            var valueAxisSettings: StreamGraphAxisSettings = this.data.streamGraphSettings.valueAxisSettings;
            this.margin.left = valueAxisSettings.show ? StreamGraph.YAxisOnSize : StreamGraph.YAxisOffSize;

            if (valueAxisSettings.showAxisTitle) {
                this.margin.left += StreamGraph.YAxisLabelSize;
                var categoryAxisSettings: StreamGraphAxisSettings = this.data.streamGraphSettings.categoryAxisSettings;
                var isXAxisOn: boolean = categoryAxisSettings.show === true;
                var isXTitleOn: boolean = categoryAxisSettings.showAxisTitle === true;
                var marginTop: number = this.margin.top;
                var height: number = this.viewport.height - marginTop - (isXAxisOn ? StreamGraph.XAxisOnSize : StreamGraph.XAxisOffSize) - (isXTitleOn ? StreamGraph.XAxisLabelSize : 0);
                var values = this.dataView.categorical.values;
                var yAxisText: string = values.source ? values.source.displayName : StreamGraph.getYAxisTitleFromValues(values);
                var textSettings: TextProperties = StreamGraph.getTextPropertiesFunction(yAxisText);
                yAxisText = TextMeasurementService.getTailoredTextOrDefault(textSettings, height);
                var yAxisClass: string = StreamGraph.YAxisLabel.class;
                var yAxisLabel: D3.Selection = this.axisGraphicsContext.append("text")
                    .style("text-anchor", "middle")
                    .style("font-family", textSettings.fontFamily)
                    .style("font-size", textSettings.fontSize)
                    .style("font-style", textSettings.fontStyle)
                    .style("font-weight", textSettings.fontWeight)
                    .text(yAxisText)
                    .call((text: D3.Selection) => {
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
                    TextMeasurementService.svgEllipsis);
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
            var categoryAxisSettings = this.data.streamGraphSettings.categoryAxisSettings;
            this.margin.bottom = categoryAxisSettings.show ? StreamGraph.XAxisOnSize : StreamGraph.XAxisOffSize;

            if (!categoryAxisSettings.showAxisTitle ||
                !this.dataView.categorical.categories[0] ||
                !this.dataView.categorical.categories[0].source) {
                return;
            }

            this.margin.bottom += StreamGraph.XAxisLabelSize;
            var valueAxisSettings: StreamGraphAxisSettings = this.data.streamGraphSettings.valueAxisSettings;
            var isYAxisOn: boolean = valueAxisSettings.show === true;
            var isYTitleOn: boolean = valueAxisSettings.showAxisTitle === true;
            var leftMargin: number = (isYAxisOn ? StreamGraph.YAxisOnSize : StreamGraph.YAxisOffSize) + (isYTitleOn ? StreamGraph.YAxisLabelSize : 0);
            var width: number = this.viewport.width - this.margin.right - leftMargin;
            var height: number = this.viewport.height;
            var xAxisText: string = this.dataView.categorical.categories[0].source.displayName;
            var textSettings: TextProperties = StreamGraph.getTextPropertiesFunction(xAxisText);
            xAxisText = TextMeasurementService.getTailoredTextOrDefault(textSettings, width);
            var xAxisClass: string = StreamGraph.XAxisLabel.class;
            var xAxisLabel: D3.Selection = this.axisGraphicsContext.append("text")
                .style("text-anchor", "middle")
                .style("font-family", textSettings.fontFamily)
                .style("font-size", textSettings.fontSize)
                .style("font-weight", textSettings.fontWeight)
                .text(xAxisText)
                .call((text: D3.Selection) => {
                    text.each(function () {
                        var text = d3.select(this);
                        text.attr({
                            class: xAxisClass,
                            transform: SVGUtil.translate(leftMargin + (width / 2), height),
                            fill: categoryAxisSettings.labelColor,
                            dy: "-0.5em",
                        });
                    });
                });

            xAxisLabel.call(AxisHelper.LabelLayoutStrategy.clip,
                width,
                TextMeasurementService.svgEllipsis);
        }

        private renderLegend(streamGraphData: StreamData): void {
            var legendSettings: StreamGraphLegendSettings = streamGraphData.streamGraphSettings.legendSettings;
            var legendData: LegendData = streamGraphData.legendData;
            if (!this.dataView || !this.dataView.metadata) {
                return;
            }

            var legendObjectProperties: DataViewObject = DataViewObjects.getObject(this.dataView.metadata.objects, "legend", {});
            legendObjectProperties["titleText"] = legendSettings.titleText; // Force legend title when show = true
            LegendData.update(legendData, legendObjectProperties);

            var position: string = <string>legendObjectProperties[legendProps.position];

            if (position) {
                this.legend.changeOrientation(LegendPosition[position]);
            }

            this.legend.drawLegend(legendData, _.clone(this.viewport));
            Legend.positionChartArea(this.svg, this.legend);

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

        private setMaxTicks(axis: D3.Svg.Axis, maxSize: number, maxValue?: number): void {
            var maxTicks = maxValue === undefined
                ? StreamGraph.getTicksByAxis(axis).length
                : Math.min(maxValue, StreamGraph.getTicksByAxis(axis).length);

            if (axis.scale().domain.toString() === d3.scale.linear().domain.toString()) {
                axis.ticks(StreamGraph.getFittedTickLength(axis, maxSize, maxTicks));
            } else {
                axis.tickValues(StreamGraph.getFittedTickValues(axis, maxSize, maxTicks));
            }
        }

        private static getFittedTickLength(axis: D3.Svg.Axis, maxSize: number, maxTicks: number): number {
            for (var ticks: any[] = StreamGraph.getTicksByAxis(axis), measureTickFunction = StreamGraph.getMeasureTickFunction(axis, ticks);
                maxTicks > 0 && maxSize > 0 && (StreamGraph.measureTicks(ticks, measureTickFunction) > maxSize || axis.scale().ticks([maxTicks]).length > maxTicks);
                maxTicks-- , ticks = StreamGraph.getTicksByAxis(axis)) {
                axis.ticks(maxTicks);
            }
            return maxTicks;
        }

        private static getFittedTickValues(axis: D3.Svg.Axis, maxSize: number, maxTicks: number): any[] {
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

        private static getTicksByAxis(axis: D3.Svg.Axis): any[] {
            var scale = axis.scale();
            var result: any = axis.tickValues() === null
                ? scale.ticks
                    ? scale.ticks.apply(scale, axis.ticks())
                    : scale.domain()
                : axis.tickValues();

            return result.length === undefined ? [result] : result;
        }

        private static getMeasureTickFunction(axis: D3.Svg.Axis, ticks: string[]): (number) => any {
            var measureFunction = axis.orient() === "top" || axis.orient() === "bottom"
                ? TextMeasurementService.measureSvgTextWidth
                : TextMeasurementService.measureSvgTextHeight;

            var cache = {};

            return function (x: any): number {
                return cache[x]
                    ? cache[x]
                    : cache[x] = measureFunction(StreamGraph.getTextPropertiesFunction(axis.tickFormat()(x))) + axis.tickPadding();
            };
        }

        private static getTextPropertiesFunction(text: string): TextProperties {
            var fontFamily: string = StreamGraph.StreamGraphDefaultFontFamily,
                fontSize: string = PixelConverter.fromPoint(StreamGraph.StreamGraphDefaultFontSizeInPoints),
                fontWeight: string = StreamGraph.StreamGraphDefaultFontWeight;

            return { text: text, fontFamily: fontFamily, fontSize: fontSize, fontWeight: fontWeight };
        }

        private static getWiggle(dataView: DataView): boolean {
            if (dataView && dataView.metadata) {
                var objects = dataView.metadata.objects;

                if (objects) {
                    var general = DataViewObjects.getObject(objects, "general", undefined);

                    if (general) {
                        return <boolean>general["wiggle"];
                    }
                }
            }
            return true;
        }

        private enumerateValueAxisValues(enumeration: ObjectEnumerationBuilder): void {
            var valueAxisSettings: StreamGraphAxisSettings = this.data && this.data.streamGraphSettings ? this.data.streamGraphSettings.valueAxisSettings : StreamGraph.StreamGraphDefaultSettings.valueAxisSettings;

            enumeration.pushInstance({
                selector: null,
                objectName: "valueAxis",
                displayName: "Y-Axis",
                properties: {
                    show: valueAxisSettings.show,
                    showAxisTitle: valueAxisSettings.showAxisTitle,
                    labelColor: valueAxisSettings.labelColor,
                }
            });
        }

        private enumerateCategoryAxisValues(enumeration: ObjectEnumerationBuilder): void {
            var categoryAxisSettings: StreamGraphAxisSettings = this.data && this.data.streamGraphSettings ? this.data.streamGraphSettings.categoryAxisSettings : StreamGraph.StreamGraphDefaultSettings.categoryAxisSettings;

            enumeration.pushInstance({
                selector: null,
                objectName: "categoryAxis",
                displayName: "X-Axis",
                properties: {
                    show: categoryAxisSettings.show,
                    showAxisTitle: categoryAxisSettings.showAxisTitle,
                    labelColor: categoryAxisSettings.labelColor,
                }
            });
        }

        private enumerateLegend(enumeration: ObjectEnumerationBuilder): void {
            var legendSettings: StreamGraphLegendSettings = this.data && this.data.streamGraphSettings ? this.data.streamGraphSettings.legendSettings : StreamGraph.StreamGraphDefaultSettings.legendSettings;

            enumeration.pushInstance({
                selector: null,
                objectName: "legend",
                displayName: "Legend",
                properties: {
                    show: legendSettings.show,
                    position: legendSettings.position,
                    showTitle: legendSettings.showTitle,
                    titleText: legendSettings.titleText,
                    labelColor: legendSettings.labelColor,
                    fontSize: legendSettings.fontSize,
                }
            });
        }

        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration {
            var enumeration: ObjectEnumerationBuilder = new ObjectEnumerationBuilder(),
                dataView = this.dataView;

            var dataLabelsSettings: any;
            if (this.data) {
                dataLabelsSettings = this.data.streamGraphSettings.dataLabelsSettings
                    ? this.data.streamGraphSettings.dataLabelsSettings
                    : StreamGraph.StreamGraphDefaultSettings.dataLabelsSettings;
            }

            switch (options.objectName) {
                case "legend": {
                    if (dataView
                        && dataView.categorical
                        && dataView.categorical.values
                        && dataView.categorical.values.source)
                        this.enumerateLegend(enumeration);
                    break;
                }
                case "categoryAxis": {
                    this.enumerateCategoryAxisValues(enumeration);
                    break;
                }
                case "valueAxis": {
                    this.enumerateValueAxisValues(enumeration);
                    break;
                }
                case "labels": {
                    var labelSettingOptions: VisualDataLabelsSettingsOptions = {
                        enumeration: enumeration,
                        dataLabelsSettings: dataLabelsSettings,
                        show: true,
                        fontSize: true,
                    };

                    dataLabelUtils.enumerateDataLabels(labelSettingOptions);
                    break;
                }
                case "general": {
                    var general: VisualObjectInstance = {
                        objectName: "general",
                        displayName: "General",
                        selector: null,
                        properties: {
                            wiggle: StreamGraph.getWiggle(dataView)
                        }
                    };

                    enumeration.pushInstance(general);
                    break;
                }
            }

            return enumeration.complete();
        }
    }
}
