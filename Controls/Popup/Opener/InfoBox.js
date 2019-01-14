define('Controls/Popup/Opener/InfoBox',
   [
      'Core/core-clone',
      'Core/IoC',
      'Controls/Popup/Opener/BaseOpener',
      'Controls/Utils/getZIndex'
   ],
   function(cClone, IoC, Base, getZIndex) {
      'use strict';

      /**
       * Component that opens a popup that is positioned relative to a specified element. {@link https://wi.sbis.ru/doc/platform/developmentapl/interface-development/wasaby/components/openers/#_4 see more}.
       * @remark
       * Private control. This control uses Popup/Infobox and Application to open popup on openInfobox events
       * @class Controls/Popup/Opener/InfoBox
       * @extends Core/Control
       * @mixes Controls/interface/IInfoboxOptions
       * @mixes Controls/Popup/InfoBox/InfoboxStyles
       *
       * @private
       * @control
       * @category Popup
       * @author Красильников А.С.
       * @private
       */

      /**
       * @typedef {Object} Config
       * @description Infobox configuration.
       * @property {String|Function} template Template inside popup
       * @property {Object} templateOptions Template options inside popup.
       * @property {domNode} target The target relative to which the popup is positioned.
       * @property {String} position Point positioning of the target relative to infobox.
       * @property {String} message The text in the body popup.
       * @property {Boolean} floatCloseButton Whether the content should wrap around the cross closure.
       * @property {String} style Infobox display style.
       * @property {Number} showDelay Delay before opening.
       */


      /**
       * @name Controls/interface/IInfoboxOptions#config
       * @cfg {Config[]} Infobox options.
       */

      var INFOBOX_HIDE_DELAY = 300;
      var INFOBOX_SHOW_DELAY = 300;

      // Конфигурация инфобокса по умолчанию
      var DEFAULT_CONFIG = {
         position: 'tl',
         style: 'default',
         floatCloseButton: false,
         hideDelay: INFOBOX_HIDE_DELAY,
         showDelay: INFOBOX_SHOW_DELAY
      };

      var _private = {
         prepareDisplayStyle: function(color) {
            var resColor = color;
            if (color === 'lite') {
               resColor = 'secondary';
            }
            if (color === 'error') {
               resColor = 'danger';
            }
            if (color === 'help') {
               resColor = 'primary';
            }
            return resColor;
         }
      };

      var InfoBox = Base.extend({
         _openId: null,
         _closeId: null,
         _style: null,

         /**
          * @name Controls/Popup/Opener/Infobox#isOpened
          * @function
          * @description Popup opened status.
          */

         /**
          * Open popup.
          * @function Controls/Popup/Opener/InfoBox#open
          * @param {Object} Config
          * @returns {undefined}
          * @example
          * js
          * <pre>
          *   Control.extend({
          *      ...
          *
          *      _openInfobox() {
          *          var config= {
          *              message: 'Всплывающая подсказка'
          *              target: this._children.buttonTarget //dom node
          *          }
          *          this._notify('openInfoBox', [config], {bubbling: true});
          *      }
          *
          *      _closeInfobox() {
          *          this._notify('closeInfoBox', [], {bubbling: true});
          *      }
          *   });
          * </pre>
          */
         _beforeMount: function(options) {
            InfoBox.superclass._beforeMount.apply(this, arguments);
            if (options.float) {
               IoC.resolve('ILogger').warn('InfoBox', 'Используется устаревшя опция float, используйте floatCloseButton');
            }

         },

         open: function(cfg) {
            // todo Есть проблема с обновлением в инфобоксе. В update прилетает новый конфиг, но в dom находится
            // еще старая версия подсказки => нельзя получить актуальные размеры, чтобы правильно спозиционироваться.
            if (this.isOpened()) { // Инфобокс всегда один
               this.close(0);
            }
            this._clearTimeout();

            // smart merge of two objects. Standart "core-merge util" will rewrite field value of first object even if value of second object will be undefined
            var newCfg = cClone(DEFAULT_CONFIG);
            for (var i in cfg) {
               if (cfg.hasOwnProperty(i)) {
                  if (cfg[i] !== undefined) {
                     newCfg[i] = cfg[i];
                  }
               }
            }
            if (cfg.float) {
               newCfg.floatCloseButton = cfg.float;
            }
            if (cfg.style === 'lite') {
               IoC.resolve('ILogger').warn('InfoBox', 'Используется устаревшее значение опции style light, используйте secondary');
            }
            if (cfg.style === 'help') {
               IoC.resolve('ILogger').warn('InfoBox', 'Используется устаревшее значение опции style help, используйте primary');
            }
            if (cfg.style === 'error') {
               IoC.resolve('ILogger').warn('InfoBox', 'Используется устаревшее значение опции style error, используйте danger');
            }
            newCfg.style =  _private.prepareDisplayStyle(cfg.style);

            // TODO код с задержкой дублируется в Popup/Infobox. По задаче нужно обобщить эти 2 компонента: https://online.sbis.ru/opendoc.html?guid=b8584cee-0310-4e71-a8fb-6c38e4306bb5
            if (newCfg.showDelay > 0) {
               this._openId = setTimeout(this._open.bind(this, newCfg), newCfg.showDelay);
            } else {
               this._open(newCfg);
            }
         },
         _open: function(cfg) {
            InfoBox.superclass.open.call(this, {
               target: cfg.target,
               position: cfg.position,
               autofocus: false,
               zIndex: cfg.zIndex || getZIndex(this),
               eventHandlers: cfg.eventHandlers,
               opener: cfg.opener,
               templateOptions: { // Опции, которые будут переданы в наш шаблон Opener/InfoBox/resources/template
                  template: cfg.template,
                  templateOptions: cfg.templateOptions, // Опции, которые будут переданы в прикладной cfg.template (выполняется построение внутри нашего шаблона)
                  message: cfg.message,
                  floatCloseButton: cfg.floatCloseButton
               },
               className: 'controls-InfoBox__popup controls-PreviewerController controls-InfoBox-style-' + (cfg.style || 'default'),
               template: 'Controls/Popup/Opener/InfoBox/resources/template'
            }, 'Controls/Popup/Opener/InfoBox/InfoBoxController');
         },

         /**
          * Close popup.
          * @function Controls/Popup/Opener/InfoBox#close
          */
         close: function(delay) {
            delay = delay === undefined ? INFOBOX_HIDE_DELAY : delay;
            this._clearTimeout();
            if (delay > 0) {
               this._closeId = setTimeout(InfoBox.superclass.close.bind(this), delay);
            } else {
               InfoBox.superclass.close.call(this);
            }
         },

         _closeOnTargetScroll: function() {
            this.close(0);
         },

         _clearTimeout: function() {
            clearTimeout(this._openId);
            clearTimeout(this._closeId);
         }
      });

      InfoBox.getDefaultOptions = function() {
         var options = Base.getDefaultOptions();

         options.closeOnTargetScroll = true;
         options._vdomOnOldPage = true; // Open vdom popup in the old environment
         return options;
      };

      return InfoBox;
   });
