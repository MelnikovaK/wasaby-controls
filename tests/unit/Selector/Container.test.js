define(['Controls/lookupPopup', 'Types/entity', 'Types/source', 'Types/collection'], function(lookupPopup, entity, sourceLib, collection) {

   var getItems = function() {
      var items = [];
      var i;

      for (i = 0; i < 5; i++) {
         items.push(new entity.Model(
            {
               rawData: {
                  id: i
               },
               idProperty: 'id'
            })
         );
      }

      return items;
   };

   describe('Controls/_lookupPopup/Container', function() {

      it('getFilteredItems', function() {
         var items = ['toRemoveItem', 'toSaveItem', 'toSaveItem'];
         var filterFunc = function(item) {
            return item !== 'toRemoveItem';
         };
         var retTrue = function() {
            return true;
         };

         assert.deepEqual(lookupPopup.Container._private.getFilteredItems(items, retTrue), items);
         assert.deepEqual(lookupPopup.Container._private.getFilteredItems(items, filterFunc), ['toSaveItem', 'toSaveItem']);
      });

      it('getKeysByItems', function() {
         assert.deepEqual(lookupPopup.Container._private.getKeysByItems(getItems(), 'id'), [0, 1, 2, 3, 4]);
      });

      it('getEmptyItems', function() {
         var listWithItems = new collection.List({items: getItems()});

         assert.equal(lookupPopup.Container._private.getEmptyItems(listWithItems).getCount(), 0);
         assert.equal(lookupPopup.Container._private.getEmptyItems(listWithItems)._moduleName, 'Types/collection:List');
      });


      it('getValidSelectionType', function() {
         assert.equal(lookupPopup.Container._private.getValidSelectionType('all'), 'all');
         assert.equal(lookupPopup.Container._private.getValidSelectionType('leaf'), 'leaf');
         assert.equal(lookupPopup.Container._private.getValidSelectionType('node'), 'node');
         assert.equal(lookupPopup.Container._private.getValidSelectionType('test'), 'all');
      });

      it('getFilterFunction', function() {
         var retFalse = function() {
            return false;
         }

         assert.isTrue(lookupPopup.Container._private.getFilterFunction()());
         assert.isFalse(lookupPopup.Container._private.getFilterFunction(retFalse)());
      });

      it('getSelectedKeys', function() {
         var context = {
            selectorControllerContext: {
               selectedItems: getItems()
            },
            dataOptions: {
               keyProperty: 'id'
            }
         };
         var options = {
            selectionFilter: function(item) {
               var id = item.get('id');
               return id !== 1 && id !== 3;
            }
         };

         assert.deepEqual(lookupPopup.Container._private.getSelectedKeys(options, context), [0, 2, 4]);
      });

      it('prepareFilter', function() {
         var filter = {
            searchParam: 'test'
         };
         var selection = {
            selected: [1, 2],
            excluded: [3, 4]
         };

         var preparedFilter = lookupPopup.Container._private.prepareFilter(filter, selection, 'searchParam');

         assert.deepEqual(preparedFilter.selection.selected, [1, 2]);
         assert.deepEqual(preparedFilter.selection.excluded, [3, 4]);
         assert.isTrue(preparedFilter !== filter);
         assert.isTrue(!preparedFilter.searchParam);
      });

      it('prepareResult', function() {
         var result = 'result';
         var selectedKeys = [];
         var keyProperty = 'id';
         var selectCompleteInitiator = true;

         assert.deepEqual(lookupPopup.Container._private.prepareResult(result, selectedKeys, keyProperty, selectCompleteInitiator), {
            resultSelection: result,
            initialSelection: selectedKeys,
            keyProperty: keyProperty,
            selectCompleteInitiator: selectCompleteInitiator
         });
      });

      it('getSourceController', function() {
         var source = new sourceLib.Memory();
         var navigation = {};
         var sourceController = lookupPopup.Container._private.getSourceController(source, navigation);

         assert.include(
            ['Controls/source:Controller', 'Controls/_source/SourceController'],
            sourceController._moduleName
         );
         assert.isTrue(!sourceController._options.navigation);
      });

      it('_selectedKeysChanged', function() {
         let container = new lookupPopup.Container();
         let eventFired = false;

         container._notify = (e) => {
            if (e === 'selectedKeysChanged') {
               eventFired = true;
            }
         };

         container._selectedKeysChanged();
         assert.isTrue(eventFired);
      });

      it('_excludedKeysChanged', function() {
         let container = new lookupPopup.Container();
         let eventFired = false;

         container._notify = (e) => {
            if (e === 'excludedKeysChanged') {
               eventFired = true;
            }
         };

         container._excludedKeysChanged();
         assert.isTrue(eventFired);
      });

      describe('_selectComplete', function() {
         let
            container = new lookupPopup.Container(),
            loadDef,
            isSelectionLoad = false,
            items = getItems(),
            recordSet = new collection.List({items: items});
         recordSet.getRecordById = function(id) {
            return items[id];
         };

         container._selectedKeys = [];
         container._excludedKeys = [];
         container.context = {
            get: function() {
               return {
                  source: new sourceLib.Memory(),
                  items: recordSet,
                  filter: {}
               };
            }
         };

         container._notify = function(eventName, result) {
            if (eventName === 'selectionLoad') {
               isSelectionLoad = true;
               loadDef = result[0];
            }
         };

         it('selected keys is empty', function() {
            let clearRecordSet = new collection.List({items: items.slice()});

            clearRecordSet.clear();
            container._selectComplete();

            assert.isTrue(isSelectionLoad);
            assert.deepEqual(loadDef.getResult().resultSelection, clearRecordSet);
         });

         it('single select', function() {
            container._selectedKeys = [1];
            container._selectComplete();
            assert.equal(loadDef.getResult().resultSelection.at(0), items[1]);
         });

         it('multi select, check toggle indicator', function(done) {
            let
               hideIndicatorParam,
               indicatorId = 'fw54dw54d46q46d5',
               isShowIndicator = false,
               isHideIndicator = false;

            container._notify = function(eventName, result) {
               switch (eventName){
                  case 'showIndicator':
                     isShowIndicator = true;
                     return indicatorId;

                  case 'hideIndicator':
                     isHideIndicator = true;
                     hideIndicatorParam = result[0];
               }
            };

            container._options.multiSelect = true;
            container._selectComplete();

            assert.isTrue(isShowIndicator);
            setTimeout(function() {
               assert.isTrue(isHideIndicator);
               assert.equal(hideIndicatorParam, indicatorId);
               done();
            }, 0);
         });
      });
   });

});
