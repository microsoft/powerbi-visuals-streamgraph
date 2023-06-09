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

export const DimmedOpacity: number = 0.4;
export const DefaultOpacity: number = 1.0;

//Returns Dimmed Opacity for unselected Elements
export function getFillOpacity(
    isCurrentHighlighted : boolean,
    anyHighlightedAtAll: boolean): number {

    //If current is 100% highlighted (supportHighlight), then return DefaultOpacity
    if(isCurrentHighlighted || !anyHighlightedAtAll) {
        return DefaultOpacity;
    }

    return DimmedOpacity;
}

export enum DataOrder {
    None = 0,
    Ascending = 1,
    Descending = 2,
    InsideOut = 3,
    Reverse = 4
}

export enum DataOffset {
    None = 0,
    Silhouette = 1,
    Expand = 2
}
