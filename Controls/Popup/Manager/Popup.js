define('Controls/Popup/Manager/Popup',
   [
      'Core/Control',
      'wml!Controls/Popup/Manager/Popup',
      'Controls/Popup/Compatible/EscProcessing',
      'Core/helpers/Function/runDelayed',
      'Env/Env',
      'wml!Controls/Popup/Manager/PopupContent'
   ],
   function(Control, template, EscProcessing, runDelayed, Env) {
      'use strict';

      var _private = {
         keyUp: function(event) {
            if (event.nativeEvent.keyCode === Env.constants.key.esc) {
               this._close();
            }
         }
      };

      var Popup = Control.extend({

         /**
          * Control Popup
          * @class Controls/Popup/Manager/Popup
          * @mixes Controls/interface/IOpenerOwner
          * @mixes Controls/interface/ICanBeDefaultOpener
          * @extends Core/Control
          * @control
          * @private
          * @category Popup
          * @author Красильников А.С.
          */

         /**
          * @name Controls/Popup/Manager/Popup#template
          * @cfg {Content} Template
          */

         /**
          * @name Controls/Popup/Manager/Popup#templateOptions
          * @cfg {Object} Template options
          */

         _template: template,

         // Register the openers that initializing inside current popup
         // After updating the position of the current popup, calls the repositioning of popup from child openers
         _openersUpdateCallback: [],

         constructor: function() {
            Popup.superclass.constructor.apply(this, arguments);

            this._escProcessing = new EscProcessing();
         },

         _beforeMount: function() {
            // Popup лишний раз провоцирет обновление, реагируя на события внутри него.
            // Для того, чтобы заблокировать это обновление, переопределим _forceUpdate в момент между _beforeMount и _afterMount
            // todo: убрать по https://online.sbis.ru/opendoc.html?guid=11776bc8-39b7-4c55-b5b5-5cc2ea8d9fbe
            this.forceUpdateOrigin = this._forceUpdate;
            this._forceUpdate = function() {};
         },

         _afterMount: function() {
            this._forceUpdate = this.forceUpdateOrigin;

            /* TODO: COMPATIBLE. You can't just count on afterMount position and zooming on creation
             * inside can be compoundArea and we have to wait for it, and there is an asynchronous phase. Look at the flag waitForPopupCreated */

            if (this.waitForPopupCreated) {
               this.callbackCreated = (function() {
                  this.callbackCreated = null;
                  this._notify('popupCreated', [this._options.id], { bubbling: true });
               }).bind(this);
            } else {
               this._notify('popupCreated', [this._options.id], { bubbling: true });
               this.activatePopup();
            }
         },

         _afterUpdate: function() {
            this._notify('popupAfterUpdated', [this._options.id], { bubbling: true });
         },
         _beforeUnmount: function() {
            this._notify('popupDestroyed', [this._options.id], { bubbling: true });
         },

         activatePopup: function() {
            // TODO Compatible
            if (this._options.autofocus && !this._options.isCompoundTemplate) {
               this.activate();
            }
         },

         /**
          * Close popup
          * @function Controls/Popup/Manager/Popup#_close
          */
         _close: function() {
            this._notify('popupClose', [this._options.id], { bubbling: true });
         },
         _maximized: function(event, state) {
            this._notify('popupMaximized', [this._options.id, state], { bubbling: true });
         },

         _popupDragStart: function(event, offset) {
            this._notify('popupDragStart', [this._options.id, offset], { bubbling: true });
         },

         _popupDragEnd: function() {
            this._notify('popupDragEnd', [this._options.id], { bubbling: true });
         },

         _animated: function(ev) {
            this._children.resizeDetect.start(ev);
            this._notify('popupAnimated', [this._options.id], { bubbling: true });
         },

         _registerOpenerUpdateCallback: function(event, callback) {
            this._openersUpdateCallback.push(callback);
         },

         _unregisterOpenerUpdateCallback: function(event, callback) {
            var index = this._openersUpdateCallback.indexOf(callback);
            if (index > -1) {
               this._openersUpdateCallback.splice(index, 1);
            }
         },

         _callOpenersUpdate: function() {
            for (var i = 0; i < this._openersUpdateCallback.length; i++) {
               this._openersUpdateCallback[i]();
            }
         },

         /**
          * Update popup
          * @function Controls/Popup/Manager/Popup#_close
          */
         _update: function() {
            this._notify('popupUpdated', [this._options.id], { bubbling: true });

            // After updating popup position we will updating the position of the popups open with it.
            runDelayed(this._callOpenersUpdate.bind(this));
         },

         _controlResize: function() {
            this._notify('popupControlResize', [this._options.id], { bubbling: true });
         },

         /**
          * Proxy popup result
          * @function Controls/Popup/Manager/Popup#_sendResult
          */
         _sendResult: function(event) {
            var args = Array.prototype.slice.call(arguments, 1);
            this._notify('popupResult', [this._options.id].concat(args), { bubbling: true });
         },

         /**
          * key up handler
          * @function Controls/Popup/Manager/Popup#_keyUp
          * @param event
          */
         _keyUp: function(event) {
            this._escProcessing.keyUpHandler(_private.keyUp, this, [event]);
         },

         _keyDown: function(e) {
            this._escProcessing.keyDownHandler(e);
         }
      });

      Popup.getDefaultOptions = function() {
         return {
            content: 'wml!Controls/Popup/Manager/PopupContent',
            autofocus: true
         };
      };

      return Popup;
   });
