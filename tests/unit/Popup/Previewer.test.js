define(
   [
      'Controls/Popup/Previewer',
      'Core/vdom/Synchronizer/resources/SyntheticEvent'
   ],
   (Previewer, SyntheticEvent) => {
      'use strict';
      describe('Controls/Popup/Previewer', () => {
         it('contentMousedownHandler', () => {
            let PWInstance = new Previewer();
            var result;
            PWInstance._isPopupOpened = function() {
               return false;
            };
            PWInstance._debouncedAction = function(method, args) {
               result = true;
            };
            var event = new SyntheticEvent(null, {});
            PWInstance._options.trigger = 'click';
            PWInstance._contentMousedownHandler(event);
            assert.deepEqual(result, true);
            result = false;
            PWInstance._options.trigger = 'hover';
            PWInstance._contentMousedownHandler(event);
            assert.deepEqual(result, false);
            PWInstance._options.trigger = 'hoverAndClick';
            PWInstance._contentMousedownHandler(event);
            assert.deepEqual(result, true);
            PWInstance.destroy();
         });
      });

      describe('Controls/Popup/Previewer', () => {
         it('getConfig', () => {
            let PWInstance = new Previewer();
            let corner = {
               vertical: 'top'
            };
            let horizontalAlign = {
               side: 'left'
            };
            let verticalAlign = {
               side: 'top'
            };
            let options = {
               isCompoundTemplate: true,
               corner,
               horizontalAlign,
               verticalAlign
            };
            PWInstance.saveOptions(options);

            let config = PWInstance._private.getCfg(PWInstance);
            assert.equal(config.corner, corner);
            assert.equal(config.verticalAlign, verticalAlign);
            assert.equal(config.horizontalAlign, horizontalAlign);
            assert.equal(config.isCompoundTemplate, true);

            PWInstance.saveOptions({});
            config = PWInstance._private.getCfg(PWInstance);
            let baseCorner = {
               vertical: 'bottom',
               horizontal: 'right'
            };
            assert.deepEqual(config.corner, baseCorner);
            assert.equal(config.hasOwnProperty('verticalAlign'), false);
            assert.equal(config.hasOwnProperty('horizontalAlign'), false);
         });
      });
   }
);
