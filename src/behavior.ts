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
import { StreamGraphSeries } from "./dataInterfaces";
import { getFillOpacity } from "./utils";

export interface BehaviorOptions extends interactivityBaseService.IBehaviorOptions<StreamGraphSeries>{
    selection: Selection<BaseType, StreamGraphSeries, any, any>;
    clearCatcher: Selection<BaseType, StreamGraphSeries, any, any>;
    interactivityService: IInteractivityService<StreamGraphSeries>;
    series: StreamGraphSeries[];
}

export class StreamGraphBehavior implements IInteractiveBehavior {
    private selection: Selection<BaseType, StreamGraphSeries, any, any>;
    private clearCatcher: Selection<BaseType, StreamGraphSeries, any, any>;
    private interactivityService: IInteractivityService<StreamGraphSeries>;
    private series: any = null;

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

        this.selection.on('contextmenu', (event: PointerEvent, dataPoint : any) => {
            this.selectionHandler.handleContextMenu(dataPoint ? this.series[dataPoint.index] : {}, 
            {    
                x: event.clientX,
                y: event.clientY
            });
            event.preventDefault();
        });

        this.selection.on("click", (event : PointerEvent, dataPoint : any) => {
            event && this.selectionHandler.handleSelection(
                this.series[dataPoint.index],
                event.ctrlKey);
        });

        this.clearCatcher.on("click", () => {
            selectionHandler.handleClearSelection();
        });
    }

    public renderSelection(hasSelection: boolean): void {
        const hasHighlights: boolean = this.interactivityService.hasSelection();

        this.selection.style("opacity", (stackedSeries: StreamGraphSeries) => {
            const series = this.series[(<any>stackedSeries).index];

            return getFillOpacity(
                series.selected,
                series.highlight,
                !series.highlight && hasSelection,
                !series.selected && hasHighlights);
        });
    }
}
