import Sticky = require('Controls/Popup/Opener/Sticky');
import Merge = require('Core/core-merge');
import getZIndex = require('Controls/Utils/getZIndex');
import Env = require('Env/Env');

var _private = {

   /**
    * Возвращает размер иконки
    * @param icon
    * @returns {*}
    */
   getIconSize: function (icon, optIconSize) {
      var iconSizes = ['icon-small', 'icon-medium', 'icon-large', 'icon-size'],
         iconSize;
      if (optIconSize) {
         switch (optIconSize) {
            case 's':
               iconSize = iconSizes[0];
               break;
            case 'm':
               iconSize = iconSizes[1];
               break;
            case 'l':
               iconSize = iconSizes[2];
               break;
         }
      } else {
         iconSizes.forEach(function (size) {
            if (icon.indexOf(size) !== -1) {
               iconSize = size;
            }
         });
      }
      return iconSize;
   },

   /**
    * Обходим все дерево для пунктов и проверяем наличие иконки у хотя бы одного в каждом меню
    * При наличии таковой делаем всем пунктам в этом меню фэйковую иконку для их сдвига.
    * @param self
    * @param config
    */
   checkIcons: function (self, config) {
      var templateOptions = Merge(config.templateOptions, self._options.templateOptions || {}),
         parentProperty = templateOptions && templateOptions.parentProperty,
         items = templateOptions && templateOptions.items,
         headerIcon = templateOptions && (templateOptions.headConfig && templateOptions.headConfig.icon || templateOptions.showHeader && templateOptions.icon),
         optIconSize = templateOptions && templateOptions.iconSize,
         rootKey = templateOptions && templateOptions.rootKey,
         menuStyle = templateOptions && templateOptions.headConfig && templateOptions.headConfig.menuStyle,
         parents = {},
         iconSize, pid, icon;

      // необходимо учесть иконку в шапке
      if (headerIcon && menuStyle !== 'titleHead') {
         parents[parentProperty ? rootKey || 'null' : 'undefined'] = [null, this.getIconSize(headerIcon, optIconSize)];
      }

      items.each(function (item) {
         icon = item.get('icon');
         if (icon) {
            pid = item.get(parentProperty);
            if (!parents.hasOwnProperty(pid)) {
               iconSize = _private.getIconSize(icon, optIconSize);
               parents[pid] = [pid, iconSize];
            }
         }
      });

      templateOptions.iconPadding = parents;
   },

   setTemplateOptions: function (self, config) {
      var pOptions = self._options.popupOptions || {};
      if (pOptions.templateOptions && pOptions.templateOptions.headConfig) {
         pOptions.templateOptions.headConfig.menuStyle = pOptions.templateOptions.headConfig.menuStyle || 'defaultHead';
      }
      this.checkIcons(self, config);
   },
   setPopupOptions: function (self, popupOptions) {
      popupOptions.className = popupOptions.className || self._options.className || self._options.popupOptions.className;
      popupOptions.template = 'Controls/Dropdown/resources/template/DropdownList';
      popupOptions.closeOnOutsideClick = true;
   }
};

/**
 * Opener for dropdown menu.
 *
 * @class Controls/_dropdown/Opener
 * @mixes Controls/interface/IDropdownList
 * @extends Controls/Popup/Opener/Sticky
 * @control
 * @public
 * @author Красильников А.С.
 * @category Popup
 */

var DropdownOpener = Sticky.extend({
   _itemTemplateDeferred: undefined,

   open: function (popupOptions, opener) {
      _private.setTemplateOptions(this, popupOptions);
      _private.setPopupOptions(this, popupOptions);

      // To place zIndex in the old environment
      popupOptions.zIndex = getZIndex(this);
      DropdownOpener.superclass.open.apply(this, arguments);
   }
});

DropdownOpener._private = _private;

DropdownOpener.getDefaultOptions = function () {
   return Merge(
      Sticky.getDefaultOptions(), {
         closeOnTargetScroll: true,
         _vdomOnOldPage: true
      });
};


export = DropdownOpener;