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

// d3
import { BaseType, Selection, select } from "d3-selection";

// powerbi.extensibility.utils.interactivity
import { interactivityBaseService } from "powerbi-visuals-utils-interactivityutils";
import IInteractiveBehavior = interactivityBaseService.IInteractiveBehavior;
import ISelectionHandler = interactivityBaseService.ISelectionHandler;
import IInteractivityService = interactivityBaseService.IInteractivityService;
import { StreamGraphSeries, StackedStackValue } from "./dataInterfaces";
import { getFillOpacity } from "./utils";

export interface BehaviorOptions extends interactivityBaseService.IBehaviorOptions<StreamGraphSeries>{
    selection: Selection<BaseType, StackedStackValue, any, any>;
    clearCatcher: Selection<BaseType, StreamGraphSeries, any, any>;
    interactivityService: IInteractivityService<StreamGraphSeries>;
    series: StreamGraphSeries[];
    labelsSelection?: Selection<BaseType, any, any, any>;
}

export class StreamGraphBehavior implements IInteractiveBehavior {
    private selection: Selection<BaseType, StackedStackValue, any, any>;
    private clearCatcher: Selection<BaseType, StreamGraphSeries, any, any>;
    private interactivityService: IInteractivityService<StreamGraphSeries>;
    private series: StreamGraphSeries[] = null;
    private labelsSelection: Selection<BaseType, any, any, any>;

    protected options: BehaviorOptions;
    protected selectionHandler: ISelectionHandler;

    public bindEvents(
        options: BehaviorOptions,
        selectionHandler: ISelectionHandler): void {

        this.selection = options.selection;
        this.clearCatcher = options.clearCatcher;
        this.interactivityService = options.interactivityService;
        this.selectionHandler = selectionHandler;
        this.labelsSelection = options.labelsSelection;

        this.series = options.series;

        this.bindContextMenuEvent();
        this.bindClickEvents();
        this.bindKeyboardEvents();

        this.clearCatcher.on("click", () => {
            selectionHandler.handleClearSelection();
        });
    }

    public renderSelection(hasHighlight: boolean): void {
        // Pre-calculate highlight states for all series to avoid redundant loops
        const highlightStates = this.calculateHighlightStates(hasHighlight);

        if (highlightStates.length === 0) {
            return;
        }

        // Update main selection opacity
        this.selection.style("opacity", (dataPoint: StackedStackValue) => {
            const currentIdx = dataPoint?.index;
            if (currentIdx >= 0 && currentIdx < highlightStates.length) {
                const { isCurrentHighlighted, anyHighlightedAtAll } = highlightStates[currentIdx];
                return getFillOpacity(isCurrentHighlighted, anyHighlightedAtAll);
            }
            return getFillOpacity(false, false);
        });

        // Update data labels visibility - labels bound to streams
        if (this.labelsSelection && !this.labelsSelection.empty()) {
            this.labelsSelection.style("opacity", (d: any, i: number) => {
                if (i >= 0 && i < highlightStates.length) {
                    const { isCurrentHighlighted, anyHighlightedAtAll } = highlightStates[i];
                    return getFillOpacity(isCurrentHighlighted, anyHighlightedAtAll);
                }
                return getFillOpacity(false, false);
            });

            // Update nested stream labels
            this.labelsSelection.selectAll("g.stream-label-group").each((d: any, i: number, nodes: any) => {
                if (nodes[i] && i >= 0 && i < highlightStates.length) {
                    const streamGroup = nodes[i];
                    const { isCurrentHighlighted, anyHighlightedAtAll } = highlightStates[i];
                    const opacity = getFillOpacity(isCurrentHighlighted, anyHighlightedAtAll);
                    select(streamGroup).style("opacity", opacity);
                }
            });
        }
    }

    //Pre-calculates highlight states for all series to avoid redundant nested loops
  
    private calculateHighlightStates(hasHighlight: boolean): Array<{ isCurrentHighlighted: boolean, anyHighlightedAtAll: boolean }> {
        if (!this.series || this.series.length === 0) {
            return [];
        }

        // First pass: check if any data point has highlights across all series
        let globalHighlightFound = hasHighlight;
        const seriesHighlightStates: boolean[] = new Array(this.series.length).fill(false);
        
        for (let idx = 0; idx < this.series.length; idx++) {
            let seriesHasHighlight = false;
            const dataPoints = this.series[idx].dataPoints;
            
            for (let innerIdx = 0; innerIdx < dataPoints.length; innerIdx++) {
                if (dataPoints[innerIdx]?.highlight) {
                    seriesHasHighlight = true;
                    globalHighlightFound = true;
                    break; // Early exit for performance
                }
            }
            seriesHighlightStates[idx] = seriesHasHighlight;
        }

        // Second pass: build result array with calculated states
        return this.series.map((series, idx) => ({
            isCurrentHighlighted: Boolean(series.selected) || seriesHighlightStates[idx],
            anyHighlightedAtAll: globalHighlightFound
        }));
    }

    private bindContextMenuEvent() {
        this.selection.on('contextmenu', (event: PointerEvent, dataPoint: StackedStackValue) => {
            this.selectionHandler.handleContextMenu(dataPoint ? this.series[dataPoint.index] : { "selected": false },
                {
                    x: event.clientX,
                    y: event.clientY
                });
            event.preventDefault();
            event.stopPropagation();
        });
    }

    private bindClickEvents() {
        this.selection.on("click", (event: PointerEvent, dataPoint: StackedStackValue) => {
            event && this.selectionHandler.handleSelection(
                this.series[dataPoint.index],
                event.ctrlKey);
        });
    }

    private bindKeyboardEvents() {
        this.selection.on("keydown", (event: KeyboardEvent, dataPoint: StackedStackValue) => {
            if (event.code !== "Enter" && event.code !== "Space") {
                return;
            }
            this.selectionHandler.handleSelection(this.series[dataPoint.index], event.ctrlKey || event.metaKey || event.shiftKey);
        });
    }
}
