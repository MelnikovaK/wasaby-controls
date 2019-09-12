import Control = require('Core/Control');
import template = require('wml!Controls/_deprecatedList/Container');
import merge = require('Core/core-merge');
import Deferred = require('Core/Deferred');
import cInstance = require('Core/core-instance');
import clone = require('Core/core-clone');
import {Memory, PrefetchProxy} from 'Types/source';
import {_SearchController} from 'Controls/search';
import {isEqual} from 'Types/object';
import {FilterContextField, SearchContextField} from 'Controls/context';
import {Source} from 'Controls/history';
import {RecordSet} from 'Types/collection';
import {factory} from 'Types/chain';

var SEARCH_CONTEXT_FIELD = 'searchLayoutField';
var SEARCH_VALUE_FIELD = 'searchValue';
var FILTER_CONTEXT_FIELD = 'filterLayoutField';
var FILTER_VALUE_FIELD = 'filter';

var _private = {
   getSearchController: function(self) {
      var options = self._options;

      if (!self._searchController) {
         self._searchController = new _SearchController({
            filter: merge({}, options.filter),
            searchParam: options.searchParam,
            minSearchLength: options.minSearchLength,
            source: _private.getCorrectSource(options.source),
            navigation: options.navigation,
            sorting: options.sorting,
            searchDelay: options.searchDelay,
            searchStartCallback: options.searchStartCallback,
            searchCallback: _private.searchCallback.bind(self, self),
            searchErrback: _private.searchErrback.bind(self, self),
            abortCallback: _private.abortCallback.bind(self, self)
         });
      }

      return self._searchController;
   },

   resolveOptions: function(self, options) {
      self._options = options;
      self._filter = options.filter;
      self._source = options.source;
      self._navigation = options.navigation;
   },

   cachedSourceFix: function(self) {
      /* Пока не cached source не используем навигацию и фильтрацию,
       просто отдаём данные в список, иначе memorySource данные не вернёт,
       т.к. фильтрация работает в нём только по полному совпадению */
      self._navigation = null;
      self._filter = {};
   },

   updateSource: function(self, data) {
      let
         source = _private.getOriginSource(self._options.source),
         items = data.getRawData();

      if (self._options.reverseList) {
         items = _private.reverseData(items, source);
      }

      /* TODO will be a cached source */
      _private.cachedSourceFix(self);
      const memorySource = new Memory({
         model: data.getModel(),
         idProperty: data.getIdProperty(),
         data: items,
         adapter: source.getAdapter()
      });

      if (self._options.reverseList) {
         self._source = memorySource;
      } else {
         self._source = new PrefetchProxy({
            data: {
               query: data
            },
            target: memorySource
         });
      }
   },

   reverseData: function(data, source) {
      const recordSet = new RecordSet({
         rawData: clone(data), // clone origin data
         adapter: source.getAdapter(),
         idProperty: source.getIdProperty()
      });

      const recordSetToReverse = recordSet.clone();
      const reversedData = factory(recordSetToReverse).sort((a, b) => {
          return  recordSetToReverse.getIndex(b) - recordSetToReverse.getIndex(a);
      }).value();

      // need to use initial recordSet to save metaData in origin format
      recordSet.clear();
      reversedData.forEach((item) => {
         recordSet.add(item);
      });

      return recordSet.getRawData();
   },

   updateFilter: function(self, resultFilter) {
      /* Копируем объект, чтобы порвать ссылку и опция у списка изменилась*/
      var filterClone = merge({}, self._options.filter);
      self._filter = merge(filterClone, resultFilter);
      _private.getSearchController(self).setFilter(self._filter);
   },

   abortCallback: function(self, filter) {
      if (self._options.searchEndCallback) {
         self._options.searchEndCallback(null, filter);
      }

      if (!isEqual(filter, _private.getFilterFromContext(self, self._context))) {
         _private.updateFilter(self, filter);
      }
      self._searchMode = false;
      self._source = self._options.source;
      self._navigation = self._options.navigation;
      self._forceUpdate();
   },

   searchErrback: function(self, error) {
      var source = _private.getOriginSource(self._options.source);
      if (self._options.searchErrback) {
         self._options.searchErrback(error);
      }

      //if query returned an error, the list should be empty
      //but if error was called by query abort (error property 'canceled'),
      //the list should not change
      if (!error || !error.canceled) {
         self._source = new Memory({
            model: source.getModel(),
            idProperty: source.getIdProperty()
         });
      }
   },

   searchCallback: function(self, result, filter) {
      if (self._options.searchEndCallback) {
         self._options.searchEndCallback(result, filter);
      }

      if (!isEqual(filter, _private.getFilterFromContext(self, self._context)) || !isEqual(filter, self._filter)) {
         _private.updateFilter(self, filter);
      }

      self._searchDeferred = new Deferred();
      _private.updateSource(self, result.data);
      self._searchDeferred.callback();
      self._forceUpdate();
   },

   searchValueChanged: function(self, value, filter) {
      var searchController = _private.getSearchController(self);

      _private.cancelSearchDeferred(self);

      if (filter) {
         searchController.setFilter(filter);
      }
      self._searchMode = true;
      self._searchValue = value;
      searchController.search(value);
   },

   cancelSearchDeferred: function(self) {
      if (self._searchDeferred && self._searchDeferred.isReady()) {
         self._searchDeferred.cancel();
         self._searchDeferred = null;
      }
   },

   getValueFromContext: function(context, contextField, valueField) {
      if (context && context[contextField]) {
         return context[contextField][valueField];
      } else {
         return null;
      }
   },

   isFilterChanged: function(self, context) {
      var oldValue = this.getFilterFromContext(self, self._context),
         newValue = this.getFilterFromContext(self, context),
         changed = false;

      if (newValue) {
         if (self._searchMode) {
            /* if search mode on, filter will be changed after search */
            changed = !isEqual(_private.getSearchController(self).getFilter(), newValue);
         } else {
            changed = !isEqual(oldValue, newValue);
         }
      }
      return changed;
   },

   isSearchValueChanged: function(self, context) {
      var oldValue = self._searchValue || this.getSearchValueFromContext(self, self._context),
         newValue = this.getSearchValueFromContext(self, context);
      return !isEqual(oldValue, newValue);
   },

   getFilterFromContext: function(self, context) {
      return this.getValueFromContext(context, FILTER_CONTEXT_FIELD, FILTER_VALUE_FIELD);
   },

   getSearchValueFromContext: function(self, context) {
      return this.getValueFromContext(context, SEARCH_CONTEXT_FIELD, SEARCH_VALUE_FIELD);
   },

   checkContextValues: function(self, context) {
      var filterChanged = this.isFilterChanged(self, context);
      var searchChanged = this.isSearchValueChanged(self, context);
      var searchValue = this.getSearchValueFromContext(self, context);
      var filterValue = this.getFilterFromContext(self, context);

      if (searchChanged && filterChanged) {
         this.searchValueChanged(self, searchValue, filterValue);
      } else if (searchChanged) {
         this.searchValueChanged(self, searchValue);
      } else if (filterChanged) {
         if (self._searchMode) {
            this.searchValueChanged(self, searchValue, filterValue);
         } else {
            this.updateFilter(self, filterValue);
         }
      }
   },

   destroySearchController: function(self) {
      if (self._searchController) {
         self._searchController.abort();
         self._searchController = null;
      }
   },

   getCorrectSource: function(source) {
      //костыль до перевода Suggest'a на Search/Controller,
      //могут в качестве source передать prefetchSource, у которого нет методов getModel, getAdapter.
      //После этого этот модуль можно будет удалить.
      if (cInstance.instanceOfModule(source, 'Types/source:PrefetchProxy')) {
         return source._$target;
      }

      return source;
   },

   getOriginSource: function(source) {
      // In Selector/Suggest as source can be set historySource, in this case history should work differently
      if (source instanceof Source) {
         return source.originSource;
      }

      return _private.getCorrectSource(source);
   },

   reverseSourceData: function(self) {
      if (self._source.data) {
         /* toDO !KONGO Вынуждены использовать PrefetchProxy до перевода саггеста на search/Controller
           https://online.sbis.ru/opendoc.html?guid=ab4d807e-9e1a-4a0a-b95b-f0c3f6250f63
           Использовать приходится, т.к. мы не можем просто пересоздать выпадашку с новыми данными,
           т.к. владельцем данных и является сама выпадашка, а использование Memory вызывает искусственную задержку,
           из-за которой моргают данные */
         self._source = new PrefetchProxy({
            target: new Memory({
               model: self._source.getModel(),
               idProperty: self._source.getIdProperty(),
               data: _private.reverseData(self._source.data, self._source),
               adapter: self._source.getAdapter()
            })
         });
      }
   }
};

var List = Control.extend({

   _template: template,
   _searchDeferred: null,
   _searchMode: false,

   _beforeMount: function(options, context) {
      this._source = options.source;

      _private.resolveOptions(this, options);
      _private.checkContextValues(this, context);

      /***************************
       FIXME
       VDOM не умеет обрабатываеть ситуацию,
       когда в асинхронной фазе построения компонента может измеиться состояние родетельского компонента,
       вместо того, чтобы дождаться постоения дочернего компонента, он начинает создавать новый компонент.
       Ошибка выписна, в плане у Зуева https://online.sbis.ru/opendoc.html?guid=fb08b40e-f2ac-4dd2-9a84-dfbfc404da02 */
      //return this._searchDeferred;

      if (this._searchMode) {
         _private.cachedSourceFix(this);
         var originSource = _private.getOriginSource(options.source);
         this._source = new Memory({
            model: originSource.getModel(),
            idProperty: originSource.getIdProperty()
         });
      }

      /***********************/

   },

   _beforeUpdate: function(newOptions, context) {
      let oldReverseList = this._options.reverseList;

      if (this._options.source !== newOptions.source || !isEqual(this._options.navigation, newOptions.navigation) || this._options.searchDelay !== newOptions.searchDelay) {
         var currentFilter = this._searchController ? this._searchController.getFilter() : _private.getFilterFromContext(this, this._context);
         var source = this._source;

         _private.resolveOptions(this, newOptions);

         if (this._searchMode) {
            _private.cachedSourceFix(this);

            /* back memory source if now searchMode is on. (Will used cached source by task https://online.sbis.ru/opendoc.html?guid=ab4d807e-9e1a-4a0a-b95b-f0c3f6250f63) */
            this._source = source;
         }

         /* create searchController with new options */
         this._searchController = null;
         _private.getSearchController(this).setFilter(currentFilter);
      }
      if (oldReverseList !== newOptions.reverseList) {
         _private.reverseSourceData(this);
      }
      _private.checkContextValues(this, context);
   },

   _beforeUnmount: function() {
      _private.cancelSearchDeferred(this);
      _private.destroySearchController(this);
   }

});

List.contextTypes = function() {
   return {
      searchLayoutField: SearchContextField,
      filterLayoutField: FilterContextField
   };
};

List.getDefaultOptions = function() {
   return {
      searchDelay: 500,
      minSearchLength: 3,
      filter: {}
   };
};

/* For tests */
List._private = _private;

export default List;
