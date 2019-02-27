import BaseViewModel = require('Controls/List/BaseViewModel');
import ListViewModel = require('Controls/List/ListViewModel');
import LadderWrapper = require('wml!Controls/List/Grid/LadderWrapper');
import ControlsConstants = require('Controls/Constants');
import cClone = require('Core/core-clone');
import Env = require('Env/Env');
import isEqual = require('Core/helpers/Object/isEqual');
import stickyUtil = require('Controls/StickyHeader/Utils');

var
    _private = {
        getPaddingCellClasses: function(params) {
            var
                preparedClasses = '';

            // Колонки
            if (params.multiSelectVisibility ? params.columnIndex > 1 : params.columnIndex > 0) {
                preparedClasses += ' controls-Grid__cell_spacingLeft';
            }
            if (params.columnIndex < params.columns.length - 1) {
                preparedClasses += ' controls-Grid__cell_spacingRight';
            }

            // Отступ для первой колонки. Если режим мультиселект, то отступ обеспечивается чекбоксом.
            if (params.columnIndex === 0 && !params.multiSelectVisibility) {
                preparedClasses += ' controls-Grid__cell_spacingFirstCol_' + (params.itemPadding.left || 'default').toLowerCase();
            }

            // Стиль колонки
            preparedClasses += ' controls-Grid__cell_' + (params.style || 'default');

            // Отступ для последней колонки
            if (params.columnIndex === params.columns.length - 1) {
                preparedClasses += ' controls-Grid__cell_spacingLastCol_' + (params.itemPadding.right || 'default').toLowerCase();
            }
            if (!params.isHeader) {
                preparedClasses += ' controls-Grid__row-cell_rowSpacingTop_' + (params.itemPadding.top || 'default').toLowerCase();
                preparedClasses += ' controls-Grid__row-cell_rowSpacingBottom_' + (params.itemPadding.bottom || 'default').toLowerCase();
            }


            return preparedClasses;
        },

        prepareRowSeparatorClasses: function(rowSeparatorVisibility, rowIndex, rowCount) {
            var
                result = '';
            if (rowSeparatorVisibility) {
                if (rowIndex === 0) {
                    result += ' controls-Grid__row-cell_firstRow';
                    result += ' controls-Grid__row-cell_withRowSeparator_firstRow';
                } else {
                    result += ' controls-Grid__row-cell_withRowSeparator';
                }
                if (rowIndex === rowCount - 1) {
                    result += ' controls-Grid__row-cell_lastRow';
                    result += ' controls-Grid__row-cell_withRowSeparator_lastRow';
                }
            } else {
                result += ' controls-Grid__row-cell_withoutRowSeparator';
            }
            return result;
        },

        getItemColumnCellClasses: function(current) {
            var cellClasses = 'controls-Grid__row-cell' + (current.isEditing ? ' controls-Grid__row-cell-background-editing' : ' controls-Grid__row-cell-background-hover');
            var currentStyle = current.style || 'default';

            cellClasses += _private.prepareRowSeparatorClasses(current.rowSeparatorVisibility, current.index, current.dispItem.getOwner().getCount());

            // Если включен множественный выбор и рендерится первая колонка с чекбоксом
            if (current.multiSelectVisibility !== 'hidden' && current.columnIndex === 0) {
                cellClasses += ' controls-Grid__row-cell-checkbox';
            } else {
                cellClasses += _private.getPaddingCellClasses({
                    columns: current.columns,
                    style: current.style,
                    columnIndex: current.columnIndex,
                    multiSelectVisibility: current.multiSelectVisibility !== 'hidden',
                    itemPadding: current.itemPadding
                });
            }

            if (current.isSelected) {
                cellClasses += ' controls-Grid__row-cell_selected' + ' controls-Grid__row-cell_selected-' + currentStyle;

                if (current.columnIndex === 0) {
                    cellClasses += ' controls-Grid__row-cell_selected__first-' + currentStyle;
                }
                if (current.columnIndex === current.getLastColumnIndex()) {
                    cellClasses += ' controls-Grid__row-cell_selected__last' + ' controls-Grid__row-cell_selected__last-' + currentStyle;
                }
            } else if (current.columnIndex === current.getLastColumnIndex()) {
                cellClasses += ' controls-Grid__row-cell__last' + ' controls-Grid__row-cell__last-' + currentStyle;
            }

            return cellClasses;
        },
        getStickyColumn: function(cfg) {
            var
                result;
            if (cfg.stickyColumn) {
                result = {
                    index: cfg.stickyColumn.index,
                    property: cfg.stickyColumn.property
                };
            } else if (cfg.columns) {
                for (var idx = 0; idx < cfg.columns.length; idx++) {
                    if (cfg.columns[idx].stickyProperty) {
                        result = {
                            index: idx,
                            property: cfg.columns[idx].stickyProperty
                        };
                        break;
                    }
                }
            }
            return result;
        },
        prepareLadder: function(self) {
            var
                fIdx, idx, item, prevItem,
                ladderProperties = self._options.ladderProperties,
                stickyColumn = _private.getStickyColumn(self._options),
                supportLadder = !!(ladderProperties && ladderProperties.length),
                supportSticky = !!stickyColumn,
                ladder = {}, ladderState = {}, stickyLadder = {},
                stickyLadderState = {
                    ladderLength: 1
                };

            if (!supportLadder && !supportSticky) {
                return {};
            }

            function processLadder(params) {
                var
                    value = params.value,
                    prevValue = params.prevValue,
                    state = params.state;

                // isEqual works with any types
                if (isEqual(value, prevValue)) {
                    state.ladderLength++;
                } else {
                    params.ladder.ladderLength = state.ladderLength;
                    state.ladderLength = 1;
                }
            }

            function processStickyLadder(params) {
                processLadder(params);
                if (params.ladder.ladderLength && params.ladder.ladderLength > 1 && !Env.detection.isNotFullGridSupport) {
                    params.ladder.headingStyle = 'grid-area: ' +
                        (params.itemIndex + 1) + ' / ' +
                        '1 / ' +
                        'span ' + params.ladder.ladderLength + ' / ' +
                        'span 1;';
                }
            }

            if (supportLadder) {
                for (fIdx = 0; fIdx < ladderProperties.length; fIdx++) {
                    ladderState[ladderProperties[fIdx]] = {
                        ladderLength: 1
                    };
                }
            }

            for (idx = self._model.getStopIndex() - 1; idx >= self._model.getStartIndex(); idx--) {
                item = self._model.getDisplay().at(idx).getContents();
                prevItem = idx - 1 >= 0 ? self._model.getDisplay().at(idx - 1).getContents() : null;

                if (supportLadder) {
                    ladder[idx] = {};
                    for (fIdx = 0; fIdx < ladderProperties.length; fIdx++) {
                        ladder[idx][ladderProperties[fIdx]] = {};
                        processLadder({
                            itemIndex: idx,
                            value: item.get ? item.get(ladderProperties[fIdx]) : undefined,
                            prevValue: prevItem && prevItem.get ? prevItem.get(ladderProperties[fIdx]) : undefined,
                            state: ladderState[ladderProperties[fIdx]],
                            ladder: ladder[idx][ladderProperties[fIdx]]
                        });
                    }
                }

                if (supportSticky) {
                    stickyLadder[idx] = {};
                    processStickyLadder({
                        itemIndex: idx,
                        value: item.get(stickyColumn.property),
                        prevValue: prevItem ? prevItem.get(stickyColumn.property) : undefined,
                        state: stickyLadderState,
                        ladder: stickyLadder[idx]
                    });
                }
            }
            return {
                ladder: ladder,
                stickyLadder: stickyLadder
            };
        },

        getSortingDirectionByProp: function(sorting, prop) {
            var sortingDirection;

            if (sorting) {
                sorting.forEach(function(elem) {
                    if (elem[prop]) {
                        sortingDirection = elem[prop];
                    }
                });
            }

            return sortingDirection;
        },

        isNeedToHighlight: function(item, dispProp, searchValue) {
            var itemValue = item.get(dispProp);
            return itemValue && searchValue && String(itemValue).toLowerCase().indexOf(searchValue.toLowerCase()) !== -1;
        }
    },

    GridViewModel = BaseViewModel.extend({
        _model: null,
        _columnTemplate: null,

        _columns: [],
        _curColumnIndex: 0,

        _headerColumns: [],
        _curHeaderColumnIndex: 0,

        _resultsColumns: [],
        _curResultsColumnIndex: 0,

        _colgroupColumns: [],
        _curColgroupColumnIndex: 0,

        _ladder: null,

        constructor: function(cfg) {
            this._options = cfg;
            GridViewModel.superclass.constructor.apply(this, arguments);
            this._model = this._createModel(cfg);
            this._onListChangeFn = function(event, changesType) {
                this._ladder = _private.prepareLadder(this);
                this._nextVersion();
                this._notify('onListChange', changesType);
            }.bind(this);
            this._onMarkedKeyChangedFn = function(event, key) {
                this._notify('onMarkedKeyChanged', key);
            }.bind(this);
            this._onGroupsExpandChangeFn = function(event, changes) {
                this._notify('onGroupsExpandChange', changes);
            }.bind(this);
            this._onCollectionChangeFn = function() {
                this._notify.apply(this, ['onCollectionChange'].concat(Array.prototype.slice.call(arguments, 1)));
            }.bind(this);
            this._model.subscribe('onListChange', this._onListChangeFn);
            this._model.subscribe('onMarkedKeyChanged', this._onMarkedKeyChangedFn);
            this._model.subscribe('onGroupsExpandChange', this._onGroupsExpandChangeFn);
            this._model.subscribe('onCollectionChange', this._onCollectionChangeFn);
            this._ladder = _private.prepareLadder(this);
            this._setColumns(this._options.columns);
            this._setHeader(this._options.header);
        },

        _nextModelVersion: function(notUpdatePrefixItemVersion) {
            this._model.nextModelVersion(notUpdatePrefixItemVersion);
        },

        _prepareCrossBrowserColumn: function(column, isNotFullGridSupport) {
            var
                result = cClone(column);
            if (isNotFullGridSupport) {
                if (result.width === '1fr') {
                    result.width = 'auto';
                }
            }
            return result;
        },

        _prepareColumns: function(columns) {
            var
                result = [];
            for (var i = 0; i < columns.length; i++) {
                result.push(this._prepareCrossBrowserColumn(columns[i], Env.detection.isNotFullGridSupport));
            }
            return result;
        },

        _createModel: function(cfg) {
            return new ListViewModel(cfg);
        },

        setColumnTemplate: function(columnTpl) {
            this._columnTemplate = columnTpl;
        },

        // -----------------------------------------------------------
        // ---------------------- headerColumns ----------------------
        // -----------------------------------------------------------

        getHeader: function() {
            return this._header;
        },

        _setHeader: function(columns) {
            this._header = columns;
            this._prepareHeaderColumns(this._header, this._options.multiSelectVisibility !== 'hidden');
        },

        setHeader: function(columns) {
            this._setHeader(columns);
            this._nextModelVersion();
        },

        _prepareHeaderColumns: function(columns, multiSelectVisibility) {
            if (multiSelectVisibility) {
                this._headerColumns = [{}].concat(columns);
            } else {
                this._headerColumns = columns;
            }
            this.resetHeaderColumns();
        },

        resetHeaderColumns: function() {
            this._curHeaderColumnIndex = 0;
        },

        isNotFullGridSupport: function() {
            return Env.detection.isNotFullGridSupport;
        },

        isStickyHeader: function() {
            return this._options.stickyHeader;
        },

        getCurrentHeaderColumn: function() {
            var
                columnIndex = this._curHeaderColumnIndex,
                cellClasses = 'controls-Grid__header-cell',
                headerColumn = {
                    column: this._headerColumns[this._curHeaderColumnIndex],
                    index: columnIndex
                };
            if (!stickyUtil.isStickySupport()) {
                cellClasses = cellClasses + ' controls-Grid__header-cell_static';
            }

            // Если включен множественный выбор и рендерится первая колонка с чекбоксом
            if (this._options.multiSelectVisibility !== 'hidden' && columnIndex === 0) {
                cellClasses += ' controls-Grid__header-cell-checkbox';
            } else {
                cellClasses += _private.getPaddingCellClasses({
                    style: this._options.style,
                    columns: this._headerColumns,
                    columnIndex: columnIndex,
                    multiSelectVisibility: this._options.multiSelectVisibility !== 'hidden',
                    itemPadding: this._model.getItemPadding(),
                    isHeader: true
                });
            }
            if (headerColumn.column.align) {
                cellClasses += ' controls-Grid__header-cell_halign_' + headerColumn.column.align;
            }
            if (headerColumn.column.valign) {
                cellClasses += ' controls-Grid__header-cell_valign_' + headerColumn.column.valign;
            }
            headerColumn.cellClasses = cellClasses;

            if (headerColumn.column.sortingProperty) {
                headerColumn.sortingDirection = _private.getSortingDirectionByProp(this.getSorting(), headerColumn.column.sortingProperty);
            }

            return headerColumn;
        },

        goToNextHeaderColumn: function() {
            this._curHeaderColumnIndex++;
        },

        isEndHeaderColumn: function() {
            return this._curHeaderColumnIndex < this._headerColumns.length;
        },

        // -----------------------------------------------------------
        // ---------------------- resultColumns ----------------------
        // -----------------------------------------------------------

        getResultsPosition: function() {
            if (this._options.results) {
                return this._options.results.position;
            }
            return this._options.resultsPosition;
        },

        getResultsTemplate: function() {
            if (this._options.results) {
                return this._options.results.template;
            }
            return this._options.resultsTemplate;
        },

        _prepareResultsColumns: function(columns, multiSelectVisibility) {
            if (multiSelectVisibility) {
                this._resultsColumns = [{}].concat(columns);
            } else {
                this._resultsColumns = columns;
            }
            this.resetResultsColumns();
        },

        resetResultsColumns: function() {
            this._curResultsColumnIndex = 0;
        },

        getCurrentResultsColumn: function() {
            var
                columnIndex = this._curResultsColumnIndex,
                cellClasses = 'controls-Grid__results-cell';

            // Если включен множественный выбор и рендерится первая колонка с чекбоксом
            if ((this._options.multiSelectVisibility !== 'hidden') && columnIndex === 0) {
                cellClasses += ' controls-Grid__results-cell-checkbox';
            } else {
                cellClasses += _private.getPaddingCellClasses({
                    style: this._options.style,
                    columns: this._resultsColumns,
                    columnIndex: columnIndex,
                    multiSelectVisibility: this._options.multiSelectVisibility !== 'hidden',
                    itemPadding: this._model.getItemPadding()
                });
            }

            return {
                column: this._resultsColumns[columnIndex],
                cellClasses: cellClasses,
                index: columnIndex
            };
        },

        goToNextResultsColumn: function() {
            this._curResultsColumnIndex++;
        },

        isEndResultsColumn: function() {
            return this._curResultsColumnIndex < this._resultsColumns.length;
        },

        // -----------------------------------------------------------
        // ------------------------ colgroup -------------------------
        // -----------------------------------------------------------

        _prepareColgroupColumns: function(columns, multiSelectVisibility) {
            if (multiSelectVisibility) {
                this._colgroupColumns = [{}].concat(columns);
            } else {
                this._colgroupColumns = columns;
            }
            this.resetColgroupColumns();
        },

        getCurrentColgroupColumn: function() {
            var
                column = this._colgroupColumns[this._curColgroupColumnIndex];
            return {
                column: column,
                index: this._curColgroupColumnIndex,
                multiSelectVisibility: this._options.multiSelectVisibility !== 'hidden',
                style: typeof column.width !== 'undefined' ? 'width: ' + column.width : ''
            };
        },

        resetColgroupColumns: function() {
            this._curColgroupColumnIndex = 0;
        },

        isEndColgroupColumn: function() {
            return this._curColgroupColumnIndex < this._colgroupColumns.length;
        },

        goToNextColgroupColumn: function() {
            this._curColgroupColumnIndex++;
        },

        // -----------------------------------------------------------
        // -------------------------- items --------------------------
        // -----------------------------------------------------------

        _setColumns: function(columns) {
            this._columns = this._prepareColumns(columns);
            this._ladder = _private.prepareLadder(this);
            this._prepareResultsColumns(this._columns, this._options.multiSelectVisibility !== 'hidden');
            this._prepareColgroupColumns(this._columns, this._options.multiSelectVisibility !== 'hidden');
        },

        setColumns: function(columns) {
            this._setColumns(columns);
            this._nextModelVersion();
        },

        setLeftSpacing: function(leftSpacing) {
            //TODO: Выпилить в 19.200 https://online.sbis.ru/opendoc.html?guid=837b45bc-b1f0-4bd2-96de-faedf56bc2f6
            this._model.setLeftSpacing(leftSpacing);
        },

        setRightSpacing: function(rightSpacing) {
            //TODO: Выпилить в 19.200 https://online.sbis.ru/opendoc.html?guid=837b45bc-b1f0-4bd2-96de-faedf56bc2f6
            this._model.setRightSpacing(rightSpacing);
        },

        setLeftPadding: function(leftPadding) {
            //TODO: Выпилить в 19.200 https://online.sbis.ru/opendoc.html?guid=837b45bc-b1f0-4bd2-96de-faedf56bc2f6
            this._model.setLeftPadding(leftPadding);
        },

        setRightPadding: function(rightPadding) {
            //TODO: Выпилить в 19.200 https://online.sbis.ru/opendoc.html?guid=837b45bc-b1f0-4bd2-96de-faedf56bc2f6
            this._model.setRightPadding(rightPadding);
        },

        setRowSpacing: function(rowSpacing) {
            //TODO: Выпилить в 19.200 https://online.sbis.ru/opendoc.html?guid=837b45bc-b1f0-4bd2-96de-faedf56bc2f6
            this._model.setRowSpacing(rowSpacing);
        },

        getColumns: function() {
            return this._columns;
        },

        getMultiSelectVisibility: function() {
            return this._model.getMultiSelectVisibility();
        },

        setMultiSelectVisibility: function(multiSelectVisibility) {
            var
                hasMultiSelect = multiSelectVisibility !== 'hidden';
            this._model.setMultiSelectVisibility(multiSelectVisibility);
            this._prepareColgroupColumns(this._columns, hasMultiSelect);
            this._prepareHeaderColumns(this._header, hasMultiSelect);
            this._prepareResultsColumns(this._columns, hasMultiSelect);
        },

        getItemById: function(id, keyProperty) {
            return this._model.getItemById(id, keyProperty);
        },

        setMarkedKey: function(key) {
            this._model.setMarkedKey(key);
        },

        setMarkerVisibility: function(markerVisibility) {
            this._model.setMarkerVisibility(markerVisibility);
        },

        getMarkedKey: function() {
            return this._model.getMarkedKey();
        },
        getFirstItemKey: function() {
            return this._model.getFirstItemKey.apply(this._model, arguments);
        },
        getIndexByKey: function() {
            return this._model.getIndexByKey.apply(this._model, arguments);
        },

        getSelectionStatus: function() {
            return this._model.getSelectionStatus.apply(this._model, arguments);
        },

        getNextItemKey: function() {
            return this._model.getNextItemKey.apply(this._model, arguments);
        },

        setIndexes: function(startIndex, stopIndex) {
            this._model.setIndexes(startIndex, stopIndex);
        },

        getPreviousItemKey: function() {
            return this._model.getPreviousItemKey.apply(this._model, arguments);
        },

        setSorting: function(sorting) {
            this._model.setSorting(sorting);
        },

        setSearchValue: function(value) {
            this._model.setSearchValue(value);
        },

        getSorting: function() {
            return this._model.getSorting();
        },

        setItemPadding: function(itemPadding) {
            this._model.setItemPadding(itemPadding);
        },

        getSwipeItem: function() {
            return this._model.getSwipeItem();
        },

        setCollapsedGroups: function(collapsedGroups) {
            this._model.setCollapsedGroups(collapsedGroups);
        },

        reset: function() {
            this._model.reset();
        },

        isEnd: function() {
            return this._model.isEnd();
        },

        goToNext: function() {
            this._model.goToNext();
        },

        getItemDataByItem: function(dispItem) {
            var
                self = this,
                stickyColumn = _private.getStickyColumn(this._options),
                current = this._model.getItemDataByItem(dispItem),
                isStickedColumn;

            //TODO: Выпилить в 19.200 или если закрыта -> https://online.sbis.ru/opendoc.html?guid=837b45bc-b1f0-4bd2-96de-faedf56bc2f6
            current.rowSpacing = this._options.rowSpacing;

            current.isNotFullGridSupport = Env.detection.isNotFullGridSupport;
            current.style = this._options.style;

            if (current.multiSelectVisibility !== 'hidden') {
                current.columns = [{}].concat(this._columns);
            } else {
                current.columns = this._columns;
            }

            if (stickyColumn && !Env.detection.isNotFullGridSupport) {
                current.styleLadderHeading = self._ladder.stickyLadder[current.index].headingStyle;
                current.stickyColumnIndex = stickyColumn.index;
            }

            if (this._options.groupMethod || this._options.groupingKeyCallback) {
                if (current.item === ControlsConstants.view.hiddenGroup || !current.item.get) {
                    current.groupResultsSpacingClass = ' controls-Grid__cell_spacingLastCol_' + ((current.itemPadding && current.itemPadding.right) || current.rightSpacing || 'default').toLowerCase();
                    return current;
                }
            }

            current.rowSeparatorVisibility = this._options.showRowSeparator !== undefined ? this._options.showRowSeparator : this._options.rowSeparatorVisibility;

            current.columnIndex = 0;

            current.getItemColumnCellClasses = _private.getItemColumnCellClasses;

            current.resetColumnIndex = function() {
                current.columnIndex = 0;
            };
            current.goToNextColumn = function() {
                current.columnIndex++;
            };
            current.getLastColumnIndex = function() {
                return current.columns.length - 1;
            };
            current.getCurrentColumn = function() {
                var
                    currentColumn = {
                        item: current.item,
                        style: current.style,
                        dispItem: current.dispItem,
                        keyProperty: current.keyProperty,
                        displayProperty: current.displayProperty,
                        index: current.index,
                        key: current.key,
                        getPropValue: current.getPropValue,
                        isEditing: current.isEditing,
                        isActive: current.isActive
                    };
                currentColumn.columnIndex = current.columnIndex;
                currentColumn.cellClasses = current.getItemColumnCellClasses(current, currentColumn.columnIndex);
                currentColumn.column = current.columns[current.columnIndex];
                currentColumn.template = currentColumn.column.template ? currentColumn.column.template : self._columnTemplate;
                if (self._options.ladderProperties && self._options.ladderProperties.length) {
                    currentColumn.ladder = self._ladder.ladder[current.index];
                    currentColumn.ladderWrapper = LadderWrapper;
                }
                if (current.item.get) {
                    currentColumn.column.needSearchHighlight = !!_private.isNeedToHighlight(current.item, currentColumn.column.displayProperty, current.searchValue);
                    currentColumn.searchValue = current.searchValue;
                }
                if (stickyColumn) {
                    isStickedColumn = stickyColumn.index === (current.multiSelectVisibility !== 'hidden' ? currentColumn.columnIndex + 1 : currentColumn.columnIndex);
                    if (Env.detection.isNotFullGridSupport) {
                        currentColumn.hiddenForLadder = isStickedColumn && !self._ladder.stickyLadder[current.index].ladderLength;
                    } else {
                        currentColumn.hiddenForLadder = isStickedColumn && self._ladder.stickyLadder[current.index].ladderLength !== 1;
                        currentColumn.styleForLadder = currentColumn.cellStyleForLadder = 'grid-area: ' +
                            (current.index + 1) + ' / ' +
                            (currentColumn.columnIndex + 1) + ' / ' +
                            'span 1 / ' +
                            'span 1;';
                    }
                }
                return currentColumn;
            };
            return current;
        },

        getCurrent: function() {
            var dispItem = this._model._display.at(this._model._curIndex);
            return this.getItemDataByItem(dispItem);
        },

        toggleGroup: function(group, state) {
            this._model.toggleGroup(group, state);
        },

        getNext: function() {
            return this._model.getNext();
        },

        isLast: function() {
            return this._model.isLast();
        },

        setStickyColumn: function(stickyColumn) {
            this._options.stickyColumn = stickyColumn;
            this._ladder = _private.prepareLadder(this);
            this._nextModelVersion();
        },

        setLadderProperties: function(ladderProperties) {
            this._options.ladderProperties = ladderProperties;
            this._ladder = _private.prepareLadder(this);
            this._nextModelVersion();
        },

        updateIndexes: function(startIndex, stopIndex) {
            this._model.updateIndexes(startIndex, stopIndex);
        },

        setItems: function(items) {
            this._model.setItems(items);
        },

        setItemTemplateProperty: function(itemTemplateProperty) {
            this._model.setItemTemplateProperty(itemTemplateProperty);
        },

        getItems: function() {
            return this._model.getItems();
        },

        setActiveItem: function(itemData) {
            this._model.setActiveItem(itemData);
        },

        mergeItems: function(items) {
            this._model.mergeItems(items);
        },

        appendItems: function(items) {
            this._model.appendItems(items);
        },

        prependItems: function(items) {
            this._model.prependItems(items);
        },

        setItemActions: function(item, actions) {
            this._model.setItemActions(item, actions);
        },

        nextModelVersion: function() {
            this._model.nextModelVersion.apply(this._model, arguments);
        },

        _setEditingItemData: function(itemData) {
            this._model._setEditingItemData(itemData);
        },

        setItemActionVisibilityCallback: function(callback) {
            this._model.setItemActionVisibilityCallback(callback);
        },

        _prepareDisplayItemForAdd: function(item) {
            return this._model._prepareDisplayItemForAdd(item);
        },

        getCurrentIndex: function() {
            return this._model.getCurrentIndex();
        },

        getItemActions: function(item) {
            return this._model.getItemActions(item);
        },

        getIndexBySourceItem: function(item) {
            return this._model.getIndexBySourceItem(item);
        },

        at: function(index) {
            return this._model.at(index);
        },

        getCount: function() {
            return this._model.getCount();
        },

        setSwipeItem: function(itemData) {
            this._model.setSwipeItem(itemData);
        },

        setRightSwipedItem: function(itemData) {
            this._model.setRightSwipedItem(itemData);
        },

        setShowRowSeparator: function(showRowSeparator) {
            this._options.showRowSeparator = showRowSeparator;
            this._nextModelVersion();
        },

        setRowSeparatorVisibility: function(rowSeparatorVisibility) {
            this._options.rowSeparatorVisibility = rowSeparatorVisibility;
            this._nextModelVersion();
        },

        updateSelection: function(selectedKeys) {
            this._model.updateSelection(selectedKeys);
        },

        setDragTargetPosition: function(position) {
            this._model.setDragTargetPosition(position);
        },

        getDragTargetPosition: function() {
            return this._model.getDragTargetPosition();
        },

        setDragEntity: function(entity) {
            this._model.setDragEntity(entity);
        },

        getDragEntity: function() {
            return this._model.getDragEntity();
        },

        setDragItemData: function(itemData) {
            this._model.setDragItemData(itemData);
        },

        getDragItemData: function() {
            return this._model.getDragItemData();
        },

        calculateDragTargetPosition: function(targetData, position) {
            return this._model.calculateDragTargetPosition(targetData, position);
        },

        getActiveItem: function() {
            return this._model.getActiveItem();
        },

        getChildren: function() {
            return this._model.getChildren.apply(this._model, arguments);
        },

        destroy: function() {
            this._model.unsubscribe('onListChange', this._onListChangeFn);
            this._model.unsubscribe('onMarkedKeyChanged', this._onMarkedKeyChangedFn);
            this._model.unsubscribe('onGroupsExpandChange', this._onGroupsExpandChangeFn);
            this._model.unsubscribe('onCollectionChange', this._onCollectionChangeFn);
            this._model.destroy();
            GridViewModel.superclass.destroy.apply(this, arguments);
        }
    });

GridViewModel._private = _private;

export = GridViewModel;
