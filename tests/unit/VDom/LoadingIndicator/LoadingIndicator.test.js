define([
   'Controls/Container/LoadingIndicator'
], (LoadingIndicator) => {
   'use strict';

   describe('LoadingIndicator-tests', () => {
      let Loading = new LoadingIndicator();
      Loading._beforeMount({});

      it('LoadingIndicator - delay', () => {
         let LoadingDelay = new LoadingIndicator();
         LoadingDelay._beforeMount({
            delay: 1
         });
         assert.equal(LoadingDelay._getDelay({}), 1);
         assert.equal(LoadingDelay._getDelay({delay: 5}), 5);
         LoadingDelay._beforeMount({});
         assert.equal(LoadingDelay._getDelay({}), 2000);
         assert.equal(LoadingDelay._getDelay({delay: 3}), 3);
         LoadingDelay.destroy();
      });

      it('LoadingIndicator - add', () => {
         Loading._toggleIndicator = () => {
         };
         let prom = new Promise((resolve) => {
         });
         let config = {
            message: 'message 1',
            delay: 1
         };
         let id = Loading._show(config, prom);
         assert.equal(typeof id, 'string');
         assert.equal(Loading._stack.getCount(), 1);
         assert.equal(Loading._stack.at(0).overlay, 'default');
         assert.equal(Loading._stack.at(0).message, 'message 1');
         assert.equal(Loading._stack.at(0).waitPromise, prom);

         config = {
            message: 'message 2',
            overlay: 'none'
         };
         Loading._show(config);
         assert.equal(Loading._stack.getCount(), 2);
         assert.equal(Loading._stack.at(1).overlay, 'none');
         assert.equal(Loading._stack.at(1).message, 'message 2');

         Loading._show('message 3');
         assert.equal(Loading._stack.getCount(), 3);
         assert.equal(Loading._stack.at(2).message, 'message 3');

         config = {
            message: 'message 4',
            overlay: 'none'
         };

         id = Loading.show(config);
         assert.equal(Loading._stack.getCount(), 4);
         assert.equal(Loading._stack.at(3).message, 'message 4');
         assert.equal(typeof id, 'string');

         Loading.hide(id);
         assert.equal(Loading._stack.getCount(), 3);
      });

      it('LoadingIndicator - isOpened', () => {
         let cfg1 = Loading._stack.at(0);
         assert.equal(Loading._isOpened(cfg1), true);

         let cfg2 = { id: 'test', message: 'test' };
         assert.equal(Loading._isOpened(cfg2), false);
         assert.equal(cfg2.hasOwnProperty('id'), false);
      });

      it('LoadingIndicator - update', () => {
         let cfg1 = Loading._stack.at(0);
         let id = cfg1.id;
         cfg1.message = 'message 0';
         Loading._show(cfg1);

         assert.equal(Loading._stack.getCount(), 3);
         assert.equal(Loading._stack.at(2).id, id);
         assert.equal(Loading._stack.at(2).message, 'message 0');
      });

      it('LoadingIndicator - remove indicator from stack', () => {
         let resultVisible;
         let resultConfigMessage;
         let baseToggleMethod = Loading._toggleIndicator;
         Loading._toggleIndicator = (visible, config) => {
            assert.equal(resultVisible, visible);
            assert.equal(resultConfigMessage, config && config.message);
         };

         let id = Loading._stack.at(0).id;
         resultVisible = true;
         resultConfigMessage = 'message 0';
         Loading._hide(id);
         assert.equal(Loading._stack.getCount(), 2);

         id = Loading._stack.at(1).id;
         resultConfigMessage = 'message 3';
         Loading._hide(id);
         assert.equal(Loading._stack.getCount(), 1);

         id = Loading._stack.at(0).id;
         resultConfigMessage = undefined;
         resultVisible = false;
         Loading._hide(id);
         assert.equal(Loading._stack.getCount(), 0);

         Loading._toggleIndicator = baseToggleMethod;
      });

      it('LoadingIndicator - hide', () => {
         let config = {
            message: 'message 1',
            delay: 1
         };
         Loading._show(config);
         Loading._show(config);
         Loading._show(config);
         Loading.hide();
         assert.equal(Loading._stack.getCount(), 0);
      });
      after(() => {
         Loading.destroy();
      });
   });
});
