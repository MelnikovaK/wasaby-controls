define('Controls/Popup/Templates/Notification/Base',
   [
      'Core/Control',
      'Core/IoC',
      'wml!Controls/Popup/Templates/Notification/Base',
      'css!theme?Controls/Popup/Templates/Notification/Base'
   ],
   function(Control, IoC, template) {
      var _private = {
         prepareDisplayStyle: function(color) {
            var resColor = color;

            // поддержка старых цветов, чтоб не ломать старые
            if (color === 'done') {
               resColor = 'success';
            }
            if (color === 'error') {
               resColor = 'danger';
            }
            return resColor;
         }
      };

      /**
       * Base template of notification popup.
       *
       * @class Controls/Popup/Templates/Notification/Base
       * @extends Core/Control
       * @control
       * @public
       * @category popup
       * @author Красильников А.С.
       * @mixes Controls/Popup/Templates/Notification/NotificationStyles
       * @demo Controls-demo/Popup/Templates/NotificationTemplatePG
       */

      var timeAutoClose = 5000;

      var Notification = Control.extend({
         _template: template,

         _timerId: null,
         _style: null,

         _beforeMount: function(options) {
            if (options.style === 'error') {
               IoC.resolve('ILogger').warn('Notification', 'Используется устаревшее значение опции style error, используйте danger');
            }
            if (options.style === 'done') {
               IoC.resolve('ILogger').warn('Notification', 'Используется устаревшее значение опции style done, используйте success');
            }
            this._style = _private.prepareDisplayStyle(options.style);
            if (options.autoClose) {
               this._autoClose();
            }
            if (options.iconClose) {
               IoC.resolve('ILogger').warn('Notification', 'Используется устаревшя опция iconClose, используйте closeButtonVisibility');
            }
            if (options.contentTemplate) {
               IoC.resolve('ILogger').warn('Notification', 'Используется устаревшая опция contentTemplate, используйте bodyContentTemplate');
            }
         },
         _beforeUpdate: function(options) {
            this._style = _private.prepareDisplayStyle(options.style);
         },

         _closeClick: function() {
            this._notify('close', []);
         },

         _mouseenterHandler: function() {
            clearTimeout(this._timerId);
         },

         _mouseleaveHandler: function() {
            if (this._options.autoClose) {
               this._autoClose();
            }
         },

         _autoClose: function() {
            var self = this;

            this._timerId = setTimeout(function() {
               self._notify('close', []);
            }, timeAutoClose);
         }
      });

      Notification.getDefaultOptions = function() {
         return {
            style: 'primary',
            autoClose: true
         };
      };

      return Notification;
   });

/**
 * @name Controls/Popup/Templates/Notification/Base#autoClose
 * @cfg {Number} Close by timeout after open.
 */

/**
 * @name Controls/Popup/Templates/Notification/Base#style
 * @cfg {String} Notification display style.
 * @variant warning
 * @variant primary
 * @variant success
 * @variant danger
 */

/**
 * @name Controls/Popup/Templates/Notification/Base#closeButtonVisibility
 * @cfg {Boolean} Determines whether display of the close button.
 */

/**
 * @name Controls/Popup/Templates/Notification/Base#bodyContentTemplate
 * @cfg {function|String} Main content.
 */
