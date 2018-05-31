/**
 * Created by am.gerasimov on 18.04.2018.
 */
define('Controls/Container/Suggest/List',
   [
      'Core/Control',
      'tmpl!Controls/Container/Suggest/List/List',
      'Core/core-clone',
      'Controls/Layout/Suggest/_SuggestOptionsField'
   ],
   
   function(Control, template, clone, _SuggestOptionsField) {
      
      /**
       * Container for list inside Suggest.
       *
       * @class Controls/Container/Suggest/List
       * @extends Core/Control
       * @author Герасимов Александр
       * @control
       * @public
       */
      
      'use strict';
      
      var _private = {
         checkContext: function(self, context) {
            if (context && context.suggestOptionsField) {
               self._suggestListOptions = context.suggestOptionsField.options;
      
               if (self._suggestListOptions.dialogMode) {
                  var navigation = clone(self._suggestListOptions.navigation);
                  navigation.view = 'infinity';
                  self._navigation = navigation;
               } else {
                  self._navigation = self._suggestListOptions.navigation;
               }
            }
         }
      };
      
      var List = Control.extend({
         
         _template: template,
         
         _beforeMount: function(options, context) {
            _private.checkContext(this, context);
         },
         
         _beforeUpdate: function(newOptions, context) {
            _private.checkContext(this, context);
         },
   
         _tabsSelectedKeyChanged: function(event, key) {
            this._notify('tabsSelectedKeyChanged', [key]);
         }
      });
   
      List.contextTypes = function() {
         return {
            suggestOptionsField: _SuggestOptionsField
         };
      };
      
      return List;
   });

