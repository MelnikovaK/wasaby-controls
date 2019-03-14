define('Controls/Selector/SelectedCollection',
   [
      'Core/Control',
      'wml!Controls/Selector/SelectedCollection/SelectedCollection',
      'wml!Controls/Selector/SelectedCollection/ItemTemplate',
      'Types/chain',
      'Controls/Utils/tmplNotify',
      'Controls/Selector/SelectedCollection/Utils',
      'Types/util',
      'css!theme?Controls/Selector/SelectedCollection/SelectedCollection'
   ],

   function(Control, template, ItemTemplate, chain, tmplNotify, selectedCollectionUtils, utils) {
      'use strict';

      /**
       * Control, that display collection of items.
       *
       * @class Controls/Selector/SelectedCollection
       * @extends Core/Control
       * @mixes Controls/Selector/SelectedCollection/SelectedCollectionStyles
       * @control
       * @public
       * @author Капустин И.А.
       */

      var _private = {
         clickCallbackPopup: function(eventType, item, mouseEvent) {
            if (eventType === 'crossClick') {
               this._notify('crossClick', [item, mouseEvent]);
            } else if (eventType === 'itemClick') {
               this._notify('itemClick', [item, mouseEvent]);
            }
         },

         getItemsInArray: function(items) {
            return chain.factory(items).value();
         },

         getVisibleItems: function(items, maxVisibleItems) {
            return maxVisibleItems ? items.slice(Math.max(items.length - maxVisibleItems, 0)) : items;
         },

         getTemplateOptions: function(self, options) {
            var
               templateOptions = self._templateOptions || {},
               itemsIsChanged = self._options.items !== options.items;

            if (options.items && (!templateOptions.items || itemsIsChanged)) {
               templateOptions.items = utils.object.clone(options.items);
            }

            templateOptions.readOnly = options.readOnly;
            templateOptions.displayProperty = options.displayProperty;
            templateOptions.itemTemplate = options.itemTemplate;
            templateOptions.clickCallback = self._clickCallbackPopup;
            
            return templateOptions;
         },

         getCounterWidth: function(itemsCount, readOnly, itemsLayout) {
            // in mode read only and single line, counter does not affect the collection
            if (readOnly && itemsLayout === 'oneRow') {
               return 0;
            }

            return selectedCollectionUtils.getCounterWidth(itemsCount);
         },

         isShowCounter: function(itemsLength, maxVisibleItems) {
            return itemsLength > maxVisibleItems;
         }
      };

      var Collection = Control.extend({
         _template: template,
         _templateOptions: null,
         _items: null,
         _notifyHandler: tmplNotify,
         _counterWidth: 0,

         _beforeMount: function(options) {
            this._getItemMaxWidth = selectedCollectionUtils.getItemMaxWidth;
            this._clickCallbackPopup = _private.clickCallbackPopup.bind(this);
            this._items = _private.getItemsInArray(options.items);
            this._visibleItems = _private.getVisibleItems(this._items, options.maxVisibleItems);
            this._templateOptions = _private.getTemplateOptions(this, options);
            this._counterWidth = options._counterWidth || 0;
         },

         _beforeUpdate: function(newOptions) {
            this._items = _private.getItemsInArray(newOptions.items);
            this._visibleItems = _private.getVisibleItems(this._items, newOptions.maxVisibleItems);
            this._templateOptions = _private.getTemplateOptions(this, newOptions);

            if (_private.isShowCounter(this._items.length, newOptions.maxVisibleItems)) {
               this._counterWidth = newOptions._counterWidth || _private.getCounterWidth(this._items.length, newOptions.readOnly, newOptions.itemsLayout);
            }
         },

         _afterMount: function() {
            if (_private.isShowCounter(this._items.length, this._options.maxVisibleItems) && !this._counterWidth) {
               this._counterWidth = this._counterWidth || _private.getCounterWidth(this._items.length, this._options.readOnly, this._options.itemsLayout);

               if (this._counterWidth) {
                  this._forceUpdate();
               }
            }
         },

         _itemClick: function(event, item) {
            this._notify('itemClick', [item, event]);
         },

         _crossClick: function(event, index) {
            this._notify('crossClick', [this._visibleItems[index], event]);
         },

         _openInfoBox: function(event, config) {
            config.maxWidth = this._container.offsetWidth;
            this._notify('openInfoBox', [config]);
         }
      });

      Collection.getDefaultOptions = function() {
         return {
            itemTemplate: ItemTemplate,
            itemsLayout: 'default'
         };
      };

      Collection._private = _private;
      return Collection;
   });
