import Control = require('Core/Control');
import template = require('wml!Controls/List/MultiSelector/MultiSelector');

/**
 * Container for list components.
 *
 * @class Controls/List/MultiSelector
 * @extends Core/Control
 * @control
 * @author Авраменко А.С.
 * @public
 */

/**
 * @event Controls/List/MultiSelector#listSelectedKeysChanged Occurs when selected keys were changed.
 * @param {Core/vdom/Synchronizer/resources/SyntheticEvent} eventObject Descriptor of the event.
 * @param {Array} selectedKeys Array of selected items' keys.
 * @param {Array} added Array of added keys in selection.
 * @param {Array} deleted Array of deleted keys in selection.
 */

/**
 * @event Controls/List/MultiSelector#listExcludedKeysChanged Occurs when excluded keys were changed.
 * @param {Core/vdom/Synchronizer/resources/SyntheticEvent} eventObject Descriptor of the event.
 * @param {Array} selectedKeys Array of selected items' keys.
 * @param {Array} added Array of added keys in selection.
 * @param {Array} deleted Array of deleted keys in selection.
 */

var MultiSelector = Control.extend({
    _template: template,

    _selectionChangeHandler: function (e, eventName) {
        return this._notify(eventName, Array.prototype.slice.call(arguments, 2), {
            bubbling: true
        });
    }
});

export = MultiSelector;
