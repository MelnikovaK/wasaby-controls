define('Controls/Input/Search',
   [
      'Core/Control',
      'WS.Data/Type/descriptor',
      'tmpl!Controls/Input/Search/Search',
      'Controls/Input/resources/InputRender/BaseViewModel',
      'css!Controls/Input/Search/Search'
   ],

   function(Control, types, template, BaseViewModel) {
      'use strict';

      /**
       * Search input.
       *
       * @class Controls/Input/Search
       * @extends Controls/Input/Text
       * @mixes Controls/Input/interface/ISearch
       * @control
       * @public
       * @category Input
       * @author Золотова Э.Е.
       */

      /**
       * @event Controls/Input/Search#search Occurs when search button is clicked.
       */

      /**
       * @name Controls/Input/Search#style
       * @cfg {String} Field style.
       * @variant default Gray field.
       * @variant header White field.
       */

      var Search = Control.extend({
         _template: template,
         _isFocused: false,

         constructor: function(options) {
            Search.superclass.constructor.apply(this, arguments);
            this._baseViewModel = new BaseViewModel({
               value: options.value
            });
         },
   
         _beforeUpdate: function(newOptions) {
            this._baseViewModel.updateOptions({
               value: newOptions.value
            });
         },

         _notifyOnValueChanged: function(value) {
            this._notify('valueChanged', [value]);
         },

         _valueChangedHandler: function(event, value) {
            this._notifyOnValueChanged(value);
         },

         _resetClick: function() {
            //move focus from clear button to input
            this.activate();
            this._notify('resetClick');
            this._notifyOnValueChanged('');
         },

         _searchClick: function() {
            this._notify('searchClick');
         }
         
      });

      Search.getOptionTypes = function getOptionsTypes() {
         return {
            placeholder: types(String)
         };
      };

      Search.getDefaultOptions = function getDefaultOptions() {
         return {
            placeholder: rk('Найти') + '...',
            style: 'default'
         };
      };

      return Search;
   });
