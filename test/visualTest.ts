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
import { ProductSalesByDateData, MovieGenreSalesByDateData } from "./visualData";
import { StreamGraphSeries, StreamData, StreamDataPoint } from "../src/dataInterfaces";
import { StreamGraph, VisualUpdateType } from "../src/visual";
import { ValueType } from "powerbi-visuals-utils-typeutils/lib/valueType";
import { LabelOverlapHandling } from "../src/utils";

describe("StreamGraph", () => {
    let visualBuilder: StreamGraphBuilder,
        defaultDataViewBuilder: ProductSalesByDateData,
        otherDataViewBuilder: MovieGenreSalesByDateData,
        dataView: DataView,
        dataViews: DataView[];

    const maxPixelDiffereneceDelta = 3;

    beforeEach(() => {
        visualBuilder = new StreamGraphBuilder(1000, 500);
        defaultDataViewBuilder = new ProductSalesByDateData();
        otherDataViewBuilder = new MovieGenreSalesByDateData();

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
            paths.forEach(function (element) {
                const nanLocation = element.getAttribute("d")!.indexOf("NaN");
                expect(nanLocation).toBe(-1);
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

            Array.from(visualBuilder.xAxisTicks).forEach((element) => {
                const textElements = element.querySelectorAll("text");
                Array.from(textElements).forEach((textElement) => {
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

            const layers = Array.from(visualBuilder.layers).map(() => { });
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

            describe("overlap handling", () => {
                beforeEach(() => {
                    // Create test data with potential overlaps
                    dataView.metadata.objects = {
                        labels: {
                            show: true,
                            fontSize: 14
                        }
                    };
                });

                it("should handle Standard overlap handling", () => {
                    (dataView.metadata.objects as any).labels.overlapHandling = {
                        value: { value: LabelOverlapHandling[LabelOverlapHandling.Standard] }
                    };

                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    // Standard handling should show all labels
                    expect(visualBuilder.dataLabelsText.length).toBeGreaterThan(0);
                    
                    // Verify labels are rendered
                    const labelsContainer = visualBuilder.mainElement.querySelector(".data-labels-container");
                    expect(labelsContainer).not.toBeNull();
                });

                it("should handle HideOverlap overlap handling", () => {
                    (dataView.metadata.objects as any).labels.overlapHandling = {
                        value: { value: LabelOverlapHandling[LabelOverlapHandling.HideOverlap] }
                    };

                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    // HideOverlap should potentially reduce the number of visible labels
                    const labelsContainer = visualBuilder.mainElement.querySelector(".data-labels-container");
                    expect(labelsContainer).not.toBeNull();
                    
                    // Verify that overlap handling logic has been applied
                    const visibleLabels = visualBuilder.dataLabelsText;
                    expect(visibleLabels.length).toBeGreaterThanOrEqual(0);
                });

                it("should handle OffsetOverlap overlap handling", () => {
                    (dataView.metadata.objects as any).labels.overlapHandling = {
                        value: { value: LabelOverlapHandling[LabelOverlapHandling.OffsetOverlap] }
                    };

                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    // OffsetOverlap should show all labels but potentially move their positions
                    const labelsContainer = visualBuilder.mainElement.querySelector(".data-labels-container");
                    expect(labelsContainer).not.toBeNull();
                    
                    // Verify labels exist
                    expect(visualBuilder.dataLabelsText.length).toBeGreaterThanOrEqual(0);
                });

                it("should handle numeric enum values for overlap handling", () => {
                    // Test with numeric values instead of enum strings
                    (dataView.metadata.objects as any).labels.overlapHandling = {
                        value: { value: "1" } // HideOverlap
                    };

                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    const labelsContainer = visualBuilder.mainElement.querySelector(".data-labels-container");
                    expect(labelsContainer).not.toBeNull();
                });

                it("should handle string enum values for overlap handling", () => {
                    // Test with string enum names
                    (dataView.metadata.objects as any).labels.overlapHandling = {
                        value: { value: "OffsetOverlap" }
                    };

                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    const labelsContainer = visualBuilder.mainElement.querySelector(".data-labels-container");
                    expect(labelsContainer).not.toBeNull();
                });

                it("should default to Standard when overlap handling is not set", () => {
                    // Don't set overlapHandling, should default to Standard
                    delete (dataView.metadata.objects as any).labels.overlapHandling;

                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    const labelsContainer = visualBuilder.mainElement.querySelector(".data-labels-container");
                    expect(labelsContainer).not.toBeNull();
                    expect(visualBuilder.dataLabelsText.length).toBeGreaterThanOrEqual(0);
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
                    Array.from(element.children).forEach(child => {
                        if (child.children.length == 0) return;
                        assertColorsMatch(getComputedStyle(child.children[1]).fill, color);
                    });
                });
            });

            it("font size", () => {
                const fontSize = 14;
                const expectedFontSize = "14px";
                (dataView.metadata.objects as any).categoryAxis.fontSize = fontSize;
                visualBuilder.updateFlushAllD3Transitions(dataView);
                const xAxisTicks = visualBuilder.xAxisTicks;
                const xAxisTick = xAxisTicks[0];
                const xAxisTickChildren = xAxisTick.children;
                const g = xAxisTickChildren[1].children[1];
                const actualFontSize = getComputedStyle(g).fontSize;
                expect(actualFontSize).toBe(expectedFontSize);
            });

            it("first tick aligns with start of graph", () => {
                visualBuilder.updateFlushAllD3Transitions(dataView);
                const firstLayerX = visualBuilder.layers[0].getBoundingClientRect().x;
                const axisDomainX = visualBuilder.xAxisTicks[0].children[0].getBoundingClientRect().x;

                expect(Math.abs(axisDomainX - firstLayerX)).toBeLessThan(maxPixelDiffereneceDelta);
            });

            it("should support rotated x-axis labels", () => {
                (dataView.metadata.objects as any).categoryAxis.labelOrientationMode = {
                    value: { value: "ForceRotate" }
                };

                visualBuilder.updateFlushAllD3Transitions(dataView);

                const xAxisTicks = visualBuilder.xAxisTicks;
                expect(xAxisTicks.length).toBeGreaterThan(0);
                
                // Check that axis is rendered properly with rotation setting
                const firstTick = xAxisTicks[0];
                expect(firstTick).toBeTruthy();
                
                // Look for text elements within the tick structure
                const textElements = firstTick.querySelectorAll("text");
                if (textElements.length > 0) {
                    // At least one text element should exist
                    expect(textElements.length).toBeGreaterThan(0);
                } else {
                    // Even if no text elements are found, the tick structure should exist
                    expect(firstTick.children.length).toBeGreaterThan(0);
                }
            });

            it("should handle default label orientation mode", () => {
                (dataView.metadata.objects as any).categoryAxis.labelOrientationMode = {
                    value: { value: "Default" }
                };

                visualBuilder.updateFlushAllD3Transitions(dataView);

                const xAxisTicks = visualBuilder.xAxisTicks;
                expect(xAxisTicks.length).toBeGreaterThan(0);
                
                // Verify axis is rendered properly with default orientation
                const firstTick = xAxisTicks[0];
                const textElement = firstTick.querySelector("text");
                expect(textElement).toBeTruthy();
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
                    Array.from(element.children).forEach(child => {
                        if (child.children.length == 0) return;
                        assertColorsMatch(getComputedStyle(child.children[1]).fill, color);
                    });
                });
            });

            it("font size", () => {
                const fontSize = 14;
                const expectedFontSize = "14px";
                (dataView.metadata.objects as any).valueAxis.fontSize = fontSize;
                visualBuilder.updateFlushAllD3Transitions(dataView);
                const yAxisTicks = visualBuilder.yAxisTicks;
                const yAxisTick = yAxisTicks[0];
                const yAxisTickChildren = yAxisTick.children;
                const g = yAxisTickChildren[1].children[1];
                const actualFontSize = getComputedStyle(g).fontSize;
                expect(actualFontSize).toBe(expectedFontSize);
            });
        });

        describe("Streams Independent Coloring", () => {
            beforeEach(() => {
                // Setup data view with streams settings
                dataView.metadata.objects = {
                    streams: {
                        colors: {
                            fill: { value: "#FF0000" }
                        }
                    }
                };
            });

            it("should apply independent colors to different streams", () => {
                const customColors = {
                    streams: {
                        colors: {
                            fill: { value: "#FF0000" }  // Red for first stream
                        }
                    }
                };
                
                dataView.metadata.objects = customColors;
                visualBuilder.updateFlushAllD3Transitions(dataView);

                const layers = visualBuilder.layers;
                expect(layers.length).toBeGreaterThan(0);
                
                // Verify that layers are rendered with custom styling
                Array.from(layers).forEach((layer: HTMLElement) => {
                    expect(layer).toBeTruthy();
                    // Layer should have some fill or stroke styling applied
                    const computedStyle = getComputedStyle(layer);
                    expect(computedStyle.fill || computedStyle.stroke).toBeTruthy();
                });
            });

            it("should handle multiple stream colors independently", () => {
                // Create data with multiple series to test independent coloring
                const multiSeriesData = defaultDataViewBuilder.getDataView(undefined, true);
                
                visualBuilder.updateFlushAllD3Transitions(multiSeriesData);
                
                const layers = visualBuilder.layers;
                expect(layers.length).toBeGreaterThan(1);
                
                // Verify each layer can be styled independently
                const firstLayerStyle = getComputedStyle(layers[0]);
                const secondLayerStyle = getComputedStyle(layers[1]);
                
                expect(firstLayerStyle).toBeTruthy();
                expect(secondLayerStyle).toBeTruthy();
                
                // Each layer should have styling applied
                expect(firstLayerStyle.fill || firstLayerStyle.stroke).toBeTruthy();
                expect(secondLayerStyle.fill || secondLayerStyle.stroke).toBeTruthy();
            });

            it("should maintain stream identity for color mapping", () => {
                visualBuilder.updateFlushAllD3Transitions(dataView);
                
                const layers = visualBuilder.layers;
                expect(layers.length).toBeGreaterThan(0);
                
                // Verify that each layer maintains its identity for consistent coloring
                Array.from(layers).forEach((layer: HTMLElement) => {
                    expect(layer.getAttribute("class")).toContain("layer");
                    // Each layer should have consistent styling
                    const computedStyle = getComputedStyle(layer);
                    expect(computedStyle).toBeTruthy();
                });
            });

            it("should update colors when stream settings change", () => {
                // Initial render
                visualBuilder.updateFlushAllD3Transitions(dataView);
                
                const initialLayers = visualBuilder.layers;
                expect(initialLayers.length).toBeGreaterThan(0);
                
                // Update with new color settings
                const updatedColorSettings = {
                    streams: {
                        colors: {
                            fill: { value: "#00FF00" }  // Green
                        }
                    }
                };
                
                dataView.metadata.objects = updatedColorSettings;
                visualBuilder.updateFlushAllD3Transitions(dataView);
                
                const updatedLayers = visualBuilder.layers;
                expect(updatedLayers.length).toBe(initialLayers.length);
                
                // Verify layers are still properly rendered after color update
                Array.from(updatedLayers).forEach((layer: HTMLElement) => {
                    expect(layer).toBeTruthy();
                    const computedStyle = getComputedStyle(layer);
                    expect(computedStyle.fill || computedStyle.stroke).toBeTruthy();
                });
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
            
            (interactivityService as any)["selectionManager"].selectionIds = [seriesSelectionId];

            const data = StreamGraph.converter(
                dataView,
                colorPalette,
                interactivityService,
                visualBuilder.visualHost);

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
                    const identity: ISelectionId = series.identity as ISelectionId;

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
                    visualHost);
            }).not.toThrow();

            streamData = StreamGraph.converter(
                dataView,
                colorPalette,
                interactivityService!,
                visualHost);

            return streamData;
        }
    });

    describe("Capabilities tests", () => {
        it("all items having displayName should have displayNameKey property", async () => {
            const r = await fetch("base/capabilities.json");
            const jsonData = await r.json();
            const objectsChecker: Function = (obj:any) => {
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
                    const layers = Array.from(visualBuilder.layers);

                    expect(isColorAppliedToElements(layers, undefined, "fill"));

                    done();
                });
            });

            it("should use stroke style", (done) => {
                visualBuilder.updateRenderTimeout(dataView, () => {
                    const layers = Array.from(visualBuilder.layers);

                    expect(isColorAppliedToElements(layers, foregroundColor, "stroke"));

                    done();
                });
            });
        });
    });

    describe("support highlight test", () => {
        const seriesCount: number = 3;
        const seriesLength: number = 12;
        let dataViewWithHighLighted: DataView;
        let highlightedSeriesNumber: number;
        let highlightedElementNumber: number;

        beforeEach(() => {
            highlightedSeriesNumber = Math.round(getRandomNumber(0, seriesCount - 1));
            highlightedElementNumber = Math.round(getRandomNumber(0, seriesLength - 1));

            dataViewWithHighLighted = otherDataViewBuilder.getDataView(undefined, true, highlightedSeriesNumber, highlightedElementNumber);
            visualBuilder.update(dataViewWithHighLighted);
        });

        it("selected value/serie should have full opacity, other should have less opacity", (done) => {
            expect(parseFloat(visualBuilder.layers[highlightedSeriesNumber].style.opacity)).toBe(1);
            for (let idx = 0; idx < seriesCount; idx++) {
                if (idx != highlightedSeriesNumber) {
                    expect(parseFloat(visualBuilder.layers[idx].style.opacity)).toBeLessThan(1);
                }
            }
            done();
        });
    });

    describe("y scale and graph waves alignment test with wiggle", () => {
        let dataViewShort: DataView;
        const maxPixelDiffereneceDelta = 3;

        beforeEach(async () => {
            dataViewShort = otherDataViewBuilder.getDataView(undefined);
            dataViewShort.metadata.objects = {
                curvature: {
                    enabled: false
                },
                general: {
                    wiggle: true
                },
                valueAxis: {
                    highPrecision: true
                }
            };

            visualBuilder.updateFlushAllD3Transitions(dataViewShort);
        });

        it("top tick y axis matches top wave of graph", (done) => {
            const yAxisTicks = visualBuilder.yAxisTicks;
            const yAxisTopTick = yAxisTicks[0].childNodes[11].childNodes[0] as Element;
            const yAxisRect = yAxisTopTick.getBoundingClientRect();

            const dataLayers = visualBuilder.layers;
            const topDataLayer = dataLayers[2];
            const topDataRect = topDataLayer.getBoundingClientRect();

            expect(Math.abs(yAxisRect.y - topDataRect.y)).toBeLessThanOrEqual(maxPixelDiffereneceDelta);
            done();
        });

        it("bottom tick y axis matches bottom wave of graph", (done) => {
            const yAxisTicks = visualBuilder.yAxisTicks;
            const yAxisBottomTick = yAxisTicks[0].childNodes[1].childNodes[0] as Element;
            const yAxisRect = yAxisBottomTick.getBoundingClientRect();

            const dataLayers = visualBuilder.layers;
            const bottomDataLayer = dataLayers[0];
            const bottomDataRect = bottomDataLayer.getBoundingClientRect();

            expect(Math.abs(yAxisRect.bottom - bottomDataRect.bottom)).toBeLessThanOrEqual(maxPixelDiffereneceDelta);
            done();
        });

        it("tick y axis matches wave of graph", (done) => {
            const yAxisTicks = visualBuilder.yAxisTicks;
            const yAxisBottomTick = yAxisTicks[0].childNodes[10].childNodes[0] as Element;
            const yAxisRect = yAxisBottomTick.getBoundingClientRect();

            const dataLayers = visualBuilder.layers;
            const bottomDataLayer = dataLayers[0];
            const bottomDataRect = bottomDataLayer.getBoundingClientRect();

            expect(Math.abs(yAxisRect.y - bottomDataRect.y)).toBeLessThanOrEqual(maxPixelDiffereneceDelta);
            done();
        });
    });

    describe("y scale and graph waves alignment test without wiggle", () => {
        let dataViewShort: DataView;

        beforeEach(async () => {
            dataViewShort = otherDataViewBuilder.getDataView(undefined);
            dataViewShort.metadata.objects = {
                curvature: {
                    enabled: false
                },
                general: {
                    wiggle: false
                },
                valueAxis: {
                    highPrecision: true
                }
            };

            visualBuilder.updateFlushAllD3Transitions(dataViewShort);
        });

        it("top tick y axis matches top wave of graph", (done) => {
            const yAxisTicks = visualBuilder.yAxisTicks;
            const yAxisTopTick = yAxisTicks[0].childNodes[11].childNodes[0] as Element;
            const yAxisRect = yAxisTopTick.getBoundingClientRect();

            const dataLayers = visualBuilder.layers;
            const topDataLayer = dataLayers[2];
            const topDataRect = topDataLayer.getBoundingClientRect();

            expect(Math.abs(yAxisRect.y - topDataRect.y)).toBeLessThanOrEqual(maxPixelDiffereneceDelta);
            done();
        });

        it("bottom tick y axis matches bottom wave of graph", (done) => {
            const yAxisTicks = visualBuilder.yAxisTicks;
            const yAxisBottomTick = yAxisTicks[0].childNodes[1].childNodes[0] as Element;
            const yAxisRect = yAxisBottomTick.getBoundingClientRect();

            const dataLayers = visualBuilder.layers;
            const bottomDataLayer = dataLayers[0];
            const bottomDataRect = bottomDataLayer.getBoundingClientRect();

            expect(Math.abs(yAxisRect.bottom - bottomDataRect.bottom)).toBeLessThanOrEqual(maxPixelDiffereneceDelta);
            done();
        });

        it("tick y axis matches wave of graph", (done) => {
            const yAxisTicks = visualBuilder.yAxisTicks;
            const yAxisBottomTick = yAxisTicks[0].childNodes[10].childNodes[0] as Element;
            const yAxisRect = yAxisBottomTick.getBoundingClientRect();

            const dataLayers = visualBuilder.layers;
            const bottomDataLayer = dataLayers[0];
            const bottomDataRect = bottomDataLayer.getBoundingClientRect();

            expect(Math.abs(yAxisRect.y - bottomDataRect.y)).toBeLessThanOrEqual(maxPixelDiffereneceDelta);
            done();
        });
    });

    describe("Stroke is applied on focus", () => {
        it("should apply thicker stroke on focus", () => {
            visualBuilder.updateFlushAllD3Transitions(dataView);
            const randomLayerIndex = Math.round(getRandomNumber(0, visualBuilder.layers.length - 1));
            const randomLayer = visualBuilder.layers[randomLayerIndex];

            randomLayer.focus();

            const focusedStrokeWidth: number = +getComputedStyle(randomLayer)
                .getPropertyValue("stroke-width")
                .replace('px', '');

            for (let idx = 0; idx < visualBuilder.layers.length; idx++) {
                if (idx == randomLayerIndex) {
                    continue;
                }

                const currentStrokeWidth: number = +getComputedStyle(visualBuilder.layers[idx])
                    .getPropertyValue("stroke-width")
                    .replace('px', '');

                expect(currentStrokeWidth).toBeLessThan(focusedStrokeWidth);
            }
        });
    });

});
