/**
 * Created by am.gerasimov on 30.01.2017.
 */
/**
 * Created by am.gerasimov on 23.01.2017.
 */
define('SBIS3.CONTROLS/Filter/FavoriteEditDialog',
   [
      'SBIS3.CONTROLS/FormController',
      'tmpl!SBIS3.CONTROLS/Filter/FavoriteEditDialog/FavoriteEditDialog',
      'Core/helpers/Object/isEqual',
      'tmpl!SBIS3.CONTROLS/Filter/FavoriteEditDialog/itemTpl',
      'css!SBIS3.CONTROLS/Filter/FavoriteEditDialog/FavoriteEditDialog',
      'SBIS3.CONTROLS/TextBox',
      'SBIS3.CONTROLS/CheckBox',
      'SBIS3.CONTROLS/DropdownList'
   ],

   function(FormController, template, isEqual) {

      'use strict';

      var normalizeItems = function(filterItems, idField, captionField, valueField) {
         var items = [];
         filterItems.forEach(function (item) {
            if (!isEqual(item.value, item.resetValue) && item[valueField]) {
               items.push({
                  id: item[idField],
                  checkBoxCaption: item[captionField],
                  value: item[valueField]
               });
            }
         });
         return items;
      };

      var FavoriteEditDialog = FormController.extend({
         _dotTplFn: template,
         $protected: {
            _options: {
               width: '400px'
            }
         },

         $constructor: function() {
            var window = this.getParent();
            window._options.resizable = false;
         },
         
         _modifyOptions: function() {
            var
               items = [],
               options = FavoriteEditDialog.superclass._modifyOptions.apply(this, arguments),
               filterPanelItems = options.record.get('filterPanelItems'),
               filter = options.record.get('filter');

            if (filterPanelItems) {
               //Набираем содержимое диалога по новыому формату фильтра
               items = normalizeItems(filterPanelItems, 'id', 'caption', 'textValue');
            } else if (filter) {
               //Набираем содержимое диалога по старому формату фильтра
               items = normalizeItems(filter, 'internalValueField', 'title', 'caption');
            }

            options._items = items;
            return options;
         }
      });

      return FavoriteEditDialog;

   });