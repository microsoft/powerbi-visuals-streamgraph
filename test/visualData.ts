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
import { getRandomNumbers } from "powerbi-visuals-utils-testutils";
import { TestDataViewBuilder, TestDataViewBuilderCategoryColumnOptions } from "powerbi-visuals-utils-testutils/lib/dataViewBuilder/testDataViewBuilder";
import { DataViewBuilderValuesColumnOptions } from "powerbi-visuals-utils-testutils/lib/dataViewBuilder/dataViewBuilder";
import { getRandomUniqueSortedDates } from "./helpers/helpers";

const maxValue: number = 100;

export class ProductSalesByDateData extends TestDataViewBuilder {
    private static DefaultFormat: string = "$0,000.00";
    private static DefaultDateFormat: string = "dddd MMMM d yyyy";
    private static DefaultGroupName: string = "Product";

    public static ColumnCategory: string = "Date";
    public static GroupCategory: string = "Group";
    public static GroupNames: string[] = ["Product 1", "Product 2", "Product 3", "Product 4"];
    public static ColumnValues: string[] = ["Product sales 1", "Product sales 2", "Product sales 3", "Product sales 4"];

    public valuesDate: Date[] = getRandomUniqueSortedDates(
        50,
        new Date(2014, 0, 1),
        new Date(2015, 5, 10));

    public valuesSales: [number[], number[], number[], number[]] = [
        getRandomNumbers(this.valuesDate.length, -maxValue, maxValue),
        getRandomNumbers(this.valuesDate.length, -maxValue, maxValue),
        getRandomNumbers(this.valuesDate.length, -maxValue, maxValue),
        getRandomNumbers(this.valuesDate.length, -maxValue, maxValue)
    ];

    public groups: string[] = [
        "FirstGroup",
        "SecondGroup"
    ];

    public generateHightLightedValues(valuesArray: number[], hightlightedElementNumber?: number): number[] {
        let array: number[] = [];
        const lenght: number = valuesArray.length;
        for (let i: number = 0; i < lenght; i++) {
            array[i] = NaN;
        }
        if (!hightlightedElementNumber)
            return array;
        if (hightlightedElementNumber >= lenght || hightlightedElementNumber < 0) {
            array[0] = valuesArray[0];
        } else {
            array[hightlightedElementNumber] = valuesArray[hightlightedElementNumber];
        }
        return array;
    }

    public getDataView(columnNames?: string[], isGroupsEnabled: boolean = false, withHighlights: boolean = false, hightlightedIndex: number = 0, hightlightedElementNumber: number = 0): DataView {
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

        let columns: DataViewBuilderValuesColumnOptions[] = [{
            source: {
                displayName: ProductSalesByDateData.ColumnValues[0],
                isMeasure: true,
                format: ProductSalesByDateData.DefaultFormat,
                groupName: ProductSalesByDateData.DefaultGroupName,
                type: ValueType.fromDescriptor({ numeric: true })
            },
            values: this.valuesSales[0]
        }, {
            source: {
                displayName: ProductSalesByDateData.ColumnValues[1],
                isMeasure: true,
                format: ProductSalesByDateData.DefaultFormat,
                groupName: ProductSalesByDateData.DefaultGroupName,
                type: ValueType.fromDescriptor({ numeric: true })
            },
            values: this.valuesSales[1]
        }, {
            source: {
                displayName: ProductSalesByDateData.ColumnValues[2],
                isMeasure: true,
                format: ProductSalesByDateData.DefaultFormat,
                groupName: ProductSalesByDateData.DefaultGroupName,
                type: ValueType.fromDescriptor({ numeric: true })
            },
            values: this.valuesSales[2]
        }, {
            source: {
                displayName: ProductSalesByDateData.ColumnValues[3],
                isMeasure: true,
                format: ProductSalesByDateData.DefaultFormat,
                groupName: ProductSalesByDateData.DefaultGroupName,
                type: ValueType.fromDescriptor({ numeric: true })
            },
            values: this.valuesSales[3]
        }];

        if (withHighlights) {
            columns[hightlightedIndex].highlights = this.generateHightLightedValues(this.valuesSales[hightlightedIndex], hightlightedElementNumber);
            columns[hightlightedIndex].source.groupName = ProductSalesByDateData.GroupNames[hightlightedIndex];

            for (let i = 0; i < columns.length; i++) {
                if (i !== hightlightedIndex) {
                    columns[i].highlights = this.generateHightLightedValues(this.valuesSales[i]);
                    columns[i].source.groupName = ProductSalesByDateData.GroupNames[i];
                }
            }
        }

        return this.createCategoricalDataViewBuilder(
            categoriesColumn, [
                columns[0],
                columns[1],
                columns[2],
                columns[3]
            ], columnNames!).build();
    }
}
