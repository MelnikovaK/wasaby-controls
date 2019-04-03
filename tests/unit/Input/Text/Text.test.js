define(
   [
      'Core/core-instance',
      'Controls/input',
      'unit/resources/ProxyCall',
      'Vdom/Vdom'
   ],
   function(instance, inputMod, ProxyCall, Vdom) {
      'use strict';

      describe('Controls.Input.Text', function() {
         var ctrl, calls;

         beforeEach(function() {
            calls = [];
            ctrl = new inputMod.Text();
            var beforeMount = ctrl._beforeMount;

            ctrl._beforeMount = function() {
               beforeMount.apply(this, arguments);

               ctrl._children[this._fieldName] = {
                  focus: function() {},
                  setSelectionRange: function(start, end) {
                     this.selectionStart = start;
                     this.selectionEnd = end;
                  }
               };
            };
         });

         it('getDefault', function() {
            inputMod.Text.getOptionTypes();
            inputMod.Text.getDefaultOptions();
         });
         it('The model belongs to the "Controls/_input/Text/ViewModel" class.', function() {
            ctrl._beforeMount({
               value: ''
            });

            assert.isTrue(instance.instanceOfModule(ctrl._viewModel, 'Controls/_input/Text/ViewModel'));
         });
         describe('Click event', function() {
            beforeEach(function() {
               ctrl._getActiveElement = function() {
                  return {};
               };
               ctrl._beforeMount({
                  value: 'test value'
               });
               ctrl._viewModel = ProxyCall.set(ctrl._viewModel, ['selection'], calls, true);
            });
            it('The text is not selected.', function(done) {
               ctrl._options.selectOnClick = false;

               ctrl._getField().selectionStart = 5;
               ctrl._getField().selectionEnd = 5;
               ctrl._mouseDownHandler();
               ctrl._focusInHandler();
               ctrl._clickHandler();

               setTimeout(function() {
                  assert.deepEqual(calls, [{
                     name: 'selection',
                     value: {
                        start: 5,
                        end: 5
                     }
                  }]);
                  done();
               }, 100);
            });
            it('The text is selected.', function() {
               ctrl._options.selectOnClick = true;

               ctrl._getField().selectionStart = 5;
               ctrl._getField().selectionEnd = 5;
               ctrl._mouseDownHandler();
               ctrl._focusInHandler();
               ctrl._clickHandler();

               assert.deepEqual(calls, [{
                  name: 'selection',
                  value: {
                     start: 0,
                     end: 10
                  }
               }]);
            });
         });
         describe('Change event', function() {
            beforeEach(function() {
               ctrl._beforeMount({
                  value: ' test value '
               });
               ctrl._notify = ProxyCall.apply(ctrl._notify, 'notify', calls, true);
               ctrl._viewModel = ProxyCall.set(ctrl._viewModel, ['displayValue'], calls);
            });
            it('Trim option equal false. Spaces on both sides are not trimmed.', function() {
               ctrl._options.trim = false;

               ctrl._changeHandler();

               assert.deepEqual(calls, [{
                  name: 'notify',
                  arguments: ['inputCompleted', [' test value ', ' test value ']]
               }]);
            });
            it('Trim option equal true. Spaces on both sides are not trimmed.', function() {
               ctrl._options.trim = true;
               ctrl._beforeUpdate({
                  value: 'test value'
               });

               ctrl._changeHandler();

               assert.deepEqual(calls, [{
                  name: 'notify',
                  arguments: ['inputCompleted', ['test value', 'test value']]
               }]);
            });
            it('Trim option equal true. Spaces on both sides are trimmed.', function() {
               ctrl._options.trim = true;

               ctrl._changeHandler();

               assert.deepEqual(calls, [
                  {
                     name: 'displayValue',
                     value: 'test value'
                  },
                  {
                     name: 'notify',
                     arguments: ['valueChanged', ['test value', 'test value']]
                  },
                  {
                     name: 'notify',
                     arguments: ['inputCompleted', ['test value', 'test value']]
                  }
               ]);
            });
         });
         describe('User input.', function() {
            beforeEach(function() {
               ctrl._getActiveElement = function() {
                  return ctrl._getField();
               };
            });
            it('Constraint option equal [0-9]. The value of numbers only.', function() {
               ctrl._beforeMount({
                  value: '',
                  constraint: '[0-9]'
               });
               ctrl._getField().value = 'text';
               ctrl._getField().selectionStart = 4;
               ctrl._getField().selectionEnd = 4;
               ctrl._inputHandler(new Vdom.SyntheticEvent({}));

               assert.equal(ctrl._viewModel.value, '');
               assert.deepEqual(ctrl._viewModel.selection, {
                  start: 0,
                  end: 0
               });
            });
            it('Max length option equal 3. The value is not more than 3 characters.', function() {
               ctrl._beforeMount({
                  value: '',
                  maxLength: 3
               });
               ctrl._getField().value = 'text';
               ctrl._getField().selectionStart = 4;
               ctrl._getField().selectionEnd = 4;
               ctrl._inputHandler(new Vdom.SyntheticEvent({}));

               assert.equal(ctrl._viewModel.value, 'tex');
               assert.deepEqual(ctrl._viewModel.selection, {
                  start: 3,
                  end: 3
               });
            });
         });
      });
   }
);
