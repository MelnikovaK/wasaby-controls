/**
 * Created by kraynovdo on 31.01.2018.
 */
import BaseControl = require('Core/Control');
import template = require('wml!Controls/_filterPopup/History/List');
import chain = require('Types/chain');
import {isEqual} from 'Types/object';
import Utils = require('Types/util');
import {HistoryUtils} from 'Controls/filter';
import 'css!theme?Controls/filterPopup';


   var MAX_NUMBER_ITEMS = 5;

   var getPropValue = Utils.object.getPropertyValue.bind(Utils);

   var _private = {
      getItemId: function(item) {
         let id;
         if (item.hasOwnProperty('id')) {
            id = getPropValue(item, 'id');
         } else {
            id = getPropValue(item, 'name');
         }
         return id;
      },

      getStringHistoryFromItems: function(items, resetValues) {
         var textArr = [];
         chain.factory(items).each(function(elem) {
            var value = getPropValue(elem, 'value'),
               resetValue = resetValues[_private.getItemId(elem)],
               textValue = getPropValue(elem, 'textValue'),
               visibility = getPropValue(elem, 'visibility');

            if (!isEqual(value, resetValue) && (visibility === undefined || visibility) && textValue) {
               textArr.push(textValue);
            }
         });
         return textArr.join(', ');
      },

      getResetValues: function(items) {
         var result = {};
         chain.factory(items).each(function(item) {
            result[_private.getItemId(item)] = getPropValue(item, 'resetValue');
         });
         return result;
      },

      onResize: function(self) {
         var arrowVisibility = self._arrowVisible;
         self._arrowVisible = self._options.items.getCount() > MAX_NUMBER_ITEMS;

         if (arrowVisibility !== self._arrowVisible) {
            self._isMaxHeight = true;
            self._forceUpdate();
         }
      }
   };

   var HistoryList = BaseControl.extend({
      _template: template,
      _historySource: null,
      _isMaxHeight: true,
      _itemsText: null,

      _beforeMount: function(options) {
         if (options.items) {
            this._itemsText = this._getText(options.items, options.filterItems, HistoryUtils.getHistorySource(options.historyId));
         }
      },

      _beforeUpdate: function(newOptions) {
         if (!isEqual(this._options.items, newOptions.items)) {
            this._itemsText = this._getText(newOptions.items, newOptions.filterItems, HistoryUtils.getHistorySource(newOptions.historyId));
         }
      },

      _onPinClick: function(event, item) {
         HistoryUtils.getHistorySource(this._options.historyId).update(item, {
            $_pinned: !item.get('pinned')
         });
         this._notify('historyChanged');
      },
      _contentClick: function(event, item) {
         var items = HistoryUtils.getHistorySource(this._options.historyId).getDataObject(item.get('ObjectData'));
         this._notify('applyHistoryFilter', [items]);
      },

      _afterMount: function() {
         _private.onResize(this);
      },

      _afterUpdate: function() {
         _private.onResize(this);
      },

      _getText: function(items, filterItems, historySource) {
         var itemsText = {};

         // the resetValue is not stored in history, we take it from the current filter items
         var resetValues = _private.getResetValues(filterItems);
         chain.factory(items).each(function(item, index) {
            var text = '';
            var historyItems = historySource.getDataObject(item.get('ObjectData'));
            if (historyItems) {
               text = _private.getStringHistoryFromItems(historyItems, resetValues);
            }
            itemsText[index] = text;
         });
         return itemsText;
      },

      _clickSeparatorHandler: function() {
         this._isMaxHeight = !this._isMaxHeight;
      }
   });

   HistoryList._private = _private;
   export = HistoryList;

