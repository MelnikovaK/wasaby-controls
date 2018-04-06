/**
 * Created by kraynovdo on 17.11.2017.
 */
define([
   'Controls/List/SimpleList/ItemsViewModel',
   'Controls/List/resources/utils/ItemsUtil',
   'WS.Data/Collection/RecordSet'
], function(ItemsViewModel, ItemsUtil, RecordSet){
   describe('Controls.List.ListControl.ItemsViewModel', function () {
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
         ];
         data2 = [
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
      it('Display', function () {
         var cfg = {
            items: data,
            idProperty: 'id'
         };
         var iv = new ItemsViewModel(cfg);

         var disp = iv._display;
         assert.equal(data.length, disp.getCount(), 'Incorrect display\'s creating before mounting');

      });

      it('Enumeration', function () {
         var cfg = {
            items: data,
            idProperty: 'id'
         };

         var iv = new ItemsViewModel(cfg);



         assert.equal(0, iv._curIndex, 'Incorrect start enumeration index after constructor');

         iv._curIndex = 3;
         iv.reset();
         assert.equal(0, iv._curIndex, 'Incorrect current enumeration index after reset()');

         iv.goToNext();
         iv.goToNext();
         assert.equal(2, iv._curIndex, 'Incorrect current enumeration index after 2x_goToNext');

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
            displayProperty: 'title'
         };

         var iv = new ItemsViewModel(cfg);

         var cur = iv.getCurrent();
         assert.equal('id', cur.idProperty, 'Incorrect field set on getCurrent()');
         assert.equal('title', cur.displayProperty, 'Incorrect field set on getCurrent()');
         assert.equal(0, cur.index, 'Incorrect field set on getCurrent()');
         assert.deepEqual(data[0], cur.item, 'Incorrect field set on getCurrent()');


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
         var iv = new ItemsViewModel(cfg1);
         iv.setItems(rs2);
         assert.equal(rs2, iv._items, 'Incorrect items after setItems');

         //второй кейс - были items - рекордсет, и ставим рекордсет. Должен остаться инстанс старого, но данные новые
         iv = new ItemsViewModel(cfg2);
         iv.setItems(rs2);
         assert.equal(rs1, iv._items, 'Incorrect items after setItems');
         assert.equal(4, iv._items.at(0).get('id'), 'Incorrect items after setItems');

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

         var iv = new ItemsViewModel(cfg1);
         iv.appendItems(rs2);

         assert.equal(6, iv._items.getCount(), 'Incorrect items count after appendItems');
         assert.equal(4, iv._items.at(3).get('id'), 'Incorrect items after appendItems');

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

         var iv = new ItemsViewModel(cfg1);
         iv.prependItems(rs2);

         assert.equal(6, iv._items.getCount(), 'Incorrect items count after prependItems');
         assert.equal(1, iv._items.at(3).get('id'), 'Incorrect items after prependItems');

      });

      it('Remove', function () {
         var iv = new ItemsViewModel({
            items: new RecordSet({
               rawData: data,
               idProperty : 'id'
            }),
            idProperty: 'id',
            displayProperty: 'title'
         });

         iv.removeItems([1]);
         assert.equal(2, iv._items.getCount(), 'Incorrect items count after removeItems');
         iv.removeItems([2, 3]);
         assert.equal(0, iv._items.getCount(), 'Incorrect items count after remove all items');

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
         var iv = new ItemsViewModel(cfg);
         assert.equal(1, result, 'itemsReadycallback wasn\'t call');

         result = 0;
         iv.setItems(rs2);
         assert.equal(1, result, 'itemsReadycallback wasn\'t call');
      });
   })
});