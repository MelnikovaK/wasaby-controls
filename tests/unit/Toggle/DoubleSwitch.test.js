define(['Controls/Toggle/DoubleSwitch'], function (Switch) {
   'use strict';
   var SW, switcherClickedFlag;
   describe('Controls.Toggle.DoubleSwitch', function () {
      afterEach(function () {
         if (SW) {
            SW.destroy();
         }
         SW = undefined;
         switcherClickedFlag = undefined;
      });
      describe('update captions (function _beforeUpdate)',function () {
         beforeEach(function(){
            SW = new Switch({
               captions: ['capt1', 'capt2']
            });
         });

         it('with one captions', function () {
            var temp = {
               captions: ['newcapt1']
            };
            try {
               SW._beforeUpdate(temp);
               assert(false);
            }
            catch(e) {
               assert(e.message === 'You must set 2 captions.');
            }
         });

         it('with two captions', function () {
            var temp = {
               captions: ['newcapt1','newcapt2']
            };
            SW._beforeUpdate(temp);
            assert(true);
         });

         it('with three captions', function () {
            var temp = {
               captions: ['capt1','capt2','capt3']
            };
            try {
               SW._beforeUpdate(temp);
               assert(false);
            }
            catch(e) {
               assert(e.message === 'You must set 2 captions.');
            }
         });
      });

      describe('checked captions in constructor', function () {

         it('without captions', function () {
            try {
               SW = new Switch({
                  captions: []
               });
            }
            catch(e) {
               assert(e.message === 'You must set 2 captions.');
            }
         });

         it('with one caption', function () {
            try {
               SW = new Switch({
                  captions: ['capt1']
               });
            }
            catch(e) {
               assert(e.message === 'You must set 2 captions.');
            }
         });

         it('with two captions', function () {
            SW = new Switch({
               captions: ['capt1', 'capt2']
            });
            assert(true);
         });

         it('with three captions', function () {
            try {
               SW = new Switch({
                  captions: ['capt1', 'capt2','capt3']
               });
            }
            catch(e) {
               assert(e.message === 'You must set 2 captions.');
            }
         });
      });

      describe('click', function () {
         beforeEach(function() {
            SW = new Switch({
               captions: ['capt1','capt2']
            });
            switcherClickedFlag = false;
            //subscribe на vdom компонентах не работает, поэтому мы тут переопределяем _notify
            //(дефолтный метод для vdom компонент который стреляет событием).
            //он будет вызван вместо того что стрельнет событием, тем самым мы проверяем что отправили
            //событие и оно полетит с корректными параметрами.
            SW._notify = function(event){
               if(event==='valueChanged'){
                  switcherClickedFlag = true;
               }
            };
         });
         describe('click to Switcher', function () {
            describe('click to toggle(function _clickToggleHandler)', function(){
               it('click', function () {
                  SW._clickToggleHandler();
                  assert.isTrue(switcherClickedFlag, 'click unsuccess');
                  assert.isTrue(SW._toggleHoverState === '', 'toggle hover class is incorrect')
               });
            });

            describe('click to captions(function _clickTextHandler)', function(){
               it ('click to double Switcher "On" caption and "On" value', function(){
                  var opt = {
                     captions: ['capt1', 'capt2'],
                     value: true
                  };
                  SW.saveOptions(opt);
                  SW._clickTextHandler(null, true);
                  assert(switcherClickedFlag === false);
               });

               it ('click to double Switcher "On" caption and "Off" value', function(){
                  var opt = {
                     captions: ['capt1', 'capt2'],
                     value: false
                  };
                  SW.saveOptions(opt);
                  SW._clickTextHandler(null, true);
                  assert(switcherClickedFlag);
               });

               it ('click to double Switcher "Off" caption and "On" value', function(){
                  var opt = {
                     captions: ['capt1', 'capt2'],
                     value: true
                  };
                  SW.saveOptions(opt);
                  SW._clickTextHandler(null, false);
                  assert(switcherClickedFlag);
               });

               it ('click to double Switcher "Off" caption and "Off" value', function(){
                  var opt = {
                     captions: ['capt1', 'capt2'],
                     value: false
                  };
                  SW.saveOptions(opt);
                  SW._clickTextHandler(null, false);
                  assert(switcherClickedFlag === false);
               });
            });
         });
         describe('private function', function(){
            describe('checkCaptions', function(){
               it('checked with 3 captions', function () {
                  var opt = {
                     captions: ['capt1', 'capt2', 'capt3']
                  };
                  SW.saveOptions(opt);
                  try {
                     Switch._private.checkCaptions(SW._options.captions);
                     assert(false);
                  }
                  catch(e) {
                     assert(e.message === 'You must set 2 captions.');
                  }
               });

               it('checked with 0 captions', function () {
                  var opt = {
                     captions: []
                  };
                  SW.saveOptions(opt);
                  try {
                     Switch._private.checkCaptions(SW._options.captions);
                     assert(false);
                  }
                  catch(e) {
                     assert(e.message === 'You must set 2 captions.');
                  }
               });

               it('checked with 1 captions', function () {
                  var opt = {
                     captions: ['capt1']
                  };
                  SW.saveOptions(opt);
                  try {
                     Switch._private.checkCaptions(SW._options.captions);
                     assert(false);
                  }
                  catch(e) {
                     assert(e.message === 'You must set 2 captions.');
                  }
               });

               it('checked with 2 captions', function () {
                  var opt = {
                     captions: ['capt1', 'capt2']
                  };
                  SW.saveOptions(opt);
                  Switch._private.checkCaptions(SW._options.captions);
                  assert(true);
               });
            });
         });
         describe('state hover of toggle',function () {
            beforeEach(function(){
               SW = new Switch({
                  captions: ['capt1', 'capt2']
               });
            });

            it('_activateOnTextToggleHover with selected caption', function () {
              var    nextValue= false,
                     value= false;
               SW._activateToggleHover(null, nextValue, value);
               assert.isTrue(SW._toggleHoverState === '', 'mouseover to unselect caption leads to toggle with hover state')
            });

            it('_activateOnTextToggleHover with unselected caption', function () {
               var    nextValue= true,
                      value= false;
               SW._activateToggleHover(null, nextValue, value);
               assert.isTrue(SW._toggleHoverState === 'controls-DoubleSwitcher__toggle_hover', 'mouseover to selected caption leads to toggle without hover state')
            });

            it('_deactivateToggleHover', function () {
               SW._deactivateToggleHover();
               assert.isTrue(SW._toggleHoverState === '', 'mouseout leads to toggle with hover state')
            });
         });
      });
   });
});