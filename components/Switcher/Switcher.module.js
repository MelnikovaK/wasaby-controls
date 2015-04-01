
define('js!SBIS3.CONTROLS.Switcher', ['js!SBIS3.CONTROLS.SwitcherBase', 'html!SBIS3.CONTROLS.Switcher', 'js!SBIS3.CONTROLS.Switcher'], function(SwitcherBase, dotTplFn) {

   'use strict';

   /**
    * Класс определяет отображение в виде обычного переключателя.
    * @class SBIS3.CONTROLS.Switcher
    * @extends SBIS3.CONTROLS.SwitcherBase
    * @mixes SBIS3.CONTROLS.FormWidgetMixin
    * @control
    * @demo SBIS3.Demo.Control.MySwitcher
    * @public
    * @initial
    * <component data-component='SBIS3.CONTROLS.Switcher'>
    *     <option name='stateOn'>Вкл</option>
    *     <option name='stateOff'>Выкл</option>
    * </component>
    * @ignoreOptions validators independentContext contextRestriction extendedTooltip element linkedContext handlers
    * @ignoreOptions autoHeight autoWidth context horizontalAlignment isContainerInsideParent modal owner stateKey
    * @ignoreOptions subcontrol verticalAlignment parent
    *
    * @ignoreMethods applyEmptyState applyState findParent getAlignment getEventHandlers getEvents getExtendedTooltip
    * @ignoreMethods getId getLinkedContext getMinHeight getMinSize getMinWidth getOwner getOwnerId getParentByClass
    * @ignoreMethods getParentByName getParentByWindow getStateKey getTopParent getUserData hasEvent hasEventHandlers
    * @ignoreMethods isDestroyed isSubControl makeOwnerName once sendCommand setOwner setStateKey setUserData setValue
    * @ignoreMethods subscribe unbind unsubscribe unsubscribeFrom
    *
    * @ignoreEvents onDragIn onDragMove onDragOut onDragStart onDragStop onStateChange onTooltipContentRequest onChange
    * @ignoreEvents onFocusIn onFocusOut onKeyPressed
    */

   var Switcher = SwitcherBase.extend( /** @lends SBIS3.CONTROLS.Switcher.prototype */ {
      _dotTplFn: dotTplFn,
      $protected: {
         _options: {

         }
      },

      $constructor: function() {

      },

      setState: function(state) {
         Switcher.superclass.setState.call(this,state);
         if (state == 'on'){
            this._switcher.addClass('controls-Switcher__toggle__position-on');
            this._position.html(this._options.stateOn || '&nbsp;');
         } else {
            if (state == 'off') {
               this._switcher.removeClass('controls-Switcher__toggle__position-on');
               this._position.html(this._options.stateOff || '&nbsp');
            }
         }
      },

      setStateOn: function(text){
         var self = this;
         Switcher.superclass.setStateOn.call(self,text);
         if (this._state == 'on'){
            this._position.html(self._options.stateOn);
         }
      },

      setStateOff: function(text){
         var self = this;
         Switcher.superclass.setStateOff.call(self,text);
         if (this._state == 'off'){
            this._position.html(self._options.stateOff);
         }
      }
   });

   return Switcher;

});