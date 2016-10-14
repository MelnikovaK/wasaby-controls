define('js!SBIS3.CONTROLS.OpenDialogAction', ['js!SBIS3.CONTROLS.DialogActionBase', 'Core/core-instance', 'Core/core-merge'], function(DialogActionBase, cInstance, cMerge){
   'use strict';

   /**
    * Класс, описывающий действие открытия окна с заданным шаблоном. Применяется для работы с диалогами редактирования списков.
    * Подробнее об использовании класса вы можете прочитать в разделе <a href="https://wi.sbis.ru/doc/platform/developmentapl/interfacedev/components/list/list-settings/records-editing/editing-dialog/component-control/">Управление диалогом редактирования списка.</a>.
    * @class SBIS3.CONTROLS.OpenDialogAction
    * @extends SBIS3.CONTROLS.DialogActionBase
    * @author Крайнов Дмитрий Олегович
    *
    * @ignoreOptions validators independentContext contextRestriction extendedTooltip
    * @ignoreOptions visible tooltip tabindex enabled className alwaysShowExtendedTooltip allowChangeEnable
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
    * @ignoreMethods setVisible toggle show isVisible hide getTooltip isAllowChangeEnable isEnabled isVisibleWithParents
    *
    * @ignoreEvents onActivate onAfterLoad onAfterShow onBeforeControlsLoad onBeforeLoad onBeforeShow onChange onClick
    * @ignoreEvents onFocusIn onFocusOut onKeyPressed onReady onResize onStateChanged onTooltipContentRequest
    * @ignoreEvents onDragIn onDragMove onDragOut onDragStart onDragStop
    *
    * @control
    * @public
    * @category Actions
    * @initial
    * <component data-component="SBIS3.CONTROLS.OpenDialogAction">
    * </component>
    */
   var OpenDialogAction = DialogActionBase.extend(/** @lends SBIS3.CONTROLS.OpenDialogAction.prototype */{
      _buildComponentConfig: function(meta) {
         var baseResult = OpenDialogAction.superclass._buildComponentConfig.apply(this, arguments);
         //Если запись в meta-информации отсутствует, то передаем null. Это нужно для правильной работы DataBoundMixin с контекстом и привязкой значений по имени компонента
         var record = (cInstance.instanceOfModule(meta.item, 'WS.Data/Entity/Record') ? meta.item.clone() : meta.item) || null,
             result = {
               source: meta.source,
               key : meta.id,
               initValues : meta.filter,
               record: record
            };
         cMerge(result, baseResult);
         //в дальнейшем будем мержить опции на этот конфиг и если в мете явно не передали dataSource
         //то в объекте не нужно создавать свойство, иначе мы затрем опции на FormController.
         if(meta.dataSource)
            result.dataSource = meta.dataSource;
         return result;
      }
   });
   OpenDialogAction.ACTION_CUSTOM = DialogActionBase.ACTION_CUSTOM;
   OpenDialogAction.ACTION_MERGE = DialogActionBase.ACTION_MERGE;
   OpenDialogAction.ACTION_ADD = DialogActionBase.ACTION_ADD;
   OpenDialogAction.ACTION_RELOAD = DialogActionBase.ACTION_RELOAD;
   OpenDialogAction.ACTION_DELETE = DialogActionBase.ACTION_DELETE;
   OpenDialogAction.INITIALIZING_WAY_LOCAL = DialogActionBase.INITIALIZING_WAY_LOCAL;
   OpenDialogAction.INITIALIZING_WAY_REMOTE = DialogActionBase.INITIALIZING_WAY_REMOTE;
   OpenDialogAction.INITIALIZING_WAY_DELAYED_REMOTE = DialogActionBase.INITIALIZING_WAY_DELAYED_REMOTE;
   return OpenDialogAction;
});