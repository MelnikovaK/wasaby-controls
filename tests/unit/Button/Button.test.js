define(['Controls/Button'], function (Button) {
   'use strict';

   var btn;

   describe('Controls.Button', function () {
      describe('private cssStyleGeneration', function () {
         beforeEach(function () {
            btn = new Button({
               style: 'buttonDefault'
            });
         });

         afterEach(function () {
            btn.destroy();
         });

         it('style linkMain',function () {
            var opt = {
               style: 'linkMain',
               size: 'xl'
            };
            Button._private.cssStyleGeneration(btn, opt);
            assert(btn._style === 'secondary' && btn._viewMode === 'link');
         });

         it('style linkMain2',function () {
            var opt = {
               style: 'linkMain2',
               size: 'l'
            };
            Button._private.cssStyleGeneration(btn, opt);
            assert(btn._style === 'info' && btn._viewMode === 'link');
         });

         it('style linkMain3',function () {
            var opt = {
               style: 'linkMain3',
               size: 'default'
            };
            Button._private.cssStyleGeneration(btn, opt);
            assert(btn._style === 'info' && btn._viewMode === 'link');
         });

         it('style linkAdditional',function () {
            var opt = {
               style: 'linkAdditional',
               size: 's'
            };
            Button._private.cssStyleGeneration(btn, opt);
            assert(btn._style === 'info' && btn._viewMode === 'link');
         });

         it('style linkAdditional2',function () {
            var opt = {
               style: 'linkAdditional2',
               size: 'xl'
            };
            Button._private.cssStyleGeneration(btn, opt);
            assert(btn._style === 'default' && btn._viewMode === 'link');
         });

         it('style linkAdditional3',function () {
            var opt = {
               style: 'linkAdditional3',
               size: 'xl'
            };
            Button._private.cssStyleGeneration(btn, opt);
            assert(btn._style === 'danger' && btn._viewMode === 'link');
         });

         it('style linkAdditional4',function () {
            var opt = {
               style: 'linkAdditional4',
               size: 'xl'
            };
            Button._private.cssStyleGeneration(btn, opt);
            assert(btn._style === 'success' && btn._viewMode === 'link');
         });

         it('style linkAdditional5',function () {
            var opt = {
               style: 'linkAdditional5',
               size: 'xl'
            };
            Button._private.cssStyleGeneration(btn, opt);
            assert(btn._style === 'magic' && btn._viewMode === 'link');
         });

         it('style buttonPrimary',function () {
            var opt = {
               style: 'buttonPrimary',
               size: 'default'
            };
            Button._private.cssStyleGeneration(btn, opt);
            assert(btn._style === 'primary' && btn._viewMode === 'button');
         });

         it('style buttonDefault',function () {
            var opt = {
               style: 'buttonDefault',
               size: 'big'
            };
            Button._private.cssStyleGeneration(btn, opt);
            assert(btn._style === 'secondary' && btn._viewMode === 'button');
         });

         it('style buttonAdd',function () {
            var opt = {
               style: 'buttonAdd',
               size: 'default'
            };
            Button._private.cssStyleGeneration(btn, opt);
            assert(btn._style === 'primary' && btn._viewMode === 'button');
         });
      });
      describe('constructor() and _beforeUpdate()', function() {
         var optionsCorrect = false;
         function redefinitionCssStyleGeneration() {
            var original = Button._private.cssStyleGeneration;
            Button._private.cssStyleGeneration = function(self, options) {
               if (options.style === 'test' && options.size === 'size') {
                  optionsCorrect = true;
               }
            };
            Button._private.cssStyleGeneration.original = original;
         }

         it('constructor', function() {
            redefinitionCssStyleGeneration();
            var opt = {
               style: 'test',
               size: 'size'
            };
            Button.prototype._beforeMount(opt);
            assert(optionsCorrect);
         });

         it('_beforeUpdate', function() {
            redefinitionCssStyleGeneration();
            var opt = {
               style: 'test',
               size: 'size'
            };
            Button.prototype._beforeUpdate(opt);
            assert(optionsCorrect);
         });

         afterEach(function () {
            Button._private.cssStyleGeneration = Button._private.cssStyleGeneration.original;
         });
      });
      describe('click', function () {
         var customEvent = {}, eventBublle = true;

         function initButton() {
            customEvent.stopPropagation = function () {
               eventBublle = false;
            };
            btn = new Button({
               style: 'buttonDefault'
            });
         }
         
         it('click to enabled button', function () {
            initButton();
            var opt = {
               readOnly: false
            };
            btn.saveOptions(opt);
            btn._clickHandler(customEvent);
            assert(eventBublle);
         });

         it('click to disabled button', function () {
            initButton();
            var opt = {
               readOnly: true
            };
            btn.saveOptions(opt);
            btn._clickHandler(customEvent);
            assert(!eventBublle);
         });
      });
   });
});
