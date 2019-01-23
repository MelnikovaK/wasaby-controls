define(
   [
      'Controls/Input/Mask/Formatter',
      'Controls/Input/Mask/FormatBuilder',
      'Controls/Input/Mask/InputProcessor'
   ],
   function(Formatter, FormatBuilder, InputProcessor) {

      'use strict';

      describe('Controls.Input.Mask.InputProcessor', function() {
         var
            replacer = ' ',
            format = FormatBuilder.getFormat('dd.dd', {
               d: '[0-9]'
            }, replacer),
            clearData = Formatter.getClearData(format, '1 . 4'),
            result;

         describe('getClearSplitValue', function() {
            it('Test_01', function() {
               result = InputProcessor.getClearSplitValue({
                  before: '1',
                  after: '. 4',
                  delete: ' ',
                  insert: '2'
               }, clearData);
               assert.deepEqual(result, {
                  before: '1',
                  after: ' 4',
                  delete: ' ',
                  insert: '2'
               });
            });
         });
         describe('input', function() {
            describe('insert', function() {
               it('Test_01', function() {
                  result = InputProcessor.input({
                     before: '1',
                     after: '.3 ',
                     delete: ' ',
                     insert: '2'
                  }, 'insert', replacer, format, format);
                  assert.deepEqual(result, {
                     value: '12. 3',
                     position: 3,
                     format: format
                  });
               });
               it('Test_02', function() {
                  result = InputProcessor.input({
                     before: '1 . ',
                     after: '4',
                     delete: '',
                     insert: 'g2'
                  }, 'insert', replacer, format, format);
                  assert.deepEqual(result, {
                     value: '1 . 2',
                     position: 5,
                     format: format
                  });
               });
               it('Test_03', function() {
                  var format = FormatBuilder.getFormat('dd.dd', {
                     d: '[0-9]'
                  }, '');
                  result = InputProcessor.input({
                     before: '1',
                     after: '3',
                     delete: '',
                     insert: '2'
                  }, 'insert', '', format, format);
                  assert.deepEqual(result, {
                     value: '12.3',
                     position: 3,
                     format: format
                  });
               });
               it('Test_04', function() {
                  var newFormat = FormatBuilder.getFormat('dd-dd', {
                     d: '[0-9]'
                  }, '');
                  var oldFormat = FormatBuilder.getFormat('dd-dd-dd', {
                     d: '[0-9]'
                  }, '');
                  result = InputProcessor.input({
                     before: '',
                     after: '',
                     delete: '12-34-56',
                     insert: '4'
                  }, 'insert', '', oldFormat, newFormat);
                  assert.deepEqual(result, {
                     value: '4',
                     position: 1,
                     format: newFormat
                  });
               });
               it('Test_05', function() {
                  var newFormat = FormatBuilder.getFormat('dd-dd', {
                     d: '[0-9]'
                  }, '');
                  var oldFormat = FormatBuilder.getFormat('dd-dd-dd', {
                     d: '[0-9]'
                  }, '');
                  result = InputProcessor.input({
                     before: '',
                     after: '',
                     delete: '12-34-56',
                     insert: 'f'
                  }, 'insert', '', oldFormat, newFormat);
                  console.log(result);
                  assert.deepEqual(result, {
                     value: '12-34-56',
                     position: 8,
                     format: oldFormat
                  });
               });
            });
            describe('delete', function() {
               it('Test_01', function() {
                  result = InputProcessor.input({
                     before: '',
                     after: '',
                     delete: '1 . 4',
                     insert: ''
                  }, 'delete', replacer, format, format);
                  assert.deepEqual(result, {
                     value: '  .  ',
                     position: 0,
                     format: format
                  });
               });
            });
            describe('deleteForward', function() {
               it('Test_01', function() {
                  result = InputProcessor.input({
                     before: '1',
                     after: '. 4',
                     delete: '2',
                     insert: ''
                  }, 'deleteForward', replacer, format, format);
                  assert.deepEqual(result, {
                     value: '1 . 4',
                     position: 3,
                     format: format
                  });
               });
               it('Test_02', function() {
                  result = InputProcessor.input({
                     before: '12',
                     after: '34',
                     delete: '.',
                     insert: ''
                  }, 'deleteForward', replacer, format, format);
                  assert.deepEqual(result, {
                     value: '12. 4',
                     position: 4,
                     format: format
                  });
               });
            });
            describe('deleteBackward', function() {
               it('Test_01', function() {
                  result = InputProcessor.input({
                     before: '1',
                     after: '.34',
                     delete: '2',
                     insert: ''
                  }, 'deleteBackward', replacer, format, format);
                  assert.deepEqual(result, {
                     value: '1 .34',
                     position: 1,
                     format: format
                  });
               });
               it('Test_02', function() {
                  result = InputProcessor.input({
                     before: '12',
                     after: '34',
                     delete: '.',
                     insert: ''
                  }, 'deleteBackward', replacer, format, format);
                  assert.deepEqual(result, {
                     value: '1 .34',
                     position: 1,
                     format: format
                  });
               });
            });
         });
      });
   }
);