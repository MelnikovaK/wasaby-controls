define('js!SBIS3.CONTROLS.FieldLink',
    [
       'js!SBIS3.CONTROLS.SuggestTextBox',
       'js!SBIS3.CONTROLS.DSMixin',
       'js!SBIS3.CONTROLS.MultiSelectable',
       'js!SBIS3.CONTROLS.ActiveMultiSelectable',
       'js!SBIS3.CONTROLS.Selectable',
       'js!SBIS3.CONTROLS.ActiveSelectable',
       'js!SBIS3.CONTROLS.SyncSelectionMixin',
       'js!SBIS3.CONTROLS.FieldLinkItemsCollection',
       'html!SBIS3.CONTROLS.FieldLink/afterFieldWrapper',
       'html!SBIS3.CONTROLS.FieldLink/beforeFieldWrapper',
       'js!SBIS3.CONTROLS.Data.Model',
       'js!SBIS3.CONTROLS.Utils.DialogOpener',
       'js!SBIS3.CONTROLS.ITextValue',
       'js!SBIS3.CONTROLS.Utils.TemplateUtil',
       'js!SBIS3.CONTROLS.MenuIcon'

    ],
    function (
        SuggestTextBox,
        DSMixin,

        /* Интерфейс для работы с набором выбранных записей */
        MultiSelectable,
        ActiveMultiSelectable,
        /****************************************************/

        /* Интерфейс для работы с выбранной записью */
        Selectable,
        ActiveSelectable,
        /********************************************/

        SyncSelectionMixin,
        FieldLinkItemsCollection,
        afterFieldWrapper,
        beforeFieldWrapper,
        Model,
        DialogOpener,
        ITextValue,
        TemplateUtil
    ) {

       'use strict';

       var INPUT_WRAPPER_PADDING = 11;
       var SHOW_ALL_LINK_WIDTH = 11;
       var INPUT_MIN_WIDTH = 100;

       /**
        * Поле связи - это базовый контрол веб-фреймворка WS, который предназначен для выбора нескольких значений.
        * Выбор значений можно производить из справочников, подробнее о которых вы можете прочитать в описании к опции {@link dictionaries}.
        * Другой способ выбора значений - это использование автодополнения, подробнее о котором вы можете прочитать в опции {@link list}.
        * Для корректного отображения поля связи требуется задавать компоненту фиксированную или минимальную ширину.
        * @class SBIS3.CONTROLS.FieldLink
        * @extends SBIS3.CONTROLS.SuggestTextBox
        * @category Inputs
        * @mixes SBIS3.CONTROLS.Selectable
        * @mixes SBIS3.CONTROLS.MultiSelectable
        * @mixes SBIS3.CONTROLS.ActiveSelectable
        * @mixes SBIS3.CONTROLS.ActiveMultiSelectable
        * @mixes SBIS3.CONTROLS.ChooserMixin
        * @mixes SBIS3.CONTROLS.FormWidgetMixin
        * @mixes SBIS3.CONTROLS.SyncSelectionMixin
        * @mixes SBIS3.CONTROLS.DSMixin
        * @demo SBIS3.CONTROLS.Demo.FieldLinkWithEditInPlace Поле связи с редактированием по месту. Данные для источника передаются в JSON-RPC формате
        * @demo SBIS3.CONTROLS.Demo.FieldLinkDemo Разные варианты конфигураций для поля связи
        * @cssModifier controls-FieldLink__itemsEdited В поле связи при наведении курсора на выбранные значения применяется подчеркивание текста.
        * @cssModifier controls-FieldLink__itemsBold В поле связи для текста выбранных значений применяется полужирное начертание.
        * @control
        * @public
        * @author Крайнов Дмитрий Олегович
        * @ignoreOptions tooltip alwaysShowExtendedTooltip loadingContainer observableControls pageSize usePicker filter saveFocusOnSelect
        * @ignoreOptions allowEmptySelection allowEmptyMultiSelection templateBinding includedTemplates resultBindings showAllConfig footerTpl
        * @ignoreMehtods getTooltip setTooltip getExtendedTooltip setExtendedTooltip
        *
        * ignoreEvents onDataLoad onDataLoadError onBeforeDataLoad onDrawItems
        */

       var FieldLink = SuggestTextBox.extend([MultiSelectable, ActiveMultiSelectable, Selectable, ActiveSelectable, SyncSelectionMixin, DSMixin, ITextValue],/** @lends SBIS3.CONTROLS.FieldLink.prototype */{
          /**
           * @event onItemActivate Происходит при клике по выбранному элементу коллекции.
           * @param {$ws.proto.EventObject} eventObject Дескриптор события.
           * @param {Object} meta Объект, описывающий метаданные события. В его свойствах передаются идентификатор и экземпляр выбранного значения.
           * @param {String} meta.id Идентификатор выбранного значения.
           * @param {SBIS3.CONTROLS.Record} meta.item Экземпляр класса выбранного значения.
           */
          $protected: {
             _inputWrapper: undefined,     /* Обертка инпута */
             _linksWrapper: undefined,     /* Контейнер для контрола выбранных элементов */
             _dropAllButton: undefined,    /* Кнопка очистки всех выбранных записей */
             _showAllLink: undefined,      /* Кнопка показа всех записей в пикере */
             _linkCollection: undefined,   /* Контрол отображающий выбранные элементы */
             _checkWidth: true,
             _afterFieldWrapper: undefined,
             _beforeFieldWrapper: undefined,
             _options: {
                /* Служебные шаблоны поля связи (иконка открытия справочника, контейнер для выбранных записей */
                afterFieldWrapper: afterFieldWrapper,
                beforeFieldWrapper: beforeFieldWrapper,
                /**********************************************************************************************/
                 list: {
                   component: 'js!SBIS3.CONTROLS.DataGridView',
                   options: {
                      showHead: false,
                      columns: []
                   }
                },
                /**
                 * @typedef {Object} Dictionaries Группа опций, описывающая настройку одного или нескольких справочников для поля связи.
                 * Справочник - это диалог выбора значений. Список значений диалога строится на основе любого компонента, который можно
                 * использовать для {@link https://wi.sbis.ru/doc/platform/developmentapl/interfacedev/components/list/ отображения данных в списках}.
                 * @property {String} caption Текст в меню выбора справочников. Опция актуальна, когда для поля связи установлено несколько справочников.
                 * Открыть справочник можно через меню выбора справочников или с помощью метода {@link showSelector}.
                 * Меню выбора справочников - это кнопка, которая расположена внутри поля связи с правого края:
                 * ![](/FieldLink03.png)
                 * Изменять положение этой кнопки нельзя. Когда для поля связи установлен только один справочник,
                 * клик по кнопке меню производит его открытие. Когда для поля связи установлено несколько справочников,
                 * клик по меню открывает подменю для выбора нужного справочника. Опция caption определяет название
                 * справочника в этом подменю:
                 * ![](/FieldLink02.png)
                 * @property {String} template Компонент, на основе которого организован справочник.
                 * Список значений справочника строится на основе любого компонента, который можно использовать
                 * для {@link https://wi.sbis.ru/doc/platform/developmentapl/interfacedev/components/list/ отображения данных в списках}:
                 * - использование компонента {@link SBIS3.CONTROLS.DataGridView}:
                 * ![](/FieldLink00.png)
                 * - использование компонента {@link SBIS3.CONTROLS.TreeDataGridView}:
                 * ![](/FieldLink01.png)
                 * @property {Object} componentOptions
                 * Группа опций, которые передаются в секцию _options компонента из опции template. На его основе строится справочник.
                 * Значения переданных опций можно использовать в дочерних компонентах справочника через инструкции шаблонизатора.
                 * Например, передаём опции для построения справочника:
                 * <pre class="brush: xml">
                 *     <option name="template">js!SBIS3.MyArea.MyDatGridView</option>
                 *     <options name="componentOptions" type="array">
                 *        <option name="myShowHeadConfig" type="boolean">true</option>
                 *        <option name="myPageSizeConfig" type="number">5</option>
                 *     </options>
                 * </pre>
                 * При построении справочника на основе SBIS3.MyArea.MyDatGridView значения опций myShowHeadConfig и myPageSizeConfig
                 * будут переданы в его секцию _options.
                 * Они переопределят уже установленные значения опций, если такие есть.
                 * Чтобы использовать значений опций в дочерних контролах компонента SBIS3.MyArea.MyDatGridView,
                 * нужно использовать инструкции шаблонизатора в вёрстке компонента:
                 * <pre class="brush: xml">
                 *     <component data-component="SBIS3.CONTROLS.TreeCompositeView" name="browserView">
                 *        <option name="showHead">{{=it.myShowHeadConfig}}</option>
                 *        <option name="pageSize">{{=it.myPageSizeConfig}}</option>
                 *         . . .
                 *     </component>
                 * </pre>
                 * @translatable caption
                 */
                /**
                 * @cfg {Array.<Dictionaries>} Устанавливает справочники для поля связи.
                 * @remark
                 * Справочник - это диалог выбора значений. Набор значений диалога строится на основе любого компонента,
                 * который можно использовать для {@link https://wi.sbis.ru/doc/platform/developmentapl/interfacedev/components/list/ отображения данных в списках}.
                 *
                 * Подробнее об опциях справочника вы можете прочитать {@link SBIS3.CONTROLS.FieldLink/Dictionaries.typedef здесь}.
                 *
                 * Открыть справочник можно через меню выбора справочников или с помощью метода {@link showSelector}.
                 * Когда для поля связи установлен только один справочник, клик по кнопке меню производит его открытие.
                 * Когда для поля связи установлено несколько справочников, клик по кнопке меню открывает подменю для выбора
                 * нужного справочника.
                 *
                 * Опишем основные шаги в настройке справочника для поля связи:
                 *
                 * 1. Организуем компонент, на основе которого будет построен набор значений диалога выбора для поля связи.
                 *    Компонент, который будет использован для построения диалога выбора значений, как правило строится на основе списочных контролов.
                 *    Например, DataGridView или TreeGridView. Его настройки не требуют какой-то специфики.
                 *
                 * 2. Для организованного компонента:
                 *    1. {@link https://wi.sbis.ru/doc/platform/developmentapl/workdata/binding-data-and-views/ Определим} и {@link https://wi.sbis.ru/doc/platform/developmentapl/workdata/logicworkapl/logic/source/ зададим} источник данных.
                 *    2. Определим режим выбора записей: единичный или множественный.
                 *       Если поле связи будет установлено в режим единичного выбора значений, списочный контрол также следует
                 *       установить в тот же режим работы. Выбор значения будет производиться кликом по нужному элементу списка.
                 *       Если поле связи будет установлено в режим множественного выбора значений, списочный контрол также следует
                 *       установить в тот же режим работы с помощью опции {@link multiselect}.
                 *       Чтобы передать в поле связи набор выбранных значений в режиме множественного выбора, можно использовать
                 *       обработчик на событие клика по кнопке. В качестве кнопки используют различные классы.
                 *       Например, для {@link SBIS3.CONTROLS.Button} обработчик должен выглядеть следующим образом:
                 *       <pre>
                 *           this.getChildControlByName('Button').subscribe('onActivated', function() {
                 *              self.sendCommand('close', MyDataGridView.getSelectedKeys());  // Вторым аргументом передаём набор идентификаторов выбранных элементов
                 *           });
                 *       </pre>
                 *       Чтобы кнопка выбора была удобно размещена в верхней части всплывающей панели, в вёрстке компонента
                 *       нужно использовать контейнер с классом "ws-window-titlebar-custom". Это внутренний CSS-класс. В
                 *       содержимое контейнера можно разместить контролы, которые будут отображены над содержимым списка.
                 *       <pre class="brush: xml">
                 *          <div class="ws-window-titlebar-custom"> <!-- На данный элемент установлен служебный CSS-класс, который прижимает его к верху диалога выбора -->
                 *             <component data-component="SBIS3.CONTROLS.Button" name="SelectButton" class="controls-demo-FieldLinkDemoTemplate__SelectButton"> <!-- Конфигурация кнопки, используется для подтверждения выбранных значений -->
                 *                <option name="caption">Выбрать</option> <!-- Устанавливаем подпись на кнопке -->
                 *             </component>
                 *          </div>
                 *       </pre>
                 *
                 * 3. Настраиваем справочник в поле связи. Организованный компонент указываем в опции {@link SBIS3.CONTROLS.FieldLink/Dictionaries.typedef template}:
                 *    <pre class="brush: xml">
                 *        <options name="dictionaries" type="array">
                 *           <options>
                 *              <option name="template">js!SBIS3.MyArea.MyDict01</option>
                 *              . . .
                 *           </options>
                 *        </options>
                 *    </pre>
                 *
                 * Когда для поля связи требуется выбор данных из нескольких справочников, нужно организовать несколько компонентов.
                 * В настройках справочников для поля связи, в опции {@link SBIS3.CONTROLS.FieldLink/Dictionaries.typedef caption} для каждого компонента следует указать название,
                 * которое определит его название в меню выбора нужного справочника:
                 * <pre class="brush: xml">
                 *     <options name="dictionaries" type="array">
                 *        <options>
                 *           <option name="caption">Филиал 1</option>
                 *           <option name="template">js!SBIS3.MyArea.MyDict01</option>
                 *           . . .
                 *        </options>
                 *        <options>
                 *           <option name="caption">Филиал 2</option>
                 *           <option name="template">js!SBIS3.MyArea.MyDict02</option>
                 *           . . .
                 *        </options>
                 *     </options>
                 * </pre>
                 *
                 * Открывается справочник либо в новом окне, либо во всплывающей панели; нужный режим можно
                 * установить с помощью опции {@link chooserMode}.
                 * Установить набор справочников для поля связи можно с помощью метода {@link setDictionaries}.
                 * @example
                 * Настройка двух справочников для выбора в поле связи:
                 * ![](/FieldLink02.png)
                 * Фрагмент верстки:
                 * <pre class="brush: xml">
                 *     <options name="dictionaries" type="array">
                 *        <options>
                 *           <option name="caption">Сотрудники</option>
                 *           <option name="template">js!SBIS3.MyArea.DictEmployees</option>
                 *        </options>
                 *        <options>
                 *           <option name="caption">Партнеры</option>
                 *           <option name="template">js!SBIS3.MyArea.DictPartners</option>
                 *        </options>
                 *     </options>
                 * </pre>
                 * @see setDictionaries
                 * @see chooserMode
                 */
                dictionaries: [],
                /**
                 * @cfg {Boolean}  Устанавливает режим добавления комментариев в поле связи.
                 * * true Разрешается ввод комментариев в поле связи.
                 * * false Запрещается ввод комментариев в поле связи.
                 * @remark
                 * Опция позволяет установить режим работы поля связи, в котором после выбора значения допускается добавление комментариев внутри поля ввода.
                 * Добавление комментариев поддерживается только, когда поле связи установлено в режим единичного выбора значений.
                 * Режим единичного или множественого выбора значений в поле связи устанавливается опцией {@link multiselect}.
                 * До момента ввода комментария справа от выбранного значения в поле связи будет отображаться текст, настраиваемый в опции {@link placeholder}.
                 * @example
                 * Пример настройки режима добавления комментария в поле связи:
                 * фрагмент верстки:
                 * <pre class="brush: xml">
                 *     <option name="alwaysShowTextBox">true</option>
                 * </pre>
                 * иллюстрация работы:
                 * ![](/FieldLink04.png)
                 * @deprecated
                 */
                alwaysShowTextBox: false,
                /**
                 * @cfg {String} Устанавливает шаблон, по которому будет построено отображение каждого выбранного значения в поле связи.
                 * @remark
                 * Шаблон - это вёрстка, по которой будет построено отображение каждого выбранного значения в поле связи.
                 * Внутри шаблона допускается использование {@link https://wi.sbis.ru/doc/platform/developmentapl/interfacedev/core/component/xhtml/template конструкций шаблонизатора}.
                 * Шаблон может быть реализован отдельным XHTML-файлом.
                 * В этом случае чтобы передать его содержимое в опцию, он должен быть подключен в массив зависимостей компонента (см. примеры).
                 * @example
                 * Пример 1. Шаблон создан в отдельном XHTML-файле. Сначала его нужно подключить в массив зависимостей компонента,
                 * затем в опции указать путь до шаблона.
                 * <pre class="brush: xml">
                 *     <option name="itemTemplate" type="string">html!SBIS3.MyArea.MyComponent/template</option>
                 * </pre>
                 * Пример 2. Шаблон имеет простую структуру, поэтому его полностью описываем в качестве значения опции.
                 * <pre>
                 *     <option name="itemTemplate" type="string" value="
                 *        <div class='fieldLinkText'>{{=it.item.get('title')}}</div>
                 *     "></option>
                 * </pre>
                 */
                itemTemplate: ''
             }
          },

          $constructor: function() {
             var commandDispatcher = $ws.single.CommandDispatcher;

             this.getContainer().addClass('controls-FieldLink');
             this._publish('onItemActivate');

             /* Проиницализируем переменные */
             this._setVariables();

             /* Создём контрол, который рисует выбранные элементы  */
             this._linkCollection = this._getLinkCollection();

             commandDispatcher.declareCommand(this, 'clearAllItems', this._dropAllItems);
             commandDispatcher.declareCommand(this, 'showAllItems', this._showAllItems);

             /* Если не передали конфигурацию диалога всех записей для автодополнения,
              то по-умолчанию возьмём конфигурацию первого словаря */
             if(!Object.keys(this._options.showAllConfig).length) {
                this._options.showAllConfig = this._options.dictionaries[0];
             }

            /* При изменении выбранных элементов в поле связи - сотрём текст.
               Достаточно отслеживать изменение массива ключей,
               т.к. это событие гарантирует изменение выбранных элементов
               Это всё актуально для поля связи без включенной опции alwaysShowTextBox,
               если она включена, то логика стирания текста обрабатывается по-другому. */
            this.subscribe('onSelectedItemsChange', function() {
               if(this.getText()) {
                  this.setText('');
               }
            }.bind(this));

            if(this._options.oldViews) {
               $ws.single.ioc.resolve('ILogger').log('FieldLink', 'В 3.8.0 будет удалена опция oldViews, а так же поддержка старых представлений данных на диалогах выбора.');
            }
         },

          init: function() {
             FieldLink.superclass.init.apply(this, arguments);
             this.getChildControlByName('fieldLinkMenu').setItems(this._options.dictionaries);
          },

          /**
           * Обработчик нажатия на меню(элементы меню), открывает диалог выбора с соответствующим шаблоном
           * @private
           */
          _menuItemActivatedHandler: function(e, item) {
             var rec = this.getItems().getRecordById(item);
             this.getParent().showSelector(rec.get('template'), rec.get('componentOptions'));
          },

          /**
           * Устанавливает набор справочников для поля связи.
           * Подробнее о справочниках вы можете прочитать в описании к опции {@link dictionaries}.
           * @param {Array} dictionaries
           * @example
           * Устанавливаем для поля связи один справочник:
           * <pre>
           *     myFieldLink.setDictionaries(
           *        [{
           *           'template': 'js!SBIS3.BUH.ChoiceAccount' // Компонент, на основе которого будет построен справочник поля связи
           *        }]
           *     );
           * </pre>
           * @see dictionaries
           */
          setDictionaries: function(dictionaries) {
             this._options.dictionaries = dictionaries;
             this.getChildControlByName('fieldLinkMenu').setItems(dictionaries);
             this._notifyOnPropertyChanged('dictionaries');
          },

          /**
           * Открывает справочник для поля связи.
           * @remark
           * Метод  используется для открытия справочника из JS-кода компонента.
           * Подробно о настройке и работе со справочниками можно прочесть в описании к опции {@link dictionaries}.
           * @example
           * @param {String} template Компонент, который будет использован для построения справочника.
           * @param {Object} componentOptions Опции, которые будут использованы в компоненте при построении справочника.
           * Подробное описание можно прочесть {@link SBIS3.CONTROLS.FieldLink/dictionaries.typedef здесь}.
           * @example
           * <pre>
           *     this.showSelector(
           *        'js!SBIS3.MyArea.MyDictionary',
           *        {
           *           title: 'Сотрудники предприятия'
           *        }
           *     );
           * </pre>
           * @see dictionaries
           * @see setDictionaries
           */
          showSelector: function(template, componentOptions) {
             var oldRecArray = [],
                 selectedKeys = this._isEmptySelection() ? [] : this.getSelectedKeys(),
                 selectedItems, oldRec;

             if(this._options.oldViews) {
                selectedItems = this.getSelectedItems();

                if(selectedItems) {
                   selectedItems.each(function(rec) {
                      oldRec = DialogOpener.convertRecord(rec);
                      if(oldRec) {
                         oldRecArray.push(oldRec);
                      }
                   });
                }
             }

             //FIXME и ещё один костыль до перевода пикера на фокусную систему
             if(this.isPickerVisible()) {
                this.hidePicker();
             }

             this._showChooser(
                 template,
                 componentOptions,
                 /* Дополнительный конфиг, который нужно прокинуть в selector */
                 {
                    /* FIXME Для старых предствелений, удалить */
                    currentValue: selectedKeys,
                    currentSelectedKeys: selectedKeys,
                    selectorFieldLink: true,
                    multiSelect: this._options.multiselect,
                    selectedRecords: oldRecArray
                 });
          },

          _getLinkCollection: function() {
             if(!this._linkCollection) {
                return this._drawFieldLinkItemsCollection();
             }
             return this._linkCollection;
          },

          /**
           * Обрабатывает результат выбора из справочника
           * @param {Array} result
           * @private
           */
          _chooseCallback: function(result) {
             var isModel;

             if(result && result.length) {
                isModel = $ws.helpers.instanceOfModule(result[0], 'SBIS3.CONTROLS.Data.Model');

                if(isModel) {
                   this.addSelectedItems(result)
                } else {
                   this.addItemsSelection(result)
                }
             }
          },

          /**
           * Возвращает выбранные элементы в виде текста.
           * @deprecated Метод getCaption устарел, используйте getTextValue
           * @returns {string}
           */
          getCaption: function() {
             $ws.single.ioc.resolve('ILogger').log('FieldLink::getCaption', 'Метод getCaption устарел, используйте getTextValue');
             return this.getTextValue();
          },

           /**
            * Возвращает строку, сформированную из текстовых значений полей выбранных элементов коллекции.
            * @remark
            * Метод формирует строку из значений полей, отображаемых в поле связи, перечисленных через запятую.
            * Отображаемые значения определяются с помощью опции {@link displayField} или {@link itemTemplate}.
            * @returns {string} Строка, сформированная из отображаемых значений в поле связи.
            * @see displayField
            * @see itemTemplate
            */
          getTextValue: function() {
              var displayFields = [],
                  selectedItems = this.getSelectedItems(),
                  self = this;

              if(selectedItems) {
                 selectedItems.each(function(rec) {
                    displayFields.push($ws.helpers.escapeHtml(rec.get(self._options.displayField)));
                 });
              }

              return displayFields.join(', ');
          },

          /**
           * Устанавливает переменные, для дальнейшей работы с ними
           * @private
           */
          _setVariables: function() {
             this._linksWrapper = this._container.find('.controls-FieldLink__linksWrapper');
             this._inputWrapper = this._container.find('.controls-TextBox__fieldWrapper');

             this._afterFieldWrapper = this._container.find('.controls-TextBox__afterFieldWrapper');
             this._beforeFieldWrapper = this._container.find('.controls-TextBox__beforeFieldWrapper');

             if(this._options.multiselect) {
                this._dropAllLink = this._container.find('.controls-FieldLink__dropAllLinks');
                this._showAllLink = this._container.find('.controls-FieldLink__showAllLinks');
             }
          },

          _onResizeHandler: function() {
             var linkCollection = this._getLinkCollection();

             FieldLink.superclass._onResizeHandler.apply(this, arguments);

             if(!linkCollection.isPickerVisible()) {
                /* Почему надо звать redraw: поле связи может быть скрыто, когда в него проставили выбранные записи,
                   и просто пересчётом input'a тут не обойтись. Выполняться должно быстро, т.к. перерисовывается обычно всего 2-3 записи */
                linkCollection.redraw();
             }
          },

          /**
           * Показывает все элементы поля связи в выпадающем списке
           * @private
           */
          _showAllItems: function() {
             if(this.isPickerVisible()) {
                this.hidePicker();
             }
             this._getLinkCollection().togglePicker();
          },

          /**
           * Удаляет все элементы поля связи,
           * ставит курсор в поле ввода
           * @private
           */
          _dropAllItems: function() {
             this.removeItemsSelectionAll();
             this._inputField.focus();
             this._observableControlFocusHandler();
          },

          /**
           * Обрабатывает скрытие/открытие пикера
           * @param open
           * @private
           */
          _pickerStateChangeHandler: function(open) {
             this._dropAllLink.toggleClass('ws-hidden', !open);
             this._inputWrapper.toggleClass('ws-invisible', open);
          },

          /**
           * Обработчик на выбор записи в автодополнении
           * @private
           */
          _onListItemSelect: function(id, item) {
             this.hidePicker();
             /* Чтобы не было лишнего запроса на БЛ, добавим рекорд в набор выбранных */
             this.addSelectedItems(item instanceof Array ? item : [item]);
             this.setText('');
          },


          setDataSource: function(ds, noLoad) {
             this.once('onListReady', function() {
                this.getList().setDataSource(ds, noLoad);
             });
             FieldLink.superclass.setDataSource.apply(this, arguments);
          },

          _loadAndDrawItems: function(amount) {
             var linkCollection = this._getLinkCollection(),
                 linkCollectionContainer = linkCollection.getContainer();

             /* Нужно скрыть контрол отображающий элементы, перед загрузкой, потому что часто бл может отвечать >500мс и
              отображаемое значение в поле связи долго не меняется, особенно заметно в редактировании по месту. */
             linkCollectionContainer.addClass('ws-hidden');
             this.getSelectedItems(true, amount).addCallback(function(list){
                linkCollectionContainer.removeClass('ws-hidden');
                linkCollection.setItems(list);
                return list;
             });
          },

          _drawSelectedItems: function(keysArr) {
             var keysArrLen = this._isEmptySelection() ? 0 : keysArr.length;

             /* Если удалили в пикере все записи, и он был открыт, то скроем его */
             if (!keysArrLen) {
                this._toggleShowAllLink(false);
             }

             if(!this._options.alwaysShowTextBox) {

                if(!this._options.multiselect) {
                   this._inputWrapper.toggleClass('ws-hidden', Boolean(keysArrLen));
                }
             }

             this._loadAndDrawItems(keysArrLen, this._options.pageSize);
          },

          setListFilter: function() {
             var selectedItems =  this.getSelectedItems();

             /* Если единичный выбор в поле связи, но textBox всё равно показывается(включена опция), запрещаем работу suggest'a */
             if(!this._options.multiselect &&
                 selectedItems && selectedItems.getCount() &&
                 this._options.alwaysShowTextBox) {
                return;
             }
             FieldLink.superclass.setListFilter.apply(this, arguments);
          },

          _drawFieldLinkItemsCollection: function() {
             var self = this,
                 tpl = this.getProperty('itemTemplate');
             return new FieldLinkItemsCollection({
                element: this._linksWrapper.find('.controls-FieldLink__linksContainer'),
                displayField: this._options.displayField,
                keyField: this._options.keyField,
                itemTemplate: tpl ? TemplateUtil.prepareTemplate(tpl) : undefined,
                userItemAttributes: this._options.userItemAttributes,
                parent: this,
                itemCheckFunc: this._checkItemBeforeDraw.bind(this),
                handlers: {
                   /* После окончания отрисовки, обновим размеры поля ввода */
                   onDrawItems: this._updateInputWidth.bind(this),

                   /* При клике на крест, удалим ключ из выбранных */
                   onCrossClick: function(e, key){
                      self.removeItemsSelection([key]);
                      if(!self._options.multiselect && self._options.alwaysShowTextBox) {
                         self.setText('');
                      }
                   },

                   onItemActivate: function(e, key) {
                      self.getSelectedItems(false).each(function(item) {
                         if(item.getId() == key) {
                            self._notify('onItemActivate', {item: item, id: key});
                         }
                      })
                   },

                   /* При закрытии пикера надо скрыть кнопку удаления всех выбранных, при открытии - показать */
                   onClosePicker: self._pickerStateChangeHandler.bind(self, false),
                   onShowPicker: self._pickerStateChangeHandler.bind(self, true)
                }
             });
          },

          showPicker: function() {
             /* Если открыт пикер, который показывает все выбранные записи, то не показываем автодополнение */
             if(!this._linkCollection.isPickerVisible()) {
                FieldLink.superclass.showPicker.apply(this, arguments);
             }
          },
          /**
           * Проверяет, нужно ли отрисовывать элемент или надо показать троеточие
           */
          _checkItemBeforeDraw: function(item) {
             var needDrawItem = false,
                 linkCollection = this._getLinkCollection(),
                 inputMinWidth = INPUT_WRAPPER_PADDING,
                 inputWidth, newItemWidth;

             /* Для ситуаций, когда поле ввода не скрывается после выбора - минимальная ширина 100px (по стандарту) */
             if(this._options.multiselect || this._options.alwaysShowTextBox) {
                inputMinWidth += INPUT_MIN_WIDTH;
             }

             /* Если элементы рисуются в пикере то ничего считать не надо */
             if(linkCollection.isPickerVisible()) {
                return true;
             }

             /* Тут считается ширина добавляемого элемента, и если он не влезает,
              то отрисовываться он не будет и покажется троеточие, однако хотя бы один элемент в поле связи должен поместиться */
             if(this._checkWidth) {
                inputWidth = this._getInputWidth();
                newItemWidth = $ws.helpers.getTextWidth(item[0].outerHTML);
                /* Считаем, нужно ли отрисовывать элемент по следующему правилу:
                   Ширина добавляемого элемента + минимальная ширина поля ввода (для мултивыбора) не должны быть больше ширины контейнера контрола */
                needDrawItem = (newItemWidth + inputMinWidth) < (inputWidth + INPUT_WRAPPER_PADDING);

                if(!needDrawItem) {
                   /* Если в поле связи не отрисовано ни одного элемента, то уменьшаем ширину добавляемого,
                      т.к. хотя бы один элемент должен быть отрисован (стандарт) */
                   if(!linkCollection.getContainer().find('.controls-FieldLink__linkItem').length) {
                      item[0].style.width = inputWidth - inputMinWidth + 'px';
                      needDrawItem = true;
                   }
                   this._checkWidth = false;
                }
             }
             this._toggleShowAllLink(!needDrawItem);
             return needDrawItem
          },

          setSelectedItem: function(item) {
             /* Проверяем запись на наличие ключевых полей */
             if(item && item.get(this._options.displayField) && item.get(this._options.keyField)) {

                /* Если запись собралась из контекста, в ней может не быть поля с первичным ключем */
                if(!item.getIdProperty()) {
                   item.setIdProperty(this._options.keyField);
                }

                FieldLink.superclass.setSelectedItem.apply(this, arguments);
             }
          },

          /**
           * Конфигурация пикера
           */
          _setPickerConfig: function () {
             return {
                corner: 'bl',
                target: this._container,
                opener: this,
                parent: this,
                closeByExternalClick: true,
                targetPart: true,
                className: 'controls-FieldLink__picker',
                verticalAlign: {
                   side: 'top'
                },
                horizontalAlign: {
                   side: 'left'
                }
             };
          },
          /**
           * Обрабатывает нажатие клавиш, специфичных для поля связи
           */
          _keyUpBind: function(e) {
             FieldLink.superclass._keyUpBind.apply(this, arguments);
             switch (e.which) {
                /* Нажатие на клавишу delete удаляет все выбранные элементы в поле связи */
                case $ws._const.key.del:
                   this.removeItemsSelectionAll();
                   break;

                /* ESC закрывает все пикеры у поля связи(если они открыты) */
                case $ws._const.key.esc:
                   if(this.isPickerVisible() || this._linkCollection.isPickerVisible()) {
                      this.hidePicker();
                      this._linkCollection.hidePicker();
                      e.stopPropagation();
                   }
                   break;
             }
          },
          _keyDownBind: function(e) {
             FieldLink.superclass._keyDownBind.apply(this, arguments);
             switch (e.which) {
                /* Нажатие на backspace должно удалять последние значение, если нет набранного текста */
                case $ws._const.key.backspace:
                   if(!this.getText() && !this._isEmptySelection()) {
                      var selectedKeys = this.getSelectedKeys();
                      this.removeItemsSelection([selectedKeys[selectedKeys.length - 1]]);
                   }
                   break;
             }
          },

          /**
           * Скрывает/показывает кнопку показа всех записей
           */
          _toggleShowAllLink: function(show) {
             this._options.multiselect && this._showAllLink && this._showAllLink.toggleClass('ws-hidden', !show);
          },

          /**
           * Рассчитывает ширину поля ввода, учитывая всевозможные wrapper'ы и отступы
           * @returns {number}
           * @private
           */
          _getInputWidth: function() {
             /* Для поля связи в задизейбленом состоянии считаем, ширина инпута - 0, т.к. он визуально не отображается */
             if(!this.isEnabled()) {
                return 0;
             }

             return this._container[0].clientWidth  -
                 (this._afterFieldWrapper[0].offsetWidth +
                  this._beforeFieldWrapper[0].offsetWidth +
                  INPUT_WRAPPER_PADDING);
          },
          /**
           * Обновляет ширину поля ввода
           */
          _updateInputWidth: function() {
             this._checkWidth = true;
             this._inputField[0].style.width = this._getInputWidth() + 'px';
          },

          /* Заглушка, само поле связи не занимается отрисовкой */
          _redraw: $ws.helpers.nop,


          destroy: function() {
             this._linksWrapper = undefined;
             this._inputWrapper = undefined;

             if(this._linkCollection) {
                this._linkCollection.destroy();
                this._linkCollection = undefined;
             }

             if(this._options.multiselect) {
                this._showAllLink.unbind('click');
                this._showAllLink = undefined;

                this._dropAllLink.unbind('click');
                this._dropAllLink = undefined;
             }
             FieldLink.superclass.destroy.apply(this, arguments);
          }
       });

       return FieldLink;

    });