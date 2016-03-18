define('js!SBIS3.CONTROLS.DialogActionBase', ['js!SBIS3.CONTROLS.ActionBase', 'js!SBIS3.CORE.Dialog', 'js!SBIS3.CORE.FloatArea'], function(ActionBase, Dialog, FloatArea){
   'use strict';

   /**
    * Действие открытия окна с заданным шаблоном
    * @class SBIS3.CONTROLS.DialogActionBase
    * @public
    * @extends SBIS3.CONTROLS.ActionBase
    * @author Крайнов Дмитрий Олегович
    *
    * @ignoreOptions validators independentContext contextRestriction extendedTooltip
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
    */
   var OpenDialogAction = ActionBase.extend(/** @lends SBIS3.CONTROLS.OpenDialogAction.prototype */{
      $protected : {
         _options : {
            /**
             * @cfg {String}
             * Компонент который будет отображен
             */
            dialogComponent : '',
            /**
             * @cfg {String}
             * @variant dialog в новом диалоге
             * @variant floatArea во всплывающей панели
             * Режим отображения компонента редактирования - в диалоге или панели
             */
            mode: 'dialog'
         }
      },

      execute : function(meta) {
         this._opendEditComponent(meta, this._options.dialogComponent);
      },

      _openDialog: function(meta, dialogComponent){
         this._opendEditComponent(meta, dialogComponent, 'dialog');
      },

      _openFloatArea: function(meta, dialogComponent){
         this._opendEditComponent(meta, dialogComponent, 'floatArea');
      },

      _opendEditComponent: function(meta, dialogComponent, mode){
         var self = this,
            config, Component,

         compOptions = this._buildComponentConfig(meta);
         config = {
            opener: this,
            template: dialogComponent,
            componentOptions: compOptions
         };

         mode = mode || this._options.mode;
         if (mode == 'floatArea'){
            Component = FloatArea;
            config.isStack = meta.isStack || true;
            config.autoHide = meta.autoHide || true;
         } else if (mode == 'dialog'){
            Component = Dialog;
         }

         new Component(config).subscribe('onAfterClose', function(e, meta){
            if (meta === true || Object.isValid(meta)) {
               self._notifyOnExecuted(meta, self._options.record);
            }
         });
      },

      _buildComponentConfig: function() {
         return {}
      }
   });
   return OpenDialogAction;
});