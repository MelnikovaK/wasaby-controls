import {TemplateFunction} from 'UI/Base';
import {GridView} from 'Controls/grid';
import DefaultItemTpl = require('wml!Controls/_treeGrid/TreeGridView/Item');
import ItemOutputWrapper = require('wml!Controls/_treeGrid/TreeGridView/ItemOutputWrapper');
import 'wml!Controls/_treeGrid/TreeGridView/NodeFooter';
import 'css!theme?Controls/treeGrid';

var
    TreeGridView = GridView.extend({
        _itemOutputWrapper: ItemOutputWrapper,
        _defaultItemTemplate: DefaultItemTpl,
        _resolveBaseItemTemplate(): TemplateFunction {
            return DefaultItemTpl;
        },
        _onExpanderClick: function (e, dispItem) {
            this._notify('expanderClick', [dispItem], {bubbling: true});
            e.stopImmediatePropagation();
        },
        _onLoadMoreClick: function (e, dispItem) {
            this._notify('loadMoreClick', [dispItem]);
        }
    });

export = TreeGridView;
