define('js!SBIS3.CONTROLS.Action.SelectorAction', [
       'js!SBIS3.CONTROLS.Action.Action',
       'js!SBIS3.CONTROLS.Action.DialogMixin',
       'Core/core-merge'
    ],
    function (Action, DialogMixin, сMerge) {
       'use strict';
       /**
       * Класс, который описывает действие открытия окна с заданным шаблоном.
       * Из этого окна можно осуществлять выбор.
       * @class SBIS3.CONTROLS.Action.SelectorAction
       * @public
       * @extends SBIS3.CONTROLS.Action.OpenDialog
       * @demo SBIS3.CONTROLS.Demo.DemoSelectorAction
       * @author Герасимов Александр Максимович
       */
       var SelectorAction = Action.extend([DialogMixin], {
          _buildComponentConfig: function(metaConfig) {
             var cfg = metaConfig.componentOptions || {},
                 chooseCfg = {
                    handlers: {
                       onSelectComplete: function(event, meta) {
                          this.sendCommand('close', meta);
                       }
                    },
                    selectedItems: metaConfig.selectedItems,
                    multiselect: metaConfig.multiselect,
                    selectionType: metaConfig.selectionType
                 };

             return сMerge(cfg, chooseCfg);
          },
          _doExecute: function(meta) {
             return this._openComponent(meta, meta.template || this._options.template || 'js!SBIS3.CONTROLS.SelectorDefaultComponent');
          }
       });
       return SelectorAction;
    });