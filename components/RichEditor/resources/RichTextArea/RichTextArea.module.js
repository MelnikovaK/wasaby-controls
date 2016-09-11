/**
 * Created by ps.borisov on 21.05.2016.
 */
define('js!SBIS3.CONTROLS.RichTextArea',
   [
      'js!SBIS3.CONTROLS.TextBoxBase',
      'html!SBIS3.CONTROLS.RichTextArea',
      'js!SBIS3.CONTROLS.Utils.RichTextAreaUtil',
      'js!SBIS3.CORE.FileStorageLoader',
      'js!SBIS3.CONTROLS.RichTextArea/resources/smiles',
      'js!SBIS3.CORE.PluginManager',
      'js!SBIS3.CONTROLS.Utils.ImageUtil',
      'Core/Sanitize',
      'css!SBIS3.CORE.RichContentStyles',
      'i18n!SBIS3.CONTROLS.RichEditor'
   ], function(TextBoxBase, dotTplFn, RichUtil, FileLoader, smiles, PluginManager, ImageUtil, Sanitize) {
      'use strict';

      var
         constants = {
            blankImgPath: 'https://cdn.sbis.ru/richeditor/26-01-2015/blank.png',
            maximalPictureSize: 120,
            imageOffset: 40, //16 слева +  24 справа
            defaultYoutubeHeight: 300,
            minYoutubeHeight: 214,
            defaultYoutubeWidth: 430,
            minYoutubeWidth: 350,
            dataReviewPaddings: 8,
            styles: {
               title: {inline: 'span', classes: 'titleText'},
               subTitle: {inline: 'span', classes: 'subTitleText'},
               selectedMainText: {inline: 'span', classes: 'selectedMainText'},
               additionalText: {inline: 'span', classes: 'additionalText'}
            },
            ipadCoefficient: {
               top: {
                  vertical: 0.65,
                  horizontal:0.39
               },
               bottom: {
                  vertical: 0.7,
                  horizontal:0.44
               }
            }
         },
         /**
          * @class SBIS3.CONTROLS.RichTextArea
          * @extends SBIS3.CONTROLS.TextBoxBase
          * @author Борисов П.С.
          * @public
          * @control
          */
         RichTextArea = TextBoxBase.extend(/** @lends SBIS3.CONTROLS.RichTextArea.prototype */{
         _dotTplFn: dotTplFn,
         $protected : {
            _options : {
               /**
                * @cfg {Boolean} Включение режима автовысоты
                * <wiTag group="Управление">
                * Режим автовысоты текстового редактора.
                * @example
                * <pre>
                *     <option name="autoHeight">true</option>
                * </pre>
                */
               autoHeight: false,
               /**
                * @cfg {Number} Минимальная высота (в пикселях)
                * <wiTag group="Управление">
                * Минимальная высота текстового поля (для режима с автовысотой).
                * @example
                * <pre>
                *     <option name="autoHeight">true</option>
                *     <option name="minimalHeight">100</option>
                * </pre>
                */
               minimalHeight: 200,
               /**
                * @cfg {Number} Максимальная высота (в пикселях)
                * <wiTag group="Управление">
                * Максимальная высота текстового поля (для режима с автовысотой).
                * Для задания неограниченной высоты необходимо выставить в значении опции 0.
                * @example
                * <pre>
                *     <option name="autoHeight">true</option>
                *     <option name="maximalHeight">0</option>
                * </pre>
                */
               maximalHeight: 300,
               /**
                * @cfg {Boolean} Загрузка файлов в хранилище при их дропе (с десктопа) в поле редактора
                * <wiTag group="Управление">
                * @example
                * <pre>
                *     <option name="uploadImageOnDrop">true</option>
                * </pre>
                */
               uploadImageOnDrop: true,
               /**
                * @cfg {Object} Объект с настройками для tinyMCE
                * <wiTag group="Управление">
                *
                */
               editorConfig: {
                  plugins: 'media,paste,lists',
                  inline: true,
                  fixed_toolbar_container: '.controls-RichEditor__fakeArea',
                  relative_urls: false,
                  convert_urls: false,
                  formats: constants.styles,
                  paste_webkit_styles: 'color font-size text-align text-decoration width height max-width padding padding-left padding-right padding-top padding-bottom',
                  paste_retain_style_properties: 'color font-size text-align text-decoration width height max-width padding padding-left padding-right padding-top padding-bottom',
                  paste_as_text: true,
                  extended_valid_elements: 'div[class|onclick|style],img[unselectable|class|src|alt|title|width|height|align|name|style]',
                  body_class: 'ws-basic-style',
                  invalid_elements: 'script',
                  paste_data_images: false,
                  paste_convert_word_fake_lists: false, //TODO: убрать когда починят https://github.com/tinymce/tinymce/issues/2933
                  statusbar: false,
                  toolbar: false,
                  menubar: false,
                  browser_spellcheck: true,
                  smart_paste: true
               },
               /**
                * @cfg {String} Значение Placeholder`а
                * При пустом значении редактора отображается placeholder
                * @translatable
                */
               placeholder: '',
               /**
                * Позволяет в задизабленном режиме подсвечивать ссылки на файлы и URL
                * @cfg {Boolean} Подсвечивать ссылки
                * <wiTag group="Управление">
                */
               highlightLinks: false
            },
            _fakeArea: undefined, //textarea для перехода фкуса по табу
            _tinyEditor: undefined, //экземпляр tinyMCE
            _lastHeight: undefined, //последняявысота для UpdateHeight
            _tinyReady: null, //deferred готовности tinyMCE
            _readyContolDeffered: null, //deferred Готовности контрола
            _saveBeforeWindowClose: null,
            _sourceArea: undefined,
            _sourceContainer: undefined, //TODO: избавиться от _sourceContainer
            _fileLoader: undefined,
            _tinyIsInit: false,//TODO: избьавиться от этого флага через  _tinyReady
            _enabled: undefined, //TODO: подумать как избавиться от этого
            _typeInProcess: false,
            _needPasteImage: false,
            _clipboardText: undefined,
            _mouseIsPressed: false //Флаг того что мышь была зажата в редакторе
         },

         _modifyOptions: function(options) {
            options = RichTextArea.superclass._modifyOptions.apply(this, arguments);
            options._prepareReviewContent = this._prepareReviewContent.bind(this);
            return options;
         },

         $constructor: function() {
            var
               self = this,
               editorHeight;
            this._publish('onInitEditor', 'onUndoRedoChange','onNodeChange', 'onFormatChange', 'onToggleContentSource');
            this._sourceContainer = this._container.find('.controls-RichEditor__sourceContainer');
            this._sourceArea = this._sourceContainer.find('.controls-RichEditor__sourceArea').bind('input', this._onChangeAreaValue.bind(this));
            this._readyContolDeffered = new $ws.proto.Deferred();
            this._dChildReady.push(this._readyContolDeffered);
            this._dataReview = this._container.find('.controls-RichEditor__dataReview');
            this._tinyReady = new $ws.proto.Deferred();
            this._inputControl = this._container.find('.controls-RichEditor__editorFrame');
            this._fakeArea = this._container.find('.controls-RichEditor__fakeArea');
            this._initInputHeight();
            this._options.editorConfig.selector = '#' + this.getId() + ' > .controls-RichEditor__editorFrame';
            this._options.editorConfig.setup = function(editor) {
               self._tinyEditor = editor;
               self._bindEvents();
            };


            // Наш чудо-платформенный механизм установки состояния задизабленности отрабатывает не в то время.
            // Для того, чтобы отловить реальное состояние задизабленности нужно дожидаться события onInit.
            this.once('onInit', function() {
               //вешать обработчик copy/paste надо в любом случае, тк редактор может менять состояние Enabled
               RichUtil.markRichContentOnCopy(this._dataReview);
               if (!this.isEnabled()) {
                  this._readyContolDeffered.callback();
                  this._notify('onReady');
               }
               this._updateDataReview(this.getText());
            }.bind(this));

            this._togglePlaceholder();
         },
         /*БЛОК ПУБЛИЧНЫХ МЕТОДОВ*/

         /**
          * Добавить youtube видео
          * @param {String} link Ссылка на youtube видео.
          * @return {Boolean} Результат добавления видео (true - добавилось, false - не добавилось).
          * @example
          * Добавить в богатый редактор youtube видео по ссылке
          * <pre>
          *     richEditor.subscribe('onReady', function() {
         *        richEditor.addYouTubeVideo('http://www.youtube.com/watch?v=...');
         *     });
          * </pre>
          */
         addYouTubeVideo: function(link) {
            var result = false,
               content,
               id;

            if (typeof link !== 'string') {
               return result;
            }

            if ((id = this._getYouTubeVideoId($ws.helpers.escapeTagsFromStr(link, [])))) {
               content = [
                  '<iframe',
                  ' width="' + constants.defaultYoutubeWidth + '"',
                  ' height="' + constants.defaultYoutubeHeight + '"',
                  ' style="min-width:' + constants.minYoutubeWidth + 'px; min-height:' + constants.minYoutubeHeight + 'px;"',
                  ' src="' + '//www.youtube.com/embed/' + id + '"',
                  ' frameborder="0"',
                  ' allowfullscreen>',
                  '</iframe>'
               ].join('');
               this.insertHtml(content);
               result = true;
            }

            return result;
         },

         /**
          * Устанавливает минимальную высоту текстового поля редактора
          * @param {Number} value Минимальная высота поля редактора
          */
         setMinimalHeight: function(value) {
            var changeBlock =  this._options.editorConfig.inline ? this._inputControl : $(this._tinyEditor.iframeElement);
            if (this._options.autoHeight && typeof value === 'number') {
               this._options.minimalHeight = value;
               if (this._options.minimalHeight) {
                  if (this._options.maximalHeight && this._options.maximalHeight < value) {
                     this._options.maximalHeight = value;
                  }
               } else {
                  this._options.minimalHeight = '';
               }
               changeBlock.css({
                  'max-height': this._options.maximalHeight,
                  'min-height': this._options.minimalHeight
               });
            }
         },

         /**
          * Устанавливает максимальную высоту текстового поля редактора
          * @param {Number} value Максимальная высота поля редактора
          */
         setMaximalHeight: function(value) {
            var changeBlock =  this._options.editorConfig.inline ? this._inputControl : $(this._tinyEditor.iframeElement);
            if (this._options.autoHeight && typeof value === 'number') {
               this._options.maximalHeight = value;
               if (this._options.maximalHeight) {
                  if (this._options.minimalHeight && this._options.maximalHeight < this._options.minimalHeight) {
                     this._options.minimalHeight = value;
                  }
               } else {
                  this._options.maximalHeight = '';
               }
               changeBlock.css({
                  'max-height': this._options.maximalHeight,
                  'min-height': this._options.minimalHeight
               });
            }
         },

         /**
          * <wiTag group="Управление">
          * Добавить в текущую позицию указанный html-код
          * @param {String} html Добавляемый html
          * @example
          * Вставить цитату
          * <pre>
          *    tinyEditor.insertHtml('<blockquote>Текст цитаты</blockquote>');
          * </pre>
          */
         insertHtml: function(html) {
            if (typeof html === 'string' && this._tinyEditor) {
               this._performByReady(function() {
                  this._tinyEditor.insertContent(html);
               }.bind(this));
            }
         },

         /**
          * Возвращает минимальную высоту текстового поля редактора
          * @returns {Number}
          */
         getMinimalHeight: function() {
            if (this._options.autoHeight) {
               return this._options.minimalHeight;
            }
         },

         /**
          * Возвращает максимальную высоту текстового поля редактора
          * @returns {Number}
          */
         getMaximalHeight: function() {
            if (this._options.autoHeight) {
               return this._options.maximalHeight;
            }
         },

         /**
          * Устанавливает текстовое значение внутри поля ввода.
          * @param {String} text Текстовое значение, которое будет установлено в поле ввода.
          * @example
          * <pre>
          *     if (control.getText() == "Введите ФИО") {
          *        control.setText("");
          *     }
          * </pre>
          * @see text
          * @see getText
          */
         setText: function(text) {
            if (text !== this._curValue()) {
               this._drawText(text);
            }
            this._setText(text);
         },

         setActive: function(active) {
            //если тини еще не готов а мы передадим setActive родителю то потом у тини буддет баг с потерей ренжа,
            //поэтому если isEnabled то нужно передавать setActive родителю только по готовности тини
            var args = [].slice.call(arguments);
            if (active && this._needFocusOnActivated() && this.isEnabled()) {
               this._performByReady(function() {
                  this._tinyEditor.focus();
                  this._scrollTo(this._inputControl[0], 'top');
                  RichTextArea.superclass.setActive.apply(this, args);
               }.bind(this));
            } else {
               RichTextArea.superclass.setActive.apply(this, args);
            }
         },

         destroy: function() {
            $ws._const.$win.unbind('beforeunload', this._saveBeforeWindowClose);
            this.saveToHistory(this.getText());
            RichUtil.unmarkRichContentOnCopy(this._dataReview);
            RichUtil.unmarkRichContentOnCopy(this._inputControl);
            //проверка на то созадвался ли tinyEditor
            if (this._tinyEditor && this._tinyReady.isReady()) {
               this._tinyEditor.remove();
               this._tinyEditor.destroy();
               if (this._tinyEditor.theme ) {
                  if (this._tinyEditor.theme.panel) {
                     this._tinyEditor.theme.panel._elmCache = null;
                     this._tinyEditor.theme.panel.$el = null;
                  }
                  this._tinyEditor.theme.panel = null;
               }
               this._tinyEditor.theme = null;
            }
            $ws.helpers.trackElement(this._container, false);
            this._container.unbind('keydown keyup');
            this._sourceArea.unbind('input');
            this._tinyEditor = null;
            this._sourceContainer  = null;
            this._fakeArea = null;
            this._sourceArea = null;
            this._dataReview = null;
            this._options.editorConfig.setup = null;
            if (!this._readyContolDeffered.isReady()) {
               this._readyContolDeffered.errback();
            }
            RichTextArea.superclass.destroy.apply(this, arguments);
         },

         /**
          * Метод открывает диалог, позволяющий добавлять контент с учетом стилей
          * @param onAfterCloseHandler Функция, вызываемая после закрытия диалога
          * @param target объект рядом с которым будет позиционироваться  диалог если нотификатор отсутствует
          */
         pasteFromBufferWithStyles: function(onAfterCloseHandler, target) {
            var
               self = this,
               dialog,
               eventResult,
               prepareAndInsertContent = function(content) {
                  //Вычищаем все ненужные теги, т.к. они в конечном счёте превращаютя в <p>
                  content = content.replace(new RegExp('<!--StartFragment-->|<!--EndFragment-->|<html>|<body>|</html>|</body>', 'img'), '').trim();
                  //получение результата из события  BeforePastePreProcess тини потому что оно возвращает контент чистым от тегов Ворда,
                  //withStyles: true нужно чтобы в нашем обработчике BeforePastePreProcess мы не обрабатывали а прокинули результат в обработчик тини
                  eventResult = self.getTinyEditor().fire('BeforePastePreProcess', {content: content, withStyles: true});
                  self.insertHtml(eventResult.content);
               },
               onPaste = function(event) {
                  var content = event.clipboardData.getData ? event.clipboardData.getData('text/html') : '';
                  if (!content) {
                     content = event.clipboardData.getData ? event.clipboardData.getData('text/plain') : window.clipboardData.getData('Text');
                  }
                  prepareAndInsertContent(content);
                  dialog.close();
                  event.stopPropagation();
                  event.preventDefault();
                  return false;
               },
               createDialog = function() {
                  $ws.single.Indicator.hide();
                  require(['js!SBIS3.CORE.Dialog', 'js!SBIS3.CONTROLS.Button'], function(Dialog, Button) {
                     dialog = new Dialog({
                        resizable: false,
                        width: 348,
                        border: false,
                        top: target && target.offset().top + target.height(),
                        left: target && target.offset().left - (348 - target.width()),
                        autoHeight: true,
                        keepSize: false,
                        opener: self._options.richEditor,
                        handlers: {
                           onReady: function () {
                              var
                                 container = this.getContainer(),
                                 label = $('<div class="controls-RichEditor__pasteWithStylesLabel">Нажмите CTRL + V для вставки текста из буфера обмена с сохранением стилей</div>');
                              container.append(label)
                                 .addClass('controls-RichEditor__pasteWithStyles');
                              new Button({
                                 caption: rk('Отменить'),
                                 tabindex: -1,
                                 className: 'controls-Button__light',
                                 element: $('<div class="controls-RichEditor__pasteWithStylesButton">').appendTo(container),
                                 handlers: {
                                    onActivated: function () {
                                       dialog.close();
                                    }
                                 }
                              });
                              document.addEventListener('paste', onPaste, true);
                           },
                           onAfterClose: function () {
                              document.removeEventListener('paste', onPaste, true);
                              if (typeof onAfterCloseHandler === 'function') {
                                 onAfterCloseHandler();
                              }
                           }
                        }
                     });
                  });
               };
            $ws.single.Indicator.show();
            PluginManager.getPlugin('Clipboard', '1.0.1.0', {silent: true}).addCallback(function(clipboard) {
               if (clipboard.getContentType && clipboard.getHtml) {
                  clipboard.getContentType().addCallback(function(ContentType) {
                     clipboard[ContentType === 'Text/Html' || ContentType === 'Text/Rtf' || ContentType === 'Html' || ContentType === 'Rtf' ? 'getHtml' : 'getText']()
                        .addCallback(function(content) {
                           $ws.single.Indicator.hide();
                           prepareAndInsertContent(content);
                           if (typeof onAfterCloseHandler === 'function') {
                              onAfterCloseHandler();
                           }
                        }).addErrback(function() {
                           createDialog();
                        });
                  }).addErrback(function() {
                     createDialog();
                  });
               } else {
                  createDialog();
               }
            }).addErrback(function() {
               createDialog();
            });
         },
         /**
          * <wiTag group="Управление">
          * Сохранить в историю.
          * Сохраняет на бизнес логику, в пользовательский конфиг, строку прявязывая её к имени контрола.
          * В памяти истории может хранится до 10 значений.
          * @param valParam {String} строковое значение
          * @see userItems
          * @public
          */
         saveToHistory: function(valParam) {
            var
               self = this,
               isDublicate = false;
            if (valParam && typeof valParam === 'string' && self._textChanged) {
               this.getHistory().addCallback(function(arrBL){
                  if( typeof arrBL  === 'object') {
                     $ws.helpers.forEach(arrBL, function (valBL, keyBL) {
                        if (valParam === valBL) {
                           isDublicate = true;
                        }
                     });
                  }
                  if (!isDublicate) {
                     self._addToHistory(valParam);
                  }
               });
            }
         },

         /**
          * <wiTag group="Управление">
          * Получить историю ввода.
          * Вовзращает деферред истории ввода вводимых значений.
          * @return {$ws.proto.Deferred} в случае успеха, дефферед врнет массив данных
          * @example
          * <pre>
          *    fre.getHistory().addCallback(function(arrBL){
          *       var historyData = Array();
          *       $ws.helpers.forEach(arrBL, function(valBL, keyBL){
          *          historyData.push({key: keyBL, value: valBL});
          *          FieldDropdown.setData(historyData);
          *       });
          *    }).addErrback(function(){
          *       $ws.helpers.alert('Не данных!');
          *    });
          * </pre>
          * @see saveToHistory
          * @public
          */
         getHistory: function() {
            return $ws.single.UserConfig.getParamValues(this._getNameForHistory());
         },

         /**
          * Установить стиль для выделенного текста
          * @param {Object} style Объект, содержащий устанавливаемый стиль текста
          * @private
          */
         setFontStyle: function(style) {
            //TODO: перейти на fontSize с форматов, когда придёт в голову идея как отлавливать изменение этого fontSize
            //в FF при переключении инлайновых стилей с классом остаётся символ каретки (br) из-за чего происходит переход на новую строку
            if ($ws._const.browser.firefox &&  $(this._tinyEditor.selection.getNode()).find('br').attr('data-mce-bogus') == '1') {
               $(this._tinyEditor.selection.getNode()).find('br').remove();
            }
            for (var stl in constants.styles) {
               if (style !== stl) {
                  this._removeFormat(stl);
               }
            }
            if (style !== 'mainText') {
               this._applyFormat(style, true);
            }
            this._tinyEditor.execCommand('');
            //при установке стиля(через форматтер) не стреляет change
            this._setTrimmedText(this._getTinyEditorValue());
         },

         /**
          * Установить цвет для выделенного текста
          * @param {Object} color Объект, содержащий устанавливаемый цвет текста
          * @private
          */
         setFontColor: function(color) {
            this._applyFormat('forecolor', color);
            this._tinyEditor.execCommand('');
            //при установке стиля(через форматтер) не стреляет change
            this._setTrimmedText(this._getTinyEditorValue());
         },

         /**
          * Получить экземпляр редактора tinyMCE
          */
         getTinyEditor: function() {
            return this._tinyEditor;
         },

         /**
          * <wiTag group="Управление">
          * Вставить смайл.
          * Вставляет смайл по его строковому соответствию^
          * <ul>
          *    <li>Smile - улыбка;</li>
          *    <li>Nerd - умник;</li>
          *    <li>Angry - злой;</li>
          *    <li>Annoyed - раздраженный;</li>
          *    <li>Blind - слепой;</li>
          *    <li>Cool - крутой;</li>
          *    <li>Cry - плачет;</li>
          *    <li>Devil - дьявол;</li>
          *    <li>Dumb - тупица;</li>
          *    <li>Inlove - влюблен;</li>
          *    <li>Kiss - поцелуй;</li>
          *    <li>Laugh - смеётся;</li>
          *    <li>Money - алчный;</li>
          *    <li>Neutral - нейтральный;</li>
          *    <li>Puzzled - недоумевает;</li>
          *    <li>Rofl - подстолом;</li>
          *    <li>Sad - расстроен;</li>
          *    <li>Shocked - шокирован;</li>
          *    <li>Snooze - дремлет;</li>
          *    <li>Tongue - дразнит;</li>
          *    <li>Wink - подмигивает;</li>
          *    <li>Yawn - зевает;</li>
          * </ul>
          * @public
          * @example
          * <pre>
          *    fre.insertSmile('Angry')
          * </pre>
          * @param {String} smile название смайла
          */
         insertSmile: function(smile) {
            if (typeof smile === 'string') {
               $.each(smiles, function(i, obj) {
                  if (obj.key === smile) {
                     smile = obj;
                     return false;
                  }
               });
               if (typeof smile === 'object') {
                  this.insertHtml(this._smileHtml(smile.key, smile.value, smile.alt));
               }
            }
         },

         /**
          * <wiTag group="Управление">
          * Выполнить команду.
          * @param {String} command передаваемая в качестве строки команда
          * @example
          * <pre>
          *    fre.setValue('Случайно написал эту фразу');
          *    fre.execCommand('undo'); // отменить последнее действие
          * </pre>
          * @public
          */
         execCommand: function(command) {
            this._tinyEditor.execCommand(command);
            //TODO:https://github.com/tinymce/tinymce/issues/3104, восстанавливаю выделение тк оно теряется если после нжатия кнопки назад редактор стал пустым
            if (($ws._const.browser.firefox || $ws._const.browser.isIE) && command == 'undo' && this._getTinyEditorValue() == '') {
               this._tinyEditor.selection.select(this._tinyEditor.getBody(), true);
            }
         },

         /**
          * Метод открывает диалог, позволяющий вставить ссылку
          * @param onAfterCloseHandler Функция, вызываемая после закрытия диалога
          * @param target объект рядом с которым будет позиционироваться  диалог вставки ссылки
          */
         insertLink: function(onAfterCloseHandler, target) {
            var
               editor = this._tinyEditor,
               selection = editor.selection,
               range = $ws.core.clone(selection.getRng()),
               element = selection.getNode(),
               anchor = editor.dom.getParent(element, 'a[href]'),
               href = anchor ? editor.dom.getAttrib(anchor, 'href') : '',
               fre = this,
               context = new $ws.proto.Context(),
               dom = editor.dom,
               protocol = /(https?|ftp|file):\/\//gi,
               dialogWidth = 440;
            require(['js!SBIS3.CORE.Dialog', 'js!SBIS3.CORE.FieldString', 'js!SBIS3.CONTROLS.Button'], function(Dialog, FieldString, Button) {
               new Dialog({
                  title: rk('Вставить/редактировать ссылку'),
                  disableActions: true,
                  resizable: false,
                  width: dialogWidth,
                  height: 48,
                  autoHeight: false,
                  keepSize: false,
                  opener: fre,
                  context: context,
                  top: target && target.offset().top + target.height() - $(window).scrollTop(),
                  left: target && target.offset().left - (dialogWidth - target.width()),
                  handlers: {
                     onReady: function () {
                        var
                           self = this,
                           hrefLabel = $('<div class="controls-RichEditor__insertLinkHrefLabel">Адрес</div>'),
                           okButton = $('<div class="controls-RichEditor__insertLinkButton"></div>'),
                           linkAttrs = {
                              target: '_blank',
                              rel: null,
                              'class': null,
                              title: null
                           };
                        this._fieldHref = $('<div class="controls-RichEditor__insertLinkHref"></div>');
                        this.getContainer()
                           .append(hrefLabel)
                           .append(this._fieldHref);
                        //TODO: перевечсти поле ввода на SBIS3.CONTROLS.TextBoxтк в нём нет доскрола при активации
                        this._fieldHref = new FieldString({
                           value: href,
                           parent: this,
                           element: this._fieldHref,
                           linkedContext: context,
                           name: 'fre_link_href'
                        });
                        this._titleBar
                           .prepend($('<a href="javascript:void(0)"></a>')
                              .addClass('ws-window-titlebar-action close')
                              .click(function () {
                                 self.close();
                                 return false;
                              }))
                           .append(okButton);
                        new Button({
                           caption: 'ОК',
                           defaultButton: true,
                           parent: this,
                           handlers: {
                              onActivated: function () {
                                 href = this.getParent()._fieldHref.getValue();
                                 if (href && href.search(protocol) === -1) {
                                    href = 'http://' + href;
                                 }
                                 if (element && element.nodeName === 'A' && element.className.indexOf('ws-focus-out') < 0) {
                                    if (href) {
                                       dom.setAttribs(element, {
                                          target: '_blank',
                                          href: $ws.helpers.escapeHtml(href)
                                       });
                                    } else {
                                       editor.execCommand('unlink');
                                    }
                                    editor.undoManager.add();
                                 } else if (href) {
                                    linkAttrs.href = href;
                                    editor.selection.setRng(range);
                                    if (editor.selection.getContent() === '') {
                                       editor.insertContent(dom.createHTML('a', linkAttrs, dom.encode(href)));
                                    } else {
                                       editor.execCommand('mceInsertLink', false, linkAttrs);
                                    }
                                    editor.undoManager.add();
                                 }
                                 self.close();
                              }
                           },
                           element: okButton
                        });
                        if ($ws._const.browser.isMobileIOS) {
                           //финт ушами, тк фокус с редактора убрать никак нельзя
                           //тк кнопки на которую нажали у нас в обработчике тоже нет
                           //ставим фокус на любой блок внутри нового диалогового окна, например на контейнер кнопки
                           okButton.focus();
                        }
                     },
                     onAfterClose: function() {
                        if (typeof onAfterCloseHandler === 'function') {
                           onAfterCloseHandler();
                        }
                     }
                  }
               });
            });
         },

         /**
          * Установить курсор в конец контента.
          */
         setCursorToTheEnd: function() {
            var
               editor = this._tinyEditor,
               nodeForSelect = editor.getBody(),
               root = editor.dom.getRoot();
            // But firefox places the selection outside of that tag, so we need to go one level deeper:
            if (editor.isGecko) {
               nodeForSelect = root.childNodes[root.childNodes.length-1];
               nodeForSelect = nodeForSelect.childNodes[nodeForSelect.childNodes.length-1];
            }
            editor.selection.select(nodeForSelect, true);
            editor.selection.collapse(false);
         },

         /**
          * Возвращает контейнер, используемый компонентом для ввода данных
          * @returns {*|jQuery|HTMLElement}
          * @deprecated
          */
         //TODO:придумать дургое решение: https://inside.tensor.ru/opendoc.html?guid=c7676fdd-b4de-4ac6-95f5-ab28d4816c27&description=
         getInputContainer: function() {
            return this._inputControl;
         },

         /**
          * Установить выравнивание текста для активной строки
          * @param {String} align Устанавливаемое выравнивание
          * @private
          */
         setTextAlign: function(align) {
            //TODO: перейти на  this.execCommand('JustifyRight'), http://archive.tinymce.com/wiki.php/Tutorials:Command_identifiers
            var
            // выбираем ноду из выделения
               $selectionContent = $(this._tinyEditor.selection.getNode()),
            // ищем в ней списки
               $list = $selectionContent.find('ol,ul');
            if (!$list.length) {
               // если списков не нашлось внутри, может нода и есть сам список
               $list = $selectionContent.closest('ol,ul');
            }
            if ($list.length) {
               // для того чтобы список выравнивался вместе с маркерами нужно проставлять ему
               // свойство list-style-position: inline, и, также, убирать его при возврате назад,
               // так как это влечет к дополнительным отступам
               $list.css('list-style-position', align === 'alignjustify' || align === 'alignleft' ? '' : 'inside');
            }
            this._tinyEditor.formatter.apply(align, true);
            //если смена стиля будет сразу после setValue то контент не установится,
            //так как через форматттер не стреляет change
            this._setTrimmedText(this._getTinyEditorValue());
         },

         toggleContentSource: function(visible) {
            var
               sourceVisible = visible !== undefined ? !!visible : this._sourceContainer.hasClass('ws-hidden'),
               container = this._tinyEditor.getContainer() ? $(this._tinyEditor.getContainer()) : this._inputControl;
            if (sourceVisible) {
               this._sourceContainer.css({
                  'height' : container.outerHeight(),
                  'width' : container.outerWidth()
               });
               this._sourceArea.val(this.getText());
            }
            this._sourceContainer.toggleClass('ws-hidden', !sourceVisible);
            container.toggleClass('ws-hidden', sourceVisible);
            this._notify('onToggleContentSource', sourceVisible);
         },
         /*БЛОК ПУБЛИЧНЫХ МЕТОДОВ*/

         /*БЛОК ПРИВАТНЫХ МЕТОДОВ*/
         _setTrimmedText: function(text) {
            this._setText(this._trimText(text));
         },

         _setText: function(text) {
            if (text !== this.getText()) {
               if (!this._isEmptyValue(text) && !this._isEmptyValue(this._options.text)) {
                  this._textChanged = true;
               }
               this._options.text = text;
               this._notify('onTextChange', text);
               this._notifyOnPropertyChanged('text');
               this._updateDataReview(text);
               this.clearMark();
            }
            //При нажатии enter передаётся trimmedText поэтому updateHeight text === this.getText() и updateHeight не зовётся
            this._updateHeight();
            this._togglePlaceholder(text);
         },
         _showImagePropertiesDialog: function(target) {
            var
               $image = $(target),
               editor = this._tinyEditor,
               self = this;
            require(['js!SBIS3.CORE.Dialog'], function(Dialog) {
               new Dialog({
                  name: 'imagePropertiesDialog',
                  template: 'js!SBIS3.CONTROLS.RichEditor.ImagePropertiesDialog',
                  selectedImage: $image,
                  editorWidth: self._inputControl.width(),
                  handlers: {
                     onBeforeShow: function () {
                        $ws.single.CommandDispatcher.declareCommand(this, 'saveImage', function () {
                           var
                              dataMceStyle = '',
                              percentSizes = this.getChildControlByName('valueType').getValue() === 'per',
                              width = this.getChildControlByName('imageWidth').getValue(),
                              height = this.getChildControlByName('imageHeight').getValue();
                           width = width !== null ? width + (percentSizes ? '%' : 'px') : '';
                           height = height !== null ? height + (percentSizes ? '%' : 'px') : '';
                           $image.css({
                              width: width,
                              height: height
                           });
                           dataMceStyle += width ? 'width: ' + width + ';' : '';
                           dataMceStyle += height ? 'height: ' + height + ';' : '';
                           $image.attr('data-mce-style', dataMceStyle);
                           editor.undoManager.add();
                        }.bind(this));
                     }
                  }
               });
            });
         },

         _smileHtml: function(smile, name, alt) {
            return '<img class="ws-fre__smile smile'+smile+'" data-mce-resize="false" unselectable ="on" src="'+constants.blankImgPath+'" ' + (name ? ' title="' + name + '"' : '') + ' alt=" ' + alt + ' " />';
         },

         /**
          * JavaScript function to match (and return) the video Id
          * of any valid Youtube Url, given as input string.
          * @author: Stephan Schmitz <eyecatchup@gmail.com>
          * @url: http://stackoverflow.com/a/10315969/624466
          */
         _getYouTubeVideoId: function(link) {
            var p = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
            return link.match(p) ? RegExp.$1 : false;
         },

         _bindEvents: function() {
            var
               self = this,
               editor = this._tinyEditor;

            //По инициализации tinyMCE
            editor.on('init', function(){
               //По двойному клику на изображение внутри редактора - отображаем диалог редактирования размеров изображения
               this._inputControl.bind('dblclick', function(e) {
                  if (this._inputControl.attr('contenteditable') !== 'false') {
                     var target = e.target;
                     if (target.nodeName === 'IMG' && target.className.indexOf('mce-object-iframe') === -1 && target.className.indexOf('ws-fre__smile') === -1) {
                        this._showImagePropertiesDialog(target);
                     }
                  }
               }.bind(this));

               if (self._options.uploadImageOnDrop) {
                  self._getFileLoader();
               }

               this._inputControl.attr('tabindex', 1);

               if (!$ws._const.browser.firefox) { //в firefox работает нативно
                  this._inputControl.bind('mouseup', function (e) { //в ie криво отрабатывает клик
                     if (e.ctrlKey) {
                        var target = e.target;
                        if (target.nodeName === 'A' && target.href) {
                           window.open(target.href, '_blank');
                        }
                     }
                  });
               }
               this._notifyOnSizeChanged();

               if (!self._readyContolDeffered.isReady()) {
                  self._tinyReady.addCallback(function() {
                     //Стреляем готовность ws-контрола только в том случае, если раньше не стреляли
                     self._readyContolDeffered.addCallback(function () {
                        self._notify('onReady');
                        self._notify('onInitEditor');
                     });
                     self._readyContolDeffered.callback();
                  });
               }

               this._inputControl = $(editor.getBody());
               RichUtil.markRichContentOnCopy(this._inputControl);
               self._tinyReady.callback();

               //Правки Клепикова при необходимости сжечь
               this._inputControl.bind('focus', function() {
                  if ($(this).attr('contenteditable') !== 'false') {
                     $ws.single.EventBus.globalChannel().notify('MobileInputFocus');
                  }
               });
               this._inputControl.bind('blur', function () {
                  $ws.single.EventBus.globalChannel().notify('MobileInputFocusOut');
               });

               /*НОТИФИКАЦИЯ О ТОМ ЧТО В РЕДАКТОРЕ ПОМЕНЯЛСЯ ФОРМАТ ПОД КУРСОРОМ*/
               //formatter есть только после инита поэтому подписка осуществляется здесь
               editor.formatter.formatChanged('bold,italic,underline,strikethrough,alignleft,aligncenter,alignright,alignjustify,title,subTitle,selectedMainText,additionalText', function(state, obj) {
                  self._notify('onFormatChange', obj, state)
               });
            }.bind(this));

            //БИНДЫ НА ВСТАВКУ КОНТЕНТА И ДРОП
            editor.on('onBeforePaste', function(e) {
               var image;
               if (e.content.indexOf('<img') === 0) {
                  image = $('<div>' + e.content + '</div>').find('img:first');
                  if (image.length && !!image.attr('src').indexOf('data:image') && (!image.attr('class') || !!image.attr('class').indexOf('ws-fre__smile'))) {
                     self._needPasteImage = image.get(0).outerHTML;
                     return false;
                  }
               } else {
                  self._needPasteImage = false;
               }
            });

            editor.on('Paste', function(e) {
               self._clipboardText = e.clipboardData ?
                  $ws._const.browser.isMobileIOS ? e.clipboardData.getData('text/plain') : e.clipboardData.getData('text') :
                  window.clipboardData.getData('text');
               editor.plugins.paste.clipboard.pasteFormat = 'html';
            });

            //Обработка вставки контента
            editor.on('BeforePastePreProcess', function(e) {
               var
                  isYouTubeReady,
                  isRichContent = e.content.indexOf('orphans: 31415;') !== -1,
                  content = e.content;
               e.content =  content.replace('orphans: 31415;','');
               //Парсер TinyMCE неправльно распознаёт стили из за - &quot;TensorFont Regular&quot;
               e.content = e. content.replace(/&quot;TensorFont Regular&quot;/gi,'\'TensorFont Regular\'');
               // при форматной вставке по кнопке мы обрабаотываем контент через событие tinyMCE
               // и послыаем метку форматной вставки, если метка присутствует не надо обрабатывать событие
               // нашим обработчиком, а просто прокинуть его в дальше
               if (e.withStyles) {
                  return e;
               }
               if (!isRichContent) {
                  if (self._options.editorConfig.paste_as_text) {
                     //если данные не из БТР и не из word`a, то вставляем как текст
                     //В Костроме юзают БТР с другим конфигом, у них всегда форматная вставка
                     if (self._needPasteImage) {
                        self.insertHtml(self._needPasteImage);
                        e.content = '';
                     } else if (self._clipboardText !== false) {
                        //взял строку из метода pasteText, благодаря ей вставка сохраняет спецсимволы
                        e.content = $ws.helpers.escapeHtml(editor.dom.encode(self._clipboardText).replace(/\r\n/g, '\n'));
                     }
                  }
               }
               isYouTubeReady = self.addYouTubeVideo(e.content);
               if (isYouTubeReady) {
                  self._tinyEditor.fire('change');
               }
               return isYouTubeReady ? false : e;
            });

            editor.on('PastePostProcess', function(event){
               var
                  maximalWidth,
                  content = event.node,
                  $images = $(content).find('img:not(.ws-fre__smile)'),
                  width,
                  currentWidth,
                  naturalSizes;
               $(content).find('[unselectable ="on"]').attr('data-mce-resize','false');
               if ($images.length) {
                  if (/data:image/gi.test(content.innerHTML)) {
                     return false;
                  }
                  maximalWidth = this._inputControl.width() - constants.imageOffset;
                  for (var i = 0; i < $images.length; i++) {
                     naturalSizes = ImageUtil.getNaturalSizes($images[i]);
                     currentWidth = $($images[i]).width();
                     width = currentWidth > maximalWidth ? maximalWidth : currentWidth === 0 ? naturalSizes.width > maximalWidth ? maximalWidth : naturalSizes.width : currentWidth;
                     if (!$images[i].style || !$images[i].style.width || $images[i].style.width.indexOf('%') < 0) {
                        $($images[i]).css({
                           'width': width,
                           'height': 'auto'
                        });
                     }
                  }
               }
               //Замена переносов строк на <br>
               event.node.innerHTML = event.node.innerHTML.replace(/([^>])\n(?!<)/gi, '$1<br />');
               // Замена отступов после переноса строки и в первой строке
               // пробелы заменяются с чередованием '&nbsp;' + ' '
               event.node.innerHTML = this._replaceWhitespaces(event.node.innerHTML);

            }.bind(this));

            editor.on('drop', function() {
               //при дропе тоже заходит в BeforePastePreProcess надо обнулять  _needPasteImage и  _clipboardTex
               self._needPasteImage = false;
               self._clipboardText = false;
            });

            //БИНДЫ НА СОБЫТИЯ КЛАВИАТУРЫ (ВВОД)
            if ($ws._const.browser.isMobileIOS || $ws._const.browser.isMobileAndroid) {
               //TODO: https://github.com/tinymce/tinymce/issues/2533
               this._inputControl.on('input', function() {
                  self._setTrimmedText(self._getTinyEditorValue());
               });
            }

            //Передаём на контейнер нажатие ctrl+enter и escape
            this._container.bind('keydown', function(e) {
               if (!(e.which === $ws._const.key.enter && e.ctrlKey) && e.which !== $ws._const.key.esc) {
                  e.stopPropagation();
               }
            });

            //Запрещаем всплытие Enter, Up и Down
            this._container.bind('keyup', function(e) {
               if (e.which === $ws._const.key.enter || e.which === $ws._const.key.up || e.which === $ws._const.key.down) {
                  e.stopPropagation();
                  e.preventDefault();
               }
            });

            editor.on('keyup', function(e) {
               self._typeInProcess = false;
               if (!(e.keyCode === $ws._const.key.enter && e.ctrlKey)) { // Не нужно обрабатывать ctrl+enter, т.к. это сочетание для дефолтной кнопки
                  self._setTrimmedText(self._getTinyEditorValue());
               }
            });

            editor.on('keydown', function(e) {
               self._typeInProcess = true;

               if (e.which === $ws._const.key.pageDown || e.which === $ws._const.key.pageUp || (e.which === $ws._const.key.insert && !e.shiftKey && !e.ctrlKey)) {
                  e.stopPropagation();
                  e.preventDefault();
               }
               if (e.keyCode == $ws._const.key.tab) {
                  var
                     area = self.getParent(),
                     nextControl = area.getNextActiveChildControl(e.shiftKey);
                  if (nextControl) {
                     self._fakeArea.focus();
                     nextControl.setActive(true, e.shiftKey);
                  }
                  e.stopImmediatePropagation();
                  e.preventDefault();
                  return false;
               } else if (e.which === $ws._const.key.enter && e.ctrlKey) {
                  e.preventDefault();//по ctrl+enter отменяем дефолтное(чтобы не было перевода строки лишнего), разрешаем всплытие
                  //по ctrl+enter может произойти перехват события( например главная кнопка) и keyup может не сработать
                  //необходимо сбрасывать флаг зажатой кнопки, чтобы шло обновление опции text (сейчас обновление опции text не идёт при зажатаой клавише, чтобы не тормозило)
                  self._typeInProcess = false;
               }
               self._updateHeight();
            });

            // Обработка изменения содержимого редактора.
            // Событие keypress возникает сразу после keydown, если нажата символьная клавиша, т.е. нажатие приводит к появлению символа.
            // Любые буквы, цифры генерируют keypress. Управляющие клавиши, такие как Ctrl, Shift, F1, F2.. — keypress не генерируют.
            editor.on('keypress', function(e) {
               // <проблема>
               //    Если в редакторе написать более одного абзаца, выделить, и нажать любую символьную клавишу,
               //    то, он оставит сверху один пустой абзац, который не удалить через визуальный режим, и будет писать в новом
               // </проблема>
               if (!editor.selection.isCollapsed()) {
                  if (editor.selection.getContent() == self._getTinyEditorValue()) {
                     if (!e.ctrlKey && e.charCode !== 0) {
                        editor.bodyElement.innerHTML = '';
                     }
                  }
               }
               setTimeout(function() {
                  self._togglePlaceholder(self._getTinyEditorValue());
               }, 1);
            });

            editor.on('change', function(e) {
               self._setTrimmedText(self._getTinyEditorValue());
            });

            editor.on( 'cut',function(e){
               setTimeout(function() {
                  self._setTrimmedText(self._getTinyEditorValue());
               }, 1);
            });
            //Сообщаем компоненту об изменении размеров редактора
            editor.on('resizeEditor', function() {
               self._notifyOnSizeChanged();
            });

            //реагируем на то что редактор изменился при undo/redo
            editor.on('undo', function() {
               self._setTrimmedText(self._getTinyEditorValue());
            });

            editor.on('redo', function() {
               self._setTrimmedText(self._getTinyEditorValue());
            });
            //Уличная магия в чистом виде (на мобильных устройствах просто не повторить) :
            //Если начать выделять текст в редакторе и увести мышь за его границы и продолжить печатать падают ошибки:
            //Клик окончится на каком то элементе, listview например стрельнет фокусом на себе
            //если  есть активный редактор то запомнится выделение(lastFocusBookmark) и прежде чем
            //введется символ сработает focusin(который не перебить непонятно почему)
            //в нём сработает восстановление выделения, а выделенного уже и нет => error
            //Решение: в mouseLeave смотреть зажата ли мышь, и если зажата убирать activeEditor
            //тк activeEditor будет пустой не запомнится LastFocusBookmark и не будет восстановления выделения
            //activeEditor восстановится сразу после ввода символа а может и раньше, главное что восстновления выделения не будет
            if (!$ws._const.browser.isMobileIOS && !$ws._const.browser.isMobileAndroid) {
               editor.on('mousedown', function(e) {
                  self._mouseIsPressed = true;
               });
               editor.on('mouseup', function(e) {
                  self._mouseIsPressed = false;
               });
               editor.on('focusout', function(e) {
                  if (self._mouseIsPressed){
                     editor.editorManager.activeEditor = false;
                  }
               });
            }

            //сохранение истории при закрытии окна
            this._saveBeforeWindowClose  =  function() {
               this.saveToHistory(this.getText());
            }.bind(this);
            $ws._const.$win.bind('beforeunload', this._saveBeforeWindowClose);

            /*НОТИФИКАЦИЯ О ТОМ ЧТО В РЕДАКТОРЕ ПОМЕНЯЛСЯ UNDOMANAGER*/
            editor.on('TypingUndo AddUndo ClearUndos redo undo', function() {
               self._notify('onUndoRedoChange', {
                  hasRedo: self._tinyEditor.undoManager.hasRedo(),
                  hasUndo: self._tinyEditor.undoManager.hasUndo()
               });
            });
            /*НОТИФИКАЦИЯ О ТОМ ЧТО В РЕДАКТОРЕ ПОМЕНЯЛСЯ NODE ПОД КУРСОРОМ*/
            editor.on('NodeChange', function(e) {
               self._notify('onNodeChange', e)
            });
         },

         _replaceWhitespaces: function(text) {
            var
               out = '',
               lastIdx = null,
               nbsp = false;
            if (typeof text !== 'string') {
               return text;
            }
            for (var i = 0; i < text.length; i++) {
               if (text[i] !== ' ') {
                  out += text[i];
               } else {
                  if (text.substr(i - 6, 6) === '&nbsp;') {
                     nbsp = false;
                  } else {
                     if (i === 0 || text[i - 1] === '\n' || text[i - 1] === '>') {
                        nbsp = true;
                     } else {
                        if (lastIdx !== i - 1) {
                           nbsp = text[i + 1] === ' ';
                        } else {
                           nbsp = !nbsp;
                        }
                     }
                  }
                  if (nbsp) {
                     out += '&nbsp;';
                  } else {
                     out += ' ';
                  }
                  lastIdx = i;
               }
            }
            return out;
         },

         _performByReady: function(callback) {
            if (this._tinyReady.isReady()) {
               callback();
            } else {
               this._tinyReady.addCallback(callback);
            }
         },

         _getElementToFocus: function() {
            return this._inputControl || false;
         },

         _setEnabled: function(enabled) {
            this._enabled = enabled;
            if (!this._tinyReady.isReady() && enabled) {
               this._tinyReady.addCallback(function() {
                  this._applyEnabledState(this._enabled);
               }.bind(this));
               this._initTiny();
            } else {
               this._applyEnabledState(enabled);
            }
         },

         _applyEnabledState: function(enabled) {
            var
               container = this._tinyEditor ? this._tinyEditor.getContainer() ? $(this._tinyEditor.getContainer()) : this._inputControl : this._inputControl;
            if (this._dataReview) {
               if (this._options.autoHeight) {
                  this._dataReview.css({
                     'max-height': this._options.maximalHeight,
                     'min-height': this._options.minimalHeight
                  });
               } else {
                  this._dataReview.height(this._container.height()  - constants.dataReviewPaddings);//тк у dataReview box-sizing: borderBox высоту надо ставить меньше на падддинг и бордер
               }
               this._dataReview.toggleClass('ws-hidden', enabled);
            }

            container.toggleClass('ws-hidden', !enabled);
            this._inputControl.toggleClass('ws-hidden', !enabled);
            //Требуем в будущем пересчитать размеры контрола
            this._notifyOnSizeChanged();

            RichTextArea.superclass._setEnabled.apply(this, arguments);
         },

         _initTiny: function() {
            var
               self = this;
            if (!this._tinyEditor && !this._tinyIsInit) {
               this._tinyIsInit = true;
               require(['css!SBIS3.CONTROLS.RichTextArea/resources/tinymce/skins/lightgray/skin.min',
                  'css!SBIS3.CONTROLS.RichTextArea/resources/tinymce/skins/lightgray/content.inline.min',
                  'js!SBIS3.CONTROLS.RichTextArea/resources/tinymce/tinymce'],function(){
                  tinyMCE.baseURL = $ws.helpers.resolveComponentPath('SBIS3.CONTROLS.RichTextArea') + 'resources/tinymce';
                  tinyMCE.init(self._options.editorConfig);
               });
            }
            this._tinyReady.addCallback(function () {
               this._tinyEditor.setContent(this._prepareContent(this.getText()));
               this._tinyEditor.undoManager.add();
            }.bind(this));
         },

         /**
          * Получить текущее содержимое редактора
          * Вынесено в метод так как no_events: true нужно в методе getContent,
          * но также не нужно в _tinyEditor.serializer.serialize.
          * Данный метод это метод getContent TinyMce без предсобытий вызываемых в нём
          * @returns {*} Текущее значение (в формате html-кода)
          */
         _getTinyEditorValue: function(){
            return this._tinyEditor.serializer.serialize(this._tinyEditor.getBody(), {format: 'html', get: true, getInner: true});
         },

         /**
          * Убрать пустые строки из начала и конца текста
          * @returns {*} текст без пустх строк вначале и конце
          */
         _trimText: function(text) {
            var
               beginReg = new RegExp('^<p>(&nbsp; *)*</p>'),// регулярка начала строки
               endReg = new RegExp('<p>(&nbsp; *)*</p>$'),// регулярка начала строки
               regResult;
            while ((regResult = beginReg.exec(text)) !== null)
            {
               text = text.substr(regResult[0].length + 1);
            }
            while ((regResult = endReg.exec(text)) !== null)
            {
               text = text.substr(0, text.length - regResult[0].length - 1);
            }
            return (text === null || text === undefined) ? '' : ('' + text).replace(/^\s*|\s*$/g, '');
         },

         /**
          * Получить текущее значение
          * @returns {*} Текущее значение (в формате html-кода)
          */
         _curValue: function() {
            return this._tinyEditor && this._tinyEditor.initialized && this.isEnabled() ? this._getTinyEditorValue() : this.getText();
         },

         _prepareContent: function(value) {
            return typeof value === 'string' ? value : value === null || value === undefined ? '' : value + '';
         },

         //метод показа плейсхолдера по значению//
         //TODO: ждать пока решится задача в самом tinyMCE  https://github.com/tinymce/tinymce/issues/2588
         _togglePlaceholder:function(value){
            var
               curValue = value || this.getText();
            this.getContainer().toggleClass('controls-RichEditor__empty', (curValue === '' || curValue === undefined || curValue === null) && this._inputControl.html().indexOf('</li>') < 0 && this._inputControl.html().indexOf('<p>&nbsp;') < 0);
         },

         _addToHistory: function(valParam) {
            return $ws.single.UserConfig.setParamValue(this._getNameForHistory(), valParam);
         },

         _getNameForHistory: function() {
            return this.getName().replace('/', '#') + 'ИсторияИзменений';
         },

         _insertImg: function(path, name) {
            var
               self = this,
               img =  $('<img src="' + path + '"></img>').css({
                  visibility: 'hidden',
                  position: 'absolute',
                  bottom: 0,
                  left: 0
               });
            img.on('load', function() {
               var
                  isIEMore8 = $ws._const.browser.isIE && !$ws._const.browser.isIE8,
               // naturalWidth и naturalHeight - html5, работают IE9+
                  imgWidth =  isIEMore8 ? this.naturalWidth : this.width,
                  imgHeight =  isIEMore8 ? this.naturalHeight : this.height,
                  maxSide = imgWidth > imgHeight ? ['width', imgWidth] : ['height' , imgHeight],
                  style = '';
               if (maxSide[1] > constants.maximalPictureSize) {
                  style = ' style="'+ maxSide[0] +': ' + constants.maximalPictureSize + 'px;"';
               }
               if ($ws._const.browser.isIE8) {
                  img.remove();
               }
               self.insertHtml('<img src="' + path + '"' + style + ' alt="' + name + '"></img>');
            });
            if ($ws._const.browser.isIE8) {
               $('body').append(img);
            }
         },

         _onChangeAreaValue: function() {
            if (this._sourceContainerIsActive()) {
               this.setText(this._sourceArea.val());
            }
         },

         /**
          * Создание загрузчика файлов
          * @private
          */
         _createFileLoader: function(){
            var
               self = this,
               imgName,
               cont = $('<div class="ws-field-rich-editor-file-loader"></div>');
            this._container.append(cont);
            this._fileLoader = new FileLoader({
               fileStorage: true,
               extensions: ['image'],
               element: cont,
               dropElement: self._inputControl,
               linkedContext: self.getLinkedContext(),
               handlers: {
                  onLoaded: function(e, json) {
                     if (json.result && json.result.code === 201) {
                        self._insertImg(json.result.filePath, imgName);
                     } else {
                        $ws.helpers.alert(decodeURIComponent(json.result ? json.result.message : json.error ? json.error.message : ''));
                     }
                  },
                  onChange: function(e, filePath) {
                     imgName = filePath.substring(filePath.lastIndexOf('\\') + 1, filePath.length);
                  }
               }
            });
         },

         _getFileLoader: function() {
            if (!this._fileLoader) {
               this._createFileLoader();
            }
            return this._fileLoader;
         },

         /**
          * Проверка активен ли режим кода
          * @private
          */
         _sourceContainerIsActive: function(){
            return !this._sourceContainer.hasClass('ws-hidden');
         },

         _updateHeight: function() {
            var
               curHeight,
               closestParagraph;
            if (this.isVisible()) {
               if (this._tinyEditor && this._tinyEditor.initialized && this._tinyEditor.selection && this._textChanged && (this._inputControl[0] === document.activeElement)) {
                  closestParagraph = $(this._tinyEditor.selection.getNode()).closest('p')[0];
                  if (closestParagraph) {
                     this._scrollToPrev(closestParagraph);//необходимо передавать абзац
                  }
               }
               curHeight = this._container.height();
               if (curHeight !== this._lastHeight) {
                  this._lastHeight = curHeight;
                  this._notifyOnSizeChanged();
               }
            }
         },

         _scrollTo: function(target, side){
            var
               targetOffset = target.getBoundingClientRect(),
               keyboardCoef = (window.innerHeight > window.innerWidth) ? constants.ipadCoefficient[side].vertical : constants.ipadCoefficient[side].horizontal; //Для альбома и портрета коэффициенты разные.

            if ( $ws._const.browser.isMobileIOS && this.isEnabled() && targetOffset[side] > window.innerHeight * keyboardCoef) { //
               target.scrollIntoView(true);
            }
         },
         _scrollToPrev: function(target){
            if (target.previousSibling) {
               this._scrollTo(target.previousSibling, 'bottom');
            }
            this._scrollTo(target, 'bottom');
         },

         _updateDataReview: function(value) {
            if (this._dataReview) {
               this._dataReview.html(this._prepareReviewContent(value));
            }
         },

         _prepareReviewContent: function(value, it) {
            if (value && value[0] !== '<') {
               value = '<p>' + value.replace(/\n/gi, '<br/>') + '</p>';
            }
            value = Sanitize(value);
            return (this._options || it).highlightLinks ? $ws.helpers.wrapURLs($ws.helpers.wrapFiles(value), true) : value;
         },

         //установка значения в редактор
         _drawText: function(text) {
            var
               autoFormat = true;
            text =  this._prepareContent(text);
            if (!this._typeInProcess && text != this._curValue()) {
               //Подготовка значения если пришло не в html формате
               if (text && text[0] !== '<') {
                  text = '<p>' + text.replace(/\n/gi, '<br/>') + '</p>';
                  autoFormat = false;
               }
               text = this._replaceWhitespaces(text);
               if (this.isEnabled() && this._tinyReady.isReady()) {
                  this._tinyEditor.setContent(text, autoFormat ? undefined : {format: 'raw'});
                  this._tinyEditor.undoManager.add();
                  if (this.isActive() && !this._sourceContainerIsActive() && !!text) {
                     this.setCursorToTheEnd();
                  }
               } else {
                  text = text || '';
                  if (this._tinyReady.isReady()) {
                     this._tinyEditor.setContent(text);
                  } else {
                     this._inputControl.html(Sanitize(text));
                  }
               }
            }
         },

         /**
          * Применить формат к выделенному текст
          * @param {string} format  имя формата
          * @param {string} value  значение формата
          * @private
          * функция взята из textColor плагина для tinyMCE:
          * https://github.com/tinymce/tinymce/commit/2adfc8dc5467c4af77ff0e5403d00ae33298ed52
          */
         _applyFormat : function(format, value) {
            this._tinyEditor.focus();
            this._tinyEditor.formatter.apply(format, {value: value});
            this._tinyEditor.nodeChanged();
         },
         /**
          * Убрать формат выделенного текста
          * @param {string} format  имя формата
          * @private
          * функция взята из textColor плагина для tinyMCE:
          * https://github.com/tinymce/tinymce/commit/2adfc8dc5467c4af77ff0e5403d00ae33298ed52
          */
         _removeFormat : function(format) {
            this._tinyEditor.focus();
            this._tinyEditor.formatter.remove(format, {value: null}, null, true);
            this._tinyEditor.nodeChanged();
         },

         _focusOutHandler: function(){
            this.saveToHistory(this.getText());
            RichTextArea.superclass._focusOutHandler.apply(this, arguments);
         },

         _initInputHeight: function(){
            if (!this._options.autoHeight) {
               this._inputControl.css('height',  this._container.height());
            }
         }
      });

      return RichTextArea;
   });