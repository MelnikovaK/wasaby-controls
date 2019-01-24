define(
   [
      'Controls/StickyHeader',
      'Controls/StickyHeader/Context',
      'tests/resources/TemplateUtil',
      'Controls/StickyHeader/_StickyHeader'
   ],
   function(StickyHeader, Context, TemplateUtil, _StickyHeader) {

      'use strict';

      describe('Controls.StickyHeader.Template', function() {
         var ctrl, template, inst;

         beforeEach(function() {
            inst = {
               _stickyHeadersHeight: {
                  top: 0,
                  bottom: 0
               },
               _context: {
                  stickyHeader: new Context({shadowPosition: ''})
               },
               _options: {
                  fixedZIndex: 2
               },
               _model: {}
            };
         });

         describe('StickyHeader', function() {
            beforeEach(function() {
               ctrl = new StickyHeader({});
               template = TemplateUtil.clearTemplate(ctrl._template);
            });

            it('The browser does not support sticky', function() {
               inst._isStickySupport = false;
               inst._options.content = TemplateUtil.content;

               assert.equal(template(inst), '<div><div>testing the template</div></div>');
            });

            it('The browser does support sticky', function() {
               inst._isStickySupport = true;
               inst._options.content = TemplateUtil.content;

               assert.equal(template(inst),  '<div data-component="Controls/StickyHeader/_StickyHeader" class="controls-StickyHeader" style="top: 0px;bottom: 0px;">' +
                                                '<div></div><div></div>' +
                                                '<div class="controls-StickyHeader__observationTargetTop" style="top: -3px;"></div>' +
                                                '<div class="controls-StickyHeader__content">testing the template</div>' +
                                                '<div class="controls-StickyHeader__observationTargetBottom" style="bottom: -3px;"></div>' +
                                             '</div>');
            });
         });

         describe('_StickyHeader', function() {
            beforeEach(function() {
               ctrl = new _StickyHeader({});
               inst._getStyle = ctrl._getStyle;
               inst._isShadowVisible = ctrl._isShadowVisible;
               inst._getObserverStyle = ctrl._getObserverStyle;
               inst._options.shadowVisibility = 'visible';
               template = TemplateUtil.clearTemplate(ctrl._template);
            });

            it('On the desktop platform', function() {
               inst._isMobilePlatform = false;
               inst._model.fixedPosition = 'top';

               assert.equal(template(inst),  '<div class="controls-StickyHeader" style="top: 0px;z-index: 2;">' +
                                                '<div data-component="Controls/Event/Listener"></div>' +
                                                '<div data-component="Controls/Event/Listener"></div>' +
                                                '<div class="controls-StickyHeader__observationTargetTop" style="top: -3px;"></div>' +
                                                '<div class="controls-StickyHeader__observationTargetBottom" style="bottom: -3px;"></div>' +
                                             '</div>');
            });

            it('On the mobile platform', function() {
               inst._isMobilePlatform = true;
               inst._model.fixedPosition = 'top';

               assert.equal(template(inst),  '<div class="controls-StickyHeader" style="top: -1px;padding-top: 1px;z-index: 2;">' +
                                                '<div data-component="Controls/Event/Listener"></div>' +
                                                '<div data-component="Controls/Event/Listener"></div>' +
                                                '<div class="controls-StickyHeader__observationTargetTop" style="top: -3px;"></div>' +
                                                '<div class="controls-StickyHeader__observationTargetBottom" style="bottom: -3px;"></div>' +
                                             '</div>');
            });

            it('Move the header', function() {
               inst._context.stickyHeader.top = 10;
               inst._context.stickyHeader.bottom = 0;

               assert.equal(template(inst),  '<div class="controls-StickyHeader" style="top: 10px;bottom: 0px;">' +
                                                '<div data-component="Controls/Event/Listener"></div>' +
                                                '<div data-component="Controls/Event/Listener"></div>' +
                                                '<div class="controls-StickyHeader__observationTargetTop" style="top: -3px;"></div>' +
                                                '<div class="controls-StickyHeader__observationTargetBottom" style="bottom: -3px;"></div>' +
                                             '</div>');
            });

            it('Added content', function() {
               inst._options.content = TemplateUtil.content;

               assert.equal(template(inst),  '<div class="controls-StickyHeader" style="top: 0px;bottom: 0px;">' +
                                                '<div data-component="Controls/Event/Listener"></div>' +
                                                '<div data-component="Controls/Event/Listener"></div>' +
                                                '<div class="controls-StickyHeader__observationTargetTop" style="top: -3px;"></div>' +
                                                '<div class="controls-StickyHeader__content">testing the template</div>' +
                                                '<div class="controls-StickyHeader__observationTargetBottom" style="bottom: -3px;"></div>' +
                                             '</div>');
            });

            it('The header is fixed, but there should be no shadow', function() {
               inst._context.stickyHeader.shadowPosition = 'top';
               inst._shadowVisible = true;
               inst._model.fixedPosition = 'top';
               inst._options.fixedZIndex = 1;

               assert.equal(template(inst),  '<div class="controls-StickyHeader" style="top: 0px;z-index: 1;">' +
                                                '<div data-component="Controls/Event/Listener"></div>' +
                                                '<div data-component="Controls/Event/Listener"></div>' +
                                                '<div class="controls-StickyHeader__observationTargetTop" style="top: -3px;"></div>' +
                                                '<div class="controls-StickyHeader__observationTargetBottom" style="bottom: -3px;"></div>' +
                                                '<div class="controls-Scroll__shadow controls-StickyHeader__shadow-bottom"></div>' +
                                             '</div>');
            });

            it('The header is fixed, the shadow should be', function() {
               inst._context.stickyHeader.shadowPosition = 'bottom';
               inst._shadowVisible = true;
               inst._model.fixedPosition = 'bottom';
               inst._options.fixedZIndex = 2;

               assert.equal(template(inst),  '<div class="controls-StickyHeader" style="bottom: 0px;z-index: 2;">' +
                                                '<div class="controls-Scroll__shadow controls-StickyHeader__shadow-top"></div>' +
                                                '<div data-component="Controls/Event/Listener"></div>' +
                                                '<div data-component="Controls/Event/Listener"></div>' +
                                                '<div class="controls-StickyHeader__observationTargetTop" style="top: -3px;"></div>' +
                                                '<div class="controls-StickyHeader__observationTargetBottom" style="bottom: -3px;"></div>' +
                                             '</div>');
            });
         });
      });
   }
);
