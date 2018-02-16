define('Controls/Input/Search',
   [
      'Core/Control',
      'WS.Data/Type/descriptor',
      'tmpl!Controls/Input/Search/Search',
      'Controls/Input/resources/InputRender/SimpleViewModel',
      'css!Controls/Input/Search/Search'
   ],

   function (Control, types, template, SimpleViewModel) {
      'use strict';

      /**
       * Строка поиска с кнопкой
       * @class Controls/Input/Search
       * @extends Controls/Input/Text
       * @mixes Controls/Input/interface/ISearch
       * @control
       * @public
       * @category Input
       * @author Золотова Э.Е.
       */

      /**
       * @event Controls/Input/Search#search Происходит при нажатии на кнопку поиска
       */

      var Search = Control.extend({
         _template: template,

         constructor: function (options) {
            Search.superclass.constructor.apply(this, arguments);
            this._simpleViewModel = new SimpleViewModel();
         },

         _notifyOnValueChanged: function(value) {
            this._notify('valueChanged', [value]);
            this._applySearch(value);
         },

         _valueChangedHandler: function (event, value) {
            this._notifyOnValueChanged(value);
         },

         //Собственно поиск
         _applySearch: function (value) {
            this._notify('search', [value], {bubbling: true});
         },

         _onResetClick: function () {
            this._notifyOnValueChanged('');
         },

         _onSearchClick: function () {
            this._applySearch(this._options.value);
         },

         _keyDownHandler: function (event) {
            if (event.nativeEvent.keyCode == 13) {
               this._applySearch(this._options.value);
            }
         }
      });

      Search.getOptionTypes = function getOptionsTypes() {
         return {
            placeholder: types(String)
         };
      };

      Search.getDefaultOptions = function getDefaultOptions() {
         return {
            placeholder: rk('Найти')+'...'
         };
      };

      return Search;
   });