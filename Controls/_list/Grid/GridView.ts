import cDeferred = require('Core/Deferred');
import ListView = require('Controls/List/ListView');
import GridViewTemplateChooser = require('wml!Controls/List/Grid/GridViewTemplateChooser');
import DefaultItemTpl = require('wml!Controls/List/Grid/Item');
import ColumnTpl = require('wml!Controls/List/Grid/Column');
import HeaderContentTpl = require('wml!Controls/List/Grid/HeaderContent');
import Env = require('Env/Env');
import GroupTemplate = require('wml!Controls/List/Grid/GroupTemplate');
import OldGridView = require('wml!Controls/List/Grid/OldGridView');
import NewGridView = require('wml!Controls/List/Grid/NewGridView');
import 'wml!Controls/List/Grid/Header';
import 'wml!Controls/List/Grid/Results';
import 'wml!Controls/List/Grid/ColGroup';
import 'css!theme?Controls/List/Grid/Grid';
import 'css!theme?Controls/List/Grid/OldGrid';
import 'Controls/List/BaseControl/Scroll/Emitter';

// todo: removed by task https://online.sbis.ru/opendoc.html?guid=728d200e-ff93-4701-832c-93aad5600ced
function isEqualWithSkip(obj1, obj2, skipFields) {
    if ((!obj1 && obj2) || (obj1 && !obj2)) {
        return false;
    }
    if (!obj1 && !obj2) {
        return true;
    }
    if (obj1.length !== obj2.length) {
        return false;
    }
    for (var i = 0; i < obj1.length; i++) {
        for (var j in obj1[i]) {
            if (!skipFields[j] && obj1[i].hasOwnProperty(j)) {
                if (!obj2[i].hasOwnProperty(j) || obj1[i][j] !== obj2[i][j]) {
                    return false;
                }
            }
        }
    }
    return true;
}

var
    _private = {
        checkDeprecated: function(cfg) {
            // TODO: https://online.sbis.ru/opendoc.html?guid=837b45bc-b1f0-4bd2-96de-faedf56bc2f6
            if (cfg.showRowSeparator !== undefined) {
                Env.IoC.resolve('ILogger').warn('IGridControl', 'Option "showRowSeparator" is deprecated and removed in 19.200. Use option "rowSeparatorVisibility".');
            }
            if (cfg.stickyColumn !== undefined) {
                Env.IoC.resolve('ILogger').warn('IGridControl', 'Option "stickyColumn" is deprecated and removed in 19.200. Use "stickyProperty" option in the column configuration when setting up the columns.');
            }
        },
        prepareGridTemplateColumns: function(columns, multiselect) {
            var
                result = '';
            if (multiselect === 'visible' || multiselect === 'onhover') {
                result += 'auto ';
            }
            columns.forEach(function(column) {
                result += column.width ? column.width + ' ' : '1fr ';
            });
            return result;
        },
        detectLayoutFixed: function(self, columns) {
            self._layoutFixed = true;
            for (var i = 0; i < columns.length; i++) {
                if (!columns[i].width || columns[i].width === 'auto') {
                    self._layoutFixed = false;
                    break;
                }
            }
        },
        prepareHeaderAndResultsIfFullGridSupport: function(resultsPosition, header, container) {
            var
                resultsPadding,
                cells;

            //FIXME remove container[0] after fix https://online.sbis.ru/opendoc.html?guid=d7b89438-00b0-404f-b3d9-cc7e02e61bb3
            container = container[0] || container;
            if (resultsPosition) {
                if (resultsPosition === 'top') {
                    if (header) {
                        resultsPadding = container.getElementsByClassName('controls-Grid__header-cell')[0].getBoundingClientRect().height + 'px';
                    } else {
                        resultsPadding = '0';
                    }
                } else {
                    resultsPadding = 'calc(100% - ' + container.getElementsByClassName('controls-Grid__results-cell')[0].getBoundingClientRect().height + 'px)';
                }
                cells = container.getElementsByClassName('controls-Grid__results-cell');
                Array.prototype.forEach.call(cells, function(elem) {
                    elem.style.top = resultsPadding;
                });
            }
        },
        calcFooterPaddingClass: function(params) {
            var
                paddingLeft,
                result = 'controls-GridView__footer controls-GridView__footer__paddingLeft_';
            if (params.multiSelectVisibility === 'onhover' || params.multiSelectVisibility === 'visible') {
                result += 'withCheckboxes';
            } else {
                if (params.itemPadding) {
                    paddingLeft = params.itemPadding.left;
                } else {
                    paddingLeft = params.leftSpacing || params.leftPadding;
                }
                result += (paddingLeft || 'default').toLowerCase();
            }
            return result;
        }
    },
    GridView = ListView.extend({
        _gridTemplate: null,
        isNotFullGridSupport: Env.detection.isNotFullGridSupport,
        _template: GridViewTemplateChooser,
        _groupTemplate: GroupTemplate,
        _defaultItemTemplate: DefaultItemTpl,
        _headerContentTemplate: HeaderContentTpl,
        _prepareGridTemplateColumns: _private.prepareGridTemplateColumns,

        _beforeMount: function(cfg) {
            _private.checkDeprecated(cfg);
            this._gridTemplate = Env.detection.isNotFullGridSupport ? OldGridView : NewGridView;
            if (cDetection.isNotFullGridSupport) {
                _private.detectLayoutFixed(this, cfg.columns);
            }
            GridView.superclass._beforeMount.apply(this, arguments);
            this._listModel.setColumnTemplate(ColumnTpl);
        },

        _beforeUpdate: function(newCfg) {
            GridView.superclass._beforeUpdate.apply(this, arguments);

            // todo removed by task https://online.sbis.ru/opendoc.html?guid=728d200e-ff93-4701-832c-93aad5600ced
            if (!isEqualWithSkip(this._options.columns, newCfg.columns, { template: true, resultTemplate: true })) {
                if (cDetection.isNotFullGridSupport) {
                    _private.detectLayoutFixed(this, newCfg.columns);
                }
                this._listModel.setColumns(newCfg.columns);
                if (!Env.detection.isNotFullGridSupport) {
                    _private.prepareHeaderAndResultsIfFullGridSupport(this._listModel.getResultsPosition(), this._listModel.getHeader(), this._container);
                }
            }
            if (!isEqualWithSkip(this._options.header, newCfg.header, { template: true })) {
                this._listModel.setHeader(newCfg.header);
                if (!Env.detection.isNotFullGridSupport) {
                    _private.prepareHeaderAndResultsIfFullGridSupport(this._listModel.getResultsPosition(), this._listModel.getHeader(), this._container);
                }
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
        },

        _calcFooterPaddingClass: function(params) {
            return _private.calcFooterPaddingClass(params);
        },

        _afterMount: function() {
            GridView.superclass._afterMount.apply(this, arguments);
            if (!Env.detection.isNotFullGridSupport) {
                _private.prepareHeaderAndResultsIfFullGridSupport(this._listModel.getResultsPosition(), this._listModel.getHeader(), this._container);
            }
        }
    });

GridView._private = _private;

export = GridView;
