import TreeGridViewModel = require('Controls/_treeGrid/TreeGridView/TreeGridViewModel');
import SearchViewModel = require('Controls/_treeGrid/SearchView/SearchViewModel');
import {Record} from 'Types/entity';

var SearchGridViewModel = TreeGridViewModel.extend({
    _createModel: function(cfg) {
        return new SearchViewModel(cfg);
    },
    _calcRowIndex(current) {
        if (current.breadCrumbs && current.index !== -1) {
            return this._getRowIndexHelper().getIndexByDisplayIndex(current.index);
        }
        return SearchGridViewModel.superclass._calcRowIndex.apply(this, arguments);
    },
    getActionsItem(item) {
        if (!!item.forEach) {
            return item[item.length - 1];
        }
        return item;
    },

    _isFirstInGroup: function(item:Record|[Record]):boolean {
        item = item[0] || item;
        return SearchGridViewModel.superclass._isFirstInGroup.call(this, item);
    },

    isDrawResults() {
        if (this._options.resultsVisibility === 'visible') {
            return true;
        }
        const items = this.getItems();
        return this.getHasMoreData() || items && items.getCount() > 1;
    }
});
export = SearchGridViewModel;
