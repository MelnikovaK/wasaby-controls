/**
 * Created by kraynovdo on 17.11.2017.
 */
define([
   'Controls/List/SimpleList/ListViewModel',
   'Controls/List/resources/utils/ItemsUtil',
   'WS.Data/Collection/RecordSet'
], function(ListViewModel, ItemsUtil, RecordSet){
   describe('Controls.List.ListControl.ListViewModel', function () {
      var data, data2, display;
      beforeEach(function() {
         data = [
            {
               id : 1,
               title : 'Первый',
               type: 1
            },
            {
               id : 2,
               title : 'Второй',
               type: 2
            },
            {
               id : 3,
               title : 'Третий',
               type: 2
            }
         ]; data2 = [
            {
               id : 4,
               title : 'Четвертый',
               type: 1
            },
            {
               id : 5,
               title : 'Пятый',
               type: 2
            },
            {
               id : 6,
               title : 'Шестой',
               type: 2
            }
         ];

      });

      it('Enumeration', function () {
         var cfg = {
            items: data,
            idProperty: 'id'
         };

         var iv = new ListViewModel(cfg);



         assert.equal(0, iv._itemsModel._curIndex, 'Incorrect start enumeration index after constructor');

         iv._itemsModel._curIndex = 3;
         iv.reset();
         assert.equal(0, iv._itemsModel._curIndex, 'Incorrect current enumeration index after reset()');

         iv.goToNext();
         iv.goToNext();
         assert.equal(2, iv._itemsModel._curIndex, 'Incorrect current enumeration index after 2x_goToNext');

         var condResult = iv.isEnd();
         assert.isTrue(condResult, 'Incorrect condition value enumeration index after 2x_goToNext');
         iv.goToNext();
         condResult = iv.isEnd();
         assert.isFalse(condResult, 'Incorrect condition value enumeration index after 3x_goToNext');
      });

      it('Other', function () {
         var cfg = {
            items: data,
            idProperty: 'id',
            displayProperty: 'title',
            markedKey: 1
         };

         var iv = new ListViewModel(cfg);

         var cur = iv.getCurrent();
         assert.equal('id', cur.idProperty, 'Incorrect field set on getCurrent()');
         assert.equal('title', cur.displayProperty, 'Incorrect field set on getCurrent()');
         assert.equal(0, cur.index, 'Incorrect field set on getCurrent()');
         assert.deepEqual(data[0], cur.item, 'Incorrect field set on getCurrent()');
         assert.isTrue(cur.isSelected, 'Incorrect field set on getCurrent()');

      });


      it('Selection', function () {
         var cfg = {
            items: data,
            idProperty: 'id',
            displayProperty: 'title',
            markedKey: 2
         };

         var iv = new ListViewModel(cfg);
         var marItem = iv._markedItem;
         assert.equal(iv._itemsModel._display.at(1), marItem, 'Incorrect selectedItem');


         iv.setMarkedKey(3);
         marItem = iv._markedItem;
         assert.equal(iv._itemsModel._display.at(2), marItem, 'Incorrect selectedItem');
      });

      it('setItems', function () {
         var rs1 = new RecordSet({
            rawData: data,
            idProperty : 'id'
         });
         var rs2 = new RecordSet({
            rawData: data2,
            idProperty : 'id'
         });

         var cfg1 = {
            items: data,
            idProperty: 'id',
            displayProperty: 'title'
         };

         var cfg2 = {
            items: rs1,
            idProperty: 'id',
            displayProperty: 'title'
         };

         //первый кейс - были items - массив, а ставим рекордсет. Должен полностью смениться инстанс
         var iv = new ListViewModel(cfg1);
         iv.setItems(rs2);
         assert.equal(rs2, iv._itemsModel._items, 'Incorrect items after setItems');

         //второй кейс - были items - рекордсет, и ставим рекордсет. Должен остаться инстанс старого, но данные новые
         iv = new ListViewModel(cfg2);
         iv.setItems(rs2);
         assert.equal(rs1, iv._itemsModel._items, 'Incorrect items after setItems');
         assert.equal(4, iv._itemsModel._items.at(0).get('id'), 'Incorrect items after setItems');

      });

      it('Append', function () {
         var rs1 = new RecordSet({
            rawData: data,
            idProperty : 'id'
         });
         var rs2 = new RecordSet({
            rawData: data2,
            idProperty : 'id'
         });
         var cfg1 = {
            items: rs1,
            idProperty: 'id',
            displayProperty: 'title'
         };

         var iv = new ListViewModel(cfg1);
         iv.appendItems(rs2);

         assert.equal(6, iv._itemsModel._items.getCount(), 'Incorrect items count after appendItems');
         assert.equal(4, iv._itemsModel._items.at(3).get('id'), 'Incorrect items after appendItems');

      });

      it('Prepend', function () {
         var rs1 = new RecordSet({
            rawData: data,
            idProperty : 'id'
         });
         var rs2 = new RecordSet({
            rawData: data2,
            idProperty : 'id'
         });
         var cfg1 = {
            items: rs1,
            idProperty: 'id',
            displayProperty: 'title'
         };

         var iv = new ListViewModel(cfg1);
         iv.prependItems(rs2);

         assert.equal(6, iv._itemsModel._items.getCount(), 'Incorrect items count after prependItems');
         assert.equal(1, iv._itemsModel._items.at(3).get('id'), 'Incorrect items after prependItems');

      });

      it('itemsReadyCallback', function () {
         var rs1 = new RecordSet({
            rawData: data,
            idProperty : 'id'
         });
         var rs2 = new RecordSet({
            rawData: data2,
            idProperty : 'id'
         });

         var result, callback, cfg;

         callback = function() {
            result = 1;
         };

         cfg = {
            items: data,
            idProperty: 'id',
            displayProperty: 'title',
            itemsReadyCallback: callback
         };

         result = 0;
         var iv = new ListViewModel(cfg);
         assert.equal(1, result, 'itemsReadycallback wasn\'t call');

         result = 0;
         iv.setItems(rs2);
         assert.equal(1, result, 'itemsReadycallback wasn\'t call');
      });
   })
});