define(
   [
      'Controls/Container/Scroll/ScrollWidthUtil',
      'Controls/Container/Scroll/ScrollHeightFixUtil'
   ],
   function(ScrollWidthUtil, ScrollHeightFixUtil) {

      'use strict';

      describe('Controls.Container.Scroll.Utils', function() {
         var
            constWidthScrollbar = 20,
            detection, result;

         ScrollWidthUtil._private.calcScrollbarWidthByMeasuredBlock = function() {
            return constWidthScrollbar;
         };

         it('calcChildHeight', function() {
            var container = {
               children: [
                  {
                     offsetHeight: 10
                  },
                  {
                     offsetHeight: 20
                  },
                  {
                     offsetHeight: 30
                  },
                  {
                     offsetHeight: 40
                  },
                  {
                     offsetHeight: 50
                  }
               ]
            };
            result = ScrollHeightFixUtil._private.calcChildrenHeight(container);
            assert.equal(result, 150);
         });
         describe('calcOverflow', function() {
            var container, calcOverflow;
            it('chrome', function() {
               detection = {
                  chrome: true
               };
               calcOverflow = ScrollHeightFixUtil._private.calcHeightFixFn(detection);

               result = calcOverflow();
               assert.equal(result, false);
            });
            it('ie', function() {
               detection = {
                  isIE: true
               };
               calcOverflow = ScrollHeightFixUtil._private.calcHeightFixFn(detection);

               container = {
                  scrollHeight: 101,
                  offsetHeight: 100
               };
               result = calcOverflow(container);
               if (window) {
                  assert.equal(result, true);
               } else {
                  assert.equal(result, undefined);
               }

               container = {
                  scrollHeight: 200,
                  offsetHeight: 100
               };
               result = calcOverflow(container);
               if (window) {
                  assert.equal(result, false);
               } else {
                  assert.equal(result, undefined);
               }
            });
            it('firefox', function() {
               detection = {
                  firefox: true
               };
               calcOverflow = ScrollHeightFixUtil._private.calcHeightFixFn(detection);

               container = {
                  offsetHeight: 10,
                  scrollHeight: 10
               };
               result = calcOverflow(container);
               if (window) {
                  assert.equal(result, true);
               } else {
                  assert.equal(result, undefined);
               }

               container = {
                  offsetHeight: 40,
                  scrollHeight: 40
               };
               result = calcOverflow(container);
               if (window) {
                  assert.equal(result, false);
               } else {
                  assert.equal(result, undefined);
               }
            });
         });

         describe('calcScrollbarWidth', function() {
            it('webKit', function() {
               detection = {
                  webkit: true
               };

               result = ScrollWidthUtil._private.calcScrollbarWidth(detection);
               assert.equal(result, 0);
            });
            it('ie12', function() {
               detection = {
                  isIE12: true,
                  userAgent: ''
               };

               result = ScrollWidthUtil._private.calcScrollbarWidth(detection);
               assert.equal(result, 16);
            });
            it('ie11', function() {
               detection = {
                  isIE11: true,
                  userAgent: ''
               };

               result = ScrollWidthUtil._private.calcScrollbarWidth(detection);
               assert.equal(result, 17);
            });
            it('ie10', function() {
               detection = {
                  isIE10: true,
                  userAgent: ''
               };

               result = ScrollWidthUtil._private.calcScrollbarWidth(detection);
               assert.equal(result, 17);
            });
            it('firefox', function() {
               detection = {
                  firefox: true,
                  userAgent: ''
               };

               result = ScrollWidthUtil._private.calcScrollbarWidth(detection);
               if (window) {
                  assert.equal(result, 20);
               } else {
                  assert.equal(result, undefined);
               }
            });
         });

         describe('calcStyleHideScrollbar', function() {
            result = ScrollWidthUtil._private.calcStyleHideScrollbar(0, {}, {});
            assert.equal(result, '');

            result = ScrollWidthUtil._private.calcStyleHideScrollbar(17, {}, {});
            assert.equal(result, 'margin-right: -17px;');

            result = ScrollWidthUtil._private.calcStyleHideScrollbar(17, {
               isIE: true
            }, {
               touch: true
            });
            assert.equal(result, 'margin-right: -17px;padding-right: 17px;');
         });
      });
   }
);