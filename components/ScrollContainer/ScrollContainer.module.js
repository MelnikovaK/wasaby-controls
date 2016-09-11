define('js!SBIS3.CONTROLS.ScrollContainer',
   [
      'js!SBIS3.CORE.CompoundControl',
      'html!SBIS3.CONTROLS.ScrollContainer',
      'is!browser?js!SBIS3.CONTROLS.ScrollContainer/resources/custom-scrollbar-plugin/jquery.mCustomScrollbar',
      'is!browser?css!SBIS3.CONTROLS.ScrollContainer/resources/custom-scrollbar-plugin/jquery.mCustomScrollbar.min',
      'is!browser?js!SBIS3.CONTROLS.ScrollContainer/resources/custom-scrollbar-plugin/jquery.mousewheel-3.0.6'
   ],
   function(CompoundControl, dotTplFn) {

      'use strict';

      var Scroll = CompoundControl.extend({

         _dotTplFn: dotTplFn,

         $protected: {
            _options: {
               content: ''
            },

            _scroll: null,

            _hasScroll: false
         },

         $constructor: function() {
            this._publish('onScroll');
         },

         init: function() {
            Scroll.superclass.init.call(this);

            this._container.bind('mousemove touchstart', this._create.bind(this));
         },

         _create: function() {
            var self = this;

            this.getContainer().mCustomScrollbar({
               theme: 'minimal-dark',
               scrollInertia: 0,
               updateOnContentResize: false,
               callbacks: {
                  onInit: function(){
                     self._scroll = this;
                  },
                  onOverflowY: function(){
                     self._hasScroll = true;
                  },
                  onOverflowYNone: function(){
                     self._hasScroll = false;
                  },
                  onTotalScrollOffset: 30,
                  onTotalScrollBackOffset: 30,
                  onTotalScroll: function(){
                     self._notify('onScroll', 'bottom', self.getScrollTop());
                  },
                  onTotalScrollBack: function(){
                     self._notify('onScroll', 'top', self.getScrollTop());
                  }
               }
            });

            this._container.unbind('mousemove touchstart');
         },

         isScrollOnTop: function() {
            return this.hasScroll() && this._scroll.mcs.topPct === 0;
         },

         isScrollOnBottom: function() {
            var
               container = this.getContainer(),
               scroll_cotainer = container.find('.mCSB_draggerContainer'),
               scroll = container.find('#mCSB_1_dragger_vertical');
            return this.hasScroll() && scroll_cotainer.height() === (scroll.height() + this.getScrollTop());
         },

         scrollTo: function(option) {
            this.getContainer().mCustomScrollbar('scrollTo', option, {scrollInertia: 0});
         },

         hasScroll: function() {
            this.updateScroll();
            return this._hasScroll;
         },

         getScrollTop: function() {
            if (this._scroll){
               return this._scroll.mcs.draggerTop;
            }
         },

         updateScroll: function() {
            this.getContainer().mCustomScrollbar('update');
         },

         destroy: function() {
            this.getContainer().mCustomScrollbar('destroy');
            this._scroll = undefined;
            this.superclass.destroy.call(this);
         }
      });

      return Scroll;
   });