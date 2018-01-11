define(['js!Controls/Toggle/DoubleSwitch'], function (Switch) {
   'use strict';
   var SW, switcherClickedFlag;
   describe('Controls.Toggle.DoubleSwitch', function () {
      afterEach(function () {
         //SW.destroy();
         //TODO: раскомментить дестрой когда будет сделана задача https://online.sbis.ru/opendoc.html?guid=4675dcd2-309b-402a-9c78-0bb4b3b2e644
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

      describe('click to Switcher', function () {
         beforeEach(function() {
            SW = new Switch({
               captions: ['capt1','capt2']
            });
            switcherClickedFlag = false;
            SW.subscribe('valueChanged', function () {
               switcherClickedFlag = true;
            });
         });

         describe('click to toggle(function _clickToggleHandler)', function(){
            it('click', function () {
               SW._clickToggleHandler();
               assert(switcherClickedFlag);
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
         beforeEach(function() {
            SW = new Switch({
               captions: ['capt1', 'capt2']
            });
            switcherClickedFlag = false;
            SW.subscribe('valueChanged', function () {
               switcherClickedFlag = true;
            });
         });

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
   });
});