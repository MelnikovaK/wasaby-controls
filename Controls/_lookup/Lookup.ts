import Control = require('Core/Control');
import template = require('wml!Controls/_lookup/Lookup/Lookup');


/**
 * The Lookup control allows you to select a value from a dialog or suggest containing a list of possible values.
 * Сan be displayed in single-line and multi-line mode.
 * Supports single and multiple selection.
 * Here you can see <a href="/materials/demo-ws4-engine-selector-lookup">demo-example</a>.
 *
 * @class Controls/_lookup/Lookup
 * @extends Core/Control
 * @mixes Controls/interface/ILookup
 * @mixes Controls/interface/ISelectedCollection
 * @mixes Controls/interface/ISelectorDialog
 * @mixes Controls/interface/ISuggest
 * @mixes Controls/interface/ISearch
 * @mixes Controls/_interface/ISource
 * @mixes Controls/interface/IFilter
 * @mixes Controls/interface/INavigation
 * @mixes Controls/_interface/IMultiSelectable
 * @mixes Controls/interface/IInputPlaceholder
 * @mixes Controls/interface/IInputBase
 * @mixes Controls/interface/IInputText
 * @mixes Controls/interface/IInputField
 * @mixes Controls/interface/IInputTag
 * @mixes Controls/interface/ISelectableInput
 * @mixes Controls/_lookup/Lookup/LookupStyles
 * @control
 * @public
 * @author Капустин И.А.
 * @category Input
 * @demo Controls-demo/Input/Lookup/LookupPropertyGrid
 */

/**
 * @name Controls/interface/ILookup#multiLine
 * @cfg {Boolean} Determines then Lookup can be displayed in multi line mode.
 */

var Lookup = Control.extend({
   _template: template,

   showSelector: function (popupOptions) {
      return this._children.controller.showSelector(popupOptions);
   }
});

export = Lookup;

