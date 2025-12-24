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
        const array: number[] = [];
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

    public getDataView(columnNames?: string[], isGroupsEnabled: boolean = false): DataView {
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

        const columns: DataViewBuilderValuesColumnOptions[] = [{
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

        return this.createCategoricalDataViewBuilder(
            categoriesColumn, [
                columns[0],
                columns[1],
                columns[2],
                columns[3]
            ], columnNames!).build();
    }
}

export class MovieGenreSalesByDateData extends TestDataViewBuilder {
    private static DefaultDateFormat: string = "dddd MMMM d yyyy";
    private static DefaultGroupName: string = "Genre";

    public static ColumnCategory: string = "Date";
    public static GroupCategory: string = "Group";
    public static ColumnValues: string[] = ["Action", "Adventure", "Horror"];

    public valuesDate: Date[] = [
        new Date('2023/1/1'),
        new Date('2023/2/1'),
        new Date('2023/3/1'),
        new Date('2023/4/1'),
        new Date('2023/5/1'),
        new Date('2023/6/1'),
        new Date('2023/7/1'),
        new Date('2023/8/1'),
        new Date('2023/9/1'),
        new Date('2023/10/1'),
        new Date('2023/11/1'),
        new Date('2023/12/1')
    ];


    public valuesSales: [number[], number[], number[]] = [
        [35000,55000,70000,90000,66000,58000,48000,13000,21000,32000,21000,10000],
        [3000, 16000,11000, 8500, 9000, 7500, 5000,25000,50000,22000,12000, 5000],
        [2000,  9000, 9000, 1500, 5000, 4500, 7000,12000, 9000, 6000, 7000, 5000]
    ];

    public groups: string[] = [
        "FirstGroup"
    ];

    public generateHightLightedValues(valuesArray: number[], hightlightedElementNumber?: number): number[] {
        const array: any[] = [];
        const length: number = valuesArray.length;
        for (let i: number = 0; i < length; i++) {
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

    public getDataView(columnNames?: string[], withHighlights: boolean = false, highlightedIndex: number = 0, hightlightedElementNumber: number = 0): DataView {
        const categoriesColumn: TestDataViewBuilderCategoryColumnOptions[] = [{
            source: {
                displayName: MovieGenreSalesByDateData.ColumnCategory,
                format: MovieGenreSalesByDateData.DefaultDateFormat,
                type: ValueType.fromDescriptor({ dateTime: true })
            },
            values: this.valuesDate
        }];

        const columns: DataViewBuilderValuesColumnOptions[] = [{
            source: {
                displayName: MovieGenreSalesByDateData.ColumnValues[0],
                isMeasure: true,
                groupName: MovieGenreSalesByDateData.ColumnValues[0],
                type: ValueType.fromDescriptor({ numeric: true })
            },
            values: this.valuesSales[0]
        }, {
            source: {
                displayName: MovieGenreSalesByDateData.ColumnValues[1],
                isMeasure: true,
                groupName: MovieGenreSalesByDateData.ColumnValues[1],
                type: ValueType.fromDescriptor({ numeric: true })
            },
            values: this.valuesSales[1]
        }, {
            source: {
                displayName: MovieGenreSalesByDateData.ColumnValues[2],
                isMeasure: true,
                groupName: MovieGenreSalesByDateData.ColumnValues[2],
                type: ValueType.fromDescriptor({ numeric: true })
            },
            values: this.valuesSales[2]
        }];

        if (withHighlights) {
            columns[highlightedIndex].highlights = this.generateHightLightedValues(this.valuesSales[highlightedIndex], hightlightedElementNumber);
            columns[highlightedIndex].source.groupName = ProductSalesByDateData.GroupNames[highlightedIndex];

            for (let i = 0; i < columns.length; i++) {
                if (i !== highlightedIndex) {
                    columns[i].highlights = this.generateHightLightedValues(this.valuesSales[i]);
                    columns[i].source.groupName = ProductSalesByDateData.GroupNames[i];
                }
            }
        }


        return this.createCategoricalDataViewBuilder(
            categoriesColumn, [
                columns[0],
                columns[1],
                columns[2]
            ], columnNames!).build();
    }
}
