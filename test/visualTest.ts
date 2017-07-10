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

/// <reference path="_references.ts"/>

module powerbi.extensibility.visual.test {
    // powerbi.visuals
    import ISelectionId = powerbi.visuals.ISelectionId;

    // powerbi.extensibility.visual.test
    import StreamGraphBuilder = powerbi.extensibility.visual.test.StreamGraphBuilder;
    import ProductSalesByDateData = powerbi.extensibility.visual.test.ProductSalesByDateData;
    import getSolidColorStructuralObject = powerbi.extensibility.visual.test.helpers.getSolidColorStructuralObject;

    // powerbi.extensibility.utils.chart
    import legendPosition = powerbi.extensibility.utils.chart.legend.position;
    import LegendDataPoint = powerbi.extensibility.utils.chart.legend.LegendDataPoint;

    // powerbi.extensibility.utils.test
    import clickElement = powerbi.extensibility.utils.test.helpers.clickElement;
    import createColorPalette = powerbi.extensibility.utils.test.mocks.createColorPalette;
    import assertColorsMatch = powerbi.extensibility.utils.test.helpers.color.assertColorsMatch;
    import MockISelectionId = powerbi.extensibility.utils.test.mocks.MockISelectionId;
    import createSelectionId = powerbi.extensibility.utils.test.mocks.createSelectionId;

    // powerbi.extensibility.utils.interactivity
    import IInteractivityService = powerbi.extensibility.utils.interactivity.IInteractivityService;
    import createInteractivityService = powerbi.extensibility.utils.interactivity.createInteractivityService;

    // StreamGraph1446659696222
    import StreamData = powerbi.extensibility.visual.StreamGraph1446659696222.StreamData;
    import VisualClass = powerbi.extensibility.visual.StreamGraph1446659696222.StreamGraph;
    import StreamDataPoint = powerbi.extensibility.visual.StreamGraph1446659696222.StreamDataPoint;
    import StreamGraphSeries = powerbi.extensibility.visual.StreamGraph1446659696222.StreamGraphSeries;

    describe("StreamGraph", () => {
        let visualBuilder: StreamGraphBuilder,
            defaultDataViewBuilder: ProductSalesByDateData,
            dataView: DataView;

        beforeEach(() => {
            visualBuilder = new StreamGraphBuilder(1000, 500);
            defaultDataViewBuilder = new ProductSalesByDateData();

            dataView = defaultDataViewBuilder.getDataView();
        });

        describe("DOM tests", () => {
            it("path is not throwing exceptions (NaN values)", () => {
                dataView.categorical.values[0].values = [NaN];
                dataView.categorical.values[1].values = [NaN];
                dataView.categorical.values[2].values = [NaN];
                dataView.categorical.values[3].values = [NaN];

                visualBuilder.updateFlushAllD3Transitions(dataView);

                $(".streamGraph .dataPointsContainer")
                    .children("path")
                    .each(function (index: number, element: Element) {
                        let nanLocation: number = ($(element).attr("d")).indexOf("NaN");

                        expect(nanLocation !== -1).toBeFalsy();
                    });
            });

            it("should display text in x-axis and not values", () => {
                dataView.categorical.categories[0].values = [
                    "Jan",
                    "Feb",
                    "Mar",
                    "Apr",
                    "May",
                    "Jun",
                    "Jul",
                    "Aug",
                    "Sep",
                    "Oct",
                    "Nov",
                    "Dec"
                ];

                visualBuilder.updateFlushAllD3Transitions(dataView);

                const isNumberRegExp: RegExp = /\d/;

                visualBuilder.xAxisTicks
                    .children("text")
                    .each(function (index: number, element: Element) {
                        expect(isNumberRegExp.test($(element).text())).toBeFalsy();
                    });
            });

            it("svg element created", () => {
                expect(visualBuilder.mainElement[0]).toBeInDOM();
            });

            it("update", () => {
                visualBuilder.updateFlushAllD3Transitions(dataView);

                expect(visualBuilder.layers.length)
                    .toBe(dataView.categorical.values.length);
            });

            it("Should add right amount of legend items", () => {
                let selectionIdIndex: number = 0;

                powerbi.extensibility.utils.test.mocks.createSelectionId = function () {
                    return new MockISelectionId((++selectionIdIndex).toString());
                };

                dataView.metadata.objects = {
                    legend: {
                        show: true
                    }
                };

                visualBuilder.updateFlushAllD3Transitions(dataView);

                expect(visualBuilder.legendItemText.length)
                    .toBe(dataView.categorical.values.length);
            });

            it("multi-selection test", () => {
                visualBuilder.updateFlushAllD3Transitions(dataView);

                const firstLayer: JQuery = visualBuilder.layers.eq(0),
                    secondLayer: JQuery = visualBuilder.layers.eq(1),
                    thirdLayer: JQuery = visualBuilder.layers.eq(2);

                clickElement(firstLayer);
                clickElement(secondLayer, true);

                expect(parseFloat(firstLayer.css("fill-opacity"))).toBe(1);
                expect(parseFloat(secondLayer.css("fill-opacity"))).toBe(1);
                expect(parseFloat(thirdLayer.css("fill-opacity"))).toBeLessThan(1);
            });
        });

        describe("Format settings test", () => {
            describe("Legend", () => {
                beforeEach(() => {
                    dataView.metadata.objects = {
                        legend: {
                            show: true
                        }
                    };
                });

                it("show", () => {
                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    expect(visualBuilder.legendGroup.children()).toBeInDOM();

                    (dataView.metadata.objects as any).legend.show = false;
                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    expect(visualBuilder.legendGroup.children()).not.toBeInDOM();
                });

                it("position", () => {
                    (dataView.metadata.objects as any).legend.show = true;
                    (dataView.metadata.objects as any).legend.position = legendPosition.top;

                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    expect(visualBuilder.legendOrientation).toEqual("0");
                    expect(visualBuilder.legendWidth).toBeGreaterThan(200);

                    (dataView.metadata.objects as any).legend.position = legendPosition.rightCenter;

                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    expect(visualBuilder.legendOrientation).toEqual("7");
                    expect(visualBuilder.legendWidth).toBeLessThan(200);
                });
            });

            describe("Data labels", () => {
                beforeEach(() => {
                    dataView.metadata.objects = {
                        labels: {
                            show: true
                        }
                    };
                });

                it("show", () => {
                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    expect(visualBuilder.dataLabelsText).toBeInDOM();

                    (dataView.metadata.objects as any).labels.show = false;

                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    expect(visualBuilder.dataLabelsText).not.toBeInDOM();
                });

                it("color", () => {
                    const color: string = "#ABCDEF";

                    (dataView.metadata.objects as any).labels.color = getSolidColorStructuralObject(color);

                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    visualBuilder.dataLabelsText
                        .toArray()
                        .forEach((element: Element) => {
                            assertColorsMatch($(element).css("fill"), color);
                        });
                });

                it("font size", () => {
                    const fontSize: number = 22,
                        expectedFontSize: string = "29.3333px";

                    (dataView.metadata.objects as any).labels.fontSize = fontSize;

                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    visualBuilder.dataLabelsText
                        .toArray()
                        .forEach((element: Element) => {
                            expect($(element).css("font-size")).toBe(expectedFontSize);
                        });
                });
            });

            describe("X-axis", () => {
                beforeEach(() => {
                    dataView.metadata.objects = {
                        categoryAxis: {
                            show: true
                        }
                    };
                });

                it("show", () => {
                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    expect(visualBuilder.xAxisTicks).toBeInDOM();

                    (dataView.metadata.objects as any).categoryAxis.show = false;
                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    expect(visualBuilder.xAxisTicks).not.toBeInDOM();
                });

                it("show title", () => {
                    (dataView.metadata.objects as any).categoryAxis.showAxisTitle = true;
                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    expect(visualBuilder.xAxisLabel).toBeInDOM();

                    (dataView.metadata.objects as any).categoryAxis.showAxisTitle = false;
                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    expect(visualBuilder.xAxisLabel).not.toBeInDOM();
                });

                it("color", () => {
                    const color: string = "#ABCDEF";

                    (dataView.metadata.objects as any).categoryAxis.labelColor = getSolidColorStructuralObject(color);

                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    visualBuilder.xAxisTicks.children("text")
                        .toArray()
                        .forEach((element: Element) => {
                            assertColorsMatch($(element).css("fill"), color);
                        });
                });
            });

            describe("Y-axis", () => {
                beforeEach(() => {
                    dataView.metadata.objects = {
                        valueAxis: {
                            show: true
                        }
                    };
                });

                it("show", () => {
                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    expect(visualBuilder.yAxisTicks).toBeInDOM();

                    (dataView.metadata.objects as any).valueAxis.show = false;
                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    expect(visualBuilder.yAxisTicks).not.toBeInDOM();
                });

                it("show title", () => {
                    (dataView.metadata.objects as any).valueAxis.showAxisTitle = true;
                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    expect(visualBuilder.yAxisLabel).toBeInDOM();

                    (dataView.metadata.objects as any).valueAxis.showAxisTitle = false;
                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    expect(visualBuilder.yAxisLabel).not.toBeInDOM();
                });

                it("color", () => {
                    const color: string = "#ABCDEF";

                    (dataView.metadata.objects as any).valueAxis.labelColor = getSolidColorStructuralObject(color);

                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    visualBuilder.yAxisTicks.children("text")
                        .toArray()
                        .forEach((element: Element) => {
                            assertColorsMatch($(element).css("fill"), color);
                        });
                });
            });
        });

        describe("interactivityService", () => {
            let colorPalette: IColorPalette,
                interactivityService: IInteractivityService;

            beforeEach(() => {
                interactivityService = createInteractivityService(visualBuilder.visualHost);

                colorPalette = createColorPalette();
            });

            it("Selection state set on converter result including clear", () => {
                let selectionIdIndex: number = 1,
                    series: StreamGraphSeries[],
                    queryName: string = dataView.metadata.columns[1].queryName,
                    seriesSelectionId: ISelectionId = new MockISelectionId(selectionIdIndex.toString());

                // We have to implement a simpler way to inject dependencies.
                powerbi.extensibility.utils.test.mocks.createSelectionId = function () {
                    if (selectionIdIndex++ === 1) {
                        return seriesSelectionId;
                    }

                    return new MockISelectionId((selectionIdIndex++).toString());
                };

                interactivityService["selectedIds"] = [seriesSelectionId];

                series = VisualClass.converter(
                    dataView,
                    colorPalette,
                    interactivityService,
                    visualBuilder.visualHost).series;

                // We should see the selection state applied to resulting data
                expect(series[0].selected).toBe(true);
                expect(series[1].selected).toBe(false);
                expect(series[2].selected).toBe(false);
                expect(series[3].selected).toBe(false);

                interactivityService.clearSelection();

                series = VisualClass.converter(
                    dataView,
                    colorPalette,
                    interactivityService,
                    visualBuilder.visualHost).series;

                // Verify the selection has been cleared
                expect(series[0].selected).toBe(false);
                expect(series[1].selected).toBe(false);
                expect(series[2].selected).toBe(false);
                expect(series[3].selected).toBe(false);
            });
        });

        describe("converter", () => {
            let colorPalette: IColorPalette;

            beforeEach(() => {
                colorPalette = createColorPalette();
            });

            it("arguments are null", () => {
                callConverterAndExpectExceptions(null, null, null);
            });

            it("arguments are undefined", () => {
                callConverterAndExpectExceptions(undefined, undefined, undefined);
            });

            it("dataView is correct", () => {
                callConverterAndExpectExceptions(
                    dataView,
                    colorPalette,
                    visualBuilder.visualHost);
            });

            describe("streamData", () => {
                let streamData: StreamData;

                beforeEach(() => {
                    streamData = callConverterAndExpectExceptions(
                        dataView,
                        colorPalette,
                        visualBuilder.visualHost);
                });

                it("streamData is defined", () => {
                    expect(streamData).toBeDefined();
                    expect(streamData).not.toBeNull();
                });

                it("series are defined", () => {
                    expect(streamData.series).toBeDefined();
                    expect(streamData.series).not.toBeNull();
                });

                it("every series is defined", () => {
                    streamData.series.forEach((series: StreamGraphSeries) => {
                        expect(series).toBeDefined();
                        expect(series).not.toBeNull();
                    });
                });

                it("every identity is defined", () => {
                    streamData.series.forEach((series: StreamGraphSeries) => {
                        let identity: ISelectionId = series.identity as ISelectionId;

                        expect(identity).toBeDefined();
                        expect(identity).not.toBeNull();
                    });
                });

                it("dataPoints are defined", () => {
                    streamData.series.forEach((series: StreamGraphSeries) => {
                        expect(series.dataPoints).toBeDefined();
                        expect(series.dataPoints).not.toBeNull();
                        expect(series.dataPoints.length).toBeGreaterThan(0);
                    });
                });

                it("every dataPoint is defined", () => {
                    streamData.series.forEach((series: StreamGraphSeries) => {
                        series.dataPoints.forEach((dataPoint: StreamDataPoint) => {
                            expect(dataPoint).toBeDefined();
                            expect(dataPoint).not.toBeNull();
                        });
                    });
                });

                describe("legendData", () => {
                    it("legendData should be defined", () => {
                        expect(streamData.legendData).toBeDefined();
                    });

                    it("legendData.dataPoints should be defined", () => {
                        expect(streamData.legendData.dataPoints).toBeDefined();
                    });

                    it("name of the legend data points and name of the groups should be the same", () => {
                        const dataView: DataView = defaultDataViewBuilder.getDataView(undefined, true),
                            expectedGroups: string[] = defaultDataViewBuilder.groups,
                            streamData: StreamData = callConverterAndExpectExceptions(
                                dataView,
                                colorPalette,
                                visualBuilder.visualHost),
                            actualLegendDataPoints: LegendDataPoint[] = streamData.legendData.dataPoints,
                            groupOffset: number = actualLegendDataPoints.length / expectedGroups.length;

                        actualLegendDataPoints.forEach((dataPoint: LegendDataPoint, index: number) => {
                            expect(dataPoint.label).toBe(expectedGroups[Math.floor(index / groupOffset)]);
                        });
                    });
                });
            });

            function callConverterAndExpectExceptions(
                dataView: DataView,
                colorPalette: IColorPalette,
                visualHost: IVisualHost,
                interactivityService?: IInteractivityService): StreamData {

                let streamData: StreamData;

                expect(() => {
                    streamData = VisualClass.converter(
                        dataView,
                        colorPalette,
                        interactivityService,
                        visualHost);
                }).not.toThrow();

                return streamData;
            }
        });
    });
}
