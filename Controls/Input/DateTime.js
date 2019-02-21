﻿define('Controls/Input/DateTime', [
   'Core/Control',
   'Core/constants',
   'Core/core-merge',
   'Controls/Calendar/Utils',
   'Controls/Input/DateTime/Model',
   'Controls/Input/interface/IDateTimeMask',
   'Controls/Utils/tmplNotify',
   'wml!Controls/Input/DateTime/DateTime'
], function(
   Control,
   CoreConstants,
   coreMerge,
   CalendarControlsUtils,
   Model,
   IDateTimeMask,
   tmplNotify,
   template
) {
   'use strict';

   /**
    * Control for entering date and time.
    * Depending on {@link mask mask} can be used to enter:
    * <ol>
    *    <li>just date,</li>
    *    <li>just time,</li>
    *    <li>date and time.</li>
    * </ol>
    * <a href="/materials/demo-ws4-input-datetime">Demo examples.</a>.
    *
    * @class Controls/Input/DateTime
    * @extends Core/Control
    * @mixes Controls/Input/interface/IInputBase
    * @mixes Controls/Input/interface/IInputField
    * @mixes Controls/Input/interface/IInputDateTime
    * @mixes Controls/Input/interface/IInputTag
    * @mixes Controls/Input/interface/IDateTimeMask
    * @mixes Controls/Input/interface/IValidation
    *
    * @control
    * @public
    * @demo Controls-demo/Input/DateTime/DateTimePG
    * @author Миронов А.Ю.
    * @category Input
    */

   var Component = Control.extend([], {
      _template: template,
      _proxyEvent: tmplNotify,

      _formatMaskChars: {
         'D': '[0-9]',
         'M': '[0-9]',
         'Y': '[0-9]',
         'H': '[0-9]',
         'm': '[0-9]',
         's': '[0-9]',
         'U': '[0-9]'
      },

      _model: null,

      _needInputCompletedEvent: false,

      _beforeMount: function(options) {
         this._model = new Model(options);
         CalendarControlsUtils.proxyModelEvents(this, this._model, ['valueChanged']);
      },

      _beforeUpdate: function(options) {
         this._model.update(options);
      },

      _inputCompletedHandler: function(event, value, textValue) {
         this._model.autocomplete(textValue, this._options.autocompleteType);
         this._needInputCompletedEvent = false;
         this._notify('inputCompleted', [this._model.value, textValue]);
      },

      _valueChangedHandler: function(e, value, textValue) {
         this._model.textValue = textValue;
         e.stopImmediatePropagation();
      },
      _onKeyDown: function(event) {
         event.stopImmediatePropagation();
         var key = event.nativeEvent.keyCode;
         if (key === CoreConstants.key.insert) {
         // on Insert button press current date should be inserted in field
            this._model.setCurrentDate();
            this._needInputCompletedEvent = true;
         }
         if (key === CoreConstants.key.plus || key === CoreConstants.key.minus) {
         // on +/- buttons press date should be increased or decreased in field by one day
            var delta = key === CoreConstants.key.plus ? 1 : -1;
            var localDate = new Date(this._model.value);
            localDate.setDate(this._model.value.getDate() + delta);
            this._model.value = localDate;
         }
      },

      _onDeactivated: function(event) {
         if (this._needInputCompletedEvent) {
            this._needInputCompletedEvent = false;
            this._notify('inputCompleted', [this._model.value, this._model.textValue]);
         }
      },

      _beforeUnmount: function() {
         this._model.destroy();
      }
   });

   Component.getDefaultOptions = function() {
      return coreMerge({
         autocompleteType: 'default'
      }, IDateTimeMask.getDefaultOptions());
   };

   Component.getOptionTypes = function() {
      return coreMerge({}, IDateTimeMask.getOptionTypes());
   };

   return Component;
});
