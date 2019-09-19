import Control = require('Core/Control');
import template = require('wml!Controls/_lookup/SelectedCollection/SelectedCollection');
import ItemTemplate = require('wml!Controls/_lookup/SelectedCollection/ItemTemplate');
import chain = require('Types/chain');
import tmplNotify = require('Controls/Utils/tmplNotify');
import selectedCollectionUtils = require('Controls/_lookup/SelectedCollection/Utils');
import utils = require('Types/util');
import ContentTemplate = require('wml!Controls/_lookup/SelectedCollection/_ContentTemplate');
import CrossTemplate = require('wml!Controls/_lookup/SelectedCollection/_CrossTemplate');
import CounterTemplate = require('wml!Controls/_lookup/SelectedCollection/CounterTemplate');
import {SyntheticEvent} from 'Vdom/Vdom';
import {Model} from 'Types/entity';
import 'css!theme?Controls/lookup';

/**
 * Контрол, отображающий коллекцию элементов.
 *
 * @class Controls/_lookup/SelectedCollection
 * @extends Core/Control
 * @mixes Controls/_lookup/SelectedCollection/SelectedCollectionStyles
 * @control
 * @author Капустин И.А.
 */
/*
 * Control, that display collection of items.
 *
 * @class Controls/_lookup/SelectedCollection
 * @extends Core/Control
 * @mixes Controls/_lookup/SelectedCollection/SelectedCollectionStyles
 * @control
 * @author Kapustin I.A.
 */


var
   JS_CLASS_CAPTION_ITEM = '.js-controls-SelectedCollection__item__caption',
   JS_CLASS_CROSS_ITEM = '.js-controls-SelectedCollection__item__cross';

var _private = {
   clickCallbackPopup: function (eventType, item) {
      if (eventType === 'crossClick') {
         this._notify('crossClick', [item]);
      } else if (eventType === 'itemClick') {
         this._notify('itemClick', [item]);
      }
   },

   getItemsInArray: function (items) {
      return chain.factory(items).value();
   },

   getVisibleItems: function (items, maxVisibleItems) {
      return maxVisibleItems ? items.slice(Math.max(items.length - maxVisibleItems, 0)) : items;
   },

   getTemplateOptions: function (self, options) {
      var
         templateOptions = {},
         options = self._options,

      if (options.items) {
         templateOptions.items = utils.object.clone(options.items);
      }

      templateOptions.readOnly = options.readOnly;
      templateOptions.displayProperty = options.displayProperty;
      templateOptions.itemTemplate = options.itemTemplate;
      templateOptions.clickCallback = self._clickCallbackPopup;

      return templateOptions;
   },

   getCounterWidth: function (itemsCount, readOnly, itemsLayout) {
      // in mode read only and single line, counter does not affect the collection
      if (readOnly && itemsLayout === 'oneRow') {
         return 0;
      }

      return selectedCollectionUtils.getCounterWidth(itemsCount);
   },

   isShowCounter: function (itemsLength, maxVisibleItems) {
      return itemsLength > maxVisibleItems;
   }
};

var Collection = Control.extend({
   _template: template,
   _items: null,
   _notifyHandler: tmplNotify,
   _counterWidth: 0,
   _contentTemplate: ContentTemplate,
   _crossTemplate: CrossTemplate,
   _counterTemplate: CounterTemplate,

   _beforeMount: function (options) {
      this._getItemMaxWidth = selectedCollectionUtils.getItemMaxWidth;
      this._clickCallbackPopup = _private.clickCallbackPopup.bind(this);
      this._items = _private.getItemsInArray(options.items);
      this._visibleItems = _private.getVisibleItems(this._items, options.maxVisibleItems);
      this._counterWidth = options._counterWidth || 0;
   },

   _beforeUpdate: function (newOptions) {
      this._items = _private.getItemsInArray(newOptions.items);
      this._visibleItems = _private.getVisibleItems(this._items, newOptions.maxVisibleItems);

      if (_private.isShowCounter(this._items.length, newOptions.maxVisibleItems)) {
         this._counterWidth = newOptions._counterWidth || _private.getCounterWidth(this._items.length, newOptions.readOnly, newOptions.itemsLayout);
      }
   },

   _afterMount: function () {
      if (_private.isShowCounter(this._items.length, this._options.maxVisibleItems) && !this._counterWidth) {
         this._counterWidth = this._counterWidth || _private.getCounterWidth(this._items.length, this._options.readOnly, this._options.itemsLayout);

         if (this._counterWidth) {
            this._forceUpdate();
         }
      }
   },

   _itemClick(event: SyntheticEvent, item: Model): void {
      let eventName: string;

      if (event.target.closest(JS_CLASS_CAPTION_ITEM)) {
         eventName = 'itemClick';
      } else if (event.target.closest(JS_CLASS_CROSS_ITEM)) {
         eventName = 'crossClick';
      }

      if (eventName) {
         event.stopPropagation();
         this._notify(eventName, [item]);
      }
   },

   _openInfoBox: function (event) {
      var config = {
         target: this._children.infoBoxLink,
         opener: this,
         width: this._container.offsetWidth,
         templateOptions: _private.getTemplateOptions(this)
      };

      this._notify('openInfoBox', [config]);
      this._children.infoBox.open(config);
   }
});

Collection.getDefaultOptions = function () {
   return {
      itemTemplate: ItemTemplate,
      itemsLayout: 'default'
   };
};

Collection._private = _private;
export = Collection;

