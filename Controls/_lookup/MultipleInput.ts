import Control = require('Core/Control');
import template = require('wml!Controls/_lookup/MultipleInput/MultipleInput');
import itemTemplate = require('wml!Controls/_lookup/Lookup/itemTemplate');

/**
 * The Lookup control allows you to select a value from a dialogs or suggest containing a list of possible values.
 * Here you can see <a href="/materials/demo-ws4-engine-selector-lookup">demo-example</a>.
 *
 * @class Controls/_lookup/MultipleInput
 * @mixes Controls/interface/ISelectedCollection
 * @mixes Controls/interface/ISelectorDialog
 * @mixes Controls/interface/ISearch
 * @mixes Controls/_interface/ISource
 * @mixes Controls/interface/IFilter
 * @mixes Controls/interface/ISuggest
 * @mixes Controls/interface/ILookup
 * @mixes Controls/interface/INavigation
 * @mixes Controls/interface/IMultiSelectable
 * @mixes Controls/interface/IInputPlaceholder
 * @mixes Controls/Input/interface/IInputField
 * @mixes Controls/_lookup/Lookup/LookupStyles
 * @control
 * @public
 * @author Капустин И.А.
 * @category Input
 */

var MultipleInput = Control.extend({
    _template: template,

    showSelector: function (popupOptions) {
        this._children.controller.showSelector(popupOptions);
    }
});

MultipleInput.getDefaultOptions = function() {
    return {
        itemTemplate: itemTemplate
    };
};

export = MultipleInput

