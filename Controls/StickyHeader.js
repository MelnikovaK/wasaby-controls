define('Controls/StickyHeader',
   [
      'Core/Control',
      'Core/detection',
      'Controls/StickyHeader/Model',
      'Controls/StickyHeader/Context',
      'Controls/Utils/IntersectionObserver',
      'wml!Controls/StickyHeader/StickyHeader',

      'css!Controls/StickyHeader/StickyHeader'
   ],
   function(Control, detection, Model, Context, IntersectionObserver, template) {

      'use strict';

      /**
       * Ensures that content sticks to the top of the parent container when scrolling down.
       * Occurs at the moment of intersection of the upper part of the content and the parent container.
       *
       * @public
       * @extends Core/Control
       * @class Controls/StickyHeader
       */

      /**
       * @name Controls/StickyHeader#content
       * @cfg {Function} Sticky header content.
       */

      /**
       * @event Controls/StickyHeader#fixed Change the fixation state.
       * @param {Core/vdom/Synchronizer/resources/SyntheticEvent} event Event descriptor.
       * @param {Controls/StickyHeader/Types/InformationFixationEvent.typedef} information Information about the fixation event.
       */

      var StickyHeader = Control.extend({

         /**
          * @type {Function} Component display template.
          * @private
          */
         _template: template,

         /**
          * @type {IntersectionObserver}
          * @private
          */
         _observer: null,

         /**
          * type {Boolean} Determines whether the component is built on the Android mobile platform.
          * @private
          */
         _isMobilePlatform: detection.isMobilePlatform,

         constructor: function() {
            StickyHeader.superclass.constructor.call(this);
            this._observeHandler = this._observeHandler.bind(this);
         },

         _afterMount: function() {
            var children = this._children;

            this._index = StickyHeader._index++;
            this._observer = new IntersectionObserver(this._observeHandler);
            this._model = new Model({
               topTarget: children.observationTargetTop,
               bottomTarget: children.observationTargetBottom
            });

            this._observer.observe(children.observationTargetTop);
            this._observer.observe(children.observationTargetBottom);
         },

         _beforeUnmount: function() {
            this._model.destroy();
            this._observer.disconnect();

            this._observeHandler = undefined;
         },

         /**
          * Handles changes to the visibility of the target object of observation at the intersection of the root container.
          * @param {IntersectionObserverEntry[]} entries The intersections between the target element and its root container at a specific moment of transition.
          * @private
          */
         _observeHandler: function(entries) {
            var shouldBeFixed = this._model.shouldBeFixed;

            this._model.update(entries);

            if (this._model.shouldBeFixed !== shouldBeFixed) {
               this._fixationStateChangeHandler();
            }
         },

         /**
          * To inform descendants about the fixing status. To update the state of the instance.
          * @private
          */
         _fixationStateChangeHandler: function() {
            var information = {
               id: this._index,
               shouldBeFixed: this._model.shouldBeFixed
            };

            this._forceUpdate();
            this._notify('fixed', [information], {bubbling: true});
         },

         _getStyle: function() {
            var top = this._context.stickyHeader.position;

            /**
             * On android and ios there is a gap between child elements.
             * When the header is fixed, there is a space between the container, relative to which it is fixed,
             * and the header, through which you can see the scrolled content.
             * https://jsfiddle.net/tz52xr3k/3/
             *
             * As a solution, move the header up and increase its size by an offset, using padding.
             * In this way, the content of the header does not change visually, and the free space disappears.
             *
             * Shift by 2 pixels. This value is sufficient to solve the problem.
             */
            var offset = this._isMobilePlatform ? 2 : 0;

            var style = 'top: ' + (top - offset) + 'px;';

            if (offset) {
               style += ' padding-top: ' + offset + 'px;';
            }

            return style;
         }
      });

      StickyHeader._index = 1;

      StickyHeader.contextTypes = function() {
         return {
            stickyHeader: Context
         };
      };

      return StickyHeader;
   }
);
