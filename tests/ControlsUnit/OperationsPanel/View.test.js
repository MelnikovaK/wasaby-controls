define([
   'Controls/operations',
   'Types/source',
   'Controls/_operations/Panel/Utils'
], function(
   View,
   sourceLib,
   WidthUtils
) {
   'use strict';

   function mockFillItemsType(itemsSizes) {
      return function fillItemsType(keyProperty, parentProperty, items, availableWidth) {
         var
            visibleItemsKeys = [],
            currentWidth = itemsSizes.reduce(function(acc, size) {
               return acc + size;
            }, 0);

         items.each(function(item) {
            if (!item.get(parentProperty)) {
               visibleItemsKeys.push(item.get(keyProperty));
            }
         });

         if (currentWidth > availableWidth) {
            for (var i = visibleItemsKeys.length - 1; i >= 0; i--) {
               items.getRecordById(visibleItemsKeys[i]).set('showType', currentWidth > availableWidth ? 0 : 1);
               currentWidth -= itemsSizes[i];
            }
         } else {
            items.each(function(item) {
               item.set('showType', 2);
            });
         }

         return items;
      };
   }

   describe('Controls/_operations/Panel', function() {
      var
         instance,
         oldFillItemsType,
         data = [{
            id: 0,
            title: 'print'
         }, {
            id: 1,
            title: 'unload'
         }],
         cfg = {
            source: new sourceLib.Memory({
               idProperty: 'id',
               data: data
            }),
            keyProperty: 'id'
         };

      beforeEach(function() {
         instance = new View.Panel();
         instance._container = {
            offsetParent: 100
         };
         instance.saveOptions(cfg);
         oldFillItemsType = WidthUtils.fillItemsType;
      });

      afterEach(function() {
         WidthUtils.fillItemsType = oldFillItemsType;
         instance = null;
      });


      it('_beforeMount', function(done) {
         assert.isFalse(instance._initialized);
         instance._beforeMount(cfg).addCallback(function(items) {
            assert.isFalse(instance._initialized);
            assert.deepEqual(items.getRawData(), data);
            assert.deepEqual(instance._items.getRawData(), data);
            done();
         });
      });

      describe('_afterMount', function() {
         it('enough space', function(done) {
            var
               forceUpdateCalled = false,
               notifyCalled = false;
            instance._children = {
               toolbarBlock: {
                  clientWidth: 360
               }
            };
            instance._forceUpdate = function() {
               forceUpdateCalled = true;
            };
            WidthUtils.fillItemsType = mockFillItemsType([80, 90]);
            instance._beforeMount(cfg).addCallback(function() {
               assert.isFalse(instance._initialized);
               instance._notify = function(eventName, eventArgs, eventOptions) {
                  assert.equal(eventName, 'operationsPanelOpened');
                  notifyCalled = true;
               };
               instance._afterMount();
               assert.isTrue(instance._initialized);
               assert.isTrue(notifyCalled);
               instance._toolbarSource.query().addCallback(function(result) {
                  assert.equal(result.getAll().getRecordById(0).get('showType'), 2);
                  assert.equal(result.getAll().getRecordById(1).get('showType'), 2);
                  assert.isTrue(forceUpdateCalled);
                  done();
               });
            });
         });

         it('not enough space', function(done) {
            var forceUpdateCalled = false;
            instance._children = {
               toolbarBlock: {
                  clientWidth: 100
               }
            };
            instance._forceUpdate = function() {
               forceUpdateCalled = true;
            };
            WidthUtils.fillItemsType = mockFillItemsType([80, 90]);
            instance._beforeMount(cfg).addCallback(function() {
               assert.isFalse(instance._initialized);
               instance._afterMount();
               assert.isTrue(instance._initialized);
               instance._toolbarSource.query().addCallback(function(result) {
                  assert.equal(result.getAll().getRecordById(0).get('showType'), 1);
                  assert.equal(result.getAll().getRecordById(1).get('showType'), 0);
                  assert.isTrue(forceUpdateCalled);
                  done();
               });
            });
         });
      });

      describe('_beforeUpdate', function() {
         it('old source', function(done) {
            var forceUpdateCalled = false;
            instance._children = {
               toolbarBlock: {
                  clientWidth: 100
               }
            };
            WidthUtils.fillItemsType = mockFillItemsType([80, 90]);
            instance._beforeMount(cfg).addCallback(function() {
               instance._afterMount();
               instance._forceUpdate = function() {
                  forceUpdateCalled = true;
               };
               instance._beforeUpdate(cfg);
               assert.isFalse(forceUpdateCalled);
               assert.isNotOk(instance._sourceChanged);
               done();
            });
         });
         it('new source', function(done) {
            var
               forceUpdateCalled = false,
               newCfg = {
                  source: new sourceLib.Memory({
                     idProperty: 'id',
                     data: data
                  }),
                  keyProperty: 'id'
               };
            instance._children = {
               toolbarBlock: {
                  clientWidth: 100
               }
            };
            WidthUtils.fillItemsType = mockFillItemsType([80, 90]);
            instance._beforeMount(cfg).addCallback(function() {
               instance._afterMount();
               instance._forceUpdate = function() {
                  forceUpdateCalled = true;
               };
               instance._beforeUpdate(newCfg);
               assert.isFalse(forceUpdateCalled);
               assert.isTrue(instance._sourceChanged);
               done();
            });
         });
      });

      describe('_afterUpdate', function() {
         it('old source', function(done) {
            var forceUpdateCalled = false;
            instance._children = {
               toolbarBlock: {
                  clientWidth: 100
               }
            };
            WidthUtils.fillItemsType = mockFillItemsType([80, 90]);
            instance._beforeMount(cfg).addCallback(function() {
               instance._afterMount();
               instance._forceUpdate = function() {
                  forceUpdateCalled = true;
               };
               instance._sourceChanged = false;
               instance._afterUpdate(cfg);
               assert.isFalse(forceUpdateCalled);
               assert.isNotOk(instance._sourceChanged);
               done();
            });
         });
         it('new source', function(done) {
            var
               forceUpdateCalled = false,
               newCfg = {
                  source: new sourceLib.Memory({
                     idProperty: 'id',
                     data: data
                  }),
                  keyProperty: 'id'
               };
            instance._children = {
               toolbarBlock: {
                  clientWidth: 100
               }
            };
            WidthUtils.fillItemsType = mockFillItemsType([80, 90]);
            instance._beforeMount(cfg).addCallback(function() {
               instance._afterMount();
               instance._forceUpdate = function() {
                  forceUpdateCalled = true;
               };
               instance._sourceChanged = true;
               instance._afterUpdate(newCfg);
               assert.isTrue(forceUpdateCalled);
               assert.isFalse(instance._sourceChanged);
               done();
            });
         });
         it('enough space', function(done) {
            var forceUpdateCalled = false;
            instance._children = {
               toolbarBlock: {
                  clientWidth: 360
               }
            };
            instance._forceUpdate = function() {
               forceUpdateCalled = true;
            };
            WidthUtils.fillItemsType = mockFillItemsType([80, 90]);
            instance._beforeMount(cfg).addCallback(function() {
               instance._afterUpdate();
               instance._toolbarSource.query().addCallback(function(result) {
                  assert.equal(result.getAll().getRecordById(0).get('showType'), 2);
                  assert.equal(result.getAll().getRecordById(1).get('showType'), 2);
                  assert.isTrue(forceUpdateCalled);
                  done();
               });
            });
         });

         it('not enough space', function(done) {
            var forceUpdateCalled = false;
            instance._children = {
               toolbarBlock: {
                  clientWidth: 100
               }
            };
            instance._forceUpdate = function() {
               forceUpdateCalled = true;
            };
            WidthUtils.fillItemsType = mockFillItemsType([80, 90]);
            instance._beforeMount(cfg).addCallback(function() {
               instance._afterUpdate();
               instance._toolbarSource.query().addCallback(function(result) {
                  assert.equal(result.getAll().getRecordById(0).get('showType'), 1);
                  assert.equal(result.getAll().getRecordById(1).get('showType'), 0);
                  assert.isTrue(forceUpdateCalled);
                  done();
               });
            });
         });
      });

      describe('_onResize', function() {
         it('enough space', function(done) {
            var forceUpdateCalled = false;
            instance._children = {
               toolbarBlock: {
                  clientWidth: 360
               }
            };
            instance._forceUpdate = function() {
               forceUpdateCalled = true;
            };
            WidthUtils.fillItemsType = mockFillItemsType([80, 90]);
            instance._beforeMount(cfg).addCallback(function() {
               instance._onResize();
               instance._toolbarSource.query().addCallback(function(result) {
                  assert.equal(result.getAll().getRecordById(0).get('showType'), 2);
                  assert.equal(result.getAll().getRecordById(1).get('showType'), 2);
                  assert.isTrue(forceUpdateCalled);
                  done();
               });
            });
         });

         it('not enough space', function(done) {
            var forceUpdateCalled = false;
            instance._children = {
               toolbarBlock: {
                  clientWidth: 100
               }
            };
            instance._forceUpdate = function() {
               forceUpdateCalled = true;
            };
            WidthUtils.fillItemsType = mockFillItemsType([80, 90]);
            instance._beforeMount(cfg).addCallback(function() {
               instance._onResize();
               instance._toolbarSource.query().addCallback(function(result) {
                  assert.equal(result.getAll().getRecordById(0).get('showType'), 1);
                  assert.equal(result.getAll().getRecordById(1).get('showType'), 0);
                  assert.isTrue(forceUpdateCalled);
                  done();
               });
            });
         });
      });

      it('_toolbarItemClick', function() {
         var item = {
            test: 123
         };
         instance._notify = function(e, eventArgs) {
            assert.equal(e, 'itemClick');
            assert.equal(item, eventArgs[0]);
         };
         instance._toolbarItemClick({}, item);
      });

      it('panel is not visible', function(done) {
         var forceUpdateCalled = false;
         instance._container = {
            offsetParent: null
         };
         instance._children = {
            toolbarBlock: {
               clientWidth: 100
            }
         };
         WidthUtils.fillItemsType = mockFillItemsType([80, 90]);
         instance._beforeMount(cfg).addCallback(function() {
            instance._afterMount();
            instance._forceUpdate = function() {
               forceUpdateCalled = true;
            };
            instance._children.toolbarBlock.clientWidth = 0;
            instance._afterUpdate(cfg);
            assert.isFalse(forceUpdateCalled);
            done();
         });
      });
   });
});
