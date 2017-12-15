define('js!SBIS3.CONTROLS.Button',
   [
      'js!WSControls/Buttons/Button',
      'css!SBIS3.CONTROLS.Button/Button/Button'
         ],

   function (Base) {

   'use strict';

   // почему нельзя сделать единый шаблон на <button - не работает клик по ссылке в ФФ
   // почему нельзя сделать единый шаблона на <a - нельзя положить <a внутрь <a, в верстке получится два рядом лежащих тега <a

   /**
    * Класс контрола "Обычная кнопка".
    *
    * {@link /doc/platform/developmentapl/interface-development/components/textbox/buttons/button-line/#button Демонстрационные примеры}.
    * <a href='http://axure.tensor.ru/standarts/v7/%D0%BA%D0%BD%D0%BE%D0%BF%D0%BA%D0%B8__%D0%B2%D0%B5%D1%80%D1%81%D0%B8%D1%8F_07_.html'>Спецификация</a>.
    *
    * @class SBIS3.CONTROLS.Button
    * @extends Core/Control
    *
    * @mixes SBIS3.CONTROLS.Button/Button.compatible
    * @mixes SBIS3.CORE.BaseCompatible/Mixins/WsCompatibleConstructor
    * @mixes SBIS3.CORE.Control/ControlGoodCode
    *
    * @author Романов Валерий Сергеевич
    *
    * @ignoreOptions validators independentContext contextRestriction extendedTooltip element linkedContext handlers parent
    * @ignoreOptions autoHeight autoWidth context horizontalAlignment isContainerInsideParent modal owner record stateKey
    * @ignoreOptions subcontrol verticalAlignment
    *
    * @ignoreMethods activateFirstControl activateLastControl addPendingOperation applyEmptyState applyState clearMark
    * @ignoreMethods changeControlTabIndex destroyChild detectNextActiveChildControl disableActiveCtrl findParent
    * @ignoreMethods focusCatch getActiveChildControl getChildControlById getChildControlByName getChildControls
    * @ignoreMethods getClassName getContext getEventBusOf getEventHandlers getEvents getExtendedTooltip getOpener
    * @ignoreMethods getImmediateChildControls getLinkedContext getNearestChildControlByName getOwner getOwnerId
    * @ignoreMethods getReadyDeferred getStateKey getUserData getValue hasActiveChildControl hasChildControlByName
    * @ignoreMethods hasEventHandlers isActive isAllReady isDestroyed isMarked isReady makeOwnerName setOwner setSize
    * @ignoreMethods markControl moveFocus moveToTop once registerChildControl registerDefaultButton saveToContext
    * @ignoreMethods sendCommand setActive setChildActive setClassName setExtendedTooltip setOpener setStateKey activate
    * @ignoreMethods setTooltip setUserData setValidators setValue storeActiveChild subscribe unregisterChildControl
    * @ignoreMethods unregisterDefaultButton unsubscribe validate waitAllPendingOperations waitChildControlById waitChildControlByName
    *
    * @ignoreEvents onActivate onAfterLoad onAfterShow onBeforeControlsLoad onBeforeLoad onBeforeShow onChange onClick
    * @ignoreEvents onKeyPressed onReady onResize onStateChanged onTooltipContentRequest
    * @ignoreEvents onDragIn onDragStart onDragStop onDragMove onDragOut
    *
    * @cssModifier controls-Button__filled непрозрачный фон кнопки
    * @cssModifier controls-Button__big Большая кнопка.
    * @cssModifier controls-Button__ellipsis Кнопка, на которой в тексте появляется многоточие при нехватке ширины.
    * @cssModifier controls-Button__withoutCaption Кнопка, без заголовка !Важно: при добавлении этого класса сломается "Базовая линия".
    *
    * @css controls-Button__icon Класс для изменения отображения иконки кнопки.
    * @css controls-Button__text Класс для изменения отображения текста на кнопке.
    *
    * @control
    * @category Button
    * @public
    * @initial
    * <ws:SBIS3.CONTROLS.Button caption="Кнопка" />
    */
   var Button = Base.extend( [], /** @lends SBIS3.CONTROLS.MenuButton.prototype */ {
      _modifyOptions : function() {
         var opts = Button.superclass._modifyOptions.apply(this, arguments);
         opts.cssClassName += ' controls-Button';
         opts.cssClassName += ' controls-Button-size__' + (!!opts.size ? opts.size : 'default');
         opts.cssClassName += ' controls-Button-color__' + (!!opts.primary ? 'primary' : 'default');
         opts.cssClassName += (!!opts.primary ? ' controls-Button__primary' : '');
         return opts;
      },
      show: function(){
         // если кнопка скрыта при построение, то она не зарегистрируется дефолтной,
         // поэтому при показе такой кнопки регистрируем её как дефолтную
         var oldVisible = this.isVisible();

         Button.superclass.show.call(this);
         if (!oldVisible && this.isPrimary()) {
            this.setDefaultButton(true);
         }
      }
   });

      return Button;

   });