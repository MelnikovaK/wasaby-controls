define(['Controls/List/Grid/GridViewModel', 'Core/core-merge', 'WS.Data/Collection/RecordSet'], function(GridViewModel, cMerge) {
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
            valign: 'top'
         },
         {
            displayProperty: 'price',
            width: 'auto',
            align: 'right',
            valign: 'bottom'
         },
         {
            displayProperty: 'balance',
            width: 'auto',
            align: 'right',
            valign: 'middle'
         }
      ],
      gridHeader = [
         {
            title: ''
         },
         {
            title: 'Цена',
            align: 'right'
         },
         {
            title: 'Остаток',
            align: 'right'
         }
      ],
      itemActions = [],
      cfg = {
         keyProperty: 'id',
         displayProperty: 'title',
         markedKey: '123',
         multiSelectVisibility: 'visible',
         header: gridHeader,
         columns: gridColumns,
         items: gridData,
         itemActions: itemActions,
         ladderSupport: false,
         leftPadding: 'XL',
         rightPadding: 'L',
         rowSpacing: 'L',
         showRowSeparator: true
      };

   describe('Controls.List.Grid.GridViewModel', function() {
      describe('"_private" block', function() {
         it('getPaddingCellClasses', function() {
            var
               paramsWithoutMultiselect = {
                  columns: gridColumns,
                  multiSelectVisibility: false,
                  leftPadding: 'XL',
                  rightPadding: 'L',
                  rowSpacing: 'L'
               },
               paramsWithMultiselect = {
                  columns: [{}].concat(gridColumns),
                  multiSelectVisibility: true,
                  leftPadding: 'XL',
                  rightPadding: 'L',
                  rowSpacing: 'L'
               },
               expectedResultWithoutMultiselect = [
                  ' controls-Grid__cell_spacingRight controls-Grid__cell_spacingFirstCol_XL controls-Grid__row-cell_rowSpacing_L controls-Grid__header-cell_valign_top',
                  ' controls-Grid__cell_spacingLeft controls-Grid__cell_spacingRight controls-Grid__row-cell_rowSpacing_L controls-Grid__header-cell_valign_bottom',
                  ' controls-Grid__cell_spacingLeft controls-Grid__cell_spacingLastCol_L controls-Grid__row-cell_rowSpacing_L controls-Grid__header-cell_valign_middle' ],
               expectedResultWithMultiselect = [
                  ' controls-Grid__cell_spacingRight controls-Grid__row-cell_rowSpacing_L',
                  ' controls-Grid__cell_spacingRight controls-Grid__row-cell_rowSpacing_L controls-Grid__header-cell_valign_top',
                  ' controls-Grid__cell_spacingLeft controls-Grid__cell_spacingRight controls-Grid__row-cell_rowSpacing_L controls-Grid__header-cell_valign_bottom',
                  ' controls-Grid__cell_spacingLeft controls-Grid__cell_spacingLastCol_L controls-Grid__row-cell_rowSpacing_L controls-Grid__header-cell_valign_middle' ];
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
         it('prepareRowSeparatorClasses', function() {
            var
               expectedResultWithRowSeparator = [
                  ' controls-Grid__row-cell_firstRow controls-Grid__row-cell_withRowSeparator_firstRow',
                  ' controls-Grid__row-cell_withRowSeparator',
                  ' controls-Grid__row-cell_lastRow controls-Grid__row-cell_withRowSeparator_lastRow controls-Grid__row-cell_withRowSeparator'
               ],
               expectedResultWithoutRowSeparator = [
                  ' controls-Grid__row-cell_withoutRowSeparator',
                  ' controls-Grid__row-cell_withoutRowSeparator',
                  ' controls-Grid__row-cell_withoutRowSeparator'
               ];
            assert.equal(expectedResultWithRowSeparator[0], GridViewModel._private.prepareRowSeparatorClasses(true, 0, 3));
            assert.equal(expectedResultWithRowSeparator[1], GridViewModel._private.prepareRowSeparatorClasses(true, 1, 3));
            assert.equal(expectedResultWithRowSeparator[2], GridViewModel._private.prepareRowSeparatorClasses(true, 2, 3));

            assert.equal(expectedResultWithoutRowSeparator[0], GridViewModel._private.prepareRowSeparatorClasses(false, 0, 3));
            assert.equal(expectedResultWithoutRowSeparator[1], GridViewModel._private.prepareRowSeparatorClasses(false, 1, 3));
            assert.equal(expectedResultWithoutRowSeparator[2], GridViewModel._private.prepareRowSeparatorClasses(false, 2, 3));
         });
         it('getItemColumnCellClasses', function() {
            var
               gridViewModel = new GridViewModel(cfg),
               current = gridViewModel.getCurrent(),
               expectedResult = [
                  'controls-Grid__row-cell controls-Grid__row-cell-background-hover controls-Grid__row-cell_firstRow controls-Grid__row-cell_withRowSeparator_firstRow ' +
                     'controls-Grid__row-cell-checkbox controls-Grid__row-cell_rowSpacing_default ' +
                     'controls-Grid__row-cell_withSelectionMarker',
                  'controls-Grid__row-cell controls-Grid__row-cell-background-hover controls-Grid__row-cell_firstRow controls-Grid__row-cell_withRowSeparator_firstRow ' +
                     'controls-Grid__cell_spacingRight controls-Grid__row-cell_rowSpacing_L ' +
                     'controls-Grid__header-cell_valign_top controls-Grid__row-cell_rowSpacing_default',
                  'controls-Grid__row-cell controls-Grid__row-cell-background-hover controls-Grid__row-cell_firstRow controls-Grid__row-cell_withRowSeparator_firstRow ' +
                     'controls-Grid__cell_spacingLeft controls-Grid__cell_spacingRight ' +
                     'controls-Grid__row-cell_rowSpacing_L ' +
                     'controls-Grid__header-cell_valign_bottom controls-Grid__row-cell_rowSpacing_default',
                  'controls-Grid__row-cell controls-Grid__row-cell-background-hover controls-Grid__row-cell_firstRow controls-Grid__row-cell_withRowSeparator_firstRow ' +
                     'controls-Grid__cell_spacingLeft controls-Grid__cell_spacingLastCol_L ' +
                     'controls-Grid__row-cell_rowSpacing_L ' +
                     'controls-Grid__header-cell_valign_middle controls-Grid__row-cell_rowSpacing_default' ];
            assert.equal(expectedResult[0],
               GridViewModel._private.getItemColumnCellClasses(current),
               'Incorrect value "GridViewModel._private.getPaddingCellClasses(params)".');
            current.goToNextColumn();
            assert.equal(expectedResult[1],
               GridViewModel._private.getItemColumnCellClasses(current),
               'Incorrect value "GridViewModel._private.getPaddingCellClasses(params)".');
            current.goToNextColumn();
            assert.equal(expectedResult[2],
               GridViewModel._private.getItemColumnCellClasses(current),
               'Incorrect value "GridViewModel._private.getPaddingCellClasses(params)".');
            current.goToNextColumn();
            assert.equal(expectedResult[3],
               GridViewModel._private.getItemColumnCellClasses(current),
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
            assert.isTrue(current.multiSelectVisibility, 'Incorrect value "current.multiSelectVisibility".');
            assert.deepEqual([{}].concat(gridColumns), current.columns, 'Incorrect value "current.columns".');
            assert.isFalse(current.ladderSupport, 'Incorrect value "current.ladderSupport".');
            assert.equal('XL', current.leftPadding, 'Incorrect value "current.leftPadding".');
            assert.equal('L', current.rightPadding, 'Incorrect value "current.rightPadding".');
            assert.equal('L', current.rowSpacing, 'Incorrect value "current.rowSpacing".');
            assert.isTrue(current.showRowSeparator, 'Incorrect value "current.showRowSeparator".');
         });

         it('item', function() {
            assert.equal(gridData[0][cfg.keyProperty], current.key, 'Incorrect value "current.keyProperty".');
            assert.equal(0, current.index, 'Incorrect value "current.index".');
            assert.deepEqual(gridData[0], current.item, 'Incorrect value "current.item".');
            assert.deepEqual(gridData[0], current.dispItem.getContents(), 'Incorrect value "current.dispItem".');
            assert.equal(gridData[0][cfg.displayProperty], current.getPropValue(current.item, cfg.displayProperty), 'Incorrect value "current.displayProperty".');
         });

         it('state', function() {
            assert.isTrue(current.isSelected, 'Incorrect value "current.isSelected".');
            assert.equal(undefined, current.isActive, 'Incorrect value "current.isActive".');
            assert.equal(0, current.multiSelectStatus, 'Incorrect value "current.multiSelectStatus".');
            assert.isTrue(current.multiSelectVisibility, 'Incorrect value "current.multiSelectVisibility".');
            assert.isTrue(current.showActions, 'Incorrect value "current.showActions".');
            assert.equal(undefined, current.isSwiped, 'Incorrect value "current.isSwiped".');
         });

         it('columns', function() {
            function checkBaseProperties(checkedColumn, expectedData) {
               assert.equal(expectedData.columnIndex, checkedColumn.columnIndex, 'Incorrect value "columnIndex" when checking columns.');
               assert.deepEqual(expectedData.column, checkedColumn.column, 'Incorrect value "column" when checking columns.');
               assert.deepEqual(expectedData.item, checkedColumn.item, 'Incorrect value "item" when checking columns.');
               assert.deepEqual(expectedData.item, checkedColumn.dispItem.getContents(), 'Incorrect value "dispItem" when checking columns.');
               assert.equal(expectedData.keyProperty, checkedColumn.keyProperty, 'Incorrect value "keyProperty" when checking columns.');
               assert.equal(expectedData.displayProperty, checkedColumn.displayProperty, 'Incorrect value "displayProperty" when checking columns.');
               assert.equal(expectedData.item[expectedData.keyProperty], checkedColumn.key, 'Incorrect value "getPropValue(item, displayProperty)" when checking columns.');
               assert.equal(expectedData.item[expectedData.displayProperty],
                  checkedColumn.getPropValue(checkedColumn.item, expectedData.displayProperty), 'Incorrect value "" when checking columns.');
               assert.equal(expectedData.template, checkedColumn.template, 'Incorrect value "template" when checking columns.');
               assert.equal(expectedData.cellClasses, checkedColumn.cellClasses, 'Incorrect value "cellClasses" when checking columns.');
            }

            // check first column (multiselect checkbox column)
            assert.equal(0, current.columnIndex, 'Incorrect value "current.columnIndex".');
            assert.isFalse(current.getLastColumnIndex() === current.columnIndex, 'Incorrect value "current.getLastColumnIndex() === current.columnIndex".');
            checkBaseProperties(current.getCurrentColumn(), {
               columnIndex: 0,
               keyProperty: cfg.keyProperty,
               displayProperty: cfg.displayProperty,
               column: {},
               item: gridData[0],
               template: null,
               cellClasses: 'controls-Grid__row-cell controls-Grid__row-cell-background-hover controls-Grid__row-cell_firstRow controls-Grid__row-cell_withRowSeparator_firstRow ' +
                  'controls-Grid__row-cell-checkbox controls-Grid__row-cell_rowSpacing_default ' +
                  'controls-Grid__row-cell_withSelectionMarker'
            });

            // check next column
            current.goToNextColumn();
            assert.equal(1, current.columnIndex, 'Incorrect value "current.columnIndex" after "goToNextColumn()".');
            assert.isFalse(current.getLastColumnIndex() === current.columnIndex, 'Incorrect value "current.getLastColumnIndex() === current.columnIndex" after "goToNextColumn()".');
            checkBaseProperties(current.getCurrentColumn(), {
               columnIndex: 1,
               keyProperty: cfg.keyProperty,
               displayProperty: cfg.displayProperty,
               column: gridColumns[0],
               item: gridData[0],
               template: null,
               cellClasses: 'controls-Grid__row-cell controls-Grid__row-cell-background-hover controls-Grid__row-cell_firstRow controls-Grid__row-cell_withRowSeparator_firstRow ' +
                  'controls-Grid__cell_spacingRight controls-Grid__row-cell_rowSpacing_L ' +
                  'controls-Grid__header-cell_valign_top controls-Grid__row-cell_rowSpacing_default'
            });

            // check next column
            current.goToNextColumn();
            assert.equal(2, current.columnIndex, 'Incorrect value "current.columnIndex" after "goToNextColumn()".');
            assert.isFalse(current.getLastColumnIndex() === current.columnIndex, 'Incorrect value "current.getLastColumnIndex() === current.columnIndex" after goToNextColumn().');
            checkBaseProperties(current.getCurrentColumn(), {
               columnIndex: 2,
               keyProperty: cfg.keyProperty,
               displayProperty: cfg.displayProperty,
               column: gridColumns[1],
               item: gridData[0],
               template: null,
               cellClasses: 'controls-Grid__row-cell controls-Grid__row-cell-background-hover controls-Grid__row-cell_firstRow controls-Grid__row-cell_withRowSeparator_firstRow ' +
                  'controls-Grid__cell_spacingLeft controls-Grid__cell_spacingRight ' +
                  'controls-Grid__row-cell_rowSpacing_L controls-Grid__header-cell_valign_bottom ' +
                  'controls-Grid__row-cell_rowSpacing_default'
            });

            // check last column
            current.goToNextColumn();
            assert.equal(3, current.columnIndex, 'Incorrect value "current.columnIndex" after "goToNextColumn()".');
            assert.isTrue(current.getLastColumnIndex() === current.columnIndex, 'Incorrect value "current.getLastColumnIndex() === current.columnIndex" after "gotToNextColumn()".');
            checkBaseProperties(current.getCurrentColumn(), {
               columnIndex: 3,
               keyProperty: cfg.keyProperty,
               displayProperty: cfg.displayProperty,
               column: gridColumns[2],
               item: gridData[0],
               template: null,
               cellClasses: 'controls-Grid__row-cell controls-Grid__row-cell-background-hover controls-Grid__row-cell_firstRow controls-Grid__row-cell_withRowSeparator_firstRow ' +
                  'controls-Grid__cell_spacingLeft controls-Grid__cell_spacingLastCol_L ' +
                  'controls-Grid__row-cell_rowSpacing_L controls-Grid__header-cell_valign_middle ' +
                  'controls-Grid__row-cell_rowSpacing_default'
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
               column: {},
               item: gridData[0],
               template: null,
               cellClasses: 'controls-Grid__row-cell controls-Grid__row-cell-background-hover controls-Grid__row-cell_firstRow controls-Grid__row-cell_withRowSeparator_firstRow ' +
                  'controls-Grid__row-cell-checkbox controls-Grid__row-cell_rowSpacing_default ' +
                  'controls-Grid__row-cell_withSelectionMarker'
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
                  'getIndexBySourceItem', 'at', 'getCount', 'setSwipeItem', 'select', 'unselect', 'getSwipeItem', 'destroy'],
               callStackMethods = [];

            gridViewModel._model = {};
            callMethods.forEach(function(item) {
               gridViewModel._model[item] = function() {
                  callStackMethods.push(item);
               };
            });
            callMethods.forEach(function(item) {
               gridViewModel[item]();
            });
            assert.deepEqual(callMethods, callStackMethods, 'Incorrect call stack methods.');
         });
      });
      describe('ladder', function() {
         var
            gridViewModel = new GridViewModel(cMerge({
               stickyFields: ['title']
            }, cfg));
         it('current.ladderSupport', function() {
            assert.isTrue(gridViewModel.getCurrent().ladderSupport, 'Incorrect value "ladderSupport" for "current".');
         });
         it('_processLadder', function() {
            var
               expectedLadder = [{
                  ladderValue: 'Хлеб',
                  rowIndex: 0,
                  columnIndex: 0,
                  ladderLength: 4,
                  currentColumn: null
               }, {
                  ladderValue: 'Хлеб',
                  rowIndex: 0,
                  columnIndex: 0,
                  ladderLength: 2,
                  currentColumn: null
               }],
               current = gridViewModel.getCurrent();
            GridViewModel._private.processLadder(gridViewModel, current);
            gridViewModel._ladder.currentColumn = null;
            assert.isTrue(gridViewModel._withLadder, 'Incorrect value "withLadder".');
            assert.deepEqual(expectedLadder[0], gridViewModel._ladder, 'Incorrect value "ladder".');
         });
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
                     width: '1px'
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
               cellClasses: 'controls-Grid__header-cell controls-Grid__cell_spacingRight controls-Grid__row-cell_rowSpacing_L',
               index: 1
            }, gridViewModel.getCurrentHeaderColumn(), 'Incorrect value second call "getCurrentHeaderColumn()".');

            assert.equal(true, gridViewModel.isEndHeaderColumn(), 'Incorrect value "isEndHeaderColumn()" after second call "getCurrentHeaderColumn()".');
            gridViewModel.goToNextHeaderColumn();

            assert.deepEqual({
               column: gridHeader[1],
               cellClasses: 'controls-Grid__header-cell controls-Grid__cell_spacingLeft controls-Grid__cell_spacingRight ' +
                  'controls-Grid__row-cell_rowSpacing_L controls-Grid__header-cell_halign_right',
               index: 2
            }, gridViewModel.getCurrentHeaderColumn(), 'Incorrect value third call "getCurrentHeaderColumn()".');

            assert.equal(true, gridViewModel.isEndHeaderColumn(), 'Incorrect value "isEndHeaderColumn()" after third call "getCurrentHeaderColumn()".');
            gridViewModel.goToNextHeaderColumn();

            assert.deepEqual({
               column: gridHeader[2],
               cellClasses: 'controls-Grid__header-cell controls-Grid__cell_spacingLeft controls-Grid__cell_spacingLastCol_L ' +
                  'controls-Grid__row-cell_rowSpacing_L controls-Grid__header-cell_halign_right',
               index: 3
            }, gridViewModel.getCurrentHeaderColumn(), 'Incorrect value fourth call "getCurrentHeaderColumn()".');

            assert.equal(true, gridViewModel.isEndHeaderColumn(), 'Incorrect value "isEndHeaderColumn()" after fourth call "getCurrentHeaderColumn()".');

            gridViewModel.goToNextHeaderColumn();
            assert.equal(false, gridViewModel.isEndHeaderColumn(), 'Incorrect value "isEndHeaderColumn()" after last call "getCurrentHeaderColumn()".');

            assert.equal(4, gridViewModel._curHeaderColumnIndex, 'Incorrect value "_curHeaderColumnIndex" before "resetHeaderColumns()".');
            gridViewModel.resetHeaderColumns();
            assert.equal(0, gridViewModel._curHeaderColumnIndex, 'Incorrect value "_curHeaderColumnIndex" after "resetHeaderColumns()".');
         });
         it('getResults', function() {
            assert.deepEqual(undefined, gridViewModel.getResults(), 'Incorrect value "getResults()".');
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
               cellClasses: 'controls-Grid__results-cell controls-Grid__cell_spacingRight controls-Grid__row-cell_rowSpacing_L ' +
                  'controls-Grid__header-cell_valign_top',
               index: 1
            }, gridViewModel.getCurrentResultsColumn(), 'Incorrect value second call "getCurrentResultsColumn()".');

            assert.equal(true, gridViewModel.isEndResultsColumn(), 'Incorrect value "isEndResultsColumn()" after second call "getCurrentResultsColumn()".');
            gridViewModel.goToNextResultsColumn();

            assert.deepEqual({
               column: gridColumns[1],
               cellClasses: 'controls-Grid__results-cell controls-Grid__cell_spacingLeft controls-Grid__cell_spacingRight ' +
                  'controls-Grid__row-cell_rowSpacing_L controls-Grid__header-cell_valign_bottom',
               index: 2
            }, gridViewModel.getCurrentResultsColumn(), 'Incorrect value third call "getCurrentResultsColumn()".');

            assert.equal(true, gridViewModel.isEndResultsColumn(), 'Incorrect value "isEndResultsColumn()" after third call "getCurrentResultsColumn()".');
            gridViewModel.goToNextResultsColumn();

            assert.deepEqual({
               column: gridColumns[2],
               cellClasses: 'controls-Grid__results-cell controls-Grid__cell_spacingLeft controls-Grid__cell_spacingLastCol_L ' +
                  'controls-Grid__row-cell_rowSpacing_L controls-Grid__header-cell_valign_middle',
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
               style: ''
            }, gridViewModel.getCurrentColgroupColumn(), 'Incorrect value first call "getCurrentColgroupColumn()".');

            assert.equal(true, gridViewModel.isEndColgroupColumn(), 'Incorrect value "isEndColgroupColumn()" after first call "getCurrentColgroupColumn()".');
            gridViewModel.goToNextColgroupColumn();

            assert.deepEqual({
               column: gridColumns[0],
               index: 1,
               style: 'width: 1fr'
            }, gridViewModel.getCurrentColgroupColumn(), 'Incorrect value second call "getCurrentColgroupColumn()".');

            assert.equal(true, gridViewModel.isEndColgroupColumn(), 'Incorrect value "isEndColgroupColumn()" after second call "getCurrentColgroupColumn()".');
            gridViewModel.goToNextColgroupColumn();

            assert.deepEqual({
               column: gridColumns[1],
               index: 2,
               style: 'width: auto'
            }, gridViewModel.getCurrentColgroupColumn(), 'Incorrect value third call "getCurrentColgroupColumn()".');

            assert.equal(true, gridViewModel.isEndColgroupColumn(), 'Incorrect value "isEndColgroupColumn()" after third call "getCurrentColgroupColumn()".');
            gridViewModel.goToNextColgroupColumn();

            assert.deepEqual({
               column: gridColumns[2],
               index: 3,
               style: 'width: auto'
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
