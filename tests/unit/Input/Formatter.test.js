define(
   [
      'Controls/Input/Mask/Formatter',
      'Controls/Input/Mask/FormatBuilder'
   ],
   function(Formatter, FormatBuilder) {

      'use strict';

      describe('Controls.Input.Mask.Formatter', function() {
         var
            formatMaskChars = {
               'd': '[0-9]',
               'l': '[а-яa-zё]'
            },
            format = [
               FormatBuilder.getFormat('dd.dd', formatMaskChars, ' '),
               FormatBuilder.getFormat('+7(ddd)ddd-dd-dd', formatMaskChars, ''),
               FormatBuilder.getFormat('+7(ddd)ddd-dd-dd', formatMaskChars, ' '),
               FormatBuilder.getFormat('(ddd(ddd)ddd)', formatMaskChars, ''),
               FormatBuilder.getFormat('(ddd(ddd)ddd)', formatMaskChars, ' '),
               FormatBuilder.getFormat('(d\\*l\\{0,3})(d\\{0,3}l\\*)', formatMaskChars, '')
            ],
            result;
         describe('_private.getValueGroups', function() {
            it('Test_01', function() {
               result = Formatter._private.getValueGroups(format[0], '1 .3 ');
               assert.deepEqual(result, ['1 ', '.', '3 ']);
            });
            it('Test_02', function() {
               result = Formatter._private.getValueGroups(format[1], '+7(915)972-11-61');
               assert.deepEqual(result, ['+7', '(', '9', '1', '5', ')', '972', '-', '11', '-', '61']);
            });
            it('Test_03', function() {
               result = Formatter._private.getValueGroups(format[2], '+7(   )972-  -61');
               assert.deepEqual(result, ['+7', '(', ' ', ' ', ' ', ')', '972', '-', '  ', '-', '61']);
            });
            it('Test_04', function() {
               result = Formatter._private.getValueGroups(format[3], '(123(456)789)');
               assert.deepEqual(result, ['(', '1', '2', '3', '(', '4', '5', '6', ')', '7', '8', '9', ')']);
            });
            it('Test_05', function() {
               result = Formatter._private.getValueGroups(format[4], '(123(   )789)');
               assert.deepEqual(result, ['(', '1', '2', '3', '(', ' ', ' ', ' ', ')', '7', '8', '9', ')']);
            });
            it('Test_06', function() {
               result = Formatter._private.getValueGroups(format[5], '(1234qwe)(567rtyu)');
               assert.deepEqual(result, ['(', '1234', 'qwe', ')', '(', '567', 'rtyu', ')']);
            });
         });

         describe('getClearData', function() {
            it('Test_01', function() {
               result = Formatter.getClearData(format[0], '1 .3 ');
               assert.deepEqual(result, {
                  value: '1 3 ',
                  positions: [0, 1, 2, 2, 3]
               });
            });
            it('Test_02', function() {
               result = Formatter.getClearData(format[1], '+7(915)972-11-61');
               assert.deepEqual(result, {
                  value: '9159721161',
                  positions: [0, 0, 0, 0, 1, 2, 3, 3, 4, 5, 6, 6, 7, 8, 8, 9]
               });
            });
            it('Test_03', function() {
               result = Formatter.getClearData(format[2], '+7(   )972-  -61');
               assert.deepEqual(result, {
                  value: '   972  61',
                  positions: [0, 0, 0, 0, 1, 2, 3, 3, 4, 5, 6, 6, 7, 8, 8, 9]
               });
            });
            it('Test_04', function() {
               result = Formatter.getClearData(format[3], '(123(456)789)');
               assert.deepEqual(result, {
                  value: '123456789',
                  positions: [0, 0, 1, 2, 3, 3, 4, 5, 6, 6, 7, 8, 9]
               });
            });
            it('Test_05', function() {
               result = Formatter.getClearData(format[4], '(123(   )789)');
               assert.deepEqual(result, {
                  value: '123   789',
                  positions: [0, 0, 1, 2, 3, 3, 4, 5, 6, 6, 7, 8, 9]
               });
            });
            it('Test_06', function() {
               result = Formatter.getClearData(format[5], '(1234qwe)(567rtyu)');
               assert.deepEqual(result, {
                  value: '1234qwe567rtyu',
                  positions: [0, 0, 1, 2, 3, 4, 5, 6, 7, 7, 7, 8, 9, 10, 11, 12, 13, 14]
               });
            });
         });

         describe('getFormatterData', function() {
            it('Test_01', function() {
               result = Formatter.getFormatterData(format[0], {
                  value: '1 3 ',
                  position: 3
               });
               assert.deepEqual(result, {
                  value: '1 .3 ',
                  position: 4
               });
            });
            it('Test_02', function() {
               result = Formatter.getFormatterData(format[1], {
                  value: '915972',
                  position: 5
               });
               assert.deepEqual(result, {
                  value: '+7(915)972',
                  position: 9
               });
            });
            it('Test_03', function() {
               result = Formatter.getFormatterData(format[2], {
                  value: '   972  61',
                  position: 5
               });
               assert.deepEqual(result, {
                  value: '+7(   )972-  -61',
                  position: 9
               });
            });
            it('Test_04', function() {
               result = Formatter.getFormatterData(format[3], {
                  value: '123456789',
                  position: 4
               });
               assert.deepEqual(result, {
                  value: '(123(456)789)',
                  position: 6
               });
            });
            it('Test_05', function() {
               result = Formatter.getFormatterData(format[4], {
                  value: '123   789',
                  position: 4
               });
               assert.deepEqual(result, {
                  value: '(123(   )789)',
                  position: 6
               });
            });
            it('Test_06', function() {
               result = Formatter.getFormatterData(format[5], {
                  value: '1234qwe567rtyu',
                  position: 9
               });
               assert.deepEqual(result, {
                  value: '(1234qwe)(567rtyu)',
                  position: 12
               });
            });
            it('Test_invalidData', function() {
               result = Formatter.getFormatterData(format[0], {
                  value: '12.34',
                  position: 3
               });
               assert.equal(result, false);
            });
         });
      });
   }
);