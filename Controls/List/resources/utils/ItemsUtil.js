define('Controls/List/resources/utils/ItemsUtil', [
   'Types/display',
   'Core/core-instance',
   'Types/util'
], function(displayLib, cInstance, Utils) {
   var ItemsUtil = {

      getDefaultDisplayFlat: function(items, cfg, filter) {
         var projCfg = {};
         projCfg.keyProperty = cfg.keyProperty;
         if (cfg.groupMethod) {
            projCfg.group = cfg.groupMethod;
         }
         if (cfg.groupingKeyCallback) {
            projCfg.group = cfg.groupingKeyCallback;
         }
         if (cfg.loadItemsStrategy === 'merge') {
            projCfg.unique = true;
         }
         projCfg.filter = filter;
         return displayLib.Abstract.getDefaultDisplay(items, projCfg);
      },

      getPropertyValue: function(itemContents, field) {
         if (!(itemContents instanceof Object)) {
            return itemContents;
         } else {
            return Utils.object.getPropertyValue(itemContents, field);
         }
      },

      //TODO это наверное к Лехе должно уехать
      getDisplayItemById: function(display, id, keyProperty) {
         var list = display.getCollection();
         if (cInstance.instanceOfModule(list, 'Types/collection:RecordSet')) {
            return display.getItemBySourceItem(list.getRecordById(id));
         } else {
            var resItem;
            display.each(function(item, i) {
               if (ItemsUtil.getPropertyValue(item.getContents(), keyProperty) == id) {
                  resItem = item;
               }
            });
            return resItem;
         }
      },

      getDefaultDisplayItem: function(display, item) {
         return display.createItem({contents: item});
      },

      getFirstItem: function(display) {
         var
            itemIdx = 0,
            item,
            itemsCount = display.getCount();
         while (itemIdx < itemsCount) {
            item = display.at(itemIdx).getContents();
            if (cInstance.instanceOfModule(item, 'Types/entity:Model')) {
               return display.at(itemIdx).getContents();
            }
            itemIdx++;
         }
      },

      getLastItem: function(display) {
         var
            itemIdx = display.getCount() - 1,
            item;
         while (itemIdx >= 0) {
            item = display.at(itemIdx).getContents();
            if (cInstance.instanceOfModule(item, 'Types/entity:Model')) {
               return display.at(itemIdx).getContents();
            }
            itemIdx--;
         }
      }
   };
   return ItemsUtil;
});
