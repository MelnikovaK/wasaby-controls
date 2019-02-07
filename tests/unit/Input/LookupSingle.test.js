/**
 * Created by am.gerasimov on 31.05.2018.
 */
define([
   'Controls/Selector/Lookup/_Lookup',
   'Types/entity',
   'Types/collection'
], function(Lookup, entity, collection) {

   describe('Controls/Selector/Lookup/_Lookup', function() {
      it('getAdditionalCollectionWidth', function() {
         var afterFieldWrapperWidth = 20;
         var fieldWrapper = {
            offsetWidth: 110
         };

         assert.equal(Lookup._private.getAdditionalCollectionWidth(fieldWrapper, afterFieldWrapperWidth, false, false), afterFieldWrapperWidth);
         assert.equal(Lookup._private.getAdditionalCollectionWidth(fieldWrapper, 10, false, true), 43);
      });

      it('getInputMinWidth', function() {
         assert.equal(Lookup._private.getInputMinWidth(330, 30), 99);
         assert.equal(Lookup._private.getInputMinWidth(530, 30), 100);
      });

      it('getMaxVisibleItems', function() {
         var
            items = [1, 2, 3, 4, 5],
            itemsSizes = [5, 10, 25, 40, 15];

         assert.deepEqual(Lookup._private.getMaxVisibleItems(items, itemsSizes, 80), 3);
         assert.deepEqual(Lookup._private.getMaxVisibleItems(items, itemsSizes, 10), 1);
         assert.deepEqual(Lookup._private.getMaxVisibleItems(items, itemsSizes, 999), items.length);
      });

      it('getLastSelectedItems', function() {
         var
            item = new entity.Model({
               rawData: {id: 1},
               idProperty: 'id'
            }),
            item2 = new entity.Model({
               rawData: {id: 2},
               idProperty: 'id'
            }),
            items = new collection.List({
               items: [item, item2]
            });

         assert.deepEqual(Lookup._private.getLastSelectedItems(items, 1), [item2]);
         assert.deepEqual(Lookup._private.getLastSelectedItems(items, 10), [item, item2]);
      });

      it('isShowCounter', function() {
         assert.isTrue(Lookup._private.isShowCounter(10, 5));
         assert.isFalse(Lookup._private.isShowCounter(10, 20));
      });

      it('getLastRowCollectionWidth', function() {
         var itemsSizes = [10, 20, 30, 40];

         assert.equal(Lookup._private.getLastRowCollectionWidth(itemsSizes, false, false, 20), 100);
         assert.equal(Lookup._private.getLastRowCollectionWidth(itemsSizes, true, true, 20), 120);
      });

      it('getInputWidth', function() {
         assert.equal(Lookup._private.getInputWidth(400, 200, 100), undefined);
         assert.equal(Lookup._private.getInputWidth(400, 200, 300), 200);
      });

      it('getMultiLineState', function() {
         assert.isTrue(Lookup._private.getMultiLineState(200, 100, true));
         assert.isFalse(Lookup._private.getMultiLineState(200, 300, true));
         assert.isTrue(Lookup._private.getMultiLineState(200, 300, false));
      });

      it('isNeedUpdate', function() {
         assert.isFalse(Lookup._private.isNeedUpdate(5, false, true, 10));
         assert.isTrue(Lookup._private.isNeedUpdate(5, true, true, 10));
         assert.isTrue(Lookup._private.isNeedUpdate(5, false, false, 10));
         assert.isTrue(Lookup._private.isNeedUpdate(5, false, true, 3));
      });

      it('_beforeMount', function() {
         var lookup = new Lookup();
         lookup._beforeMount({multiLine: true, maxVisibleItems: 10});
         assert.isNotNull(lookup._simpleViewModel);
         assert.equal(lookup._maxVisibleItems, 10);

         lookup._beforeMount({items: {getCount: function() {return 5}}});
         assert.equal(lookup._maxVisibleItems, 5);
      });

      it('_beforeUnmount', function() {
         var lookup = new Lookup();
         lookup._simpleViewModel = true;
         lookup._beforeUnmount();

         assert.isNull(lookup._simpleViewModel);
      });

      it('_afterUpdate', function() {
         var lookup = new Lookup();
         lookup._needSetFocusInInput = true;
         lookup._active = true;

         var activated = false;
         lookup.activate = function() {
            activated = true;
         };

         lookup._afterUpdate();
         assert.isTrue(activated);
      });

      it('_beforeUpdate', function() {
         var lookup = new Lookup();

         lookup._beforeMount({multiLine: true});
         lookup._beforeUpdate({
            items: new collection.List()
         });
         assert.equal(lookup._multiLineState, undefined);
         assert.equal(lookup._counterWidth, undefined);

         lookup._beforeUpdate({
            items: new collection.List(),
            multiLine: true
         });
         assert.notEqual(lookup._multiLineState, undefined);
         assert.notEqual(lookup._counterWidth, undefined);
         assert.equal(lookup._maxVisibleItems, undefined);

         lookup._beforeUpdate({
            items: new collection.List(),
            maxVisibleItems: 10
         });
         assert.notEqual(lookup._maxVisibleItems, undefined);
         assert.equal(lookup._inputWidth, undefined);
         assert.equal(lookup._availableWidthCollection, undefined);
      });

      it('_changeValueHandler', function() {
         var
            newValue = [],
            lookup = new Lookup();

         lookup._notify = function(event, value) {
            if (event === 'valueChanged') {
               newValue = value;
            }
         };
         lookup._changeValueHandler(null, 1);
         assert.deepEqual(newValue, [1]);
      });

      it('_choose', function() {
         var
            isActivate = false,
            lookup = new Lookup();

         lookup.activate = function() {
            isActivate = true;
         };

         lookup._beforeMount({multiLine: true});
         lookup._choose();
         assert.isFalse(isActivate);

         lookup._options.multiSelect = true;
         lookup._choose();
         assert.isTrue(isActivate);
      });

      it('_deactivated', function() {
         var lookup = new Lookup();
         lookup._suggestState = true;
         lookup._deactivated();
         assert.isFalse(lookup._suggestState);
      });

      it('_suggestStateChanged', function() {
         var lookup = new Lookup();

         lookup._suggestState = true;
         lookup._isPickerVisible = false;
         lookup._suggestStateChanged();
         assert.isTrue(lookup._suggestState);

         lookup._options.readOnly = true;
         lookup._suggestStateChanged();
         assert.isFalse(lookup._suggestState);

         lookup._suggestState = true;
         lookup._infoboxOpened = true;
         lookup._options.readOnly = false;
         lookup._suggestStateChanged();
         assert.isFalse(lookup._suggestState);
      });

      it('_determineAutoDropDown', function() {
         var
            countItems = 0,
            lookup = new Lookup();

         lookup._options.autoDropDown = true;
         lookup._options.items = {
            getCount: function() {return countItems}
         };
         lookup._options.multiSelect = false;
         assert.isTrue(lookup._determineAutoDropDown());

         countItems = 1;
         assert.isFalse(lookup._determineAutoDropDown());

         lookup._options.multiSelect = true;
         assert.isTrue(lookup._determineAutoDropDown());
      });

      it('_onClickShowSelector', function() {
         var lookup = new Lookup();

         lookup._suggestState = true;
         lookup._onClickShowSelector();

         assert.isFalse(lookup._suggestState);
      });
   });
});