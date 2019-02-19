define('Controls/Application/TouchDetector', [
   'Core/Control',
   'wml!Controls/Application/TouchDetector/TouchDetector',
   'Env/Env',
   'Controls/Context/TouchContextField'
], function(
   Control,
   template,
   Env,
   TouchContextField
) {
   return Control.extend({
      moveInRow: 1,

      // При инициализации необходимо корректно проставить значение, далее значение определяется в зависимости от событий
      state: Env.compatibility.touch,
      lastState: Env.compatibility.touch,
      _template: template,

      _updateTouchObject: function() {
         if (this.state !== this.lastState) {
            this._touchObjectContext.setIsTouch(this.state);
            this.lastState = this.state;
         }
      },

      _beforeMount: function() {
         this._touchObjectContext = new TouchContextField(this.state);
      },

      touchHandler: function() {
         this.state = true;
         this._updateTouchObject();
         this.moveInRow = 0;
      },

      moveHandler: function() {
         if (this.moveInRow > 0) {
            this.state = false;
            this._updateTouchObject();
         }
         this.moveInRow++;
      },

      isTouch: function() {
         return !!this.state;
      },

      getClass: function() {
         return this.state ? 'ws-is-touch' : 'ws-is-no-touch';
      },

      // Объявляем функцию, которая возвращает поля Контекста и их значения.
      // Имя функции фиксировано.
      _getChildContext: function() {

         // Возвращает объект.
         return {
            isTouch: this._touchObjectContext
         };
      }
   });
});
