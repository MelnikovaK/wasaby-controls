/**
 * Created by kraynovdo on 23.10.2017.
 */
define([
   'Types/source',
   'Types/collection',
   'Controls/list',
   'Controls/treeGrid',
   'Controls/Utils/Toolbar',
   'Core/Deferred',
   'Core/core-instance',
   'Env/Env',
   'Core/core-clone',
   'Types/entity',
   'Core/polyfill/PromiseAPIDeferred'
], function(sourceLib, collection, lists, treeGrid, tUtil, cDeferred, cInstance, Env, clone, entity) {
   describe('Controls.List.BaseControl', function() {
      var data, result, source, rs, sandbox;
      beforeEach(function() {
         data = [
            {
               id: 1,
               title: 'Первый',
               type: 1
            },
            {
               id: 2,
               title: 'Второй',
               type: 2
            },
            {
               id: 3,
               title: 'Третий',
               type: 2,
               'parent@': true
            },
            {
               id: 4,
               title: 'Четвертый',
               type: 1
            },
            {
               id: 5,
               title: 'Пятый',
               type: 2
            },
            {
               id: 6,
               title: 'Шестой',
               type: 2
            }
         ];
         source = new sourceLib.Memory({
            idProperty: 'id',
            data: data,
            filter: function (item, filter) {
               var result = true;

               if (filter['id'] && filter['id'] instanceof Array) {
                  result = filter['id'].indexOf(item.get('id')) !== -1;
               }

               return result;
            }

         });
         rs = new collection.RecordSet({
            idProperty: 'id',
            rawData: data
         });
         sandbox = sinon.createSandbox();
      });
      afterEach(function() {
         sandbox.restore();
      });
      it('life cycle', function(done) {
         var dataLoadFired = false;
         var filter = {
            1: 1,
            2: 2
         };
         var cfg = {
            viewName: 'Controls/List/ListView',
            viewConfig: {
               keyProperty: 'id'
            },
            viewModelConfig: {
               items: [],
               keyProperty: 'id'
            },
            viewModelConstructor: lists.ListViewModel,
            source: source,
            filter: filter
         };
         var ctrl = new lists.BaseControl(cfg);
         ctrl.saveOptions(cfg);
         var mountResult = ctrl._beforeMount(cfg);
         assert.isTrue(!!mountResult.addCallback, '_beforeMount doesn\'t return deferred');

         assert.isTrue(!!ctrl._sourceController, '_dataSourceController wasn\'t created before mounting');
         assert.deepEqual(filter, ctrl._options.filter, 'incorrect filter before mounting');

         // received state 3'rd argument
         mountResult = ctrl._beforeMount(cfg, {}, rs);
         assert.isTrue(!!mountResult.addCallback, '_beforeMount doesn\'t return deferred');

         assert.isTrue(!!ctrl._sourceController, '_dataSourceController wasn\'t created before mounting');
         assert.deepEqual(filter, ctrl._options.filter, 'incorrect filter before mounting');

         // создаем новый сорс
         var oldSourceCtrl = ctrl._sourceController;

         source = new sourceLib.Memory({
            idProperty: 'id',
            data: data
         });

         var filter2 = { 3: 3 };
         cfg = {
            viewName: 'Controls/List/ListView',
            source: source,
            dataLoadCallback: function() {
               dataLoadFired = true;
            },
            viewModelConstructor: treeGrid.TreeViewModel,
            viewModelConfig: {
               items: [],
               keyProperty: 'id'
            },
            filter: filter2
         };

         // сорс грузит асинхронно
         setTimeout(function() {
            assert.equal(ctrl._items, ctrl.getViewModel().getItems());
            ctrl._beforeUpdate(cfg);

            // check saving loaded items after new viewModelConstructor
            // https://online.sbis.ru/opendoc.html?guid=72ff25df-ff7a-4f3d-8ce6-f19a666cbe98
            assert.equal(ctrl._items, ctrl.getViewModel().getItems());
            assert.isTrue(ctrl._sourceController !== oldSourceCtrl, '_dataSourceController wasn\'t changed before updating');
            assert.deepEqual(filter, ctrl._options.filter, 'incorrect filter before updating');
            ctrl.saveOptions(cfg);
            assert.deepEqual(filter2, ctrl._options.filter, 'incorrect filter after updating');
            assert.equal(ctrl._viewModelConstructor, treeGrid.TreeViewModel);
            assert.isTrue(
               cInstance.instanceOfModule(ctrl._listViewModel, 'Controls/treeGrid:TreeViewModel') ||
               cInstance.instanceOfModule(ctrl._listViewModel, 'Controls/_treeGrid/Tree/TreeViewModel')
            );
            setTimeout(function() {
               assert.isTrue(dataLoadFired, 'dataLoadCallback is not fired');
               ctrl._children.listView = {
                  getItemsContainer: function () {
                     return {
                        children: []
                     }
                  }
               };
               ctrl._afterUpdate({});
               ctrl._beforeUnmount();
               done();
            }, 100);
         }, 1);
      });

      it('beforeMount: right indexes with virtual scroll and receivedState', function () {
         var cfg = {
            viewName: 'Controls/List/ListView',
            viewConfig: {
               keyProperty: 'id'
            },
            viewModelConfig: {
               items: [],
               keyProperty: 'id'
            },
            navigation: {
               view: 'infinity'
            },
            virtualScrolling: true,
            viewModelConstructor: lists.ListViewModel,
            source: source
         };
         var ctrl = new lists.BaseControl(cfg);
         ctrl.saveOptions(cfg);
         return new Promise(function (resolve, reject) {
            ctrl._beforeMount(cfg,null, [{id:1, title: 'qwe'}]);
            setTimeout(function () {
               assert.equal(ctrl.getViewModel().getStartIndex(), 0);
               assert.equal(ctrl.getViewModel().getStopIndex(), 6);
               resolve();
            }, 10);
         });
      });

      it('_private::getSortingOnChange', function() {
         const emptySorting = [];
         const sortingASC = [{test: 'ASC'}];
         const sortingDESC = [{test: 'DESC'}];
         const multiSorting = [{test: 'DESC'}, {test2: 'DESC'}];

         assert.deepEqual(lists.BaseControl._private.getSortingOnChange(emptySorting, 'test'), sortingDESC);
         assert.deepEqual(lists.BaseControl._private.getSortingOnChange(sortingDESC, 'test'), sortingASC);
         assert.deepEqual(lists.BaseControl._private.getSortingOnChange(sortingASC, 'test'), emptySorting);
         assert.deepEqual(lists.BaseControl._private.getSortingOnChange(multiSorting, 'test', 'single'), sortingDESC);
      });


      it('errback to callback', function() {
         return new Promise(function(resolve, reject) {
            var source = new sourceLib.Memory({
               data: [{
                  id: 11,
                  key: 1,
                  val: 'first'
               }, {
                  id: 22,
                  key: 2,
                  val: 'second'
               }]
            });

            var cfg = {
               keyProperty: 'key',
               viewName: 'Controls/List/ListView',
               source: source,
               viewConfig: {
                  keyProperty: 'key'
               },
               viewModelConfig: {
                  items: [],
                  keyProperty: 'key'
               },
               viewModelConstructor: lists.ListViewModel
            };

            var ctrl = new lists.BaseControl(cfg);


            ctrl.saveOptions(cfg);
            ctrl._beforeMount(cfg);

            // waiting for first load
            setTimeout(function () {
               try {
                  assert.equal(ctrl._items.getIdProperty(), cfg.keyProperty);
               } catch (e) {
                  reject(e);
               }

               // emulate loading error
               ctrl._sourceController.load = function () {
                  var def = new cDeferred();
                  def.errback();
                  return def;
               };

            lists.BaseControl._private.reload(ctrl, ctrl._options).addCallback(function() {
               resolve();
            }).addErrback(function() {
               try {assert.isTrue(false, 'reload() returns errback');
               } catch(e) {
                     reject(e);
                  }
                  resolve();
            });
         }, 100);});
      });

      it('check dataLoadCallback and afterReloadCallback calling order', async function() {
         var
            dataLoadCallbackCalled = false,
            afterReloadCallbackCalled = false,
            cfg = {
               viewName: 'Controls/List/ListView',
               source: new sourceLib.Memory({}),
               viewModelConstructor: lists.ListViewModel,
               dataLoadCallback: function() {
                  dataLoadCallbackCalled = true;
               },
               afterReloadCallback: function() {
                  afterReloadCallbackCalled = true;
                  assert.isFalse(dataLoadCallbackCalled, 'dataLoadCallback is called before afterReloadCallback.');
               }
            },
            ctrl = new lists.BaseControl(cfg);

         ctrl.saveOptions(cfg);
         await ctrl._beforeMount(cfg);

         assert.isTrue(afterReloadCallbackCalled, 'afterReloadCallbackCalled is not called.');
         assert.isTrue(dataLoadCallbackCalled, 'dataLoadCallback is not called.');

         afterReloadCallbackCalled = false;
         dataLoadCallbackCalled = false;

         await ctrl.reload();

         assert.isTrue(afterReloadCallbackCalled, 'afterReloadCallbackCalled is not called.');
         assert.isTrue(dataLoadCallbackCalled, 'dataLoadCallback is not called.');

         // emulate reload with error
         ctrl._sourceController.load = function() {
            return cDeferred.fail();
         };

         afterReloadCallbackCalled = false;
         dataLoadCallbackCalled = false;

         await ctrl.reload();

         assert.isTrue(afterReloadCallbackCalled, 'afterReloadCallbackCalled is not called.');
         assert.isFalse(dataLoadCallbackCalled, 'dataLoadCallback is called.');
      });

      it('_needScrollCalculation', function(done) {
         var source = new sourceLib.Memory({
            idProperty: 'id',
            data: data
         });

         var dataLoadFired = false;

         var cfg = {
            viewName: 'Controls/List/ListView',
            dataLoadCallback: function() {
               dataLoadFired = true;
            },
            source: source,
            viewConfig: {
               keyProperty: 'id'
            },
            viewModelConfig: {
               items: [],
               keyProperty: 'id'
            },
            viewModelConstructor: lists.ListViewModel,
            navigation: {}
         };

         var ctrl = new lists.BaseControl(cfg);
         ctrl.saveOptions(cfg);
         ctrl._beforeMount(cfg);
         assert.isFalse(ctrl._needScrollCalculation, 'Wrong _needScrollCalculation value after mounting');

         cfg = {
            viewName: 'Controls/List/ListView',
            dataLoadCallback: function() {
               dataLoadFired = true;
            },
            source: source,
            viewConfig: {
               keyProperty: 'id'
            },
            viewModelConfig: {
               items: [],
               keyProperty: 'id'
            },
            viewModelConstructor: lists.ListViewModel,
            navigation: {
               view: 'infinity'
            }
         };
         setTimeout(function() {
            ctrl._beforeUpdate(cfg);
            assert.isTrue(ctrl._needScrollCalculation, 'Wrong _needScrollCalculation value after updating');
            done();
         }, 1);

         ctrl = new lists.BaseControl(cfg);
         ctrl.saveOptions(cfg);
         ctrl._beforeMount(cfg);
         assert.isTrue(ctrl._needScrollCalculation, 'Wrong _needScrollCalculation value after mounting');
      });

      it('loadToDirection down', function(done) {
         var source = new sourceLib.Memory({
            idProperty: 'id',
            data: data
         });

         var dataLoadFired = false;

         var beforeLoadToDirectionCalled = false;

         var cfg = {
            viewName: 'Controls/List/ListView',
            dataLoadCallback: function() {
               dataLoadFired = true;
            },
            beforeLoadToDirectionCallback: function() {
               beforeLoadToDirectionCalled = true;
            },
            source: source,
            viewConfig: {
               keyProperty: 'id'
            },
            viewModelConfig: {
               items: [],
               keyProperty: 'id'
            },
            viewModelConstructor: lists.ListViewModel,
            navigation: {
               source: 'page',
               sourceConfig: {
                  pageSize: 3,
                  page: 0,
                  hasMore: false
               }
            }
         };

         var ctrl = new lists.BaseControl(cfg);


         ctrl.saveOptions(cfg);
         ctrl._beforeMount(cfg);

         setTimeout(function() {
            lists.BaseControl._private.loadToDirection(ctrl, 'down');

            assert.equal(ctrl._loadingState, 'down');
            setTimeout(function() {
               assert.equal(6, lists.BaseControl._private.getItemsCount(ctrl), 'Items wasn\'t load');
               assert.isTrue(dataLoadFired, 'dataLoadCallback is not fired');
               assert.isTrue(beforeLoadToDirectionCalled, 'beforeLoadToDirectionCallback is not called.');
               assert.equal(ctrl._loadingState, null);
               done();
            }, 100);
         }, 100);
      });

      it('prepareFooter', function() {
         var
             baseControl = {
                _options: {}
             },
            tests = [
               {
                  data: [
                     baseControl,
                     undefined,
                     {}
                  ],
                  result: {
                     _shouldDrawFooter: false
                  }
               },
               {
                  data: [
                     baseControl,
                     {},
                     {}
                  ],
                  result: {
                     _shouldDrawFooter: false
                  }
               },
               {
                  data: [
                     baseControl,
                     { view: 'page' },
                     {}
                  ],
                  result: {
                     _shouldDrawFooter: false
                  }
               },
               {
                  data: [
                     baseControl,
                     { view: 'demand' },
                     {
                        hasMoreData: function() {
                           return false;
                        }
                     }
                  ],
                  result: {
                     _shouldDrawFooter: false
                  }
               },
               {
                  data: [
                     baseControl,
                     { view: 'demand' },
                     {
                        hasMoreData: function() {
                           return true;
                        },
                        getLoadedDataCount: function() {
                        },
                        getAllDataCount: function() {
                           return true;
                        }
                     }
                  ],
                  result: {
                     _shouldDrawFooter: true,
                     _loadMoreCaption: '...'
                  }
               },
               {
                  data: [
                     baseControl,
                     { view: 'demand' },
                     {
                        hasMoreData: function() {
                           return true;
                        },
                        getLoadedDataCount: function() {
                           return 5;
                        },
                        getAllDataCount: function() {
                           return true;
                        }
                     }
                  ],
                  result: {
                     _shouldDrawFooter: true,
                     _loadMoreCaption: '...'
                  }
               },
               {
                  data: [
                     baseControl,
                     { view: 'demand' },
                     {
                        hasMoreData: function() {
                           return true;
                        },
                        getLoadedDataCount: function() {
                           return 5;
                        },
                        getAllDataCount: function() {
                           return 10;
                        }
                     }
                  ],
                  result: {
                     _shouldDrawFooter: true,
                     _loadMoreCaption: 5
                  }
               }
            ];
         tests.forEach(function(test, index) {
            baseControl._options.groupingKeyCallback = undefined;
            lists.BaseControl._private.prepareFooter.apply(null, test.data);
            assert.equal(test.data[0]._shouldDrawFooter, test.result._shouldDrawFooter, 'Invalid prepare footer on step #' + index);
            assert.equal(test.data[0]._loadMoreCaption, test.result._loadMoreCaption, 'Invalid prepare footer on step #' + index);

            baseControl._options.groupingKeyCallback = () => 123;
            baseControl._listViewModel = {isAllGroupsCollapsed: () => true};
            lists.BaseControl._private.prepareFooter.apply(null, test.data);
            assert.isFalse(test.data[0]._shouldDrawFooter, 'Invalid prepare footer on step #' + index + ' with all collapsed groups');
         });
      });

      it('virtual scroll shouldn\'t update indexes on reload', async function() {
         let
             cfg = {
                viewName: 'Controls/List/ListView',
                viewConfig: {
                   idProperty: 'id'
                },
                virtualScrolling: true,
                viewModelConfig: {
                   items: [],
                   idProperty: 'id'
                },
                viewModelConstructor: lists.ListViewModel,
                markedKey: 0,
                source: source,
                navigation: {
                   view: 'infinity'
                }
             },
             instance = new lists.BaseControl(cfg);

         instance.saveOptions(cfg);
         await instance._beforeMount(cfg);

         let
             isIndexesUpdated = false,
             virtualScroll = instance.getVirtualScroll(),
             updateIndexes = virtualScroll.updateItemsIndexes,
             vm = instance.getViewModel();

         instance.getVirtualScroll().updateItemsIndexes = function () {
            isIndexesUpdated = true;
            updateIndexes.apply(virtualScroll, arguments);
         };

         await instance.reload();
         assert.isFalse(isIndexesUpdated);
         assert.equal(vm._startIndex, 0);
         assert.equal(vm._stopIndex, 6);
         assert.isFalse(isIndexesUpdated);

      });

      it('moveMarkerToNext && moveMarkerToPrevious', async function() {
         var
            cfg = {
               viewModelConstructor: lists.ListViewModel,
               keyProperty: 'key',
               source: new sourceLib.Memory({
                  idProperty: 'key',
                  data: [{
                     key: 1
                  }, {
                     key: 2
                  }, {
                     key: 3
                  }]
               }),
               markedKey: 2
            },
            baseControl = new lists.BaseControl(cfg),
            originalScrollToItem = lists.BaseControl._private.scrollToItem;
         lists.BaseControl._private.scrollToItem = function() {};
         baseControl.saveOptions(cfg);
         await baseControl._beforeMount(cfg);
         assert.equal(2, baseControl._listViewModel.getMarkedKey());
         baseControl._onViewKeyDown({
            target: {
               closest: function() {
                  return false;
               }
            },
            stopImmediatePropagation: function() {},
            nativeEvent: {
               keyCode: Env.constants.key.down
            },
            preventDefault: function() {},
         });
         assert.equal(3, baseControl._listViewModel.getMarkedKey());
         baseControl._onViewKeyDown({
            target: {
               closest: function() {
                  return false;
               }
            },
            stopImmediatePropagation: function() {},
            nativeEvent: {
               keyCode: Env.constants.key.up
            },
            preventDefault: function() {},
         });
         assert.equal(2, baseControl._listViewModel.getMarkedKey());
         lists.BaseControl._private.scrollToItem = originalScrollToItem;
      });

      it('moveMarker activates the control', async function() {
         const
            cfg = {
               viewModelConstructor: lists.ListViewModel,
               keyProperty: 'key',
               source: new sourceLib.Memory({
                  idProperty: 'key',
                  data: [{
                     key: 1
                  }, {
                     key: 2
                  }, {
                     key: 3
                  }]
               }),
               markedKey: 2
            },
            baseControl = new lists.BaseControl(cfg),
            originalScrollToItem = lists.BaseControl._private.scrollToItem;

         lists.BaseControl._private.scrollToItem = function() {};

         baseControl.saveOptions(cfg);
         await baseControl._beforeMount(cfg);

         let isActivated = false;
         baseControl.activate = () => {
            isActivated = true;
         };

         baseControl._mounted = true; // fake mounted for activation

         baseControl._onViewKeyDown({
            target: {
               closest: function() {
                  return false;
               }
            },
            stopImmediatePropagation: function() {},
            nativeEvent: {
               keyCode: Env.constants.key.down
            },
            preventDefault: function() {},
         });

         assert.isTrue(isActivated, 'BaseControl should be activated when marker is moved');
         lists.BaseControl._private.scrollToItem = originalScrollToItem;
      });

      it('moveMarkerToNext && moveMarkerToPrevious with markerVisibility = "hidden"', async function() {
         var
             cfg = {
                viewModelConstructor: lists.ListViewModel,
                markerVisibility: 'hidden',
                keyProperty: 'key',
                source: new sourceLib.Memory({
                   idProperty: 'key',
                   data: [{
                      key: 1
                   }, {
                      key: 2
                   }, {
                      key: 3
                   }]
                }),
                markedKey: 2
             },
             baseControl = new lists.BaseControl(cfg);
         baseControl.saveOptions(cfg);
         await baseControl._beforeMount(cfg);
         assert.equal(null, baseControl._listViewModel.getMarkedKey());
         baseControl._onViewKeyDown({
            target: {
               closest: function() {
                  return false;
               }
            },
            stopImmediatePropagation: function() {},
            nativeEvent: {
               keyCode: Env.constants.key.down
            },
            preventDefault: function() {},
         });
         assert.equal(null, baseControl._listViewModel.getMarkedKey());
         baseControl._onViewKeyDown({
            target: {
               closest: function() {
                  return false;
               }
            },
            stopImmediatePropagation: function() {},
            nativeEvent: {
               keyCode: Env.constants.key.up
            },
            preventDefault: function() {},
         });
         assert.equal(null, baseControl._listViewModel.getMarkedKey());
      });

      it('moveMarkerToNext && moveMarkerToPrevious while loading', async function() {
         var
             cfg = {
                viewModelConstructor: lists.ListViewModel,
                markerVisibility: 'visible',
                keyProperty: 'key',
                source: new sourceLib.Memory({
                   idProperty: 'key',
                   data: [{
                      key: 1
                   }, {
                      key: 2
                   }, {
                      key: 3
                   }]
                })
             },
             baseControl = new lists.BaseControl(cfg);
         baseControl.saveOptions(cfg);
         await baseControl._beforeMount(cfg);
         assert.equal(1, baseControl._listViewModel.getMarkedKey());
         baseControl._loadingIndicatorState = 'all';
         baseControl._onViewKeyDown({
            target: {
               closest: function() {
                  return false;
               }
            },
            stopImmediatePropagation: function() {},
            nativeEvent: {
               keyCode: Env.constants.key.down
            },
            preventDefault: function() {},
         });
         assert.equal(1, baseControl._listViewModel.getMarkedKey());
         baseControl._onViewKeyDown({
            target: {
               closest: function() {
                  return false;
               }
            },
            stopImmediatePropagation: function() {},
            nativeEvent: {
               keyCode: Env.constants.key.up
            },
            preventDefault: function() {},
         });
         assert.equal(1, baseControl._listViewModel.getMarkedKey());
      });

      it('enterHandler', function () {
         var notified = false;

         // Without marker
         lists.BaseControl._private.enterHandler({
            getViewModel: function () {
               return {
                  getMarkedItem: function () {
                     return null;
                  }
               }
            },
            _notify: function (e, item, options) {
               notified = true;
            }
         });
         assert.isFalse(notified);

         var myMarkedItem = {qwe: 123};
         // With marker
         lists.BaseControl._private.enterHandler({
            getViewModel: function () {
               return {
                  getMarkedItem: function () {
                     return {
                        getContents: function () {
                           return myMarkedItem;
                        }
                     };
                  }
               }
            },
            _notify: function (e, item, options) {
               notified = true;
               assert.equal(e, 'itemClick');
               assert.deepEqual(item, [myMarkedItem]);
               assert.deepEqual(options, { bubbling: true });
            }
         });
         assert.isTrue(notified);
      });

      it('enterHandler while loading', function () {
         let
             myMarkedItem = null,
             notified = false;

         function enterClick(markedItem) {
            lists.BaseControl._private.enterHandler({
               getViewModel: () => ({
                  getMarkedItem: () => myMarkedItem
               }),
               _notify: () => {
                  notified = true;
               },
               _loadingIndicatorState: 'all'
            });
         }

         // Without marker
         enterClick(null);
         assert.isFalse(notified);

         // With marker
         enterClick({getContents: () => ({key: 123})});
         assert.isFalse(notified);
      });

      it('toggleSelection', async function () {

         var
             cfg = {
                viewModelConstructor: lists.ListViewModel,
                markerVisibility: 'visible',
                keyProperty: 'key',
                multiSelectVisibility: 'visible',
                source: new sourceLib.Memory({
                   idProperty: 'key',
                   data: [{
                      key: 1
                   }, {
                      key: 2
                   }, {
                      key: 3
                   }]
                })
             },
             baseControl = new lists.BaseControl(cfg);
         baseControl.saveOptions(cfg);
         await baseControl._beforeMount(cfg);
         baseControl._children.selectionController = {
            onCheckBoxClick: (key, status) => {
               if (status) {
                  baseControl._listViewModel._selectedKeys.push(key);
               } else {
                  baseControl._listViewModel._selectedKeys.pop(key);
               }
            }
         };
         assert.deepEqual([], baseControl._listViewModel._selectedKeys);
         baseControl._loadingIndicatorState = 'all';
         lists.BaseControl._private.enterHandler(baseControl);
         assert.deepEqual([], baseControl._listViewModel._selectedKeys);

      });

      it('dataLoadCallback should be called after data was appended into model', async function () {

         var
             callbackCalled = false,
             cfg = {
                viewModelConstructor: lists.ListViewModel,
                markerVisibility: 'visible',
                markedKey: 2,
                dataLoadCallback: () => {
                   callbackCalled = true;
                   assert.equal(3, baseControl.getViewModel().getCount());
                },
                keyProperty: 'key',
                source: new sourceLib.Memory({
                   idProperty: 'key',
                   data: [{
                      key: 1
                   }, {
                      key: 2
                   }, {
                      key: 3
                   }]
                })
             },

             baseControl = new lists.BaseControl(cfg);
         baseControl.saveOptions(cfg);
         await baseControl._beforeMount(cfg);
         assert.isTrue(callbackCalled);
      });

      it('loadToDirection up', function(done) {
         var source = new sourceLib.Memory({
            idProperty: 'id',
            data: data
         });

         var cfg = {
            viewName: 'Controls/List/ListView',
            source: source,
            viewConfig: {
               keyProperty: 'id'
            },
            viewModelConfig: {
               items: rs,
               keyProperty: 'id'
            },
            viewModelConstructor: lists.ListViewModel,
            navigation: {
               source: 'page',
               sourceConfig: {
                  pageSize: 3,
                  page: 1,
                  hasMore: false
               }
            }
         };
         var ctrl = new lists.BaseControl(cfg);
         ctrl.saveOptions(cfg);
         ctrl._beforeMount(cfg);

         setTimeout(function() {
            lists.BaseControl._private.loadToDirection(ctrl, 'up');

            assert.equal(ctrl._loadingState, 'up');
            setTimeout(function() {
               assert.equal(ctrl._loadingState, null);
               assert.equal(6, lists.BaseControl._private.getItemsCount(ctrl), 'Items wasn\'t load');
               done();
            }, 100);
         }, 100);
      });

      it('items should get loaded when a user scrolls to the bottom edge of the list', function(done) {
         var rs = new collection.RecordSet({
            idProperty: 'id',
            rawData: data
         });

         var source = new sourceLib.Memory({
            idProperty: 'id',
            data: data
         });

         var cfg = {
            viewName: 'Controls/List/ListView',
            source: source,
            viewConfig: {
               keyProperty: 'id'
            },
            viewModelConfig: {
               items: rs,
               keyProperty: 'id'
            },
            viewModelConstructor: lists.ListViewModel,
            navigation: {
               view: 'infinity',
               source: 'page',
               sourceConfig: {
                  pageSize: 3,
                  page: 0,
                  hasMore: false
               }
            }
         };
         var ctrl = new lists.BaseControl(cfg);
         ctrl.saveOptions(cfg);
         ctrl._beforeMount(cfg);

         // два таймаута, первый - загрузка начального рекордсета, второй - на последюущий запрос
         setTimeout(function() {
            /**
             * _beforeMount will load some items, so _loadedItems will get set. Normally, it will reset in _afterUpdate, but since we don't have lifecycle in tests,
             * we'll reset it here manually.
             */
            ctrl._loadedItems = null;

            lists.BaseControl._private.onScrollLoadEdge(ctrl, 'down');
            setTimeout(function() {
               assert.equal(6, ctrl._listViewModel.getCount(), 'Items weren\\\'t loaded');
               done();
            }, 100);
         }, 100);
      });

      it('scrollLoadStarted MODE', function(done) {
         var rs = new collection.RecordSet({
            idProperty: 'id',
            rawData: data
         });

         var source = new sourceLib.Memory({
            idProperty: 'id',
            data: data
         });

         var cfg = {
            viewName: 'Controls/List/ListView',
            source: source,
            viewConfig: {
               keyProperty: 'id'
            },
            viewModelConfig: {
               items: rs,
               keyProperty: 'id'
            },
            viewModelConstructor: lists.ListViewModel,
            navigation: {
               view: 'infinity',
               source: 'page',
               sourceConfig: {
                  pageSize: 3,
                  page: 0,
                  hasMore: false
               }
            }
         };
         var ctrl = new lists.BaseControl(cfg);
         ctrl.saveOptions(cfg);
         ctrl._beforeMount(cfg);

         // два таймаута, первый - загрузка начального рекордсета, второй - на последюущий запрос
         setTimeout(function() {
            /**
             * _beforeMount will load some items, so _loadedItems will get set. Normally, it will reset in _afterUpdate, but since we don't have lifecycle in tests,
             * we'll reset it here manually.
             */
            ctrl._loadedItems = null;

            lists.BaseControl._private.onScrollLoadEdgeStart(ctrl, 'down');
            lists.BaseControl._private.checkLoadToDirectionCapability(ctrl);
            setTimeout(function() {
               //TODO remove after https://online.sbis.ru/opendoc.html?guid=006711c6-917b-4028-8484-369361546446
               try {
                  assert.equal(6, ctrl._listViewModel.getCount(), 'Items wasn\'t load with started "scrollloadmode"');
                  lists.BaseControl._private.onScrollLoadEdgeStop(ctrl, 'down');
                  lists.BaseControl._private.checkLoadToDirectionCapability(ctrl);

                  setTimeout(function() {
                     try {
                        assert.equal(6, ctrl._listViewModel.getCount(), 'Items was load without started "scrollloadmode"');
                     }
                     catch(e) {
                        done(e);
                     }

                     done();
                  }, 100);
               }
               catch (e) {
                  done(e);
               }

            }, 100);
         }, 100);
      });
      /*
      it('processLoadError', function() {
         var cfg = {};
         var ctrl = new BaseControl(cfg);
         var error = { message: 'error' };

         result = false;
         var userErrback = function(error) {
            result = error;
         };
         BaseControl._private.processLoadError(ctrl, error, userErrback);

         assert.equal(error, result, 'UserErrback doesn\'t return instance of Error');
      });
      */

      it('indicator', function() {
         var cfg = {};
         var ctrl = new lists.BaseControl(cfg);

         lists.BaseControl._private.showIndicator(ctrl, 'down');
         assert.equal(ctrl._loadingState, 'down', 'Wrong loading state');
         assert.equal(ctrl._loadingIndicatorState, null, 'Wrong loading state');

         lists.BaseControl._private.showIndicator(ctrl);
         assert.equal(ctrl._loadingState, 'all', 'Wrong loading state');
         assert.equal(ctrl._loadingIndicatorState, 'all', 'Wrong loading state');
         assert.isTrue(!!ctrl._loadingIndicatorTimer, 'all', 'Loading timer should created');

         // картинка должен появляться через 2000 мс, проверим, что её нет сразу
         assert.isFalse(!!ctrl._showLoadingIndicatorImage, 'Wrong loading indicator image state');

         // искуственно покажем картинку
         ctrl._showLoadingIndicatorImage = true;

         lists.BaseControl._private.showIndicator(ctrl);
         assert.isTrue(ctrl._loadingIndicatorTimer === ctrl._loadingIndicatorTimer, 'all', 'Loading timer created one more tile');

         // и вызовем скрытие
         lists.BaseControl._private.hideIndicator(ctrl);
         assert.equal(ctrl._loadingState, null, 'Wrong loading state');
         assert.equal(ctrl._loadingIndicatorState, null, 'Wrong loading indicator state');
         assert.isFalse(!!ctrl._showLoadingIndicatorImage, 'Wrong loading indicator image state');
         assert.isFalse(!!ctrl._loadingIndicatorTimer);
      });

      it('scrollToEdge_load', function(done) {
         var rs = new collection.RecordSet({
            idProperty: 'id',
            rawData: data
         });

         var source = new sourceLib.Memory({
            idProperty: 'id',
            data: data
         });

         var cfg = {
            viewName: 'Controls/List/ListView',
            source: source,
            viewConfig: {
               keyProperty: 'id'
            },
            viewModelConfig: {
               items: rs,
               keyProperty: 'id'
            },
            viewModelConstructor: lists.ListViewModel,
            navigation: {
               source: 'page',
               sourceConfig: {
                  pageSize: 3,
                  page: 0,
                  hasMore: false
               }
            }
         };
         var ctrl = new lists.BaseControl(cfg);
         ctrl.saveOptions(cfg);
         ctrl._beforeMount(cfg);


         // два таймаута, первый - загрузка начального рекордсета, второй - на последюущий запрос
         setTimeout(function() {
            lists.BaseControl._private.scrollToEdge(ctrl, 'down');
            setTimeout(function() {
               assert.equal(3, ctrl._listViewModel.getCount(), 'Items wasn\'t load');
               done();
            }, 100);
         }, 100);
      });

      let triggers = {
         topVirtualScrollTrigger:{
            style:{
               top:0
            }
         },
         topLoadTrigger:{
            style:{
               top:0
            }
         },
         bottomVirtualScrollTrigger:{
            style:{
               bottom:0
            }
         },
         bottomLoadTrigger:{
            style:{
               bottom:0
            }
         }
      };
      it('ScrollPagingController', function(done) {
         var rs = new collection.RecordSet({
            idProperty: 'id',
            rawData: data
         });

         var source = new sourceLib.Memory({
            idProperty: 'id',
            data: data
         });

         var cfg = {
            viewName: 'Controls/List/ListView',
            source: source,
            viewConfig: {
               keyProperty: 'id'
            },
            viewModelConfig: {
               items: rs,
               keyProperty: 'id'
            },
            viewModelConstructor: lists.ListViewModel,
            navigation: {
               view: 'infinity',
               source: 'page',
               viewConfig: {
                  pagingMode: 'direct'
               },
               sourceConfig: {
                  pageSize: 3,
                  page: 0,
                  hasMore: false
               }
            },
         };
         var ctrl = new lists.BaseControl(cfg);
         ctrl.saveOptions(cfg);
         ctrl._beforeMount(cfg);

         ctrl._children = triggers;
         // эмулируем появление скролла
         lists.BaseControl._private.onScrollShow(ctrl);

         // скроллпэйджиг контроллер создается асинхронном
         setTimeout(function() {
            assert.isTrue(!!ctrl._scrollPagingCtr, 'ScrollPagingController wasn\'t created');


            // прокручиваем к низу, проверяем состояние пэйджинга
            lists.BaseControl._private.handleListScroll(ctrl, {
               scrollTop: 300,
               position: 'down'
            });
            assert.deepEqual({
               stateBegin: 'normal',
               statePrev: 'normal',
               stateNext: 'normal',
               stateEnd: 'normal'
            }, ctrl._pagingCfg, 'Wrong state of paging arrows after scroll to bottom');

            lists.BaseControl._private.handleListScroll(ctrl, {
               scrollTop: 200,
               position: 'middle'
            });
            assert.deepEqual({
               stateBegin: 'normal',
               statePrev: 'normal',
               stateNext: 'normal',
               stateEnd: 'normal'
            }, ctrl._pagingCfg, 'Wrong state of paging arrows after scroll');

            lists.BaseControl._private.onScrollHide(ctrl);
            assert.deepEqual({stateBegin: 'normal', statePrev: 'normal', stateNext: 'normal', stateEnd: 'normal'}, ctrl._pagingCfg, 'Wrong state of paging after scrollHide');
            assert.isFalse(ctrl._pagingVisible, 'Wrong state _pagingVisible after scrollHide');

            lists.BaseControl._private.handleListScroll(ctrl, {
               scrollTop: 200,
               position: 'middle'
            });

            setTimeout(function() {
               assert.isFalse(ctrl._pagingVisible);
               done();
            }, 100);

         }, 100);
      });


      it('_onViewPortResize, setLoadOffset', function() {
         let bc = new lists.BaseControl();
         bc._needScrollCalculation = true;
         bc._loadOffset = {top: 100, bottom: 100};
         bc._children = triggers;;
         lists.BaseControl._private.onScrollShow(bc);
         bc._onViewPortResize(bc, 600)
         assert.deepEqual(bc._loadOffset, {top: 200, bottom: 200});

         //Если контрол в состоянии ошибки, то не нужно ничего делать
         bc.__error = true;
         bc._setLoadOffset(100, 100);
         assert.deepEqual(bc._loadOffset, {top: 200, bottom: 200});

      });

      it('scrollHide/scrollShow base control state', function() {
         var cfg = {
            navigation: {
               view: 'infinity',
               source: 'page',
               viewConfig: {
                  pagingMode: 'direct'
               },
               sourceConfig: {
                  pageSize: 3,
                  page: 0,
                  hasMore: false
               }
            }
         };
         var baseControl = new lists.BaseControl(cfg);
         baseControl._children = triggers;
         baseControl.saveOptions(cfg);
         baseControl._needScrollCalculation = true;
         baseControl._isScrollShown = true;
         baseControl._loadOffset = {top: 10, bottom: 10};

         lists.BaseControl._private.onScrollHide(baseControl);
         assert.deepEqual({top: 0, bottom: 0}, baseControl._loadOffset);
         assert.isFalse(baseControl._isScrollShown);

         lists.BaseControl._private.onScrollShow(baseControl);
         assert.deepEqual({top: 100, bottom: 100}, baseControl._loadOffset);
         assert.isTrue(baseControl._isScrollShown);

      });

      it('scrollToEdge without load', function(done) {
         var rs = new collection.RecordSet({
            idProperty: 'id',
            rawData: data
         });

         var source = new sourceLib.Memory({
            idProperty: 'id',
            data: data
         });

         var cfg = {
            viewName: 'Controls/List/ListView',
            source: source,
            viewConfig: {
               keyProperty: 'id'
            },
            viewModelConfig: {
               items: rs,
               keyProperty: 'id'
            },
            viewModelConstructor: lists.ListViewModel,
            navigation: {
               source: 'page',
               sourceConfig: {
                  pageSize: 6,
                  page: 0,
                  hasMore: false
               },
               view: 'infinity',
               viewConfig: {
                  pagingMode: 'direct'
               }
            }
         };
         var ctrl = new lists.BaseControl(cfg);
         ctrl.saveOptions(cfg);
         ctrl._beforeMount(cfg);

         // дождемся загрузки списка
         setTimeout(function() {
            result = false;
            ctrl._notify = function(event, dir) {
               result = dir;
            };

            // прокручиваем к низу, проверяем состояние пэйджинга
            lists.BaseControl._private.scrollToEdge(ctrl, 'down');
            assert.equal(result, 'bottom', 'List wasn\'t scrolled to bottom');

            lists.BaseControl._private.scrollToEdge(ctrl, 'up');
            assert.equal(result, 'top', 'List wasn\'t scrolled to top');

            done();
         }, 100);
      });

      it('__onPagingArrowClick', function(done) {
         var rs = new collection.RecordSet({
            idProperty: 'id',
            rawData: data
         });

         var source = new sourceLib.Memory({
            idProperty: 'id',
            data: data
         });

         var cfg = {
            viewName: 'Controls/List/ListView',
            source: source,
            viewConfig: {
               keyProperty: 'id'
            },
            viewModelConfig: {
               items: rs,
               keyProperty: 'id'
            },
            viewModelConstructor: lists.ListViewModel,
            navigation: {
               source: 'page',
               sourceConfig: {
                  pageSize: 6,
                  page: 0,
                  hasMore: false
               },
               view: 'infinity',
               viewConfig: {
                  pagingMode: 'direct'
               }
            }
         };
         var ctrl = new lists.BaseControl(cfg);
         ctrl.saveOptions(cfg);
         ctrl._beforeMount(cfg);
         ctrl._children = triggers;
         // эмулируем появление скролла
         lists.BaseControl._private.onScrollShow(ctrl);

         // скроллпэйджиг контроллер создается асинхронном
         setTimeout(function() {
            ctrl._notify = function(eventName, type) {
               result = type;
            };

            // прокручиваем к низу, проверяем состояние пэйджинга
            result = false;
            ctrl.__onPagingArrowClick({}, 'End');
            assert.equal('bottom', result[0], 'Wrong state of scroll after clicking to End');

            // прокручиваем к верху, проверяем состояние пэйджинга
            ctrl.__onPagingArrowClick({}, 'Begin');
            assert.equal('top', result[0], 'Wrong state of scroll after clicking to Begin');

            // прокручиваем страницу вверх и вниз, проверяем состояние пэйджинга
            ctrl.__onPagingArrowClick({}, 'Next');
            assert.equal('pageDown', result[0], 'Wrong state of scroll after clicking to Next');

            ctrl.__onPagingArrowClick({}, 'Prev');
            assert.equal('pageUp', result[0], 'Wrong state of scroll after clicking to Prev');

            done();
         }, 100);
      });

      it('__onEmitScroll', function(done) {
         var rs = new collection.RecordSet({
            idProperty: 'id',
            rawData: data
         });

         var source = new sourceLib.Memory({
            idProperty: 'id',
            data: data
         });

         var cfg = {
            viewName: 'Controls/List/ListView',
            source: source,
            viewConfig: {
               keyProperty: 'id'
            },
            viewModelConfig: {
               items: rs,
               keyProperty: 'id'
            },
            viewModelConstructor: lists.ListViewModel,
            navigation: {
               source: 'page',
               sourceConfig: {
                  pageSize: 6,
                  page: 0,
                  hasMore: false
               },
               view: 'infinity',
               viewConfig: {
                  pagingMode: 'direct'
               }
            }
         };
         var ctrl = new lists.BaseControl(cfg);
         ctrl.saveOptions(cfg);
         ctrl._beforeMount(cfg);
         ctrl._children = triggers;

         // эмулируем появление скролла
         lists.BaseControl._private.onScrollShow(ctrl);

         // скроллпэйджиг контроллер создается асинхронном
         setTimeout(function() {
            ctrl._notify = function(eventName, type) {
               result = type;
            };

            // прогоняем все варианты, без проверки, т.к. все ветки уже тестируются выше
            ctrl.__onEmitScroll({}, 'loadTop');
            ctrl.__onEmitScroll({}, 'loadBottom');
            ctrl.__onEmitScroll({}, 'listTop');
            ctrl.__onEmitScroll({}, 'listBottom');
            ctrl.__onEmitScroll({}, 'scrollMove', { scrollTop: 200 });
            ctrl.__onEmitScroll({}, 'canScroll');
            ctrl.__onEmitScroll({}, 'cantScroll');

            ctrl.reload();

            done();
         }, 100);
      });

      it('_processError', function() {
         var self = {
            _loadingState: 'all',
            _forceUpdate: () => {},
            __errorController: {
               process: () => {
                  return new Promise(() => {});
               }
            }
         };

         lists.BaseControl._private.processError(self, {error: {}});
         assert.equal(self._loadingState, null);
      });

      it('__needShowEmptyTemplate', () => {
         let baseControlOptions = {
            viewModelConstructor: lists.ListViewModel,
            viewConfig: {
               keyProperty: 'id'
            },
            viewModelConfig: {
               items: rs,
               keyProperty: 'id'
            },
            viewName: 'Controls/List/ListView',
            source: source,
            emptyTemplate: null
         };

         let baseControl = new lists.BaseControl(baseControlOptions);
         baseControl.saveOptions(baseControlOptions);

         return new Promise(function(resolve) {
            baseControl._beforeMount(baseControlOptions).addCallback(function(result) {
               assert.isFalse(!!baseControl.__needShowEmptyTemplate(baseControl._options.emptyTemplate, baseControl._listViewModel, baseControl._loadingState));

               baseControl._listViewModel.getItems().clear();
               baseControl._options.emptyTemplate = {};
               assert.isTrue(!!baseControl.__needShowEmptyTemplate(baseControl._options.emptyTemplate, baseControl._listViewModel, baseControl._loadingState));

               baseControl._loadingState = 'down';
               assert.isFalse(!!baseControl.__needShowEmptyTemplate(baseControl._options.emptyTemplate, baseControl._listViewModel, baseControl._loadingState));

               baseControl._loadingState = 'all';
               assert.isFalse(!!baseControl.__needShowEmptyTemplate(baseControl._options.emptyTemplate, baseControl._listViewModel, baseControl._loadingState));

               baseControl._emptyTemplateVisibility = true;
               assert.isTrue(!!baseControl.__needShowEmptyTemplate(baseControl._options.emptyTemplate, baseControl._listViewModel, baseControl._loadingState));

               baseControl._listViewModel._editingItemData = {};
               assert.isFalse(!!baseControl.__needShowEmptyTemplate(baseControl._options.emptyTemplate, baseControl._listViewModel, baseControl._loadingState));
               resolve();

               return result;
            });
         });
      });

      it('reload with changing source/navig/filter should call scroll to start', function() {

         var
             lnSource = new sourceLib.Memory({
                idProperty: 'id',
                data: data
             }),
             lnSource2 = new sourceLib.Memory({
                idProperty: 'id',
                data: [{
                   id: 4,
                   title: 'Четвертый',
                   type: 1
                },
                   {
                      id: 5,
                      title: 'Пятый',
                      type: 2
                   }]
             }),
             lnSource3 = new sourceLib.Memory({
                idProperty: 'id',
                data: []
             }),
             lnCfg = {
                viewName: 'Controls/List/ListView',
                source: lnSource,
                keyProperty: 'id',
                markedKey: 3,
                viewModelConstructor: lists.ListViewModel
             },
             lnBaseControl = new lists.BaseControl(lnCfg);

         lnBaseControl.saveOptions(lnCfg);
         lnBaseControl._beforeMount(lnCfg);

         assert.equal(lnBaseControl._markedKeyForRestoredScroll, null);

         return new Promise(function (resolve) {
            setTimeout(function () {
               lists.BaseControl._private.reload(lnBaseControl, lnCfg);
               setTimeout(function () {
                  assert.equal(lnBaseControl._markedKeyForRestoredScroll, null);
                  lnCfg = clone(lnCfg);
                  lnCfg.source = lnSource2;
                  lnBaseControl._isScrollShown = true;
                  lnBaseControl._beforeUpdate(lnCfg).addCallback(function() {
                     assert.equal(lnBaseControl._markedKeyForRestoredScroll, 4);
                     lnBaseControl._markedKeyForRestoredScroll = null;

                     lnCfg = clone(lnCfg);
                     lnCfg.source = lnSource3;
                     lnBaseControl._beforeUpdate(lnCfg).addCallback(function(res) {
                        assert.equal(lnBaseControl._markedKeyForRestoredScroll, null);
                        resolve();
                        return res;
                     });
                  });
               }, 10);
            },10);
         });
      });

      it('reloadRecordSet', function() {

         var
            lnSource = new sourceLib.Memory({
               idProperty: 'id',
               data: data
            }),
            lnSource2 = new sourceLib.Memory({
               idProperty: 'id',
               data: [{
                  id: 4,
                  title: 'Четвертый',
                  type: 1
               },
                  {
                     id: 5,
                     title: 'Пятый',
                     type: 2
                  }]
            }),
            lnCfg = {
               viewName: 'Controls/List/ListView',
               source: lnSource,
               keyProperty: 'id',
               markedKey: 3,
               viewModelConstructor: lists.ListViewModel
            },
            lnBaseControl = new lists.BaseControl(lnCfg);

         lnBaseControl.saveOptions(lnCfg);
         lnBaseControl._beforeMount(lnCfg);
         assert.equal(lnBaseControl._markedKeyForRestoredScroll, null);

         lnBaseControl._isScrollShown = true;
         lnBaseControl.reload().addCallback(() => {
            assert.equal(lnBaseControl._markedKeyForRestoredScroll, 3); // set to existing markedKey
         }).addCallback(() => {
            let lnCfg2 = clone(lnCfg);
            lnCfg2.source = lnSource2;
            lnBaseControl._isScrollShown = true;
            lnBaseControl._beforeUpdate(lnCfg2).addCallback(() => {
               assert.equal(lnBaseControl._markedKeyForRestoredScroll, 4); // set to first item, because markedKey = 3, no longer exist
            });
         })
      });
      it('hasItemActions', function() {
         let itemAct = [1, 2, 3];
         let itemActionsProp = 'itemActions';
         assert.isTrue(lists.BaseControl._private.hasItemActions(itemAct));
         assert.isTrue(lists.BaseControl._private.hasItemActions(undefined, itemActionsProp));
         assert.isFalse(lists.BaseControl._private.hasItemActions(undefined, undefined));
      });
      describe('_canUpdateItemsActions', function() {
         var lnSource = new sourceLib.Memory({
               idProperty: 'id',
               data: data
            }),
            lnCfg = {
               viewName: 'Controls/List/ListView',
               source: lnSource,
               keyProperty: 'id',
               itemActions: [
                  {
                     id: 1,
                     title: '123'
                  }
               ],
               viewModelConstructor: lists.ListViewModel
            },
            lnBaseControl = new lists.BaseControl(lnCfg);

         lnBaseControl.saveOptions(lnCfg);
         lnBaseControl._beforeMount(lnCfg);
         lnBaseControl._context = {
            isTouch: {
               isTouch: false
            }
         };
         it('afterMount', function() {
            lnBaseControl._afterMount(lnCfg);
            assert.isTrue(lnBaseControl._canUpdateItemsActions);
            lnBaseControl._afterUpdate(lnCfg);
            assert.isFalse(lnBaseControl._canUpdateItemsActions);
         });
         it('itemsChanged', async function() {
            lnBaseControl._itemsChanged = true;
            await lnBaseControl._beforeUpdate(lnCfg);
            assert.isTrue(lnBaseControl._canUpdateItemsActions);
            lnBaseControl._afterUpdate(lnCfg);
         });
         it('hoveredItemChanged', function() {
            lnBaseControl._onHoveredItemChanged({}, {});
            assert.isTrue(lnBaseControl._canUpdateItemsActions);
            lnBaseControl._afterUpdate(lnCfg);
            assert.isFalse(lnBaseControl._canUpdateItemsActions);
            lnBaseControl._context.isTouch.isTouch = true;
            lnBaseControl._onHoveredItemChanged({}, {});
            assert.isFalse(lnBaseControl._canUpdateItemsActions);
            lnBaseControl._context.isTouch.isTouch = false;
            lnBaseControl._afterUpdate(lnCfg);
         });
         it('locking by scroll', async function () {
            lists.BaseControl._private.handleListScrollSync(lnBaseControl);
            lnBaseControl._onHoveredItemChanged({}, {});
            assert.isFalse(lnBaseControl._canUpdateItemsActions);
            await setTimeout(function() {
               lists.BaseControl._private.handleListScrollSync(lnBaseControl);
               assert.isFalse(lnBaseControl._canUpdateItemsActions);
               setTimeout(function() {
                  assert.isFalse(lnBaseControl._canUpdateItemsActions);
                  setTimeout(function() {
                     assert.isTrue(lnBaseControl._canUpdateItemsActions);
                  }, 100);
               }, 100);
            }, 100)
            lnBaseControl._afterUpdate(lnCfg);
         });
         it('locking by DnD', async function () {
            lnBaseControl._listViewModel.getItemDataByItem = function() {};
            lnBaseControl._listViewModel.setDragItemData = function() {};
            lnBaseControl._itemDragData = {
               dispItem: {}
            };
            lnBaseControl._dragStart({}, {});
            lnBaseControl._onHoveredItemChanged({}, {});
            assert.isFalse(lnBaseControl._canUpdateItemsActions);
            lnBaseControl._dragEnd({}, {});
            assert.isTrue(lnBaseControl._canUpdateItemsActions);
            lnBaseControl._afterUpdate(lnCfg);
         });

      });

      it('List navigation by keys and after reload', function(done) {
         // mock function working with DOM
         lists.BaseControl._private.scrollToItem = function() {};

         var
            stopImmediateCalled = false,
            preventDefaultCalled = false,
            getParamsKeyDown = function(keyCode) {
               return {
                  stopImmediatePropagation: function() {
                     stopImmediateCalled = true;
                  },
                  target: {closest() { return false; }},
                  nativeEvent: {
                     keyCode: keyCode
                  },
                  preventDefault: function() {
                     preventDefaultCalled = true;
                  }
               };
            },

            lnSource = new sourceLib.Memory({
               idProperty: 'id',
               data: data
            }),
            lnCfg = {
               viewName: 'Controls/List/ListView',
               source: lnSource,
               keyProperty: 'id',
               markedKey: 1,
               viewModelConstructor: lists.ListViewModel
            },
            lnCfg2 = {
               viewName: 'Controls/List/ListView',
               source: new sourceLib.Memory({
                  idProperty: 'id',
                  data: [{
                     id: 'firstItem',
                     title: 'firstItem'
                  }]
               }),
               keyProperty: 'id',
               markedKey: 1,
               viewModelConstructor: lists.ListViewModel
            },
            lnBaseControl = new lists.BaseControl(lnCfg);

         lnBaseControl.saveOptions(lnCfg);
         lnBaseControl._beforeMount(lnCfg);

         setTimeout(function() {
            assert.equal(lnBaseControl.getViewModel().getMarkedKey(), 1, 'Invalid initial value of markedKey.');
            lnBaseControl.reload();
            setTimeout(function () {
               assert.equal(lnBaseControl.getViewModel().getMarkedKey(), 1, 'Invalid value of markedKey after reload.');

               lnBaseControl._onViewKeyDown(getParamsKeyDown(Env.constants.key.down));
               assert.equal(lnBaseControl.getViewModel().getMarkedKey(), 2, 'Invalid value of markedKey after press "down".');

               lnBaseControl._children = {
                  selectionController: {
                     onCheckBoxClick: function() {
                     }
                  }
               };
               lnBaseControl._onViewKeyDown(getParamsKeyDown(Env.constants.key.space));
               assert.equal(lnBaseControl.getViewModel().getMarkedKey(), 3, 'Invalid value of markedKey after press "space".');
               assert.isTrue(preventDefaultCalled);

               lnBaseControl._onViewKeyDown(getParamsKeyDown(Env.constants.key.up));
               assert.equal(lnBaseControl.getViewModel().getMarkedKey(), 2, 'Invalid value of markedKey after press "up".');

               assert.isTrue(stopImmediateCalled, 'Invalid value "stopImmediateCalled"');

               // reload with new source (first item with id "firstItem")
               lnBaseControl._beforeUpdate(lnCfg2);

               setTimeout(function() {
                  assert.equal(lnBaseControl.getViewModel().getMarkedKey(), 'firstItem', 'Invalid value of markedKey after set new source.');
                  done();
               }, 1);
            }, 1);
         }, 1);
      });

      it('_onCheckBoxClick', function() {
         var rs = new collection.RecordSet({
            idProperty: 'id',
            rawData: data
         });

         var source = new sourceLib.Memory({
            idProperty: 'id',
            data: data
         });

         var cfg = {
            selectedKeys: [1, 3],
            viewName: 'Controls/List/ListView',
            source: source,
            viewConfig: {
               keyProperty: 'id'
            },
            viewModelConfig: {
               items: rs,
               keyProperty: 'id',
               selectedKeys: [1, 3]
            },
            viewModelConstructor: lists.ListViewModel,
            navigation: {
               source: 'page',
               sourceConfig: {
                  pageSize: 6,
                  page: 0,
                  hasMore: false
               },
               view: 'infinity',
               viewConfig: {
                  pagingMode: 'direct'
               }
            }
         };
         var ctrl = new lists.BaseControl(cfg);
         ctrl.saveOptions(cfg);
         ctrl._beforeMount(cfg);
         ctrl._notify = function(e, args) {
            assert.equal(e, 'checkboxClick');
            assert.equal(args[0], 2);
            assert.equal(args[1], 0);
         };
         ctrl._children = {
            selectionController: {
               onCheckBoxClick: function(key, status) {
                  assert.equal(key, 2);
                  assert.equal(status, 0);
               }
            }
         };
         ctrl._onCheckBoxClick({}, 2, 0);
         ctrl._notify = function(e, args) {
            assert.equal(e, 'checkboxClick');
            assert.equal(args[0], 1);
            assert.equal(args[1], 1);
         };
         ctrl._children = {
            selectionController: {
               onCheckBoxClick: function(key, status) {
                  assert.equal(key, 1);
                  assert.equal(status, 1);
               }
            }
         };
         ctrl._onCheckBoxClick({}, 1, 1);
      });

      it('_onItemClick', function() {
         var cfg = {
            keyProperty: 'id',
            viewName: 'Controls/List/ListView',
            source: source,
            items: rs,
            viewModelConstructor: lists.ListViewModel
         };
         var originalEvent = {
            target: {
               closest: function(selector) {
                  return selector === '.js-controls-ListView__checkbox';
               },
               getAttribute: function(attrName) {
                  return attrName === 'contenteditable' ? 'true' : '';
               }
            }
         };
         var stopPropagationCalled = false;
         var event = {
            stopPropagation: function() {
               stopPropagationCalled = true;
            }
         };
         var ctrl = new lists.BaseControl(cfg);
         ctrl.saveOptions(cfg);
         ctrl._beforeMount(cfg);
         ctrl._onItemClick(event, rs.at(2), originalEvent);
         assert.isTrue(stopPropagationCalled);
         assert.equal(rs.at(2), ctrl._listViewModel.getMarkedItem().getContents());
      });
      it ('needFooterPadding', function() {
         let cfg = {
            itemActionsPosition: 'outside'
         };
         assert.isTrue(lists.BaseControl._private.needBottomPadding(cfg), "itemActionsPosinon is outside, padding is needed");
         cfg = {
            itemActionsPosition: 'inside'
         };
         assert.isFalse(lists.BaseControl._private.needBottomPadding(cfg), "itemActionsPosinon is inside, padding is not needed");
         cfg = {
            itemActionsPosition: 'outside',
            footerTemplate: "footer"
         };
         assert.isFalse(lists.BaseControl._private.needBottomPadding(cfg), "itemActionsPosinon is outside, footer exists, padding is not needed");
         cfg = {
            itemActionsPosition: 'outside',
            resultsPosition: "bottom"
         };
         assert.isFalse(lists.BaseControl._private.needBottomPadding(cfg), "itemActionsPosinon is outside, results row is in bottom padding is not needed");
      });
      describe('EditInPlace', function() {
         it('beginEdit', function() {
            var opt = {
               test: 'test'
            };
            var cfg = {
               viewName: 'Controls/List/ListView',
               source: source,
               viewConfig: {
                  keyProperty: 'id'
               },
               viewModelConfig: {
                  items: rs,
                  keyProperty: 'id',
                  selectedKeys: [1, 3]
               },
               viewModelConstructor: lists.ListViewModel,
               navigation: {
                  source: 'page',
                  sourceConfig: {
                     pageSize: 6,
                     page: 0,
                     hasMore: false
                  },
                  view: 'infinity',
                  viewConfig: {
                     pagingMode: 'direct'
                  }
               }
            };
            var ctrl = new lists.BaseControl(cfg);
            ctrl._children = {
               editInPlace: {
                  beginEdit: function(options) {
                     assert.equal(options, opt);
                     return cDeferred.success();
                  }
               }
            };
            var result = ctrl.beginEdit(opt);
            assert.isTrue(cInstance.instanceOfModule(result, 'Core/Deferred'));
            assert.isTrue(result.isSuccessful());
         });

         it('_onAfterBeginEdit', function () {
            let
                cfg = {
                   viewName: 'Controls/List/ListView',
                   source: source,
                   viewConfig: {
                      keyProperty: 'id'
                   },
                   viewModelConfig: {
                      items: rs,
                      keyProperty: 'id',
                      selectedKeys: [1, 3]
                   },
                   viewModelConstructor: lists.ListViewModel,
                   navigation: {
                      source: 'page',
                      sourceConfig: {
                         pageSize: 6,
                         page: 0,
                         hasMore: false
                      },
                      view: 'infinity',
                      viewConfig: {
                         pagingMode: 'direct'
                      }
                   }
                },
                called = false,
                actionsUpdated = false,
                ctrl = new lists.BaseControl(cfg);
            ctrl._children = {
               editInPlace: {
                  beginEdit: () => {
                     return ctrl._onAfterBeginEdit();
                  }
               },
               itemActions: {
                  updateItemActions: () => {
                     actionsUpdated = true;
                  }
               }
            };
            ctrl._options = {
               itemActions: []
            };
            ctrl._notify = function(eName) {
               if (eName === 'afterBeginEdit') {
                  called = true;
               }
               return {anyField: 12};
            };
            let result  = ctrl.beginEdit();
            assert.deepEqual({anyField: 12}, result);
            assert.isTrue(actionsUpdated);
            assert.isTrue(called);
            ctrl._afterUpdate({
               viewModelConstructor: null
            });
         });

         it('beginAdd', function() {
            var opt = {
               test: 'test'
            };
            var cfg = {
               viewName: 'Controls/List/ListView',
               source: source,
               viewConfig: {
                  keyProperty: 'id'
               },
               viewModelConfig: {
                  items: rs,
                  keyProperty: 'id',
                  selectedKeys: [1, 3]
               },
               viewModelConstructor: lists.ListViewModel,
               navigation: {
                  source: 'page',
                  sourceConfig: {
                     pageSize: 6,
                     page: 0,
                     hasMore: false
                  },
                  view: 'infinity',
                  viewConfig: {
                     pagingMode: 'direct'
                  }
               }
            };
            var ctrl = new lists.BaseControl(cfg);
            ctrl._children = {
               editInPlace: {
                  beginAdd: function(options) {
                     assert.equal(options, opt);
                     return cDeferred.success();
                  }
               }
            };
            var result = ctrl.beginAdd(opt);
            assert.isTrue(cInstance.instanceOfModule(result, 'Core/Deferred'));
            assert.isTrue(result.isSuccessful());
         });

         it('cancelEdit', function() {
            var cfg = {
               viewName: 'Controls/List/ListView',
               source: source,
               viewConfig: {
                  keyProperty: 'id'
               },
               viewModelConfig: {
                  items: rs,
                  keyProperty: 'id',
                  selectedKeys: [1, 3]
               },
               viewModelConstructor: lists.ListViewModel,
               navigation: {
                  source: 'page',
                  sourceConfig: {
                     pageSize: 6,
                     page: 0,
                     hasMore: false
                  },
                  view: 'infinity',
                  viewConfig: {
                     pagingMode: 'direct'
                  }
               }
            };
            var ctrl = new lists.BaseControl(cfg);
            ctrl._children = {
               editInPlace: {
                  cancelEdit: function() {
                     return cDeferred.success();
                  }
               }
            };
            var result = ctrl.cancelEdit();
            assert.isTrue(cInstance.instanceOfModule(result, 'Core/Deferred'));
            assert.isTrue(result.isSuccessful());
         });

         it('cancelEdit, readOnly: true', function() {
            var cfg = {
               viewName: 'Controls/List/ListView',
               source: source,
               viewConfig: {
                  keyProperty: 'id'
               },
               viewModelConfig: {
                  items: rs,
                  keyProperty: 'id',
                  selectedKeys: [1, 3]
               },
               viewModelConstructor: lists.ListViewModel,
               navigation: {
                  source: 'page',
                  sourceConfig: {
                     pageSize: 6,
                     page: 0,
                     hasMore: false
                  },
                  view: 'infinity',
                  viewConfig: {
                     pagingMode: 'direct'
                  }
               },
               readOnly: true
            };
            var ctrl = new lists.BaseControl(cfg);
            ctrl.saveOptions(cfg);
            var result = ctrl.cancelEdit();
            assert.isTrue(cInstance.instanceOfModule(result, 'Core/Deferred'));
            assert.isFalse(result.isSuccessful());
         });

         it('commitEdit', function() {
            var cfg = {
               viewName: 'Controls/List/ListView',
               source: source,
               viewConfig: {
                  keyProperty: 'id'
               },
               viewModelConfig: {
                  items: rs,
                  keyProperty: 'id',
                  selectedKeys: [1, 3]
               },
               viewModelConstructor: lists.ListViewModel,
               navigation: {
                  source: 'page',
                  sourceConfig: {
                     pageSize: 6,
                     page: 0,
                     hasMore: false
                  },
                  view: 'infinity',
                  viewConfig: {
                     pagingMode: 'direct'
                  }
               }
            };
            var ctrl = new lists.BaseControl(cfg);
            ctrl._children = {
               editInPlace: {
                  commitEdit: function() {
                     return cDeferred.success();
                  }
               }
            };
            var result = ctrl.commitEdit();
            assert.isTrue(cInstance.instanceOfModule(result, 'Core/Deferred'));
            assert.isTrue(result.isSuccessful());
         });

         it('commitEdit, readOnly: true', function() {
            var cfg = {
               viewName: 'Controls/List/ListView',
               source: source,
               viewConfig: {
                  keyProperty: 'id'
               },
               viewModelConfig: {
                  items: rs,
                  keyProperty: 'id',
                  selectedKeys: [1, 3]
               },
               viewModelConstructor: lists.ListViewModel,
               navigation: {
                  source: 'page',
                  sourceConfig: {
                     pageSize: 6,
                     page: 0,
                     hasMore: false
                  },
                  view: 'infinity',
                  viewConfig: {
                     pagingMode: 'direct'
                  }
               },
               readOnly: true
            };
            var ctrl = new lists.BaseControl(cfg);
            ctrl.saveOptions(cfg);
            var result = ctrl.commitEdit();
            assert.isTrue(cInstance.instanceOfModule(result, 'Core/Deferred'));
            assert.isFalse(result.isSuccessful());
         });

         it('readOnly, beginEdit', function() {
            var opt = {
               test: 'test'
            };
            var cfg = {
               viewName: 'Controls/List/ListView',
               source: source,
               viewConfig: {
                  keyProperty: 'id'
               },
               viewModelConfig: {
                  items: rs,
                  keyProperty: 'id',
                  selectedKeys: [1, 3]
               },
               viewModelConstructor: lists.ListViewModel,
               navigation: {
                  source: 'page',
                  sourceConfig: {
                     pageSize: 6,
                     page: 0,
                     hasMore: false
                  },
                  view: 'infinity',
                  viewConfig: {
                     pagingMode: 'direct'
                  }
               },
               readOnly: true
            };
            var ctrl = new lists.BaseControl(cfg);
            ctrl.saveOptions(cfg);
            var result = ctrl.beginEdit(opt);
            assert.isTrue(cInstance.instanceOfModule(result, 'Core/Deferred'));
            assert.isFalse(result.isSuccessful());
         });

         it('readOnly, beginAdd', function() {
            var opt = {
               test: 'test'
            };
            var cfg = {
               viewName: 'Controls/List/ListView',
               source: source,
               viewConfig: {
                  keyProperty: 'id'
               },
               viewModelConfig: {
                  items: rs,
                  keyProperty: 'id',
                  selectedKeys: [1, 3]
               },
               viewModelConstructor: lists.ListViewModel,
               navigation: {
                  source: 'page',
                  sourceConfig: {
                     pageSize: 6,
                     page: 0,
                     hasMore: false
                  },
                  view: 'infinity',
                  viewConfig: {
                     pagingMode: 'direct'
                  }
               },
               readOnly: true
            };
            var ctrl = new lists.BaseControl(cfg);
            ctrl.saveOptions(cfg);
            var result = ctrl.beginAdd(opt);
            assert.isTrue(cInstance.instanceOfModule(result, 'Core/Deferred'));
            assert.isFalse(result.isSuccessful());
         });
      });

      it('_onAnimationEnd', function() {
         var setRightSwipedItemCalled = false;
         var ctrl = new lists.BaseControl();
         ctrl._listViewModel = {
            setRightSwipedItem: function() {
               setRightSwipedItemCalled = true;
            }
         };
         ctrl._onAnimationEnd({
            nativeEvent: {
               animationName: 'test'
            }
         });
         assert.isFalse(setRightSwipedItemCalled);
         ctrl._onAnimationEnd({
            nativeEvent: {
               animationName: 'rightSwipe'
            }
         });
         assert.isTrue(setRightSwipedItemCalled);
      });

      it('can\'t start drag on readonly list', function () {
         let
             cfg = {
                viewName: 'Controls/List/ListView',
                source: source,
                viewConfig: {
                   keyProperty: 'id'
                },
                viewModelConfig: {
                   items: rs,
                   keyProperty: 'id',
                   selectedKeys: [1, 3]
                },
                viewModelConstructor: lists.ListViewModel,
                navigation: {
                   source: 'page',
                   sourceConfig: {
                      pageSize: 6,
                      page: 0,
                      hasMore: false
                   },
                   view: 'infinity',
                   viewConfig: {
                      pagingMode: 'direct'
                   }
                },
                readOnly: true,
             },
             ctrl = new lists.BaseControl();
         ctrl.saveOptions(cfg);
         ctrl._beforeMount(cfg);
         ctrl.itemsDragNDrop = true;
         ctrl._itemMouseDown({}, {key: 1}, {});
         assert.isUndefined(ctrl._itemDragData);
      });

      it('_dragEnter only works with ItemsEntity', function() {
         const ctrl = new lists.BaseControl({});

         ctrl._listViewModel = {
            getDragEntity: () => null
         };

         let
            notifiedEvent = null,
            notifiedEntity = null;

         ctrl._notify = function(eventName, dragEntity) {
            notifiedEvent = eventName;
            notifiedEntity = dragEntity && dragEntity[0];
         };

         const badDragObject = { entity: {} };
         ctrl._dragEnter({}, badDragObject);
         assert.isNull(notifiedEvent);

         const goodDragObject = {
            entity: {
               '[Controls/dragnDrop:ItemsEntity]': true
            }
         };
         ctrl._dragEnter({}, goodDragObject);
         assert.strictEqual(notifiedEvent, 'dragEnter');
         assert.strictEqual(notifiedEntity, goodDragObject.entity);
      });
      it('native drag prevent only by native "dragstart" event', function() {
         let isDefaultPrevented = false;

         const
            cfg = {
               viewName: 'Controls/List/ListView',
               source: source,
               viewConfig: {
                  keyProperty: 'id'
               },
               viewModelConfig: {
                  items: rs,
                  keyProperty: 'id',
                  selectedKeys: [null],
                  excludedKeys: []
               },
               viewModelConstructor: lists.ListViewModel,
               navigation: {
                  source: 'page',
                  sourceConfig: {
                     pageSize: 6,
                     page: 0,
                     hasMore: false
                  },
                  view: 'infinity',
                  viewConfig: {
                     pagingMode: 'direct'
                  }
               },
               items: rs,
               selectedKeys: [null],
               excludedKeys: [],
               readOnly: false,
               itemsDragNDrop: true
            },
            ctrl = new lists.BaseControl(),
            fakeMouseDown = {
               target: {
                  closest: () => false
               },
               preventDefault: () => isDefaultPrevented = true
            },
            fakeDragStart = {
               preventDefault: () => isDefaultPrevented = true
            };

         ctrl.saveOptions(cfg);
         ctrl._beforeMount(cfg);

         // по mouseDown нельзя вызывать preventDefault, иначе сломается фокусировка
         ctrl._itemMouseDown({}, { key: 1 }, fakeMouseDown);
         assert.isFalse(isDefaultPrevented);

          // По dragStart нужно вызывать preventDefault
         ctrl._nativeDragStart(fakeDragStart);
         assert.isTrue(isDefaultPrevented);
      });

      it('_documentDragEnd', function() {
         var
            dragEnded,
            ctrl = new lists.BaseControl();

         //dragend without deferred
         dragEnded = false;
         ctrl._documentDragEndHandler = function() {
            dragEnded = true;
         };
         ctrl._documentDragEnd();
         assert.isTrue(dragEnded);

         //dragend with deferred
         dragEnded = false;
         // ctrl._dragEndResultPromise = new Promise((res) => {res('hello')})
         ctrl._dragEndResult = new cDeferred();
         ctrl._documentDragEnd();
         assert.isFalse(dragEnded);
         assert.isTrue(!!ctrl._loadingState);
         ctrl._dragEndResult.then(() => {
            assert.isTrue(dragEnded);
            assert.isFalse(!!ctrl._loadingState);
         });


      });

      it('getSelectionForDragNDrop', function() {
         var selection;

         selection = lists.BaseControl._private.getSelectionForDragNDrop([1, 2, 3], [], 4);
         assert.deepEqual(selection.selected, [4, 1, 2, 3]);
         assert.deepEqual(selection.excluded, []);

         selection = lists.BaseControl._private.getSelectionForDragNDrop([1, 2, 3], [], 2);
         assert.deepEqual(selection.selected, [2, 1, 3]);
         assert.deepEqual(selection.excluded, []);

         selection = lists.BaseControl._private.getSelectionForDragNDrop([1, 2, 3], [4], 3);
         assert.deepEqual(selection.selected, [3, 1, 2]);
         assert.deepEqual(selection.excluded, [4]);

         selection = lists.BaseControl._private.getSelectionForDragNDrop([1, 2, 3], [4], 5);
         assert.deepEqual(selection.selected, [5, 1, 2, 3]);
         assert.deepEqual(selection.excluded, [4]);

         selection = lists.BaseControl._private.getSelectionForDragNDrop([1, 2, 3], [4], 4);
         assert.deepEqual(selection.selected, [4, 1, 2, 3]);
         assert.deepEqual(selection.excluded, []);

         selection = lists.BaseControl._private.getSelectionForDragNDrop([null], [4], 4);
         assert.deepEqual(selection.selected, [null]);
         assert.deepEqual(selection.excluded, []);

         selection = lists.BaseControl._private.getSelectionForDragNDrop([null], [], 4);
         assert.deepEqual(selection.selected, [null]);
         assert.deepEqual(selection.excluded, []);

         selection = lists.BaseControl._private.getSelectionForDragNDrop([null], [3], 4);
         assert.deepEqual(selection.selected, [null]);
         assert.deepEqual(selection.excluded, [3]);
      });

      describe('ItemActions', function() {
         var
            actions = [
               {
                  id: 0,
                  title: 'прочитано',
                  showType: tUtil.showType.TOOLBAR,
                  handler: function() {
                     console.log('action read Click');
                  }
               },
               {
                  id: 1,
                  icon: 'icon-primary icon-PhoneNull',
                  title: 'phone',
                  showType: tUtil.showType.MENU,
                  handler: function(item) {
                     console.log('action phone Click ', item);
                  }
               },
               {
                  id: 2,
                  icon: 'icon-primary icon-EmptyMessage',
                  title: 'message',
                  showType: tUtil.showType.MENU,
                  handler: function() {
                     alert('Message Click');
                  }
               },
               {
                  id: 3,
                  icon: 'icon-primary icon-Profile',
                  title: 'profile',
                  showType: tUtil.showType.MENU_TOOLBAR,
                  handler: function() {
                     console.log('action profile Click');
                  }
               },
               {
                  id: 4,
                  icon: 'icon-Erase icon-error',
                  title: 'delete pls',
                  showType: tUtil.showType.TOOLBAR,
                  handler: function() {
                     console.log('action delete Click');
                  }
               },
               {
                  id: 5,
                  icon: 'icon-done icon-Admin',
                  title: 'delete pls',
                  showType: tUtil.showType.TOOLBAR,
                  handler: function() {
                     console.log('action delete Click');
                  }
               }
            ];
         it('showActionsMenu context', function(done) {
            var callBackCount = 0;
            var cfg = {
                  viewName: 'Controls/List/ListView',
                  viewConfig: {
                     idProperty: 'id'
                  },
                  viewModelConfig: {
                     items: [],
                     idProperty: 'id'
                  },
                  viewModelConstructor: lists.ListViewModel,
                  source: source
               },
               instance = new lists.BaseControl(cfg),
               fakeEvent = {
                  type: 'itemcontextmenu'

               },
               childEvent = {
                  nativeEvent: {
                     preventDefault: function() {
                        callBackCount++;
                     }
                  },
                  stopImmediatePropagation: function() {
                     callBackCount++;
                  }
               },
               itemData = {
                  itemActions: { all: actions }
               };
            instance._children = {
               itemActionsOpener: {
                  open: function(args) {
                     callBackCount++;
                     assert.isTrue(cInstance.instanceOfModule(args.templateOptions.items, 'Types/collection:RecordSet'));
                     assert.equal(args.templateOptions.items.getIdProperty(), 'id');
                     assert.equal(args.templateOptions.keyProperty, 'id');
                     assert.equal(args.templateOptions.parentProperty, 'parent');
                     assert.equal(args.templateOptions.nodeProperty, 'parent@');
                     assert.equal(itemData, instance._listViewModel._activeItem);
                     assert.equal(instance._listViewModel._menuState, 'shown');
                     assert.equal(callBackCount, 3);
                     done();
                  }
               }
            };

            instance.saveOptions(cfg);
            instance._beforeMount(cfg);
            instance._showActionsMenu(fakeEvent, itemData, childEvent, false);
         });

         it('_onItemContextMenu', function() {
            var callBackCount = 0;
            var cfg = {
                   items: new collection.RecordSet({
                      rawData: [
                         { id: 1, title: 'item 1' },
                         { id: 2, title: 'item 2' }
                      ],
                      idProperty: 'id'
                   }),
                   viewName: 'Controls/List/ListView',
                   viewConfig: {
                      idProperty: 'id'
                   },
                   viewModelConfig: {
                      items: [],
                      idProperty: 'id'
                   },
                   markedKey: null,
                   viewModelConstructor: lists.ListViewModel,
                   source: source
                },
                instance = new lists.BaseControl(cfg),
                fakeEvent = {
                   type: 'itemcontextmenu'
                },
                childEvent = {
                   nativeEvent: {
                      preventDefault: function() {
                         callBackCount++;
                      }
                   },
                   stopImmediatePropagation: function() {
                      callBackCount++;
                   }
                },
                itemData = {
                   key: 1
                };
            instance._children = {
               itemActionsOpener: {
                  open: function() {
                     callBackCount++;
                  }
               }
            };

            instance.saveOptions(cfg);
            instance._beforeMount(cfg);
            assert.equal(instance.getViewModel()._markedKey, undefined);
            instance._onItemContextMenu(fakeEvent, itemData, childEvent, false);
            assert.equal(instance.getViewModel()._markedKey, 1);
            assert.equal(callBackCount, 0);
         });

         it('close context menu if its owner was removed', function() {
            let
                swipeClosed = false,
                itemActionsOpenerClosed = false,
                cfg = {
                   items: new collection.RecordSet({
                      rawData: [
                         { id: 1, title: 'item 1' },
                         { id: 2, title: 'item 2' }
                      ],
                      idProperty: 'id'
                   }),
                   viewName: 'Controls/List/ListView',
                   viewConfig: {
                      idProperty: 'id'
                   },
                   viewModelConfig: {
                      items: [],
                      idProperty: 'id'
                   },
                   markedKey: null,
                   viewModelConstructor: lists.ListViewModel,
                   source: source
                },
                instance = new lists.BaseControl(cfg);
            instance._children = {
               itemActionsOpener: {
                  close: function () {
                     itemActionsOpenerClosed = true;
                  }
               },
               swipeControl: {
                  closeSwipe: function () {
                     swipeClosed = true;
                  }
               }
            };

            instance.saveOptions(cfg);
            instance._beforeMount(cfg);
            instance._menuIsShown = true;
            instance._itemWithShownMenu = {
               getId: () => '123321'
            };
            instance.getViewModel()._notify(
                'onListChange',
                'collectionChanged',
                collection.IObservable.ACTION_REMOVE,
                null,
                null,
                [{
                   getContents: () => {
                      return {
                         getId: () => '123321'
                      }
                   }
                }],
                null);

            assert.isFalse(instance._menuIsShown);
            assert.isFalse(instance._actionMenuIsShown);
            assert.isNull(instance._itemWithShownMenu);
            assert.isTrue(itemActionsOpenerClosed);
            assert.isTrue(swipeClosed);
         });

         it('showActionsMenu context', function() {
            var callBackCount = 0;
            var cfg = {
                  viewName: 'Controls/List/ListView',
                  viewConfig: {
                     idProperty: 'id'
                  },
                  viewModelConfig: {
                     items: [],
                     idProperty: 'id'
                  },
                  viewModelConstructor: lists.ListViewModel,
                  source: source
               },
               instance = new lists.BaseControl(cfg),
               fakeEvent = {
                  type: 'itemcontextmenu'
               },
               childEvent = {
                  nativeEvent: {
                     preventDefault: function() {
                        callBackCount++;
                     }
                  },
                  stopImmediatePropagation: function() {
                     callBackCount++;
                  }
               },
               itemData = {};
            instance._children = {
               itemActionsOpener: {
                  open: function() {
                     callBackCount++;
                  }
               }
            };

            instance.saveOptions(cfg);
            instance._beforeMount(cfg);
            instance._showActionsMenu(fakeEvent, itemData, childEvent, false);
            assert.equal(callBackCount, 0);
         });

         it('no showActionsMenu context without actions', function() {
            var callBackCount = 0;
            var cfg = {
                  viewName: 'Controls/List/ListView',
                  viewConfig: {
                     idProperty: 'id'
                  },
                  viewModelConfig: {
                     items: [],
                     idProperty: 'id'
                  },
                  viewModelConstructor: lists.ListViewModel,
                  source: source
               },
               instance = new lists.BaseControl(cfg),
               fakeEvent = {
                  type: 'itemcontextmenu'
               },
               itemData = {
                  itemActions: { all: [] }
               };
            instance._children = {
               itemActionsOpener: {
                  open: function() {
                     callBackCount++;
                  }
               }
            };

            instance.saveOptions(cfg);
            instance._beforeMount(cfg);
            instance._showActionsMenu(fakeEvent, itemData);
            assert.equal(callBackCount, 0); // проверяем что не открывали меню
         });

         it('showActionsMenu no context', function() {
            var callBackCount = 0;
            var
               cfg = {
                  viewName: 'Controls/List/ListView',
                  viewConfig: {
                     idProperty: 'id'
                  },
                  viewModelConfig: {
                     items: [],
                     idProperty: 'id'
                  },
                  viewModelConstructor: lists.ListViewModel,
                  source: source
               },
               instance = new lists.BaseControl(cfg),
               target = {
                  getBoundingClientRect: function() {
                     return {
                        bottom: 1,
                        height: 2,
                        left: 3,
                        right: 4,
                        top: 5,
                        width: 6
                     };
                  }
               },
               fakeEvent = {
                  type: 'click'

               },
               childEvent = {
                  target: target,
                  nativeEvent: {
                     preventDefault: function() {
                        callBackCount++;
                     }
                  },
                  stopImmediatePropagation: function() {
                     callBackCount++;
                  }
               },
               itemData = {
                  itemActions: { all: actions }
               };
            instance._children = {
               itemActionsOpener: {
                  open: function(args) {
                     callBackCount++;
                     assert.deepEqual(target.getBoundingClientRect(), args.target.getBoundingClientRect());
                     assert.isTrue(cInstance.instanceOfModule(args.templateOptions.items, 'Types/collection:RecordSet'));
                  }
               }
            };

            instance.saveOptions(cfg);
            instance._beforeMount(cfg);
            instance._showActionsMenu(fakeEvent, itemData, childEvent, false);
            setTimeout(function() {
               assert.equal(itemData, instance._listViewModel._activeItem);
               assert.equal(instance._listViewModel._menuState, 'shown');
               assert.equal(callBackCount, 3);
            }, 100);
         });

         it('closeActionsMenu', function() {
            var callBackCount = 0;
            var
               cfg = {
                  viewName: 'Controls/List/ListView',
                  viewConfig: {
                     idProperty: 'id'
                  },
                  viewModelConfig: {
                     items: [],
                     idProperty: 'id'
                  },
                  viewModelConstructor: lists.ListViewModel,
                  source: source
               },
               instance = new lists.BaseControl(cfg),
               target = '123',
               fakeEvent = {
                  target: target,
                  type: 'click',
                  stopPropagation: function() {
                     callBackCount++;
                  }
               };
            instance.saveOptions(cfg);
            instance._beforeMount(cfg);
            instance._children = {
               itemActionsOpener: {
                  close: function() {
                     callBackCount++;
                  }
               },
               swipeControl: {
                  closeSwipe: function() {
                     callBackCount++;
                  }
               }
            };
            instance._listViewModel._activeItem = {
               item: true
            };
            instance._container = {
               querySelector: function(selector) {
                  if (selector === '.controls-ListView__itemV') {
                     return {
                        parentNode: {
                           children: [{
                              className: ''
                           }]
                        }
                     };
                  }
               }
            };
            instance._closeActionsMenu({
               action: 'itemClick',
               event: fakeEvent,
               data: [{
                  getRawData: function() {
                     callBackCount++;
                     return {
                        handler: function() {
                           callBackCount++;
                        }
                     };
                  }
               }]
            });
            assert.equal(instance._listViewModel._activeItem, null);
            assert.equal(instance._listViewModel._menuState, 'hidden');
            assert.equal(callBackCount, 5);
            assert.isFalse(instance._menuIsShown);
         });

         it('closeActionsMenu item with children', function() {
            var cfg = {
                  viewName: 'Controls/List/ListView',
                  viewModelConstructor: lists.ListViewModel,
                  source: source
               },
               instance = new lists.BaseControl(cfg);
            instance.saveOptions(cfg);
            instance._beforeMount(cfg);
            instance._listViewModel._activeItem = {
               item: true
            };
            instance._container = {
               querySelector: function(selector) {
                  if (selector === '.controls-ListView__itemV') {
                     return {
                        parentNode: {
                           children: [{
                              className: ''
                           }]
                        }
                     };
                  }
               }
            };
            instance._closeActionsMenu({
               action: 'itemClick',
               event: {
                  type: 'click',
                  stopPropagation: ()=>{}
               },
               data: [{
                  getRawData: function() {
                     return {
                        'parent@': true
                     };
                  }
               }]});
            assert.equal(instance._menuIsShown, null);
         });

         describe('_listSwipe animation', function() {
            var
               childEvent = {
                  nativeEvent: {
                     direction: 'right'
                  }
               },
               itemData = {
                  key: 1,
                  multiSelectStatus: false
               },
               instance;
            function initTest(multiSelectVisibility) {
               var
                  cfg = {
                     viewName: 'Controls/List/ListView',
                     viewConfig: {
                        idProperty: 'id'
                     },
                     viewModelConfig: {
                        items: rs,
                        idProperty: 'id'
                     },
                     viewModelConstructor: lists.ListViewModel,
                     source: source,
                     multiSelectVisibility: multiSelectVisibility,
                     selectedKeysCount: 1
                  };
               instance = new lists.BaseControl(cfg);
               instance._children = {
                  itemActionsOpener: {
                     close: function() {}
                  }
               };
               instance.saveOptions(cfg);
               instance._beforeMount(cfg);
            }

            it('multiSelectVisibility: visible, should start animation', function() {
               initTest('visible');
               instance._listSwipe({}, itemData, childEvent);
               assert.equal(itemData, instance.getViewModel()._rightSwipedItem);
            });

            it('multiSelectVisibility: onhover, should start animation', function() {
               initTest('onhover');
               instance._listSwipe({}, itemData, childEvent);
               assert.equal(itemData, instance.getViewModel()._rightSwipedItem);
            });

            it('multiSelectVisibility: hidden, should not start animation', function() {
               initTest('hidden');
               instance._listSwipe({}, itemData, childEvent);
               assert.isNotOk(instance.getViewModel()._rightSwipedItem);
            });
         });
         describe('itemSwipe event', function() {
            var
               childEvent = {
                  nativeEvent: {
                     direction: 'right'
                  }
               },
               itemData = {
                  key: 1,
                  multiSelectStatus: false,
                  item: {}
               };
            it('list has item actions, event should not fire', function() {
               var
                  cfg = {
                     viewName: 'Controls/List/ListView',
                     viewConfig: {
                        idProperty: 'id'
                     },
                     viewModelConfig: {
                        items: rs,
                        idProperty: 'id'
                     },
                     viewModelConstructor: lists.ListViewModel,
                     source: source,
                     itemActions: []
                  },
                  instance = new lists.BaseControl(cfg);
               instance._children = {
                  itemActionsOpener: {
                     close: function() {}
                  }
               };
               instance.saveOptions(cfg);
               instance._beforeMount(cfg);
               instance._notify = function(eventName) {
                  if (eventName === 'itemSwipe') {
                     throw new Error('itemSwipe event should not fire if the list has itemActions');
                  }
               };
               instance._listSwipe({}, itemData, childEvent);
            });

            it('list has multiselection, event should not fire', function() {
               var
                  cfg = {
                     viewName: 'Controls/List/ListView',
                     viewConfig: {
                        idProperty: 'id'
                     },
                     viewModelConfig: {
                        items: rs,
                        idProperty: 'id'
                     },
                     viewModelConstructor: lists.ListViewModel,
                     source: source,
                     selectedKeysCount: 1
                  },
                  instance = new lists.BaseControl(cfg);
               instance._children = {
                  itemActionsOpener: {
                     close: function() {}
                  }
               };
               instance.saveOptions(cfg);
               instance._beforeMount(cfg);
               instance._notify = function(eventName) {
                  if (eventName === 'itemSwipe') {
                     throw new Error('itemSwipe event should not fire if the list has multiselection');
                  }
               };
               instance._listSwipe({}, itemData, childEvent);
            });

            it('can update itemActions on left swipe', function(done) {
               var
                   cfg = {
                      itemActions: [1, 2, 3],
                      viewName: 'Controls/List/ListView',
                      viewConfig: {
                         idProperty: 'id'
                      },
                      viewModelConfig: {
                         items: [],
                         idProperty: 'id'
                      },
                      keyProperty: 'id',
                      viewModelConstructor: lists.ListViewModel,
                      source: source
                   },
                   instance = new lists.BaseControl(cfg),
                   updated = false,
                   childEvent = {
                      nativeEvent: {
                         direction: 'left'
                      }
                   };
               instance.saveOptions(cfg);
               instance._beforeMount(cfg).addCallback(function() {
                  instance._children = {
                     itemActionsOpener: {
                        close: () => {}
                     },
                     itemActions: {
                        updateItemActions: () => {
                           updated = true;
                           instance._listViewModel._actions[1] = cfg.itemActions
                        },
                     },
                     selectionController: {
                        onCheckBoxClick: function () {
                        }
                     }
                  };
                  let itemData = instance._listViewModel.getCurrent();
                  instance._listSwipe({}, itemData, childEvent);
                  assert.isTrue(updated);
                  assert.deepEqual(itemData.itemActions, cfg.itemActions);
                  done();
               });
               return done;
            });

            it('can update itemActions on left swipe if they set by itemActionsProperty', function(done) {
               var
                   cfg = {
                      itemActionsProperty: [1, 2, 3],
                      viewName: 'Controls/List/ListView',
                      viewConfig: {
                         idProperty: 'id'
                      },
                      viewModelConfig: {
                         items: [],
                         idProperty: 'id'
                      },
                      keyProperty: 'id',
                      viewModelConstructor: lists.ListViewModel,
                      source: source
                   },
                   instance = new lists.BaseControl(cfg),
                   updated = false,
                   childEvent = {
                      nativeEvent: {
                         direction: 'left'
                      }
                   };
               instance.saveOptions(cfg);
               instance._beforeMount(cfg).addCallback(function() {
                  instance._children = {
                     itemActionsOpener: {
                        close: () => {}
                     },
                     itemActions: {
                        updateItemActions: () => {
                           updated = true;
                           instance._listViewModel._actions[1] = cfg.itemActionsProperty
                        },
                     },
                     selectionController: {
                        onCheckBoxClick: function () {
                        }
                     }
                  };
                  let itemData = instance._listViewModel.getCurrent();
                  instance._listSwipe({}, itemData, childEvent);
                  assert.isTrue(updated);
                  assert.deepEqual(itemData.itemActions, cfg.itemActionsProperty);
                  done();
               });
               return done;
            });

            it('list doesn\'t handle swipe, event should fire', function() {
               var
                  cfg = {
                     viewName: 'Controls/List/ListView',
                     viewConfig: {
                        idProperty: 'id'
                     },
                     viewModelConfig: {
                        items: rs,
                        idProperty: 'id'
                     },
                     viewModelConstructor: lists.ListViewModel,
                     source: source
                  },
                  instance = new lists.BaseControl(cfg),
                  notifyCalled = false;
               instance._children = {
                  itemActionsOpener: {
                     close: function() {}
                  }
               };
               instance.saveOptions(cfg);
               instance._beforeMount(cfg);
               instance._notify = function(eventName, eventArgs, eventOptions) {
                  assert.equal(eventName, 'itemSwipe');
                  assert.deepEqual(eventArgs, [itemData.actionsItem, childEvent]);
                  notifyCalled = true;
               };
               instance._listSwipe({}, itemData, childEvent);
               assert.isTrue(notifyCalled);
            });
         });

         it('_onAfterBeginEdit parametrs', function () {
            var
                cfg = {
                   viewName: 'Controls/List/ListView',
                   viewConfig: {
                      idProperty: 'id'
                   },
                   viewModelConfig: {
                      items: [],
                      idProperty: 'id'
                   },
                   viewModelConstructor: lists.ListViewModel,
                   source: source
                },
                item = {},
                instance = new lists.BaseControl(cfg);

            instance._children = {
               itemActions: {
                  updateItemActions: () => {}
               }
            };

            instance._notify = (eventName, args) => {
               assert.equal('afterBeginEdit', eventName);
               assert.equal(item, args[0]);
               assert.isTrue(args[1]);
               return true;
            };

            let isNotified = instance._onAfterBeginEdit({}, item, true);
            assert.isTrue(isNotified);
         });

         it('_listSwipe  multiSelectStatus = true', function(done) {
            var callBackCount = 0;
            var
                cfg = {
                   itemActions: [1, 2, 3],
                   viewName: 'Controls/List/ListView',
                   viewConfig: {
                      idProperty: 'id'
                   },
                   viewModelConfig: {
                      items: [],
                      idProperty: 'id'
                   },
                   keyProperty: 'id',
                   viewModelConstructor: lists.ListViewModel,
                   source: source
                },
                updated = false,
                instance = new lists.BaseControl(cfg),
                itemData,
                childEvent = {
                   nativeEvent: {
                      direction: 'left'
                   }
               };
            instance.saveOptions(cfg);
            instance._beforeMount(cfg).addCallback(function() {
               instance._children = {
                  itemActionsOpener: {
                     close: function() {
                        callBackCount++;
                     }
                  },
                  itemActions: {
                     updateItemActions: () => {
                        updated = true;
                        instance._listViewModel._actions[2] = cfg.itemActions
                     }
                  },
                  selectionController: {
                     onCheckBoxClick: function() {
                     }
                  }
               };
               instance._listViewModel.reset();
               instance._listViewModel.goToNext();
               itemData = instance._listViewModel.getCurrent();
               itemData.multiSelectVisibility = true;
               itemData.multiSelectStatus = true;

               instance._listSwipe({}, itemData, childEvent);
               assert.equal(callBackCount, 1);
               childEvent = {
                  nativeEvent: {
                     direction: 'right'
                  }
               };
               assert.isTrue(updated);
               assert.deepEqual(itemData.itemActions, cfg.itemActions);

               instance._listSwipe({}, itemData, childEvent);
               assert.equal(callBackCount, 2);
               assert.equal(itemData, instance._listViewModel._activeItem);
               done();
            });
            return done;
         });

         it('_listSwipe  multiSelectStatus = false', function(done) {
            var callBackCount = 0;
            var
               cfg = {
                  viewName: 'Controls/List/ListView',
                  viewConfig: {
                     idProperty: 'id'
                  },
                  viewModelConfig: {
                     items: [],
                     idProperty: 'id'
                  },
                  viewModelConstructor: lists.ListViewModel,
                  source: source
               },
               instance = new lists.BaseControl(cfg),
               itemData,
               childEvent = {
                  nativeEvent: {
                     direction: 'right'
                  }
               };
            instance.saveOptions(cfg);
            instance._beforeMount(cfg).addCallback(function() {
               instance._children = {
                  itemActionsOpener: {
                     close: function() {
                        callBackCount++;
                     }
                  },
                  selectionController: {
                     onCheckBoxClick: function() {
                     }
                  }
               };
               instance._listViewModel.reset();
               instance._listViewModel.goToNext();
               itemData = instance._listViewModel.getCurrent();
               itemData.multiSelectVisibility = true;
               itemData.multiSelectStatus = false;
               instance._listSwipe({}, itemData, childEvent);
               assert.equal(callBackCount, 1);
               assert.equal(itemData, instance._listViewModel._activeItem);
               done();
            });
            return done;
         });

         it('_listSwipe, multiSelectStatus = true, item is swiped', function(done) {
            var callBackCount = 0;
            var
               cfg = {
                  viewName: 'Controls/List/ListView',
                  viewConfig: {
                     idProperty: 'id'
                  },
                  viewModelConfig: {
                     items: [],
                     idProperty: 'id'
                  },
                  viewModelConstructor: lists.ListViewModel,
                  source: source
               },
               instance = new lists.BaseControl(cfg),
               itemData,
               childEvent = {
                  nativeEvent: {
                     direction: 'right'
                  }
               };
            instance.saveOptions(cfg);
            instance._beforeMount(cfg).addCallback(function() {
               instance._children = {
                  itemActionsOpener: {
                     close: function() {
                        callBackCount++;
                     }
                  }
               };
               instance._listViewModel.reset();
               instance._listViewModel.goToNext();
               itemData = instance._listViewModel.getCurrent();
               itemData.multiSelectVisibility = true;
               itemData.multiSelectStatus = true;
               itemData.isSwiped = true;

               instance._notify = function(eventName) {
                  if (eventName === 'checkboxClick') {
                     throw new Error('checkBoxClick shouldn\'t be called if the item is swiped');
                  }
               };

               instance._listSwipe({}, itemData, childEvent);
               assert.equal(callBackCount, 1);
               assert.equal(itemData, instance._listViewModel._activeItem);
               done();
            });
            return done;
         });

      });

      it('resolveIndicatorStateAfterReload', function() {
         var baseControlMock = {
            _needScrollCalculation: true,
            _sourceController: {hasMoreData: () => {return true;}},
            _forceUpdate: () => {}
         };
         var emptyList = new collection.List();
         var list = new collection.List({items: [{test: 'testValue'}]});

         lists.BaseControl._private.resolveIndicatorStateAfterReload(baseControlMock, emptyList);
         assert.equal(baseControlMock._loadingState, 'down');

         lists.BaseControl._private.resolveIndicatorStateAfterReload(baseControlMock, list);
         assert.isNull(baseControlMock._loadingState);

      });

      it('reloadItem', function() {
         var filter = {};
         var cfg = {
            viewName: 'Controls/List/ListView',
            viewConfig: {
               keyProperty: 'id'
            },
            viewModelConfig: {
               items: [],
               keyProperty: 'id'
            },
            viewModelConstructor: lists.ListViewModel,
            keyProperty: 'id',
            source: source,
            filter: filter,
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
         var baseCtrl = new lists.BaseControl(cfg);
         baseCtrl.saveOptions(cfg);

         return new Promise(function(resolve) {
            baseCtrl._beforeMount(cfg).addCallback(function() {
               assert.isTrue(baseCtrl._sourceController.hasMoreData('down'));

               baseCtrl.reloadItem(1).addCallback(function(item) {
                  assert.equal(item.get('id'), 1);
                  assert.equal(item.get('title'), 'Первый');
                  assert.isTrue(baseCtrl._sourceController.hasMoreData('down'), 'wrong navigation after reload item');

                  baseCtrl.reloadItem(1, null, true, 'query').addCallback(function(items) {
                     assert.isTrue(!!items.getCount);
                     assert.equal(items.getCount(), 1);
                     assert.equal(items.at(0).get('id'), 1);
                     assert.isTrue(baseCtrl._sourceController.hasMoreData('down'), 'wrong navigation after reload item');

                     let recordSet = new collection.RecordSet({
                        idProperty: 'id',
                        rawData: [{ id: 'test' }]
                     });
                     baseCtrl._listViewModel.setItems(recordSet);
                     baseCtrl.reloadItem('test', null, true, 'query').addCallback(function (reloadedItems) {
                        assert.isTrue(reloadedItems.getCount() === 0);
                        resolve();
                     });
                  });
               });
            });
         });
      });

      it('update key property', async () => {
         const cfg = {
               viewName: 'Controls/List/ListView',
               viewModelConfig: {
                  items: [],
                  keyProperty: 'id'
               },
               viewModelConstructor: lists.ListViewModel,
               keyProperty: 'id',
               source: source
            },
            instance = new lists.BaseControl(cfg);
         instance.saveOptions(cfg);
         await instance._beforeMount(cfg);
         let newKeyProperty;
         instance._listViewModel.setKeyProperty = (value) => {
            newKeyProperty = value;
         };
         const keyProperty = 'name';
         const newCfg = {...cfg, keyProperty};
         instance._beforeUpdate(newCfg);
         assert.equal(newKeyProperty, 'name');
         instance.destroy();
      });

      it('should fire "drawItems" event if collection has changed', async function() {
         var
            cfg = {
               viewName: 'Controls/List/ListView',
               viewModelConfig: {
                  items: [],
                  keyProperty: 'id'
               },
               viewModelConstructor: lists.ListViewModel,
               keyProperty: 'id',
               source: source
            },
            instance = new lists.BaseControl(cfg);
         instance.saveOptions(cfg);
         await instance._beforeMount(cfg);
         instance._beforeUpdate(cfg);
         instance._afterUpdate(cfg);

         var fakeNotify = sandbox.spy(instance, '_notify').withArgs('drawItems');

         instance.getViewModel()._notify('onListChange', 'collectionChanged');
         assert.isFalse(fakeNotify.called);
         instance._beforeUpdate(cfg);
         assert.isFalse(fakeNotify.called);
         instance._afterUpdate(cfg);
         assert.isTrue(fakeNotify.calledOnce);
      });

      it('should fire "drawItems" event if indexes have changed', async function() {
         var
            cfg = {
               viewName: 'Controls/List/ListView',
               viewModelConfig: {
                  items: [],
                  keyProperty: 'id'
               },
               viewModelConstructor: lists.ListViewModel,
               keyProperty: 'id',
               source: source
            },
            instance = new lists.BaseControl(cfg);
         instance.saveOptions(cfg);
         await instance._beforeMount(cfg);
         instance._beforeUpdate(cfg);
         instance._afterUpdate(cfg);
         var fakeNotify = sandbox.spy(instance, '_notify').withArgs('drawItems');

         instance.getViewModel()._notify('onListChange', 'indexesChanged');
         assert.isFalse(fakeNotify.called);
         instance._beforeUpdate(cfg);
         assert.isFalse(fakeNotify.called);
         instance._afterUpdate(cfg);
         assert.isTrue(fakeNotify.calledOnce);
      });

      it('_afterUpdate while loading do not update loadingState', async function() {
         var cfg = {
               viewName: 'Controls/List/ListView',
               viewModelConfig: {
                  items: [],
                  keyProperty: 'id'
               },
               viewModelConstructor: lists.ListViewModel,
               keyProperty: 'id',
               source: source
            };
         var instance = new lists.BaseControl(cfg);
         var cfgClone = {...cfg};

         instance.saveOptions(cfg);
         await instance._beforeMount(cfg);

         instance._beforeUpdate(cfg);
         instance._afterUpdate(cfg);

         lists.BaseControl._private.showIndicator(instance, 'down');
         assert.equal(instance._loadingState, 'down');

         cfgClone.loading = true;
         instance.saveOptions(cfg);
         instance._afterUpdate(cfg);
         assert.equal(instance._loadingState, 'down');
      });

      it('_beforeUpdate with new sorting/filter', async function() {
         let cfg = {
            viewName: 'Controls/List/ListView',
            sorting: [],
            viewModelConfig: {
               items: [],
               keyProperty: 'id'
            },
            viewModelConstructor: lists.ListViewModel,
            keyProperty: 'id',
            source: source
         };
         let instance = new lists.BaseControl(cfg);
         let cfgClone = {...cfg};

         instance.saveOptions(cfg);
         await instance._beforeMount(cfg);

         instance._beforeUpdate(cfg);
         instance._afterUpdate(cfg);

         let clock = sandbox.useFakeTimers();

         cfgClone.dataLoadCallback = sandbox.stub();
         cfgClone.sorting = [{title: 'ASC'}];
         instance._beforeUpdate(cfgClone);
         clock.tick(100);
         assert.isTrue(cfgClone.dataLoadCallback.calledOnce);

         cfgClone = {...cfg};
         cfgClone.dataLoadCallback = sandbox.stub();
         cfgClone.filter = {test: 'test'};
         instance._beforeUpdate(cfgClone);
         clock.tick(100);
         assert.isTrue(cfgClone.dataLoadCallback.calledOnce);
      });

      it('_beforeMount with PrefetchProxy in source', function() {
         let prefetchSource = new sourceLib.PrefetchProxy({
            target: source,
            data: {
               query: data
            }
         });
         let cfg = {
            viewName: 'Controls/List/ListView',
            sorting: [],
            viewModelConfig: {
               items: [],
               keyProperty: 'id'
            },
            viewModelConstructor: lists.ListViewModel,
            keyProperty: 'id',
            source: prefetchSource
         };
         let instance = new lists.BaseControl(cfg);
         instance.saveOptions(cfg);

         return new Promise(function(resolve) {
            instance._beforeMount(cfg).addCallback(function(receivedState) {
               assert.isTrue(!receivedState);
               resolve();
            });
         });
      });


      it('_getLoadingIndicatorClasses', function () {

         function testCaseWithArgs(indicatorState, itemsCount) {
            return lists.BaseControl._private.getLoadingIndicatorClasses(indicatorState, itemsCount);
         }

         assert.equal('controls-BaseControl__loadingIndicator controls-BaseControl__loadingIndicator__state-all controls-BaseControl-emptyView__loadingIndicator', testCaseWithArgs('all', 0));
         assert.equal('controls-BaseControl__loadingIndicator controls-BaseControl__loadingIndicator__state-up controls-BaseControl-emptyView__loadingIndicator', testCaseWithArgs('up', 0));
         assert.equal('controls-BaseControl__loadingIndicator controls-BaseControl__loadingIndicator__state-down controls-BaseControl-emptyView__loadingIndicator', testCaseWithArgs('down', 0));

         assert.equal('controls-BaseControl__loadingIndicator controls-BaseControl__loadingIndicator__state-all', testCaseWithArgs('all', 1));
         assert.equal('controls-BaseControl__loadingIndicator controls-BaseControl__loadingIndicator__state-up', testCaseWithArgs('up', 1));
         assert.equal('controls-BaseControl__loadingIndicator controls-BaseControl__loadingIndicator__state-down', testCaseWithArgs('down', 1));

      });

      describe('navigation', function () {
         it('Navigation demand', function(done) {
            var source = new sourceLib.Memory({
               idProperty: 'id',
               data: data
            });

            var dataLoadFired = false;

            var cfg = {
               viewName: 'Controls/List/ListView',
               dataLoadCallback: function() {
                  dataLoadFired = true;
               },
               source: source,
               viewConfig: {
                  keyProperty: 'id'
               },
               viewModelConfig: {
                  items: [],
                  keyProperty: 'id'
               },
               viewModelConstructor: lists.ListViewModel,
               navigation: {
                  view: 'demand',
                  source: 'page',
                  sourceConfig: {
                     pageSize: 3,
                     page: 0,
                     hasMore: false
                  }
               }
            };

            var ctrl = new lists.BaseControl(cfg);


            ctrl.saveOptions(cfg);
            ctrl._beforeMount(cfg);

            setTimeout(function() {
               assert.isTrue(ctrl._shouldDrawFooter, 'Failed draw footer on first load.');
               assert.equal(ctrl._loadMoreCaption, 3, 'Failed draw footer on first load.');

               lists.BaseControl._private.loadToDirection(ctrl, 'down');
               assert.equal(ctrl._loadingState, 'down');
               setTimeout(function() {
                  assert.isFalse(ctrl._shouldDrawFooter, 'Failed draw footer on second load.');

                  assert.equal(6, lists.BaseControl._private.getItemsCount(ctrl), 'Items wasn\'t load');
                  assert.isTrue(dataLoadFired, 'dataLoadCallback is not fired');
                  assert.equal(ctrl._loadingState, null);
                  done();
               }, 100);
            }, 100);
         });
         it('Navigation position', function() {
            return new Promise(function(resolve, reject) {
               var
                   ctrl,
                   source = new sourceLib.Memory({
                      idProperty: 'id',
                      data: data,
                      filter: function() {
                         return true;
                      }
                   }),
                   cfg = {
                      viewName: 'Controls/List/ListView',
                      itemsReadyCallback: function(items) {
                         setTimeout(function() {
                            var
                                newItem = items.at(items.getCount() - 1).clone();
                            newItem.set('id', 777);
                            items.add(newItem);
                            try {
                               assert.deepEqual(ctrl._sourceController._queryParamsController._afterPosition, [777]);
                               resolve();
                            } catch (e) {
                               reject(e);
                            }
                         });
                      },
                      source: source,
                      viewConfig: {
                         keyProperty: 'id'
                      },
                      viewModelConfig: {
                         items: [],
                         keyProperty: 'id'
                      },
                      viewModelConstructor: lists.ListViewModel,
                      navigation: {
                         source: 'position',
                         sourceConfig: {
                            field: 'id',
                            position: 0,
                            direction: 'after',
                            limit: 20
                         }
                      }
                   };

               ctrl = new lists.BaseControl(cfg);
               ctrl.saveOptions(cfg);
               ctrl._beforeMount(cfg);
            });
         });
         describe('paging navigation', function () {
            let pageSize, hasMore, self;

            afterEach(() => {
               pageSize = hasMore = self = null;
            });

            it('pageSize=5 && 10 more items && curPage=1 && totalPages=1', function () {
               pageSize = 5;
               hasMore = 10;
               self = {
                  _currentPage: 1,
                  _knownPagesCount: 1
               };

               assert.equal(lists.BaseControl._private.calcPaging(self, hasMore, pageSize), 2);
            });

            it('pageSize=5 && hasMore true && curPage=2 && totalPages=2', function () {
               pageSize = 5;
               hasMore = true;
               self = {
                  _currentPage: 2,
                  _knownPagesCount: 2
               };
               assert.equal(lists.BaseControl._private.calcPaging(self, hasMore, pageSize), 3);
            });

            it('pageSize=5 && hasMore false && curPage=1 && totalPages=1', function () {
               pageSize = 5;
               hasMore = false;
               self = {
                  _currentPage: 1,
                  _knownPagesCount: 1
               };
               assert.equal(lists.BaseControl._private.calcPaging(self, hasMore, pageSize), 1);
            });
         });
         describe('navigation switch', function() {
            var cfg = {
               navigation: {
                  view: 'infinity',
                  source: 'page',
                  viewConfig: {
                     pagingMode: 'direct'
                  },
                  sourceConfig: {
                     pageSize: 3,
                     page: 0,
                     hasMore: false
                  }
               }
            };
            var baseControl = new lists.BaseControl(cfg);
            baseControl.saveOptions(cfg);
            baseControl._children = triggers;
            it('infinity navigation', function() {
               lists.BaseControl._private.initializeNavigation(baseControl, cfg);
               assert.isTrue(baseControl._needScrollCalculation);
               assert.isFalse(baseControl._pagingNavigation);
            });
            it('page navigation', function() {
               cfg.navigation = {
                  view: 'pages',
                  source: 'page',
                  viewConfig: {
                     pagingMode: 'direct'
                  },
                  sourceConfig: {
                     pageSize: 3,
                     page: 0,
                     hasMore: false
                  }
               }
               lists.BaseControl._private.initializeNavigation(baseControl, cfg);
               assert.isFalse(baseControl._needScrollCalculation);
               assert.isTrue(baseControl._pagingNavigation);
            });
         });
         describe('initializeNavigation', function() {
            let cfg, cfg1, bc;
            cfg = {
               navigation: {
                  view: 'infinity',
                  source: 'page',
                  viewConfig: {
                     pagingMode: 'direct'
                  },
                  sourceConfig: {
                     pageSize: 3,
                     page: 0,
                     hasMore: false
                  }
               },
               viewModelConstructor: lists.ListViewModel,
            };

            it('call check', async function() {
               bc = new lists.BaseControl(cfg);
               bc.saveOptions(cfg);
               await bc._beforeMount(cfg);
               bc._loadTriggerVisibility = {up:true, down:true};
               await bc._beforeUpdate(cfg);
               assert.deepEqual(bc._loadTriggerVisibility, {up:true, down:true});
               cfg = {
                  navigation: {
                     view: 'infinity',
                     source: 'page',
                     viewConfig: {
                        pagingMode: 'direct'
                     },
                     sourceConfig: {
                        pageSize: 3,
                        page: 0,
                        hasMore: false
                     }
                  },
                  viewModelConstructor: lists.ListViewModel,
               };
               await bc._beforeUpdate(cfg);
               assert.deepEqual(bc._loadTriggerVisibility, {up:true, down:true});
            });
         });
      });
   });
});
