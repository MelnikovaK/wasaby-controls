/**
 * Created by am.gerasimov on 27.11.2017.
 */
define('js!Controls/Input/resources/SuggestController',
   [
      'Core/Abstract',
      'Core/moduleStubs',
      'Core/core-clone'
   ], function (Abstract, moduleStubs, cClone) {
   
   'use strict';
   
   var _private = {
      /**
       * Search and show popup
       * @param self
       */
      showPopup: function(self) {
         _private.getSuggestPopupController(self).addCallback(function(suggestPopupController) {
            suggestPopupController.setSearchFilter(_private.getSearchFilter(self));
            suggestPopupController.setPopupOptions(_private.getPopupOptions(self));
            suggestPopupController.showPopup();
            return suggestPopupController;
         });
      },
   
      /**
       * Abort search
       * @param self
       */
      hidePopup: function(self) {
         _private.getSuggestPopupController(self).addCallback(function (suggestPopupController) {
            suggestPopupController.hidePopup();
            return suggestPopupController;
         });
      },
      
      getSearchFilter: function(self) {
         var filter = cClone(self._options.filter || {});
         filter[self._options.searchParam] = self._value;
         return filter;
      },
      
      needShowPopup: function(self) {
         return self._value.length >= self._options.minSearchLength;
      },
      
      onChangeValueHandler: function(self) {
         if (_private.needShowPopup(self)) {
            _private.showPopup(self);
         } else {
            _private.hidePopup(self);
         }
      },
      
      getPopupOptions: function(self) {
         var container = self._options.textComponent._container;
         return {
            target: container,
            componentOptions: {
               width: container.offsetWidth,
               template: self._options.suggestTemplate,
               dataSource: self._options.dataSource,
               showAllOpener: self._options.showAllOpener
            }
         };
      },
   
      getSuggestPopupController: function(self) {
         /* loading SuggestPopupController and preloading suggest template */
         return moduleStubs.require(['js!Controls/Input/resources/SuggestPopupController', self._options.suggestTemplate]).addCallback(function(result) {
            if (!self._suggestPopupController) {
               self._suggestPopupController = new result[0]({
                  dataSource: self._options.dataSource,
                  searchDelay: self._options.searchDelay,
                  popupOpener: self._options.suggestOpener,
                  navigation: self._options.navigation,
                  selectCallback: self._options.selectCallback
               });
            }
            return self._suggestPopupController;
         });
      },
      
      destroy: function(self) {
         if (self._suggestPopupController) {
            self._suggestPopupController.hidePopup();
            self._suggestPopupController = null;
         }
      }
   };
   
   var SuggestController = Abstract.extend({
      
      _value: '',
      
      constructor: function(options) {
         SuggestController.superclass.constructor.call(this, options);
         this._options = options;
      },
      
      setValue: function(value) {
         this._value = value;
         _private.onChangeValueHandler(this);
      },
      
      keyDown: function(event) {
         if (this._suggestPopupController) {
            this._suggestPopupController.keyDown(event);
         }
      },
      
      destroy: function() {
         _private.destroy(this);
         SuggestController.superclass.destroy.call(this);
      },
   
      _moduleName: 'Controls/Input/resources/SuggestController'
   });
   
   /** For test **/
   SuggestController._private = _private;
   
   return SuggestController;
   
});