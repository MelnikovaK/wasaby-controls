define('js!SBIS3.CONTROLS.Clickable', [
   "Core/constants"
], function(constants) {

   if (typeof window !== 'undefined') {
      $(document).on("touchend  mouseup", function () {
         $('.controls-Click__active').removeClass('controls-Click__active');
      });
   }

   /**
    * Миксин, добавляющий поведение хранения выбранного элемента. Всегда только одного
    * @mixin SBIS3.CONTROLS.Clickable
    * @public
    * @author Крайнов Дмитрий Олегович
    */

   var Clickable = /**@lends SBIS3.CONTROLS.Clickable.prototype  */{
      /**
       * @event onActivated При активации кнопки (клик мышкой, кнопки клавиатуры)
       * @param {Core/EventObject} eventObject Дескриптор события.
       * @example
       * <pre>
       *    onActivated: function(event){
       *       $ws.helpers.question('Продолжить?');
       *    }
       * </pre>
       */
      $protected: {
         _options: {
            /**
             * @cfg {String}  Команда
             */
            command: '',
            /**
             * @cfg {Array} Аргументы, которые будут переданы при вызове команды
             */
            commandArgs: [],
            /**
             * @cfg {Boolean} После клика включает задержку (определяется браузерам) перед следующим кликом.
             * Если опция отключена, то все клики будут вызывать событие
             * Если опция включена, то появляется задержка между кликами (определяется браузером)
             * @example
             * <pre class="brush:xml">
             *     <option name="clickThrottle">false</option>
             * </pre>
             */
            clickThrottle: false
         },
         _keysWeHandle: [
            constants.key.enter,
            constants.key.space
         ]
      },

      $constructor: function() {
         this._publish('onActivated');
         var self = this;

         this._container.on("touchstart  mousedown", function (e) {
            if ((e.which == 1 || e.type == 'touchstart') && self.isEnabled()) {
               self._container.addClass('controls-Click__active');
            }
            //return false;
         });
      },

      setCommandArgs: function(commandArgs) {
         this._options.commandArgs = commandArgs;
         this._notifyOnPropertyChanged('commandArgs');
      },

      getCommandArgs: function() {
         return this._options.commandArgs;
      },

      _notifyOnActivated : function(originalEvent) {
         this._notify('onActivated', originalEvent);
         //Блокируем всплытие event'a, т.к. нажатие Enter на КНОПКЕ не должно приводить к срабатыванию дефолтной кнопки
         originalEvent.stopImmediatePropagation();
      },

      _keyboardHover: function(event){
         if (this.isEnabled()) {
            this._clickHandler(event);
            this._notifyOnActivated(event);
            return true;
         }
      },

      /*В корешке закладки (TabButton) нужно что бы клик по ней работал вне зависимости от ее состояния, для этого определен
      этот метод, который позволяет сделать контрол и его детей (например редактирование по месту в закладке) disabled 
      но клик по самому контролу будет обрабатываться*/
      _checkEnabledByClick: function(){
         return this.isEnabled();
      },

      before : {
         _clickHandler: function() {

         }
      },

      instead : {
         //TODO сделано через onClickHandler WS в базовом контроле
         _onClickHandler: function(e) {
            if (this._checkEnabledByClick()) {
               this._container.removeClass('controls-Click__active');
               //Установим фокус в контрол, чтобы у него стрельнул onFocusIn и у контрола с которого уходит фокус, стрельнул onFocusOut.
               //Такое поведение необходимо например в редактировании по месту, которое закрывается, когда у дочернего контрола стрельнул onFocusOut.
               if (!this._isControlActive && this._options.activableByClick) {
                  this.setActive(true);
               }
               /* в IE (и только в нескольких минорных версиях) originalEvent.detail выдаёт просто рандомное число, вместо кол-ва кликов
                  https://connect.microsoft.com/IE/feedback/details/789773/ie-increments-event-detail-on-clicks-over-different-locations
                  В каких-то случаях на android e.originalEvent.detail может быть 0 */
               if(!this._options.clickThrottle || (this._options.clickThrottle && (e.originalEvent.detail <= 1 || constants.browser.isIE))) {
                  this._clickHandler(e);
                  if (!!this._options.command) {
                     var args = [this._options.command].concat(this._options.commandArgs);
                     this.sendCommand.apply(this, args);
                  }
                  this._notifyOnActivated(e);
               }
            }
            e.stopImmediatePropagation();
         }
      }
   };

   return Clickable;

});/**
 * Created by kraynovdo on 27.10.2014.
 */
