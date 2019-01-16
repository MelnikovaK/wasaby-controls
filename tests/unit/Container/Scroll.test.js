define(
   [
      'Controls/Container/Scroll',
      'wml!tests/Container/resources/Content'
   ],
   function(Scroll, Content) {

      'use strict';

      describe('Controls.Container.Scroll', function() {
         var scroll, result;

         beforeEach(function() {
            scroll = new Scroll({});

            var templateFn = scroll._template;

            scroll._template = function(inst) {
               inst._options = {
                  content: Content
               };
               var markup = templateFn.call(this, inst);

               markup = markup.replace(/ ?(ws-delegates-tabfocus|ws-creates-context|__config|tabindex|name)=".+?"/g, '');
               markup = markup.replace(/\s+/g, ' ');

               return markup;
            };
            scroll._stickyHeaderIds = [];
            scroll._children.stickyHeaderShadow = {
               start: sinon.fake()
            };
            scroll._children.stickyHeaderHeight = {
               start: sinon.fake()
            };
         });

         describe('Template', function() {
            it('Hiding the native scroll', function() {
               result = scroll._template({});

               assert.equal(result, '<div class="controls-Scroll ws-flexbox ws-flex-column">' +
                                       '<span class="controls-Scroll__content ws-BlockGroup controls-Scroll__content_hideNativeScrollbar controls-Scroll__content_hidden">' +
                                          '<div class="controls-Scroll__userContent">test</div>' +
                                       '</span>' +
                                       '<div></div>' +
                                    '</div>');

               result = scroll._template({
                  _contentStyles: 'margin-right: -15px;'
               });

               assert.equal(result, '<div class="controls-Scroll ws-flexbox ws-flex-column">' +
                                       '<span style="margin-right: -15px;" class="controls-Scroll__content ws-BlockGroup controls-Scroll__content_hideNativeScrollbar controls-Scroll__content_scroll">' +
                                          '<div class="controls-Scroll__userContent">test</div>' +
                                       '</span>' +
                                       '<div></div>' +
                                    '</div>');
            });
         });

         describe('StickyHeader', function() {
            var event = {
               stopPropagation: function() {}
            };

            describe('updateFixationState', function() {
               it('Header with id equal to "sticky" stops being fixed', function() {
                  scroll._fixedHandler(event, {
                     id: 'sticky',
                     shouldBeFixed: false
                  });

                  assert.isEmpty(scroll._stickyHeaderIds);
               });
               it('Header with id equal to "sticky" fixed', function() {
                  scroll._fixedHandler(event, {
                     id: 'sticky',
                     shouldBeFixed: true
                  });

                  assert.include(scroll._stickyHeaderIds, 'sticky');
               });
               it('Header with id equal to "sticky" fixed and then stop being fixed', function() {
                  scroll._fixedHandler(event, {
                     id: 'sticky',
                     shouldBeFixed: true
                  });
                  scroll._fixedHandler(event, {
                     id: 'sticky',
                     shouldBeFixed: false
                  });

                  assert.isEmpty(scroll._stickyHeaderIds);
               });
               it('Header with id equal to "sticky1" fixed, Header with id equal to "sticky2" stop being fixed', function() {
                  scroll._fixedHandler(event, {
                     id: 'sticky1',
                     shouldBeFixed: true
                  });
                  scroll._fixedHandler(event, {
                     id: 'sticky2',
                     shouldBeFixed: false
                  });

                  assert.include(scroll._stickyHeaderIds, 'sticky1');
                  assert.notInclude(scroll._stickyHeaderIds, 'sticky2');
               });
               it('Header with id equal to "sticky1" stop being fixed, Header with id equal to "sticky2" fixed', function() {
                  scroll._fixedHandler(event, {
                     id: 'sticky1',
                     shouldBeFixed: false
                  });
                  scroll._fixedHandler(event, {
                     id: 'sticky2',
                     shouldBeFixed: true
                  });

                  assert.include(scroll._stickyHeaderIds, 'sticky2');
                  assert.notInclude(scroll._stickyHeaderIds, 'sticky1');
               });
               it('Should increase headers height if stackable header is fixed', function() {
                  scroll._fixedHandler(event, {
                     id: 'sticky1',
                     shouldBeFixed: true,
                     mode: 'stackable',
                     offsetHeight: 10
                  });

                  assert.equal(scroll._stickyHeaderHeight, 10);
               });
               it('Should decrease headers height if stackable header is unfixed', function() {
                  scroll._stickyHeaderIds = ['sticky1'];
                  scroll._stickyHeaderHeight = 10;
                  scroll._fixedHandler(event, {
                     id: 'sticky1',
                     shouldBeFixed: false,
                     mode: 'stackable',
                     offsetHeight: 10
                  });
                  assert.equal(scroll._stickyHeaderHeight, 0);
               });
               it('Should not change headers height if replaceable header is fixed', function() {
                  scroll._fixedHandler(event, {
                     id: 'sticky1',
                     shouldBeFixed: true,
                     mode: 'replaceable',
                     offsetHeight: 10
                  });
                  assert.equal(scroll._stickyHeaderHeight, 0);
               });
               it('Should decrease headers height if stackable header is unfixed', function() {
                  scroll._stickyHeaderIds = ['sticky1'];
                  scroll._stickyHeaderHeight = 10;
                  scroll._fixedHandler(event, {
                     id: 'sticky1',
                     shouldBeFixed: false,
                     mode: 'replaceable',
                     offsetHeight: 10
                  });
                  assert.equal(scroll._stickyHeaderHeight, 10);
               });
            });
         });

         describe('_scrollMoveHandler', function() {
            beforeEach(function() {
               scroll._pagingState = {};
            });
            it('up', function() {
               scroll._scrollMoveHandler({}, {
                  position: 'up'
               });
               assert.equal('disabled', scroll._pagingState.stateUp, 'Wrong paging state');
               assert.equal('normal', scroll._pagingState.stateDown, 'Wrong paging state');
            });
            it('down', function() {
               scroll._scrollMoveHandler({}, {
                  position: 'down'
               });
               assert.equal('normal', scroll._pagingState.stateUp, 'Wrong paging state');
               assert.equal('disabled', scroll._pagingState.stateDown, 'Wrong paging state');
            });
            it('middle', function() {
               scroll._scrollMoveHandler({}, {
                  position: 'middle'
               });
               assert.equal('normal', scroll._pagingState.stateUp, 'Wrong paging state');
               assert.equal('normal', scroll._pagingState.stateDown, 'Wrong paging state');
            });

         });
      });

      describe('Controls.Container.Shadow', function() {
         var result;
         describe('calcShadowPosition', function() {
            it('Тень сверху', function() {
               result = Scroll._private.calcShadowPosition(100, 100, 200);
               assert.equal(result, 'top');
            });
            it('Тень снизу', function() {
               result = Scroll._private.calcShadowPosition(0, 100, 200);
               assert.equal(result, 'bottom');
            });
            it('Should hide bottom shadow if there is less than 1 pixel to the bottom.', function() {
               // Prevent rounding errors in the scale do not equal 100%
               result = Scroll._private.calcShadowPosition(99.234, 100, 200);
               assert.notInclude(result, 'bottom');
            });
            it('Тень сверху и снизу', function() {
               result = Scroll._private.calcShadowPosition(50, 100, 200);
               assert.equal(result, 'topbottom');
            });
         });
         describe('getSizes', function() {
            var container = {
               scrollHeight: 200,
               offsetHeight: 100,
               scrollTop: 0
            };

            it('getScrollHeight', function() {
               result = Scroll._private.getScrollHeight(container);
               assert.equal(result, 200);
            });
            it('getContainerHeight', function() {
               result = Scroll._private.getContainerHeight(container);
               assert.equal(result, 100);
            });
            it('getScrollTop', function() {
               result = Scroll._private.getScrollTop(container);
               assert.equal(result, 0);
            });
         });
      });
   }
);
