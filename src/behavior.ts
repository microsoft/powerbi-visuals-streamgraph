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
import { BaseType, Selection } from "d3-selection";

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
    isFormatMode: boolean;
}

export class StreamGraphBehavior implements IInteractiveBehavior {
    private selection: Selection<BaseType, StackedStackValue, any, any>;
    private clearCatcher: Selection<BaseType, StreamGraphSeries, any, any>;
    private interactivityService: IInteractivityService<StreamGraphSeries>;
    private series: StreamGraphSeries[] = null;

    protected options: BehaviorOptions;
    protected selectionHandler: ISelectionHandler;

    public bindEvents(
        options: BehaviorOptions,
        selectionHandler: ISelectionHandler): void {

        this.selection = options.selection;
        this.clearCatcher = options.clearCatcher;
        this.interactivityService = options.interactivityService;
        this.selectionHandler = selectionHandler;

        this.series = options.series;

        this.applyOnObjectFormatMode(options.isFormatMode);
    }

    public renderSelection(hasHighlight: boolean): void {
        this.selection.style("opacity", (dataPoint: StackedStackValue) => {
            const currentIdx = dataPoint.index;
            const series = this.series[currentIdx];
            let isCurrentHighlighted : boolean = series.selected;
            let anyHighlightedAtAll : boolean = hasHighlight;

            //SupportHighlight Logic
            for(let idx = 0; idx < this.series.length; idx ++) {
                for(let innerIdx = 0; innerIdx < this.series[idx].dataPoints.length; innerIdx ++) {
                    if(idx == currentIdx) {
                        isCurrentHighlighted ||= this.series[idx].dataPoints[innerIdx].highlight;
                    }
                    anyHighlightedAtAll ||= this.series[idx].dataPoints[innerIdx].highlight;
                } 
            }

            return getFillOpacity(
                isCurrentHighlighted,
                anyHighlightedAtAll);
        });
    }
    
    private applyOnObjectFormatMode(isFormatMode: boolean){
        if (isFormatMode){
            // remove event listeners which are irrelevant for format mode.
            this.removeEventListeners();
            this.selectionHandler.handleClearSelection();
        } else {
            this.addEventListeners();
        }
    }

    private removeEventListeners(): void {
        this.selection.on("contextmenu", null);
        this.selection.on("click", null);
        this.selection.on("keydown", null);

        this.clearCatcher.on("click", null);
    }

    private addEventListeners(): void {
        this.bindContextMenuEvent();
        this.bindClickEvents();
        this.bindKeyboardEvents();

        this.clearCatcher.on("click", () => {
            this.selectionHandler.handleClearSelection();
        });
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
