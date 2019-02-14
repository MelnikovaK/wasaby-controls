define(
   [
      'Controls/Popup/Manager/Container',
      'Types/collection',
      'Core/helpers/Number/randomId'
   ],

   function (Container, collection, randomId) {
      'use strict';
      describe('Controls/Popup/Manager/Container', function () {
         var
            id,
            items = new collection.List(),
            popupContainer = new Container();

         it('set null items', function(){
            popupContainer._beforeMount();
            assert.equal(popupContainer._popupItems.getCount(), 0);
         });

         it('add popupItem', function(){
            id = randomId('popup-');
            items.add({
               id: id,
               popupOptions: {}
            });
            popupContainer.setPopupItems(items);
            assert.equal(popupContainer._popupItems.getCount(), 1);
         });

         it('set overlay', function(){
            popupContainer.setOverlay(3);
            assert.equal(popupContainer._overlayId, 3);
         });

         it('remove popupItem', function(){
            items.removeAt(0);
            popupContainer.setPopupItems(items);
            assert.equal(popupContainer._popupItems.getCount(), 0);
         });
      });
   }
);
