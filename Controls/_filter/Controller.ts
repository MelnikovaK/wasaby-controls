import Control = require('Core/Control');
import template = require('wml!Controls/_filter/Controller');
import Deferred = require('Core/Deferred');
import chain = require('Types/chain');
import Utils = require('Types/util');
import historyUtils = require('Controls/_filter/HistoryUtils');
import merge = require('Core/core-merge');
import clone = require('Core/core-clone');
import isEmpty = require('Core/helpers/Object/isEmpty');
import {isEqual} from 'Types/object';
import {Controller as SourceController} from 'Controls/source';
import {RecordSet} from 'Types/Collection';
import * as Prefetch from 'Controls/_filter/Prefetch';
import {IPrefetchHistoryParams} from './IPrefetch';

export interface IFilterHistoryData {
   items: object[];
   prefetchParams?: IPrefetchHistoryParams;
}

const getPropValue = Utils.object.getPropertyValue.bind(Utils);
const setPropValue = Utils.object.setPropertyValue.bind(Utils);

const _private = {
         getItemsByOption(option, history) {
            let result;

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
            const minimizedItem = {};

            if (visibility !== undefined) {
                minimizedItem.visibility = visibility;
            }

            if (isNeedSaveHistory) {
                minimizedItem.value = getPropValue(item, 'value');
            }

            if (visibility !== false && textValue !== getPropValue(item, 'resetTextValue')) {
                minimizedItem.textValue = getPropValue(item, 'textValue');
            }

            if (getPropValue(item, 'id')) {
                minimizedItem.id = getPropValue(item, 'id');
            } else {
                minimizedItem.name = getPropValue(item, 'name');
                minimizedItem.viewMode = getPropValue(item, 'viewMode');
            }
            return minimizedItem;
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
               let source = historyUtils.getHistorySource({historyId: id});

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
         addToHistory: function(self, filterButtonItems, fastFilterItems, historyId: string, prefetchParams?: IPrefetchHistoryParams): void {
            const meta = {
               $_addFromData: true
            };

            function update() {
               historyUtils.getHistorySource({historyId: historyId}).update(
                   _private.getHistoryData(filterButtonItems, fastFilterItems, prefetchParams),
                   meta
               );
            }

            if (!historyUtils.getHistorySource({historyId: historyId})._history) {
               // Getting history before updating if it hasn’t already done
               _private.getHistoryItems(self, historyId).addCallback(function() {
                  update();
               });
            } else {
               update();
            }
         },

         getHistoryByItems(historyId: string, items: Array) {
             const historySource = historyUtils.getHistorySource({historyId});
             const history = historySource.getItems();

             let result;
             let historyItem;

             if (history && history.getCount()) {
                 history.each((item) => {
                     if (!result) {
                         historyItem = historySource.getDataObject(item.get('ObjectData'));

                         if (isEqual(_private.minimizeFilterItems(items), historyItem.items || historyItem)) {
                             result = historyItem;
                         }
                     }
                 });
             }

             return result;
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

         setFilterItems: function(self, filterButtonOption, fastFilterOption, history) {
            let historyItems;

            if (history) {
                historyItems = history.items || history;
            }

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
         applyItemsToFilter: function(self, filter, filterButtonItems, fastFilterItems?) {
            var filterClone = _private.calculateFilterByItems(filter, filterButtonItems, fastFilterItems);
            _private.setFilter(self, filterClone);
         },

         getHistoryData(filterButtonItems, fastFilterItems, prefetchParams?: IPrefetchHistoryParams): IFilterHistoryData|{} {
            let result = {};

            /* An empty filter should not appear in the history,
               but should be applied when loading data from the history.
               To understand this, save an empty object in history. */
            if (_private.isFilterChanged(filterButtonItems, fastFilterItems)) {
               result = Prefetch.addPrefetchToHistory(result, prefetchParams);
               result.items = _private.prepareHistoryItems(filterButtonItems, fastFilterItems);
               return result;
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
         itemsReady: function (self, filter, history?): void {
             let resultFilter = filter;

             if (history) {
                 resultFilter = Prefetch.applyPrefetchFromHistory(resultFilter, history);
             }

             _private.resolveFilterButtonItems(self._filterButtonItems, self._fastFilterItems);
             _private.applyItemsToFilter(self, resultFilter, self._filterButtonItems, self._fastFilterItems);
         }
      };

      function getCalculatedFilter(cfg) {
         var def = new Deferred();
         var tmpStorage = {};
         _private.resolveItems(tmpStorage, cfg.historyId, clone(cfg.filterButtonSource), clone(cfg.fastFilterSource), cfg.historyItems).addCallback(function(items) {
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
         _private.addToHistory({}, cfg.filterButtonItems, cfg.fastFilterItems, cfg.historyId);
      }

      /**
       * Контрол-контроллер, который позволяет фильтровать данные в {@link Controls/list:View}, используя {@link Controls/filter:Selector} или {@link Controls/filter:Fast}.
       * Контроллер позволяет сохранять историю фильтра и восстанавливать страницу после перезагрузки с последним примененным фильтром.
       *
       * Подробнее читайте <a href='/doc/platform/developmentapl/interface-development/controls/list-environment/filter-search/'>здесь</a>.
       *
       * @class Controls/_filter/Controller
       * @extends Core/Control
       * @mixes Controls/interface/IFilter
       * @mixes Controls/_filter/IPrefetch
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
       *                  keyProperty: 'title',
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
       *                  keyProperty: 'title',
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

const Container = Control.extend(/** @lends Controls/_filter/Container.prototype */{

         _template: template,
         _historySource: null,
         _filter: null,
         _filterButtonItems: null,
         _fastFilterItems: null,

         constructor(): void {
            this._dataLoadCallback = this._dataLoadCallback.bind(this);
            Container.superclass.constructor.apply(this, arguments);
         },

        resetPrefetch(): void {
             const filter = clone(this._filter);
             _private.setFilter(this, Prefetch.clearPrefetchSession(filter));
             _private.notifyFilterChanged(this);
        },

        _beforeMount: function(options, context, receivedState): Promise<IFilterHistoryData|{}> {
            let filter = options.filter;

            if (options.prefetchParams) {
                filter = Prefetch.prepareFilter(filter, options.prefetchParams);
            }

            if (receivedState) {
                _private.setFilterItems(this, options.filterButtonSource, options.fastFilterSource, receivedState);
                _private.itemsReady(this, filter, receivedState);
            } else {
                return _private.resolveItems(this, options.historyId, options.filterButtonSource, options.fastFilterSource, options.historyItems).addCallback((history) => {
                    _private.itemsReady(this, filter, history);
                    return history;
                });
            }
        },

         _beforeUpdate(newOptions): void {
            const filterButtonChanged = this._options.filterButtonSource !== newOptions.filterButtonSource;
            const fastFilterChanged = this._options.fastFilterSource !== newOptions.fastFilterSource;

            if (filterButtonChanged || fastFilterChanged) {
               _private.setFilterItems(
                   this,
                   filterButtonChanged ? newOptions.filterButtonSource : this._filterButtonItems,
                   fastFilterChanged ? newOptions.fastFilterSource : this._fastFilterItems);

               _private.itemsReady(this, this._filter);
            }

            if (!isEqual(this._options.filter, newOptions.filter)) {
               _private.applyItemsToFilter(
                   this,
                   Prefetch.prepareFilter(newOptions.filter, newOptions.prefetchParams),
                   this._filterButtonItems,
                   this._fastFilterItems
               );
            }
         },

         _itemsChanged(event, items) {
            _private.updateFilterItems(this, items);
            _private.applyItemsToFilter(this, this._filter, items);

             if (this._options.prefetchParams) {
                 const history = _private.getHistoryByItems(this._options.historyId, this._filterButtonItems);

                 if (history) {
                     if (!Prefetch.getPrefetchFromHistory(history) || Prefetch.needInvalidatePrefetch(history)) {
                         this._filter = Prefetch.clearPrefetchSession(this._filter);
                     } else {
                         this._filter = Prefetch.applyPrefetchFromHistory(this._filter, history);
                     }
                 }

                 this._changedFilterItems = items;
             } else if (this._options.historyId) {
                 _private.addToHistory(this, this._filterButtonItems, this._fastFilterItems, this._options.historyId);
             }
            _private.notifyFilterChanged(this);
         },

         _historyApply(event: Event, history): void {
             if (this._options.historyId && this._options.prefetchParams) {
                 if (Prefetch.needInvalidatePrefetch(history)) {
                     // invalidate
                 } else {
                     this._filter = Prefetch.applyPrefetchFromHistory(this._filter, history);
                     _private.notifyFilterChanged(this);
                 }
             }
         },

         _filterChanged(event, filter) {
            // Controller should stop bubbling of 'filterChanged' event, that container-control fired
            event.stopPropagation();
            _private.setFilter(this, Prefetch.prepareFilter(filter, this._options.prefetchParams));
            _private.notifyFilterChanged(this);
         },

         _dataLoadCallback(items: RecordSet): void {
            if (this._options.historyId && this._changedFilterItems) {

               _private.addToHistory(
                   this,
                   this._filterButtonItems,
                   this._fastFilterItems,
                   this._options.historyId,
                   Prefetch.getPrefetchParamsForSave(items));

               // Намеренное допущение, что меняем объект по ссылке.
               // Сейчас по-другому не сделать, т.к. контроллер фильтрации находится над
               // контейнером и списком, которые владеют данными.
               // А изменение фильтра вызывает повторный запрос за данными.
               Prefetch.applyPrefetchFromItems(this._filter, items);
            }

            this._changedFilterItems = null;

            if (this._options.dataLoadCallback) {
               this._options.dataLoadCallback(items);
            }
         }

      });

Container._private = _private;
Container.getCalculatedFilter = getCalculatedFilter;
Container.updateFilterHistory = updateFilterHistory;
export = Container;
