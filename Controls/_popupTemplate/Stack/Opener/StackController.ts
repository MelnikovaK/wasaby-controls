import BaseController = require('Controls/_popupTemplate/BaseController');
import StackStrategy = require('Controls/_popupTemplate/Stack/Opener/StackStrategy');
import collection = require('Types/collection');
import TargetCoords = require('Controls/_popupTemplate/TargetCoords');
import Deferred = require('Core/Deferred');
import {parse as parserLib} from 'Core/library';
import StackContent = require('wml!Controls/_popupTemplate/Stack/Opener/StackContent');
import 'css!theme?Controls/popupTemplate';

      var STACK_CLASS = 'controls-Stack';
      var _private = {

         prepareSizes: function(item, container) {
            let width;
            let maxWidth;
            let minWidth;
            let templateContainer;

            if (container) {
               /* start: We remove the set values that affect the size and positioning to get the real size of the content */
               templateContainer = _private.getStackContentWrapperContainer(container);
               width = templateContainer.style.width;
               maxWidth = templateContainer.style.maxWidth;
               minWidth = templateContainer.style.minWidth;
               // We won't remove width and height, if they are set explicitly.
               if(!item.popupOptions.width) {
                  templateContainer.style.width = 'auto';
               }
               if(!item.popupOptions.maxWidth) {
                  templateContainer.style.maxWidth = 'auto';
               }
               if(!item.popupOptions.minWidth) {
                  templateContainer.style.minWidth = 'auto';
               }
               /* end: We remove the set values that affect the size and positioning to get the real size of the content */
            }
            let templateStyle = container ? getComputedStyle(container.children[0]) : {};
            let defaultOptions = _private.getDefaultOptions(item);

            item.popupOptions.minWidth = parseInt(item.popupOptions.minWidth || defaultOptions.minWidth || templateStyle.minWidth, 10);
            item.popupOptions.maxWidth = parseInt(item.popupOptions.maxWidth || defaultOptions.maxWidth || templateStyle.maxWidth, 10);
            item.popupOptions.width = parseInt(item.popupOptions.width || defaultOptions.width, 10);

            // Validate the configuration
            if (item.popupOptions.maxWidth < item.popupOptions.minWidth) {
               item.popupOptions.maxWidth = item.popupOptions.minWidth;
            }

            if (!item.popupOptions.hasOwnProperty('minimizedWidth')) {
               item.popupOptions.minimizedWidth = defaultOptions.minimizedWidth;
            }

            // optimization: don't calculate the size of the container, if the configuration is set
            if (container && !item.popupOptions.width) {
               item.containerWidth = _private.getContainerWidth(item, container);
            }

            if (container) {
               /* start: Return all values to the node. Need for vdom synchronizer */
               templateContainer.style.width = width;
               templateContainer.style.maxWidth = maxWidth;
               templateContainer.style.minWidth = minWidth;
               /* end: Return all values to the node. Need for vdom synchronizer */
            }
         },

         prepareSizeWithoutDOM(item) {
            return _private.prepareSizes(item);
         },

         getContainerWidth: function(item, container) {
            // The width can be set when the panel is displayed. To calculate the width of the content, remove this value.
            var currentContainerWidth = container.style.width;
            container.style.width = 'auto';

            var templateWidth = container.querySelector('.controls-Stack__content').offsetWidth;
            container.style.width = currentContainerWidth;
            return templateWidth;
         },

         getStackContentWrapperContainer(stackContainer) {
            return stackContainer.querySelector('.controls-Stack__content-wrapper');
         },

         getStackParentCoords: function() {
            var elements = document.getElementsByClassName('controls-Popup__stack-target-container');
            var targetCoords = TargetCoords.get(elements && elements.length ? elements[0] : document.body);

            return {
               top: Math.max(targetCoords.top, 0),
               right: Math.max(document.documentElement.clientWidth - targetCoords.right, 0) // calc without scroll
            };
         },

         getItemPosition: function(item) {
            var targetCoords = _private.getStackParentCoords();
            item.position = StackStrategy.getPosition(targetCoords, item);
            item.popupOptions.stackWidth = item.position.stackWidth;
            item.popupOptions.stackMinWidth = item.position.stackMinWidth;
            item.popupOptions.stackMaxWidth = item.position.stackMaxWidth;

            //todo https://online.sbis.ru/opendoc.html?guid=256679aa-fac2-4d95-8915-d25f5d59b1ca
            item.popupOptions.stackMinimizedWidth = item.popupOptions.minimizedWidth;
            _private.updatePopupOptions(item);
            return item.position;
         },

         addShadowClass: function(item) {
            _private.removeShadowClass(item);
            item.popupOptions.stackClassName += ' controls-Stack__shadow';
         },

         removeShadowClass: function(item) {
            item.popupOptions.stackClassName = (item.popupOptions.stackClassName || '').replace(/controls-Stack__shadow/ig, '').trim();
         },

         prepareUpdateClassses: function(item) {
            _private.addStackClasses(item.popupOptions);
            _private.updatePopupOptions(item);
         },

         addStackClasses: function(popupOptions) {
            var className = popupOptions.className || '';
            if (className.indexOf(STACK_CLASS) < 0) {
               popupOptions.className = className + ' ' + STACK_CLASS;
            }
         },

         updatePopupOptions: function(item) {
            // for vdom synchronizer. Updated the link to the options when className was changed
            if (!item.popupOptions._version) {
               item.popupOptions.getVersion = function() {
                  return this._version;
               };
               item.popupOptions._version = 0;
            }
            item.popupOptions._version++;
         },


         prepareMaximizedState: function(maxPanelWidth, item) {
            var canMaximized = maxPanelWidth > item.popupOptions.minWidth;
            if (!canMaximized) {
               // If we can't turn around, we hide the turn button and change the state
               item.popupOptions.templateOptions.showMaximizedButton = false;
               item.popupOptions.templateOptions.maximized = false;
            } else {
               item.popupOptions.templateOptions.showMaximizedButton = true;

               // Restore the state after resize
               item.popupOptions.templateOptions.maximized = item.popupOptions.maximized;
            }
         },
         setMaximizedState: function(item, state) {
            item.popupOptions.maximized = state;
            item.popupOptions.templateOptions.maximized = state;
         },
         getWindowSize: function() {
            return {
               width: window.innerWidth,
               height: window.innerHeight
            };
         },
         setStackContent: function(item) {
            item.popupOptions.content = StackContent;
         },

         getDefaultOptions: function(item) {
            var template = item.popupOptions.template;

            var templateClass;

            if (typeof template === 'string') {
               var templateInfo = parserLib(template);
               templateClass = require(templateInfo.name);

               templateInfo.path.forEach(function(key) {
                  templateClass = templateClass[key];
               });
            } else {
               templateClass = template;
            }

            return templateClass.getDefaultOptions ? templateClass.getDefaultOptions() : {};
         }
      };

      /**
       * Stack Popup Controller
       * @class Controls/_popupTemplate/Stack/Opener/StackController
       * @control
       * @private
       * @category Popup
       */

      var StackController = BaseController.extend({
         constructor: function(cfg) {
            StackController.superclass.constructor.call(this, cfg);
            this._stack = new collection.List();
         },

         elementCreated(item, container) {
            const isSinglePopup = this._stack.getCount() < 2;
            if (isSinglePopup) {
               _private.prepareSizeWithoutDOM(item);
            } else {
               _private.prepareSizes(item, container);
            }
            if (item.popupOptions.isCompoundTemplate) {
               _private.setStackContent(item);
               this._stack.add(item);
               this._update();
            } else if (!isSinglePopup) {
               this._update();
            }
         },

         elementUpdated: function(item, container) {
            _private.prepareUpdateClassses(item);
            _private.setStackContent(item);
            _private.prepareSizes(item, container);
            this._update();
         },

         elementMaximized: function(item, container, state) {
            _private.setMaximizedState(item, state);

            //todo https://online.sbis.ru/opendoc.html?guid=256679aa-fac2-4d95-8915-d25f5d59b1ca
            item.popupOptions.width = state ? item.popupOptions.maxWidth : (item.popupOptions.minimizedWidth || item.popupOptions.minWidth);
            _private.prepareSizes(item, container);
            this._update();
         },

         popupResize(): boolean {
            return false;
         },

         elementDestroyed: function(item) {
            this._stack.remove(item);
            this._update();
            return (new Deferred()).callback();
         },

         _update: function() {
            let maxPanelWidth = StackStrategy.getMaxPanelWidth();
            let maxWidth = 0;
            let cache = {};
            let self = this;
            this._stack.each(function(item) {
               if (item.popupState !== BaseController.POPUP_STATE_DESTROYING) {
                  item.position = _private.getItemPosition(item);
                   if (!item.containerWidth && !item.position.stackWidth) {
                       item.containerWidth = _private.getContainerWidth(item, self._getPopupContainer(item.id));
                   }
                   let currentWidth = item.containerWidth || item.position.stackWidth;
                  if (currentWidth) {
                     if (!cache[currentWidth]) {
                        cache[currentWidth] = 1;
                        _private.addShadowClass(item);
                     } else {
                        _private.removeShadowClass(item);
                     }

                     // Drawing only 1 shadow on popup of the same size. Done in order not to duplicate the shadow.
                     if (currentWidth >= maxWidth) {
                        if (maxWidth) {
                           cache = {};
                           cache[currentWidth] = 1;
                        }
                        maxWidth = currentWidth;
                     }
                  }

                  if (StackStrategy.isMaximizedPanel(item)) {
                     _private.prepareMaximizedState(maxPanelWidth, item);
                  }
               }
            });
         },

         getDefaultConfig: function(item) {
            _private.prepareSizeWithoutDOM(item);
            _private.setStackContent(item);
            _private.addStackClasses(item.popupOptions);
            if (StackStrategy.isMaximizedPanel(item)) {
               // set default values
               item.popupOptions.templateOptions.showMaximizedButton = undefined; // for vdom dirtyChecking
               var maximizedState = item.popupOptions.hasOwnProperty('maximized') ? item.popupOptions.maximized : false;
               _private.setMaximizedState(item, maximizedState);
            }

            if (item.popupOptions.isCompoundTemplate) {
               // set sizes before positioning. Need for templates who calculate sizes relatively popup sizes
               var position = _private.getItemPosition(item);
               item.position = {
                  top: -10000,
                  left: -10000,
                  height: _private.getWindowSize().height,
                  stackWidth: position.stackWidth || undefined
               };
            } else {
                // TODO KINGO
                // Когда несколько раз зовут open до того как построилось окно и у него может вызываться фаза update
                // мы обновляем опции, которые пришли в последний вызов метода open и зовем getDefaultConfig, который
                // добавляет item в _stack. Добавление нужно делать 1 раз, чтобы не дублировалась конфигурация.
                let itemIndex = this._stack.getIndexByValue('id', item.id);
                if (itemIndex === -1) {
                    this._stack.add(item);
                } else {
                    this._stack.replace(item, itemIndex);
                }

                if (this._stack.getCount() > 1) {
                   this._update();
                } else {
                   item.position = _private.getItemPosition(item);
                   _private.addShadowClass(item);
                   if (StackStrategy.isMaximizedPanel(item)) {
                      _private.prepareMaximizedState(StackStrategy.getMaxPanelWidth(), item);
                   }
                   _private.updatePopupOptions(item);
                }
            }
         },

         _private: _private
      });

      export = new StackController();

