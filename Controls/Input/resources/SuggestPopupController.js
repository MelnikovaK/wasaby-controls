define('js!Controls/Input/resources/SuggestPopupController',
   [
      'Core/core-extend',
      'Core/core-merge',
      'js!Controls/List/resources/utils/Search',
      'Core/constants',
      'js!Controls/Input/resources/SuggestView/SuggestView'
      
   ],
   function(extend, cMerge, Search, constants) {
      
      'use strict';
      
      var _private = {
         /**
          * Контроллер для запроса за данными
          */
         getSearchController: function(self) {
            if (!self._search) {
               self._search = new Search({
                  dataSource:  self._dataSource,
                  searchDelay: self._searchDelay,
                  navigation: self._navigation
               });
            }
   
            return self._search;
         },
         
         search: function(self) {
            return _private.getSearchController(self).search({filter: self._filter}).addCallback(function(searchResult) {
               _private.setSuggestSelectedIndex(self, 0);
               _private.setSuggestSearchResult(self, searchResult);
            });
         },
         
         showPopup: function(self) {
            self._popupOpener.open(self._popupOptions);
         },
         
         setSuggestSearchResult: function(self, searchResult) {
            self._popupOptions.componentOptions.items = searchResult.result;
            self._popupOptions.componentOptions.hasMore = searchResult.hasMore;
         },
         
         setSuggestSelectedIndex: function(self, selectedIndex) {
            self._selectedIndex = selectedIndex;
            self._popupOptions.componentOptions.selectedIndex = selectedIndex;
         },
   
         decreaseSelectedIndex: function(self) {
            if (self._selectedIndex > 0) {
               self._selectedIndex--;
            }
            _private.setSuggestSelectedIndex(self, self._selectedIndex);
         },
         
         increaseSelectedIndex: function(self) {
            if (self._selectedIndex < self._popupOptions.componentOptions.items.getCount() - 1) {
               self._selectedIndex++;
            }
            _private.setSuggestSelectedIndex(self, self._selectedIndex);
         }
   
   
      };
      
      var SuggestPopupController = extend({
         
         _selectedIndex: 0,
         
         constructor: function(options) {
            SuggestPopupController.superclass.constructor.call(this, options);
            
            this._popupOpener = options.popupOpener;
            this._dataSource = options.dataSource;
            this._searchDelay = options.searchDelay;
            this._navigation = options.navigation;
            this._selectCallback = options.selectCallback;
         },
         
         showPopup: function() {
            _private.search(this).addCallback(_private.showPopup.bind(this, this));
         },
         
         hidePopup: function() {
            return _private.getSearchController(this).abort();
            this._popupOpener.close();
         },
         
         setSearchFilter: function(searchFilter) {
            this._filter = searchFilter;
         },
         
         setPopupOptions: function(options) {
            this._popupOptions = options;
         },
         
         keyDown: function(event) {
            if (this._popupOpener.isOpened()) {
               switch (event.nativeEvent.which) {
                  case constants.key.up:
                     _private.decreaseSelectedIndex(this);
                     _private.showPopup(this);
                     event.preventDefault();
                     break;
                     
                  case constants.key.down:
                     _private.increaseSelectedIndex(this);
                     _private.showPopup(this);
                     event.preventDefault();
                     break;
   
                  case constants.key.enter:
                     this._selectCallback(this._popupOptions.componentOptions.items.at(this._selectedIndex));
                     this._popupOpener.close();
                     break;
               }
            }
         },
   
         _moduleName: 'Controls/Input/resources/SuggestPopupController'
      });
   
      /** For tests **/
      SuggestPopupController._private = _private;
      
      return SuggestPopupController;
   }
);