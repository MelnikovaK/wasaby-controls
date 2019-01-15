define([
   'Controls/Explorer',
   'Core/Deferred',
   'Types/collection',
   'Types/chain',
   'Controls/DragNDrop/Entity/Items'
], function(
   Explorer,
   Deferred,
   collection,
   chain,
   DragEntity
) {
   describe('Controls.Explorer', function() {
      it('_private block', function() {
         var
            dataLoadCallbackArgument = null,
            dataLoadCallback = function(data) {
               dataLoadCallbackArgument = data;
            },
            notify = function() {},
            forceUpdate = function() {},
            itemOpenHandlerCalled = false,
            itemOpenHandler = function() {
               itemOpenHandlerCalled = true;
            },
            self = {
               _forceUpdate: forceUpdate,
               _notify: notify,
               _options: {
                  dataLoadCallback: dataLoadCallback,
                  itemOpenHandler: itemOpenHandler
               }
            },
            testRoot = 'testRoot',
            testBreadCrumbs = new collection.RecordSet({
               rawData: [
                  { id: 1, title: 'item1', parent: null },
                  { id: 2, title: 'item2', parent: 1 },
                  { id: 3, title: 'item3', parent: 2 }
               ]
            }),
            testData1 = {
               getMetaData: function() {
                  return {};
               }
            },
            testData2 = {
               getMetaData: function() {
                  return {
                     path: testBreadCrumbs
                  };
               }
            },
            testData3 = {
               getMetaData: function() {
                  return {
                     path: new collection.RecordSet({
                        rawData: []
                     })
                  };
               }
            };
         Explorer._private.setRoot(self, testRoot);
         assert.deepEqual({
            _root: 'testRoot',
            _forceUpdate: forceUpdate,
            _notify: notify,
            _options: {
               dataLoadCallback: dataLoadCallback,
               itemOpenHandler: itemOpenHandler
            }
         }, self, 'Incorrect self data after "setRoot(self, testRoot)".');
         assert.isTrue(itemOpenHandlerCalled);
         Explorer._private.dataLoadCallback(self, testData1);
         assert.deepEqual({
            _root: 'testRoot',
            _forceUpdate: forceUpdate,
            _notify: notify,
            _breadCrumbsItems: null,
            _options: {
               dataLoadCallback: dataLoadCallback,
               itemOpenHandler: itemOpenHandler
            }
         }, self, 'Incorrect self data after "dataLoadCallback(self, testData1)".');
         assert.deepEqual(dataLoadCallbackArgument, testData1, 'Incorrect "dataLoadCallback" arguments.');
         Explorer._private.dataLoadCallback(self, testData2);
         assert.deepEqual({
            _root: 'testRoot',
            _forceUpdate: forceUpdate,
            _notify: notify,
            _breadCrumbsItems: chain.factory(testBreadCrumbs).toArray(),
            _options: {
               dataLoadCallback: dataLoadCallback,
               itemOpenHandler: itemOpenHandler
            }
         }, self, 'Incorrect self data after "dataLoadCallback(self, testData2)".');
         Explorer._private.dataLoadCallback(self, testData1);
         assert.deepEqual({
            _root: 'testRoot',
            _forceUpdate: forceUpdate,
            _notify: notify,
            _breadCrumbsItems: null,
            _options: {
               dataLoadCallback: dataLoadCallback,
               itemOpenHandler: itemOpenHandler
            }
         }, self, 'Incorrect self data after "dataLoadCallback(self, testData1)".');
         Explorer._private.dataLoadCallback(self, testData3);
         assert.deepEqual({
            _root: 'testRoot',
            _forceUpdate: forceUpdate,
            _notify: notify,
            _breadCrumbsItems: null,
            _options: {
               dataLoadCallback: dataLoadCallback,
               itemOpenHandler: itemOpenHandler
            }
         }, self);
      });

      it('setViewMode', function() {
         var
            cfg = {
               root: 'rootNode',
               viewMode: 'tree'
            },
            newCfg = {
               viewMode: 'search',
               root: 'rootNode'
            },
            instance = new Explorer(cfg);
         instance.saveOptions(cfg);
         instance._beforeMount(cfg);
         assert.equal(instance._viewMode, 'tree');
         assert.equal(instance._viewName, Explorer._constants.VIEW_NAMES.tree);
         assert.equal(instance._viewModelConstructor, Explorer._constants.VIEW_MODEL_CONSTRUCTORS.tree);
         assert.equal(instance._leftPadding, undefined);
         instance._beforeUpdate(newCfg);
         assert.equal(instance._viewMode, 'search');
         assert.equal(instance._viewName, Explorer._constants.VIEW_NAMES.search);
         assert.equal(instance._viewModelConstructor, Explorer._constants.VIEW_MODEL_CONSTRUCTORS.search);
         assert.equal(instance._leftPadding, 'search');
      });

      it('_onBreadCrumbsClick', function() {
         var
            testBreadCrumbs = new collection.RecordSet({
               rawData: [
                  { id: 1, title: 'item1' },
                  { id: 2, title: 'item2', parent: 1 },
                  { id: 3, title: 'item3', parent: 2 }
               ]
            }),
            instance = new Explorer();

         instance.saveOptions({
            parentProperty: 'parent',
            keyProperty: 'id'
         });
         instance._onBreadCrumbsClick({}, testBreadCrumbs.at(0).get('id'));
         assert.equal(instance._root, testBreadCrumbs.at(0).get('id'));
         instance._onBreadCrumbsClick({}, testBreadCrumbs.at(1).get('parent'));
         assert.equal(instance._root, testBreadCrumbs.at(0).get('id'));
      });

      it('_notifyHandler', function() {
         var
            instance = new Explorer(),
            events = [],
            result;

         instance._notify = function() {
            events.push({
               eventName: arguments[0],
               eventArgs: arguments[1]
            });
            return 123;
         };

         result = instance._notifyHandler({}, 'itemActionsClick', 1, 2);
         instance._notifyHandler({}, 'beforeBeginEdit');
         assert.equal(result, 123);
         assert.equal(events[0].eventName, 'itemActionsClick');
         assert.deepEqual(events[0].eventArgs, [1, 2]);
         assert.equal(events[1].eventName, 'beforeBeginEdit');
         assert.deepEqual(events[1].eventArgs, []);
      });

      describe('EditInPlace', function() {
         it('beginEdit', function() {
            var opt = {
               test: '123'
            };
            var
               instance = new Explorer({});
            instance._children = {
               treeControl: {
                  beginEdit: function(options) {
                     assert.equal(opt, options);
                     return Deferred.success();
                  }
               }
            };
            var result = instance.beginEdit(opt);
            assert.instanceOf(result, Deferred);
            assert.isTrue(result.isSuccessful());
         });

         it('beginAdd', function() {
            var opt = {
               test: '123'
            };
            var
               instance = new Explorer({});
            instance._children = {
               treeControl: {
                  beginAdd: function(options) {
                     assert.equal(opt, options);
                     return Deferred.success();
                  }
               }
            };
            var result = instance.beginAdd(opt);
            assert.instanceOf(result, Deferred);
            assert.isTrue(result.isSuccessful());
         });

         it('cancelEdit', function() {
            var
               instance = new Explorer({});
            instance._children = {
               treeControl: {
                  cancelEdit: function() {
                     return Deferred.success();
                  }
               }
            };
            var result = instance.cancelEdit();
            assert.instanceOf(result, Deferred);
            assert.isTrue(result.isSuccessful());
         });

         it('commitEdit', function() {
            var
               instance = new Explorer({});
            instance._children = {
               treeControl: {
                  commitEdit: function() {
                     return Deferred.success();
                  }
               }
            };
            var result = instance.commitEdit();
            assert.instanceOf(result, Deferred);
            assert.isTrue(result.isSuccessful());
         });
      });

      describe('DragNDrop', function() {
         it('_hoveredCrumbChanged', function() {
            var
               hoveredBreadCrumb = {},
               explorer = new Explorer({});

            explorer._hoveredCrumbChanged({}, hoveredBreadCrumb);
            assert.equal(explorer._hoveredBreadCrumb, hoveredBreadCrumb);
         });
         it('_documentDragStart', function() {
            var explorer = new Explorer({});


            explorer._documentDragStart({}, {
               entity: 'notDragEntity'
            });
            assert.isFalse(explorer._dragOnBreadCrumbs);
            explorer._documentDragStart({}, {
               entity: new DragEntity()
            });
            assert.isTrue(explorer._dragOnBreadCrumbs);
         });
         it('_documentDragEnd', function() {
            var explorer = new Explorer({});

            explorer._dragOnBreadCrumbs = true;
            explorer._documentDragEnd();
            assert.isFalse(explorer._dragOnBreadCrumbs);
         });
         it('_dragEndBreadCrumbs', function() {
            var
               dragEnrArgs,
               dragEntity = new DragEntity(),
               explorer = new Explorer({});

            explorer._notify = function(e, args) {
               if (e === 'dragEnd') {
                  dragEnrArgs = args;
               }
            };

            explorer._dragEndBreadCrumbs({}, {});
            assert.equal(dragEnrArgs, undefined);

            explorer._hoveredBreadCrumb = 'hoveredItemKey';
            explorer._dragEndBreadCrumbs({}, {
               entity: dragEntity
            });
            assert.equal(dragEnrArgs[0], dragEntity);
            assert.equal(dragEnrArgs[1], 'hoveredItemKey');
            assert.equal(dragEnrArgs[2], 'on');
         });
      });
   });
});
