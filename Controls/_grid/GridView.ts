import {TemplateFunction} from 'UI/Base';
import {ListView} from 'Controls/list';
import * as GridLayoutUtil from 'Controls/_grid/utils/GridLayoutUtil';
import * as GridIsEqualUtil from 'Controls/_grid/utils/GridIsEqualUtil';
import {TouchContextField as isTouch} from 'Controls/context';
import tmplNotify = require('Controls/Utils/tmplNotify');
import {CssClassList} from '../Utils/CssClassList';
import getDimensions = require("Controls/Utils/getDimensions");

import * as GridViewTemplateChooser from 'wml!Controls/_grid/GridViewTemplateChooser';
import * as GridLayout from 'wml!Controls/_grid/layout/grid/GridView';
import * as TableLayout from 'wml!Controls/_grid/layout/table/GridView';

import * as GridHeader from 'wml!Controls/_grid/layout/grid/Header';
import * as TableHeader from 'wml!Controls/_grid/layout/table/Header';
import * as HeaderContentTpl from 'wml!Controls/_grid/HeaderContent';

import * as GridResults from 'wml!Controls/_grid/layout/grid/Results';
import * as TableResults from 'wml!Controls/_grid/layout/table/Results';

import * as DefaultItemTpl from 'wml!Controls/_grid/ItemTemplateResolver';
import * as GridItemTemplate from 'wml!Controls/_grid/layout/grid/Item';
import * as TableItemTemplate from 'wml!Controls/_grid/layout/table/Item';

import * as ColumnTpl from 'wml!Controls/_grid/Column';
import * as GroupTemplate from 'wml!Controls/_grid/GroupTemplate';

import {Logger} from 'UI/Utils';
import { shouldAddActionsCell } from 'Controls/_grid/utils/GridColumnScrollUtil';

var
    _private = {
        checkDeprecated: function(cfg, self) {
            // TODO: https://online.sbis.ru/opendoc.html?guid=837b45bc-b1f0-4bd2-96de-faedf56bc2f6
            if (cfg.showRowSeparator !== undefined) {
                Logger.warn('IGridControl: Option "showRowSeparator" is deprecated and removed in 19.200. Use option "rowSeparatorVisibility".', self);
            }
            if (cfg.stickyColumn !== undefined) {
                Logger.warn('IGridControl: Option "stickyColumn" is deprecated and removed in 19.200. Use "stickyProperty" option in the column configuration when setting up the columns.', self);
            }
        },

        getGridTemplateColumns(self, columns: Array<{width?: string}>, hasMultiSelect: boolean): string {
            // TODO: Удалить после полного перехода на table-layout. По задаче https://online.sbis.ru/doc/5d2c482e-2b2f-417b-98d2-8364c454e635
            let columnsWidths: string[] = hasMultiSelect ? ['max-content'] : [];
            columnsWidths = columnsWidths.concat(columns.map(((column) => column.width || GridLayoutUtil.getDefaultColumnWidth())));
            if (shouldAddActionsCell({
                hasColumnScroll: self._options.columnScroll,
                shouldUseTableLayout: !GridLayoutUtil.isFullGridSupport(),
                disableCellStyles: self._options.disableColumnScrollCellStyles
            })) {
                columnsWidths = columnsWidths.concat(['0px']);
            }

            return GridLayoutUtil.getTemplateColumnsStyle(columnsWidths);
        },

        setBaseTemplates(self: GridView, isFullGridSupport: boolean): void {
            self._gridTemplate = isFullGridSupport ? GridLayout : TableLayout;
            self._baseHeaderTemplate = isFullGridSupport ? GridHeader : TableHeader;
            self._baseResultsTemplate = isFullGridSupport ? GridResults : TableResults;
        },

        _resetScroll(self): void {
            self._notify('doScroll', ['top'], { bubbling: true });
        },

        getClickedColumnIndex(self,  e): number {
            const gridCells = e.target.closest('.controls-Grid__row').querySelectorAll('.controls-Grid__row-cell');
            const currentCell = e.target.closest('.controls-Grid__row-cell');
            const multiSelectOffset = self._options.multiSelectVisibility !== 'hidden' ? 1 : 0;
            return Array.prototype.slice.call(gridCells).indexOf(currentCell) - multiSelectOffset;
        },

        // uDimensions for unit tests
        getMultiHeaderHeight(headerContainer: HTMLElement, uDimensions: Function = getDimensions): number {
            const cells = headerContainer.children;
            if (cells.length === 0) {
                return 0;
            }
            const bounds = {
                min: Number.MAX_VALUE,
                max: Number.MIN_VALUE
            };
            Array.prototype.forEach.call(cells, (cell) => {
                const dimensions = uDimensions(cell);
                bounds.min = bounds.min < dimensions.top ? bounds.min : dimensions.top;
                bounds.max = bounds.max > dimensions.bottom ? bounds.max : dimensions.bottom
            });
            return bounds.max - bounds.min;
        }
    },
    GridView = ListView.extend({

        /* Base templates */
        _template: GridViewTemplateChooser,
        _gridTemplate: null,
        _baseHeaderTemplate: null,
        _baseResultsTemplate: null,

        /* Custom templates */
        _resultsTemplate: null,

        _groupTemplate: GroupTemplate,
        _defaultItemTemplate: DefaultItemTpl,
        _headerContentTemplate: HeaderContentTpl,

        _notifyHandler: tmplNotify,

        _beforeMount(cfg) {
            _private.checkDeprecated(cfg, this);
            _private.setBaseTemplates(this, GridLayoutUtil.isFullGridSupport());
            const resultSuper = GridView.superclass._beforeMount.apply(this, arguments);
            this._listModel.setBaseItemTemplateResolver(this._resolveBaseItemTemplate.bind(this));
            this._listModel.setColumnTemplate(ColumnTpl);
            this._setResultsTemplate(cfg);
            this._listModel.headerInEmptyListVisible = cfg.headerInEmptyListVisible;

            return resultSuper;
        },

        _beforeUpdate(newCfg) {
            GridView.superclass._beforeUpdate.apply(this, arguments);
            if (this._options.resultsPosition !== newCfg.resultsPosition) {
                if (this._listModel) {
                    this._listModel.setResultsPosition(newCfg.resultsPosition);
                }
            }
            if (this._options.theme !== newCfg.theme) {
                this._listModel.setTheme(newCfg.theme);
            }
            // todo removed by task https://online.sbis.ru/opendoc.html?guid=728d200e-ff93-4701-832c-93aad5600ced
            if (!GridIsEqualUtil.isEqualWithSkip(this._options.columns, newCfg.columns, { template: true, resultTemplate: true })) {
                this._listModel.setColumns(newCfg.columns);
            }
            if (!GridIsEqualUtil.isEqualWithSkip(this._options.header, newCfg.header, { template: true })) {
                if (this._listModel._isMultiHeader) {
                    _private._resetScroll(this);
                }
                this._listModel.setHeader(newCfg.header);
            }
            if (this._options.stickyColumn !== newCfg.stickyColumn) {
                this._listModel.setStickyColumn(newCfg.stickyColumn);
            }
            if (this._options.ladderProperties !== newCfg.ladderProperties) {
                this._listModel.setLadderProperties(newCfg.ladderProperties);
            }
            if (this._options.rowSeparatorVisibility !== newCfg.rowSeparatorVisibility) {
                this._listModel.setRowSeparatorVisibility(newCfg.rowSeparatorVisibility);
            }
            if (this._options.showRowSeparator !== newCfg.showRowSeparator) {
                this._listModel.setShowRowSeparator(newCfg.showRowSeparator);
            }
            if (this._options.stickyColumnsCount !== newCfg.stickyColumnsCount) {
                this._listModel.setStickyColumnsCount(newCfg.stickyColumnsCount);
            }
            if (this._options.resultsTemplate !== newCfg.resultsTemplate) {
                this._resultsTemplate = newCfg.resultsTemplate || this._baseResultsTemplate;
            }
            if (this._options.columnScroll !== newCfg.columnScroll) {
                this._listModel.setColumnScroll(newCfg.columnScroll);
            }
        },

        _calcFooterPaddingClass(): string {
            let leftPadding;
            if (this._options.multiSelectVisibility !== 'hidden') {
                leftPadding = 'withCheckboxes';
            } else {
                leftPadding = (this._options.itemPadding && this._options.itemPadding.left || 'default').toLowerCase();
            }

            return CssClassList
                .add('controls-GridView__footer')
                .add(`controls-GridView__footer__paddingLeft_${leftPadding}_theme-${this._options.theme}`)
                .compile();
        },

        resizeNotifyOnListChanged(): void {
            GridView.superclass.resizeNotifyOnListChanged.apply(this, arguments);
            if (this._children.columnScroll) {
                this._children.columnScroll._resizeHandler();

                // TODO: KINGO
                // перерисовка тени после обновления размеров в columnScroll происходит уже в следующую отрисовку.
                // из-за этого, между обновлениями, тень от скролла рисуется поверх колонок.
                // Чтобы тень заняла акуальную позицию раньше, нужно вручную установить стиль элементу
                this._children.columnScroll.updateShadowStyle();
            }
        },

        _resolveItemTemplate(options): TemplateFunction {
            return options.itemTemplate || this._resolveBaseItemTemplate();
        },

        _resolveBaseItemTemplate(): TemplateFunction {
            return GridLayoutUtil.isFullGridSupport() ? GridItemTemplate : TableItemTemplate;
        },

        getHeaderHeight(): number {
            const headerContainer = this._children.header;
            if (!headerContainer) {
                return 0;
            }
            return this._listModel._isMultiHeader ? _private.getMultiHeaderHeight(headerContainer) : headerContainer.getBoundingClientRect().height;
        },

        getResultsHeight(): number {
            return this._children.results ? getDimensions(this._children.results).height : 0;
        },

        _getGridViewClasses(): string {
            const classes = new CssClassList();
            classes
                .add('controls-Grid')
                .add(`controls-Grid_${this._options.style}_theme-${this._options.theme}`);

            if (!GridLayoutUtil.isFullGridSupport()) {
                const isFixedLayout = this._listModel.isFixedLayout();
                classes
                    .add('controls-Grid_table-layout')
                    .add('controls-Grid_table-layout_fixed', isFixedLayout)
                    .add('controls-Grid_table-layout_auto', !isFixedLayout);
            }
            return classes.compile();
        },

        _getGridViewStyles(): string {
            let styles = '';
            if (GridLayoutUtil.isFullGridSupport()) {
                const hasMultiSelect = this._options.multiSelectVisibility !== 'hidden';
                styles += _private.getGridTemplateColumns(this, this._options.columns, hasMultiSelect);
            }
            return styles;
        },

        _setResultsTemplate(options): void {
            if (options.results && options.results.template) {
                this._resultsTemplate = options.results.template;
            } else {
                this._resultsTemplate =  options.resultsTemplate || this._baseResultsTemplate;
            }
        },

        _onItemClick(e, dispItem): void {
            e.stopImmediatePropagation();
            // Флаг preventItemEvent выставлен, если нужно предотвратить возникновение
            // событий itemClick, itemMouseDown по нативному клику, но по какой-то причине
            // невозможно остановить всплытие события через stopPropagation
            // TODO: Убрать, preventItemEvent когда это больше не понадобится
            // https://online.sbis.ru/doc/cefa8cd9-6a81-47cf-b642-068f9b3898b7
            if (!e.preventItemEvent) {
                const item = dispItem.getContents();
                this._notify('itemClick', [item, e, _private.getClickedColumnIndex(this, e)], {bubbling: true});
            }
        },

        _onEditArrowClick(e, item): void {
            this._notify('editArrowClick', [item]);

            // we do not need to fire itemClick on clicking on editArrow
            e.stopPropagation();
        },

        _getGridTemplateColumns(columns, hasMultiSelect) {
            return _private.getGridTemplateColumns(this, columns, hasMultiSelect);
        }
    });

GridView._private = _private;
GridView.contextTypes = () => {
    return {
        isTouch
    };
};

GridView._theme = ['Controls/grid'];

export = GridView;
