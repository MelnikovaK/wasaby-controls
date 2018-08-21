define('Controls/History/Menu',
   [
      'Controls/Button/Menu',
      'tmpl!Controls/History/resources/itemTemplate',
      'Core/core-merge',
      'Core/helpers/Object/isEqual',
      'css!Controls/History/Menu'
   ],
   function(Menu, itemTemplate, merge, isEqual) {
      /**
       * Button
       *
       * @class Controls/History/Menu
       * @extends Controls/Button/Menu
       * @control
       * @public
       * @category Menu
       * @demo Controls-demo/Menu/MenuVdom
       */

      /**
       * @name Controls/History/Menu#historySource
       * @cfg {Object} The special source whose has two source inside.
       * The first source is standard, the second source determines where the data will be stored.
       * If you use History/Service, then it will work with the History of Input service
       */

      /**
       * @name Controls/History/Menu#historyId
       * @cfg {String} history id
       */

      'use strict';
   
      var _private = {
         getMetaPinned: function(item) {
            return {
               $_pinned: !item.get('pinned')
            };
         },
      
         getMetaHistory: function() {
            return  {
               $_history: true
            };
         },
         prepareFilter: function(filter) {
            return merge(_private.getMetaHistory(), filter);
         }
      };
   
      var HistoryMenu = Menu.extend({
         _itemTemplate: itemTemplate,
         _filter: null,

         _beforeMount: function(options) {
            this._filter = _private.prepareFilter(options.filter);
         },
         
         _beforeUpdate: function(newOptions) {
            if (!isEqual(this._options.filter, newOptions.filter)) {
               this._filter = _private.prepareFilter(newOptions.filter);
            }
         },

         _onItemClickHandler: function(result, items) {
            this._notify('onMenuItemActivate', [items[0]]);
            this._options.source.update(items[0], _private.getMetaHistory());
            this._items = this._options.source.getItems();
         },

         _onPinClickHandler: function(event, items) {
            if (!this._options.source.update(items[0], _private.getMetaPinned(items[0]))) {
               this._children.notificationOpener.open({
                  template: 'tmpl!Controls/Popup/Templates/Notification/Simple',
                  templateOptions: {
                     style: 'error',
                     text: 'Невозможно закрепить более 10 пунктов',
                     icon: 'Alert'
                  }
               });
            }
            this._items = this._options.source.getItems();
         }
      });
   
      HistoryMenu._private = _private;
      
      return HistoryMenu;
   }
);
