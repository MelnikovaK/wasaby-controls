define(
   [
      'Controls/compatiblePopup'
   ],

   function(compatiblePopup) {
      'use strict';

      describe('Controls/compatiblePopup:ShowDialogHelper', function() {
         it('_prepareDeps', function() {
            var config = {
                  isStack: true,
                  target: 'testTarget'
               },
               deps;
            deps = compatiblePopup.ShowDialogHelper._private.prepareDeps(config);
            assert.isTrue(deps.indexOf('Controls/popup') !== -1);
            assert.isTrue(deps.indexOf('Controls/popupTemplate') !== -1);
            assert.isTrue(config._path === 'StackController');
            assert.isTrue(config._type === 'stack');
            delete config.isStack;
            deps = compatiblePopup.ShowDialogHelper._private.prepareDeps(config);
            assert.isTrue(deps.indexOf('Controls/popupTemplate') !== -1);
            assert.isTrue(config._path === 'StickyController');
            assert.isTrue(config._type === 'sticky');
            delete config.target;
            deps = compatiblePopup.ShowDialogHelper._private.prepareDeps(config);
            assert.isTrue(deps.indexOf('Controls/popupTemplate') !== -1);
            assert.isTrue(config._path === 'DialogController');
            assert.equal(config._popupComponent , 'floatArea');
            assert.isTrue(config._type === 'dialog');
         });
      })
   }
);
