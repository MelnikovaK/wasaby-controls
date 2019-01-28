define(
   [
      'Controls/Popup/Opener/Dialog/DialogStrategy',
      'Controls/Popup/Opener/Dialog/DialogController',
      'Controls/Popup/Opener/Dialog'
   ],
   (DialogStrategy, DialogController, DialogOpener) => {
      'use strict';


      describe('Controls/Popup/Opener/Dialog', () => {
         let sizes = {
            width: 200,
            height: 300
         };

         it('Opener: getConfig', () => {
            let getDialogConfig = DialogOpener._private.getDialogConfig;
            let config = getDialogConfig();
            assert.equal(config.isDefaultOpener, true);

            config = getDialogConfig({ isDefaultOpener: false });
            assert.equal(config.isDefaultOpener, false);
         });

         it('dialog positioning base', () => {
            let windowData = {
               width: 1920,
               height: 1080,
               scrollTop: 0
            };
            let position = DialogStrategy.getPosition(windowData, sizes, { popupOptions: {} });
            assert.equal(position.top, 390);
            assert.equal(position.left, 860);

            windowData.scrollTop = 80;
            position = DialogStrategy.getPosition(windowData, sizes, { popupOptions: {} });
            assert.equal(position.top, 470);
         });

         it('dialog positioning overflow container', () => {
            let windowData = {
               width: 300,
               height: 300,
               scrollTop: 0
            };
            let position = DialogStrategy.getPosition(windowData, sizes, { popupOptions: {} });
            assert.equal(position.top, 0);
            assert.equal(position.left, 50);
            assert.equal(position.width, undefined);
            assert.equal(position.height, 300);
         });

         it('dialog positioning overflow popup config', () => {
            let popupOptions = {
               minWidth: 300,
               maxWidth: 600
            };
            let windowData = {
               width: 500,
               height: 500,
               scrollTop: 0
            };
            let position = DialogStrategy.getPosition(windowData, sizes, { popupOptions: popupOptions });
            assert.equal(position.left, 0);
            assert.equal(position.width, 500);
         });

         it('dialog positioning overflow minWidth', () => {
            let popupOptions = {
               minWidth: 600,
               maxWidth: 700
            };
            let windowData = {
               width: 500,
               height: 500,
               scrollTop: 0
            };
            let position = DialogStrategy.getPosition(windowData, sizes, { popupOptions: popupOptions });
            assert.equal(position.left, 0);
            assert.equal(position.width, 600);
         });

         it('dialog container sizes after update', () => {
            DialogController.prepareConfig = () => {
               assert.equal(container.style.width, 'auto');
               assert.equal(container.style.height, 'auto');
               assert.equal(container.style.maxWidth, '20px');
               assert.equal(container.style.maxHeight, '30px');
            };
            let container = {
               style: {
                  width: 10,
                  height: 10
               }
            };
            DialogController.elementUpdated({
               popupOptions: {
                  maxWidth: 20,
                  maxHeight: 30
               }
            }, container);
            assert.equal(container.style.width, 10);
            assert.equal(container.style.height, 10);
            assert.equal(container.style.maxWidth, '');
            assert.equal(container.style.maxHeight, '');
         });

         it('dialog default position', () => {
            let item = {
               popupOptions: {
                  maxWidth: 100,
                  maxHeight: 100
               }
            };
            let position = DialogController.getDefaultConfig(item);
            assert.equal(item.position.width, 100);
            assert.equal(item.position.height, 100);
         });

         it('dialog drag start', function() {
            let item = {
               position: {
                  left: 100,
                  top: 50
               },
               sizes: {
                  width: 50,
                  height: 50
               }
            };
            let offset = {
               x: 10,
               y: 20
            };
            let basePrepareConfig = DialogController._private.prepareConfig;
            DialogController._private.prepareConfig = (item, sizes) => {
               assert.equal(item.sizes, sizes);
            };
            DialogController.popupDragStart(item, null, offset);
            assert.equal(item.startPosition.left, 100);
            assert.equal(item.startPosition.top, 50);
            assert.equal(item.position.left, 110);
            assert.equal(item.position.top, 70);
            DialogController._private.prepareConfig = basePrepareConfig;
         });

         it('dialog draggable position', () => {
            let itemPosition = { left: 100, top: 100 };
            let windowData = {
               width: 800,
               height: 600,
               scrollTop: 0
            };
            let position = DialogStrategy.getPosition(windowData, sizes, {
               position: itemPosition,
               dragged: true
            });
            assert.equal(position.left, itemPosition.left);
            assert.equal(position.top, itemPosition.top);

            itemPosition = {
               left: 700, top: 500, width: sizes.width, height: sizes.height
            };
            windowData = {
               width: 800,
               height: 600,
               scrollTop: 0
            };
            position = DialogStrategy.getPosition(windowData, sizes, {
               position: itemPosition,
               dragged: true
            });
            assert.equal(position.left, 600);
            assert.equal(position.top, 300);
            assert.equal(position.width, sizes.width); // размеры не изменились
            assert.equal(position.height, sizes.height);
         });
      });
   }
);
