define('Controls/Popup/Opener/Sticky/StickyController',
   [
      'Controls/Popup/Opener/BaseController',
      'Controls/Popup/Manager/ManagerController',
      'Controls/Popup/Opener/Sticky/StickyStrategy',
      'Core/core-merge',
      'Core/core-clone',
      'Core/detection',
      'Core/IoC',
      'Controls/Popup/TargetCoords',
      'wml!Controls/Popup/Opener/Sticky/StickyContent',
      'css!theme?Controls/Popup/Opener/Sticky/Sticky'
   ],
   function(BaseController, ManagerController, StickyStrategy, cMerge, cClone, cDetection, IoC, TargetCoords) {
      var DEFAULT_OPTIONS = {
         horizontalAlign: {
            side: 'right',
            offset: 0
         },
         verticalAlign: {
            side: 'bottom',
            offset: 0
         },
         corner: {
            vertical: 'top',
            horizontal: 'left'
         },

      };

      var _private = {
         prepareOriginPoint: function(config) {
            var newCfg = cClone(config);

            if (config.alignment || config.offset) {
               newCfg.horizontalAlign = {
                  side: (config.alignment && config.alignment.horizontal) || 'right',
                  offset: (config.offset && config.offset.horizontal) || 0
               };
               newCfg.verticalAlign = {
                  side: (config.alignment && config.alignment.vertical) || 'bottom',
                  offset: (config.offset && config.offset.vertical) || 0
               };
            }
            if (config.originPoint) {
               newCfg.corner = {
                  vertical: (config.originPoint && config.originPoint.vertical) || 'top',
                  horizontal: (config.originPoint && config.originPoint.horizontal) || 'left'
               };
            }
            return newCfg;
         },
         prepareActionOnScroll: function(config) {
            var newCfg = cClone(config);
            if (config.actionOnScroll === 'close') {
               newCfg.closeOnTargetScroll = true;
            } else if (config.actionOnScroll === 'track') {
               newCfg.targetTracking = true;
            }
            return newCfg;
         },
         prepareConfig: function(cfg, sizes) {
            cfg.popupOptions = _private.prepareOriginPoint(cfg.popupOptions);
            cfg.popupOptions = _private.prepareActionOnScroll(cfg.popupOptions);
            var popupCfg = {
               corner: cMerge(cClone(DEFAULT_OPTIONS.corner), cfg.popupOptions.corner || {}),
               align: {
                  horizontal: cMerge(cClone(DEFAULT_OPTIONS.horizontalAlign), cfg.popupOptions.horizontalAlign || {}),
                  vertical: cMerge(cClone(DEFAULT_OPTIONS.verticalAlign), cfg.popupOptions.verticalAlign || {})
               },
               config: {
                  maxWidth: cfg.popupOptions.maxWidth,
                  maxHeight: cfg.popupOptions.maxHeight
               },
               sizes: sizes,
               revertPositionStyle: cfg.popupOptions.revertPositionStyle, // https://online.sbis.ru/opendoc.html?guid=9a71628a-26ae-4527-a52b-2ebf146b4ecd
               locationStrategy: cfg.popupOptions.locationStrategy
            };
            if (cfg.popupOptions.corner) {
               IoC.resolve('ILogger').warn('Sticky', 'Используется устаревшая опция corner, используйте опцию originPoint');
            }
            if (cfg.popupOptions.closeOnTargetScroll || cfg.popupOptions.targetTracking) {
               IoC.resolve('ILogger').warn('Sticky', 'Используются устаревшие опции closeOnTargetScroll, targetTracking, используйте опцию actionOnScroll');
            }
            if (cfg.popupOptions.verticalAlign || cfg.popupOptions.horisontalAlign) {
               IoC.resolve('ILogger').warn('Sticky', 'Используются устаревшие опции verticalAlign и horizontalAlign, используйте опции offset и side');
            }
            cfg.position = StickyStrategy.getPosition(popupCfg, _private._getTargetCoords(cfg, sizes));

            cfg.popupOptions.stickyPosition = this.prepareStickyPosition(popupCfg);

            cfg.positionConfig = popupCfg;
            _private.updateClasses(cfg, popupCfg);
         },

         updateClasses: function(cfg, popupCfg) {
            // Remove the previous classes of direction and add new ones
            _private.removeOrientationClasses(cfg);
            cfg.popupOptions.className = (cfg.popupOptions.className || '') + ' ' + _private.getOrientationClasses(popupCfg);
         },

         getOrientationClasses: function(cfg) {
            var className = 'controls-Popup-corner-vertical-' + cfg.corner.vertical;
            className += ' controls-Popup-corner-horizontal-' + cfg.corner.horizontal;
            className += ' controls-Popup-align-horizontal-' + cfg.align.horizontal.side;
            className += ' controls-Popup-align-vertical-' + cfg.align.vertical.side;
            className += ' controls-Sticky__reset-margins';
            return className;
         },

         removeOrientationClasses: function(cfg) {
            if (cfg.popupOptions.className) {
               cfg.popupOptions.className = cfg.popupOptions.className.replace(/controls-Popup-corner\S*|controls-Popup-align\S*|controls-Sticky__reset-margins/g, '').trim();
            }
         },

         _getTargetCoords: function(cfg, sizes) {
            if (cfg.popupOptions.nativeEvent) {
               var top = cfg.popupOptions.nativeEvent.clientY;
               var left = cfg.popupOptions.nativeEvent.clientX;
               var positionCfg = {
                  verticalAlign: {
                     side: 'bottom'
                  },
                  horizontalAlign: {
                     side: 'right'
                  }
               };
               cMerge(cfg.popupOptions, positionCfg);
               sizes.margins = { top: 0, left: 0 };
               return {
                  width: 1,
                  height: 1,
                  top: top,
                  left: left,
                  bottom: document.body.clientHeight - top,
                  right: document.body.clientWidth - left,
                  topScroll: 0,
                  leftScroll: 0
               };
            }

            if (!document) {
               return {
                  width: 0,
                  height: 0,
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                  topScroll: 0,
                  leftScroll: 0
               };
            }

            return TargetCoords.get(cfg.popupOptions.target ? cfg.popupOptions.target : document.body);
         },

         isTargetVisible: function(item) {
            var targetCoords = _private._getTargetCoords(item, {});
            return !!targetCoords.width;
         },

         prepareStickyPosition: function(cfg) {
            return {
               horizontalAlign: cfg.align.horizontal,
               verticalAlign: cfg.align.vertical,
               corner: cfg.corner
            };
         },

         getWindowWidth: function() {
            return window.innerWidth;
         },
         setStickyContent: function(item) {
            item.popupOptions.content = 'wml!Controls/Popup/Opener/Sticky/StickyContent';
         }
      };

      /**
       * Sticky Popup Controller
       * @class Controls/Popup/Opener/Sticky/StickyController
       * @control
       * @private
       * @category Popup
       */
      var StickyController = BaseController.extend({

         elementCreated: function(item, container) {
            _private.setStickyContent(item);
            item.position.position = undefined;
            this.prepareConfig(item, container);
         },

         elementUpdated: function(item, container) {
            _private.setStickyContent(item);
            item.popupOptions.stickyPosition = _private.prepareStickyPosition(item.positionConfig);
            if (_private.isTargetVisible(item)) {
               _private.updateClasses(item, item.positionConfig);
               item.position = StickyStrategy.getPosition(item.positionConfig, _private._getTargetCoords(item, item.positionConfig.sizes));

               // In landscape orientation, the height of the screen is low when the keyboard is opened.
               // Open Windows are not placed in the workspace and chrome scrollit body.
               if (cDetection.isMobileAndroid) {
                  var height = item.position.height || container.clientHeight;
                  if (height > document.body.clientHeight) {
                     item.position.height = document.body.clientHeight;
                     item.position.top = 0;
                  } else if (item.position.height + item.position.top > document.body.clientHeight) {
                     // opening the keyboard reduces the height of the body. If popup was positioned at the bottom of
                     // the window, he did not have time to change his top coordinate => a scroll appeared on the body
                     var dif = item.position.height + item.position.top - document.body.clientHeight;
                     item.position.top -= dif;
                  }
               }
            } else {
               ManagerController.remove(item.id);
            }
         },

         elementAfterUpdated: function(item, container) {
            /* start: We remove the set values that affect the size and positioning to get the real size of the content */
            var width = container.style.width;
            var height = container.style.height;
            container.style.width = 'auto';
            container.style.height = 'auto';

            /* end: We remove the set values that affect the size and positioning to get the real size of the content */

            this.prepareConfig(item, container);

            /* start: Return all values to the node. Need for vdom synchronizer */
            container.style.width = width;
            container.style.height = height;

            /* end: Return all values to the node. Need for vdom synchronizer */
            return true;
         },

         getDefaultConfig: function(item) {
            _private.setStickyContent(item);
            item.position = {
               top: -10000,
               left: -10000,
               maxWidth: _private.getWindowWidth(),

               // Error on ios when position: absolute container is created outside the screen and stretches the page
               // which leads to incorrect positioning due to incorrect coordinates. + on page scroll event firing
               // Treated position:fixed when positioning pop-up outside the screen
               position: 'fixed'
            };
         },

         prepareConfig: function(item, container) {
            _private.removeOrientationClasses(item);
            var sizes = this._getPopupSizes(item, container);
            _private.prepareConfig(item, sizes);
         },

         needRecalcOnKeyboardShow: function() {
            return true;
         },
         _private: _private
      });

      return new StickyController();
   });
