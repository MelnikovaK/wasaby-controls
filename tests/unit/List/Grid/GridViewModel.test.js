define(['Controls/List/Grid/GridViewModel', 'Core/core-merge', 'Types/collection', 'Types/entity', 'Core/core-clone'], function(GridViewModel, cMerge, collection, entity, clone) {
   var
      gridData = [
         {
            'id': '123',
            'title': 'Хлеб',
            'price': 50,
            'balance': 15
         },
         {
            'id': '234',
            'title': 'Хлеб',
            'price': 150,
            'balance': 3
         },
         {
            'id': '345',
            'title': 'Масло',
            'price': 100,
            'balance': 5
         },
         {
            'id': '456',
            'title': 'Помидор',
            'price': 75,
            'balance': 7
         },
         {
            'id': '567',
            'title': 'Капуста китайская',
            'price': 35,
            'balance': 2
         }
      ],
      gridColumns = [
         {
            displayProperty: 'title',
            width: '1fr',
            valign: 'top',
            style: 'default'
         },
         {
            displayProperty: 'price',
            width: 'auto',
            align: 'right',
            valign: 'bottom',
            style: 'default'
         },
         {
            displayProperty: 'balance',
            width: 'auto',
            align: 'right',
            valign: 'middle',
            style: 'default'
         }
      ],
      gridHeader = [
         {
            title: '',
            style: 'default'
         },
         {
            title: 'Цена',
            align: 'right',
            style: 'default',
            sortingProperty: 'price'
         },
         {
            title: 'Остаток',
            align: 'right',
            style: 'default'
         }
      ],
      itemActions = [],
      cfg = {
         keyProperty: 'id',
         displayProperty: 'title',
         markedKey: '123',
         markerVisibility: 'visible',
         multiSelectVisibility: 'visible',
         header: gridHeader,
         columns: gridColumns,
         items: new collection.RecordSet({
            rawData: gridData,
            idProperty: 'id'
         }),
         itemActions: itemActions,
         leftPadding: 'XL',
         rightPadding: 'L',
         rowSpacing: 'L',
         rowSeparatorVisibility: true,
         style: 'default',
         sorting: [{price: 'DESC'}],
         searchValue: 'test'
      };

   describe('Controls.List.Grid.GridViewModel', function() {
      describe('DragNDrop methods', function() {
         var gridViewModel = new GridViewModel(cfg);

         it('setDragTargetPosition', function() {
            var dragTargetPosition = {};
            gridViewModel.setDragTargetPosition(dragTargetPosition);
            assert.equal(gridViewModel.getDragTargetPosition(), dragTargetPosition);
         });

         it('setDragEntity', function() {
            var dragEntity = {};
            gridViewModel.setDragEntity(dragEntity);
            assert.equal(gridViewModel.getDragEntity(), dragEntity);
         });

         it('setDragItemData', function() {
            var dragItemData = {};
            gridViewModel.setDragItemData(dragItemData);
            assert.equal(gridViewModel.getDragItemData(), dragItemData);
         });
      });

      describe('"_private" block', function() {
         it('calcItemColumnVersion', function() {
            assert.equal(GridViewModel._private.calcItemColumnVersion({
               _columnsVersion: 1,
               _options: {
                  multiSelectVisibility: 'hidden'
               }
            }, 1, 0), '1_1_0');
            assert.equal(GridViewModel._private.calcItemColumnVersion({
               _columnsVersion: 1,
               _options: {
                  multiSelectVisibility: 'visible'
               }
            }, 1, 0), '1_1_-1');
            assert.equal(GridViewModel._private.calcItemColumnVersion({
               _columnsVersion: 1,
               _options: {
                  multiSelectVisibility: 'visible'
               }
            }, 1, 1), '1_1_0');
         });
         it('isNeedToHighlight', function() {
            var item = new entity.Model({
               rawData: {
                  id: 0,
                  title: 'test'
               },
               idProperty: 'id'
            });
            assert.isFalse(!!GridViewModel._private.isNeedToHighlight(item, 'title', 'xxx'));
            assert.isFalse(!!GridViewModel._private.isNeedToHighlight(item, 'title', ''));
            assert.isTrue(!!GridViewModel._private.isNeedToHighlight(item, 'title', 'tes'));
         });
         it('isDrawActions', function() {
            var
               testCases = [
                  {
                     inputData: {
                        itemData: {
                           drawActions: false,
                           multiSelectVisibility: 'hidden',
                           getLastColumnIndex: function() {
                              return 0;
                           }
                        },
                        currentColumn: {
                           columnIndex: 0
                        },
                        colspan: false
                     },
                     resultData: false
                  },
                  {
                     inputData: {
                        itemData: {
                           drawActions: true,
                           multiSelectVisibility: 'hidden',
                           getLastColumnIndex: function() {
                              return 0;
                           }
                        },
                        currentColumn: {
                           columnIndex: 0
                        },
                        colspan: false
                     },
                     resultData: true
                  },
                  {
                     inputData: {
                        itemData: {
                           drawActions: true,
                           multiSelectVisibility: 'hidden',
                           getLastColumnIndex: function() {
                              return 1;
                           }
                        },
                        currentColumn: {
                           columnIndex: 0
                        },
                        colspan: false
                     },
                     resultData: false
                  },
                  {
                     inputData: {
                        itemData: {
                           drawActions: true,
                           multiSelectVisibility: 'visible',
                           getLastColumnIndex: function() {
                              return 2;
                           }
                        },
                        currentColumn: {
                           columnIndex: 1
                        },
                        colspan: false
                     },
                     resultData: false
                  },
                  {
                     inputData: {
                        itemData: {
                           drawActions: true,
                           multiSelectVisibility: 'visible',
                           getLastColumnIndex: function() {
                              return 2;
                           }
                        },
                        currentColumn: {
                           columnIndex: 1
                        },
                        colspan: true
                     },
                     resultData: true
                  }
               ];
            testCases.forEach(function(testCase, idx) {
               assert.equal(testCase.resultData,
                  GridViewModel._private.isDrawActions(testCase.inputData.itemData, testCase.inputData.currentColumn, testCase.inputData.colspan),
                  'Invalid result data in test #' + idx);
            });
         });
         it('getCellStyle', function() {
            var
               testCases = [
                  {
                     inputData: {
                        itemData: {
                           multiSelectVisibility: 'hidden',
                           columns: [{}, {}]
                        },
                        currentColumn: {
                           styleForLadder: 'LADDER_STYLE;',
                           columnIndex: 0
                        },
                        isNotFullGridSupport: false,
                        colspan: false
                     },
                     resultData: 'LADDER_STYLE;'
                  },
                  {
                     inputData: {
                        itemData: {
                           multiSelectVisibility: 'hidden',
                           columns: [{}, {}]
                        },
                        currentColumn: {
                           columnIndex: 0
                        },
                        isNotFullGridSupport: false,
                        colspan: false
                     },
                     resultData: ''
                  },
                  {
                     inputData: {
                        itemData: {
                           multiSelectVisibility: 'hidden',
                           columns: [{}, {}]
                        },
                        currentColumn: {
                           styleForLadder: 'LADDER_STYLE;',
                           columnIndex: 0
                        },
                        isNotFullGridSupport: false,
                        colspan: true
                     },
                     resultData: 'LADDER_STYLE; grid-column: 1 / 3'
                  },
                  {
                     inputData: {
                        itemData: {
                           multiSelectVisibility: 'hidden',
                           columns: [{}, {}]
                        },
                        currentColumn: {
                           styleForLadder: 'LADDER_STYLE;',
                           columnIndex: 0
                        },
                        isNotFullGridSupport: true,
                        colspan: true
                     },
                     resultData: 'LADDER_STYLE; colspan: 2'
                  }
               ];
            testCases.forEach(function(testCase, idx) {
               assert.equal(testCase.resultData,
                  GridViewModel._private.getCellStyle(testCase.inputData.itemData, testCase.inputData.currentColumn, testCase.inputData.colspan, testCase.inputData.isNotFullGridSupport),
                  'Invalid result data in test #' + idx);
            });
         });
         it('getPaddingCellClasses', function() {
            var
               paramsWithoutMultiselect = {
                  columns: gridColumns,
                  multiSelectVisibility: false,
                  itemPadding: {
                     left: 'XL',
                     right: 'L',
                     top: 'L',
                     bottom: 'L'
                  },
                  style: 'default'
               },
               paramsWithMultiselect = {
                  columns: [{}].concat(gridColumns),
                  multiSelectVisibility: true,
                  itemPadding: {
                     left: 'XL',
                     right: 'L',
                     top: 'L',
                     bottom: 'L'
                  },
                  style: 'default'
               },
               expectedResultWithoutMultiselect = [
                  ' controls-Grid__cell_spacingRight controls-Grid__cell_spacingFirstCol_xl controls-Grid__cell_default controls-Grid__row-cell_rowSpacingTop_l controls-Grid__row-cell_rowSpacingBottom_l',
                  ' controls-Grid__cell_spacingLeft controls-Grid__cell_spacingRight controls-Grid__cell_default controls-Grid__row-cell_rowSpacingTop_l controls-Grid__row-cell_rowSpacingBottom_l',
                  ' controls-Grid__cell_spacingLeft controls-Grid__cell_default controls-Grid__cell_spacingLastCol_l controls-Grid__row-cell_rowSpacingTop_l controls-Grid__row-cell_rowSpacingBottom_l' ],
               expectedResultWithMultiselect = [
                  ' controls-Grid__cell_spacingRight controls-Grid__cell_default controls-Grid__row-cell_rowSpacingTop_l controls-Grid__row-cell_rowSpacingBottom_l',
                  ' controls-Grid__cell_spacingRight controls-Grid__cell_default controls-Grid__row-cell_rowSpacingTop_l controls-Grid__row-cell_rowSpacingBottom_l',
                  ' controls-Grid__cell_spacingLeft controls-Grid__cell_spacingRight controls-Grid__cell_default controls-Grid__row-cell_rowSpacingTop_l controls-Grid__row-cell_rowSpacingBottom_l',
                  ' controls-Grid__cell_spacingLeft controls-Grid__cell_default controls-Grid__cell_spacingLastCol_l controls-Grid__row-cell_rowSpacingTop_l controls-Grid__row-cell_rowSpacingBottom_l' ];
            assert.equal(expectedResultWithoutMultiselect[0],
               GridViewModel._private.getPaddingCellClasses(cMerge(paramsWithoutMultiselect, {columnIndex: 0})),
               'Incorrect value "GridViewModel._private.getPaddingCellClasses(paramsWithoutMultiselect)".');
            assert.equal(expectedResultWithoutMultiselect[1],
               GridViewModel._private.getPaddingCellClasses(cMerge(paramsWithoutMultiselect, {columnIndex: 1})),
               'Incorrect value "GridViewModel._private.getPaddingCellClasses(paramsWithoutMultiselect)".');
            assert.equal(expectedResultWithoutMultiselect[2],
               GridViewModel._private.getPaddingCellClasses(cMerge(paramsWithoutMultiselect, {columnIndex: 2})),
               'Incorrect value "GridViewModel._private.getPaddingCellClasses(paramsWithoutMultiselect)".');

            assert.equal(expectedResultWithMultiselect[0],
               GridViewModel._private.getPaddingCellClasses(cMerge(paramsWithMultiselect, {columnIndex: 0})),
               'Incorrect value "GridViewModel._private.getPaddingCellClasses(paramsWithMultiselect)".');
            assert.equal(expectedResultWithMultiselect[1],
               GridViewModel._private.getPaddingCellClasses(cMerge(paramsWithMultiselect, {columnIndex: 1})),
               'Incorrect value "GridViewModel._private.getPaddingCellClasses(paramsWithMultiselect)".');
            assert.equal(expectedResultWithMultiselect[2],
               GridViewModel._private.getPaddingCellClasses(cMerge(paramsWithMultiselect, {columnIndex: 2})),
               'Incorrect value "GridViewModel._private.getPaddingCellClasses(paramsWithMultiselect)".');
            assert.equal(expectedResultWithMultiselect[3],
               GridViewModel._private.getPaddingCellClasses(cMerge(paramsWithMultiselect, {columnIndex: 3})),
               'Incorrect value "GridViewModel._private.getPaddingCellClasses(paramsWithMultiselect)".');
         });
         it('getSortingDirectionByProp', function() {
            assert.equal(GridViewModel._private.getSortingDirectionByProp([{test: 'ASC'}, {test2: 'DESC'}], 'test'), 'ASC');
            assert.equal(GridViewModel._private.getSortingDirectionByProp([{test: 'ASC'}, {test2: 'DESC'}], 'test2'), 'DESC');
            assert.equal(GridViewModel._private.getSortingDirectionByProp([{test: 'ASC'}, {test2: 'DESC'}], 'test3'), undefined);
            assert.equal(GridViewModel._private.getSortingDirectionByProp([{test: 'ASC'}, {test2: 'DESC'}], 'test3'), undefined);
         });
         it('prepareRowSeparatorClasses', function() {
            var
               expectedResultWithRowSeparator = [
                  ' controls-Grid__row-cell_firstRow controls-Grid__row-cell_withRowSeparator_firstRow',
                  ' controls-Grid__row-cell_withRowSeparator',
                  ' controls-Grid__row-cell_withRowSeparator controls-Grid__row-cell_lastRow controls-Grid__row-cell_withRowSeparator_lastRow'
               ],
               expectedResultWithoutRowSeparator = [
                  ' controls-Grid__row-cell_withoutRowSeparator',
                  ' controls-Grid__row-cell_withoutRowSeparator',
                  ' controls-Grid__row-cell_withoutRowSeparator'
               ],
               expectedResultForFirstItemInGroup = ' controls-Grid__row-cell_first-row-in-group';

            assert.equal(expectedResultWithRowSeparator[0], GridViewModel._private.prepareRowSeparatorClasses({
               rowSeparatorVisibility: true,
               isFirstInGroup: false,
               index: 0,
               dispItem: {
                  getOwner: function() {
                     return {
                        getCount: function() {
                           return 3
                        }
                     }
                  }
               }
            }));
            assert.equal(expectedResultWithRowSeparator[1], GridViewModel._private.prepareRowSeparatorClasses({
               rowSeparatorVisibility: true,
               isFirstInGroup: false,
               index: 1,
               dispItem: {
                  getOwner: function() {
                     return {
                        getCount: function() {
                           return 3
                        }
                     }
                  }
               }
            }));
            assert.equal(expectedResultWithRowSeparator[2], GridViewModel._private.prepareRowSeparatorClasses({
               rowSeparatorVisibility: true,
               isFirstInGroup: false,
               index: 2,
               dispItem: {
                  getOwner: function() {
                     return {
                        getCount: function() {
                           return 3
                        }
                     }
                  }
               }
            }));

            assert.equal(expectedResultWithoutRowSeparator[0], GridViewModel._private.prepareRowSeparatorClasses({
               rowSeparatorVisibility: false,
               isFirstInGroup: false,
               index: 0,
               dispItem: {
                  getOwner: function() {
                     return {
                        getCount: function() {
                           return 3
                        }
                     }
                  }
               }
            }));
            assert.equal(expectedResultWithoutRowSeparator[1], GridViewModel._private.prepareRowSeparatorClasses({
               rowSeparatorVisibility: false,
               isFirstInGroup: false,
               index: 1,
               dispItem: {
                  getOwner: function() {
                     return {
                        getCount: function() {
                           return 3
                        }
                     }
                  }
               }
            }));
            assert.equal(expectedResultWithoutRowSeparator[2], GridViewModel._private.prepareRowSeparatorClasses({
               rowSeparatorVisibility: false,
               isFirstInGroup: false,
               index: 2,
               dispItem: {
                  getOwner: function() {
                     return {
                        getCount: function() {
                           return 3
                        }
                     }
                  }
               }
            }));

            assert.equal(expectedResultForFirstItemInGroup, GridViewModel._private.prepareRowSeparatorClasses({
               rowSeparatorVisibility: true,
               isFirstInGroup: true,
               index: 0,
               dispItem: {
                  getOwner: function() {
                     return {
                        getCount: function() {
                           return 3
                        }
                     }
                  }
               }
            }));
         });
         it('getItemColumnCellClasses for old browsers', function() {
            var
               gridViewModel = new GridViewModel(cfg),
               current = gridViewModel.getCurrent(),
               expected = {
                  withMarker: 'controls-Grid__row-cell controls-Grid__row-cell-background-hover controls-Grid__row-cell_firstRow' +
                     ' controls-Grid__row-cell_withRowSeparator_firstRow controls-Grid__row-cell-checkbox controls-Grid__row-cell_selected' +
                     ' controls-Grid__row-cell_selected-default controls-Grid__row-cell_selected__first-default',
                  withoutMarker: 'controls-Grid__row-cell controls-Grid__row-cell-background-hover controls-Grid__row-cell_firstRow' +
                     ' controls-Grid__row-cell_withRowSeparator_firstRow controls-Grid__row-cell-checkbox controls-Grid__row-cell_selected' +
                     ' controls-Grid__row-cell_selected-default controls-Grid__row-cell_selected__first-default'
               };
            current.isNotFullGridSupport = true;

            assert.equal(expected.withMarker,
               GridViewModel._private.getItemColumnCellClasses(current, current.columnIndex),
               'Incorrect value "GridViewModel._private.getPaddingCellClasses(params)".');

            current.markerVisibility = 'hidden';
            current.resetColumnIndex();

            assert.equal(expected.withoutMarker,
               GridViewModel._private.getItemColumnCellClasses(current, current.columnIndex),
               'Incorrect value "GridViewModel._private.getPaddingCellClasses(params)".');


         });
         it('should update last item after append items', function () {
            var
                gridViewModel = new GridViewModel(cfg),
                oldLastIndex = gridViewModel.getCount()-1,
                firstItem = gridViewModel.getItemDataByItem(gridViewModel._model._display.at(0)),
                lastItem = gridViewModel.getItemDataByItem(gridViewModel._model._display.at(oldLastIndex)),
                newLastItem;

            // first item should have updated version identificator
            assert.isTrue(firstItem.getVersion().indexOf('LAST_ITEM') === -1);

            // last item should have updated version identificator
            assert.isTrue(lastItem.getVersion().indexOf('LAST_ITEM') !== -1);

            gridViewModel.appendItems(new collection.RecordSet({
               idProperty: 'id',
               rawData: [
                  { id: 121212, title: 'i0'},
                  { id: 231313, title: 'i1'}
               ]
            }));

            // old last item now must be updated and shouldn't have prefix "LAST_ITEM" in version identificator
            lastItem = gridViewModel.getItemDataByItem(gridViewModel._model._display.at(oldLastIndex));
            assert.isTrue(lastItem.getVersion().indexOf('LAST_ITEM') === -1);

            // last item should have updated version identificator
            newLastItem = gridViewModel.getItemDataByItem(gridViewModel._model._display.at(gridViewModel.getCount()-1));
            assert.isTrue(newLastItem.getVersion().indexOf('LAST_ITEM') !== -1);

         });
         it('getItemColumnCellClasses', function() {
            var
               gridViewModel = new GridViewModel(cfg),
               current = gridViewModel.getCurrent(),
               expectedResult = [
                  'controls-Grid__row-cell controls-Grid__row-cell-background-hover controls-Grid__row-cell_firstRow controls-Grid__row-cell_withRowSeparator_firstRow' +
                  ' controls-Grid__row-cell-checkbox controls-Grid__row-cell_selected controls-Grid__row-cell_selected-default' +
                  ' controls-Grid__row-cell_selected__first-default',
                  'controls-Grid__row-cell controls-Grid__row-cell-background-hover controls-Grid__row-cell_firstRow controls-Grid__row-cell_withRowSeparator_firstRow' +
                  ' controls-Grid__cell_spacingRight controls-Grid__cell_default controls-Grid__row-cell_rowSpacingTop_l controls-Grid__row-cell_rowSpacingBottom_l' +
                  ' controls-Grid__row-cell_selected controls-Grid__row-cell_selected-default',
                  'controls-Grid__row-cell controls-Grid__row-cell-background-hover controls-Grid__row-cell_firstRow controls-Grid__row-cell_withRowSeparator_firstRow' +
                  ' controls-Grid__cell_spacingLeft controls-Grid__cell_spacingRight controls-Grid__cell_default controls-Grid__row-cell_rowSpacingTop_l controls-Grid__row-cell_rowSpacingBottom_l' +
                  ' controls-Grid__row-cell_selected controls-Grid__row-cell_selected-default',
                  'controls-Grid__row-cell controls-Grid__row-cell-background-hover controls-Grid__row-cell_firstRow controls-Grid__row-cell_withRowSeparator_firstRow' +
                  ' controls-Grid__cell_spacingLeft controls-Grid__cell_default controls-Grid__cell_spacingLastCol_l controls-Grid__row-cell_rowSpacingTop_l controls-Grid__row-cell_rowSpacingBottom_l' +
                  ' controls-Grid__row-cell_selected controls-Grid__row-cell_selected-default' +
                  ' controls-Grid__row-cell_selected__last controls-Grid__row-cell_selected__last-default',
                  'controls-Grid__row-cell controls-Grid__row-cell-background-hover controls-Grid__row-cell_firstRow controls-Grid__row-cell_withRowSeparator_firstRow' +
                  ' controls-Grid__cell_spacingLeft controls-Grid__cell_default controls-Grid__cell_spacingLastCol_l controls-Grid__row-cell_rowSpacingTop_l controls-Grid__row-cell_rowSpacingBottom_l' +
                  ' controls-Grid__row-cell__last controls-Grid__row-cell__last-default'];
            assert.equal(expectedResult[0],
               GridViewModel._private.getItemColumnCellClasses(current, current.columnIndex),
               'Incorrect value "GridViewModel._private.getPaddingCellClasses(params)".');
            current.goToNextColumn();
            assert.equal(expectedResult[1],
               GridViewModel._private.getItemColumnCellClasses(current, current.columnIndex),
               'Incorrect value "GridViewModel._private.getPaddingCellClasses(params)".');
            current.goToNextColumn();
            assert.equal(expectedResult[2],
               GridViewModel._private.getItemColumnCellClasses(current, current.columnIndex),
               'Incorrect value "GridViewModel._private.getPaddingCellClasses(params)".');
            current.goToNextColumn();
            assert.equal(expectedResult[3],
               GridViewModel._private.getItemColumnCellClasses(current, current.columnIndex),
               'Incorrect value "GridViewModel._private.getPaddingCellClasses(params)".');

            current.isSelected = false;
            assert.equal(expectedResult[4],
               GridViewModel._private.getItemColumnCellClasses(current, current.columnIndex),
               'Incorrect value "GridViewModel._private.getPaddingCellClasses(params)".');
         });
      });
      describe('getCurrent', function() {
         var
            gridViewModel = new GridViewModel(cfg),
            current = gridViewModel.getCurrent();

         it('configuration', function() {
            assert.equal(cfg.keyProperty, current.keyProperty, 'Incorrect value "current.keyProperty".');
            assert.equal(cfg.displayProperty, current.displayProperty, 'Incorrect value "current.displayProperty".');
            assert.isTrue(current.multiSelectVisibility === 'visible');
            assert.deepEqual([{}].concat(gridColumns), current.columns, 'Incorrect value "current.columns".');
            assert.deepEqual({
               left: 'XL',
               right: 'L',
               top: 'L',
               bottom: 'L'
            }, current.itemPadding, 'Incorrect value "current.itemPadding".');
            assert.isTrue(current.rowSeparatorVisibility, 'Incorrect value "current.rowSeparatorVisibility".');
         });

         it('item', function() {
            assert.equal(gridData[0][cfg.keyProperty], current.key, 'Incorrect value "current.keyProperty".');
            assert.equal(0, current.index, 'Incorrect value "current.index".');
            assert.deepEqual(gridData[0], current.item.getRawData(), 'Incorrect value "current.item".');
            assert.deepEqual(gridData[0], current.dispItem.getContents().getRawData(), 'Incorrect value "current.dispItem".');
            assert.equal(gridData[0][cfg.displayProperty], current.getPropValue(current.item, cfg.displayProperty), 'Incorrect value "current.displayProperty".');
         });

         it('state', function() {
            assert.isTrue(current.isSelected, 'Incorrect value "current.isSelected".');
            assert.equal(undefined, current.isActive, 'Incorrect value "current.isActive".');
            assert.isTrue(current.multiSelectVisibility === 'visible');
            assert.isTrue(current.showActions, 'Incorrect value "current.showActions".');
            assert.equal(undefined, current.isSwiped, 'Incorrect value "current.isSwiped".');
         });

         it('columns', function() {
            function checkBaseProperties(checkedColumn, expectedData) {
               assert.equal(expectedData.columnIndex, checkedColumn.columnIndex, 'Incorrect value "columnIndex" when checking columns.');
               assert.deepEqual(expectedData.column, checkedColumn.column, 'Incorrect value "column" when checking columns.');
               assert.deepEqual(expectedData.item, checkedColumn.item.getRawData(), 'Incorrect value "item" when checking columns.');
               assert.deepEqual(expectedData.item, checkedColumn.dispItem.getContents().getRawData(), 'Incorrect value "dispItem" when checking columns.');
               assert.equal(expectedData.keyProperty, checkedColumn.keyProperty, 'Incorrect value "keyProperty" when checking columns.');
               assert.equal(expectedData.displayProperty, checkedColumn.displayProperty, 'Incorrect value "displayProperty" when checking columns.');
               assert.equal(expectedData.item[expectedData.keyProperty], checkedColumn.key, 'Incorrect value "getPropValue(item, displayProperty)" when checking columns.');
               assert.equal(expectedData.item[expectedData.displayProperty],
                  checkedColumn.getPropValue(checkedColumn.item, expectedData.displayProperty), 'Incorrect value "" when checking columns.');
               assert.equal(expectedData.template, checkedColumn.template, 'Incorrect value "template" when checking columns.');
               assert.equal(expectedData.cellClasses, checkedColumn.cellClasses, 'Incorrect value "cellClasses" when checking columns.');
            }

            var gridColumn;

            // check first column (multiselect checkbox column)
            assert.equal(0, current.columnIndex, 'Incorrect value "current.columnIndex".');
            assert.isFalse(current.getLastColumnIndex() === current.columnIndex, 'Incorrect value "current.getLastColumnIndex() === current.columnIndex".');
            checkBaseProperties(current.getCurrentColumn(), {
               columnIndex: 0,
               keyProperty: cfg.keyProperty,
               displayProperty: cfg.displayProperty,
               column: {needSearchHighlight: false},
               item: gridData[0],
               template: null,
               cellClasses: 'controls-Grid__row-cell controls-Grid__row-cell-background-hover controls-Grid__row-cell_firstRow' +
                  ' controls-Grid__row-cell_withRowSeparator_firstRow controls-Grid__row-cell-checkbox' +
                  ' controls-Grid__row-cell_selected controls-Grid__row-cell_selected-default' +
                  ' controls-Grid__row-cell_selected__first-default'
            });

            // check next column
            current.goToNextColumn();
            gridColumn = clone(gridColumns[0]);
            cMerge(gridColumn, {needSearchHighlight: false});
            assert.equal(1, current.columnIndex, 'Incorrect value "current.columnIndex" after "goToNextColumn()".');
            assert.isFalse(current.getLastColumnIndex() === current.columnIndex, 'Incorrect value "current.getLastColumnIndex() === current.columnIndex" after "goToNextColumn()".');
            checkBaseProperties(current.getCurrentColumn(), {
               columnIndex: 1,
               keyProperty: cfg.keyProperty,
               displayProperty: cfg.displayProperty,
               column: gridColumn,
               item: gridData[0],
               template: null,
               cellClasses: 'controls-Grid__row-cell controls-Grid__row-cell-background-hover controls-Grid__row-cell_firstRow controls-Grid__row-cell_withRowSeparator_firstRow' +
               ' controls-Grid__cell_spacingRight controls-Grid__cell_default controls-Grid__row-cell_rowSpacingTop_l controls-Grid__row-cell_rowSpacingBottom_l ' +
               'controls-Grid__row-cell_selected controls-Grid__row-cell_selected-default'
            });

            // check next column
            current.goToNextColumn();
            gridColumn = clone(gridColumns[1]);
            cMerge(gridColumn, {needSearchHighlight: false});
            assert.equal(2, current.columnIndex, 'Incorrect value "current.columnIndex" after "goToNextColumn()".');
            assert.isFalse(current.getLastColumnIndex() === current.columnIndex, 'Incorrect value "current.getLastColumnIndex() === current.columnIndex" after goToNextColumn().');
            checkBaseProperties(current.getCurrentColumn(), {
               columnIndex: 2,
               keyProperty: cfg.keyProperty,
               displayProperty: cfg.displayProperty,
               column: gridColumn,
               item: gridData[0],
               template: null,
               cellClasses: 'controls-Grid__row-cell controls-Grid__row-cell-background-hover controls-Grid__row-cell_firstRow controls-Grid__row-cell_withRowSeparator_firstRow' +
               ' controls-Grid__cell_spacingLeft controls-Grid__cell_spacingRight controls-Grid__cell_default controls-Grid__row-cell_rowSpacingTop_l controls-Grid__row-cell_rowSpacingBottom_l' +
               ' controls-Grid__row-cell_selected controls-Grid__row-cell_selected-default'
            });

            // check last column
            current.goToNextColumn();
            gridColumn = clone(gridColumns[2]);
            cMerge(gridColumn, {needSearchHighlight: false});
            assert.equal(3, current.columnIndex, 'Incorrect value "current.columnIndex" after "goToNextColumn()".');
            assert.isTrue(current.getLastColumnIndex() === current.columnIndex, 'Incorrect value "current.getLastColumnIndex() === current.columnIndex" after "gotToNextColumn()".');
            checkBaseProperties(current.getCurrentColumn(), {
               columnIndex: 3,
               keyProperty: cfg.keyProperty,
               displayProperty: cfg.displayProperty,
               column: gridColumn,
               item: gridData[0],
               template: null,
               cellClasses: 'controls-Grid__row-cell controls-Grid__row-cell-background-hover controls-Grid__row-cell_firstRow controls-Grid__row-cell_withRowSeparator_firstRow' +
               ' controls-Grid__cell_spacingLeft controls-Grid__cell_default controls-Grid__cell_spacingLastCol_l controls-Grid__row-cell_rowSpacingTop_l controls-Grid__row-cell_rowSpacingBottom_l' +
               ' controls-Grid__row-cell_selected controls-Grid__row-cell_selected-default' +
               ' controls-Grid__row-cell_selected__last controls-Grid__row-cell_selected__last-default'
            });

            // check the absence of other columns
            current.goToNextColumn();
            assert.equal(4, current.columnIndex, 'Incorrect value "current.columnIndex" after "goToNextColumn()".');

            // check reset column index and retest first column
            current.resetColumnIndex();

            assert.equal(0, current.columnIndex, 'Incorrect value "current.columnIndex" after "resetColumnIndex()".');
            assert.isFalse(current.getLastColumnIndex() === current.columnIndex, 'Incorrect value "current.getLastColumnIndex() === current.columnIndex" after "resetColumnIndex()".');
            checkBaseProperties(current.getCurrentColumn(), {
               columnIndex: 0,
               keyProperty: cfg.keyProperty,
               displayProperty: cfg.displayProperty,
               column: {needSearchHighlight: false},
               item: gridData[0],
               template: null,
               cellClasses: 'controls-Grid__row-cell controls-Grid__row-cell-background-hover controls-Grid__row-cell_firstRow' +
                  ' controls-Grid__row-cell_withRowSeparator_firstRow controls-Grid__row-cell-checkbox' +
                  ' controls-Grid__row-cell_selected controls-Grid__row-cell_selected-default' +
                  ' controls-Grid__row-cell_selected__first-default'
            });
         });
      });
      describe('methods for processing with items', function() {
         var
            gridViewModel = new GridViewModel(cfg);
         it('getColumns', function() {
            assert.deepEqual(gridColumns, gridViewModel.getColumns(), 'Incorrect value "getColumns()".');
         });
         it('setMultiSelectVisibility && getMultiSelectVisibility', function() {
            assert.equal('visible', gridViewModel.getMultiSelectVisibility(), 'Incorrect value "getMultiSelectVisibility()" before "setMultiSelectVisibility()".');
            gridViewModel.setMultiSelectVisibility('');
            assert.equal('', gridViewModel.getMultiSelectVisibility(), 'Incorrect value "getMultiSelectVisibility()" after "setMultiSelectVisibility()".');
            gridViewModel.setMultiSelectVisibility('visible');
            assert.equal('visible', gridViewModel.getMultiSelectVisibility(), 'Incorrect value "getMultiSelectVisibility()" after "setMultiSelectVisibility(visible)".');
         });
         it('methods throwing a call into the model', function() {
            var
               gridViewModel = new GridViewModel(cfg),
               callMethods = ['getItemById', 'setMarkedKey', 'reset', 'isEnd', 'goToNext', 'getNext', 'isLast',
                  'updateIndexes', 'setItems', 'setActiveItem', 'appendItems', 'prependItems', 'setItemActions', 'getDragTargetPosition',
                  'getIndexBySourceItem', 'at', 'getCount', 'setSwipeItem', 'getSwipeItem', 'updateSelection', 'getItemActions', 'getCurrentIndex',
                  '_prepareDisplayItemForAdd', 'mergeItems', 'toggleGroup', '_setEditingItemData', 'getMarkedKey',
                  'getChildren','getStartIndex', 'getActiveItem', 'setRightSwipedItem', 'destroy', 'nextModelVersion', 'getEditingItemData'],
               callStackMethods = [];

            gridViewModel._model = {};
            callMethods.forEach(function(item) {
               gridViewModel._model[item] = function() {
                  callStackMethods.push(item);
               };
            });
            gridViewModel._model.subscribe = gridViewModel._model.unsubscribe = function() {};
            callMethods.forEach(function(item) {
               gridViewModel[item]();
            });
            assert.deepEqual(callMethods, callStackMethods, 'Incorrect call stack methods.');
         });
      });
      describe('ladder and sticky column', function() {

         // for ladder by date check, ladder field can be any JS type
         var date1 = new Date(2017, 00, 01),
            date2 = new Date(2017, 00, 03),
            date3 = new Date(2017, 00, 05),
            date4 = new Date(2017, 00, 07),
            date5 = new Date(2017, 00, 09),
            initialColumns = [{
               width: '1fr',
               displayProperty: 'title'
            }, {
               width: '1fr',
               template: 'wml!MyTestDir/Photo',
               stickyProperty: 'photo'
            }],
            resultLadder = {
               0: { date: { ladderLength: 1 } },
               1: { date: { ladderLength: 3 } },
               2: { date: { } },
               3: { date: { } },
               4: { date: { ladderLength: 2 } },
               5: { date: { } },
               6: { date: { ladderLength: 1 } },
               7: { date: { ladderLength: 3 } },
               8: { date: { } },
               9: { date: { } }
            },
            resultStickyLadder = {
               0: { ladderLength: 3, headingStyle: 'grid-area: 1 / 1 / span 3 / span 1;' },
               1: { },
               2: { },
               3: { ladderLength: 1 },
               4: { ladderLength: 4, headingStyle: 'grid-area: 5 / 1 / span 4 / span 1;' },
               5: { },
               6: { },
               7: { },
               8: { ladderLength: 1 },
               9: { ladderLength: 1 }
            },
            ladderViewModel = new GridViewModel({
               items: new collection.RecordSet({
                  idProperty: 'id',
                  rawData: [
                     { id: 0, title: 'i0', date: date1, photo: '1.png' },
                     { id: 1, title: 'i1', date: date2, photo: '1.png' },
                     { id: 2, title: 'i2', date: date2, photo: '1.png' },
                     { id: 3, title: 'i3', date: date2, photo: '2.png' },
                     { id: 4, title: 'i4', date: date3, photo: '3.png' },
                     { id: 5, title: 'i5', date: date3, photo: '3.png' },
                     { id: 6, title: 'i6', date: date4, photo: '3.png' },
                     { id: 7, title: 'i7', date: date5, photo: '3.png' },
                     { id: 8, title: 'i8', date: date5, photo: '4.png' },
                     { id: 9, title: 'i9', date: date5, photo: '5.png' }
                  ]
               }),
               keyProperty: 'id',
               columns: initialColumns,
               ladderProperties: ['date']
            });
         assert.deepEqual(ladderViewModel._ladder.ladder, resultLadder, 'Incorrect value prepared ladder.');
         assert.deepEqual(ladderViewModel._ladder.stickyLadder, resultStickyLadder, 'Incorrect value prepared stickyLadder.');

         var
            newItems = new collection.RecordSet({
               idProperty: 'id',
               rawData: [
                  { id: 0, title: 'i0', date: '01 янв', photo: '1.png' },
                  { id: 1, title: 'i1', date: '03 янв', photo: '1.png' },
                  { id: 2, title: 'i2', date: '03 янв', photo: '1.png' }
               ]
            }),
            newResultLadder = {
               0: { date: { ladderLength: 1 } },
               1: { date: { ladderLength: 2 } },
               2: { date: { } }
            },
            newResultStickyLadder = {
               0: { ladderLength: 3, headingStyle: 'grid-area: 1 / 1 / span 3 / span 1;' },
               1: { },
               2: { }
            };

         ladderViewModel.setItems(newItems);

         assert.deepEqual(ladderViewModel._ladder.ladder, newResultLadder, 'Incorrect value prepared ladder after setItems.');
         assert.deepEqual(ladderViewModel._ladder.stickyLadder, newResultStickyLadder, 'Incorrect value prepared stickyLadder after setItems.');

         // check ladder and grouping
         var
            groupingLadderViewModel = new GridViewModel({
               items: new collection.RecordSet({
                  idProperty: 'id',
                  rawData: [
                     { id: 0, title: 'i0', group: 'g1', date: '01 янв' },
                     { id: 1, title: 'i1', group: 'g1', date: '03 янв' },
                     { id: 2, title: 'i2', group: 'g1', date: '03 янв' },
                     { id: 3, title: 'i3', group: 'g2', date: '03 янв' },
                     { id: 4, title: 'i4', group: 'g2', date: '03 янв' }
                  ]
               }),
               keyProperty: 'id',
               columns: [{
                  width: '1fr',
                  displayProperty: 'title'
               }],
               ladderProperties: ['date'],
               groupingKeyCallback: function(item) {
                  return item.get('group');
               }
            });
         assert.deepEqual(groupingLadderViewModel._ladder.ladder, {
            '0': {
               'date': {}
            },
            '1': {
               'date': {
                  'ladderLength': 1
               }
            },
            '2': {
               'date': {
                  'ladderLength': 2
               }
            },
            '3': {
               'date': {}
            },
            '4': {
               'date': {
                  'ladderLength': 1
               }
            },
            '5': {
               'date': {
                  'ladderLength': 2
               }
            },
            '6': {
               'date': {}
            }
         }, 'Incorrect value prepared ladder with grouping.');
      });
      describe('other methods of the class', function() {
         var
            gridViewModel = new GridViewModel(cfg),
            imitateTemplate = function() {};
         it('setColumnTemplate', function() {
            assert.equal(null, gridViewModel._columnTemplate, 'Incorrect value "_columnTemplate" before "setColumnTemplate(imitateTemplate)".');
            gridViewModel.setColumnTemplate(imitateTemplate);
            assert.equal(imitateTemplate, gridViewModel._columnTemplate, 'Incorrect value "_columnTemplate" after "setColumnTemplate(imitateTemplate)".');
         });
         it('getHeader && setHeader', function() {
            assert.deepEqual(gridHeader, gridViewModel.getHeader(), 'Incorrect value "getHeader()" before "setHeader(null)".');
            gridViewModel.setHeader(null);
            assert.equal(null, gridViewModel.getHeader(), 'Incorrect value "getHeader()" after "setHeader(null)".');
            gridViewModel.setHeader(gridHeader);
            assert.deepEqual(gridHeader, gridViewModel.getHeader(), 'Incorrect value "getHeader()" after "setHeader(gridHeader)".');
         });
         it('getColumns && setColumns', function() {
            var newColumns = [{
               displayProperty: 'field1'
            }, {
               displayProperty: 'field2'
            }];
            assert.deepEqual(gridColumns, gridViewModel.getColumns(), 'Incorrect value "getColumns()" before "setColumns(newColumns)".');
            gridViewModel.setColumns(newColumns);
            assert.deepEqual(newColumns, gridViewModel.getColumns(), 'Incorrect value "getColumns()" after "setColumns(newColumns)".');
            gridViewModel.setColumns(gridColumns);
            assert.deepEqual(gridColumns, gridViewModel.getColumns(), 'Incorrect value "getColumns()" before "setColumns(gridColumns)".');
         });
         it('_prepareCrossBrowserColumn', function() {
            var
               initialColumns = [
                  {
                     title: 'first',
                     width: ''
                  },
                  {
                     title: 'second',
                     width: '1fr'
                  },
                  {
                     title: 'third',
                     width: '100px'
                  },
                  {
                     title: 'last',
                     width: 'auto'
                  }
               ],
               resultColumns = [
                  {
                     title: 'first',
                     width: ''
                  },
                  {
                     title: 'second',
                     width: 'auto'
                  },
                  {
                     title: 'third',
                     width: '100px'
                  },
                  {
                     title: 'last',
                     width: 'auto'
                  }
               ];
            for (var i = 0; i < initialColumns.length; i++) {
               assert.deepEqual(resultColumns[i], gridViewModel._prepareCrossBrowserColumn(initialColumns[i], true),
                  'Incorrect result "_prepareCrossBrowserColumn(initialColumns[' + i + '])".');
            }
         });
         it('_prepareHeaderColumns', function() {
            assert.deepEqual([{}].concat(gridHeader), gridViewModel._headerColumns, 'Incorrect value "_headerColumns" before "_prepareHeaderColumns([])" without multiselect.');
            gridViewModel._prepareHeaderColumns([], false);
            assert.deepEqual([], gridViewModel._headerColumns, 'Incorrect value "_headerColumns" after "_prepareHeaderColumns([])" without multiselect.');
            gridViewModel._prepareHeaderColumns(gridHeader, false);
            assert.deepEqual(gridHeader, gridViewModel._headerColumns, 'Incorrect value "_headerColumns" after "_prepareHeaderColumns(gridHeader)" without multiselect.');

            gridViewModel._prepareHeaderColumns([], true);
            assert.deepEqual([{}], gridViewModel._headerColumns, 'Incorrect value "_headerColumns" after "_prepareHeaderColumns([])" with multiselect.');
            gridViewModel._prepareHeaderColumns(gridHeader, true);
            assert.deepEqual([{}].concat(gridHeader), gridViewModel._headerColumns, 'Incorrect value "_headerColumns" after "_prepareHeaderColumns(gridHeader)" with multiselect.');
         });
         it('getCurrentHeaderColumn && goToNextHeaderColumn && isEndHeaderColumn && resetHeaderColumns', function() {
            assert.deepEqual({
               column: {},
               cellClasses: 'controls-Grid__header-cell controls-Grid__header-cell-checkbox',
               index: 0
            }, gridViewModel.getCurrentHeaderColumn(), 'Incorrect value first call "getCurrentHeaderColumn()".');

            assert.equal(true, gridViewModel.isEndHeaderColumn(), 'Incorrect value "isEndHeaderColumn()" after first call "getCurrentHeaderColumn()".');
            gridViewModel.goToNextHeaderColumn();

            assert.deepEqual({
               column: gridHeader[0],
               cellClasses: 'controls-Grid__header-cell controls-Grid__cell_spacingRight controls-Grid__cell_default',
               index: 1
            }, gridViewModel.getCurrentHeaderColumn(), 'Incorrect value second call "getCurrentHeaderColumn()".');

            assert.equal(true, gridViewModel.isEndHeaderColumn(), 'Incorrect value "isEndHeaderColumn()" after second call "getCurrentHeaderColumn()".');
            gridViewModel.goToNextHeaderColumn();

            assert.deepEqual({
               column: gridHeader[1],
               cellClasses: 'controls-Grid__header-cell controls-Grid__cell_spacingLeft controls-Grid__cell_spacingRight controls-Grid__cell_default ' +
                  'controls-Grid__header-cell_halign_right',
               index: 2,
               sortingDirection: 'DESC'
            }, gridViewModel.getCurrentHeaderColumn(), 'Incorrect value third call "getCurrentHeaderColumn()".');

            assert.equal(true, gridViewModel.isEndHeaderColumn(), 'Incorrect value "isEndHeaderColumn()" after third call "getCurrentHeaderColumn()".');
            gridViewModel.goToNextHeaderColumn();

            assert.deepEqual({
               column: gridHeader[2],
               cellClasses: 'controls-Grid__header-cell controls-Grid__cell_spacingLeft controls-Grid__cell_default controls-Grid__cell_spacingLastCol_l ' +
                  'controls-Grid__header-cell_halign_right',
               index: 3
            }, gridViewModel.getCurrentHeaderColumn(), 'Incorrect value fourth call "getCurrentHeaderColumn()".');

            assert.equal(true, gridViewModel.isEndHeaderColumn(), 'Incorrect value "isEndHeaderColumn()" after fourth call "getCurrentHeaderColumn()".');

            gridViewModel.goToNextHeaderColumn();
            assert.equal(false, gridViewModel.isEndHeaderColumn(), 'Incorrect value "isEndHeaderColumn()" after last call "getCurrentHeaderColumn()".');

            assert.equal(4, gridViewModel._curHeaderColumnIndex, 'Incorrect value "_curHeaderColumnIndex" before "resetHeaderColumns()".');
            gridViewModel.resetHeaderColumns();
            assert.equal(0, gridViewModel._curHeaderColumnIndex, 'Incorrect value "_curHeaderColumnIndex" after "resetHeaderColumns()".');
         });
         it('getResultsPosition()', function() {
            assert.deepEqual(undefined, gridViewModel.getResultsPosition(), 'Incorrect value "getResultsPosition()".');
         });
         it('_prepareResultsColumns', function() {
            assert.deepEqual([{}].concat(gridColumns), gridViewModel._resultsColumns, 'Incorrect value "_headerColumns" before "_prepareResultsColumns([])" without multiselect.');
            gridViewModel._prepareResultsColumns([], false);
            assert.deepEqual([], gridViewModel._resultsColumns, 'Incorrect value "_resultsColumns" after "_prepareResultsColumns([])" without multiselect.');
            gridViewModel._prepareResultsColumns(gridColumns, false);
            assert.deepEqual(gridColumns, gridViewModel._resultsColumns, 'Incorrect value "_resultsColumns" after "_prepareResultsColumns(gridColumns)" without multiselect.');

            gridViewModel._prepareResultsColumns([], true);
            assert.deepEqual([{}], gridViewModel._resultsColumns, 'Incorrect value "_resultsColumns" after "_prepareResultsColumns([])" with multiselect.');
            gridViewModel._prepareResultsColumns(gridColumns, true);
            assert.deepEqual([{}].concat(gridColumns), gridViewModel._resultsColumns, 'Incorrect value "_resultsColumns" after "_prepareResultsColumns(gridColumns)" with multiselect.');
         });
         it('getCurrentResultsColumn && goToNextResultsColumn && isEndResultsColumn && resetResultsColumns', function() {
            assert.deepEqual({
               column: {},
               cellClasses: 'controls-Grid__results-cell controls-Grid__results-cell-checkbox',
               index: 0
            }, gridViewModel.getCurrentResultsColumn(), 'Incorrect value first call "getCurrentResultsColumn()".');

            assert.equal(true, gridViewModel.isEndResultsColumn(), 'Incorrect value "isEndResultsColumn()" after first call "getCurrentResultsColumn()".');
            gridViewModel.goToNextResultsColumn();

            assert.deepEqual({
               column: gridColumns[0],
               cellClasses: 'controls-Grid__results-cell controls-Grid__cell_spacingRight controls-Grid__cell_default controls-Grid__row-cell_rowSpacingTop_l controls-Grid__row-cell_rowSpacingBottom_l',
               index: 1
            }, gridViewModel.getCurrentResultsColumn(), 'Incorrect value second call "getCurrentResultsColumn()".');

            assert.equal(true, gridViewModel.isEndResultsColumn(), 'Incorrect value "isEndResultsColumn()" after second call "getCurrentResultsColumn()".');
            gridViewModel.goToNextResultsColumn();

            assert.deepEqual({
               column: gridColumns[1],
               cellClasses: 'controls-Grid__results-cell controls-Grid__cell_spacingLeft controls-Grid__cell_spacingRight controls-Grid__cell_default ' +
                  'controls-Grid__row-cell_rowSpacingTop_l controls-Grid__row-cell_rowSpacingBottom_l',
               index: 2
            }, gridViewModel.getCurrentResultsColumn(), 'Incorrect value third call "getCurrentResultsColumn()".');

            assert.equal(true, gridViewModel.isEndResultsColumn(), 'Incorrect value "isEndResultsColumn()" after third call "getCurrentResultsColumn()".');
            gridViewModel.goToNextResultsColumn();

            assert.deepEqual({
               column: gridColumns[2],
               cellClasses: 'controls-Grid__results-cell controls-Grid__cell_spacingLeft controls-Grid__cell_default controls-Grid__cell_spacingLastCol_l ' +
                  'controls-Grid__row-cell_rowSpacingTop_l controls-Grid__row-cell_rowSpacingBottom_l',
               index: 3
            }, gridViewModel.getCurrentResultsColumn(), 'Incorrect value fourth call "getCurrentResultsColumn()".');

            assert.equal(true, gridViewModel.isEndResultsColumn(), 'Incorrect value "isEndResultsColumn()" after fourth call "getCurrentResultsColumn()".');

            gridViewModel.goToNextResultsColumn();
            assert.equal(false, gridViewModel.isEndResultsColumn(), 'Incorrect value "isEndResultsColumn()" after last call "getCurrentResultsColumn()".');

            assert.equal(4, gridViewModel._curResultsColumnIndex, 'Incorrect value "_curResultsColumnIndex" before "resetResultsColumns()".');
            gridViewModel.resetResultsColumns();
            assert.equal(0, gridViewModel._curResultsColumnIndex, 'Incorrect value "_curResultsColumnIndex" after "resetResultsColumns()".');
         });
         it('_prepareColgroupColumns', function() {
            assert.deepEqual([{}].concat(gridColumns), gridViewModel._colgroupColumns, 'Incorrect value "_colgroupColumns" before "_prepareColgroupColumns([])" without multiselect.');
            gridViewModel._prepareColgroupColumns([], false);
            assert.deepEqual([], gridViewModel._colgroupColumns, 'Incorrect value "_colgroupColumns" after "_prepareColgroupColumns([])" without multiselect.');
            gridViewModel._prepareColgroupColumns(gridColumns, false);
            assert.deepEqual(gridColumns, gridViewModel._colgroupColumns, 'Incorrect value "_colgroupColumns" after "_prepareColgroupColumns(gridColumns)" without multiselect.');

            gridViewModel._prepareColgroupColumns([], true);
            assert.deepEqual([{}], gridViewModel._colgroupColumns, 'Incorrect value "_colgroupColumns" after "_prepareColgroupColumns([])" with multiselect.');
            gridViewModel._prepareColgroupColumns(gridColumns, true);
            assert.deepEqual([{}].concat(gridColumns), gridViewModel._colgroupColumns, 'Incorrect value "_colgroupColumns" after "_prepareColgroupColumns(gridColumns)" with multiselect.');
         });
         it('getCurrentColgroupColumn && goToNextColgroupColumn && isEndColgroupColumn && resetColgroupColumns', function() {
            assert.deepEqual({
               column: {},
               index: 0,
               style: '',
               multiSelectVisibility: true
            }, gridViewModel.getCurrentColgroupColumn(), 'Incorrect value first call "getCurrentColgroupColumn()".');

            assert.equal(true, gridViewModel.isEndColgroupColumn(), 'Incorrect value "isEndColgroupColumn()" after first call "getCurrentColgroupColumn()".');
            gridViewModel.goToNextColgroupColumn();

            assert.deepEqual({
               column: gridColumns[0],
               index: 1,
               style: 'width: 1fr',
               multiSelectVisibility: true
            }, gridViewModel.getCurrentColgroupColumn(), 'Incorrect value second call "getCurrentColgroupColumn()".');

            assert.equal(true, gridViewModel.isEndColgroupColumn(), 'Incorrect value "isEndColgroupColumn()" after second call "getCurrentColgroupColumn()".');
            gridViewModel.goToNextColgroupColumn();

            assert.deepEqual({
               column: gridColumns[1],
               index: 2,
               style: 'width: auto',
               multiSelectVisibility: true
            }, gridViewModel.getCurrentColgroupColumn(), 'Incorrect value third call "getCurrentColgroupColumn()".');

            assert.equal(true, gridViewModel.isEndColgroupColumn(), 'Incorrect value "isEndColgroupColumn()" after third call "getCurrentColgroupColumn()".');
            gridViewModel.goToNextColgroupColumn();

            assert.deepEqual({
               column: gridColumns[2],
               index: 3,
               style: 'width: auto',
               multiSelectVisibility: true
            }, gridViewModel.getCurrentColgroupColumn(), 'Incorrect value fourth call "getCurrentColgroupColumn()".');

            assert.equal(true, gridViewModel.isEndColgroupColumn(), 'Incorrect value "isEndColgroupColumn()" after fourth call "getCurrentColgroupColumn()".');

            gridViewModel.goToNextColgroupColumn();
            assert.equal(false, gridViewModel.isEndColgroupColumn(), 'Incorrect value "isEndColgroupColumn()" after last call "getCurrentColgroupColumn()".');

            assert.equal(4, gridViewModel._curColgroupColumnIndex, 'Incorrect value "_curColgroupColumnIndex" before "resetColgroupColumns()".');
            gridViewModel.resetColgroupColumns();
            assert.equal(0, gridViewModel._curColgroupColumnIndex, 'Incorrect value "_curColgroupColumnIndex" after "resetColgroupColumns()".');
         });
      });
   });
});
