define('Controls/Popup/Manager/Popup',
   [
      'Core/Control',
      'wml!Controls/Popup/Manager/Popup',
      'Core/helpers/Function/runDelayed',
      'Core/constants',
      'wml!Controls/Popup/Manager/PopupContent'
   ],
   function(Control, template, runDelayed, CoreConstants) {
      'use strict';

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

         _afterMount: function() {
            /* TODO: COMPATIBLE. You can't just count on afterMount position and zooming on creation
             * inside can be compoundArea and we have to wait for it, and there is an asynchronous phase. Look at the flag waitForPopupCreated */

            if (this.waitForPopupCreated) {
               this.callbackCreated = (function() {
                  this.callbackCreated = null;
                  this._notify('popupCreated', [this._options.id], { bubbling: true });
               }).bind(this);
            } else {
               this._notify('popupCreated', [this._options.id], { bubbling: true });

               // TODO Compatible
               if (this._options.autofocus && !this._options.isCompoundTemplate) {
                  this.activate();
               }
            }
         },

         _afterUpdate: function() {
            this._notify('popupAfterUpdated', [this._options.id], { bubbling: true });
         },
         _beforeUnmount: function() {
            this._notify('popupDestroyed', [this._options.id], { bubbling: true });
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

         _animated: function() {
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

         _delayedUpdate: function() {
            // Many processors can affect the size and layout of a page.
            // Wait for them to work out and recalculate the size of popups.
            runDelayed(this._update.bind(this));
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
            if (event.nativeEvent.keyCode === CoreConstants.key.esc) {
               this._close();
            }
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
