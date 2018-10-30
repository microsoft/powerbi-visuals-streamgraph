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

    public get mainElement(): JQuery {
        return this.element.children("svg.streamGraph");
    }

    public get axisGraphicsContext(): JQuery {
        return this.mainElement.children("g.axisGraphicsContext");
    }

    public get xAxisTicks(): JQuery {
        return this.axisGraphicsContext
            .children("g.xAxis");
    }

    public get yAxisTicks(): JQuery {
        return this.axisGraphicsContext
            .children("g.yAxis");
    }

    public get xAxisLabel(): JQuery {
        return this.axisGraphicsContext.children("text.xAxisLabel");
    }

    public get yAxisLabel(): JQuery {
        return this.axisGraphicsContext.children("text.yAxisLabel");
    }

    public get dataLabelsText(): JQuery {
        return this.mainElement
            .children("g.labels")
            .children("text.data-labels");
    }

    public get layers(): JQuery {
        return this.mainElement
            .children("g.dataPointsContainer")
            .children("path.layer");
    }

    public get legendGroup(): JQuery {
        return this.element
            .children("svg.legend")
            .children("g#legendGroup");
    }

    public get legendOrientation(): string {
        return this.element
            .children("svg.legend")
            .attr("orientation");
    }

    public get legendWidth(): number {
        return this.element
            .children("svg.legend")
            .width();
    }

    public get legendTitle(): JQuery {
        return this.legendGroup.children(".legendTitle");
    }

    public get legendItemText(): JQuery {
        return this.legendGroup
            .children(".legendItem")
            .children("text.legendText");
    }
}
