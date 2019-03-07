define(
   [
      'Env/Env',
      'Controls/Input/Mask',
      'unit/Calendar/Utils'
   ],
   function(Env, Mask, testUtils) {

      'use strict';

      describe('Controls.Input.Mask', function() {
         it('findLastUserEnteredCharPosition', function() {
            var findLastUserEnteredCharPosition = Mask._private.findLastUserEnteredCharPosition;

            assert.equal(findLastUserEnteredCharPosition('12.34.56', ' '), 8);
            assert.equal(findLastUserEnteredCharPosition('12.34.  ', ' '), 6);
            assert.equal(findLastUserEnteredCharPosition('12.34.56', ''), 8);
            assert.equal(findLastUserEnteredCharPosition('12.34.', ''), 6);
         });

         it('validateReplacer', function() {
            var message = '';
            var error = Env.IoC.resolve('ILogger').error;
            var validateReplacer = Mask._private.validateReplacer;

            Env.IoC.resolve('ILogger').error = function(arg1, arg2) {
               message = arg1 + ': ' + arg2;
            };

            assert.equal(validateReplacer('', 'dd.dd'), true);
            assert.equal(message, '');
            assert.equal(validateReplacer(' ', 'dd.dd'), true);
            assert.equal(message, '');
            assert.equal(validateReplacer('', 'd\\*'), true);
            assert.equal(message, '');
            assert.equal(validateReplacer(' ', 'd\\*'), false);
            assert.equal(message, 'Mask: Used not empty replacer and mask with quantifiers. More on https://wi.sbis.ru/docs/js/Controls/Input/Mask/options/replacer/');

            Env.IoC.resolve('ILogger').error = error;
         });

         it('calcReplacer', function() {
            var calcReplacer = Mask._private.calcReplacer;

            assert.equal(calcReplacer(' ', 'dd.dd'), ' ');
            assert.equal(calcReplacer(' ', 'd\\*'), '');
         });

      });
   }
);
