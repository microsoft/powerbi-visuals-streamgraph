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
import DataView = powerbi.DataView;

// powerbi.extensibility.utils.type
import { ValueType } from "powerbi-visuals-utils-typeutils/lib/valueType";

// powerbi.extensibility.utils.test
import { getRandomNumbers, getRandomNumber } from "powerbi-visuals-utils-testutils";
import { TestDataViewBuilder, TestDataViewBuilderCategoryColumnOptions } from "powerbi-visuals-utils-testutils/lib/dataViewBuilder/testDataViewBuilder";
import { DataViewBuilderValuesColumnOptions } from "powerbi-visuals-utils-testutils/lib/dataViewBuilder/dataViewBuilder";
import { getRandomUniqueSortedDates } from "./helpers/helpers";

const seriesLenght: number = 50;

export class ProductSalesByDateData extends TestDataViewBuilder {
    private static DefaultFormat: string = "$0,000.00";
    private static DefaultDateFormat: string = "dddd MMMM d yyyy";
    private static DefaultGroupName: string = "Product";

    public static ColumnCategory: string = "Date";
    public static GroupCategory: string = "Group";
    public static ColumnValues1: string = "Product sales 1";
    public static ColumnValues2: string = "Product sales 2";
    public static ColumnValues3: string = "Product sales 3";
    public static ColumnValues4: string = "Product sales 4";

    public valuesDate: Date[] = getRandomUniqueSortedDates(
        50,
        new Date(2014, 0, 1),
        new Date(2015, 5, 10));

    public valuesSales1: number[] = getRandomNumbers(this.valuesDate.length);
    public valuesSales2: number[] = getRandomNumbers(this.valuesDate.length);
    public valuesSales3: number[] = getRandomNumbers(this.valuesDate.length);
    public valuesSales4: number[] = getRandomNumbers(this.valuesDate.length);

    public groups: string[] = [
        "FirstGroup",
        "SecondGroup"
    ];

    public generateHightLightedValues(valuesArray: number[], hightlightedElementNumber?: number): number[] {
        let array: number[] = [];
        const lenght: number = valuesArray.length;
        for (let i: number = 0; i < lenght; i++) {
            array[i] = null;
        }
        if (!hightlightedElementNumber)
            return array;
         if (hightlightedElementNumber >= length || hightlightedElementNumber < 0) {
            array[0] = valuesArray[0];
        } else {
            array[hightlightedElementNumber] = valuesArray[hightlightedElementNumber];
        }
         return array;
    }

    public getDataView(columnNames?: string[], isGroupsEnabled: boolean = false, withHighlights: boolean = false, hightlightedIndex: number = 1, hightlightedElementNumber: number = 0): DataView {
        const categoriesColumn: TestDataViewBuilderCategoryColumnOptions[] = [{
            source: {
                displayName: ProductSalesByDateData.ColumnCategory,
                format: ProductSalesByDateData.DefaultDateFormat,
                type: ValueType.fromDescriptor({ dateTime: true })
            },
            values: this.valuesDate
        }];

        if (isGroupsEnabled) {
            categoriesColumn.push({
                isGroup: true,
                source: {
                    displayName: ProductSalesByDateData.GroupCategory,
                    type: ValueType.fromDescriptor({ text: true })
                },
                values: this.groups
            });
        }

        let column1: DataViewBuilderValuesColumnOptions = {
            source: {
                displayName: ProductSalesByDateData.ColumnValues1,
                isMeasure: true,
                format: ProductSalesByDateData.DefaultFormat,
                groupName: ProductSalesByDateData.DefaultGroupName,
                type: ValueType.fromDescriptor({ numeric: true })
            },
            values: this.valuesSales1
        };
        let column2: DataViewBuilderValuesColumnOptions = {
            source: {
                displayName: ProductSalesByDateData.ColumnValues2,
                isMeasure: true,
                format: ProductSalesByDateData.DefaultFormat,
                groupName: ProductSalesByDateData.DefaultGroupName,
                type: ValueType.fromDescriptor({ numeric: true })
            },
            values: this.valuesSales1
        };
        let column3: DataViewBuilderValuesColumnOptions = {
            source: {
                displayName: ProductSalesByDateData.ColumnValues3,
                isMeasure: true,
                format: ProductSalesByDateData.DefaultFormat,
                groupName: ProductSalesByDateData.DefaultGroupName,
                type: ValueType.fromDescriptor({ numeric: true })
            },
            values: this.valuesSales2
        };
        let column4: DataViewBuilderValuesColumnOptions = {
            source: {
                displayName: ProductSalesByDateData.ColumnValues4,
                isMeasure: true,
                format: ProductSalesByDateData.DefaultFormat,
                groupName: ProductSalesByDateData.DefaultGroupName,
                type: ValueType.fromDescriptor({ numeric: true })
            },
            values: this.valuesSales3
        };

        if (withHighlights) {
            column1.highlights = this.generateHightLightedValues(this.valuesSales1);
            column2.highlights = this.generateHightLightedValues(this.valuesSales2);
            column3.highlights = this.generateHightLightedValues(this.valuesSales3);
            column4.highlights = this.generateHightLightedValues(this.valuesSales4);

            switch(hightlightedIndex) {
                case 2:
                    column2.highlights = this.generateHightLightedValues(this.valuesSales2, hightlightedElementNumber);
                    break;
                case 3:
                    column3.highlights = this.generateHightLightedValues(this.valuesSales3, hightlightedElementNumber);
                    break;
                case 4: 
                    column4.highlights = this.generateHightLightedValues(this.valuesSales4, hightlightedElementNumber);
                    break;
                default:
                    column1.highlights = this.generateHightLightedValues(this.valuesSales1, hightlightedElementNumber);
            }
        }

        return this.createCategoricalDataViewBuilder(
            categoriesColumn, [
                column1,
                column2,
                column3,
                column4
            ], columnNames).build();
    }
}
