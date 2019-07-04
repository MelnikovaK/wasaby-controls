/**
 * Created by Rodionov E.A. on 29.11.2018.
 */
define([
   'Controls/list'
], function(list) {
   describe('Controls.Controllers.VirtualScroll', function() {

      function generateData(count) {
         var res = [];
         for (var i = 0; i < count; i++) {
            res[i] = {
               id: i,
               title: 'Какая то запись с id ' + i
            };
         }
         return res;
      }

      it('constructor', function () {
         var vsInstance = new list.VirtualScroll({
            virtualPageSize: 80,
         });
         assert.equal(0, vsInstance._startIndex, 'Wrong start index after ctor');
         assert.equal(80, vsInstance._stopIndex, 'Wrong stop index after ctor');
         assert.equal(80, vsInstance._virtualPageSize, 'Wrong virtualPageSize index after ctor');
         assert.equal(20, vsInstance._virtualSegmentSize, 'Wrong virtualPageSize index after ctor');
      });

      it('default options in constructor', function () {
         var vsInstance = new list.VirtualScroll({});
         assert.equal(0, vsInstance._startIndex, 'Wrong start index after default ctor');
         assert.equal(100, vsInstance._stopIndex, 'Wrong stop index after default ctor');
         assert.equal(100, vsInstance._virtualPageSize, 'Wrong virtualPageSize index after default ctor');
         assert.equal(25, vsInstance._virtualSegmentSize, 'Wrong virtualPageSize index after default ctor');
      });

      it('resetItemsIndexes', function () {
         var vsInstance = new list.VirtualScroll({
            virtualPageSize: 80,
         });

         vsInstance._startIndex = 20;
         vsInstance.resetItemsIndexes();

         assert.equal(0, vsInstance._startIndex, 'Wrong start index after reset');
         assert.equal(80, vsInstance._stopIndex, 'Wrong stop index after reset');
         assert.equal(80, vsInstance._virtualPageSize, 'Wrong virtualPageSize index after reset');
         assert.equal(20, vsInstance._virtualSegmentSize, 'Wrong virtualPageSize index after reset');
      });

      it('getter ItemsIndexes', function () {
         var
            vsInstance = new list.VirtualScroll({});

         vsInstance._startIndex = 23;
         vsInstance._stopIndex = 57;
         assert.deepEqual({start: 23, stop: 57}, vsInstance.ItemsIndexes);
      });

      it('insert heights', function () {
         var
            vsInstance = new list.VirtualScroll({});

         vsInstance._itemsHeights = [1, 1, 1, 1, 1, 1];
         assert.equal(6, vsInstance._itemsHeights.length);

         vsInstance.insertItemsHeights(2, 3);

         assert.equal(9, vsInstance._itemsHeights.length);
         assert.deepEqual([1, 1, 1, 0, 0, 0, 1, 1, 1], vsInstance._itemsHeights);
      });

      it('cut heights', function () {
         var
            vsInstance = new list.VirtualScroll({});

         vsInstance._itemsHeights = [1, 1, 1, 0, 0, 0, 1, 1, 1];
         assert.equal(9, vsInstance._itemsHeights.length);

         vsInstance.cutItemsHeights(2, 3);

         assert.equal(6, vsInstance._itemsHeights.length);
         assert.deepEqual([1, 1, 1, 1, 1, 1], vsInstance._itemsHeights);
      });

      it('setter ItemsContainer', function () {
         var
            vsInstance = new list.VirtualScroll({}),
            container = {
               children: [
                  {offsetHeight: 20},
                  {offsetHeight: 45},
                  {offsetHeight: 10},
                  {offsetHeight: 44},
                  {offsetHeight: 78},
                  {offsetHeight: 45},
                  {offsetHeight: 92}
               ]
            };
         vsInstance.updateItemsSizes = function () {
         };
         vsInstance.ItemsContainer = container;
         assert.deepEqual(container, vsInstance._itemsContainer);
      });

      it('getter ItemsContainer', function () {
         var
            vsInstance = new list.VirtualScroll({}),
            container = {
               children: [
                  {offsetHeight: 20},
                  {offsetHeight: 45},
                  {offsetHeight: 10},
                  {offsetHeight: 44},
                  {offsetHeight: 78},
                  {offsetHeight: 45},
                  {offsetHeight: 92}
               ]
            };
         vsInstance.updateItemsSizes = function () {
         };
         vsInstance.ItemsContainer = container;


         assert.deepEqual(container, vsInstance.ItemsContainer);
      });

      it('seter ItemsCount', function () {
         var
            vsInstance = new list.VirtualScroll({});

         vsInstance.ItemsCount = 4000;
         assert.equal(4000, vsInstance._itemsCount);
      });

      it('updateItemsSizes', function () {
         var
            vsInstance = new list.VirtualScroll({}),
            items = {
               children: [
                  {offsetHeight: 20},
                  {offsetHeight: 45},
                  {offsetHeight: 10},
                  {offsetHeight: 44},
                  {offsetHeight: 78},
                  {offsetHeight: 45},
                  {offsetHeight: 92}
               ]
            },
            itemsHeights = [20, 45, 10, 44, 78, 45, 92];

         vsInstance._itemsContainer = items;
         vsInstance._updateItemsSizes(0, 7, true);

         assert.deepEqual(itemsHeights, vsInstance.ItemsHeights);
      });

      it('getter Placeholders', function () {
         var
            vsInstance = new list.VirtualScroll({});

         vsInstance._itemsHeights = [20, 45, 10, 44, 78, 45, 92];
         vsInstance._startItemIndex = 2;
         vsInstance._stopItemIndex = 5;

         assert.deepEqual({
            top: 0,
            bottom: 0
         }, vsInstance.PlaceholdersSizes);

         vsInstance._topPlaceholderSize = 123;
         vsInstance._bottomPlaceholderSize = 333;

         assert.deepEqual({
            top: 123,
            bottom: 333
         }, vsInstance.PlaceholdersSizes);

      });

      it('update Placeholders', function () {
         var
            vsInstance = new list.VirtualScroll({}),
            placeholders;

         vsInstance._itemsHeights = [20, 45, 10, 44, 78, 45, 92];
         vsInstance._startIndex = 2;
         vsInstance._stopIndex = 5;


         assert.deepEqual({
            top: 0,
            bottom: 0
         }, vsInstance.PlaceholdersSizes);

         vsInstance._updatePlaceholdersSizes();

         assert.deepEqual({
            top: 65,
            bottom: 137
         }, vsInstance.PlaceholdersSizes);

      });

      it('getter ItemsHeights', function () {
         var
            vsInstance = new list.VirtualScroll({}),
            itemsHeights = [20, 45, 10, 44, 78, 45, 92];
         vsInstance._itemsHeights = itemsHeights;
         assert.deepEqual(itemsHeights, vsInstance.ItemsHeights);
      });

      it('_isScrollInPlaceholder', function () {
         var
            vsInstance = new list.VirtualScroll({
               virtualPageSize: 5
            });
         vsInstance._startIndex = 30;
         vsInstance._stopIndex = 35;

         // Mock itemsHeights placeholder
         vsInstance._itemsHeights = new Array(50).fill(0);
         vsInstance._itemsHeights[0] = 500;
         vsInstance._itemsHeights[30] = 10;
         vsInstance._itemsHeights[31] = 20;
         vsInstance._itemsHeights[32] = 30;
         vsInstance._itemsHeights[33] = 20;
         vsInstance._itemsHeights[34] = 10;
         vsInstance._itemsHeights[35] = 340;
         // topPlaceholder = 500
         // itemsHeight = 90
         // bottomPlaceholder = 340


         //Top placeholder visible
         assert.isFalse(vsInstance._isScrollInPlaceholder(300, 100));

         assert.isFalse(vsInstance._isScrollInPlaceholder(510, 50));

         //Bottom placeholder visible
         assert.isFalse(vsInstance._isScrollInPlaceholder(500, 100));

         // Bottom  placeholder visible
         assert.isFalse(vsInstance._isScrollInPlaceholder(700));
      });
   });
});
