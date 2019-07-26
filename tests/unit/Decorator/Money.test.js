define(
   [
      'Controls/decorator'
   ],
   function(decorator) {

      'use strict';

      describe('Controls.Decorator.Money', function() {
         var result;

         it('parseNumber', function() {
            result = decorator.Money._private.parseNumber(20, false);
            assert.deepEqual(result, {
               number: '20.00',
               integer: '20',
               fraction: '.00'
            });

            result = decorator.Money._private.parseNumber(20.1, false);
            assert.deepEqual(result, {
               number: '20.10',
               integer: '20',
               fraction: '.10'
            });

            result = decorator.Money._private.parseNumber(20.18, false);
            assert.deepEqual(result, {
               number: '20.18',
               integer: '20',
               fraction: '.18'
            });

            result = decorator.Money._private.parseNumber(20.181, false);
            assert.deepEqual(result, {
               number: '20.18',
               integer: '20',
               fraction: '.18'
            });

            result = decorator.Money._private.parseNumber(Infinity, false);
            assert.deepEqual(result, {
               number: '0.00',
               integer: '0',
               fraction: '.00'
            });

            result = decorator.Money._private.parseNumber(1000.00, false);
            assert.deepEqual(result, {
               number: '1000.00',
               integer: '1000',
               fraction: '.00'
            });

            result = decorator.Money._private.parseNumber(1000.00, true);
            assert.deepEqual(result, {
               number: '1 000.00',
               integer: '1 000',
               fraction: '.00'
            });

            result = decorator.Money._private.parseNumber(-1000.00, false);
            assert.deepEqual(result, {
               number: '-1000.00',
               integer: '-1000',
               fraction: '.00'
            });

            result = decorator.Money._private.parseNumber(-1000.00, true);
            assert.deepEqual(result, {
               number: '-1 000.00',
               integer: '-1 000',
               fraction: '.00'
            });
         });
         it('isDisplayFractionPath', function() {
            result = decorator.Money.prototype._isDisplayFractionPath('.00', false);
            assert.equal(result, false);

            result = decorator.Money.prototype._isDisplayFractionPath('.10', false);
            assert.equal(result, true);

            result = decorator.Money.prototype._isDisplayFractionPath('.00', true);
            assert.equal(result, true);

            result = decorator.Money.prototype._isDisplayFractionPath('.10', true);
            assert.equal(result, true);
         });
         it('title', function() {
            var ctrl = new decorator.Money();

            ctrl._beforeMount({
               value: '0.00'
            });
            assert.equal(ctrl._title, '0.00');

            ctrl._beforeMount({
               value: '0.00',
               title: ''
            });
            assert.equal(ctrl._title, '');

            ctrl._beforeMount({
               value: '0.00',
               title: 'title'
            });
            assert.equal(ctrl._title, 'title');
         });
      });
   }
);
