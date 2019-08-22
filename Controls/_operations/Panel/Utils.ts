import toolbars = require('Controls/toolbars');
import {showType} from 'Controls/Utils/Toolbar';
import getWidthUtil = require('Controls/Utils/getWidth');


   var MENU_WIDTH = 0;

   var _private = {
      initializeConstants: function() {
         if (!MENU_WIDTH) {
            MENU_WIDTH = window && getWidthUtil.getWidth('<span class="controls-Toolbar__menuOpen"><i class="icon-medium icon-ExpandDown"/></span>');
         }
      },

      getContentTemplate: function(item, itemTemplate, itemTemplateProperty) {
         let contentTemplate = null;
         if (itemTemplateProperty && item) {
            contentTemplate = item.get(itemTemplateProperty);
         }
         if (!contentTemplate && itemTemplate !== toolbars.ItemTemplate) {
            contentTemplate = itemTemplate;
         }
         return contentTemplate;
      },

      getItemsSizes: function(items, visibleKeys, theme, itemTemplate, itemTemplateProperty) {
         var
            measurer = document.createElement('div'),
            itemsSizes = [],
            itemsMark = '';

         visibleKeys.forEach(function(key) {
            const item = items.getRecordById(key);
            itemsMark += toolbars.ItemTemplate({
               item,
               size: 'm',
               itemsSpacing: 'medium',
               theme,
               contentTemplate: _private.getContentTemplate(item, itemTemplate, itemTemplateProperty)
            });
         });

         measurer.innerHTML = itemsMark;

         measurer.classList.add('controls-UtilsOperationsPanel__measurer');
         document.body.appendChild(measurer);
         [].forEach.call(measurer.getElementsByClassName('controls-Toolbar_item'), function(item) {
            var
               styles = window.getComputedStyle(item),
               padding = parseFloat(styles.marginLeft) + parseFloat(styles.marginRight);
            itemsSizes.push(item.clientWidth + padding);
         });
         document.body.removeChild(measurer);

         return itemsSizes;
      },

      setShowType: function(items, type) {
         items.each(function (item) {
            item.set('showType', type);
         });
      }
   };

   export = {
      fillItemsType: function(keyProperty, parentProperty, items, availableWidth, theme, defaultItemTemplate, itemTemplateProperty) {
         var
            itemsSizes,
            currentWidth,
            visibleItemsKeys = [];

         items.each(function(item) {
            if (!item.get(parentProperty)) {
               visibleItemsKeys.push(item.get(keyProperty));
            }
         });

         itemsSizes = _private.getItemsSizes(items, visibleItemsKeys, theme, defaultItemTemplate, itemTemplateProperty);
         currentWidth = itemsSizes.reduce(function(acc, width) {
            return acc + width;
         }, 0);

         if (currentWidth > availableWidth) {
            if (visibleItemsKeys.length === 1) {
               items.getRecordById(visibleItemsKeys[0]).set('withTitle', true);
               _private.setShowType(items, showType.TOOLBAR);
            } else {
               _private.initializeConstants();
               _private.setShowType(items, showType.MENU);
               currentWidth += MENU_WIDTH;

               for (var i = visibleItemsKeys.length - 1; i >= 0; i--) {
                  items.getRecordById(visibleItemsKeys[i]).set('showType', currentWidth > availableWidth ? showType.MENU : showType.MENU_TOOLBAR);
                  currentWidth -= itemsSizes[i];
               }
            }
         } else {
            _private.setShowType(items, showType.TOOLBAR);
         }

         return items;
      },
      _private // for unit testing
   };
