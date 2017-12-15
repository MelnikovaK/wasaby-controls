/**
 * Модуль 'Кнопка-иконка'.
 *
 * @description
 */
define('js!SBIS3.CONTROLS.IconButton', [ 'js!WSControls/Buttons/Button', 'css!SBIS3.CONTROLS.IconButton/IconButton/IconButton'], function(WSButton) {

   'use strict';

   /**
    * Класс контрола, который предназначен для отображения кнопки в виде иконки.
    *
    * @class SBIS3.CONTROLS.IconButton
    * @extends WSControls/Buttons/Button
    * @mixes SBIS3.CONTROLS.IconMixin
    * @demo SBIS3.CONTROLS.Demo.MyIconButton
    * @author Борисов Петр Сергеевич
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
    * @cssModifier controls-IconButton__round-border Добавляет круглую границу вокруг иконки. Размер границы подстраивается под размеры иконки.
    * По умолчанию граница серого цвета. При наведении курсора цвет границы изменяется в соответствии с цветом иконки, установленной в опции {@link icon}.
    * @cssModifier controls-IconButton__round-border-24 Устанавливает круглую границу (диаметр в 24 px) вокруг иконки быстрой операции, доступной по наведению курсора. Подробнее о таких типах операций вы можете прочитать <a href="https://wi.sbis.ru/doc/platform/developmentapl/interfacedev/components/list/list-settings/records-editing/items-action/fast/">здесь</a>.
    * Модификатор применяется совместно с иконками 16 px. Цвет границы соответствует цвету иконки, установленной в опции {@link icon}.
    * @cssModifier controls-IconButton__filter-left Устанавливает внешний вид для кнопки открытия/закрытия фильтров слева.
    * @cssModifier controls-IconButton__filter-right Устанавливает внешний вид  для кнопки открытия/закрытия фильтров справа.
    *
    * @category Buttons
    * @control
    * @public
    * @initial
    * <component data-component='SBIS3.CONTROLS.IconButton'>
    *    <option name="icon" value="icon-16 icon-AddButton icon-primary"></option>
    * </component>
    */

   var IconButton = WSButton.extend([], /** @lends SBIS3.CONTROLS.IconButton.prototype */ {
      $protected: {
         _options: {
         }
      },

      setIcon: function(icon) {
         if (icon) {
            if (((icon.indexOf('icon-error') >= 0) || (icon.indexOf('icon-done') >= 0))){
               if (icon.indexOf('icon-error') >= 0) {
                  this.getContainer().removeClass('controls-IconButton__doneBorder').addClass('controls-IconButton__errorBorder');
               }
               else {
                  this.getContainer().addClass('controls-IconButton__doneBorder').removeClass('controls-IconButton__errorBorder');
               }
            } else {
               this.getContainer().removeClass('controls-IconButton__doneBorder').removeClass('controls-IconButton__errorBorder');
            }
         } else {
            this.getContainer().removeClass('controls-IconButton__doneBorder').removeClass('controls-IconButton__errorBorder');
         }
         IconButton.superclass.setIcon.call(this, icon);
      },

      _modifyOptions: function () {
         var
             options = IconButton.superclass._modifyOptions.apply(this, arguments),
             iconClass = options._iconClass;

         options.className += ' controls-IconButton';


         if (iconClass) {
            if (((iconClass.indexOf('icon-error') >= 0) || (iconClass.indexOf('icon-done') >= 0))){
               if (iconClass.indexOf('icon-error') >= 0) {
                  options.className += ' controls-IconButton__errorBorder';
               }
               else {
                  options.className += ' controls-IconButton__doneBorder';
               }
            }
         }
         return options;
      },

      $constructor: function () {
         /*TODO оставляем добавку класса через jquery
          * чтобы избавиться - надо убрать зависимость от icons.css
          * в котором прописаны поведение и цвета для иконок по ховеру*/
         var className = this._container.get(0).className;
         if (className && className.indexOf('controls-IconButton__round-border') >= 0) {
            this._container.removeClass('action-hover');
         }
      }
   });

   return IconButton;

});