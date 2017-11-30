/**
 * Created by ad.chistyakova on 05.10.2015.
 */
define('js!SBIS3.CONTROLS.FilterMixin', [
   "Core/core-clone",
   "Core/core-merge",
   "js!SBIS3.CONTROLS.FilterButton.FilterToStringUtil",
   "Core/helpers/String/ucFirst",
   "Core/helpers/Object/find"
], function (coreClone, cMerge, FilterToStringUtil, ucFirst, objectFind) {


   var FILTER_STRUCTURE_DEFAULT_ELEMENT = {
      internalValueField: null,
      internalCaptionField: null,
      internalVisibilityField: null
      /* По умолчанию их нет
       value: NonExistentValue,
       resetValue: NonExistentValue,
       customValue: NonExistentValue,
       resetCustomValue: NonExistentValue,
       caption: NonExistentValue,
       resetCaption: NonExistentValue,
       */
   };

   function propertyUpdateWrapper(func) {
      return function() {
         return this.runInPropertiesUpdate(func, arguments);
      };
   }
    /**
     * Миксин, задающий любому контролу поведение работы с набором фильтров.
     * @mixin SBIS3.CONTROLS.FilterMixin
     * @public
     * @author Крайнов Дмитрий Олегович
     */
   var FilterMixin = /**@lends SBIS3.CONTROLS.FilterMixin.prototype  */{
      /**
       * @event onResetFilter Происходит при сбросе фильтра.
       * @remark
       * Значения структуры value сбрасываются в resetValue.
       * @param {Core/EventObject} eventObject Дескриптор события.
       * @param {Boolean} internal Значения были сброшены только на панели фильтрации.
       */
      $protected: {
         _options: {
            /**
             * @typedef {Array} filterStructure
             * @property {String} internalValueField Название поля, которое хранит значение элемента. По умолчанию null.
             * @property {String} internalCaptionField Название поля, которое хранит текстовое отображение значения. По умолчанию null.
             * @property {String} internalVisibilityField Название поля, которое хранит отображение элемента в зависимости от значения. По умолчанию null.
             * @property {String} caption Текущее текстовое отображение значения. Может быть не определено.
             * @property {Object} visibilityValue ТТекущее состояние отображения элемента. Может быть не определено.
             * @property {null|Object|String|Boolean|Number} value Текущее значение элемента. Может быть не определено.
             * @property {null|Object|String|Boolean|Number} resetValue Значение поля при сбрасывании фильтра, или при пустом значении в value. Может быть не определено.
             * @property {Boolean} resetVisibilityValue Значение поля при сбрасывании фильтра, или при пустом значении в value. Может быть не определено.
             * @property {String} resetCaption Текст по умолчанию. Если задали, то при пустом (или заданном в resetValue) значении будет
             * отображаться заданный здесь текст. Может быть не определено.
             * @translatable caption resetCaption
             */
            /**
             * @cfg {filterStructure[]} Устанавливает структуру элементов фильтра.
             * @remark
             * Примеры и подробное описание использования опции вы можете найти <a href='/doc/platform/developmentapl/interface-development/components/list/list-settings/filtering/list-filterbutton/fbstructure/'>здесь</a>.
             */
            filterStructure: [ /*filterStructureElementDef*/ ],
            /**
             * @cfg {String} Устанавливает поле в контексте, в котором будет храниться внутренний фильтр компонента.
             * @remark
             * Если на одной форме, в одном контексте лежит несколько хлебных фильтров, то только в этом случае стоит менять стандартное имя.
             * @example
             * <pre class="brush:xml">
             *     <option name="internalContextFilterName">sbis3-controls-fast-filter</option>
             * </pre>
             */
            internalContextFilterName : 'sbis3-controls-filter-button'
         }
      },

      $constructor: function () {
         this._updateFilterStructure(this._options.filterStructure || {});
      },
      _syncContext: function(fromContext) {
         var context = this._getCurrentContext(),
             contextName = this.getProperty('internalContextFilterName');

         if (fromContext) {
            this._updateFilterStructure(
                undefined,
                context.getValue(contextName + '/filter'),
                context.getValue(contextName + '/caption')
            );
         }
      },

      _notifyFilterUpdate: function() {
         this._notifyOnPropertyChanged('filter');
         this._notifyOnPropertyChanged('filterStructure');
      },

      _notifyOnApplyFilter: function() {
         this._notify('onApplyFilter');
         this._notifyFilterUpdate();
      },

       /**
        * Применяет фильтр, который формируется из значений на панели фильтров.
        */
      applyFilter: propertyUpdateWrapper(function() {
         this._syncContext(true);
         this._notifyOnApplyFilter();
      }),

       /**
        * Устанавливает структуру, стреляет событием об применении фильтров.
        * @param structure
        * @private
        */
       _setFilterStructure: function(structure) {
          this._updateFilterStructure(structure);
          this._notifyOnApplyFilter();
       },

      _updateFilterStructure: function(filterStructure, filter, captions, visibility) {
         var processElementVisibility = function(elem) {
            var isEqual, hasResetVal;

            if(elem.hasOwnProperty('internalVisibilityField')) {
               isEqual = FilterToStringUtil.isEqualValues(elem.value, elem.resetValue);
               hasResetVal = elem.hasOwnProperty('resetVisibilityValue');

               if(elem.hasOwnProperty('value')) {
                  /* Если value === resetValue, то поле видимости берём из resetVisibilityValue,
                     чтобы была возможность задать видимость по-умолчанию */
                  if(hasResetVal && isEqual) {
                     elem.visibilityValue = elem.resetVisibilityValue;
                  } else {
                     elem.visibilityValue = !isEqual;
                  }
               } else {
                  elem.visibilityValue = hasResetVal ? elem.resetVisibilityValue : false;
               }
            }
         };

         if (filterStructure) {
            this._filterStructure = filterStructure.map(function(element) {
               var newEl;

               if(typeof element.internalValueField !== 'string') {
                  throw new Error('У элемента структуры должно быть поле internalValueField');
               }

               newEl = cMerge(coreClone(FILTER_STRUCTURE_DEFAULT_ELEMENT), element);

               if (!newEl.internalCaptionField) {
                  newEl.internalCaptionField = newEl.internalValueField;
               }

               processElementVisibility(newEl);

               return newEl;
            });
         }
         if (filter) {
            this._filterStructure = this._filterStructure.map(function(element) {
               var newElement = coreClone(element),
                   field = newElement.internalValueField;

               function setDescriptionWithReset(description, deleteDescription) {
                  var hasResetValue = element.hasOwnProperty('resetValue'),
                      hasInternalValue = filter.hasOwnProperty(field);

                  if((hasResetValue && hasInternalValue && FilterToStringUtil.isEqualValues(element.resetValue, filter[field])) || (!hasResetValue && !hasInternalValue)) {

                     if (element.hasOwnProperty('resetCaption')) {
                        newElement.caption = element.resetCaption;
                     } else {
                        delete newElement.caption;
                     }
                  } else if(deleteDescription) {
                     delete newElement.caption;
                  } else {
                     /* В эту ветку попадаем, если установлен value, и не установлен caption,
                        если caption не установлен, то его надо каждый раз обновлять из value. */
                     if(element.caption && element.caption === element.value && description === element.value) {
                        newElement.caption = newElement.value;
                     } else {
                        newElement.caption = description;
                     }
                  }
               }


               if(filter.hasOwnProperty(field)) {
                  newElement.value = filter[field];
               } else {
                  delete newElement.value;
               }

               if (captions && (captions.hasOwnProperty(field))) {
                  setDescriptionWithReset(captions[field]);
               } else if (filter.hasOwnProperty(field)) {
                  setDescriptionWithReset(filter[field]);
               } else {
                  setDescriptionWithReset(undefined, true);
               }

               processElementVisibility(newElement);

               return newElement;
            });
         }
         this._recalcInternalContext();
      },

      _getFilterSctructureItemIndex : function(field){
         for (var i = 0; i < this._filterStructure.length; i++) {
            if (this._filterStructure[i].internalValueField === field) {
               return i;
            }
         }
         return -1;
      },
      _findFilterStructureElement: function(func) {
         return objectFind(this._filterStructure, function(element) {
            return func(element);
         });
      },

      _recalcInternalContext: function() {
         this.getLinkedContext().setValueSelf({
            filterChanged: this._filterStructure.reduce(function(result, element) {
               return result || (element.hasOwnProperty('value') ? !FilterToStringUtil.isEqualValues(element.resetValue, element.value) : false);
            }, false),
            filterStructure: this._filterStructure,
            filterResetLinkText: this.getProperty('resetLinkText')
         });
      },

      _resetFilter: function(internalOnly, partial) {
         var context = this._getCurrentContext(),
             resetFilter = this.getResetFilter(partial),
             resetCaption = this._getResetCaption(partial),
             toSet = {};

         /* Синхронизация св-в должна происходить один раз, поэтому делаю обёртку */
         propertyUpdateWrapper(function() {
            if (context) {
               toSet[this._options.internalContextFilterName] = {
                  caption: resetCaption,
                  filter: resetFilter,
                  visibility: this.getResetVisibilityValue()
               };
               context.setValueSelf(toSet);
            }

            if (!internalOnly) {
               this._updateFilterStructure(undefined, resetFilter, resetCaption);
               this._notifyFilterUpdate();
            }
         }).call(this);

         this._notify('onResetFilter', !!internalOnly, partial);
      },

      _getCurrentContext : function(){
         /*Must be implemented!*/
      },

      setFilter: function() {
         throw new Error('Свойство "filter" работает только на чтение. Менять его надо через метод setFilterStructure');
      },

      setFilterStructure: propertyUpdateWrapper(function(filterStructure) {
         this._options.filterStructure = filterStructure;
         this._updateFilterStructure(filterStructure);
         this._syncContext(false);
         this._notifyFilterUpdate();
      }),

      _mapFilterStructureByProp: function(prop) {
         return this._filterStructure.reduce(function(result, element) {
            if (element.hasOwnProperty(prop)) {
               result[element.internalValueField] = element[prop];
            }
            return result;
         }, {});
      },

      _mapFilterStructureByVisibilityField: function(prop) {
         return this._filterStructure.reduce(function(result, element) {
            if(element.internalVisibilityField) {
               if (element.hasOwnProperty(prop)) {
                  result[element.internalVisibilityField] = element[prop];
               } else {
                  result[element.internalVisibilityField] = element.hasOwnProperty('resetVisibilityValue') ? element.resetVisibilityValue : false;
               }
            }
            return result;
         }, {});
      },

      /**
       * Собирает значения для сброса по value / caption
       * @returns {*}
       * @private
       */
      _mapFilterStructureByResetValue: function(partial, prop) {
         var resetProp = 'reset' + ucFirst.call(prop),
             isPartial, ivf;
         
         return this.getFilterStructure().reduce(function(result, element) {
            isPartial = partial && element.itemTemplate === null && element.historyItemTemplate !== null && element.hasOwnProperty(prop);
            ivf = element.internalValueField;

            if (element.hasOwnProperty(resetProp)) {
               /* Надо смотреть только на itemTemplate, но сейчас есть проблема с компонентом dateRange,
                  который делают через две дополнительные структуры и его сбрасывать надо. Как будет сделан компонент,
                  который может отображать дату по стандарту в фильтра FIXME удалить "element.historyItemTemplate !== null" */
               if (isPartial) {
                  result[ivf] = element[prop];
               } else {
                  result[ivf] = element[resetProp];
               }
            } else if (isPartial) {
               result[ivf] = element[prop];
            }
            return result;
         }, {});
      },
   
       /**
        * Возвращает объект собраный из элементов стрктуры:
        * {
        *    key (internalValueField) : value,
        *    ...
        * }
        * @returns {Object}
        *
        * @see filterStructure
        * @see setFilterStructure
        */
      getFilter: function() {
         return this._getFilter(false);
      },
      
      _getFilter: function(byInternal) {
         return this._filterStructure.reduce(function(result, element) {
            if (element.hasOwnProperty('value')) {
               /* FIXME для внедрения в задачах используется filterField, т.к. у них internalValueField не совпадает
                  с полем фильтра */
               result[byInternal ? element.internalValueField : (element.filterField || element.internalValueField)] = coreClone(element.value); // если не склонировать, кто-то может поменять по ссылке и испортит фильтр
            }
            return result;
         }, {});
      },

      getResetVisibilityValue: function() {
         return this._mapFilterStructureByVisibilityField('resetVisibilityValue');
      },

      getFilterStructure: function() {
         return this._filterStructure;
      },
   
      getResetFilter: function(partial) {
         return this._mapFilterStructureByResetValue(partial, 'value');
      },
   
      _getResetCaption: function(partial) {
         return this._mapFilterStructureByResetValue(partial, 'caption');
      }
    };

   return FilterMixin;

});