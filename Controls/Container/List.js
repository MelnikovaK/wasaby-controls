define('Controls/Container/List',
   [
      'Core/Control',
      'tmpl!Controls/Container/List/List',
      'WS.Data/Source/Memory',
      'Controls/Controllers/_SearchController',
      'Core/core-merge',
      'Core/helpers/Object/isEqual',
      'Controls/Container/Search/SearchContextField',
      'Controls/Container/Filter/FilterContextField',
      'Core/Deferred'
   ],
   
   function(Control, template, Memory, SearchController, merge, isEqual, SearchContextField, FilterContextField, Deferred) {
      
      'use strict';
      
      var SEARCH_CONTEXT_FIELD = 'searchLayoutField';
      var SEARCH_VALUE_FIELD = 'searchValue';
      var FILTER_CONTEXT_FIELD = 'filterLayoutField';
      var FILTER_VALUE_FIELD = 'filter';
      
      var _private = {
         getSearchController: function(self) {
            var options = self._options;
            
            if (!self._searchController) {
               self._searchController = new SearchController({
                  filter: merge({}, options.filter),
                  searchParam: options.searchParam,
                  minSearchLength: options.minSearchLength,
                  source: options.source,
                  navigation: options.navigation,
                  searchDelay: options.searchDelay,
                  searchCallback: _private.searchCallback.bind(self, self),
                  abortCallback: _private.abortCallback.bind(self, self)
               });
            }
            
            return self._searchController;
         },
         
         resolveOptions: function(self, options) {
            self._options = options;
            self._source = options.source;
            self._filter = options.filter;
         },
         
         updateSource: function(self, data) {
            /* TODO will be a cached source */
            self._source = new Memory({
               data: data.getRawData()
            });
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
   
            if (!isEqual(filter, _private.getFilterFromContext(self, self._contextObj))) {
               _private.updateFilter(self, filter);
            }
            self._searchMode = false;
            self._source = self._options.source;
            self._forceUpdate();
         },
         
         searchCallback: function(self, result, filter) {
            if (self._options.searchEndCallback) {
               self._options.searchEndCallback(result, filter);
            }
   
            if (!isEqual(filter, _private.getFilterFromContext(self, self._contextObj)) || !isEqual(filter, self._filter)) {
               _private.updateFilter(self, filter);
            }
            _private.updateSource(self, result.data);
            self._searchDeferred.callback();
            self._forceUpdate();
         },
         
         searchValueChanged: function(self, value, filter) {
            var searchController = _private.getSearchController(self);
            
            if (self._options.searchStartCallback) {
               self._options.searchStartCallback();
            }
   
            _private.cancelSearchDeferred(self);
            self._searchDeferred = new Deferred();
            
            if (filter) {
               searchController.setFilter(filter);
            }
            self._searchMode = true;
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
            var oldValue = this.getFilterFromContext(self, self._contextObj),
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
            var oldValue = this.getSearchValueFromContext(self, self._contextObj),
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
         }
      };
      
      /**
       * Container for list components.
       * Passes props (like filter, source, navigation) to list inside.
       *
       * @author Герасимов Александр
       * @class Controls/Container/List
       * @mixes Controls/Input/interface/ISearch
       * @mixes Controls/interface/INavigation
       * @mixes Controls/interface/IFilter
       * @public
       */
      
      /**
       * @name Controls/Container/List#source
       * @cfg {WS.Data/Source/ISource} source
       */
      
      var List = Control.extend({
         
         _template: template,
         _searchDeferred: null,
         _searchMode: false,
         
         constructor: function(options) {
            List.superclass.constructor.call(this, options);
            _private.resolveOptions(this, options);
         },
         
         _beforeMount: function(options, context) {
            _private.checkContextValues(this, context);
            return this._searchDeferred;
         },
         
         _beforeUpdate: function(newOptions, context) {
            if (this._options.source !== newOptions.source) {
               if (this._searchController) {
                  this._searchController.setSource(newOptions.source);
               }
            }
            _private.checkContextValues(this, context);
         },
         
         _beforeUnmount: function() {
            if (this._searchController) {
               this._searchController.abort();
               this._searchController = null;
            }
            _private.cancelSearchDeferred(this);
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
      return List;
      
   });
