/**
 * Created by am.gerasimov on 19.10.2015.
 */

define('js!SBIS3.CONTROLS.SelectorMixin', [],
   function () {

      'use strict';

      /**
       * Описание логики выбора из диалога/панели.
       * SelectorMixin используется полем связи.
       * @mixin
       * @public
       * @author Крайнов Дмитрий Олегович
       */
      var SelectorMixin = /**@lends SBIS3.CONTROLS.SelectorMixin.prototype  */{
         $protected: {
            _linkedView: null,
            _selectionConfirmHandler: undefined,
            _dRender: null,
            _options: {
               /**
                * @cfg {Boolean} Устанавливает режим множественного выбора элементов коллекции.
                * Подробно режим множественного выбора описан {@link SBIS3.CONTROLS.MultiSelectable#multiselect здесь}.
                * @variant true Режим множественного выбора элементов коллекции установлен.
                * @variant false Режим множественного выбора элементов коллекции отменен.
                * @example
                * <pre>
                *     <option name="multiSelect">true</option>
                * </pre>
                */
               multiSelect: false,
               /**
                * cfg {Array} Устанавливает выбранными элементы коллекции по переданным первичным ключам.
                * @remark
                * Устанавливает выбранными элементы коллекции, которым соответствуют переданные в массиве идентификаторы.
                * Опция актуальна для контрола, который находится в режиме множественного выбора значений (см. опцию {@link SBIS3.CONTROLS.MultiSelectable#multiselect}).
                * @example
                * <pre class="brush: xml">
                *     <options name="currentSelectedKeys" type="array">
                *         <option>2</option>
                *         <option>8</option>
                *     </options>
                * </pre>
                */
               currentSelectedKeys: [],
               /**
                * cfg {function} Устанавливает обработчик на закрытие диалога/всплывающей панели выбора элементов коллекции.
                */
               closeCallback: undefined
            }
         },
         $constructor: function () {
            var self = this;

            /* Подпишемся на готовность диалога/всплывающей панели */
            if (!(self._dRender instanceof $ws.proto.Deferred)) {
               self._dRender = new $ws.proto.Deferred();
               self.subscribe('onAfterLoad', function () {
                  self._dRender.callback();
               });
            }

            this._changeSelectionHandler = function (event, result) {
               if(!self._options.multiSelect) {
                  self.close([result.item]);
               }
            };

            this._dRender.addCallback(function(){
               var childControls = self.getChildControls();

               for(var i = 0, l = childControls.length; i < l; i++){
                  var childControl = childControls[i];

                  if($ws.helpers.instanceOfModule(childControl, 'SBIS3.CONTROLS.ListView')){
                     self.setLinkedView(childControl);
                     break;
                  }
               }
            });
         },

         _toggleLinkedViewEvents: function(sub) {
            this._options.multiSelect ?
               this[sub ? 'subscribeOnceTo' : 'unsubscribeFrom'](this._linkedView, 'onDrawItems', this._linkedView.setSelectedKeys.bind(this._linkedView, this._options.currentSelectedKeys)) :
               this[sub ? 'subscribeTo' : 'unsubscribeFrom'](this._linkedView, 'onItemActivate', this._changeSelectionHandler);
         },

         /**
          * Устанавливает связанное представление данных для этого диалога выбора.
          * @param {SBIS3.CONTROLS.ListView} linkedView Экземпляр класса контрола представления данных.
          * @example
          * <pre>
          *     var dataView = this.getTopParent().getChildByName('myNewCreatedBrowser');
          *         this.setLinkedView(dataView);
          * </pre>
          * @see getLinkedView
          */
         setLinkedView: function (linkedView) {
            this._linkedView && this._toggleLinkedViewEvents(false);
            this._linkedView = linkedView;

            if (linkedView) {
               this._linkedView.setProperty('multiselect', this._options.multiSelect);
               this._linkedView.setSelectedKeys(this._options.currentSelectedKeys);
               this._toggleLinkedViewEvents(true);
               this._linkedView.reload();
            }
         },

         /**
          * Получает связанное представление данных для этого диалога выбора.
          * @returns {SBIS3.CONTROLS.ListView} Экземпляр класса контрола представления данных.
          * @example
          * <pre>
          *     var dataView;
          *     if (this.getLinkedView().getName() !== 'myNewCreatedBrowser') {
          *         dataView = this.getTopParent().getChildByName('myNewCreatedBrowser');
          *         this.setLinkedView(dataView);
          *     }
          * </pre>
          * @see setLinkedView
          */
         getLinkedView: function () {
            return this._linkedView;
         },

         before: {
            close: function (value) {
               if (typeof this._options.closeCallback === 'function') {
                  this._options.closeCallback(value);
               }
            }
         }
      };

      return SelectorMixin;

   });
