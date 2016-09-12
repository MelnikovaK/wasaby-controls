/*global define, $ws*/
define('js!SBIS3.CONTROLS.Action.List.Sum', [
        'js!SBIS3.CONTROLS.Action.Action',
        'js!SBIS3.CONTROLS.Action.List.ListMixin',
        'js!SBIS3.CONTROLS.Action.DialogMixin',
        'js!WS.Data/Source/SbisService',
        'js!WS.Data/Entity/Model',
        'js!WS.Data/Adapter/Sbis'
    ],
    function (ActionBase, ListMixin, DialogMixin, SbisService, Model) {
        'use strict';
        /**
         * Класс суммирования полей в списке
         * @class SBIS3.CONTROLS.Action.List.Sum
         * @public
         * @extends SBIS3.CONTROLS.Action.Action
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
        var Sum = ActionBase.extend([ListMixin, DialogMixin], /** @lends SBIS3.CONTROLS.Action.List.Sum.prototype */{
            $protected: {
                _options: {
                    template : 'js!SBIS3.CONTROLS.SumDialogTemplate',
                    /**
                     * @cfg {Object} Поля для суммирования
                     * @remark
                     * Поля для суммирования - это те поля, по которым производится суммирование значений записей.
                     * Для суммирования подходят поля типов "Число целое", "Число вещественное" и "Деньги".
                     *
                     * Результат суммирования по полю выводится в отдельном диалоговом окне напротив названия поля.
                     * Отображаемое название можно изменить, задав альтернативное имя при конфигурации полей суммирования.
                     *
                     * Если в fields не задать столбец для суммирования, то посчитается количество выбранных записей.
                     * @example
                     * 1. Структура объекта, описывающего поля для суммирования.
                     * <pre>
                     *    <options name="fields">
                     *       //задаём поле суммирования в виде <option name="ИмяПоля">АльтернативноеИмя</option>
                     *       <option name="ИтогПр">Сумма</option>
                     *    </options>
                     * </pre>
                     * 2. Задать три поля для суммирования.
                     * <pre>
                     *    fields: {
                     *       //имя поля "ЗарПлат" хотим отображать в диалоговом окне как "Заработная плата"
                     *       'ЗарПлат': 'Заработная плата',
                     *       //имя поля "Число". Альтернативное имя не определено. В диалоговом окне имя поля отобразится как "Число"
                     *       'Число': undefined
                     *    }
                     * </pre>
                     * @see setFields
                     * @see getFields
                     */
                    fields: {}
                }
            },
            _doExecute: function () {
                var self = this;
                return this._sum().addCallback(function(item) {
                    if ($ws.helpers.instanceOfModule(item, 'WS.Data/Source/DataSet')) {
                        item = item.getRow();
                    }
                    return self._opendEditComponent({
                        item: item
                    }, self._options.template);
                });
            },
            /**
             * Установить поля для суммирования.
             * @param {Object} fields Объект с описанием полей для суммирования.
             * @see getFields
             */
            setFields: function(fields) {
                this._options.fields = fields;
            },
            /**
             * Получить поля для суммирования.
             * @returns {Object} Объект с описанием полей для суммирования.
             * @see setFields
             */
            getFields: function() {
                return this._options.fields;
            },
            _buildComponentConfig: function(params) {
                return {
                    item: params.item,
                    fields: this._options.fields
                };
            },
            _sum: function() {
                var
                    source,
                    object = this.getLinkedObject(),
                    selectedItems = object.getSelectedItems(),
                    isSelected = selectedItems && selectedItems.getCount();
                if (isSelected) {
                    return this._sumField(selectedItems, object.getItems().getFormat());
                } else {
                    source = this.getDataSource();
                    return this._getSumSource().call('ПоМетоду', {
                        'Поля': Object.keys(this._options.fields),
                        'ИмяМетода': source.getEndpoint().contract + '.' + source.getBinding().query,
                        'Фильтр': Model.fromObject(object.getFilter(), 'adapter.sbis')
                    });
                }
            },

            _sumField: function(items, format) {
                var
                    i, resultFields = {},
                    fields = Object.keys(this._options.fields),
                    resultRecord = new Model({
                        adapter: 'adapter.sbis'
                    });
                for (i = 0; i < fields.length; i++) {
                    resultFields[fields[i]] = 0;
                }
                items.each(function(model) {
                    for (var i = 0; i < fields.length; i++) {
                        resultFields[fields[i]] += model.get(fields[i]);
                    }
                }, this);
                for (i = 0; i < fields.length; i++) {
                    resultRecord.addField(format.at(format.getFieldIndex(fields[i])), i, resultFields[fields[i]]);
                }
                return $ws.proto.Deferred.success(resultRecord);
            },

            _getSumSource: $ws.helpers.memoize(function() {
                return new SbisService({
                    endpoint: "Сумма"
                });
            })
        });
        return Sum;
    });