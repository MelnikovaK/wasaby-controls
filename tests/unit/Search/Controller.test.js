define(['Controls/Search/Controller', 'Types/source', 'Core/core-instance', 'Types/collection', 'Types/entity'], function(Search, sourceLib, cInstance, collection, entity) {

   var data = [
      {
         id: 0,
         title: 'test'
      },
      {
         id: 1,
         title: 'test1'
      },
      {
         id: 2,
         title: 'test'
      },
      {
         id: 3,
         title: 'test2'
      }
   ];

   var memorySource = new sourceLib.Memory({
      data: data
   });
   
   var getDefaultOptions = function() {
      return {
         searchParam: 'test',
         minSearchLength: 3,
         searchDelay: 50,
         sorting: [],
         filter: {},
         source: memorySource,
         navigation: {
            source: 'page',
            view: 'page',
            sourceConfig: {
               pageSize: 2,
               page: 0,
               hasMore: false
            }
         }
      };
   };
   
   var defaultOptions = getDefaultOptions();

   var getSearchController = function() {
      var controller = new Search(defaultOptions);
      controller.saveOptions(defaultOptions);
      return controller;
   };

   describe('Controls.Search.Controller', function() {

      it('_private.searchCallback', function() {
         var controller = getSearchController();
         var filterChanged = false;
         var itemsChanged = false;
         var filter;

         controller._notify = function(eventName, value) {
            if (eventName === 'filterChanged') {
               filterChanged = true;
               filter = value[0];
            }

            if (eventName === 'itemsChanged') {
               itemsChanged = true;
            }
         };

         controller._searchContext = { updateConsumers: function() {} };

         Search._private.searchCallback(controller, {}, {test: 'testFilterValue'});

         assert.isFalse(controller._loading);
         assert.isTrue(filterChanged);
         assert.isTrue(itemsChanged);
         assert.isTrue(controller._viewMode === 'search');
         assert.equal(controller._searchValue, 'testFilterValue');


         var rs = new collection.RecordSet({
            rawData: [],
            idProperty: 'id'
         });
         rs.setMetaData({
            results: new entity.Model({
               rawData: {
                  switchedStr: 'testStr'
               }
            })
         });
         var result = {
            data: rs
         };
         var filter = {
            test: 'test'
         };
         Search._private.searchCallback(controller, result, filter);

         assert.equal(controller._misspellValue, 'testStr');
         assert.deepEqual(filter, {test: 'test'});
      });

      it('_private.abortCallback', function() {
         var controller = getSearchController();
         controller._viewMode = 'search';
         controller._misspellValue = 'testStr';
         controller._loading = true;
         controller._searchValue = 'test';
         var filterChanged = false;

         controller._notify = function(eventName) {
            if (eventName = 'filterChanged') {
               filterChanged = true;
            }
         };

         controller._searchContext = { updateConsumers: function() {} };

         Search._private.abortCallback(controller);

         assert.isTrue(filterChanged);
         assert.isFalse(controller._viewMode === 'search');
         assert.isFalse(controller._loading);
         assert.equal(controller._misspellValue, '');
         assert.equal(controller._searchValue, '');
         assert.equal(controller._inputSearchValue, '');
      });

      it('_private.searchStartCallback', function() {
         var self = {};
         var forceUpdateCalled = false;
         
         self._forceUpdate = function() {
            forceUpdateCalled = true;
         };
         Search._private.searchStartCallback(self);
         assert.isTrue(self._loading);
         assert.isTrue(forceUpdateCalled);
      });

      it('_private.needUpdateSearchController', function() {
         assert.isFalse(Search._private.needUpdateSearchController({filter: {test: 'test'}}, {filter: {test: 'test'}}));
         assert.isFalse(Search._private.needUpdateSearchController({filter: {test: 'test'}}, {filter: {test: 'test1'}}));
         assert.isTrue(Search._private.needUpdateSearchController({minSearchLength: 3}, {minSearchLength: 2}));
         assert.isTrue(Search._private.needUpdateSearchController({minSearchLength: 3, sorting: [{}]}, {minSearchLength: 3, sorting: [{testField: "ASC"}]}));
      });

      it('_private.getSearchController', function() {
         var searchController = getSearchController();
         var controller;
         
         searchController._dataOptions = defaultOptions;
         controller = Search._private.getSearchController(searchController);
         assert.isTrue(cInstance.instanceOfModule(controller, 'Controls/Controllers/_SearchController'));
         assert.deepEqual(controller._options.sorting, []);
      });

      it('_search', function() {
         var searchController = getSearchController();
         var value;
         searchController._dataOptions = defaultOptions;
         //initialize searchController
         Search._private.getSearchController(searchController);

         //moch method
         searchController._searchController.search = function(searchVal) {
            value = searchVal;
         };

         searchController._search(null, 'test');

         assert.equal(value, 'test');
         assert.equal(searchController._inputSearchValue, 'test');
      });
   
      it('_beforeMount', function() {
         var searchController = getSearchController(defaultOptions);
         searchController._beforeMount({searchValue: 'test'}, {dataOptions: defaultOptions});

         assert.equal(searchController._inputSearchValue, 'test');
      });
   
      it('_beforeUpdate', function() {
         var searchController = getSearchController(defaultOptions);
         searchController._beforeMount({}, {dataOptions: defaultOptions});
   
         Search._private.getSearchController(searchController);
         searchController._beforeUpdate({}, {dataOptions: defaultOptions});
         assert.isNull(searchController._searchController);
   
         Search._private.getSearchController(searchController);
         var options = getDefaultOptions();
         options.filter = {test: 'testValue'};
         searchController._beforeUpdate(options, {dataOptions: defaultOptions});
         assert.deepEqual(searchController._searchController.getFilter(), {test: 'testValue'});
      });

   });

});
