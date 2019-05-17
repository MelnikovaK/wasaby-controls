import {Button as Menu, MenuUtils} from 'Controls/dropdown';
import itemTemplate = require('wml!Controls/_history/resources/itemTemplate');
import 'css!theme?Controls/_history/Menu';

var _private = {
   getMetaPinned: function (item) {
      return {
         $_pinned: !item.get('pinned')
      };
   }
};

/**
 * Button menu with history by clicking on which a drop-down list opens.
 *
 * <a href="/materials/demo-ws4-button-menu">Demo-example</a>.
 *
 * @class Controls/_history/Menu
 * @extends Controls/dropdown:Button
 * @control
 * @public
 * @author Герасимов А.М.
 * @category Menu
 * @demo Controls-demo/Menu/MenuVdom
 * @css @color_HistoryMenu-pin Pin icon color.
 * @css @color_HistoryMenu-pin_hovered  Pin icon color in hover state.
 * @css @icon-size_HistoryMenu-pin Pin icon size.
 * @css @spacing_HistoryMenu-between-itemCaption-rightBorder Spacing between item caption and right border.
 * @css @spacing_HistoryMenu-between-pin-rightBorder Spacing between pin icon and right border.
 */

var HistoryMenu = Menu.extend({
   _itemTemplate: itemTemplate,
   _filter: null,

   _beforeMount: function (options) {
      this._offsetClassName = MenuUtils.cssStyleGeneration(options);
   },

   _beforeUpdate: function (newOptions) {
      if (this._options.size !== newOptions.size || this._options.icon !== newOptions.icon ||
         this._options.viewMode !== newOptions.viewMode) {
         this._offsetClassName = MenuUtils.cssStyleGeneration(newOptions);
      }
   },

   _onItemClickHandler: function (result, items) {
      this._notify('onMenuItemActivate', [items[0]]);
   },

   _onPinClickHandler: function (event, items) {
      var self = this;
      this._options.source.update(items[0], _private.getMetaPinned(items[0])).addCallback(function (result) {
         if (!result) {
            self._children.notificationOpener.open({
               template: 'Controls/popupTemplate:NotificationSimple',
               templateOptions: {
                  style: 'error',
                  text: 'Невозможно закрепить более 10 пунктов',
                  icon: 'Alert'
               }
            });
         }
      });
   }
});

HistoryMenu._private = _private;

export = HistoryMenu;
