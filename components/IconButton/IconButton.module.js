/**
 * Модуль 'Кнопка-иконка'.
 *
 * @description
 */
define('js!SBIS3.CONTROLS.IconButton', ['js!SBIS3.CONTROLS.ButtonBase', 'js!SBIS3.CONTROLS.IconMixin', 'html!SBIS3.CONTROLS.IconButton'], function(ButtonBase, IconMixin, dotTplFn) {

   'use strict';

   /**
    * Контрол, отображающий обычную кнопку
    * @class SBIS3.CONTROLS.IconButton
	 * @demo SBIS3.CONTROLS.Demo.MyIconButton
    * @extends SBIS3.CONTROLS.ButtonBase
    * @control
    * @initial
    * <component data-component='SBIS3.CONTROLS.IconButton'>
    *    <option name="icon">sprite:icon-16 icon-AddButton icon-primary</option>
    * </component>
    * @public
    * @author Крайнов Дмитрий Олегович
    * @category Buttons
    * @mixes SBIS3.CONTROLS.IconMixin
    * @mixes SBIS3.CONTROLS.Clickable
    *
    * @ignoreOptions independentContext contextRestriction extendedTooltip validators
    * @ignoreOptions element linkedContext handlers parent autoHeight autoWidth horizontalAlignment
    * @ignoreOptions isContainerInsideParent owner stateKey subcontrol verticalAlignment
    *
    * @ignoreMethods activateFirstControl activateLastControl addPendingOperation applyEmptyState applyState clearMark
    * @ignoreMethods changeControlTabIndex destroyChild detectNextActiveChildControl disableActiveCtrl findParent
    * @ignoreMethods focusCatch getActiveChildControl getChildControlById getChildControlByName getChildControls
    * @ignoreMethods getClassName getContext getEventBusOf getEventHandlers getEvents getExtendedTooltip getOpener
    * @ignoreMethods getImmediateChildControls getLinkedContext getNearestChildControlByName getOwner getOwnerId
    * @ignoreMethods getReadyDeferred getStateKey getTabindex getUserData getValue hasActiveChildControl hasChildControlByName
    * @ignoreMethods hasEventHandlers isActive isAllReady isDestroyed isMarked isReady makeOwnerName setOwner setSize
    * @ignoreMethods markControl moveFocus moveToTop once registerChildControl registerDefaultButton saveToContext
    * @ignoreMethods sendCommand setActive setChildActive setClassName setExtendedTooltip setOpener setStateKey activate
    * @ignoreMethods setTabindex setTooltip setUserData setValidators setValue storeActiveChild subscribe unregisterChildControl
    * @ignoreMethods unregisterDefaultButton unsubscribe validate waitAllPendingOperations waitChildControlById waitChildControlByName
    *
    * @ignoreEvents onActivate onAfterLoad onAfterShow onBeforeControlsLoad onBeforeLoad onBeforeShow onChange onClick
    * @ignoreEvents onFocusIn onFocusOut onKeyPressed onReady onResize onStateChanged onTooltipContentRequest
    * @ignoreEvents onDragIn onDragStart onDragStop onDragMove onDragOut
    *
    * @cssModifier controls-IconButton__round-border круглый бордер вокруг иконки
    */

   var IconButton = ButtonBase.extend([IconMixin], /** @lends SBIS3.CONTROLS.IconButton.prototype */ {
      _dotTplFn : dotTplFn,
      $protected: {
         _options: {
         }
      },

      $constructor: function() {
         /*TODO оставляем добавку класса через jquery
         * чтобы избавиться - надо убрать зависимость от icons.css
         * в котором прописаны поведение и цвета для иконок по ховеру*/
         if (this._container.hasClass('controls-IconButton__round-border')) {
            this._container.removeClass('action-hover');
         }
      },

      _modifyOptions: function (opts) {
         var
            options = IconButton.superclass._modifyOptions.apply(this, arguments),
            iconClass = options._iconClass;
         if (iconClass) {
            options._moreClass = '';
            if ((iconClass.indexOf('icon-error') < 0) && (iconClass.indexOf('icon-done') < 0)) {
               options._moreClass += ' action-hover';
            }
            else {
               if (iconClass.indexOf('icon-error') >= 0) {
                  options._moreClass += ' controls-IconButton__errorBorder';
               }
               else {
                  options._moreClass += ' controls-IconButton__doneBorder';
               }
            }
         }
         return options;
      },

      _drawIcon: function(icon){
      	if (this._oldIcon){
      		this._container.removeClass(this._oldIcon);
      	}
         this._container.addClass('controls-IconButton ' + this._options._iconClass);
      },

      setTooltip: function(tooltip) {
         this._container.attr('title', tooltip);
      }
   });

   return IconButton;

});