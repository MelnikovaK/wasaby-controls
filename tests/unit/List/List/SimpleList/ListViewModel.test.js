/**
 * Created by kraynovdo on 17.11.2017.
 */
define([
   'Controls/List/ListViewModel',
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

      it('getCurrent', function () {
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
         assert.equal(iv._display.at(1), marItem, 'Incorrect selectedItem');


         iv.setMarkedKey(3);
         marItem = iv._markedItem;
         assert.equal(iv._display.at(2), marItem, 'Incorrect selectedItem');
         assert.equal(1, iv.getVersion(), 'Incorrect version appendItems');
      });



      it('multiSelection', function () {
         var rs1 = new RecordSet({
            rawData: data,
            idProperty : 'id'
         });


         var cfg;

         cfg = {
            items: data,
            idProperty: 'id',
            displayProperty: 'title',
            selectedKeys: [1, 3]
         };

         var iv = new ListViewModel(cfg);
         assert.isTrue(!!iv._multiselection, 'ListViewModel: MultiSelection instance wasn\'t create');
         assert.deepEqual([1, 3], iv._multiselection._selectedKeys, 'ListViewModel: MultiSelection has wrong selected keys');

         iv.select([2]);
         assert.deepEqual([1, 3, 2], iv._multiselection._selectedKeys, 'ListViewModel: MultiSelection has wrong selected keys');
         assert.equal(1, iv.getVersion(), 'Incorrect version appendItems');

         iv.unselect([1]);
         assert.deepEqual([3, 2], iv._multiselection._selectedKeys, 'ListViewModel: MultiSelection has wrong selected keys');
         assert.equal(2, iv.getVersion(), 'Incorrect version appendItems');
      });
   });

});