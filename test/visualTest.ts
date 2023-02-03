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

// powerbi.visuals
import ISelectionId = powerbi.visuals.ISelectionId;

// powerbi.extensibility.utils
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import IColorPalette = powerbi.extensibility.IColorPalette;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import DataView = powerbi.DataView;

// powerbi.extensibility.utils.chart
import { legendPosition } from "powerbi-visuals-utils-chartutils";
import { LegendDataPoint } from "powerbi-visuals-utils-chartutils/lib/legend/legendInterfaces";

// powerbi.extensibility.utils.test
import {
    clickElement,
    createSelectionId,
    assertColorsMatch,
    createColorPalette,
    MockISelectionIdBuilder,
    getRandomNumber
} from "powerbi-visuals-utils-testutils";

// powerbi.extensibility.utils.interactivity
import { interactivitySelectionService, interactivityBaseService } from "powerbi-visuals-utils-interactivityutils";
import IInteractivityService = interactivityBaseService.IInteractivityService;
import createInteractivitySelectionService = interactivitySelectionService.createInteractivitySelectionService;

import { StreamGraphBuilder } from "./visualBuilder";
import { isColorAppliedToElements, getSolidColorStructuralObject } from "./helpers/helpers";
import { ProductSalesByDateData } from "./visualData";
import { StreamGraphSeries, StreamData, StreamDataPoint } from "../src/dataInterfaces";
import { StreamGraph, VisualUpdateType } from "../src/visual";
import { ValueType } from "powerbi-visuals-utils-typeutils/lib/valueType";

describe("StreamGraph", () => {
    let visualBuilder: StreamGraphBuilder,
        defaultDataViewBuilder: ProductSalesByDateData,
        dataView: DataView,
        dataViews: DataView[];

    beforeEach(() => {
        visualBuilder = new StreamGraphBuilder(1000, 500);
        defaultDataViewBuilder = new ProductSalesByDateData();

        dataView = defaultDataViewBuilder.getDataView();
        dataViews = [dataView];
    });

    describe("DOM tests", () => {
        it("path is not throwing exceptions (NaN values)", () => {
            dataView.categorical!.values![0].values = [NaN];
            dataView.categorical!.values![1].values = [NaN];
            dataView.categorical!.values![2].values = [NaN];
            dataView.categorical!.values![3].values = [NaN];

            visualBuilder.updateFlushAllD3Transitions(dataView);

            const dataPointsContainer = document.querySelector(".streamGraph .dataPointsContainer");
            const paths = dataPointsContainer!.querySelectorAll("path");
            paths.forEach(function (element, index) {
                let nanLocation = element.getAttribute("d")!.indexOf("NaN");
                expect(nanLocation !== -1).toBeFalsy();
            });
        });

        it("should display text in x-axis and not values", () => {
            dataView.categorical!.categories![0].source.type = ValueType.fromDescriptor({ dateTime: false })
            dataView.categorical!.categories![0].values = [
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

            const isNumberRegExp = /\d/;

            Array.from(visualBuilder.xAxisTicks).forEach((element, index) => {
            const textElements = element.querySelectorAll("text");
                Array.from(textElements).forEach((textElement, index, array) => {
                    expect(isNumberRegExp.test(textElement.textContent!)).toBeFalsy();
                });
            });
        });

        it("svg element created", () => {
            expect(document.body.contains(visualBuilder.mainElement)).toBeTruthy();
        });

        it("Layers are not empty on first data initialization", () => {
            const visualUpdateOptions: VisualUpdateOptions = {
                dataViews: [dataView],
                viewport: visualBuilder.viewport,
                type: <any>VisualUpdateType.Data
            } as VisualUpdateOptions;

            visualBuilder.updateVisual(visualUpdateOptions);

            const layers = Array.from(visualBuilder.layers).map((layer: HTMLElement) => {});
            expect(layers.length).toBeGreaterThan(0);
        });

        it("update", () => {
            visualBuilder.updateFlushAllD3Transitions(dataView);

            expect(visualBuilder.layers.length)
                .toBe(dataView.categorical!.values!.length);
        });

        it("Should add right amount of legend items", () => {
            dataView.metadata.objects = {
                legend: {
                    show: true
                }
            };

            visualBuilder.updateFlushAllD3Transitions(dataView);

            expect(visualBuilder.legendItemText.length)
                .toBe(dataView.categorical!.values!.length);
        });

        it("multi-selection test", () => {
            visualBuilder.updateFlushAllD3Transitions(dataView);
        
            const firstLayer = visualBuilder.layers[0],
                secondLayer = visualBuilder.layers[1],
                thirdLayer = visualBuilder.layers[2];
        
            clickElement(firstLayer);
            clickElement(secondLayer, true);
        
            expect(parseFloat(firstLayer.style.opacity)).toBe(1);
            expect(parseFloat(secondLayer.style.opacity)).toBe(1);
            expect(parseFloat(thirdLayer.style.opacity)).toBeLessThan(1);
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
            
                const children = visualBuilder.legendGroup.children;
                let isInDom = false;
                for (let i = 0; i < children.length; i++) {
                    if (document.body.contains(children[i])) {
                        isInDom = true;
                        break;
                    }
                }
                expect(isInDom).toBe(true);
            
                (dataView.metadata.objects as any).legend.show = false;
                visualBuilder.updateFlushAllD3Transitions(dataView);
            
                isInDom = false;
                for (let i = 0; i < children.length; i++) {
                    if (document.body.contains(children[i])) {
                        isInDom = true;
                        break;
                    }
                }
                expect(isInDom).toBe(false);
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
            
                let isInDom = false;
                for (let i = 0; i < visualBuilder.dataLabelsText.length; i++) {
                    if (document.body.contains(visualBuilder.dataLabelsText[i])) {
                        isInDom = true;
                        break;
                    }
                }
                expect(isInDom).toBe(true);
            
                (dataView.metadata.objects as any).labels.show = false;
            
                visualBuilder.updateFlushAllD3Transitions(dataView);
            
                isInDom = false;
                for (let i = 0; i < visualBuilder.dataLabelsText.length; i++) {
                    if (document.body.contains(visualBuilder.dataLabelsText[i])) {
                        isInDom = true;
                        break;
                    }
                }
                expect(isInDom).toBe(false);
            });

            it("showValues", () => {
                const expectedTextWithValue = "Product";
                visualBuilder.updateFlushAllD3Transitions(dataView);
                (dataView.metadata.objects as any).labels.showValue = true;
            
                visualBuilder.updateFlushAllD3Transitions(dataView);
                expect(visualBuilder.dataLabelsText[0].textContent!.length).toBeGreaterThan(expectedTextWithValue.length);
            });

            it("color", () => {
                const color = "#ABCDEF";
            
                (dataView.metadata.objects as any).labels.color = getSolidColorStructuralObject(color);
            
                visualBuilder.updateFlushAllD3Transitions(dataView);
            
                Array.from(visualBuilder.dataLabelsText).forEach((element: HTMLElement) => {
                    assertColorsMatch(element.style.fill, color);
                });
            });
            
            it("font size", () => {
                const fontSize = 22,
                    expectedFontSize = "29.3333px";
            
                (dataView.metadata.objects as any).labels.fontSize = fontSize;
            
                visualBuilder.updateFlushAllD3Transitions(dataView);
            
                Array.from(visualBuilder.dataLabelsText).forEach((element: HTMLElement) => {
                    expect(element.style.fontSize).toBe(expectedFontSize);
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
            
                let isInDom = false;
                for (let i = 0; i < visualBuilder.xAxisTicks.length; i++) {
                    if (document.body.contains(visualBuilder.xAxisTicks[i])) {
                        isInDom = true;
                        break;
                    }
                }
                expect(isInDom).toBe(true);
            
                (dataView.metadata.objects as any).categoryAxis.show = false;
                visualBuilder.updateFlushAllD3Transitions(dataView);
            
                isInDom = false;
                for (let i = 0; i < visualBuilder.xAxisTicks.length; i++) {
                    if (document.body.contains(visualBuilder.xAxisTicks[i])) {
                        isInDom = true;
                        break;
                    }
                }
                expect(isInDom).toBe(false);
            });

            it("show title", () => {
                (dataView.metadata.objects as any).categoryAxis.showAxisTitle = true;
                visualBuilder.updateFlushAllD3Transitions(dataView);
            
                expect(document.body.contains(visualBuilder.xAxisLabel)).toBe(true);
            
                (dataView.metadata.objects as any).categoryAxis.showAxisTitle = false;
                visualBuilder.updateFlushAllD3Transitions(dataView);
            
                expect(document.body.contains(visualBuilder.xAxisLabel)).toBe(false);
            });

            it("color", () => {
                const color = "#ABCDEF";

                (dataView.metadata.objects as any).categoryAxis.labelColor = getSolidColorStructuralObject(color);

                visualBuilder.updateFlushAllD3Transitions(dataView);

                Array.from(visualBuilder.xAxisTicks).forEach(element => {
                    assertColorsMatch(getComputedStyle(element).fill, color);
                  });
            });

            it("font size", () => {
                const fontSize = 22;
                const expectedFontSize = "22px";
                (dataView.metadata.objects as any).categoryAxis.fontSize = fontSize;
                visualBuilder.updateFlushAllD3Transitions(dataView);
                const xAxisTicks = visualBuilder.xAxisTicks;
                const xAxisTick = xAxisTicks[0];
                const xAxisTickChildren = xAxisTick.children;
                const g = xAxisTickChildren[xAxisTickChildren.length - 1];
                const actualFontSize = getComputedStyle(g).fontSize;
                expect(actualFontSize).toBe(expectedFontSize);
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
            
                const yAxisTicksElements = Array.from(visualBuilder.yAxisTicks);
                const isInDom = yAxisTicksElements.some(element => element.parentNode);
                expect(isInDom).toBeTruthy();
            
                (dataView.metadata.objects as any).valueAxis.show = false;
                visualBuilder.updateFlushAllD3Transitions(dataView);
            
                const yAxisTicksElementsAfter = Array.from(visualBuilder.yAxisTicks);
                const isInDomAfter = yAxisTicksElementsAfter.some(element => element.parentNode);
                expect(isInDomAfter).toBeFalsy();
            });

            it("show title", () => {
                (dataView.metadata.objects as any).valueAxis.showAxisTitle = true;
                visualBuilder.updateFlushAllD3Transitions(dataView);

                expect(document.body.contains(visualBuilder.yAxisLabel)).toBe(true);

                (dataView.metadata.objects as any).valueAxis.showAxisTitle = false;
                visualBuilder.updateFlushAllD3Transitions(dataView);

                expect(document.body.contains(visualBuilder.yAxisLabel)).toBe(false);
            });

            
            it("color", () => {
                const color = "#ABCDEF";

                (dataView.metadata.objects as any).valueAxis.labelColor = getSolidColorStructuralObject(color);

                visualBuilder.updateFlushAllD3Transitions(dataView);

                Array.from(visualBuilder.yAxisTicks).forEach(element => {
                    assertColorsMatch(getComputedStyle(element).fill, color);
                });
            });

            it("font size", () => {
                const fontSize = 22;
                const expectedFontSize = "22px";
                (dataView.metadata.objects as any).valueAxis.fontSize = fontSize;
                visualBuilder.updateFlushAllD3Transitions(dataView);
                const yAxisTicks = visualBuilder.yAxisTicks;
                const yAxisTick = yAxisTicks[0];
                const yAxisTickChildren = yAxisTick.children;
                const g = yAxisTickChildren[yAxisTickChildren.length - 1];
                const actualFontSize = getComputedStyle(g).fontSize;
                expect(actualFontSize).toBe(expectedFontSize);
            });
        });
    });

    describe("interactivityService", () => {
        let colorPalette: IColorPalette,
            interactivityService: IInteractivityService<any>,
            selectionIdIndex: number = 1,
            seriesSelectionId: ISelectionId = createSelectionId(selectionIdIndex.toString());

        beforeEach(() => {
            const customMockISelectionIdBuilder = new MockISelectionIdBuilder();
            customMockISelectionIdBuilder.createSelectionId = () => {
                if (selectionIdIndex++ === 1) {
                    return seriesSelectionId;
                }
                
                return createSelectionId((++selectionIdIndex).toString());
            };
            visualBuilder.visualHost.createSelectionIdBuilder = () => customMockISelectionIdBuilder;
            interactivityService = createInteractivitySelectionService(visualBuilder.visualHost);

            colorPalette = createColorPalette();
        });

        it("Selection state set on converter result including clear", () => {
            let series: StreamGraphSeries[];

            interactivityService["selectionManager"].selectionIds = [seriesSelectionId];
            
            const data = StreamGraph.converter(
                dataView,
                colorPalette,
                interactivityService,
                visualBuilder.visualHost,
                dataViews);
                
            series = data.series;

            // We should see the selection state applied to resulting data
            expect(series[0].selected).toBe(true);
            expect(series[1].selected).toBe(false);
            expect(series[2].selected).toBe(false);
            expect(series[3].selected).toBe(false);

            interactivityService.clearSelection();

            series = StreamGraph.converter(
                dataView,
                colorPalette,
                interactivityService,
                visualBuilder.visualHost,
                dataViews).series;

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
            callConverterAndExpectExceptions(null!, null!, null!);
        });

        it("arguments are undefined", () => {
            callConverterAndExpectExceptions(undefined!, undefined!, undefined!);
        });

        it("dataView is correct", () => {
            callConverterAndExpectExceptions(
                dataView,
                colorPalette,
                visualBuilder.visualHost);
        });

        describe("isNumber", () => {
            it("should define number values", () => {
                const valueNumber = 100,
                    valueNull = null,
                    valueUndefined = undefined,
                    valueNan = NaN;

                expect(StreamGraph.isNumber(valueNumber)).toBeTruthy();
                expect(StreamGraph.isNumber(valueNull!)).toBeFalsy();
                expect(StreamGraph.isNumber(valueUndefined!)).toBeFalsy();
                expect(StreamGraph.isNumber(valueNan)).toBeFalsy();
            });
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
            interactivityService?: IInteractivityService<any>): StreamData {

            let streamData: StreamData;

            expect(() => {
                streamData = StreamGraph.converter(
                    dataView,
                    colorPalette,
                    interactivityService!,
                    visualHost,
                    dataViews);
            }).not.toThrow();

            streamData = StreamGraph.converter(
                dataView,
                colorPalette,
                interactivityService!,
                visualHost,
                dataViews);

            return streamData;
        }
    });

    describe("Capabilities tests", () => {
        it("all items having displayName should have displayNameKey property", async () => {
            let r = await fetch("base/capabilities.json");
            let jsonData = await r.json();
            let objectsChecker: Function = (obj) => {
                const objKeys = Object.keys(obj);
                for (let property of objKeys) {
                    let value: any = obj[property];

                    if (value.displayName) {
                        expect(value.displayNameKey).toBeDefined();
                    }

                    if (typeof value === "object") {
                        objectsChecker(value);
                    }
                }
            };

            objectsChecker(jsonData);
        });
    });

    describe("Accessibility", () => {
        describe("High contrast mode", () => {
            const backgroundColor: string = "#000000";
            const foregroundColor: string = "#ffff00";

            beforeEach(() => {
                visualBuilder.visualHost.colorPalette.isHighContrast = true;

                visualBuilder.visualHost.colorPalette.background = { value: backgroundColor };
                visualBuilder.visualHost.colorPalette.foreground = { value: foregroundColor };
            });

            it("should not use fill style", (done) => {
                visualBuilder.updateRenderTimeout(dataView, () => {
                    const layers = Array.from(visualBuilder.layers).map(element => {
                        return element;
                      });

                    expect(isColorAppliedToElements(layers, null, "fill"));

                    done();
                });
            });

            it("should use stroke style", (done) => {
                visualBuilder.updateRenderTimeout(dataView, () => {
                    const layers = Array.from(visualBuilder.layers).map(element => {
                        return element;
                      });

                    expect(isColorAppliedToElements(layers, foregroundColor, "stroke"));

                    done();
                });
            });
        });
    });

    describe("highlight test", () => {
        const seriesCount: number = 4;
        const seriesLenght: number = 50;
        let dataLabelsText: HTMLElement[];
        let dataViewWithHighLighted: DataView;
        let highligtedSeriesNumber: number;
        let hightlightedElementNumber: number;

        beforeEach(() => {
            highligtedSeriesNumber = Math.ceil(getRandomNumber(0, seriesCount - 1));
            hightlightedElementNumber = Math.ceil(getRandomNumber(0, seriesLenght - 1));

            dataViewWithHighLighted = defaultDataViewBuilder.getDataView(undefined, false, true, highligtedSeriesNumber, hightlightedElementNumber);
            dataViewWithHighLighted.metadata.objects = {
                labels: {
                    show: true,
                    showValue: true
                }
            };
            visualBuilder.update(dataViewWithHighLighted);
            
            dataLabelsText = Array.from(visualBuilder.dataLabelsText).map(element => {
                return element;
              });
        });

        it("should highligted elements labels count be similar to highlighted serie's previous elements count", (done) => {
            visualBuilder.updateRenderTimeout(dataViewWithHighLighted, () => {
                expect(dataLabelsText.length).toBeLessThan(seriesLenght);

                // depends on viewport and label width
                expect(dataLabelsText.length).toBeGreaterThanOrEqual(1);
                expect(dataLabelsText.length).toBeLessThanOrEqual(hightlightedElementNumber + 1);
                done();
            });
        });

        it("should highligted elements labels has right names", (done) => {
            visualBuilder.updateRenderTimeout(dataViewWithHighLighted, () => {
                const highlightedSeriesName: string = ProductSalesByDateData.GroupNames[highligtedSeriesNumber];
                const groupNameLength: number = ProductSalesByDateData.GroupNames[highligtedSeriesNumber].length;

                dataLabelsText.forEach((element, index) => {
                    const labelText: string = element.textContent!;
                    const labelValue: number = Number(labelText.substr(groupNameLength));
                    // if highlighted element is the last - its label is not rendered (for the prettier view)
                    const expectedLastLabelValue: number = (hightlightedElementNumber === seriesLenght - 1) ? 0 :
                        dataViewWithHighLighted.categorical!.values![highligtedSeriesNumber].values[hightlightedElementNumber] as number;

                    expect(labelText.includes(highlightedSeriesName)).toBe(true);
                    if (index === dataLabelsText.length - 1) {
                        expect(labelValue).toBe(expectedLastLabelValue);
                    } else {
                        expect(labelValue).toBe(0);
                    }
                });
                done();
            });
        });
    });
});
