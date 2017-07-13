define('js!WSControls/Lists/resources/utils/ItemsUtil', [
   'js!WS.Data/Display/Display',
   'Core/core-instance',
   'js!WS.Data/Utils'
], function(Display, cInstance, DataUtils) {
   var ItemsUtil = {

      getDefaultDisplayFlat: function(items, cfg) {
         var projCfg = {};
         projCfg.idProperty = cfg.idProperty;
         if (cfg.itemsSortMethod) {
            projCfg.sort = cfg.itemsSortMethod;
         }
         if (cfg.itemsFilterMethod) {
            projCfg.filter = cfg.itemsFilterMethod;
         }
         if (cfg.groupBy) {
            var method;
            if (!cfg.groupBy.method) {
               var field = cfg.groupBy.field;

               method = function (item, index, projItem) {
                  //делаем id группы строкой всегда, чтоб потом при обращении к id из верстки не ошибаться
                  return ItemsUtil.getPropertyValue(item, field) + '';
               }
            }
            else {
               method = cfg.groupBy.method
            }
            projCfg.group = method;
         }
         if (cfg.loadItemsStrategy == 'merge') {
            projCfg.unique = true;
         }
         return Display.getDefaultDisplay(items, projCfg);
      },

      getPropertyValue: function (itemContents, field) {
         if (typeof itemContents == 'string') {
            return itemContents;
         }
         else {
            return DataUtils.getItemPropertyValue(itemContents, field);
         }
      }
   };
   return ItemsUtil;
});
