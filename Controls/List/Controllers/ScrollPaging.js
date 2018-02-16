/**
 * Created by kraynovdo on 13.11.2017.
 */
define('Controls/List/Controllers/ScrollPaging',
   [
      'Core/core-simpleExtend'
   ],
   function(cExtend) {
      /**
       *
       * @author Крайнов Дмитрий
       * @public
       */

      var Paging = cExtend.extend({
         _curState: null,

         constructor: function(cfg) {
            this._options = cfg;
            Paging.superclass.constructor.apply(this, arguments);

            this.handleScrollTop();
         },


         handleScroll: function() {
            if (!(this._curState === 'middle')) {
               this._options.pagingCfgTrigger({
                  stateBegin: 'normal',
                  statePrev: 'normal',
                  stateNext: 'normal',
                  stateEnd: 'normal'
               });
               this._curState = 'middle';
            }
         },

         handleScrollTop: function() {
            if (!(this._curState === 'top')) {
               this._options.pagingCfgTrigger({
                  stateBegin: 'disabled',
                  statePrev: 'disabled',
                  stateNext: 'normal',
                  stateEnd: 'normal'
               });
               this._curState = 'top';
            }
         },

         handleScrollBottom: function() {
            if (!(this._curState === 'bottom')) {
               this._options.pagingCfgTrigger({
                  stateBegin: 'normal',
                  statePrev: 'normal',
                  stateNext: 'disabled',
                  stateEnd: 'disabled'
               });
               this._curState = 'bottom';
            }

         },

         handleScrollEdge: function(direction) {
            switch(direction) {
               case 'up': this.handleScrollTop(); break;
               case 'down': this.handleScrollBottom(); break;
            }
         },

         scrollView: function(btn) {
            switch (btn) {
               case 'Begin': this._options.scrollContainer.scrollTop = 0; break;
               case 'End': this._options.scrollContainer.scrollTop = this._viewHeight - this._viewportHeight; break;
            }
         },


         destroy: function() {
            this.stopObserve();
            Paging.superclass.destroy.apply(this, arguments);
            this._options = {};
         }

      });

      return Paging;
   });
