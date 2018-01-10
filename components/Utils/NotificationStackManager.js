define('SBIS3.CONTROLS/Utils/NotificationStackManager',
   [
   "Core/WindowManager",
   "Core/EventBus",
   "Lib/Control/Control"
],

   /**
    * Синглтон для работы со стеком нотификационных окон.
    * @class SBIS3.CONTROLS/Utils/NotificationStackManager
    * @author Степин П.В.
    */
   function( cWindowManager, EventBus, Control){
      'use strict';
      //Время через которое блоки скрываются
      var LIFE_TIME = 5000;

      var NotificationStackManager = Control.Control.extend( /** @lends SBIS3.CONTROLS/Utils/NotificationStackManager.prototype */ {
         $protected: {
            _items: [],
            _hiddenItems: [],
            _windowsIdWithLifeTime: []
         },
         init: function() {
            NotificationStackManager.superclass.init.call(this);

            var self = this;

            this._zIndex =  cWindowManager.getMaxZIndex() + 1;

            $(window).on('resize', function(){
               self._updatePositions();
            });

            this.subscribeTo(EventBus.globalChannel(), 'FloatAreaZIndexChanged', function(e, zIndex){
               self._updateZIndex(zIndex);
            });
            this.subscribeTo(cWindowManager, 'zIndexChanged', function(e, zIndex){
               self._updateZIndex(zIndex);
            });
         },

         /**
          * Показать нотификационное окно
          * @param inst Инстанс нотификационного окна
          * @param {Boolean} notHide Не прятать окно по истечению времени жизни
          */
         showNotification: function(inst, notHide){
            notHide = !!notHide;

            if(this._getItemIndexById(inst.getId()) === -1){
               this._appendNotification(inst, notHide);
            }
         },

         /**
          * Добавить нотификационной окно в стек
          * @param inst Инстанс нотификационного окна
          * @param {Boolean} notHide Не прятать окно по истечению времени жизни
          * @private
          */
         _appendNotification: function(inst, notHide){
            var self = this;
            var instId = inst.getId();

            //TODO Костыль для popupmixin. Исправить, как только он научится позиционироваться фиксированно
            inst.show();

            inst._fixed = true;
            inst._checkFixed = function(){};

            inst.getContainer().css({
               position: 'fixed',
               top: '',
               left: '',
               bottom: '-1000px',
               right: '-1000px'
            });
            //TODO Конец костыля

            this._items.unshift(inst);

            this.subscribeTo(inst, 'onClose', function(){
               self._deleteNotification(instId);
            });

            this.subscribeTo(inst, 'onSizeChange', function(){
               self._updatePositions();
            });

            if(!notHide){
               setTimeout(function(){
                  self._deleteNotification(instId);
                  self._windowsIdWithLifeTime.splice(self._windowsIdWithLifeTime.indexOf(inst.getId()), 1);
               }, LIFE_TIME);
               this._windowsIdWithLifeTime.push(inst.getId());
            }

            this._updatePositions();
         },

         _updateZIndex: function(zIndex){
            this._zIndex = Math.max(zIndex, cWindowManager.getMaxZIndex()) + 1;
            this._updatePositions();
         },

         /**
          * Удалить нотификационное окно из стека
          * @param instId Id Инстанса нотификационного окна
          * @private
          */
         _deleteNotification: function(instId){
            var index = this._getItemIndexById(instId);
            if(index !== -1){
               this._items[index].destroy();
               this._items.splice(index, 1);

               this._updatePositions();
            }
         },

         /**
          * Пересчитать позиции нотификационных окон
          * @private
          */
         _updatePositions: function(){
            var
               bottom,
               containerOffset,
               getIntCss = function(container, cssName) {
                  return +container.css(cssName).replace('px', '');
               };
            for (var i = 0, l = this._items.length; i < l; i++){
               var
                  container = this._items[i].getContainer(),
                  cashedMargin = container.css('margin'),
                  zIndex = this._zIndex;
               //Для первого окна запоминаем отступы
               if (!i) {
                   //Popupmixin при инициализации проставляет Margin, сбрасываем его чтобы получить margin из стилей
                  container.css('margin', '');
                  bottom = getIntCss(container, 'margin-bottom');
                  containerOffset = {
                     bottom: getIntCss(container, 'margin-bottom'),
                     right: getIntCss(container, 'margin-right')
                  };
                   //Восстанавливаем margin установленный popupmixin`om
                   container.css('margin', cashedMargin);
               }
               /*Самозакрывающиеся окна показываем выше всех модальных*/
               if(this._windowsIdWithLifeTime.indexOf(this._items[i].getId()) !== -1){
                  zIndex = 1000000;
               }

               container.css({
                  bottom: bottom,
                  right: containerOffset.right,
                  display: 'block',
                  'z-index': zIndex
               });

               this._items[i]._zIndex = zIndex;

               bottom += container.outerHeight() + containerOffset.bottom;

               if(container.offset().top <= 0){
                  container.css('display', 'none');
               }
            }
         },

         /**
          * Вернуть индекс нотификационного окно по его id
          * @private
          */
         _getItemIndexById: function(id){
            for(var i = 0, l = this._items.length; i < l; i++){
               if(this._items[i].getId() === id){
                  return i;
               }
            }
            return -1;
         }
      });

      return new NotificationStackManager();
   }
);