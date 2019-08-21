import Control = require('Core/Control');
import template = require('wml!Controls/_filter/Controller');
import Deferred = require('Core/Deferred');
import chain = require('Types/chain');
import Utils = require('Types/util');
import {isEqual} from 'Types/object';
import historyUtils = require('Controls/_filter/HistoryUtils');
import {Controller as SourceController} from 'Controls/source';
import merge = require('Core/core-merge');
import clone = require('Core/core-clone');
import isEmpty = require('Core/helpers/Object/isEmpty');
import 'Controls/context';

      var getPropValue = Utils.object.getPropertyValue.bind(Utils);
      var setPropValue = Utils.object.setPropertyValue.bind(Utils);

      var _private = {
         getItemsByOption: function(option, history) {
            var result;

            if (option) {
               if (typeof option === 'function') {
                  result = option(history);
               } else if (history) {
                  _private.mergeFilterItems(option, history);
                  result = option;
               } else {
                  result = option;
               }
            }

            return result;
         },

         isEqualItems: function(item1, item2) {
            return !!(getPropValue(item1, 'id') && (getPropValue(item1, 'id') === getPropValue(item2, 'id'))
            || (getPropValue(item1, 'name') && getPropValue(item1, 'name') === getPropValue(item2, 'name')));
         },

         equalItemsIterator: function(filterButtonItems, fastFilterItems, prepareCallback) {
            chain.factory(filterButtonItems).each(function(buttonItem, index) {
               chain.factory(fastFilterItems).each(function(fastItem) {
                  if (_private.isEqualItems(buttonItem, fastItem)
                      && fastItem.hasOwnProperty('textValue') && buttonItem.hasOwnProperty('textValue')) {
                     prepareCallback(index, fastItem);
                  }
               });
            });
         },

         prepareHistoryItems: function(filterButtonItems, fastFilterItems) {
            var historyItems = [];
            function setTextValue(index, item) {
               setPropValue(historyItems[index], 'textValue', getPropValue(item, 'textValue'));
            }
            if (filterButtonItems && fastFilterItems) {
               historyItems = _private.cloneItems(filterButtonItems);

               _private.equalItemsIterator(filterButtonItems, fastFilterItems, setTextValue);
            } else {
               historyItems = _private.cloneItems(filterButtonItems || fastFilterItems);
            }
            return _private.minimizeFilterItems(historyItems);
         },

         minimizeItem: function(item) {
            const textValue = getPropValue(item, 'textValue');
            // Two case of saving filter in history
            // 1 case - need to hide textValue in line near button, but save value in history
            // 2 case - need to hide textValue in line near button and not save value in history
            // if textValue is empty string (''), save filter in history
            // if textValue is null, do not save
            const isNeedSaveHistory = textValue !== undefined && textValue !== null;
            const visibility = !isNeedSaveHistory && getPropValue(item, 'visibility') ? false : getPropValue(item, 'visibility');
            let minItem = {
               visibility: visibility
            };

            if (isNeedSaveHistory) {
               minItem.value = getPropValue(item, 'value');
            }

            if (visibility !== false && textValue !== getPropValue(item, 'resetTextValue')) {
               minItem.textValue = getPropValue(item, 'textValue');
            }

            if (getPropValue(item, 'id')) {
               minItem.id = getPropValue(item, 'id');
            } else {
               minItem.name = getPropValue(item, 'name');
               minItem.viewMode = getPropValue(item, 'viewMode');
            }
            return minItem;
         },

         minimizeFilterItems: function(items) {
            var minItems = [];
            chain.factory(items).each(function(item) {
               minItems.push(_private.minimizeItem(item));
            });
            return minItems;
         },

         getHistoryItems: function(self, id) {
            let result, recent, lastFilter;

            if (!id) {
               result =  Deferred.success([]);
            }

            if (id) {
               let source = historyUtils.getHistorySource(id);

               if (!self._sourceController) {
                  self._sourceController = new SourceController({
                     source: source
                  });
               }

               result = new Deferred();

               self._sourceController.load({ $_history: true })
                  .addCallback(function(res) {
                     recent = source.getRecent();
                     if (recent.getCount()) {
                        lastFilter = recent.at(0);
                        result.callback(source.getDataObject(lastFilter.get('ObjectData')));
                     } else {
                        result.callback([]);
                     }
                     return res;
                  })
                  .addErrback(function(error) {
                     error.processed = true;
                     result.callback([]);
                     return error;
                  });
            }

            return result;
         },

         updateHistory: function(self, filterButtonItems, fastFilterItems, historyId) {
            var meta = {
               '$_addFromData': true
            };

            function update() {
               historyUtils.getHistorySource(historyId).update(_private.getHistoryData(filterButtonItems, fastFilterItems), meta);
            }

            if (!historyUtils.getHistorySource(historyId)._history) {
               // Getting history before updating if it hasn’t already done
               _private.getHistoryItems(self, historyId).addCallback(function() {
                  update();
               });
            } else {
               update();
            }
         },

         itemsIterator: function(filterButtonItems, fastDataItems, differentCallback, equalCallback) {
            function processItems(items) {
               chain.factory(items).each(function(elem) {
                  let value = getPropValue(elem, 'value');
                  let visibility = getPropValue(elem, 'visibility');
                  let viewMode = getPropValue(elem, 'viewMode');

                  if (value !== undefined && ((visibility === undefined || visibility === true) || viewMode === 'frequent')) {
                     if (differentCallback) {
                        differentCallback(elem);
                     }
                  } else if (equalCallback) {
                     equalCallback(elem);
                  }
               });
            }

            if (filterButtonItems) {
               processItems(filterButtonItems);
            }

            if (fastDataItems) {
               processItems(fastDataItems);
            }
         },

         getFilterByItems: function(filterButtonItems, fastFilterItems) {
            var filter = {};

            function processItems(elem) {
               filter[getPropValue(elem, 'id') ? getPropValue(elem, 'id') : getPropValue(elem, 'name')] = getPropValue(elem, 'value');
            }

            _private.itemsIterator(filterButtonItems, fastFilterItems, processItems);

            return filter;
         },

         isFilterChanged: function(filterButtonItems, fastFilterItems) {
            var filter = {};

            function processItems(elem) {
               // The filter can be changed by another control, in which case the value is set to the filter button, but textValue is not set.
               if (!isEqual(getPropValue(elem, 'value'), getPropValue(elem, 'resetValue')) &&
                   getPropValue(elem, 'textValue') !== undefined && getPropValue(elem, 'textValue') !== null) {
                  filter[getPropValue(elem, 'id') ? getPropValue(elem, 'id') : getPropValue(elem, 'name')] = getPropValue(elem, 'value');
               }
            }

            _private.itemsIterator(filterButtonItems, fastFilterItems, processItems);

            return !isEmpty(filter);
         },

         getEmptyFilterKeys: function(filterButtonItems, fastFilterItems) {
            var removedKeys = [];

            function processItems(elem) {
               removedKeys.push(getPropValue(elem, 'id') ? getPropValue(elem, 'id') : getPropValue(elem, 'name'));
            }

            _private.itemsIterator(filterButtonItems, fastFilterItems, null, processItems);

            return removedKeys;
         },

         setFilterItems: function(self, filterButtonOption, fastFilterOption, historyItems) {
            self._filterButtonItems = _private.getItemsByOption(filterButtonOption, historyItems);
            self._fastFilterItems = _private.getItemsByOption(fastFilterOption, historyItems);
         },

         setFilterButtonItems: function(filterButtonItems, fastFilterItems) {
            function prepareFastFilterItem(index) {
               // Fast filters could not be reset from the filter button. We set flag for filters duplicated in the fast filter.
               filterButtonItems[index].isFast = true;
            }
            _private.equalItemsIterator(filterButtonItems, fastFilterItems, prepareFastFilterItem);
         },

         resolveFilterButtonItems: function(filterButtonItems, fastFilterItems) {
            if (filterButtonItems && fastFilterItems) {
               _private.setFilterButtonItems(filterButtonItems, fastFilterItems);
            }
         },

         updateFilterItems: function(self, newItems) {
            if (self._filterButtonItems) {
               self._filterButtonItems = _private.cloneItems(self._filterButtonItems);
               _private.mergeFilterItems(self._filterButtonItems, newItems);
            }

            if (self._fastFilterItems) {
               self._fastFilterItems = _private.cloneItems(self._fastFilterItems);
               _private.mergeFilterItems(self._fastFilterItems, newItems);
            }

            _private.resolveFilterButtonItems(self._filterButtonItems, self._fastFilterItems);
         },

         resolveItems: function(self, historyId, filterButtonItems, fastFilterItems, historyItems) {
            var historyItemsDef = historyItems ? Deferred.success(historyItems) : _private.getHistoryItems(self, historyId);

            return historyItemsDef.addCallback(function(historyItems) {
               _private.setFilterItems(self, filterButtonItems, fastFilterItems, historyItems);
               return historyItems;
            });
         },

         mergeFilterItems: function(items, historyItems) {
            chain.factory(items).each(function(item) {
               chain.factory(historyItems).each(function(historyItem) {
                  if (_private.isEqualItems(item, historyItem)) {
                     var value = getPropValue(historyItem, 'value');
                     var textValue = getPropValue(historyItem, 'textValue');
                     var visibility = getPropValue(historyItem, 'visibility');
                     var viewMode = getPropValue(historyItem, 'viewMode');

                     if (item.hasOwnProperty('value') && historyItem.hasOwnProperty('value')) {
                        setPropValue(item, 'value', value);
                     }

                     if (item.hasOwnProperty('textValue') && historyItem.hasOwnProperty('textValue')) {
                        setPropValue(item, 'textValue', textValue);
                     }

                     if (item.hasOwnProperty('visibility') && historyItem.hasOwnProperty('visibility')) {
                        setPropValue(item, 'visibility', visibility);
                     }

                     if (viewMode !== undefined && item.hasOwnProperty('viewMode')) {
                        setPropValue(item, 'viewMode', viewMode);
                     }
                  }
               });
            });
         },

         calculateFilterByItems: function(filter, filterButtonItems, fastFilterItems) {
            var filterClone = clone(filter || {});
            var itemsFilter = _private.getFilterByItems(filterButtonItems, fastFilterItems);
            var emptyFilterKeys = _private.getEmptyFilterKeys(filterButtonItems, fastFilterItems);

            emptyFilterKeys.forEach(function(key) {
               delete filterClone[key];
            });

            // FIXME when using merge witout {rec: false} we will get wrong data:
            // {arr: [123]} <-- {arr: []} results {arr: [123]} instead {arr: []}
            merge(filterClone, itemsFilter, {rec: false});

            return filterClone;
         },
         applyItemsToFilter: function(self, filter, filterButtonItems, fastFilterItems) {
            var filterClone = _private.calculateFilterByItems(filter, filterButtonItems, fastFilterItems);
            _private.setFilter(self, filterClone);
         },

         getHistoryData: function(filterButtonItems, fastFilterItems) {
            /* An empty filter should not appear in the history, but should be applied when loading data from the history.
               To understand this, save an empty object in history. */

            if (_private.isFilterChanged(filterButtonItems, fastFilterItems)) {
               return _private.prepareHistoryItems(filterButtonItems, fastFilterItems);
            }
            return {};
         },

         setFilter: function(self, filter) {
            self._filter = filter;
         },

         notifyFilterChanged: function(self) {
            self._notify('filterChanged', [self._filter]);
         },

         cloneItems: function(items) {
            if (items['[Types/_entity/CloneableMixin]']) {
               return items.clone();
            }
            return clone(items);
         },
      };

      function getCalculatedFilter(cfg) {
         var def = new Deferred();
         var tmpStorage = {};
         _private.resolveItems(tmpStorage, cfg.historyId, cfg.filterButtonSource, cfg.fastFilterSource, cfg.historyItems).addCallback(function(items) {
            var calculatedFilter;
            try {
               calculatedFilter = _private.calculateFilterByItems(cfg.filter, tmpStorage._filterButtonItems, tmpStorage._fastFilterItems);
            } catch (err) {
               def.errback(err);
               throw err;
            }
            def.callback({
               filter: calculatedFilter,
               historyItems: items,
               filterButtonItems: tmpStorage._filterButtonItems,
               fastFilterItems: tmpStorage._fastFilterItems
            });
            return items;
         }).addErrback(function(err) {
            def.errback(err);
            return err;
         });
         return def;
      }

      function updateFilterHistory(cfg) {
         if (!cfg.historyId) {
            throw new Error('Controls/_filter/Controller::historyId is required');
         }
         _private.resolveFilterButtonItems(cfg.filterButtonItems, cfg.fastFilterItems);
         _private.updateHistory({}, cfg.filterButtonItems, cfg.fastFilterItems, cfg.historyId);
      }

      /**
       * Контрол-контроллер, который позволяет фильтровать данные в {@link Controls/list:View}, используя {@link Filter/Button} или {@link Filter/Fast}.
       * Контроллер позволяет сохранять историю фильтра и восстанавливать страницу после перезагрузки с последним примененным фильтром.
       *
       * Подробнее читайте <a href='/doc/platform/developmentapl/interface-development/controls/list-environment/filter-search/'>здесь</a>.
       *
       * @class Controls/_filter/Controller
       * @extends Core/Control
       * @mixes Controls/interface/IFilter
       * @control
       * @public
       * @author Герасимов А.М.
       */

      /*
       * The filter controller allows you to filter data in a {@link Controls/list:View} using {@link Filter/Button} or {@link Filter/Fast}.
       * The filter controller allows you to save filter history and restore page after reload with last applied filter.
       *
       * More information you can read <a href='/doc/platform/developmentapl/interface-development/controls/filter-search/'>here</a>.
       *
       * @class Controls/_filter/Controller
       * @extends Core/Control
       * @mixes Controls/interface/IFilter
       * @control
       * @public
       * @author Герасимов А.М.
       */

      /**
       * @name Controls/_filter/Controller#filterButtonSource
       * @cfg {Array|Function|Types/collection:IList} Элемент или функция FilterButton, которая возвращает элемент FilterButton.
       * @remark Если опция historyId передана, в функцию придет история фильтра.
       * @example
       * TMPL:
       * <pre>
       *    <Controls.filter:Controller
       *       historyId="myHistoryId"
       *       filterButtonSource="{{_filterButtonData}}">
       *          ...
       *          <Controls.filter:ViewContainer>
       *             <Controls.filter:Button />
       *          </Controls.filter:ViewContainer>
       *          ...
       *    </Controls.filter:Controller>
       * </pre>
       * JS:
       * <pre>
       *    this._filterButtonData = function(fromHistoryItems) {
       *       var filterButtonItems = [{
       *           id: '1',
       *           resetValue: 'Yaroslavl'
       *       }];
       *
       *       if (fromHistoryItems) {
       *           filterButtonItems[0].value = fromHistoryItems[0].value + 'city'
       *       }
       *
       *       return filterButtonItems;
       *    }
       * </pre>
       * @see Controls/_filter/Button#items
       */

      /*
       * @name Controls/_filter/Controller#filterButtonSource
       * @cfg {Array|Function|Types/collection:IList} FilterButton items or function, that return FilterButton items
       * @remark if the historyId option is setted, function will receive filter history
       * @example
       * TMPL:
       * <pre>
       *    <Controls.filter:Controller
       *       historyId="myHistoryId"
       *       filterButtonSource="{{_filterButtonData}}">
       *          ...
       *          <Controls.filter:ViewContainer>
       *             <Controls.filter:Button />
       *          </Controls.filter:ViewContainer>
       *          ...
       *    </Controls.filter:Controller>
       * </pre>
       * JS:
       * <pre>
       *    this._filterButtonData = function(fromHistoryItems) {
       *       var filterButtonItems = [{
       *           id: '1',
       *           resetValue: 'Yaroslavl'
       *       }];
       *
       *       if (fromHistoryItems) {
       *           filterButtonItems[0].value = fromHistoryItems[0].value + 'city'
       *       }
       *
       *       return filterButtonItems;
       *    }
       * </pre>
       * @see Controls/_filter/Button#items
       */

      /**
       * @name Controls/_filter/Controller#fastFilterSource
       * @cfg {Array|Function|Types/collection:IList} Элемент или функция FastFilter, которая возвращает элемент FastFilter.  
       * @remark Если опция historyId передана, в функцию придет история фильтра.
       * @example
       * TMPL:
       * <pre>
       *    <Controls.filter:Controller
       *       historyId="myHistoryId"
       *       fastFilterSource="{{_fastFilterSource}}">
       *       <Controls.list:DataContainer>
       *          ...
       *          <Controls.filter:FastContainer>
       *             <Controls.filter:Fast />
       *          </Controls.filter:FastContainer>
       *          ...
       *       </Controls.list:DataContainer>
       *    </Controls.filter:Controller>
       * </pre>
       * JS:
       * <pre>
       *    this._fastFilterSource = function(fromHistoryItems) {
       *        var fastFilterItems = [{
       *            id: '1',
       *            resetValue: 'Yaroslavl',
       *            properties: {
       *               keyProperty: 'title',
       *               displayProperty: 'title',
       *               source: new MemorySource({
       *                  idProperty: 'title',
       *                  data: [
       *                      { key: '1', title: 'Yaroslavl' },
       *                      { key: '2', title: 'Moscow' },
       *                      { key: '3', title: 'St-Petersburg' }
       *                  ]
       *               })
       *            }
       *        }];
       *        if (fromHistoryItems) {
       *          fastFilterItems[0].value = fromHistoryItems[0].value + 'city'
       *        }
       *    }
       * </pre>
       * @see Controls/_filter/Fast#items
       */

      /*
       * @name Controls/_filter/Controller#fastFilterSource
       * @cfg {Array|Function|Types/collection:IList} FastFilter items or function, that return FastFilter items
       * @remark if the historyId option is setted, function will recive filter history
       * @example
       * TMPL:
       * <pre>
       *    <Controls.filter:Controller
       *       historyId="myHistoryId"
       *       fastFilterSource="{{_fastFilterSource}}">
       *       <Controls.list:DataContainer>
       *          ...
       *          <Controls.filter:FastContainer>
       *             <Controls.filter:Fast />
       *          </Controls.filter:FastContainer>
       *          ...
       *       </Controls.list:DataContainer>
       *    </Controls.filter:Controller>
       * </pre>
       * JS:
       * <pre>
       *    this._fastFilterSource = function(fromHistoryItems) {
       *        var fastFilterItems = [{
       *            id: '1',
       *            resetValue: 'Yaroslavl',
       *            properties: {
       *               keyProperty: 'title',
       *               displayProperty: 'title',
       *               source: new MemorySource({
       *                  idProperty: 'title',
       *                  data: [
       *                      { key: '1', title: 'Yaroslavl' },
       *                      { key: '2', title: 'Moscow' },
       *                      { key: '3', title: 'St-Petersburg' }
       *                  ]
       *               })
       *            }
       *        }];
       *        if (fromHistoryItems) {
       *          fastFilterItems[0].value = fromHistoryItems[0].value + 'city'
       *        }
       *    }
       * </pre>
       * @see Controls/_filter/Fast#items
       */

      /**
       * @name Controls/_filter/Controller#historyId
       * @cfg {String} Идентификатор, под которым будет сохранена история фильтра.
       */

      /*
       * @name Controls/_filter/Controller#historyId
       * @cfg {String} The identifier under which the filter history will be saved.
       */

      /**
       * Controls/_filter/Controller#historyItems
       * @cfg {Array|Types/collection:IList} Вы можете получить элементы фильтра из истории самостоятельно,
       * эти элементы будут применены/объединены для filterButtonItems и fastFilterItem. История фильтра не будет загружаться, если этот параметр установлен.
       */

      /*
       * Controls/_filter/Controller#historyItems
       * @cfg {Array|Types/collection:IList} You can prepare filter items from history by your self,
       * this items will applied/merged to filterButtonItems and fastFilterItem. Filter history will not loading, if this option setted.
       */

      var Container = Control.extend(/** @lends Controls/_filter/Container.prototype */{

         _template: template,
         _historySource: null,
         _filter: null,
         _filterButtonItems: null,
         _fastFilterItems: null,

         _beforeMount: function(options, context, receivedState) {
            if (receivedState) {
               _private.setFilterItems(this, options.filterButtonSource, options.fastFilterSource, receivedState);
               _private.resolveFilterButtonItems(this._filterButtonItems, this._fastFilterItems);
               _private.applyItemsToFilter(this, options.filter, this._filterButtonItems, this._fastFilterItems);
            } else {
               var self = this;
               return _private.resolveItems(this, options.historyId, options.filterButtonSource, options.fastFilterSource, options.historyItems).addCallback(function(items) {
                  _private.resolveFilterButtonItems(self._filterButtonItems, self._fastFilterItems);
                  _private.applyItemsToFilter(self, options.filter, self._filterButtonItems, self._fastFilterItems);
                  return items;
               });
            }
         },

         _beforeUpdate: function(newOptions) {
            if (this._options.filterButtonSource !== newOptions.filterButtonSource || this._options.fastFilterSource !== newOptions.fastFilterSource) {
               _private.setFilterItems(this, newOptions.filterButtonSource, newOptions.fastFilterSource);
               _private.resolveFilterButtonItems(this._filterButtonItems, this._fastFilterItems);
               _private.applyItemsToFilter(this, this._filter, this._filterButtonItems, this._fastFilterItems);
            }
            if (!isEqual(this._options.filter, newOptions.filter)) {
               _private.applyItemsToFilter(this, newOptions.filter, this._filterButtonItems, this._fastFilterItems);
            }
         },

         _itemsChanged: function(event, items) {
            _private.updateFilterItems(this, items);

            if (this._options.historyId) {
               _private.updateHistory(this, this._filterButtonItems, this._fastFilterItems, this._options.historyId);
            }

            _private.applyItemsToFilter(this, this._filter, items);
            _private.notifyFilterChanged(this);
         },

         _filterChanged: function(event, filter) {
            //Controller should stop bubbling of 'filterChanged' event, that container-control fired
            event.stopPropagation();
            _private.setFilter(this, filter);
            _private.notifyFilterChanged(this);
         }

      });

      Container._private = _private;
      Container.getCalculatedFilter = getCalculatedFilter;
      Container.updateFilterHistory = updateFilterHistory;
      export = Container;

