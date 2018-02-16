/**
 * Created by kraynovdo on 22.09.2017.
 */
define('Controls/List/SimpleList/ListView', [
   'Core/Control',
   'tmpl!Controls/List/SimpleList/ListView/ListView',
   'Controls/List/resources/utils/ItemsUtil',
   'tmpl!Controls/List/SimpleList/ItemTemplate',
   'css!Controls/List/SimpleList/ListView/ListView'
], function (BaseControl,
             ListViewTpl,
             ItemsUtil,
             defaultItemTemplate
   ) {
   'use strict';

   var _private = {
      onListChange: function(self) {
         self._forceUpdate();
         self._notify('resize', [], {bubbling: true})
      }
   };

   var ListView = BaseControl.extend(
      {
         _controlName: 'Controls/List/ListControl/ListView',

         _listModel: null,
         _template: ListViewTpl,
         _defaultItemTemplate: defaultItemTemplate,

         constructor: function (cfg) {
            ListView.superclass.constructor.apply(this, arguments);
            var self = this;
            this._onListChangeFnc = function() {
               _private.onListChange(self);
            }
         },

         _beforeMount: function(newOptions) {
            if (newOptions.listModel) {
               this._listModel = newOptions.listModel;
               this._listModel.subscribe('onListChange', this._onListChangeFnc);
            }
            this._itemTemplate = newOptions.itemTemplate || this._defaultItemTemplate;
         },

         _beforeUpdate: function(newOptions) {
            if (newOptions.listModel && (this._listModel != newOptions.listModel)) {
               this._listModel = newOptions.listModel;
               this._listModel.subscribe('onListChange', this._onListChangeFnc);
            }
            this._itemTemplate = newOptions.itemTemplate || this._defaultItemTemplate;
         },

         _onItemClick: function(e, dispItem) {
            var item, newKey;
            item = dispItem.getContents();
            newKey = ItemsUtil.getPropertyValue(item, this._options.idProperty);
            this._listModel.setMarkedKey(newKey);
            this._notify('itemClick', [item], {bubbling: true});
         }
      });



   return ListView;
});