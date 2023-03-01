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

import { RgbColor, parseColorString } from "powerbi-visuals-utils-colorutils";
import { getRandomNumber } from "powerbi-visuals-utils-testutils";

export function areColorsEqual(firstColor: string, secondColor: string): boolean {
    const firstConvertedColor: RgbColor = parseColorString(firstColor),
        secondConvertedColor: RgbColor = parseColorString(secondColor);

    return firstConvertedColor.R === secondConvertedColor.R
        && firstConvertedColor.G === secondConvertedColor.G
        && firstConvertedColor.B === secondConvertedColor.B;
}

export function isColorAppliedToElements(
    elements : HTMLElement[],
    color? : string,
    colorStyleName: string = "fill"
): boolean {
    return elements.some(element => {
      const currentColor = getComputedStyle(element).getPropertyValue(colorStyleName);
  
      if (!currentColor || !color) {
        return currentColor === color;
      }
  
      return areColorsEqual(currentColor, color);
    });
}

export function getSolidColorStructuralObject(color: string): any {
    return { solid: { color: color } };
}

export function getRandomUniqueSortedDates(
    count: number,
    start: Date,
    end: Date): Date[] {

    return getRandomUniqueDates(count, start, end)
        .sort((firstDate: Date, secondDate: Date) => {
            return firstDate.getTime() - secondDate.getTime();
        });
}

export function getRandomUniqueDates(
    count: number,
    start: Date,
    end: Date): Date[] {

    return getRandomUniqueNumbers(count, start.getTime(), end.getTime())
        .map((milliseconds: number) => {
            return new Date(milliseconds);
        });
}

export function getRandomUniqueNumbers(
    count: number,
    min: number = 0,
    max: number = 1): number[] {

    let resultNumbers: number[] = [];

    for (let i: number = 0; i < count; i++) {
        resultNumbers.push(getRandomNumber(min, max, resultNumbers));
    }

    return resultNumbers;
}
