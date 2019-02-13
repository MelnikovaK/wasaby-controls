define('Controls/Input/Base',
   [
      'Core/Control',
      'Core/EventBus',
      'Core/detection',
      'Core/constants',
      'Types/entity',
      'Controls/Utils/tmplNotify',
      'Core/helpers/Object/isEqual',
      'Controls/Utils/getTextWidth',
      'Core/helpers/Number/randomId',
      'Controls/Input/Base/InputUtil',
      'Controls/Input/Base/ViewModel',
      'Core/helpers/Function/runDelayed',
      'Core/helpers/String/unEscapeASCII',
      'Controls/Utils/hasHorizontalScroll',

      'wml!Controls/Input/Base/Base',
      'wml!Controls/Input/Base/Field',
      'wml!Controls/Input/Base/ReadOnly',

      'css!theme?Controls/Input/Base/Base'
   ],
   function(
      Control, EventBus, detection, constants, entity, tmplNotify, isEqual,
      getTextWidth, randomName, InputUtil, ViewModel, runDelayed, unEscapeASCII,
      hasHorizontalScroll, template, fieldTemplate, readOnlyFieldTemplate
   ) {
      'use strict';

      var _private = {

         /**
          * @type {Number} The width of the cursor in the field measured in pixels.
          * @private
          */
         WIDTH_CURSOR: 1,

         /**
          * @param {Controls/Input/Base} self Control instance.
          * @param {Object} Ctr View model constructor.
          * @param {Object} options View model options.
          * @param {String} value View model value.
          */
         initViewModel: function(self, Ctr, options, value) {
            self._viewModel = new Ctr(options, value);
         },

         /**
          * @param {Controls/Input/Base} self Control instance.
          */
         initField: function(self) {
            /**
             * When you mount a field in the DOM, the browser can auto fill the field.
             * Then the displayed value in the model will not match the value in the field.
             * In this case, you change the displayed value in the model to the value in the field and
             * must notify the parent that the value in the field has changed.
             */
            _private.forField(self, function(field) {
               if (_private.hasAutoFillField(field)) {
                  self._viewModel.displayValue = field.value;
                  _private.notifyValueChanged(self);
               }
            });
         },

         /**
          * @param {Controls/Input/Base} self Control instance.
          * @param {Object} newOptions New view model options.
          * @param {String} newValue New view model value.
          */
         updateViewModel: function(self, newOptions, newValue) {
            if (!isEqual(self._viewModel.options, newOptions)) {
               self._viewModel.options = newOptions;
            }

            if (self._viewModel.value !== newValue) {
               self._viewModel.value = newValue;
            }
         },

         /**
          * @param {Controls/Input/Base} self Control instance.
          * @param {String} value The value to be set in the field.
          * @param {Controls/Input/Base/Types/Selection.typedef} selection The selection to be set in the field.
          */
         updateField: function(self, value, selection) {
            var field = self._getField();

            if (field.value !== value) {
               field.value = value;
            }

            /**
             * In IE, change the selection leads to the automatic focusing of the field.
             * Therefore, we change it only if the field is already focused.
             */
            if (_private.hasSelectionChanged(field, selection) && _private.isFieldFocused(self)) {
               /**
                * After calling setSelectionRange the select event is triggered and saved the selection in model.
                * You do not need to do this because the model is now the actual selection.
                */
               self._numberSkippedSaveSelection++;
               field.setSelectionRange(selection.start, selection.end);
            }
         },

         /**
          * Determines whether the value of the selection in the field with the checked value is equal.
          * @param {Node} field Field to check.
          * @param {Controls/Input/Base/Types/Selection.typedef} selection The checked value.
          * @return {boolean}
          */
         hasSelectionChanged: function(field, selection) {
            return field.selectionStart !== selection.start || field.selectionEnd !== selection.end;
         },

         /**
          * Determinate whether the field has been auto fill.
          * @param {Node} field
          * @return {Boolean}
          */
         hasAutoFillField: function(field) {
            return !!field.value;
         },

         isFieldFocused: function(self) {
            return self._getActiveElement() === self._getField();
         },

         callChangeHandler: function(self) {
            if (self._viewModel.displayValue !== self._displayValueAfterFocusIn) {
               self._changeHandler();
            }
         },

         /**
          * @param {Controls/Input/Base} self Control instance.
          */
         notifyValueChanged: function(self) {
            self._notify('valueChanged', [self._viewModel.value, self._viewModel.displayValue]);
         },

         /**
          * @param {Controls/Input/Base} self Control instance.
          */
         notifyInputCompleted: function(self) {
            self._notify('inputCompleted', [self._viewModel.value, self._viewModel.displayValue]);
         },

         /**
          * Notify to global channel about receiving or losing focus in field.
          * @remark
          * When the field gets focus, the keyboard on the touch devices is shown.
          * This changes the size of the workspace and may require repositioning controls on the page, such as popup.
          * But on some devices, the size of the workspace does not change and controls do not react.
          * To enable them to respond, this method is used.
          * @param {Controls/Input/Base} self Control instance.
          * @param {Boolean} hasFocus Does the field have focus.
          */
         notifyChangeOfFocusState: function(self, hasFocus) {
            /**
             * After showing the keyboard only on ios, the workspace size does not change.
             * The keyboard is shown only if the field has received focus as a result of a user touch.
             */
            if (self._isMobileIOS && self._fromTouch) {
               var eventName = hasFocus ? 'MobileInputFocus' : 'MobileInputFocusOut';

               self._fromTouch = hasFocus;
               EventBus.globalChannel().notify(eventName);
            }
         },

         /**
          * @param {Controls/Input/Base} self Control instance.
          * @param splitValue Parsed value after user input.
          * @param inputType Type of user input.
          */
         handleInput: function(self, splitValue, inputType) {
            if (self._viewModel.handleInput(splitValue, inputType)) {
               _private.notifyValueChanged(self);
            }
         },

         /**
          * Calculate what type of input was carried out by the user.
          * @param {Controls/Input/Base} self Control instance.
          * @param {String} oldValue The value of the field before user input.
          * @param {String} newValue The value of the field after user input.
          * @param {Number} position The caret position of the field after user input.
          * @param {Controls/Input/Base/Types/Selection.typedef} selection The selection of the field before user input.
          * @param {Controls/Input/Base/Types/NativeInputType.typedef} [nativeInputType]
          * The value of the type property in the handle of the native input event.
          * @return {Controls/Input/Base/Types/InputType.typedef}
          */
         calculateInputType: function(self, oldValue, newValue, position, selection, nativeInputType) {
            var inputType;

            /**
             * On Android if you have enabled spell check and there is a deletion of the last character
             * then the type of event equal insertCompositionText.
             * However, in this case, the event type must be deleteContentBackward.
             * Therefore, we will calculate the event type.
             */
            if (self._isMobileAndroid && nativeInputType === 'insertCompositionText') {
               inputType = InputUtil.getInputType(oldValue, newValue, position, selection);
            } else {
               inputType = nativeInputType
                  ? InputUtil.getAdaptiveInputType(nativeInputType, selection)
                  : InputUtil.getInputType(oldValue, newValue, position, selection);
            }

            return inputType;
         },

         /**
          * @param {String} pastedText
          * @param {String} displayedText
          * @param {Controls/Input/Base/Types/Selection.typedef} selection
          * @return {Controls/Input/Base/Types/SplitValue.typedef}
          */
         calculateSplitValueToPaste: function(pastedText, displayedText, selection) {
            return {
               before: displayedText.substring(0, selection.start),
               insert: pastedText,
               delete: displayedText.substring(selection.start, selection.end),
               after: displayedText.substring(selection.end)
            };
         },

         /**
          * Change the location of the visible area of the field so that the cursor is visible.
          * If the cursor is visible, the location is not changed. Otherwise, the new location will be such that
          * the cursor is visible in the middle of the area.
          * @param {Controls/Input/Base} self Control instance.
          * @param {Node} field
          * @param {String} value
          * @param {Controls/Input/Base/Types/Selection.typedef} selection
          */
         recalculateLocationVisibleArea: function(self, field, value, selection) {
            var textWidthBeforeCursor = self._getTextWidth(value.substring(0, selection.end));

            var positionCursor = textWidthBeforeCursor + _private.WIDTH_CURSOR;
            var sizeVisibleArea = field.clientWidth;
            var beginningVisibleArea = field.scrollLeft;
            var endingVisibleArea = field.scrollLeft + sizeVisibleArea;

            /**
             * The cursor is visible if its position is between the beginning and the end of the visible area.
             */
            var hasVisibilityCursor = beginningVisibleArea < positionCursor && positionCursor < endingVisibleArea;

            if (!hasVisibilityCursor) {
               field.scrollLeft = positionCursor - sizeVisibleArea / 2;
            }
         },

         getField: function(self) {
            return self._children[self._fieldName];
         },

         /**
          * Get the beginning and end of the selected portion of the field's text.
          * @param {Controls/Input/Base} self Control instance.
          * @return {Controls/Input/Base/Types/Selection.typedef}
          * @private
          */
         getFieldSelection: function(self) {
            var field = _private.getField(self);

            return {
               start: field.selectionStart,
               end: field.selectionEnd
            };
         },

         /**
          * The method executes a provided function once for field.
          * @param {Controls/Input/Base} self Control instance.
          * @param {Controls/Input/Base/Types/CallbackForField.typedef} callback Function to execute for field.
          * @private
          */
         forField: function(self, callback) {
            /**
             * In read mode, the field does not exist.
             */
            if (!self._options.readOnly) {
               callback(_private.getField(self));
            }
         },

         /**
          * @param {Controls/Input/Base/Types/SplitValue.typedef} data
          * @param {String} displayValue Values in the field before changing it.
          */
         adjustDataForFastInput: function(data, inputType, displayValue, selection) {
            var start, end;

            if (selection.start === selection.end) {
               var position = selection.end;

               switch (inputType) {
                  case 'deleteForward':
                     start = position;
                     end = position + data.delete.length;
                     break;
                  case 'deleteBackward':
                     start = position - data.delete.length;
                     end = position;
                     break;
                  default:
                     start = position;
                     end = position;
                     break;
               }
            } else {
               start = selection.start;
               end = selection.end;
               data.delete = displayValue.substring(selection.start, selection.end);
            }

            data.delete = displayValue.substring(start, end);
            data.before = displayValue.substring(0, start);
            data.after = displayValue.substring(end, displayValue.length);
         }
      };

      /**
       * Base controls that allows user to enter text.
       *
       * @class Controls/Input/Base
       * @extends Core/Control
       *
       * @mixes Controls/Input/interface/IInputTag
       * @mixes Controls/Input/interface/IInputBase
       * @mixes Controls/Input/interface/IInputPlaceholder
       *
       * @mixes Controls/Input/Render/Styles
       *
       * @private
       * @demo Controls-demo/Input/Base/Base
       *
       * @author Журавлев М.С.
       */

      var Base = Control.extend({

         /**
          * @type {Function} Control display template.
          * @protected
          */
         _template: template,

         /**
          * @type {Controls/Input/Base/Types/DisplayingControl.typedef} Input field in edit mode.
          * @protected
          */
         _field: null,

         /**
          * @type {Controls/Input/Base/Types/DisplayingControl.typedef} Input field in read mode.
          * @protected
          */
         _readOnlyField: null,

         /**
          * @type {Controls/Input/Base/ViewModel} The display model of the input field.
          * @protected
          */
         _viewModel: null,

         /**
          * @type {Controls/Utils/tmplNotify}
          * @protected
          */
         _notifyHandler: tmplNotify,

         /**
          * @type {String} Text of the tooltip shown when the control is hovered over.
          * @protected
          */
         _tooltip: '',

         /**
          * @type {String} Value of the type attribute in the native field.
          * @remark
          * How an native field works varies considerably depending on the value of its {@link https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#Form_%3Cinput%3E_types type attribute}.
          * @protected
          */
         _type: 'text',

         /**
          * @type {String} Value of the name attribute in the native field.
          * @protected
          */
         _fieldName: 'input',

         /**
          * @type {Boolean} Determines whether the control is multiline.
          * @protected
          */
         _multiline: false,

         /**
          * @type {Boolean} Determines whether the control has a rounded border.
          * @protected
          */
         _roundBorder: false,

         /**
          * @type {Number} The number of skipped save the current field selection to the model.
          * @private
          */
         _numberSkippedSaveSelection: 0,

         /**
          * @type {String}
          * @private
          */
         _displayValueAfterFocusIn: '',

         /**
          * @type {Controls/Utils/getTextWidth}
          * @private
          */
         _getTextWidth: getTextWidth,

         /**
          * @type {Controls/Utils/hasHorizontalScroll}
          * @private
          */
         _hasHorizontalScroll: hasHorizontalScroll,

         /**
          * @type {Boolean} Determines whether was a touch to the field.
          * @private
          */
         _fromTouch: false,

         /**
          * @type {Number|null} The version of IE browser in which the control is build.
          * @private
          */
         _ieVersion: null,

         /**
          * @type {Boolean|null} Determines whether the control is building in the mobile Android environment.
          * @private
          */
         _isMobileAndroid: null,

         /**
          * @type {Boolean|null} Determines whether the control is building in the mobile IOS environment.
          * @private
          */
         _isMobileIOS: null,

         /**
          * @type {Boolean|null} Determined whether to hide the placeholder using css.
          * @private
          */
         _hidePlaceholderUsingCSS: null,

         /**
          * @type {Boolean|null} Determines whether the control is building in the Edge.
          * @private
          */
         _isEdge: null,

         /**
          * @type {Controls/Input/Render#style}
          * @protected
          */
         get _style() {
            return this._options.style;
         },

         /**
          *
          * @return {HTMLElement}
          * @private
          */
         _getActiveElement: function() {
            return document.activeElement;
         },

         constructor: function(cfg) {
            Base.superclass.constructor.call(this, cfg);

            this._ieVersion = detection.IEVersion;
            this._isMobileAndroid = detection.isMobileAndroid;
            this._isMobileIOS = detection.isMobileIOS;
            this._isEdge = detection.isIE12;

            /**
             * Hide in chrome because it supports auto-completion of the field when hovering over an item
             * in the list of saved values. During this action no events are triggered and hide placeholder
             * using js is not possible.
             *
             * IMPORTANTLY: Cannot be used in IE. because the native placeholder will be used,
             * and with it the field behaves incorrectly. After the focus out, the input event will be called.
             * When this event is processed, the selection in the field is incorrect.
             * The start and end selection is equal to the length of the native placeholder. https://jsfiddle.net/e0uaczqw/1/
             * When processing input, we set a selection from the model if the value in the field is different
             * from the value in the model. And when you change the selection, the field starts to focus.
             * There is a situation that you can not withdraw focus from the field.
             *
             * The detection.chrome value is not invalid detecting on the server.
             * https://online.sbis.ru/opendoc.html?guid=a17b59fb-f5bd-4ae3-87a7-38f47078980a
             * Because of this, If the field already has a value substituted by the browser,
             * the control does not hide the placeholder until the control is revived.
             * As a solution, the value on the server is always true, and the recalculation is performed on the client.
             */
            this._hidePlaceholderUsingCSS = constants.isBuildOnServer || detection.chrome;
         },

         _beforeMount: function(options) {
            var viewModelCtr = this._getViewModelConstructor();
            var viewModelOptions = this._getViewModelOptions(options);

            this._initProperties(options);
            _private.initViewModel(this, viewModelCtr, viewModelOptions, options.value);

            if (options.autoComplete) {
               /**
                * Browsers use auto-fill to the fields with the previously stored name.
                * Therefore, if all of the fields will be one name, then AutoFill will apply to the first field.
                * To avoid this, we will translate the name of the control to the name of the <input> tag.
                * https://habr.com/company/mailru/blog/301840/
                */
               if ('name' in options) {
                  /**
                   * The value of the name option can be undefined.
                   * Should it be so unclear. https://online.sbis.ru/opendoc.html?guid=a32eb034-b2da-4718-903f-9c09949adb2f
                   */
                  if (typeof options.name !== 'undefined') {
                     this._fieldName = options.name;
                  }
               }
            } else {
               /**
                * To disable auto-complete in a field, its name attribute must have a value that
                * the browser does not remember. To do this, generate a random name.
                */
               this._fieldName = randomName('name-');
            }
         },

         _afterMount: function() {
            _private.initField(this);
         },

         _beforeUpdate: function(newOptions) {
            var newViewModelOptions = this._getViewModelOptions(newOptions);

            _private.updateViewModel(this, newViewModelOptions, newOptions.value);
         },

         /**
          * @param {Object} options Control options.
          * @protected
          */
         _initProperties: function() {
            this._field = {
               template: fieldTemplate,
               scope: {
                  controlName: 'InputBase',
                  calculateValueForTemplate: this._calculateValueForTemplate.bind(this)
               }
            };
            this._readOnlyField = {
               template: readOnlyFieldTemplate,
               scope: {}
            };
            this._beforeFieldWrapper = {
               template: null,
               scope: {}
            };
            this._afterFieldWrapper = {
               template: null,
               scope: {}
            };

            /**
             * TODO: Remove after execution:
             * https://online.sbis.ru/opendoc.html?guid=6c755b9b-bbb8-4a7d-9b50-406ef7f087c3
             */
            var emptySymbol = unEscapeASCII('&#65279;');
            this._field.scope.emptySymbol = emptySymbol;
            this._readOnlyField.scope.emptySymbol = emptySymbol;
         },

         /**
          * Event handler mouse enter.
          * @private
          */
         _mouseEnterHandler: function() {
            this._tooltip = this._getTooltip();
         },

         /**
          * Event handler key up in native field.
          * @param {Object} event Event descriptor.
          * @private
          */
         _keyUpHandler: function(event) {
            var keyCode = event.nativeEvent.keyCode;

            /**
             * Clicking the arrows and keys home, end moves the cursor.
             */
            if (keyCode >= constants.key.end && keyCode <= constants.key.down) {
               this._viewModel.selection = this._getFieldSelection();
            }

            if (keyCode === constants.key.enter && this._isTriggeredChangeEventByEnterKey()) {
               _private.callChangeHandler(this);
            }
         },

         /**
          * Event handler click in native field.
          * @private
          */
         _clickHandler: function() {
            if (this._options.selectOnClick && this._firstClick) {
               this._viewModel.select();
               this._firstClick = false;
            } else {
               var self = this;

               /**
                * If the value in the field is selected, when you click on the selected area,
                * the cursor in the field is placed after the event. https://jsfiddle.net/wv9o4xmd/
                * Therefore, we remember the selection from the field at the next drawing cycle.
                */
               runDelayed(function() {
                  self._viewModel.selection = self._getFieldSelection();

                  /**
                   * Changes are applied during the synchronization cycle. We are not in it,
                   * so we need to inform the model that the changes have been applied.
                   */
                  self._viewModel.changesHaveBeenApplied();
               });
            }
         },

         /**
          * Event handler select in native field.
          * @private
          */
         _selectHandler: function() {
            if (this._numberSkippedSaveSelection > 0) {
               this._numberSkippedSaveSelection--;
            } else {
               this._viewModel.selection = this._getFieldSelection();
            }
         },

         _inputHandler: function(event) {
            var field = this._getField();
            var model = this._viewModel;
            var value = model.oldDisplayValue;
            var selection = model.oldSelection;
            var newValue = field.value;
            var position = field.selectionEnd;

            var inputType = _private.calculateInputType(
               this, value, newValue, position,
               selection, event.nativeEvent.inputType
            );
            var splitValue = InputUtil.splitValue(value, newValue, position, selection, inputType);

            /**
             * If the user works quickly with a field, the input event fires several times from
             * the last synchronization cycle to the next. Due to the fact that the field always displays
             * the value of the option value, after the second time in the field will be incorrect value.
             * Therefore, the split Value too will be incorrect.
             * Example: The field displays 1. The user enters 2 and 3 quickly.
             * field 1 -> entered 2 -> field 12 -> update by option and notify the parent that value 12 ->
             * field 1 -> entered 3 -> field 13(expected 123) -> update by option and notify the parent that value 13 ->
             * synchronization cycle -> field 13(the error should be 123).
             * For such situations to be handled correctly, we need to adjust the data.
             */
            if (value !== model.displayValue) {
               _private.adjustDataForFastInput(splitValue, inputType, model.displayValue, model.selection);
            }

            _private.handleInput(this, splitValue, inputType);

            /**
             * The field is displayed according to the control options.
             * When user enters data,the display changes and does not match the options.
             * Therefore, return the field to the state before entering.
             * Otherwise, the text will blink when the user performs a fast input.
             * Fast input is pressing multiple keys at the same time or pressing a single key.
             *
             * On Android such actions cause bugs. For example:
             * 1. https://online.sbis.ru/opendoc.html?guid=ce9d1d56-8f33-4e26-8284-157773fc08fd
             * 2. https://online.sbis.ru/opendoc.html?guid=92ce32b2-a6d5-467e-bf34-dbd273ee7c9b
             * Fast input on Android is not carried out, so do not do these actions on it.
             */
            if (!detection.isMobileAndroid) {
               _private.updateField(this, value, selection);
            }
         },

         /**
          * Handler for the change event.
          * @remark
          * The handler cannot be called through a subscription to the change event in the control template.
          * The reason is that the native event does not work in all browsers.
          * Therefore you need to call it on focus in or press enter.
          * Bug in firefox: If the value in the field after the input event is not changed,
          * but changed after a timeout, then the browser considers that it has not changed and event is not triggered.
          * https://jsfiddle.net/v6g0fz7u/
          * @protected
          */
         _changeHandler: function() {
            _private.notifyInputCompleted(this);
         },

         _placeholderClickHandler: function() {
            /**
             * Placeholder is positioned above the input field.
             * When clicking, the cursor should stand in the input field.
             * To do this, we ignore placeholder using the pointer-events property with none value.
             * The property is not supported in ie lower version 11.
             * In ie 11, you sometimes need to switch versions in emulation to work.
             * Therefore, we ourselves will activate the field on click.
             * https://caniuse.com/#search=pointer-events
             */
            if (this._ieVersion < 12) {
               this._getField().focus();
            }
         },

         _focusInHandler: function() {
            if (this._focusByMouseDown) {
               this._firstClick = true;
            } else {
               this._viewModel.select();
            }

            this._focusByMouseDown = false;

            _private.notifyChangeOfFocusState(this, true);

            this._displayValueAfterFocusIn = this._viewModel.displayValue;
         },

         /**
          * Event handler focus out in native field.
          * @protected
          */
         _focusOutHandler: function() {
            /**
             * After the focus disappears, the field should be scrolled to the beginning.
             * Each browser works differently. For example, chrome scrolled to the beginning.
             * IE, Firefox does not scrolled. So we do it ourselves.
             */
            this._getField().scrollLeft = 0;

            _private.notifyChangeOfFocusState(this, false);

            _private.callChangeHandler(this);
         },

         _touchStartHandler: function() {
            this._fromTouch = true;
         },

         _mouseDownHandler: function() {
            if (!_private.isFieldFocused(this)) {
               this._focusByMouseDown = true;
            }
         },

         _domAutoCompleteHandler: function() {
            /**
             * When the user selects a value from the auto-complete, the other fields associated with it are
             * automatically filled in. The logic of the control operation is based on displaying the value
             * according to its options. Therefore, the field value is updated during the synchronization cycle.
             *
             * In firefox, after the field is automatically filled in, you should immediately set the value
             * in the field without waiting for a synchronization cycle. Otherwise, the values will not be substituted
             * into other fields.
             *
             * About what happened auto-complete learn through the event DOMAutoComplete,
             * which is supported only in firefox. https://developer.mozilla.org/en-US/docs/Web/Events/DOMAutoComplete
             */

            this._calculateValueForTemplate();
         },

         _notifyValueChanged: function() {
            _private.notifyValueChanged(this);
         },

         _notifyInputCompleted: function() {
            _private.notifyInputCompleted(this);
         },

         /**
          * Get the native field.
          * @return {Node}
          * @private
          */
         _getField: function() {
            return this._children[this._fieldName];
         },

         _getReadOnlyField: function() {
            return this._children.readOnlyField;
         },

         /**
          * Get the beginning and end of the selected portion of the field's text.
          * @return {Controls/Input/Base/Types/Selection.typedef}
          * @private
          */
         _getFieldSelection: function() {
            var field = this._getField();

            return {
               start: field.selectionStart,
               end: field.selectionEnd
            };
         },

         /**
          * Get the options for the view model.
          * @return {Object} View model options.
          * @private
          */
         _getViewModelOptions: function() {
            return {};
         },

         /**
          * Get the constructor for the view model.
          * @return {Controls/Input/Base/ViewModel} View model constructor.
          * @private
          */
         _getViewModelConstructor: function() {
            return ViewModel;
         },

         /**
          * Get the tooltip for field.
          * If the displayed value fits in the field, the tooltip option is returned.
          * Otherwise the displayed value is returned.
          * @return {String} Tooltip.
          * @private
          */
         _getTooltip: function() {
            var valueDisplayElement = this._getField() || this._getReadOnlyField();
            var hasFieldHorizontalScroll = this._hasHorizontalScroll(valueDisplayElement);

            return hasFieldHorizontalScroll ? this._viewModel.displayValue : this._options.tooltip;
         },

         _calculateValueForTemplate: function() {
            var model = this._viewModel;
            var field = this._getField();

            if (model.shouldBeChanged && field) {
               _private.updateField(this, model.displayValue, model.selection);
               model.changesHaveBeenApplied();

               if (_private.isFieldFocused(this)) {
                  this._recalculateLocationVisibleArea(field, model.displayValue, model.selection);
               }
            }

            return model.displayValue;
         },

         _recalculateLocationVisibleArea: function(field, displayValue, selection) {
            _private.recalculateLocationVisibleArea(this, field, displayValue, selection);
         },

         _isTriggeredChangeEventByEnterKey: function() {
            return true;
         },

         paste: function(text) {
            var model = this._viewModel;
            var splitValue = _private.calculateSplitValueToPaste(text, model.displayValue, model.selection);

            _private.handleInput(this, splitValue, 'insert');
         }
      });

      Base.getDefaultOptions = function() {
         return {
            size: 'm',
            tooltip: '',
            style: 'info',
            placeholder: '',
            textAlign: 'left',
            fontStyle: 'default',
            autoComplete: false,
            selectOnClick: false
         };
      };

      Base.getOptionTypes = function() {
         return {

            /**
             * https://online.sbis.ru/opendoc.html?guid=00ca0ce3-d18f-4ceb-b98a-20a5dae21421
             * placeholder: descriptor(String|Function),
             * value: descriptor(String|null),
             */
            tooltip: entity.descriptor(String),
            autoComplete: entity.descriptor(Boolean),
            selectOnClick: entity.descriptor(Boolean),
            size: entity.descriptor(String).oneOf([
               's',
               'm',
               'l'
            ]),
            fontStyle: entity.descriptor(String).oneOf([
               'default',
               'primary',
               'secondary'
            ]),
            textAlign: entity.descriptor(String).oneOf([
               'left',
               'right'
            ]),
            style: entity.descriptor(String).oneOf([
               'info',
               'danger',
               'invalid',
               'primary',
               'success',
               'warning'
            ]),
            tagStyle: entity.descriptor(String).oneOf([
               'info',
               'danger',
               'primary',
               'success',
               'warning',
               'secondary'
            ])
         };
      };

      return Base;
   });
