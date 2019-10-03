import Control = require('Core/Control');
import template = require('wml!Controls/_lookup/BaseLookupView/BaseLookupView');
import DOMUtil = require('Controls/Utils/DOMUtil');
import tmplNotify = require('Controls/Utils/tmplNotify');
import clearRecordsTemplate = require('wml!Controls/_lookup/BaseLookupView/resources/clearRecordsTemplate');
import showSelectorTemplate = require('wml!Controls/_lookup/BaseLookupView/resources/showSelectorTemplate');
import {isEqual} from 'Types/object';
import {constants, IoC} from 'Env/Env';


const KEY_CODE_F2 = 113;

var _private = {
    initializeContainers: function (self) {
        self._fieldWrapper = self._children.inputRender._container;

        // toDO Проверка на jQuery до исправления этой ошибки https://online.sbis.ru/opendoc.html?guid=d7b89438-00b0-404f-b3d9-cc7e02e61bb3
        if (window.jQuery && self._fieldWrapper instanceof window.jQuery) {
            self._fieldWrapper = self._fieldWrapper[0];
        }
    },

    notifyValue: function (self, value) {
        self._notify('valueChanged', [value]);
    },

    resetInputValue: function(self) {
        if (self._inputValue !== '') {
            self._inputValue = '';
            _private.notifyValue(self, '');
        }
    },

    activate: function(self, enableScreenKeyboard = true) {
        if (self._options.multiSelect) {
            self.activate({enableScreenKeyboard: enableScreenKeyboard});
        } else {
            // activate method is focusing input.
            // for lookup with multiSelect: false input will be hidden after select item,
            // and focus will be lost.
            // for this case activate lookup in _afterUpdate hook.
            self._needSetFocusInInput = true;
        }
    }
};

var BaseLookupView = Control.extend({
    _template: template,
    _notifyHandler: tmplNotify,
    _active: false,
    _inputValue: '',
    _suggestState: false,
    _infoboxOpened: false,
    _fieldWrapperWidth: null,
    _maxVisibleItems: null,
    _clearRecordsTemplate: clearRecordsTemplate,
    _showSelectorTemplate: showSelectorTemplate,

    /* needed, because input will be created only after VDOM synchronisation,
     and we can set focus only in afterUpdate */
    _needSetFocusInInput: false,

    _beforeMount: function (options) {
        this._inputValue = options.value;
        this._listOfDependentOptions = [];

        if (!options.multiSelect) {
            this._maxVisibleItems = 1;
        } else if (options.multiLine) {
            this._maxVisibleItems = options.maxVisibleItems;
        } else {
            this._maxVisibleItems = options.items.getCount();
        }

        if (options.suggestFooterTemplate) {
            IoC.resolve('ILogger').warn('In the "Controls.lookup:Input" control, use "footerTemplate" option instead of "suggestFooterTemplate"');
        }
    },

    _afterMount: function () {
        _private.initializeContainers(this);

        if (!this._isEmpty(this._options)) {
            this._calculatingSizes(this._options);
        }
    },

    _beforeUpdate: function (newOptions) {
        var
            currentOptions = this._options,
            isNeedUpdate = !isEqual(newOptions.selectedKeys, this._options.selectedKeys);

        if (newOptions.value !== this._options.value) {
            this._inputValue = newOptions.value;
        }

        if (!isNeedUpdate) {
            this._listOfDependentOptions.forEach(function (optName) {
                if (newOptions[optName] !== currentOptions[optName]) {
                    isNeedUpdate = true;
                }
            });
        }

        if (currentOptions.items !== newOptions.items) {
            _private.resetInputValue(this);
        }

        if (isNeedUpdate) {
            this._calculatingSizes(newOptions);
        }

        if (!this._isInputActive(newOptions)) {
            this._suggestState = false;
        }
    },

    _afterUpdate: function():void {
        if (this._needSetFocusInInput) {
            this._needSetFocusInInput = false;

            /* focus can be moved in choose event */
            if (this._active) {
                this.activate();
            }
        }
    },

    _changeValueHandler: function (event, value) {
        this._inputValue = value;
        _private.notifyValue(this, value);
    },

    _choose: function (event, item) {
        // move focus to input after select, because focus will be lost after closing popup
        _private.activate(this);

        this._notify('addItem', [item]);
        _private.resetInputValue(this);
    },

    _crossClick: function (event, item) {
        /* move focus to input, because focus will be lost after removing dom element */
        if (!this._infoboxOpened) {
            _private.activate(this, false);
        }
        this._notify('removeItem', [item]);
    },

    _getFieldWrapperWidth: function (recount) {
        if (this._fieldWrapperWidth === null || recount) {

            // we cache width, since used in several places in the calculations and need to compare when resize
            this._fieldWrapperWidth = DOMUtil.width(this._fieldWrapper);
        }

        return this._fieldWrapperWidth;
    },

    _isNeedCalculatingSizes: function () {

    },

    _calculatingSizes: function () {

    },

    _resize: function () {
        var
            oldFieldWrapperWidth = this._getFieldWrapperWidth(),
            newFieldWrapperWidth = this._getFieldWrapperWidth(true);

        if (this._isNeedCalculatingSizes(this._options) && newFieldWrapperWidth !== oldFieldWrapperWidth) {
            this._calculatingSizes(this._options);
        }
    },

    private _activated: function(): void {
        this._active = true;
    },

    private _deactivated: function(): void {
        this._active = false;
        this._suggestState = false;
    },

    _suggestStateChanged: function () {
        if (this._infoboxOpened || !this._isInputActive(this._options)) {
            this._suggestState = false;
        }
    },

    _determineAutoDropDown: function () {
        return this._options.autoDropDown && this._isInputActive(this._options);
    },

    _isEmpty: function (options) {
        return !options.items.getCount();
    },

    _isInputVisible: function () {

    },

    _isInputActive: function(options) {
        return !options.readOnly && this._isInputVisible(options);
    },

    _openInfoBox: function (event, config) {
        config.width = this._getContainer().offsetWidth;
        this._suggestState = false;
        this._infoboxOpened = true;
        this._notify('openInfoBox', [config]);
    },

    _closeInfoBox: function () {
        this._infoboxOpened = false;
        this._notify('closeInfoBox');
    },

    _onClickShowSelector: function (event) {
        this._suggestState = false;
        this._notify('showSelector');
    },

    _onClickClearRecords: function () {
        this._notify('updateItems', [[]]);

        // When click on the button, it disappears from the layout and the focus is lost, we return the focus to the input field.
        this.activate();
    },

    _itemClick: function (event, item) {
        this._suggestState = false;
        this._notify('itemClick', [item]);
    },

    _keyDown: function (event, keyboardEvent) {
        var
            items = this._options.items,
            keyCodeEvent = keyboardEvent.nativeEvent.keyCode;

        if (keyCodeEvent === KEY_CODE_F2) {
            this._notify('showSelector');
        } else if (keyCodeEvent === constants.key.backspace &&
            !this._inputValue && !this._isEmpty(this._options)) {

            //If press backspace, the input field is empty and there are selected entries -  remove last item
            this._notify('removeItem', [items.at(items.getCount() - 1)]);
        }
    },

    _getContainer: function() {
        let container = this._container;

        if (window.jQuery && container instanceof window.jQuery) {
            container = container[0];
        }

        return container;
    },

   _getPlaceholder: function(options) {
       return options.placeholder;
   },

   _isShowCollection: function() {
       return !this._isEmpty(this._options) && (this._maxVisibleItems || this._options.readOnly);
   }
});

BaseLookupView._theme = ['Controls/lookup'];

BaseLookupView.getDefaultOptions = function () {
    return {
        value: '',
        displayProperty: 'title',
        multiSelect: false,
        maxVisibleItems: 7,
        isInputVisible: true
    };
};

BaseLookupView._private = _private;
export = BaseLookupView;

