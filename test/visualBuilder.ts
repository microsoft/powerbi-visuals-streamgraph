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

// powerbi.extensibility.utils.test
import { VisualBuilderBase } from "powerbi-visuals-utils-testutils";
import { StreamGraph } from "../src/visual";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;

export class StreamGraphBuilder extends VisualBuilderBase<StreamGraph> {
    constructor(width: number, height: number, isMinervaVisualPlugin: boolean = false) {
        super(width, height, "StreamGraph1446659696222");
    }

    protected build(options: VisualConstructorOptions): StreamGraph {
        return new StreamGraph(options);
    }

    public updateVisual(options: VisualUpdateOptions): void {
        this.visual.update(options);
    }

    public get mainElement(): SVGElement {
        return this.element.querySelector("svg.streamGraph")!;
    }
    
    public get axisGraphicsContext(): HTMLElement {
        return this.mainElement.querySelector("g.axisGraphicsContext")!;
    }
    
    public get xAxisTicks(): NodeListOf<HTMLElement> {
        return this.axisGraphicsContext.querySelectorAll("g.xAxis");
    }
    
    public get yAxisTicks(): NodeListOf<HTMLElement> {
        return this.axisGraphicsContext.querySelectorAll("g.yAxis");
    }
    
    public get xAxisLabel(): HTMLElement {
        return this.axisGraphicsContext.querySelector("text.xAxisLabel")!;
    }
    
    public get yAxisLabel(): HTMLElement {
        return this.axisGraphicsContext.querySelector("text.yAxisLabel")!;
    }
    
    public get dataLabelsText(): NodeListOf<HTMLElement> {
        return this.mainElement.querySelectorAll("g.labels text.data-labels");
    }
    
    public get layers(): NodeListOf<HTMLElement> {
        return this.mainElement.querySelectorAll("g.dataPointsContainer path.layer");
    }
    
    public get legendGroup(): HTMLElement {
        return this.element.querySelector("svg.legend g#legendGroup")!;
    }
    
    public get legendOrientation(): string {
        return this.element.querySelector("svg.legend")!.getAttribute("orientation")!;
    }
    
    public get legendWidth(): number {
        return this.element.querySelector("svg.legend")!.clientWidth;
    }
    
    public get legendTitle(): HTMLElement {
        return this.legendGroup.querySelector(".legendTitle")!;
    }
    
    public get legendItemText(): NodeListOf<HTMLElement> {
        return this.legendGroup.querySelectorAll(".legendItem text.legendText");
    }
}
