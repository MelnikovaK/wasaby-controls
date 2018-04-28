define('Controls/Container/Input/Search',
   [
      'Core/Control',
      'tmpl!Controls/Container/Input/Search/Search'
   ],
   
   function(Control, template) {
      
      /**
       * Container component for Input
       * Notify bubbling event "search".
       * Should be located inside Controls/Container/Search.
       * @class Controls/Container/Input/Search
       * @extends Core/Control
       * @author Герасимов Александр
       * @control
       * @public
       */
      
      'use strict';
      
      var SearchContainer = Control.extend({
         
         _template: template,
         _value: '',
         
         _notifySearch: function(value) {
            this._notify('search', [value], {bubbling: true});
         },
         
         _valueChanged: function(event, value) {
            this._value = value;
            this._notifySearch(value);
         },
         
         _searchClick: function() {
            this._notifySearch(this._value);
         },
         
         _resetClick: function() {
            this._notifySearch('');
         },
         
         _keyDown: function(event) {
            if (event.nativeEvent.keyCode === 13) {
               this._notifySearch(this._value);
            }
         }
      });
      
      return SearchContainer;
   });
