define(
   'js!SBIS3.CONTROLS.FormattedTextBoxBase',
   [
      'js!SBIS3.CONTROLS.TextBoxBase',
      'html!SBIS3.CONTROLS.FormattedTextBoxBase/FormattedTextBoxBase_mask',
      'is!msIe?js!SBIS3.CONTROLS.FormattedTextBoxBase/resources/ext/ierange-m2-min'
   ],
   function (TextBoxBase, maskTemplateFn) {

   'use strict';

      var
      /**
       * Замещает символ в определенном контейнере в определённой позиции
       * @param container контейнер
       * @param position позиция замещаемого символа
       * @param character новый символ
       * @private
       * @author Крайнов Дмитрий Олегович
       */
      _replaceCharacter = function(container, position, character) {
         var buffer = container.nodeValue.split('');
         buffer[position] = character;
         container.nodeValue = buffer.join('');
         this._updateText();
      },
      /**
       * Вычисляет котейнет и позицир и устанавливает курсора в начало
       * @private
       */
      _setHomePosition = function () {
         var group = this.formatModel.model[0];
         _moveCursor(_getContainerByIndex.call(this, (group  &&  group.isGroup) ? 0 : 1), 0);
      },

      /**
       * Вычисляет котейнер и позицию и устанавливает курсора в конец
       * @private
       */
      _setEndPosition = function () {
         var groupInd = this.formatModel.model.length - 1;
         var group = this.formatModel.model[groupInd];
         _moveCursor(_getContainerByIndex.call(this, (group  &&  group.isGroup) ? groupInd : --groupInd), this.formatModel.model[groupInd].mask.length);
      },
      _setPreviousPosition = function () {
         var cursor = _getCursor.call(this, true),
             container = _getContainerByIndex.call(this, cursor[0]),
             prevSibling = container.parentNode.previousSibling,
             position = cursor[1];

         if (position === 0) {
            if (prevSibling && prevSibling.previousSibling) {
               container = prevSibling.previousSibling.childNodes[0];
               position = container.nodeValue.length - 1;
            }
         } else {
            position--;
         }
         _moveCursor(container, position);
      },
      _setNextPosition = function () {
         var cursor = _getCursor.call(this, true),
             container = _getContainerByIndex.call(this, cursor[0]),
             nextSibling = container.parentNode.nextSibling,
             position = cursor[1];

         if (position == container.nodeValue.length) {
            if (nextSibling && nextSibling.nextSibling) {
               container = nextSibling.nextSibling.childNodes[0];
               position = 0;
            }
         } else {
            position++;
         }
         _moveCursor(container, position);
      },
      /**
       * Передвинуть курсор к заданной позиции
       * @param container блок
       * @param position позиция в блоке
       * @private
       */
      _moveCursor = function(container, position) {
         if ($ws._const.browser.isIE  &&  $ws._const.browser.IEVersion < 12) { //в Edge (ie12) не работает createTextRange
            var rng = document.body.createTextRange();
            rng.moveToElementText(container.parentNode);
            rng.move('character', position);
            rng.select();
         } else {
            var selection = window.getSelection();
            //Оборачиваем вызов selection.collapse в try из за нативной баги FireFox(https://bugzilla.mozilla.org/show_bug.cgi?id=773137)
            try {
               selection.collapse(container, position);
            } catch (e) {
            }
         }
      },
      /**
       * Конвертирует символ маски в регулярное выражение для данного символа
       * @param {String} c символ маски
       * @return {String}
       * @private
       */

      _charToRegExp = function(c) {
         var regexp;
         switch(c) {
            case 'd':
               regexp = '[0-9]';
               break;
            case 'L':
            case 'l':
               regexp = '[А-ЯA-Zа-яa-zёЁ]';
               break;
            case 'X':
               regexp = '[A-Za-z0-9]';
               break;
            case 'x':
            default:
               regexp = '[А-ЯA-Zа-яa-z0-9ёЁ]';
               break;
         }
         return regexp;
      },
      /**
       * Получить контейнер по порядковому номеру
       * @param idx
       * @returns {*}
       * @private
       */
      _getContainerByIndex = function(idx) {
         //TODO если в основном шаблоне или шаблоне маски есть пробелы или переносы строк, они собъют этот порядок
         return this._inputField.get(0).childNodes[parseInt(idx, 10)].childNodes[0];
      },

      /**
       * Получить положение курсора
       * @param {Boolean} position Позиция: true — начала, false — конца
       * @returns {Array} Массив положений [номер контейнера, сдвиг]
       * @protected
       */
      _getCursor = function(position) {
         var selection = $ws._const.browser.isIE8 || $ws._const.browser.isIE9 || $ws._const.browser.isIE10 ? window.getSelectionForIE() : window.getSelection();
         if (selection.type !== 'None') {
            selection = selection.getRangeAt(0);
            this._lastSelection = selection;
         } else {
            selection = this._lastSelection || selection;
            if (selection  &&  this.formatModel._options.newContainer) {
               selection.setStart(this.formatModel._options.newContainer, 0);
               selection.setEnd(this.formatModel._options.newContainer, 0);
               this.formatModel._options.newContainer = undefined;
            }
         }

         return (position ?
            _getCursorContainerAndPosition.call(this, selection.startContainer, selection.startOffset) :
            _getCursorContainerAndPosition.call(this, selection.endContainer, selection.endOffset)
         );
      },

      /**
       * Возвращает массив индексов положения курсора
       * @param container
       * @param position
       * @return {Array} Массив [номер группы, номер символа]
       */
       //TODO: Изначально данный метод был полностью скопирован из ws FieldFormatAbstract, затем после рефакторинга
       //из него удалилась одна ветка. Иногда получается так что container приходит не em а conteneditable блок(например
       //после перехода на tab в firefox, скорее всего есть ещё случаи). Выпилинная ветка как раз обробатывала данный случай.
       //Нужно разобраться каким образом в разных браузерах работает window.getSelection() при различных условиях(переход на tab,
       //переход мышью, setActive...) и написать более универсальный метод.
      _getCursorContainerAndPosition = function(container, position) {
         var
            buf,// [Number] индекс контейнера <em> во wrapper'е
            isSepCont,// [Number] является ли контейнер разделителем (1) или вводимым блоком (0)
            cnt,// [Number] если контейнер - разделитель, то возвращается положение следующего контейнера
            pos = position,// [Number] если контейнер - разделитель, то возвращается начальная позиция курсора в контейнере
            sepFirst = !this.formatModel.model[0].isGroup,
            input = this._inputField.get(0);// поле ввода
         if (container.parentNode.childNodes.length > 1) {
            for (var i = 0; i < container.parentNode.childNodes.length; i++){
               if (container == container.parentNode.childNodes[i]){
                  pos = (i + sepFirst) % 2 ? 0 : i ? container.firstChild.length : position ? container.firstChild.length : position;
                  cnt = (i + sepFirst) % 2 ? i + 1 : i;
                  buf = container.parentNode.childNodes[cnt];
                  if (pos >= (buf.firstChild && buf.firstChild.length || 0)) {
                     pos = buf.nextSibling ? 0 : pos;
                     cnt = buf.nextSibling ? cnt + 2 : cnt;
                  }
               }
            }
         } else {
            buf = $(container.parentNode).index();
            isSepCont = (buf + !this.formatModel.model[0].isGroup) % 2;
            cnt = isSepCont ? buf + 1 : buf;
            pos = isSepCont ? 0 : position;
            // если контейнер - разделитель и он последний
            if (cnt >= input.childNodes.length) {
               cnt -= 2;
               pos = input.childNodes[cnt].childNodes[0].length;
            }
         }
         if (container === input){
            cnt = position ? position - 1 : 0;
            pos = position ? input.childNodes[cnt].childNodes[0].length : 0;
            return _getCursorContainerAndPosition.call(this, input.childNodes[cnt].childNodes[0], pos); // Вызывемся ещё раз с уточнёнными параметрами
         }
         return [cnt, pos];
      };

   /**
    * Класс для модели форматного поля
    */
   var FormatModel = $ws.core.extend({}, /** @lends $ws.proto.FormatModel.prototype */{
      $protected: {
         _options: {
            /* позиция курсора: храним индекс группы в модели + позцию символа в ней. */
            cursorPosition: {
               group: 0,
               position: 0
            }
         },
         //хранит текст, который прилетел через setText
         _settedText: '',
         /* модель хранит объекты разделителей и групп, порядок совпадает с порядком в маске */
         model: []
      },

      $constructor: function () {
         this.setMask(this._options.mask);
      },
      /**
       * Задать маску и создать модель
       * @param strMask маска, например '+++LLLlll///ddd---ddddddd===xxx' или 'HH:MM'
       */
      setMask: function(strMask) {
         var group = [],
            groupInner = [],
            separator = [],
            groupCharactersRegExp = /[LldxX]/,
            maskChar,
            innerChar;

         this.model = [];
         for (var i = 0; i < strMask.length; i++) {
            maskChar = strMask.charAt(i);
            //заменяем символы маски на внутренние, например HH:MM на dd:dd
            innerChar = maskChar;
            if (innerChar in this._options.controlCharactersSet) {
               innerChar = this._options.controlCharactersSet[maskChar];
            }
            if (groupCharactersRegExp.test(innerChar)) {
               if (separator.length) {
                  this._addItem(false, separator.join(''));
                  separator = [];
               }
               group.push(maskChar);
               groupInner.push(innerChar);
            } else {
               if (group.length) {
                  this._addItem(true, group.join(''), groupInner.join(''));
                  group = [];
                  groupInner = [];
               }
               separator.push(maskChar);
            }
         }
         if (group.length) {
            this._addItem(true, group.join(''), groupInner.join(''));
         }
         if (separator.length) {
            this._addItem(false, separator.join(''));
         }
         return this;
      },

      /**
       * Добавляет группу или разделитель в модель
       * @param isGroup true - элемент является группой, false - разделитель
       * @param mask первичная маска, например HH
       * @param innerMask внутренняя маска, например dd. Используем только для групп
       * @returns {boolean}
       * @private
       */
      _addItem: function(isGroup, mask, innerMask) {
         if ( !mask) {
            return false;
         }
         if ( ! this.model) {
            this.model = [];
         }
         var item = {
            isGroup: isGroup,
            mask: mask,
            innerMask: (isGroup) ? innerMask : mask,
            //символы хранятся в массиве, чтобы позволить вводить символы произвольно и разделять где символ не введён
            value: (isGroup) ? [] : mask.split('')
         };

         this.model.push(item);
         return true;
      },
      /**
       * Маска с управляющими символами строкой, например 'Lddd=xx'
       * @param clearChar опционально символ замены управляющих символов, можно использовать для получения чистой маски
       * вида '__:__'
       * @returns {string}
       */
      getStrMask: function(clearChar) {
         var strMask = '';
         for (var i = 0; i < this.model.length; i++) {
            strMask += (clearChar  &&  this.model[i].isGroup) ? this.model[i].innerMask.replace(/./ig, clearChar) : this.model[i].innerMask;
         }

         return strMask;
      },
      /**
       * Задать положение курсора
       * @param groupNum индекс группы относительно других групп и разделителей
       * @param position позиция в группе
       * @returns {boolean} true если курсор установлен
       */
      setCursor: function(groupNum, position) {
         var insertInfo;
         if ( !this.model  ||  this.model.length === 0) {
            throw new Error('setCursor. Не задана модель');
         }
         insertInfo = this._calcPosition(groupNum, position);
         if (!insertInfo) {
            return false;
         }
         this._options.cursorPosition.group = insertInfo.groupNum;
         this._options.cursorPosition.position = insertInfo.position;

         return true;
      },
      /**
       * Проверяет подходит ли символ группе в заданной позиции
       * @param group
       * @param position
       * @param character символ, проверяемый на возможность вставки
       * @returns возвращает символ, с учетом корректировки регистра, если символ можно вставить, либо false если нельзя
       */
      charIsFitToGroup: function (group, position, character) {
         var maskChar,
            regExpChar;
         if ( !group  ||  position > group.mask.length  ||  character === '') {
            return false;
         }
         //маска для позиции
         maskChar = group.innerMask.charAt(position);
         if (group.isGroup) {
            //получить регулярное выражение для проверки
            regExpChar = new RegExp(_charToRegExp(maskChar));
            //соответствует ли символ регулярному выражению
            if (!regExpChar.test(character)) {
               return false;
            }
            character = (maskChar == 'L') ? character.toUpperCase() : character;
            character = (maskChar == 'l') ? character.toLowerCase() : character;
         } else {
            character = (character == maskChar) ? character : false;
         }

         return character;
      },
      /* вычисляет позицию для курсора, если курсор стоит в конце группы, пробует поставить курсор в следующуюу группу */
      _calcPosition: function(groupNum, position) {
         var group;
         group = this.model[groupNum];
         if ( !group  ||  !group.isGroup) {
            return false;
         }
         //вставка символа в конце группы
         if (group.mask.length <= position) {
            //ищем следующую группу
            groupNum += 2;
            group = this.model[groupNum];
            if (!group) {
               return false;
            }
            position = 0;
         }
         //вставка в предыдущую группу
         if (position == -1) {
            groupNum -= 2;
            group = this.model[groupNum];
            if (!group) {
               return false;
            }
            position = group.mask.length - 1;
         }
         return {
            group: group,
            groupNum: groupNum,
            position: position
         };
      },
      /**
       * Вставляет символ в заданную группу и позицию, если это возможно
       * @param groupNum индекс группы относительно других групп и разделителей
       * @param position позиция в группе
       * @param character вставляемый символ
       * @param isClear если true, то символ подставляется без учёта маски
       * @returns {object|boolean} если втавка прошла успешно, возвращает объект с информацией о вставке
       */
      insertCharacter: function(groupNum, position, character, isClear) {
         var group,
             insertInfo;

         if ( !this.model  ||  this.model.length === 0) {
            throw new Error('insertCharacter. Не задана модель');
         }
         insertInfo = this._calcPosition(groupNum, position);
         if (!insertInfo) {
            return false;
         }
         group = insertInfo.group;
         if (isClear) {
            group.value[insertInfo.position] = undefined;
         } else {
            character = this.charIsFitToGroup(group, insertInfo.position, character);
            if (character) {
               group.value[insertInfo.position] = character;
            } else {
               return false;
            }
         }

         insertInfo.character = character;
         //задать курсор
         this._options.cursorPosition.group = insertInfo.groupNum;
         this._options.cursorPosition.position = insertInfo.position + 1;

         return insertInfo;
      },

      /**
       * Заполнена ли модель полностью
       * @returns {boolean} true если все позиции заполнены, false в противном случае
       */
      isFilled: function() {
         var isFilled = true,
             group;
         for (var i = 0; i < this.model.length; i++) {
            group = this.model[i];
            if (group.isGroup) {
               for (var j = 0; j < group.mask.length; j++) {
                  if (typeof group.value[j] === 'undefined') {
                     isFilled = false;
                     break;
                  }
               }
               if ( ! isFilled) {
                  break;
               }
            }
         }
         return isFilled;
      },

      /**
       * Модель полностью не заполнена
       * @returns {boolean} true если ни одной позиции не заполнено, false в противном случае
       */
      isEmpty: function(maskReplacer) {
         return this.getStrMask(maskReplacer) === this.getText(maskReplacer);
      },
      /**
       * Проверяет подходит ли текст маске модели. Например, маске 'HH:MM' подходит текст '12:34'
       * @param text строка, например '23:37'. Можно использовать символ заполнитель, например '_3:37'
       * @param clearChar символ-заполнитель, например '_'.
       * @returns {Array|boolean} если текст проходит проверку, вернёт массив обработанных значений, если нет - false
       */
      textIsFitToModel: function(text, clearChar) {
         var
            /*массив со значениями, нужен чтобы не записывать значения до полной проверки соответствия текста маске */
            tempModelValues = [],
            curIndex = 0,
            group,
            value,
            character;
         for (var i = 0; i < this.model.length; i++) {
            group = this.model[i];
            value = [];
            for (var j = 0; j < group.innerMask.length; j++) {
               character = text.charAt(curIndex);
               character = (character == clearChar) ? undefined : this.charIsFitToGroup(group, j, character);
               if (character || (typeof character === 'undefined')) {
                  value.push(character);
               } else {
                  return false;
               }
               curIndex++;
            }
            tempModelValues.push(value);
         }
         if (curIndex != text.length) {
            return false; //текст длиннее маски
         }

         return tempModelValues;
      },
      /**
       * Записать текст в модель
       * @param text строка, например '23:37'. Можно использовать символ заполнитель, например '_3:37'
       * @param clearChar символ-заполнитель, например '_'
       * @returns {boolean} true - если строка установлена
       */
      setText: function(text, clearChar) {
         // TODO запоминаем что изначально пришло, чтобы можно было null обработать (из контекста), но при этом выводить незаполненное поле
         //      надо как-то иначе это обработать
         this._settedText = text;
         if (text === '' || text === null || typeof text === "undefined") {
            text = this.getStrMask(clearChar);
         }
         /*массив со значениями, нужен чтобы не записывать значения до полной проверки соответствия текста маске */
         var tempModelValues = this.textIsFitToModel(text, clearChar),
             group;
         if ( !tempModelValues)   {
            return false;
         }
         //записываем проверенные данные
         for (var i = 0; i < this.model.length; i++) {
            group = this.model[i];
            if (group.isGroup) {
               group.value = tempModelValues[i];
            }
         }

         return true;
      },

      /**
       * Получить полный текст, например '23:3_'
       * @param clearChar - символ заменяющий не заданные символы, например '_'
       * @returns {string} текст модели с введенными символами
       */
      getText: function(clearChar) {
         var text = '',
             group;
         for (var i = 0; i < this.model.length; i++) {
            group = this.model[i];
            if (group.isGroup) {
               for (var j = 0; j < group.mask.length; j++) {
                  text += (typeof group.value[j] === 'undefined') ? clearChar : group.value[j];
               }
            } else {
               text += group.innerMask;
            }
         }
         return text;
      }
   });

   /**
    * Абстрактный класс для контролов, в которых необходим ввод особого формата (телефон, дата, время и дригие).
    * В конечный контрол передается маска с помощью опции mask - будет разрешён ввод данных в контрол строго по маске.
    * Условные обозначения основных управляющих символов:
    * <ol>
    *    <li>d - цифра.</li>
    *    <li>L - заглавная буква.</li>
    *    <li>l - строчная буква.</li>
    *    <li>x - буква или цифра.</li>
    *    <li>"/", "-", ":", " ", "." - разделители.</li>
    * </ol>
    * @class SBIS3.CONTROLS.FormattedTextBoxBase
    * @extends SBIS3.CONTROLS.TextBoxBase
    * @public
    * @author Крайнов Дмитрий Олегович
    */

   var FormattedTextBoxBase = TextBoxBase.extend(/** @lends SBIS3.CONTROLS.FormattedTextBoxBase.prototype */ {
       /**
        * @event onInputFinished По окончании ввода
        * @param {$ws.proto.EventObject} eventObject Дескриптор события.
        * @example
        * По завершению ввода добавим в конец маски группу из 3 цифр
        * <pre>
        *     formattedTextBox.setMask('dd(dd)');
        *     var maskReplacer = '_';
        *     var onInputFinishedFn = function() {
        *        var text = formattedTextBox.formatModel.getText(maskReplacer);
        *        if (text.length == 6) {
        *           formattedTextBox.setMask('dd(dd)ddd');
        *           //новый текст должен точно совпадать с маской, поэтому добавляем к нему символы маски
        *           formattedTextBox.setText(text+'___');
        *           formattedTextBox.setCursor(4,0);
        *        }
        *     }
        *     formattedTextBox.subscribe('onInputFinished', onInputFinishedFn);
        * </pre>
        * @see setMask
        * @see onInputFinished
        * @see setCursor
        * @see setText
        */
      $protected: {
         /**
          * Html-элемент, в который будет добавлена динамически создаваемая, в зависимости от маски, html-разметка
          */
         _inputField: null,
         /**
          * Символ-заполнитель, на который замещаются все управляющие символы в маске для последующего отображения на
          * странице. В маске изначально не должны присутствовать символы-заполнители. По умолчанию используется знак
          * нижнего подчёркивания.
          * !Важно: нельзя использовать знак вопроса.
          */
         _maskReplacer: '_',
         /**
          * Набор допустимых управляющих символов в маске. Задаются отдельно в каждом контроле в зависимости от контекста.
          * Пример:
          *       Для контролла DatePicker это: Y(год), M(месяц), D(день), H(час), I(минута), S(секунда), U(доля секунды).
          * Каждому допустимому символу ставится в соответствие основной управляющий символ, в зависимости от которого
          * определяется, какой тип символа может вводиться.
          * Условные обозначения основных управляющих символов:
          *     1. d - Цифра
          *     2. L - Заглавная буква
          *     3. l - Строчная буква
          *     4. x - Буква или цифра
          * Если допустимые управляющие символы не заданы, используются основные управляющие символы.
          * Сами управляющие символы используются для задании маски при создании контролла в опции mask.
          * Любой символ, не являющийся управляющим трактуется как разделитель.
          * Набор указывается строго символ к символу. Пример:
          *       Для контролла DatePicker
          *             _controlCharactersSet: {
          *                   'Y' : 'd',
          *                   'M' : 'd',
          *                   'D' : 'd',
          *                   'H' : 'd',
          *                   'I' : 'd',
          *                   'H' : 'd',
          *                   'U' : 'd'
          *             }
          */
         _controlCharactersSet: {
            'd': 'd',
            'L': 'L',
            'l': 'l',
            'X': 'X',
            'x': 'x'
         },
         /**
          * Допустимые при создании контролла маски.
          */
         _possibleMasks: null,
         /**
          * Опции создаваемого контролла
          */
         _options: {
            // ! в файле маски (FormattedTextBoxBase_mask.xhtml) не оставлять пробелы и переносы строк
            maskTemplateFn: maskTemplateFn,
            //упрощенная модель для вставки в xhtml-шаблон
            modelForMaskTpl: []
         },
         /**
          * Модель форматного поля
          */
         formatModel: {
         }
      },

      $constructor: function () {
         var self = this;
         this._publish('onInputFinished','onTextChange');
         // Проверяем, является ли маска, с которой создается контролл, допустимой
         this._checkPossibleMask();
         this._inputField = $('.js-controls-FormattedTextBox__field', this.getContainer().get(0));
         this._container.bind('focusin', function () {
            self._focusHandler();
         });
         this._inputField.keyup(function (event) {
            event.preventDefault();
         });
         this._inputField.bind('dragstart', function(e) {
            e.preventDefault();
         });
         //keypress учитывает расскладку, keydown - нет
         this._inputField.keypress(function (event) {
            if (!self._isFirefoxKeypressBug(event)) {
               self._keyPressBind(event);
            }
         });
         //keydown ловит управляющие символы, keypress - нет
         this._inputField.keydown(function(event){
            /*У некоторых android'ов спецефичная логика обработки клавишь:
             1) Не стреляет событие keypress
             2) Событие keydown стреляет послое вставки символа
             3) Из события не возможно понять какая клавиша была нажата, т.к. возвращается keyCode = 229 || 0
             Для таких андроидов обрабатываем ввод символа отдельно
             */
            if ($ws._const.browser.isMobileAndroid && (event.keyCode === 229 || event.keyCode === 0)){
               setTimeout(self._keyDownBindAndroid.bind(self, event), 0);
            }
            else{
               self._keyDownBind(event);
            }
         });
         this._inputField.bind('paste', function(e) {
            var
                //Единственный способ понять, что мы пытаемся вставить это посмотреть в буфере.
                //Берём из буфера только текст, так-как возможно там присутствует и разметка, которая нас не интересует.
                pasteValue = e.originalEvent.clipboardData ? e.originalEvent.clipboardData.getData('text') : window.clipboardData.getData('text');
            //Пропустим вставляемый текст через модель. Если setText модели вернет true - значит
            //вставляемый текст соответствует маске и мы его можем проставить в значение текстового поля
            if (self.formatModel.setText(pasteValue, self._maskReplacer)) {
               self.setText(self.formatModel.getText(self._maskReplacer));
            }
            e.preventDefault();
         });
         this._chromeCaretBugFix();
      },
      //FF зачем то кидает событие keypress для управляющих символов(charCode === 0), в отличии от всех остальных браузеров.
      //Просто проигнорируем это событие, т.к. управляющая клавиша уже обработана в keydown. Так же отдельно обработаем
      //ctrl+A, т.к. для этой комбинации keypress так же вызываться не должен.
      _isFirefoxKeypressBug: function(event) {
         return $ws._const.browser.firefox && (event.charCode === 0 || event.ctrlKey && event.charCode === 97);
      },
      //В Chrome при уходе фокуса из поля ввода, если фокус ушёл с помощью jQuery focus, то каретка остаётся в поле ввода,
      //при этом при вводе, события клавиатуры на поле ввода не генерируются, и символы вставляются несмотря на маску.
      //В таком случае сами уберём каретку из поля ввода.
      _chromeCaretBugFix: function() {
         if ($ws._const.browser.chrome) {
            this._inputField.bind('blur', function () {
               window.getSelection().removeAllRanges();
            });
         }
      },

      init: function(){
         FormattedTextBoxBase.superclass.init.apply(this, arguments);
         this._updateText();
      },

      //Тут обрабатываются управляющие команды
      _keyDownBind: function(event) {
         var
             isCtrl = event.ctrlKey,
             isShift = event.shiftKey,
             key = event.which || event.keyCode;

         if (key == $ws._const.key.home && !isShift) {
            _setHomePosition.call(this);
         } else if (key == $ws._const.key.end && !isShift) {
            _setEndPosition.call(this);
         } else if (key == $ws._const.key.left && !isShift) {
            _setPreviousPosition.call(this);
         } else if (key == $ws._const.key.right && !isShift) {
            _setNextPosition.call(this);
         } else if (key == $ws._const.key.del) {
            this._clearCommandHandler('delete');
         } else if (key == $ws._const.key.backspace) {
            this._clearCommandHandler('backspace');
         } else if (key == 88 && isCtrl) {
            //предотвращаем вырезание Ctrl+X
         } else {
            return;
         }
         event.preventDefault();
      },
       //Тут обрабатываются текстовые символы
      _keyPressBind: function(event) {
         var key = event.which || event.keyCode,
             character = String.fromCharCode(key),
             positionIndexes = _getCursor.call(this, true),
             position = positionIndexes[1],
             groupNum = positionIndexes[0];

         this._keyPressBindHandler(event, character, position, groupNum);
      },

      _keyPressBindHandler: function(event, character, position, groupNum){
         var keyInsertInfo;

         //TODO сбрасываем, чтобы после setText(null) _updateText после ввода символов обновлял опцию text
         this.formatModel._settedText = '';

         character = event.shiftKey ? character.toUpperCase() : character.toLowerCase();
         keyInsertInfo = this.formatModel.insertCharacter(groupNum, position, character);
         this._afterCharacterInsertHandler(keyInsertInfo);

         event.preventDefault();
      },

      _keyDownBindAndroid: function(event){
         var textDiff = this._getTextDiff(),
             character = textDiff['char'],
             position = textDiff.position,
             groupNum = _getCursor.call(this, true)[0];
         this._setText(this._options.text);

         this._keyPressBindHandler(event, character, position, groupNum);
         event.preventDefault();
      },

      _getTextDiff: function(){
         var oldText = this._options.text.split(':'),
             newText = this._inputField.text().split(':');
         for (var i = 0, l = newText.length; i < l; i++) {
            if (oldText[i].length !== newText[i].length){
               for (var j = 0; j < newText[i].length; j++){
                  if (oldText[i][j] !== newText[i][j]){
                     return {
                        'char': newText[i][j],
                        position: j
                     }
                  }
               }
            }
         }
         return false;
      },

      _clearCommandHandler: function(type) {
         var
             positionIndexesBegin = _getCursor.call(this, true),
             positionIndexesEnd = _getCursor.call(this, false),
             position = positionIndexesBegin[1],
             groupNum = positionIndexesBegin[0],
             group = null,
             startGroupNum = null,
             endGroupNum = null,
             positionOffset = (type == 'backspace') ? -1 : 0,
             keyInsertInfo;

         //TODO сбрасываем, чтобы после setText(null) _updateText после ввода символов обновлял опцию text
         this.formatModel._settedText = '';

         //Если в поле ввода выделен текст
         if (positionIndexesBegin[0] != positionIndexesEnd[0] || positionIndexesBegin[1] != positionIndexesEnd[1]) {
            //проходим группы с конца, чтобы закончить самым левым символом выделенного текста и использовать его данные в keyInsertInfo о позиции курсора
            startGroupNum = positionIndexesBegin[0];
            endGroupNum   = positionIndexesEnd[0];
            for (var i = endGroupNum; i >= startGroupNum; i--) {
               group = this.formatModel.model[i];
               //проходим только группы, т.к. разделители не интересуют
               if ( ! group.isGroup) {
                  continue;
               }
               /* средняя группа - значение по умолчанию.
                Средняя для выбора например мы выделили такой текст: 11)222-34 из текста 8 (111)222-34-56.
                Средняя здесь это не начальная и не конечная группа выделения, т.е. 222, 111 - начальная, а 34 - конечная
                */
               var startCharNum = 0,
                   endCharNum = group.mask.length - 1;
               //последняя группа выделенного текста
               if (i == endGroupNum) {
                  endCharNum = positionIndexesEnd[1] - 1;
               }
               //первая группа выделенного текста
               if (i == startGroupNum) {
                  startCharNum = positionIndexesBegin[1];
               }
               for (var j = endCharNum; j >= startCharNum; j--) {
                  keyInsertInfo = this.formatModel.insertCharacter(i, j, this._maskReplacer, true);
               }
            }
            //модель обновили - обновляем опцию text и html-отображение
            this._updateText();
            this._inputField.html(this._getHtmlMask());
         } else {
            keyInsertInfo = this.formatModel.insertCharacter(groupNum, position + positionOffset, this._maskReplacer, true);
         }
         this._afterCharacterInsertHandler(keyInsertInfo, positionOffset);
      },

      _afterCharacterInsertHandler: function(keyInsertInfo, positionOffset) {
         var
             position,
             container,
             lastGroupNum;
         if (keyInsertInfo) {
            container = _getContainerByIndex.call(this, keyInsertInfo.groupNum);
            //записываем символ в html
            _replaceCharacter.call(this, container, keyInsertInfo.position, keyInsertInfo.character);
            position = this.formatModel._options.cursorPosition.position + (positionOffset || 0);
            //проверяем был ли введен последний символ в последней группе
            lastGroupNum = this.formatModel.model.length - 1;
            lastGroupNum = this.formatModel.model[lastGroupNum].isGroup ? lastGroupNum : lastGroupNum - 1;
            //Заново ищем контейнер группы, т.к. после замены символа, снаружи значение текста может быть изменено(например setText)
            //и html будет полность изменён, а в переменной container лежит элемент, которого в DOM уже нет, и курсор не сможет верно спозиционироваться
            _moveCursor(_getContainerByIndex.call(this, keyInsertInfo.groupNum), position);
            //Если positionOffset = -1, это значит был нажат backspace, и onInputFinished в таком случае стрелять не надо
            if (positionOffset !== -1 && keyInsertInfo.groupNum == lastGroupNum  &&  keyInsertInfo.position == this.formatModel.model[lastGroupNum].mask.length - 1) {
               this._notify('onInputFinished');
            }
         }
      },

      /* Переопределяем метод SBIS3.CORE.CompoundActiveFixMixin чтобы при клике нормально фокус ставился
       */
      _getElementToFocus: function() {
         return this._inputField;
      },

      /**
       * Изменяем опции до отрисовки
       */
      _modifyOptions: function(options) {
         //_modifyOptions вызывается дважды, в первом вызове следующие переменные не определены
         //TODO в Control.module.js _modifyOptions первый раз вызывается на разметке, без нужного контекста
         if ( !this._controlCharactersSet  ||  !this._maskReplacer  ||  !options.mask) {
            return options;
         }
         this.formatModel = new FormatModel({controlCharactersSet: this._controlCharactersSet, mask: options.mask});
         if (options.text) {
            this.formatModel.setText(options.text, this._maskReplacer);
         }
         //записываем модель для шаблона
         options.modelForMaskTpl = this._getItemsForTemplate();
         return options;
      },
      /**
       * Обновляяет значение this._options.text
       * @protected
       */
      _updateText:function() {
         //TODO неодинаковое поведение получается для разного text. Но нельзя this._options.text не обновлять, т.к. его getText() использует
         this._updateTextFromModel();
         this._notifyOnTextChange();
      },

      _updateTextFromModel: function() {
         this._options.text = (this.formatModel._settedText !== null && typeof this.formatModel._settedText !== "undefined") ? this.formatModel.getText(this._maskReplacer) : this.formatModel._settedText;
      },

      _notifyOnTextChange: function() {
         this._notify('onTextChange', this._options.text);
         this._notifyOnPropertyChanged('text');
      },

      /**
       * Получить текущую используемую маску.
       * @private
       */
      _getMask: function() {
         return this._options.mask;
      },

      /**
       * Проверить, является ли маска допустимой ( по массиву допустимых маск this._possibleMasks )
       * @private
       */
      _checkPossibleMask: function(){
         if (this._possibleMasks && this._options.mask && Array.indexOf(this._possibleMasks, this._options.mask) == -1){
            throw new Error('_checkPossibleMask. Маска не удовлетворяет ни одной допустимой маске данного контролла');
         }
      },

      _getItemsForTemplate: function() {
         var value;

         if ( !this.formatModel || !this.formatModel.model) {
            return [];
         }
         var model = this.formatModel.model;
         var items = [];
         for (var i = 0; i < model.length; i++) {
            value = '';
            for (var j = 0; j < model[i].mask.length; j++) {
               value += (typeof model[i].value[j] === 'undefined') ? this._maskReplacer : model[i].value[j];
            }
            items.push({isGroup: model[i].isGroup, text: value});
         }
         return items;
      },
      /**
       * Возвращает html-разметку для заданной маски
       * @returns {string} html-разметка
       * @private
       */
      _getHtmlMask: function() {
         //передать в шаблон
         return maskTemplateFn(this._getItemsForTemplate());
      },

      /**
       * Обработка события фокусировки на элементе
       * TODO пока работает только в IE8+ и FireFox
       * @private
       */
      _focusHandler: function() {
         var
            child = !this.formatModel.model[0].isGroup ? 1 : 0,
            startContainer = this._inputField.get(0).childNodes[child].childNodes[0],
            startPosition = 0;
         _moveCursor(startContainer, startPosition);
      },

      _setEnabled: function(enabled) {
         FormattedTextBoxBase.superclass._setEnabled.call(this, enabled);
         this._inputField.attr('contenteditable', !!enabled);
      },

      /**
       * Установка курсора в заданную позицию
       * @remark
       * Задание положения курсора может требоваться при динамической смене маски, например, по мере ввода значений.
       * В остальных случаях управлять положением курсора не требуется.
       * @param {Number} groupNum Номер контейнера.
       * @param {Number} position Позиция в контейнере.
       * @returns {Boolean} Положение курсора.
       * @example
       * По завершению ввода добавим в конец маски группу из 3 цифр
       * <pre>
       *     formattedTextBox.setMask('dd(dd)');
       *     var maskReplacer = '_';
       *     var onInputFinishedFn = function() {
       *        var text = formattedTextBox.formatModel.getText(maskReplacer);
       *        if (text.length == 6) {
       *           formattedTextBox.setMask('dd(dd)ddd');
       *           //новый текст должен точно совпадать с маской, поэтому добавляем к нему символы маски
       *           formattedTextBox.setText(text+'___');
       *           formattedTextBox.setCursor(4,0);
       *        }
       *     }
       *     formattedTextBox.subscribe('onInputFinished', onInputFinishedFn);
       * </pre>
       * @see setMask
       * @see onInputFinished
       */
      setCursor: function(groupNum, position) {
         if (!this.formatModel.setCursor(groupNum, position)) {
            return false;
         }
         this.formatModel._options.newContainer = _getContainerByIndex.call(this, this.formatModel._options.cursorPosition.group);
         this.formatModel._options.newPosition = this.formatModel._options.cursorPosition.position;
      },
      /**
       * Установить значение в поле.
       * @remark
       * Значение вводится в точности с маской, включая разделяющие символы.
       * При передаче строки, не соответствующей маске, значение не проставится.
       * Например, при маске '+d (ddd) ddd - dd - dd' в передаваемом значении нужно не забыть проставить пробелы.
       * @param {String} text Строка нового значения.
       * @protected
       * @example
       * <pre>
       *     //если маска 'd(ddd)ddd-dd-dd', то следует задать значение вида
       *     this.setText('8(111)888-11-88');
       * </pre>
       * @see setMask
       * @see onInputFinished
       * @see setCursor
       */
      setText: function(text) {
         this._setText(text);
      },
      _setText: function(text){
         this.formatModel.setText(text, this._maskReplacer);
         this._updateText();
         this._textChanged = true;
         //обновить html
         this._inputField.html(this._getHtmlMask());
      },
      /**
       * Задает маску в модель и обновляет html.
       * @param {String} mask Маска строкой, например 'dd:dd', 'HH:MM'
       * @example
       * Зададим маску для паспорта
       * <pre>
       *     formattedTextBox.setMask('dd dd dddddd');
       * </pre>
       * @see setText
       * @see setCursor
       */
      setMask: function(mask) {
         var self = this;
         this._options.mask = mask;
         this.formatModel.setMask(mask);
         this._inputField.html(this._getHtmlMask());
         //TODO исправить выставление курсора
         setTimeout(function() {
            //Если контрол не сфокусирован, и мы вызываем нажатие alt, то
            //вывалится ошибка при вызове getSelection, ловим ее здесь.
            try {
               self._keyPressHandler(18);
            } catch(ex) {
               $ws.single.ioc.resolve('ILogger').log('FormattedTextBox', ex.message);
            }
         }, 0);
      }

   });

   return FormattedTextBoxBase;
});