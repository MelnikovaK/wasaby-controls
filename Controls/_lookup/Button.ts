import Control = require('Core/Control');
import template = require('wml!Controls/_lookup/Button/SelectorButton');


/**
 * Button link with the specified text, on clicking on which a selection window opens.
 * Here you can see <a href="/materials/demo-ws4-engine-selector-button">demo-example</a>.
 *
 * @class Controls/_lookup/Button
 * @mixes Controls/interface/ICaption
 * @mixes Controls/interface/ISelectedCollection
 * @mixes Controls/interface/ISelectorDialog
 * @mixes Controls/interface/IFilter
 * @mixes Controls/interface/IMultiSelectable
 * @mixes Controls/interface/ISource
 * @mixes Controls/_lookup/Button/SelectorButtonStyles
 * @extends Core/Control
 * @control
 * @public
 * @author Капустин И.А.
 * @demo Controls-demo/Buttons/SelectorButtonPG
 */

/**
 * @name Controls/_lookup/Button#style
 * @cfg {Enum} Button display style.
 * @variant primary
 * @variant success
 * @variant warning
 * @variant danger
 * @variant info
 * @variant secondary
 * @variant default
 * @default secondary
 */

export = Control.extend({
   _template: template
});

