define(
   [
      'Core/constants',
      'Controls/Container/Scroll',
      'wml!tests/Container/resources/Content'
   ],
   function(Constants, Scroll, Content) {

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
            scroll._stickyHeadersIds = {
               top: [],
               bottom: []
            };
            scroll._stickyHeadersHeight = {
               top: 0,
               bottom: 0
            };
            scroll._children.stickyHeaderShadow = {
               start: sinon.fake()
            };
            scroll._children.stickyHeaderHeight = {
               start: sinon.fake()
            };
         });

         describe('_scrollbarTaken', function() {
            it('Should generate scrollbarTaken event if scrollbar displayed', function() {
               const sandbox = sinon.sandbox.create();
               scroll._displayState = { hasScroll: true };
               sandbox.stub(scroll, '_notify');
               scroll._scrollbarTaken();
               sinon.assert.calledWith(scroll._notify, 'scrollbarTaken');
               sandbox.restore();
            });
            it('Should not generate scrollbarTaken event if scrollbar not displayed', function() {
               const sandbox = sinon.sandbox.create();
               scroll._displayState = { hasScroll: false };
               sandbox.stub(scroll, '_notify');
               scroll._scrollbarTaken();
               sinon.assert.notCalled(scroll._notify);
               sandbox.restore();
            });
         });

         describe('_mouseenterHandler', function() {
            it('Should show scrollbar and generate scrollbarTaken event on mouseenter', function() {
               const sandbox = sinon.sandbox.create();
               scroll._displayState = { hasScroll: true };
               scroll._options.scrollbarVisible = true;
               sandbox.stub(scroll, '_notify');
               scroll._mouseenterHandler();
               sinon.assert.calledWith(scroll._notify, 'scrollbarTaken');
               assert.isTrue(scroll._scrollbarVisibility());
               sandbox.restore();
            });
            it('Should hide scrollbar and generate scrollbarReleased event on mouseleave', function() {
               const sandbox = sinon.sandbox.create();
               scroll._displayState = { hasScroll: false };
               sandbox.stub(scroll, '_notify');
               scroll._mouseenterHandler();
               scroll._mouseleaveHandler();
               sinon.assert.calledWith(scroll._notify, 'scrollbarReleased');
               assert.isFalse(scroll._scrollbarVisibility());
               sandbox.restore();
            });
         });

         describe('_adjustContentMarginsForBlockRender', function() {
            if (!Constants.isBrowserPlatform) {
               return;
            }

            it('should not update the context if the height has not changed', function() {
               sinon.stub(window, 'getComputedStyle').returns({ marginTop: 0, marginRight: 0 });
               scroll._styleHideScrollbar = '';
               scroll._stickyHeaderContext = {
                  top: 0,
                  updateConsumers: sinon.fake()
               };
               scroll._adjustContentMarginsForBlockRender();
               sinon.assert.notCalled(scroll._stickyHeaderContext.updateConsumers);
               sinon.restore();
            });
         });

         describe('Template', function() {
            it('Hiding the native scroll', function() {
               result = scroll._template(scroll);

               assert.equal(result, '<div class="controls-Scroll ws-flexbox ws-flex-column">' +
                                       '<span class="controls-Scroll__content ws-BlockGroup controls-Scroll__content_hideNativeScrollbar controls-Scroll__content_hidden">' +
                                          '<div class="controls-Scroll__userContent">test</div>' +
                                       '</span>' +
                                       '<div></div>' +
                                    '</div>');

               scroll._contentStyles = 'margin-right: -15px;';
               result = scroll._template(scroll);

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
                     fixedPosition: ''
                  });

                  assert.isEmpty(scroll._stickyHeadersIds.top);
                  assert.isEmpty(scroll._stickyHeadersIds.bottom);
               });
               it('Header with id equal to "sticky" fixed', function() {
                  scroll._fixedHandler(event, {
                     id: 'stickyTop',
                     fixedPosition: 'top'
                  });
                  assert.include(scroll._stickyHeadersIds.top, 'stickyTop');

                  scroll._fixedHandler(event, {
                     id: 'stickyBottom',
                     fixedPosition: 'bottom'
                  });
                  assert.include(scroll._stickyHeadersIds.bottom, 'stickyBottom');
               });
               it('Header with id equal to "sticky" fixed and then stop being fixed', function() {
                  scroll._fixedHandler(event, {
                     id: 'sticky',
                     fixedPosition: 'top'
                  });
                  scroll._fixedHandler(event, {
                     id: 'sticky',
                     fixedPosition: '',
                     prevPosition: 'top'
                  });

                  assert.isEmpty(scroll._stickyHeadersIds.top);
                  assert.isEmpty(scroll._stickyHeadersIds.bottom);
               });
               it('Header with id equal to "sticky1" fixed, Header with id equal to "sticky2" stop being fixed', function() {
                  scroll._fixedHandler(event, {
                     id: 'sticky1',
                     fixedPosition: 'top'
                  });
                  scroll._fixedHandler(event, {
                     id: 'sticky2',
                     fixedPosition: '',
                     prevPosition: 'top'
                  });

                  assert.include(scroll._stickyHeadersIds.top, 'sticky1');
                  assert.notInclude(scroll._stickyHeadersIds.top, 'sticky2');
               });
               it('Header with id equal to "sticky1" stop being fixed, Header with id equal to "sticky2" fixed', function() {
                  scroll._fixedHandler(event, {
                     id: 'sticky1',
                     fixedPosition: '',
                     prevPosition: 'top'
                  });
                  scroll._fixedHandler(event, {
                     id: 'sticky2',
                     fixedPosition: 'top'
                  });

                  assert.include(scroll._stickyHeadersIds.top, 'sticky2');
                  assert.notInclude(scroll._stickyHeadersIds.top, 'sticky1');
               });
               it('Should increase headers height if stackable header is fixed', function() {
                  scroll._fixedHandler(event, {
                     id: 'sticky1',
                     fixedPosition: 'top',
                     mode: 'stackable',
                     offsetHeight: 10
                  });

                  assert.equal(scroll._stickyHeadersHeight.top, 10);
               });
               it('Should decrease headers height if stackable header is unfixed', function() {
                  scroll._stickyHeadersIds.top = ['sticky1'];
                  scroll._stickyHeadersHeight.top = 10;
                  scroll._fixedHandler(event, {
                     id: 'sticky1',
                     fixedPosition: '',
                     prevPosition: 'top',
                     mode: 'stackable',
                     offsetHeight: 10
                  });
                  assert.equal(scroll._stickyHeadersHeight.top, 0);
               });
               it('Should not change headers height if replaceable header is fixed', function() {
                  scroll._fixedHandler(event, {
                     id: 'sticky1',
                     fixedPosition: '',
                     prevPosition: 'top',
                     mode: 'replaceable',
                     offsetHeight: 10
                  });
                  assert.equal(scroll._stickyHeadersHeight.top, 0);
               });
               it('Should decrease headers height if stackable header is unfixed', function() {
                  scroll._stickyHeadersIds.top = ['sticky1'];
                  scroll._stickyHeadersHeight.top = 10;
                  scroll._fixedHandler(event, {
                     id: 'sticky1',
                     fixedPosition: '',
                     prevPosition: 'top',
                     mode: 'replaceable',
                     offsetHeight: 10
                  });
                  assert.equal(scroll._stickyHeadersHeight.top, 10);
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
